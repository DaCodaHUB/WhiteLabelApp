import type {ClientConfig} from '../../src/app/config/types';

export const clientConfig: ClientConfig = {
  clientId: 'demo',
  appName: 'DaCodaHub',
  website: {
    baseUrl: 'https://dacodahub.github.io',
    allowedDomains: ['dacodahub.github.io'],
    routes: {home: '/mobile-demo/'},
  },
  branding: {
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    mutedTextColor: '#64748B',
    surfaceColor: '#FFFFFF',
    logo: {uri: 'client-logo-placeholder'},
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
    permissionPrompt: {
      enabled: false,
      title: 'Stay informed',
      message: 'Enable notifications to receive useful updates from this app.',
      allowLabel: 'Allow Notifications',
      laterLabel: 'Not Now',
    },
  },
  webBridge: {
    enabled: true,
    allowedMessageTypes: ['openPhone', 'openEmail', 'openMap', 'openExternal', 'share', 'openNative'],
    maxMessageLength: 8192,
  },
  storage: {namespace: 'demo-example-works'},
  features: {
    nativeHome: true,
    webContent: true,
    notifications: false,
    appointments: false,
    authentication: false,
    ecommerce: false,
    loyalty: false,
    contact: true,
    location: true,
    sharing: true,
    settings: true,
  },
};
