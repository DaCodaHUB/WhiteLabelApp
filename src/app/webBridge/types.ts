import type {ClientConfig, NativeDestination, WebBridgeMessageType} from '../config/types';
import type {ExternalLinking} from '../homeActions';

type MessageBase = {version: 1; id?: string};
export type WebBridgeMessage =
  | (MessageBase & {type: 'openPhone'; phoneNumber?: string})
  | (MessageBase & {type: 'openEmail'; emailAddress?: string; subject?: string; body?: string})
  | (MessageBase & {type: 'openMap'; mapUrl?: string; address?: string})
  | (MessageBase & {type: 'openExternal'; url: string})
  | (MessageBase & {type: 'share'; title?: string; message?: string; url?: string})
  | (MessageBase & {type: 'openNative'; destination: NativeDestination})
  | (MessageBase & {type: 'identifyNotificationUser'; externalId: string})
  | (MessageBase & {type: 'clearNotificationUser'});

export type WebBridgeResult =
  | {status: 'success'; requestId?: string}
  | {status: 'unsupported' | 'failed'; requestId?: string; code: string; message: string};

export type ShareInput = {title?: string; message?: string; url?: string};
export type ShareResult = {status: 'shared' | 'cancelled'};
export interface ShareService { share(input: ShareInput): Promise<ShareResult>; }
export interface BridgeNavigator { openNative(destination: NativeDestination): void; }
export interface NotificationIdentity {
  enabled: boolean;
  initialized: boolean;
  identify(externalId: string): void;
  clear(): void;
}
export type WebBridgeDependencies = {
  config: ClientConfig;
  linking: ExternalLinking;
  navigation: BridgeNavigator;
  sharing: ShareService;
  notifications: NotificationIdentity;
};
export type WebBridgeHandler = (data: string, currentUrl: string) => Promise<WebBridgeResult>;
export const WEB_BRIDGE_MESSAGE_TYPES: readonly WebBridgeMessageType[] = [
  'openPhone', 'openEmail', 'openMap', 'openExternal', 'share', 'openNative',
  'identifyNotificationUser', 'clearNotificationUser',
];
