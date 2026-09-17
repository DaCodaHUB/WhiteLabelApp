import {defaultConfig} from '../src/app/config/defaultConfig';
import type {ClientConfig, HomeAction} from '../src/app/config/types';
import {executeHomeAction, type ExternalLinking, type HomeActionNavigator} from '../src/app/homeActions';

function dependencies(overrides: {linking?: ExternalLinking; navigate?: HomeActionNavigator; config?: ClientConfig} = {}) {
  return {
    config: overrides.config ?? defaultConfig,
    linking: overrides.linking ?? {canOpenUrl: jest.fn(async () => true), openUrl: jest.fn(async () => undefined)},
    navigate: overrides.navigate ?? {openWebContent: jest.fn(), openNativeScreen: jest.fn()},
  };
}

describe('executeHomeAction', () => {
  test('opens web actions internally with their final allowed URL', async () => {
    const deps = dependencies();
    const result = await executeHomeAction({id: 'web', title: 'Services', icon: 'language', type: 'web', route: '/services'}, deps);
    expect(result.status).toBe('success');
    expect(deps.navigate.openWebContent).toHaveBeenCalledWith('https://example.com/services', 'Services');
    expect(deps.linking.openUrl).not.toHaveBeenCalled();
  });
  test('rejects a disallowed or lookalike client hostname', async () => {
    const deps = dependencies({config: {...defaultConfig, website: {...defaultConfig.website, baseUrl: 'https://example.com.evil.test'}}});
    const result = await executeHomeAction({id: 'web', title: 'Page', icon: 'language', type: 'web', route: '/'}, deps);
    expect(result.status).toBe('failed');
    expect(deps.navigate.openWebContent).not.toHaveBeenCalled();
  });
  test('maps native destinations without arbitrary route strings', async () => {
    const deps = dependencies();
    await executeHomeAction({id: 'settings', title: 'Settings', icon: 'settings', type: 'nativeScreen', screen: 'settings'}, deps);
    expect(deps.navigate.openNativeScreen).toHaveBeenCalledWith('settings');
  });
  test('prefers an action phone number over client contact', async () => {
    const deps = dependencies({config: {...defaultConfig, features: {...defaultConfig.features, contact: true}}});
    await executeHomeAction({id: 'phone', title: 'Call', icon: 'phone', type: 'phone', phoneNumber: '+1 (212) 555-0100'}, deps);
    expect(deps.linking.openUrl).toHaveBeenCalledWith('tel:+12125550100');
  });
  test('falls back to client contact email', async () => {
    const deps = dependencies({config: {...defaultConfig, features: {...defaultConfig.features, contact: true}, contact: {email: 'contact@example.com'}}});
    await executeHomeAction({id: 'email', title: 'Email', icon: 'email', type: 'email'}, deps);
    expect(deps.linking.openUrl).toHaveBeenCalledWith('mailto:contact@example.com');
  });
  test('uses map destinations in documented priority order', async () => {
    const deps = dependencies({config: {...defaultConfig, features: {...defaultConfig.features, location: true}, contact: {mapUrl: 'https://maps.example.com/client', address: 'Client address'}}});
    const action: HomeAction = {id: 'maps', title: 'Map', icon: 'explore', type: 'maps', mapUrl: 'https://maps.example.com/action', address: 'Action address'};
    await executeHomeAction(action, deps);
    expect(deps.linking.openUrl).toHaveBeenCalledWith('https://maps.example.com/action');
  });
  test('returns unsupported when the device cannot open a URL', async () => {
    const deps = dependencies({linking: {canOpenUrl: jest.fn(async () => false), openUrl: jest.fn()}});
    const result = await executeHomeAction({id: 'link', title: 'Link', icon: 'open-in-new', type: 'externalUrl', url: 'https://example.org'}, deps);
    expect(result.status).toBe('unsupported');
    expect(deps.linking.openUrl).not.toHaveBeenCalled();
  });
  test('returns a safe failure when opening rejects', async () => {
    const deps = dependencies({linking: {canOpenUrl: jest.fn(async () => true), openUrl: jest.fn(async () => { throw new Error('private native error'); })}});
    const result = await executeHomeAction({id: 'link', title: 'Link', icon: 'open-in-new', type: 'externalUrl', url: 'https://example.org'}, deps);
    expect(result).toMatchObject({status: 'failed', message: 'This link could not be opened.'});
  });
  test('opens valid external HTTPS URLs and rejects malformed ones', async () => {
    const deps = dependencies();
    expect((await executeHomeAction({id: 'bad', title: 'Bad', icon: 'open-in-new', type: 'externalUrl', url: 'not-a-url'}, deps)).status).toBe('failed');
    expect((await executeHomeAction({id: 'good', title: 'Good', icon: 'open-in-new', type: 'externalUrl', url: 'https://example.org/path'}, deps)).status).toBe('success');
    expect(deps.linking.openUrl).toHaveBeenCalledWith('https://example.org/path');
  });
  test.each([
    [{id: 'web', title: 'Web', icon: 'language', type: 'web', route: '/'} as HomeAction, 'webContent'],
    [{id: 'settings', title: 'Settings', icon: 'settings', type: 'nativeScreen', screen: 'settings'} as HomeAction, 'settings'],
    [{id: 'phone', title: 'Call', icon: 'phone', type: 'phone', phoneNumber: '+15550100'} as HomeAction, 'contact'],
    [{id: 'email', title: 'Email', icon: 'email', type: 'email', emailAddress: 'a@example.com'} as HomeAction, 'contact'],
    [{id: 'maps', title: 'Maps', icon: 'explore', type: 'maps', address: '1 Main St'} as HomeAction, 'location'],
  ])('rejects disabled %s action at execution time', async (action, feature) => {
    const config = {...defaultConfig, features: {...defaultConfig.features, [feature]: false}};
    const deps = dependencies({config});
    expect((await executeHomeAction(action, deps)).status).toBe('unsupported');
    expect(deps.navigate.openWebContent).not.toHaveBeenCalled();
    expect(deps.navigate.openNativeScreen).not.toHaveBeenCalled();
    expect(deps.linking.openUrl).not.toHaveBeenCalled();
  });
});
