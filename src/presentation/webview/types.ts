import type {ExternalLinking} from '../../app/homeActions';
import type {WebBridgeHandler} from '../../app/webBridge';

export type WebRequestDecision =
  | {type: 'allowInternal'}
  | {type: 'openExternal'; url: string}
  | {type: 'openSpecialScheme'; url: string}
  | {type: 'block'; reason: 'malformed' | 'insecure' | 'unsupported'};

export type WebViewErrorState = {title: string; message: string} | undefined;

export type AppWebViewProps = {
  initialUrl: string;
  allowedDomains: string[];
  linking?: ExternalLinking;
  bridge?: {enabled: boolean; maxMessageLength: number; handleMessage: WebBridgeHandler};
};
