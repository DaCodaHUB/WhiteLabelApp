import type {ClientConfig} from '../../app/config/types';
import type {ExternalLinking, HomeActionNavigator} from '../../app/homeActions';

export type TestLabActionId = 'internalWebView' | 'blockedHttp' | 'maps';

export type TestLabDependencies = {
  config: ClientConfig;
  linking: ExternalLinking;
  homeNavigation: HomeActionNavigator;
};

export type TestLabExecutionResult = {status: string; detail?: string};
