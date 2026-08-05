import type {ClientConfig, NativeDestination} from '../config/types';
import type {ExternalLinking} from '../homeActions';

export type NotificationPayload =
  | {version: 1; type: 'openWeb'; route: string; title?: string}
  | {version: 1; type: 'openNative'; destination: NativeDestination}
  | {version: 1; type: 'openExternal'; url: string}
  | {version: 1; type: 'home'};

export interface NotificationNavigator {
  isReady(): boolean;
  openHome(): void;
  openWebContent(url: string, title?: string): void;
  openNative(destination: NativeDestination): void;
}

export type NotificationRouteDependencies = {config: ClientConfig; navigation: NotificationNavigator; linking: ExternalLinking};
export type NotificationRouteResult = {status: 'handled'} | {status: 'ignored'; reason: string} | {status: 'failed'; message: string};
