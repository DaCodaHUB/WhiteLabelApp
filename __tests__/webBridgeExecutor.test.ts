import {defaultConfig} from '../src/app/config/defaultConfig';
import type {ClientConfig} from '../src/app/config/types';
import {createWebBridgeHandler, executeWebBridgeMessage} from '../src/app/webBridge';
import type {ShareResult, WebBridgeDependencies} from '../src/app/webBridge';

function config(overrides: Partial<ClientConfig> = {}): ClientConfig {
  return {
    ...defaultConfig,
    contact: {phone: '+15550100', email: 'hello@example.com', address: '1 Main St', mapUrl: 'https://maps.example.com/client'},
    features: {...defaultConfig.features, contact: true, location: true, sharing: true, notifications: true},
    notifications: {...defaultConfig.notifications, oneSignalAppId: '00000000-0000-0000-0000-000000000000'},
    webBridge: {enabled: true, allowedMessageTypes: ['openPhone', 'openEmail', 'openMap', 'openExternal', 'share', 'openNative', 'identifyNotificationUser', 'clearNotificationUser'], maxMessageLength: 8192},
    ...overrides,
  };
}

function dependencies(clientConfig = config()): WebBridgeDependencies {
  return {
    config: clientConfig,
    linking: {canOpenUrl: jest.fn(async () => true), openUrl: jest.fn(async () => undefined)},
    navigation: {openNative: jest.fn()},
    sharing: {share: jest.fn(async (): Promise<ShareResult> => ({status: 'shared'}))},
    notifications: {enabled: true, initialized: true, identify: jest.fn(), clear: jest.fn()},
  };
}

describe('web bridge authorization', () => {
  test('disabled bridge rejects all messages', async () => {
    const deps = dependencies({...config(), webBridge: {enabled: false, allowedMessageTypes: [], maxMessageLength: 8192}});
    expect(await createWebBridgeHandler(deps)(JSON.stringify({version: 1, type: 'openPhone'}), 'https://example.com')).toMatchObject({code: 'BRIDGE_DISABLED'});
  });
  test('rejects an unlisted type', async () => {
    const deps = dependencies({...config(), webBridge: {enabled: true, allowedMessageTypes: [], maxMessageLength: 8192}});
    expect(await createWebBridgeHandler(deps)(JSON.stringify({version: 1, id: '1', type: 'openPhone'}), 'https://example.com')).toMatchObject({code: 'MESSAGE_NOT_ALLOWED'});
  });
  test.each(['https://outside.test', 'about:blank'])('rejects unauthorized page %s', async currentUrl => {
    const value = await createWebBridgeHandler(dependencies())(JSON.stringify({version: 1, type: 'openPhone'}), currentUrl);
    expect(value).toMatchObject({code: 'UNAUTHORIZED_PAGE'});
  });
  test('allows an internal page', async () => {
    const value = await createWebBridgeHandler(dependencies())(JSON.stringify({version: 1, type: 'openPhone'}), 'https://account.example.com/page');
    expect(value.status).toBe('success');
  });
});

describe('web bridge executor', () => {
  test('phone fallback uses client contact', async () => {
    const deps = dependencies(); await executeWebBridgeMessage({version: 1, type: 'openPhone'}, deps);
    expect(deps.linking.openUrl).toHaveBeenCalledWith('tel:+15550100');
  });
  test('email delegates through linking', async () => {
    const deps = dependencies(); await executeWebBridgeMessage({version: 1, type: 'openEmail', subject: 'Hello world'}, deps);
    expect(deps.linking.openUrl).toHaveBeenCalledWith('mailto:hello@example.com?subject=Hello+world');
  });
  test('map input takes priority over configured contact', async () => {
    const deps = dependencies(); await executeWebBridgeMessage({version: 1, type: 'openMap', address: 'Message address'}, deps);
    expect(deps.linking.openUrl).toHaveBeenCalledWith(expect.stringContaining('Message%20address'));
  });
  test('external URL opens externally', async () => {
    const deps = dependencies(); await executeWebBridgeMessage({version: 1, type: 'openExternal', url: 'https://outside.test'}, deps);
    expect(deps.linking.openUrl).toHaveBeenCalledWith('https://outside.test/');
  });
  test('native, share, and notification identity delegate', async () => {
    const deps = dependencies();
    await executeWebBridgeMessage({version: 1, type: 'openNative', destination: 'settings'}, deps);
    await executeWebBridgeMessage({version: 1, type: 'share', message: 'hello'}, deps);
    await executeWebBridgeMessage({version: 1, type: 'identifyNotificationUser', externalId: 'customer_1'}, deps);
    await executeWebBridgeMessage({version: 1, type: 'clearNotificationUser'}, deps);
    expect(deps.navigation.openNative).toHaveBeenCalledWith('settings'); expect(deps.sharing.share).toHaveBeenCalled();
    expect(deps.notifications.identify).toHaveBeenCalledWith('customer_1'); expect(deps.notifications.clear).toHaveBeenCalled();
  });
  test('unavailable target is unsupported and native errors are sanitized', async () => {
    const unavailable = dependencies(); jest.mocked(unavailable.linking.canOpenUrl).mockResolvedValue(false);
    expect((await executeWebBridgeMessage({version: 1, type: 'openPhone'}, unavailable)).status).toBe('unsupported');
    const failing = dependencies(); jest.mocked(failing.navigation.openNative).mockImplementation(() => { throw new Error('private native detail'); });
    const value = await executeWebBridgeMessage({version: 1, type: 'openNative', destination: 'settings'}, failing);
    expect(value.status).toBe('failed'); expect(JSON.stringify(value)).not.toContain('private native detail');
  });
  test('feature-disabled action is rejected', async () => {
    const deps = dependencies({...config(), features: {...config().features, sharing: false}});
    expect(await executeWebBridgeMessage({version: 1, type: 'share', message: 'hello'}, deps)).toMatchObject({code: 'FEATURE_DISABLED'});
  });
  test('disabled Settings cannot be opened through bridge navigation', async () => {
    const deps = dependencies({...config(), features: {...config().features, settings: false}});
    expect(await executeWebBridgeMessage({version: 1, type: 'openNative', destination: 'settings'}, deps)).toMatchObject({code: 'INVALID_DESTINATION'});
    expect(deps.navigation.openNative).not.toHaveBeenCalled();
  });
  test('disabled WebContent cannot execute bridge actions', async () => {
    const deps = dependencies({...config(), features: {...config().features, webContent: false}});
    expect(await createWebBridgeHandler(deps)(JSON.stringify({version: 1, type: 'openExternal', url: 'https://outside.test'}), 'https://example.com')).toMatchObject({code: 'FEATURE_DISABLED'});
    expect(deps.linking.openUrl).not.toHaveBeenCalled();
  });
});
