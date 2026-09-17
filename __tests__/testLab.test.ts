import {clientConfig as demoClientConfig} from '../clients/demo/client.config';
import {executeTestLabAction} from '../src/development/testLab/executeTestLabAction';
import {isTestLabAvailable} from '../src/presentation/navigation/developmentGate';
import type {TestLabDependencies} from '../src/development/testLab/types';

function dependencies(): TestLabDependencies {
  return {
    config: demoClientConfig,
    linking: {canOpenUrl: jest.fn(async () => true), openUrl: jest.fn(async () => undefined)},
    homeNavigation: {openWebContent: jest.fn(), openNativeScreen: jest.fn()},
    notificationNavigation: {isReady: jest.fn(() => true), openHome: jest.fn(), openWebContent: jest.fn(), openNative: jest.fn()},
  };
}

test('Test Lab availability follows the development build guard', () => {
  expect(isTestLabAvailable(true)).toBe(true);
  expect(isTestLabAvailable(false)).toBe(false);
});

test('actions delegate to existing home and notification navigation services', async () => {
  const deps = dependencies();
  deps.config = {...demoClientConfig, features: {...demoClientConfig.features, notifications: true}};
  await executeTestLabAction('allowedRoute', deps);
  await executeTestLabAction('phone', deps);
  await executeTestLabAction('settings', deps);
  await executeTestLabAction('notificationWeb', deps);
  await executeTestLabAction('notificationNative', deps);
  await executeTestLabAction('notificationHome', deps);

  expect(deps.homeNavigation.openWebContent).toHaveBeenCalledWith('https://dacodahub.github.io/', 'Allowed client route');
  expect(deps.linking.openUrl).toHaveBeenCalledWith('tel:+12025550199');
  expect(deps.homeNavigation.openNativeScreen).toHaveBeenCalledWith('settings');
  expect(deps.notificationNavigation.openWebContent).toHaveBeenCalledWith('https://dacodahub.github.io/', 'Example services');
  expect(deps.notificationNavigation.openNative).toHaveBeenCalledWith('settings');
  expect(deps.notificationNavigation.openHome).toHaveBeenCalled();
});

test('demo Test Lab notification buttons cannot route while notifications are disabled', async () => {
  const deps = dependencies();
  expect(await executeTestLabAction('notificationWeb', deps)).toMatchObject({status: 'ignored', detail: 'notifications-disabled'});
  expect(deps.notificationNavigation.openWebContent).not.toHaveBeenCalled();
});

test('Test Lab internal web action also respects the WebContent flag', async () => {
  const deps = dependencies();
  deps.config = {...demoClientConfig, features: {...demoClientConfig.features, webContent: false}};
  expect(await executeTestLabAction('internalWebView', deps)).toMatchObject({status: 'unsupported'});
  expect(deps.homeNavigation.openWebContent).not.toHaveBeenCalled();
});

test('malformed notification payload does not navigate', async () => {
  const deps = dependencies();
  expect(await executeTestLabAction('notificationMalformed', deps)).toMatchObject({status: 'ignored', detail: 'invalid-payload'});
  expect(deps.notificationNavigation.openHome).not.toHaveBeenCalled();
  expect(deps.notificationNavigation.openWebContent).not.toHaveBeenCalled();
  expect(deps.notificationNavigation.openNative).not.toHaveBeenCalled();
});

test('packaged demo configuration contains fictional contact data and no credentials', () => {
  expect(demoClientConfig.website.baseUrl).toBe('https://dacodahub.github.io');
  expect(demoClientConfig.website.allowedDomains).toEqual(['dacodahub.github.io']);
  expect(demoClientConfig.website.routes.home).toBe('/mobile-demo/');
  expect(demoClientConfig.contact.email?.endsWith('@dacodahub.github.io')).toBe(true);
  expect(demoClientConfig.contact.phone).toContain('555');
  expect(demoClientConfig.contact.address).toContain('Example');
  expect('oneSignalAppId' in demoClientConfig.notifications).toBe(false);
  expect(JSON.stringify(demoClientConfig)).not.toMatch(/api[_-]?key|secret|credential/i);
});
