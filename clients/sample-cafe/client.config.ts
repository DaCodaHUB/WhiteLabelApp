import {defaultConfig} from '../../src/app/config/defaultConfig';
import type {ClientConfig} from '../../src/app/config/types';

/** Fictional development client used to exercise white-label preparation. */
export const clientConfig = {
  ...defaultConfig,
  clientId: 'sample-cafe',
  appName: 'Sample Cafe',
  website: {
    baseUrl: 'https://sample-cafe.example',
    allowedDomains: ['sample-cafe.example'],
    routes: {home: '/', services: '/menu', booking: '/order'},
  },
  branding: {
    primaryColor: '#7B3F27',
    secondaryColor: '#D69E5D',
    backgroundColor: '#FFF7EA',
    textColor: '#352419',
    mutedTextColor: '#806A58',
    surfaceColor: '#FFFFFF',
  },
  home: {
    title: 'Welcome to Sample Cafe',
    subtitle: 'Fresh coffee and a little time to slow down.',
    actions: [
      {id: 'menu', title: 'View Menu', icon: 'language', type: 'web', route: '/menu'},
      {id: 'order', title: 'Order Online', icon: 'open-in-new', type: 'web', route: '/order'},
      {id: 'call', title: 'Call Us', icon: 'phone', type: 'phone'},
      {id: 'directions', title: 'Directions', icon: 'explore', type: 'maps'},
      {id: 'settings', title: 'Settings', icon: 'settings', type: 'nativeScreen', screen: 'settings'},
    ],
  },
  contact: {
    phone: '+12025550142',
    email: 'hello@sample-cafe.example',
    address: '123 Placeholder Lane, Example City',
  },
  notifications: {
    ...defaultConfig.notifications,
    permissionPrompt: {...defaultConfig.notifications.permissionPrompt, enabled: false},
  },
  webBridge: {enabled: false, allowedMessageTypes: [], maxMessageLength: 8192},
  storage: {namespace: 'sample-cafe'},
  features: {
    webContent: true,
    notifications: false,
    contact: true,
    location: true,
    sharing: false,
    settings: true,
  },
} satisfies ClientConfig;
