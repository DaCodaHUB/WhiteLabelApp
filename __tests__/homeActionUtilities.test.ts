import {buildEmailUrl, buildMapsUrl, normalizePhoneNumber} from '../src/app/homeActions';

describe('home action utilities', () => {
  test('normalizes phone display formatting and preserves a leading plus', () => {
    expect(normalizePhoneNumber('(415) 555-0123')).toBe('4155550123');
    expect(normalizePhoneNumber('+1 415-555-0123')).toBe('+14155550123');
  });
  test('rejects alphabetic phone values', () => {
    expect(normalizePhoneNumber('1-800-FLOWERS')).toBeNull();
  });
  test('encodes email subject and body', () => {
    expect(buildEmailUrl('hello@example.com', 'A question & answer', 'Line one?')).toBe('mailto:hello@example.com?subject=A+question+%26+answer&body=Line+one%3F');
  });
  test('encodes map addresses', () => {
    expect(buildMapsUrl('1 Main St, Los Angeles CA')).toContain('query=1%20Main%20St%2C%20Los%20Angeles%20CA');
  });
});
