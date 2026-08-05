import {isAllowedClientUrl} from '../../app/config/url';
import type {WebRequestDecision} from './types';

const specialSchemes = new Set(['tel:', 'mailto:', 'sms:']);

export function evaluateWebRequest(requestUrl: string, allowedDomains: string[]): WebRequestDecision {
  if (requestUrl === 'about:blank') return {type: 'allowInternal'};
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return {type: 'block', reason: 'malformed'};
  }
  if (specialSchemes.has(url.protocol)) return {type: 'openSpecialScheme', url: requestUrl};
  if (url.protocol === 'http:') return {type: 'block', reason: 'insecure'};
  if (url.protocol !== 'https:') return {type: 'block', reason: 'unsupported'};
  if (isAllowedClientUrl(url.toString(), allowedDomains)) return {type: 'allowInternal'};
  return {type: 'openExternal', url: url.toString()};
}
