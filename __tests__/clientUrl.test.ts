import {buildClientUrl, isAllowedClientUrl} from '../src/app/config/url';

describe('client URL utilities', () => {
  test.each([
    ['https://example.com', 'booking', 'https://example.com/booking'],
    ['https://example.com/', '/booking', 'https://example.com/booking'],
    ['https://example.com/app/', '/booking', 'https://example.com/app/booking'],
  ])('joins %s and %s', (baseUrl, route, expected) => {
    expect(buildClientUrl(baseUrl, route)).toBe(expected);
  });

  test('allows an exact domain match', () => {
    expect(isAllowedClientUrl('https://example.com/path', ['example.com'])).toBe(true);
  });

  test('allows a subdomain at a hostname boundary', () => {
    expect(isAllowedClientUrl('https://booking.example.com', ['example.com'])).toBe(true);
  });

  test('rejects a malicious lookalike domain', () => {
    expect(isAllowedClientUrl('https://fakeexample.com', ['example.com'])).toBe(false);
    expect(isAllowedClientUrl('https://example.com.evil.test', ['example.com'])).toBe(false);
  });

  test('rejects malformed URLs', () => {
    expect(isAllowedClientUrl('not a URL', ['example.com'])).toBe(false);
    expect(() => buildClientUrl('not a URL', '/home')).toThrow('Invalid URL');
  });
});
