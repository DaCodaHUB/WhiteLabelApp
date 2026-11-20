import type {ClientConfig} from '../../src/app/config/types';

/** Fictional development client used to exercise white-label preparation. */
export const clientConfig = {
  clientId: 'sample-cafe',
  appName: 'Sample Cafe',
  website: {
    baseUrl: 'https://dacodahub.github.io',
    allowedDomains: ['dacodahub.github.io'],
    routes: {home: '/mobile-demo/sample-cafe/'},
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
      {id: 'website', title: 'Visit Sample Cafe', icon: 'language', type: 'web', route: '/mobile-demo/sample-cafe/'},
      {id: 'menu', title: 'View Menu', icon: 'open-in-new', type: 'web', route: '/mobile-demo/sample-cafe/menu.html'},
      {id: 'call', title: 'Call Us', icon: 'phone', type: 'phone'},
      {id: 'directions', title: 'Directions', icon: 'explore', type: 'maps'},
      {id: 'settings', title: 'Settings', icon: 'settings', type: 'nativeScreen', screen: 'settings'},
    ],
  },
  contact: {
    phone: '+15035550147',
    email: 'hello@samplecafe.example',
    address: '123 Sample Street, Portland, OR 97205',
  },
  webBridge: {enabled: false, allowedMessageTypes: [], maxMessageLength: 8192},
  features: {
    webContent: true,
    contact: true,
    location: true,
    sharing: false,
    settings: true,
  },
} satisfies ClientConfig;
