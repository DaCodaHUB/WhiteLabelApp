import type {NativeDestination, WebBridgeMessageType} from '../config/types';
import {WEB_BRIDGE_MESSAGE_TYPES, type WebBridgeMessage} from './types';

const TYPE_SET: ReadonlySet<string> = new Set(WEB_BRIDGE_MESSAGE_TYPES);
const DESTINATIONS: ReadonlySet<string> = new Set<NativeDestination>(['settings']);
const LIMITS = {id: 128, contact: 320, short: 256, body: 4000, url: 2048, externalId: 128};
type JsonObject = {[key: string]: unknown};

function object(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as JsonObject : null;
}
function isMessageType(value: unknown): value is WebBridgeMessageType {
  return typeof value === 'string' && TYPE_SET.has(value);
}
function isNativeDestination(value: unknown): value is NativeDestination {
  return typeof value === 'string' && DESTINATIONS.has(value);
}
function optionalString(value: unknown, max: number, trim = false): string | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  const result = trim ? value.trim() : value;
  return result.length > 0 && result.length <= max ? result : null;
}
function https(value: string): boolean {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export function parseWebBridgeMessage(value: unknown): WebBridgeMessage | null {
  const item = object(value);
  if (!item || item.version !== 1 || !isMessageType(item.type)) return null;
  const id = optionalString(item.id, LIMITS.id, true);
  if (id === null) return null;
  const base = {version: 1 as const, ...(id ? {id} : {})};
  const contact = (fieldValue: unknown) => optionalString(fieldValue, LIMITS.contact, true);
  const short = (fieldValue: unknown) => optionalString(fieldValue, LIMITS.short);
  const body = optionalString(item.body, LIMITS.body);
  const url = optionalString(item.url, LIMITS.url, true);
  if (body === null || url === null) return null;

  switch (item.type) {
    case 'openPhone': { const phoneNumber = contact(item.phoneNumber); return phoneNumber === null ? null : {...base, type: 'openPhone', ...(phoneNumber ? {phoneNumber} : {})}; }
    case 'openEmail': {
      const emailAddress = contact(item.emailAddress); const subject = short(item.subject);
      return emailAddress === null || subject === null ? null : {...base, type: 'openEmail', ...(emailAddress ? {emailAddress} : {}), ...(subject ? {subject} : {}), ...(body ? {body} : {})};
    }
    case 'openMap': {
      const mapUrl = optionalString(item.mapUrl, LIMITS.url, true); const address = optionalString(item.address, LIMITS.short, true);
      if (mapUrl === null || address === null || (mapUrl && !https(mapUrl))) return null;
      return {...base, type: 'openMap', ...(mapUrl ? {mapUrl} : {}), ...(address ? {address} : {})};
    }
    case 'openExternal': return url && https(url) ? {...base, type: 'openExternal', url} : null;
    case 'share': {
      const title = short(item.title); const message = optionalString(item.message, LIMITS.body);
      if (title === null || message === null || (url && !https(url)) || (!title && !message && !url)) return null;
      return {...base, type: 'share', ...(title ? {title} : {}), ...(message ? {message} : {}), ...(url ? {url} : {})};
    }
    case 'openNative': return isNativeDestination(item.destination) ? {...base, type: 'openNative', destination: item.destination} : null;
    case 'identifyNotificationUser': {
      const externalId = optionalString(item.externalId, LIMITS.externalId, true);
      return externalId && !externalId.includes('@') ? {...base, type: 'identifyNotificationUser', externalId} : null;
    }
    case 'clearNotificationUser': return {...base, type: 'clearNotificationUser'};
  }
}

export function parseWebBridgeEventData(data: string, maxLength = 8192): WebBridgeMessage | null {
  if (!data.trim() || data.length > maxLength) return null;
  try { return parseWebBridgeMessage(JSON.parse(data)); } catch { return null; }
}
