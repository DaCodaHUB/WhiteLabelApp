import {isAllowedClientUrl} from '../config/url';
import {executeWebBridgeMessage} from './executeWebBridgeMessage';
import {parseWebBridgeEventData} from './parseWebBridgeMessage';
import type {WebBridgeDependencies, WebBridgeHandler, WebBridgeResult} from './types';

const failure = (code: string, message: string): WebBridgeResult => ({status: 'unsupported', code, message});

export function createWebBridgeHandler(dependencies: WebBridgeDependencies): WebBridgeHandler {
  return async (data, currentUrl) => {
    const bridge = dependencies.config.webBridge;
    if (!bridge?.enabled) return failure('BRIDGE_DISABLED', 'The website bridge is disabled.');
    const message = parseWebBridgeEventData(data, bridge.maxMessageLength);
    if (!message) return failure('INVALID_MESSAGE', 'The bridge message is invalid.');
    const withId = (value: WebBridgeResult): WebBridgeResult => ({...value, requestId: message.id});
    if (message.type === 'retired' || !bridge.allowedMessageTypes.includes(message.type)) return withId(failure('MESSAGE_NOT_ALLOWED', 'This message type is not allowed.'));
    if (currentUrl === 'about:blank' || !isAllowedClientUrl(currentUrl, dependencies.config.website.allowedDomains)) {
      return withId(failure('UNAUTHORIZED_PAGE', 'The current page is not authorized.'));
    }
    if (!dependencies.config.features.webContent) return withId(failure('FEATURE_DISABLED', 'This feature is unavailable.'));
    try { return await executeWebBridgeMessage(message, dependencies); }
    catch { return withId({status: 'failed', code: 'EXECUTION_FAILED', message: 'The requested action could not be completed.'}); }
  };
}
