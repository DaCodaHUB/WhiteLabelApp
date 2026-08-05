import {OneSignal, OSNotificationPermission, type NotificationClickEvent as OneSignalClickEvent} from 'react-native-onesignal';
import type {NotificationService} from '../../domain/services/NotificationService';
import type {NotificationPermissionState} from '../../domain/services/NotificationService';

function mapNativePermission(value: OSNotificationPermission): NotificationPermissionState {
  switch (value) {
    case OSNotificationPermission.NotDetermined: return 'notDetermined';
    case OSNotificationPermission.Denied: return 'denied';
    case OSNotificationPermission.Authorized: return 'authorized';
    case OSNotificationPermission.Provisional:
    case OSNotificationPermission.Ephemeral: return 'provisional';
    default: return 'unknown';
  }
}

export const OneSignalNotificationService: NotificationService = {
  initialize(appId) {
    OneSignal.initialize(appId);
  },
  requestPermission() {
    return OneSignal.Notifications.requestPermission(false);
  },
  async getPermissionState() {
    try { return mapNativePermission(await OneSignal.Notifications.permissionNative()); }
    catch {
      try {
        if (await OneSignal.Notifications.getPermissionAsync()) return 'authorized';
        return (await OneSignal.Notifications.canRequestPermission()) ? 'notDetermined' : 'denied';
      } catch { return 'unavailable'; }
    }
  },
  canRequestPermission() { return OneSignal.Notifications.canRequestPermission(); },
  addNotificationClickListener(listener) {
    const sdkListener = (event: OneSignalClickEvent) => listener({id: event.notification.notificationId, additionalData: event.notification.additionalData});
    OneSignal.Notifications.addEventListener('click', sdkListener);
    return () => OneSignal.Notifications.removeEventListener('click', sdkListener);
  },
  addPermissionChangeListener(listener) {
    const sdkListener = (granted: boolean) => listener(granted ? 'authorized' : 'denied');
    OneSignal.Notifications.addEventListener('permissionChange', sdkListener);
    return () => OneSignal.Notifications.removeEventListener('permissionChange', sdkListener);
  },
  login(externalId) { OneSignal.login(externalId); },
  logout() { OneSignal.logout(); },
};
