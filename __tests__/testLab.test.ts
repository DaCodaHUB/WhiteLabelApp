import {clientConfig as demoClientConfig} from '../clients/demo/client.config';
import {executeTestLabAction} from '../src/development/testLab/executeTestLabAction';
import {isTestLabAvailable} from '../src/presentation/navigation/developmentGate';
import type {TestLabDependencies} from '../src/development/testLab/types';

function dependencies(): TestLabDependencies {
  return {
    config: demoClientConfig,
    linking: {canOpenUrl: jest.fn(async () => true), openUrl: jest.fn(async () => undefined)},
    homeNavigation: {openWebContent: jest.fn(), openNativeScreen: jest.fn()},
  };
}

test('Test Lab availability follows the development build guard', () => {
  expect(isTestLabAvailable(true)).toBe(true);
  expect(isTestLabAvailable(false)).toBe(false);
});

test('delegates the configured site and maps actions and blocks insecure URLs', async () => {
  const deps = dependencies();
  await executeTestLabAction('internalWebView', deps);
  await executeTestLabAction('maps', deps);
  expect(deps.homeNavigation.openWebContent).toHaveBeenCalledWith('https://dacodahub.github.io/mobile-demo/', 'Internal WebView');
  expect(deps.linking.openUrl).toHaveBeenCalledWith(demoClientConfig.contact.mapUrl);
  expect(await executeTestLabAction('blockedHttp', deps)).toEqual({status: 'rejected', detail: 'block'});
  expect(deps.linking.openUrl).toHaveBeenCalledTimes(1);
});

test('Test Lab internal web action also respects the WebContent flag', async () => {
  const deps = dependencies();
  deps.config = {...demoClientConfig, features: {...demoClientConfig.features, webContent: false}};
  expect(await executeTestLabAction('internalWebView', deps)).toMatchObject({status: 'unsupported'});
  expect(deps.homeNavigation.openWebContent).not.toHaveBeenCalled();
});

test('packaged demo configuration contains fictional contact data and no credentials', () => {
  expect(demoClientConfig.website.baseUrl).toBe('https://dacodahub.github.io');
  expect(demoClientConfig.website.allowedDomains).toEqual(['dacodahub.github.io']);
  expect(demoClientConfig.website.routes.home).toBe('/mobile-demo/');
  expect(demoClientConfig.contact.email?.endsWith('@dacodahub.github.io')).toBe(true);
  expect(demoClientConfig.contact.phone).toContain('555');
  expect(demoClientConfig.contact.address).toContain('Example');
  expect(JSON.stringify(demoClientConfig)).not.toMatch(/api[_-]?key|secret|credential/i);
});
