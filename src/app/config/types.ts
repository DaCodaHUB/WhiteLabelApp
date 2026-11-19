import type {ImageSourcePropType} from 'react-native';

export type WebsiteRoutes = {
  home: string;
};

export type BrandingConfig = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
  surfaceColor: string;
  logo?: ImageSourcePropType;
};

export type AppIconName =
  | 'email'
  | 'error-outline'
  | 'explore'
  | 'info-outline'
  | 'language'
  | 'open-in-new'
  | 'phone'
  | 'settings';

export type NativeDestination = 'settings';

export type WebBridgeMessageType =
  | 'openPhone' | 'openEmail' | 'openMap' | 'openExternal' | 'share'
  | 'openNative';

export type WebBridgeConfig = {
  enabled: boolean;
  allowedMessageTypes: WebBridgeMessageType[];
  maxMessageLength: number;
};

type HomeActionBase = {
  id: string;
  title: string;
  subtitle?: string;
  icon: AppIconName;
  enabled?: boolean;
};

export type HomeAction =
  | (HomeActionBase & {type: 'web'; route: string})
  | (HomeActionBase & {type: 'phone'; phoneNumber?: string})
  | (HomeActionBase & {type: 'email'; emailAddress?: string; subject?: string; body?: string})
  | (HomeActionBase & {type: 'maps'; mapUrl?: string; address?: string})
  | (HomeActionBase & {type: 'externalUrl'; url: string})
  | (HomeActionBase & {type: 'nativeScreen'; screen: NativeDestination});

export type ClientConfig = {
  clientId: string;
  appName: string;
  website: {
    baseUrl: string;
    allowedDomains: string[];
    routes: WebsiteRoutes;
  };
  branding: BrandingConfig;
  home: {
    title?: string;
    subtitle?: string;
    actions: HomeAction[];
  };
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    mapUrl?: string;
  };
  webBridge?: WebBridgeConfig;
  features: {
    webContent: boolean;
    contact: boolean;
    location: boolean;
    sharing: boolean;
    settings: boolean;
  };
};

export type ClientFeature = keyof ClientConfig['features'];
