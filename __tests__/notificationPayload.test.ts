import {parseNotificationPayload} from '../src/app/notifications';

describe('parseNotificationPayload', () => {
  test.each([
    [{version: 1, type: 'openWeb', route: '/specials', title: 'Specials'}, 'openWeb'],
    [{version: 1, type: 'openNative', destination: 'settings'}, 'openNative'],
    [{version: 1, type: 'openExternal', url: 'https://example.org/path'}, 'openExternal'],
    [{version: 1, type: 'home'}, 'home'],
  ])('parses valid payload %#', (value, type) => expect(parseNotificationPayload(value)?.type).toBe(type));

  test.each([
    {version: 2, type: 'home'},
    {version: 1},
    'payload',
    [{version: 1, type: 'home'}],
    {version: 1, type: 'openExternal', url: 'http://example.org'},
    {version: 1, type: 'openNative', destination: 'Admin'},
    {version: 1, type: 'openWeb', route: `/${'a'.repeat(1024)}`},
  ])('rejects invalid payload %#', value => expect(parseNotificationPayload(value)).toBeNull());

  test('ignores unknown extra fields on an otherwise valid payload', () => {
    expect(parseNotificationPayload({version: 1, type: 'home', campaign: 'generic'})).toEqual({version: 1, type: 'home'});
  });
});
