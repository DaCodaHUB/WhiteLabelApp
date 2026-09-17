import type {ClientConfig, ClientFeature, HomeAction, NativeDestination} from './types';

export function requiredFeatureForDestination(destination: NativeDestination): ClientFeature {
  switch (destination) {
    case 'settings': return 'settings';
  }
}

export function requiredFeatureForHomeAction(action: HomeAction): ClientFeature | undefined {
  switch (action.type) {
    case 'web': return 'webContent';
    case 'phone':
    case 'email': return 'contact';
    case 'maps': return 'location';
    case 'nativeScreen': return requiredFeatureForDestination(action.screen);
    case 'externalUrl': return undefined;
  }
}

export function isHomeActionAvailable(action: HomeAction, config: ClientConfig): boolean {
  const feature = requiredFeatureForHomeAction(action);
  return action.enabled !== false && (!feature || config.features[feature]);
}
