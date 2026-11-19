import {Platform, Share} from 'react-native';
import {clientConfig as demo} from '../clients/demo/client.config';
import {clientConfig as sampleCafe} from '../clients/sample-cafe/client.config';
import {createWebBridgeHandler} from '../src/app/webBridge';
import {reactNativeShareService} from '../src/infrastructure/sharing/ReactNativeShareService';

const page = 'https://dacodahub.github.io/mobile-demo/';
const request = JSON.stringify({
  version: 1, id: 'share-1', type: 'share', title: 'WhiteLabelApp',
  message: 'Explore the portfolio demo.', url: page,
});

function handler(config = demo) {
  return createWebBridgeHandler({
    config,
    sharing: reactNativeShareService,
    linking: {canOpenUrl: jest.fn(), openUrl: jest.fn()},
    navigation: {openNative: jest.fn()},
  });
}

const originalPlatform = Platform.OS;
afterEach(() => {
  Platform.OS = originalPlatform;
  jest.restoreAllMocks();
});

test('Demo forwards the title, text and URL to the Android chooser', async () => {
  Platform.OS = 'android';
  const share = jest.spyOn(Share, 'share').mockResolvedValue({action: Share.sharedAction});

  await expect(handler()(request, page)).resolves.toEqual({
    status: 'success', requestId: 'share-1', message: 'Share sheet opened.',
  });
  expect(share).toHaveBeenCalledWith({title: 'WhiteLabelApp', message: `Explore the portfolio demo.\n${page}`});
});

test('preserves an iOS dismissal and sends the URL separately', async () => {
  Platform.OS = 'ios';
  const share = jest.spyOn(Share, 'share').mockResolvedValue({action: Share.dismissedAction});

  await expect(handler()(request, page)).resolves.toEqual({
    status: 'cancelled', requestId: 'share-1', message: 'Sharing cancelled.',
  });
  expect(share).toHaveBeenCalledWith({title: 'WhiteLabelApp', message: 'Explore the portfolio demo.', url: page});
});

test('returns safe failure feedback for a rejected native share', async () => {
  jest.spyOn(Share, 'share').mockRejectedValue(new Error('private diagnostic'));
  await expect(handler()(request, page)).resolves.toEqual({
    status: 'failed', requestId: 'share-1', code: 'SHARE_UNAVAILABLE', message: 'Sharing is unavailable.',
  });
});

test('blocks sharing when the site, client, or action is unauthorized', async () => {
  const share = jest.spyOn(Share, 'share');
  await expect(handler()(request, 'https://outside.example')).resolves.toMatchObject({code: 'UNAUTHORIZED_PAGE'});
  await expect(handler(sampleCafe)(request, page)).resolves.toMatchObject({code: 'BRIDGE_DISABLED'});
  await expect(handler({...demo, webBridge: {enabled: true, allowedMessageTypes: [], maxMessageLength: 8192}})(request, page))
    .resolves.toMatchObject({code: 'MESSAGE_NOT_ALLOWED'});
  await expect(handler({...demo, features: {...demo.features, sharing: false}})(request, page))
    .resolves.toMatchObject({code: 'FEATURE_DISABLED'});
  expect(share).not.toHaveBeenCalled();
});

test('rejects invalid share payloads and unsupported action types without opening Share', async () => {
  const share = jest.spyOn(Share, 'share');
  const handle = handler();

  await expect(handle(JSON.stringify({version: 1, id: 'invalid', type: 'share', url: 'http://example.com'}), page))
    .resolves.toMatchObject({status: 'unsupported', code: 'INVALID_MESSAGE'});
  await expect(handle(JSON.stringify({version: 1, id: 'unknown', type: 'unknown'}), page))
    .resolves.toMatchObject({status: 'unsupported', code: 'INVALID_MESSAGE'});
  await expect(handle(JSON.stringify({version: 1, id: 'diagnostic', type: 'clearNotificationUser'}), page))
    .resolves.toMatchObject({status: 'unsupported', code: 'MESSAGE_NOT_ALLOWED', requestId: 'diagnostic'});
  expect(share).not.toHaveBeenCalled();
});
