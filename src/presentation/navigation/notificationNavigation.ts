import {createNavigationContainerRef} from '@react-navigation/native';
import type {NotificationNavigator} from '../../app/notifications';
import type {NativeDestination} from '../../app/config/types';
import type {RootStackParamList} from './types';

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

function openNative(destination: NativeDestination) {
  if (destination === 'settings') rootNavigationRef.navigate('Settings');
}

export const notificationNavigator: NotificationNavigator = {
  isReady: () => rootNavigationRef.isReady(),
  openHome: () => { if (rootNavigationRef.getCurrentRoute()?.name !== 'Home') rootNavigationRef.navigate('Home'); },
  openWebContent: (url, title) => rootNavigationRef.navigate('WebContent', {url, title}),
  openNative,
};
