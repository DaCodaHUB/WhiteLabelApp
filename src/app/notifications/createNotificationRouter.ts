import {parseNotificationPayload} from './parseNotificationPayload';
import {routeNotification} from './routeNotification';
import type {NotificationPayload, NotificationRouteDependencies, NotificationRouteResult} from './types';

export function createNotificationRouter(dependencies: NotificationRouteDependencies) {
  let pending: NotificationPayload | undefined;
  let processing = false;
  const route = async (payload: NotificationPayload): Promise<NotificationRouteResult> => {
    if (processing) return {status: 'ignored', reason: 'duplicate-processing'};
    if (!dependencies.navigation.isReady()) { pending = payload; return {status: 'ignored', reason: 'navigation-not-ready'}; }
    processing = true;
    try { return await routeNotification(payload, dependencies); } finally { processing = false; }
  };
  return {
    handle: (value: unknown) => {
      const payload = parseNotificationPayload(value);
      return payload ? route(payload) : Promise.resolve<NotificationRouteResult>({status: 'ignored', reason: 'invalid-payload'});
    },
    flush: async () => {
      if (!pending) return {status: 'ignored', reason: 'no-pending'} as NotificationRouteResult;
      const payload = pending;
      pending = undefined;
      return route(payload);
    },
  };
}
