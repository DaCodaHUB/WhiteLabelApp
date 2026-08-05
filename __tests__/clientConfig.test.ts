import {defaultConfig} from '../src/app/config/defaultConfig';
import type {ClientConfig} from '../src/app/config/types';
import {validateClientConfig} from '../src/app/config/validateClientConfig';

function createConfig(overrides: Partial<ClientConfig> = {}): ClientConfig {
  return {...defaultConfig, ...overrides};
}

describe('validateClientConfig', () => {
  test('accepts the default configuration', () => {
    expect(() => validateClientConfig(defaultConfig)).not.toThrow();
  });

  test('rejects an invalid website URL', () => {
    const config = createConfig({
      website: {...defaultConfig.website, baseUrl: 'not a URL'},
    });
    expect(() => validateClientConfig(config)).toThrow('website.baseUrl');
  });

  test('rejects an insecure client website URL', () => {
    const config = createConfig({website: {...defaultConfig.website, baseUrl: 'http://example.com'}});
    expect(() => validateClientConfig(config)).toThrow('valid HTTPS URL');
  });

  test('rejects an invalid branding color', () => {
    const config = createConfig({
      branding: {...defaultConfig.branding, primaryColor: 'blue'},
    });
    expect(() => validateClientConfig(config)).toThrow('branding.primaryColor');
  });

  test('requires a OneSignal App ID when notifications are enabled', () => {
    const config = createConfig({
      features: {...defaultConfig.features, notifications: true},
    });
    expect(() => validateClientConfig(config)).toThrow('notifications.oneSignalAppId');
  });

  test('requires custom notification prompt copy when enabled', () => {
    const config = createConfig({notifications: {...defaultConfig.notifications, permissionPrompt: {...defaultConfig.notifications.permissionPrompt, title: ''}}});
    expect(() => validateClientConfig(config)).toThrow('notifications.permissionPrompt.title');
  });

  test('requires a booking route when appointments are enabled', () => {
    const config = createConfig({
      features: {...defaultConfig.features, appointments: true},
    });
    expect(() => validateClientConfig(config)).toThrow('website.routes.booking');
  });

  test('rejects duplicate home action IDs', () => {
    const action = defaultConfig.home.actions[0];
    if (!action) throw new Error('Expected a default action.');
    const config = createConfig({home: {...defaultConfig.home, actions: [action, action]}});
    expect(() => validateClientConfig(config)).toThrow('duplicate home action ID');
  });

  test('rejects an invalid external URL', () => {
    const config = createConfig({home: {actions: [{id: 'outside', title: 'Outside', icon: 'open-in-new', type: 'externalUrl', url: 'http://example.com'}]}});
    expect(() => validateClientConfig(config)).toThrow('valid HTTPS URL');
  });

  test('rejects a web action with a missing route', () => {
    const config = createConfig({home: {actions: [{id: 'web', title: 'Web', icon: 'language', type: 'web', route: ''}]}});
    expect(() => validateClientConfig(config)).toThrow('.route');
  });

  test('rejects a phone action without any phone number', () => {
    const config = createConfig({home: {actions: [{id: 'call', title: 'Call', icon: 'phone', type: 'phone'}]}});
    expect(() => validateClientConfig(config)).toThrow('requires a phone number');
  });
});
