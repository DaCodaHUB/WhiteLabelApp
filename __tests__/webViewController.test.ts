import {handleWebHardwareBack} from '../src/presentation/webview';

test('hardware back uses WebView history when available', () => {
  const goBack = jest.fn();
  expect(handleWebHardwareBack(true, goBack)).toBe(true);
  expect(goBack).toHaveBeenCalledTimes(1);
});

test('hardware back falls through when WebView has no history', () => {
  const goBack = jest.fn();
  expect(handleWebHardwareBack(false, goBack)).toBe(false);
  expect(goBack).not.toHaveBeenCalled();
});
