import type {ClientConfig, NativeDestination, WebBridgeMessageType} from '../config/types';
import type {ExternalLinking} from '../homeActions';

type MessageBase = {version: 1; id?: string};
export type WebBridgeMessage =
  | (MessageBase & {type: 'openPhone'; phoneNumber?: string})
  | (MessageBase & {type: 'openEmail'; emailAddress?: string; subject?: string; body?: string})
  | (MessageBase & {type: 'openMap'; mapUrl?: string; address?: string})
  | (MessageBase & {type: 'openExternal'; url: string})
  | (MessageBase & {type: 'share'; title?: string; message?: string; url?: string})
  | (MessageBase & {type: 'openNative'; destination: NativeDestination});

export type WebBridgeResult =
  | {status: 'success' | 'cancelled'; requestId?: string; message?: string}
  | {status: 'unsupported' | 'failed'; requestId?: string; code: string; message: string};

export type ShareInput = {title?: string; message?: string; url?: string};
export type ShareResult = {status: 'shared' | 'cancelled'};
export interface ShareService { share(input: ShareInput): Promise<ShareResult>; }
export interface BridgeNavigator { openNative(destination: NativeDestination): void; }
export type WebBridgeDependencies = {
  config: ClientConfig;
  linking: ExternalLinking;
  navigation: BridgeNavigator;
  sharing: ShareService;
};
export type WebBridgeHandler = (data: string, currentUrl: string) => Promise<WebBridgeResult>;
export const WEB_BRIDGE_MESSAGE_TYPES: readonly WebBridgeMessageType[] = [
  'openPhone', 'openEmail', 'openMap', 'openExternal', 'share', 'openNative',
];
