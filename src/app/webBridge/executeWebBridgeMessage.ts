import {executeHomeAction} from '../homeActions';
import type {HomeAction} from '../config/types';
import {requiredFeatureForDestination} from '../config/featureAvailability';
import type {WebBridgeDependencies, WebBridgeMessage, WebBridgeResult} from './types';

const safeMessages: Record<string, string> = {
  LINK_UNAVAILABLE: 'The requested link is unavailable.',
  INVALID_DESTINATION: 'The requested destination is unavailable.',
  FEATURE_DISABLED: 'This feature is unavailable.',
  NOTIFICATIONS_UNAVAILABLE: 'Notifications are unavailable.',
  SHARE_UNAVAILABLE: 'Sharing is unavailable.',
  EXECUTION_FAILED: 'The requested action could not be completed.',
};

function result(message: WebBridgeMessage, status: 'unsupported' | 'failed', code: string): WebBridgeResult {
  return {status, requestId: message.id, code, message: safeMessages[code] ?? 'The requested action could not be completed.'};
}

async function executeHomeEquivalent(action: HomeAction, message: WebBridgeMessage, dependencies: WebBridgeDependencies): Promise<WebBridgeResult> {
  const actionResult = await executeHomeAction(action, {
    config: dependencies.config,
    linking: dependencies.linking,
    navigate: {
      openWebContent: () => undefined,
      openNativeScreen: destination => dependencies.navigation.openNative(destination),
    },
  });
  if (actionResult.status === 'success') return {status: 'success', requestId: message.id};
  return result(message, actionResult.status, action.type === 'nativeScreen' ? 'INVALID_DESTINATION' : 'LINK_UNAVAILABLE');
}

export async function executeWebBridgeMessage(message: WebBridgeMessage, dependencies: WebBridgeDependencies): Promise<WebBridgeResult> {
  const {features} = dependencies.config;
  if (!features.webContent) return result(message, 'unsupported', 'FEATURE_DISABLED');
  try {
    switch (message.type) {
      case 'openPhone':
        if (!features.contact) return result(message, 'unsupported', 'FEATURE_DISABLED');
        return executeHomeEquivalent({id: 'bridge', title: 'Phone', icon: 'phone', type: 'phone', phoneNumber: message.phoneNumber}, message, dependencies);
      case 'openEmail':
        if (!features.contact) return result(message, 'unsupported', 'FEATURE_DISABLED');
        return executeHomeEquivalent({id: 'bridge', title: 'Email', icon: 'email', type: 'email', emailAddress: message.emailAddress, subject: message.subject, body: message.body}, message, dependencies);
      case 'openMap':
        if (!features.location) return result(message, 'unsupported', 'FEATURE_DISABLED');
        return executeHomeEquivalent({id: 'bridge', title: 'Map', icon: 'explore', type: 'maps', mapUrl: message.mapUrl, address: message.address}, message, dependencies);
      case 'openExternal':
        return executeHomeEquivalent({id: 'bridge', title: 'External link', icon: 'open-in-new', type: 'externalUrl', url: message.url}, message, dependencies);
      case 'openNative':
        if (!features[requiredFeatureForDestination(message.destination)]) return result(message, 'unsupported', 'INVALID_DESTINATION');
        return executeHomeEquivalent({id: 'bridge', title: 'Native screen', icon: 'settings', type: 'nativeScreen', screen: message.destination}, message, dependencies);
      case 'share':
        if (!features.sharing) return result(message, 'unsupported', 'FEATURE_DISABLED');
        await dependencies.sharing.share(message);
        return {status: 'success', requestId: message.id};
      case 'identifyNotificationUser':
        if (!features.notifications || !dependencies.notifications.enabled || !dependencies.notifications.initialized) return result(message, 'unsupported', 'NOTIFICATIONS_UNAVAILABLE');
        dependencies.notifications.identify(message.externalId);
        return {status: 'success', requestId: message.id};
      case 'clearNotificationUser':
        if (!features.notifications || !dependencies.notifications.enabled || !dependencies.notifications.initialized) return result(message, 'unsupported', 'NOTIFICATIONS_UNAVAILABLE');
        dependencies.notifications.clear();
        return {status: 'success', requestId: message.id};
    }
  } catch {
    return result(message, 'failed', message.type === 'share' ? 'SHARE_UNAVAILABLE' : 'EXECUTION_FAILED');
  }
}
