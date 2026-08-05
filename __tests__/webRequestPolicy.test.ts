import {evaluateWebRequest} from '../src/presentation/webview';

const domains = ['example.com'];

describe('evaluateWebRequest', () => {
  test.each([
    ['https://example.com/page', 'allowInternal'],
    ['https://account.example.com/page', 'allowInternal'],
    ['https://example.com.evil.test', 'openExternal'],
    ['https://unrelated.test', 'openExternal'],
    ['tel:+14155550123', 'openSpecialScheme'],
    ['mailto:hello@example.com', 'openSpecialScheme'],
    ['sms:+14155550123', 'openSpecialScheme'],
    ['https://maps.google.com/?q=address', 'openExternal'],
    ['not a URL', 'block'],
    ['http://example.com', 'block'],
    ['custom-scheme://value', 'block'],
    ['about:blank', 'allowInternal'],
  ])('%s resolves to %s', (url, expected) => {
    expect(evaluateWebRequest(url, domains).type).toBe(expected);
  });
});
