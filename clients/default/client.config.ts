import type {ClientConfig} from '../../src/app/config/types';

export const clientConfig: ClientConfig = {
  clientId: 'default',
  appName: 'White Label App',
  website: {
    baseUrl: 'https://example.com',
    allowedDomains: ['example.com'],
    routes: {home: '/'},
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
  notifications: {
    permissionPrompt: {
      enabled: true,
      title: 'Stay informed',
      message: 'Enable notifications to receive useful updates from this app.',
      allowLabel: 'Allow Notifications',
      laterLabel: 'Not Now',
    },
  },
  webBridge: {
    enabled: false,
    allowedMessageTypes: [],
    maxMessageLength: 8192,
  },
  storage: {namespace: 'default-client'},
  features: {
    webContent: true,
    notifications: false,
    contact: false,
    location: false,
    sharing: false,
    settings: true,
  },
};
