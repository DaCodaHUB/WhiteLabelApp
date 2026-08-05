import type {WebBridgeResult} from './types';

export const WEB_BRIDGE_RESPONSE_EVENT = 'freelanceAppBridgeResponse';

export function serializeWebBridgeResponse(result: WebBridgeResult): string {
  const json = JSON.stringify(result)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `window.dispatchEvent(new CustomEvent('${WEB_BRIDGE_RESPONSE_EVENT}',{detail:${json}}));true;`;
}
