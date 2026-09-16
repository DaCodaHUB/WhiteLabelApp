import {TurboModuleRegistry, type TurboModule} from 'react-native';

interface RandomValuesModule extends TurboModule {
  getRandomBase64(byteLength: number): string;
}

// A native-generated capability is only installed in the top frame. Android's
// WebView may expose its raw message interface to iframes and report the top
// URL for those messages, so the event URL alone cannot authorize them.
export function createMainFrameBridgeCapability(): string | undefined {
  // Use the native module directly. Its public polyfill intentionally falls
  // back to Math.random in remote debugging, which is unsuitable for a secret.
  try {
    const capability = TurboModuleRegistry.get<RandomValuesModule>('RNGetRandomValues')?.getRandomBase64(32);
    return capability && capability.length === 44 ? capability : undefined;
  } catch {
    return undefined;
  }
}

export function mainFrameBridgeScript(capability: string): string {
  return `(function () {
    if (window.top !== window) return;
    var capability = ${JSON.stringify(capability)};
    window.WhiteLabelBridge = {
      postMessage: function (data) {
        if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== 'function') return;
        window.ReactNativeWebView.postMessage(JSON.stringify({capability: capability, data: String(data)}));
      }
    };
  })(); true;`;
}

export function authorizedBridgeData(value: string, capability: string, maxMessageLength: number): string | null {
  if (value.length > maxMessageLength * 6 + 256) return null;
  try {
    const envelope: unknown = JSON.parse(value);
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return null;
    const {capability: supplied, data} = envelope as Record<string, unknown>;
    return supplied === capability && typeof data === 'string' && data.length <= maxMessageLength ? data : null;
  } catch {
    return null;
  }
}
