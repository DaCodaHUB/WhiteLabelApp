import {serializeWebBridgeResponse, WEB_BRIDGE_RESPONSE_EVENT} from '../src/app/webBridge';

test('serializes a narrowly scoped response safely', () => {
  const script = serializeWebBridgeResponse({status: 'failed', requestId: `x'\\</script>`, code: 'EXECUTION_FAILED', message: 'Safe <message>'});
  expect(script).toContain(WEB_BRIDGE_RESPONSE_EVENT);
  expect(script).not.toContain('</script>');
  expect(script).toContain('\\u003c');
  expect(script.endsWith('true;')).toBe(true);
});
