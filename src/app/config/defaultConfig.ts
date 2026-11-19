import type {ClientConfig} from './types';

/** Generic development configuration. Copy this object for each branded build. */
export const defaultConfig = {
  clientId: 'default-client',
  appName: 'White Label App',
  website: {
    baseUrl: 'https://example.com',
    allowedDomains: ['example.com'],
    routes: {
      home: '/',
    },
  },
  branding: {
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    mutedTextColor: '#64748B',
    surfaceColor: '#FFFFFF',
  },
  home: {
    title: 'Welcome',
    subtitle: 'Choose an option to get started.',
    actions: [
      {id: 'website', title: 'View Website', icon: 'language', type: 'web', route: '/'},
      {id: 'settings', title: 'Settings', icon: 'settings', type: 'nativeScreen', screen: 'settings'},
    ],
  },
  contact: {},
  webBridge: {
    enabled: false,
    allowedMessageTypes: [],
    maxMessageLength: 8192,
  },
  features: {
    webContent: true,
    contact: false,
    location: false,
    sharing: false,
    settings: true,
  },
} satisfies ClientConfig;
