import React, {createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import type {NotificationPermissionState, NotificationService} from '../../domain/services/NotificationService';
import {OneSignalNotificationService} from '../../infrastructure/notifications/OneSignalNotificationService';
import {reactNativeLinking} from '../../infrastructure/linking/ReactNativeLinking';
import {notificationNavigator} from '../../presentation/navigation/notificationNavigation';
import {createNotificationRouter} from '../notifications';
import {MMKVStorage} from '../../data/storage/MMKVStorage';
import {STORAGE_KEYS} from '../../shared/constants/storageKeys';
import {useClientConfig} from './ClientConfigProvider';

type NotificationContextValue = {
  enabled: boolean;
  initialized: boolean;
  permissionState: NotificationPermissionState;
  canRequestPermission: boolean;
  requestPermission(): Promise<boolean>;
  identifyNotificationUser(externalId: string): void;
  clearNotificationUser(): void;
  processPendingNotification(): Promise<void>;
  permissionPromptDismissed: boolean;
  dismissPermissionPrompt(): void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({children, service = OneSignalNotificationService}: PropsWithChildren<{service?: NotificationService}>) {
  const config = useClientConfig();
  const enabled = config.features.notifications && Boolean(config.notifications.oneSignalAppId?.trim());
  const initializedRef = useRef(false);
  const seenClicks = useRef(new Set<string>());
  const [initialized, setInitialized] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(enabled ? 'unknown' : 'unavailable');
  const [canRequestPermission, setCanRequestPermission] = useState(false);
  const storage = useMemo(() => new MMKVStorage(config.storage.namespace), [config.storage.namespace]);
  const [permissionPromptDismissed, setPermissionPromptDismissed] = useState(() => storage.getString(STORAGE_KEYS.notificationPromptDismissed) === 'true');
  const router = useMemo(() => createNotificationRouter({config, navigation: notificationNavigator, linking: reactNativeLinking}), [config]);

  useEffect(() => {
    const appId = config.notifications.oneSignalAppId?.trim();
    if (!enabled || !appId || initializedRef.current) return;
    initializedRef.current = true;
    service.initialize(appId);
    setInitialized(true);
    service.getPermissionState().then(setPermissionState).catch(() => setPermissionState('unavailable'));
    service.canRequestPermission().then(setCanRequestPermission).catch(() => setCanRequestPermission(false));
    const removeClick = service.addNotificationClickListener(event => {
      if (seenClicks.current.has(event.id)) return;
      seenClicks.current.add(event.id);
      router.handle(event.additionalData).catch(() => undefined);
    });
    const removePermission = service.addPermissionChangeListener(state => {
      setPermissionState(state);
      service.canRequestPermission().then(setCanRequestPermission).catch(() => setCanRequestPermission(false));
    });
    return () => { removeClick(); removePermission(); };
  }, [config.notifications.oneSignalAppId, enabled, router, service]);

  const requestPermission = useCallback(async () => {
    if (!enabled) return false;
    const granted = await service.requestPermission();
    setPermissionState(await service.getPermissionState());
    setCanRequestPermission(await service.canRequestPermission());
    return granted;
  }, [enabled, service]);

  const value = useMemo<NotificationContextValue>(() => ({
    enabled, initialized, permissionState, canRequestPermission, requestPermission,
    identifyNotificationUser: externalId => {
      const id = externalId.trim();
      if (!id || id.length > 128) throw new Error('Notification external ID must contain 1 to 128 characters.');
      if (enabled) service.login(id);
    },
    clearNotificationUser: () => { if (enabled) service.logout(); },
    processPendingNotification: async () => { await router.flush(); },
    permissionPromptDismissed,
    dismissPermissionPrompt: () => { storage.setString(STORAGE_KEYS.notificationPromptDismissed, 'true'); setPermissionPromptDismissed(true); },
  }), [canRequestPermission, enabled, initialized, permissionPromptDismissed, permissionState, requestPermission, router, service, storage]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider.');
  return context;
}
