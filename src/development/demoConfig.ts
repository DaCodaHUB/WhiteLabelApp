import type {ClientConfig} from '../app/config/types';
import {defaultConfig} from '../app/config/defaultConfig';

/** Fictional, development-only data. Never use this configuration for publishing. */
export const demoConfig = {
  ...defaultConfig,
  clientId: 'demo-example-works',
  appName: 'DaCodaHub',
  website: {
    baseUrl: 'https://dacodahub.github.io',
    allowedDomains: ['dacodahub.github.io'],
    routes: {home: '/mobile-demo/'},
  },
  home: {
    title: 'DaCodaHub Demo',
    subtitle: 'Fictional development environment',
    actions: [
      {id: 'website', title: 'View Portfolio', icon: 'language', type: 'web', route: '/mobile-demo/'},
      {id: 'settings', title: 'Settings', icon: 'settings', type: 'nativeScreen', screen: 'settings'},
    ],
  },
  contact: {
    phone: '+12025550199',
    email: 'hello@dacodahub.github.io',
    address: '100 Example Avenue, Sample City',
    mapUrl: 'https://www.google.com/maps/search/DaCodaHub',
  },
  notifications: {
    ...defaultConfig.notifications,
    permissionPrompt: {...defaultConfig.notifications.permissionPrompt, enabled: false},
  },
  webBridge: {
    enabled: true,
    allowedMessageTypes: ['openPhone', 'openEmail', 'openMap', 'openExternal', 'share', 'openNative'],
    maxMessageLength: 8192,
  },
  storage: {namespace: 'demo-example-works'},
  features: {
    ...defaultConfig.features,
    contact: true,
    location: true,
    sharing: true,
  },
} satisfies ClientConfig;
