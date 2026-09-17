import {buildClientUrl, isAllowedClientUrl} from '../config/url';
import {requiredFeatureForDestination} from '../config/featureAvailability';
import type {NotificationPayload, NotificationRouteDependencies, NotificationRouteResult} from './types';

export async function routeNotification(payload: NotificationPayload, dependencies: NotificationRouteDependencies): Promise<NotificationRouteResult> {
  if (!dependencies.config.features.notifications) return {status: 'ignored', reason: 'notifications-disabled'};
  try {
    switch (payload.type) {
      case 'home': dependencies.navigation.openHome(); return {status: 'handled'};
      case 'openNative':
        if (!dependencies.config.features[requiredFeatureForDestination(payload.destination)]) return {status: 'ignored', reason: 'destination-disabled'};
        dependencies.navigation.openNative(payload.destination); return {status: 'handled'};
      case 'openWeb': {
        if (!dependencies.config.features.webContent) return {status: 'ignored', reason: 'destination-disabled'};
        const url = buildClientUrl(dependencies.config.website.baseUrl, payload.route);
        if (!isAllowedClientUrl(url, dependencies.config.website.allowedDomains)) return {status: 'ignored', reason: 'disallowed-client-url'};
        dependencies.navigation.openWebContent(url, payload.title);
        return {status: 'handled'};
      }
      case 'openExternal':
        if (!(await dependencies.linking.canOpenUrl(payload.url))) return {status: 'failed', message: 'This link could not be opened.'};
        await dependencies.linking.openUrl(payload.url);
        return {status: 'handled'};
    }
  } catch {
    return {status: 'failed', message: 'The notification destination could not be opened.'};
  }
}
