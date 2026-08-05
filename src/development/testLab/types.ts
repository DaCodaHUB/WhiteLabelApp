import type {ClientConfig, HomeAction} from '../../app/config/types';
import type {ExternalLinking, HomeActionNavigator} from '../../app/homeActions';
import type {NotificationNavigator} from '../../app/notifications';

export type TestLabActionId =
  | 'internalWebView' | 'allowedRoute' | 'externalHttps' | 'blockedHttp'
  | 'lookalikeDomain' | 'phone' | 'email' | 'maps' | 'settings'
  | 'notificationWeb' | 'notificationNative' | 'notificationHome' | 'notificationMalformed';

export type TestLabDependencies = {
  config: ClientConfig;
  linking: ExternalLinking;
  homeNavigation: HomeActionNavigator;
  notificationNavigation: NotificationNavigator;
};

export type TestLabExecutionResult = {status: string; detail?: string};
export type TestLabHomeAction = Extract<HomeAction, {type: 'web' | 'phone' | 'email' | 'maps' | 'externalUrl' | 'nativeScreen'}>;
