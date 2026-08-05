import {createNotificationRouter, parseNotificationPayload, routeNotification, type NotificationNavigator} from '../src/app/notifications';
import {defaultConfig} from '../src/app/config/defaultConfig';

function dependencies(options: {ready?: boolean; baseUrl?: string; canOpen?: boolean} = {}) {
  const navigation: NotificationNavigator = {isReady: jest.fn(() => options.ready ?? true), openHome: jest.fn(), openWebContent: jest.fn(), openNative: jest.fn()};
  const linking = {canOpenUrl: jest.fn(async () => options.canOpen ?? true), openUrl: jest.fn(async (): Promise<void> => undefined)};
  return {config: {...defaultConfig, website: {...defaultConfig.website, baseUrl: options.baseUrl ?? defaultConfig.website.baseUrl}}, navigation, linking};
}

describe('notification routing', () => {
  test('securely builds and opens client web routes', async () => {
    const deps = dependencies();
    const payload = parseNotificationPayload({version: 1, type: 'openWeb', route: '/specials', title: 'Specials'});
    if (!payload) throw new Error('Expected payload.');
    expect((await routeNotification(payload, deps)).status).toBe('handled');
    expect(deps.navigation.openWebContent).toHaveBeenCalledWith('https://example.com/specials', 'Specials');
  });
  test('rejects a lookalike client hostname', async () => {
    const deps = dependencies({baseUrl: 'https://example.com.evil.test'});
    const payload = parseNotificationPayload({version: 1, type: 'openWeb', route: '/'});
    if (!payload) throw new Error('Expected payload.');
    expect((await routeNotification(payload, deps)).status).toBe('ignored');
    expect(deps.navigation.openWebContent).not.toHaveBeenCalled();
  });
  test('maps native, external, and Home destinations', async () => {
    const deps = dependencies();
    await createNotificationRouter(deps).handle({version: 1, type: 'openNative', destination: 'settings'});
    expect(deps.navigation.openNative).toHaveBeenCalledWith('settings');
    await createNotificationRouter(deps).handle({version: 1, type: 'openExternal', url: 'https://example.org'});
    expect(deps.linking.openUrl).toHaveBeenCalledWith('https://example.org/');
    await createNotificationRouter(deps).handle({version: 1, type: 'home'});
    expect(deps.navigation.openHome).toHaveBeenCalled();
  });
  test('returns a safe result for an unsupported external link', async () => {
    expect(await createNotificationRouter(dependencies({canOpen: false})).handle({version: 1, type: 'openExternal', url: 'https://example.org'})).toEqual({status: 'failed', message: 'This link could not be opened.'});
  });
  test('stores one pending item and flushes it once navigation is ready', async () => {
    let ready = false;
    const deps = dependencies();
    deps.navigation.isReady = jest.fn(() => ready);
    const router = createNotificationRouter(deps);
    expect((await router.handle({version: 1, type: 'home'})).status).toBe('ignored');
    ready = true;
    expect((await router.flush()).status).toBe('handled');
    expect((await router.flush()).status).toBe('ignored');
    expect(deps.navigation.openHome).toHaveBeenCalledTimes(1);
  });
  test('ignores malformed payload without navigation', async () => {
    const deps = dependencies();
    expect((await createNotificationRouter(deps).handle({type: 'home'})).status).toBe('ignored');
    expect(deps.navigation.openHome).not.toHaveBeenCalled();
  });
  test('prevents concurrent duplicate processing', async () => {
    let resolveOpen: (() => void) | undefined;
    const deps = dependencies();
    deps.linking.openUrl = jest.fn(() => new Promise<void>(resolve => { resolveOpen = resolve; }));
    const router = createNotificationRouter(deps);
    const first = router.handle({version: 1, type: 'openExternal', url: 'https://example.org'});
    await Promise.resolve();
    expect((await router.handle({version: 1, type: 'home'})).status).toBe('ignored');
    resolveOpen?.();
    await first;
  });
});
