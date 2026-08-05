import type {NotificationPayload} from './types';

const MAX_ROUTE = 1024;
const MAX_URL = 2048;
const MAX_TITLE = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

export function parseNotificationPayload(value: unknown): NotificationPayload | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.type !== 'string') return null;
  switch (value.type) {
    case 'home': return {version: 1, type: 'home'};
    case 'openWeb':
      if (!text(value.route, MAX_ROUTE) || value.route.includes('://') || (value.title !== undefined && !text(value.title, MAX_TITLE))) return null;
      return {version: 1, type: 'openWeb', route: value.route, ...(typeof value.title === 'string' ? {title: value.title} : {})};
    case 'openNative':
      return value.destination === 'settings' ? {version: 1, type: 'openNative', destination: 'settings'} : null;
    case 'openExternal': {
      if (!text(value.url, MAX_URL)) return null;
      try {
        const url = new URL(value.url);
        return url.protocol === 'https:' ? {version: 1, type: 'openExternal', url: url.toString()} : null;
      } catch { return null; }
    }
    default: return null;
  }
}
