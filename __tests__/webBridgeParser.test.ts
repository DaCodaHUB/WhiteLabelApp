import {parseWebBridgeEventData, parseWebBridgeMessage} from '../src/app/webBridge';

describe('web bridge parser', () => {
  test.each([
    [{version: 1, type: 'openPhone', phoneNumber: ' +1 555 0100 '}, 'openPhone'],
    [{version: 1, type: 'openEmail', emailAddress: 'hello@example.com', subject: 'Hello', body: 'Body'}, 'openEmail'],
    [{version: 1, type: 'openMap', mapUrl: 'https://maps.example.com/location'}, 'openMap'],
    [{version: 1, type: 'openExternal', url: 'https://outside.test'}, 'openExternal'],
    [{version: 1, type: 'share', message: 'Hello'}, 'share'],
    [{version: 1, type: 'openNative', destination: 'settings'}, 'openNative'],
  ])('accepts valid message %#', (value, type) => expect(parseWebBridgeMessage(value)?.type).toBe(type));

  test('retired identity data never enters the executable message', () => {
    expect(parseWebBridgeMessage({version: 1, id: 'legacy', type: 'identifyNotificationUser', externalId: 'private-id'}))
      .toEqual({type: 'retired', id: 'legacy'});
    expect(parseWebBridgeMessage({version: 1, id: 'x'.repeat(129), type: 'clearNotificationUser'})).toBeNull();
  });

  test.each([
    ['{', 8192],
    ['[]', 8192],
    [JSON.stringify({version: 2, type: 'openPhone'}), 8192],
    [JSON.stringify({version: 1, type: 'unknown'}), 8192],
    [JSON.stringify({version: 1, type: 'openPhone', phoneNumber: 123}), 8192],
    [JSON.stringify({version: 1, type: 'openExternal', url: 'http://outside.test'}), 8192],
    [JSON.stringify({version: 1, type: 'openNative', destination: 'Admin'}), 8192],
    [JSON.stringify({version: 1, type: 'openEmail', subject: 'x'.repeat(257)}), 8192],
    [JSON.stringify({version: 1, type: 'openEmail', body: 'x'.repeat(4001)}), 8192],
    [JSON.stringify({version: 1, type: 'share', message: 'x'.repeat(100)}), 20],
  ])('rejects invalid event data %#', (data, max) => expect(parseWebBridgeEventData(data, max)).toBeNull());
});
