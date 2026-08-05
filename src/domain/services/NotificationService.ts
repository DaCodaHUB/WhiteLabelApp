export type NotificationPermissionState = 'unknown' | 'notDetermined' | 'denied' | 'authorized' | 'provisional' | 'unavailable';
export type NotificationClickEvent = {id: string; additionalData: unknown};

export interface NotificationService {
  initialize(appId: string): void;
  requestPermission(): Promise<boolean>;
  getPermissionState(): Promise<NotificationPermissionState>;
  canRequestPermission(): Promise<boolean>;
  addNotificationClickListener(listener: (event: NotificationClickEvent) => void): () => void;
  addPermissionChangeListener(listener: (state: NotificationPermissionState) => void): () => void;
  login(externalId: string): void;
  logout(): void;
}
