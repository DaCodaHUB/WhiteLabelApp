import type {ClientConfig, HomeAction, NativeDestination} from '../config/types';

export interface ExternalLinking {
  canOpenUrl(url: string): Promise<boolean>;
  openUrl(url: string): Promise<void>;
}

export interface HomeActionNavigator {
  openWebContent(url: string, title: string): void;
  openNativeScreen(destination: NativeDestination): void;
}

export type HomeActionResult =
  | {status: 'success'}
  | {status: 'unsupported'; message: string}
  | {status: 'failed'; message: string; cause?: unknown};

export type HomeActionDependencies = {
  config: ClientConfig;
  navigate: HomeActionNavigator;
  linking: ExternalLinking;
};

export type ExecuteHomeAction = (action: HomeAction) => Promise<HomeActionResult>;
