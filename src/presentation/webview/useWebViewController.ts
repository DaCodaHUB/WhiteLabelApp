import {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, Platform} from 'react-native';
import type {WebView, WebViewNavigation} from 'react-native-webview';
import type {ExternalLinking} from '../../app/homeActions';
import {evaluateWebRequest} from './webRequestPolicy';
import type {WebViewErrorState} from './types';

export function handleWebHardwareBack(canGoBack: boolean, goBack: () => void): boolean {
  if (!canGoBack) return false;
  goBack();
  return true;
}

export function useWebViewController(initialUrl: string, allowedDomains: string[], linking: ExternalLinking) {
  const webViewRef = useRef<WebView<Record<never, never>>>(null);
  const canGoBackRef = useRef(false);
  const currentUrlRef = useRef(initialUrl);
  const externalLaunches = useRef(new Set<string>());
  const [isInitialLoading, setInitialLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<WebViewErrorState>();
  const [isRetrying, setRetrying] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => handleWebHardwareBack(canGoBackRef.current, () => webViewRef.current?.goBack()));
    return () => subscription.remove();
  }, []);

  const updateNavigation = useCallback((state: WebViewNavigation) => {
    canGoBackRef.current = state.canGoBack;
    currentUrlRef.current = state.url;
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setInitialLoading(false);
    setRetrying(false);
    setError({title, message});
  }, []);

  const openOutside = useCallback(async (url: string) => {
    if (externalLaunches.current.has(url)) return;
    externalLaunches.current.add(url);
    try {
      if (!(await linking.canOpenUrl(url))) {
        showError('Link unavailable', 'This link is not supported.');
        return;
      }
      await linking.openUrl(url);
    } catch {
      showError('Link unavailable', 'This link is not supported.');
    } finally {
      externalLaunches.current.delete(url);
    }
  }, [linking, showError]);

  const handleRequest = useCallback((url: string) => {
    const decision = evaluateWebRequest(url, allowedDomains);
    if (decision.type === 'allowInternal') return true;
    if (decision.type === 'openExternal' || decision.type === 'openSpecialScheme') {
      openOutside(decision.url);
    } else {
      showError('Link unavailable', decision.reason === 'insecure' ? 'This page is outside the permitted website.' : 'This link is not supported.');
    }
    return false;
  }, [allowedDomains, openOutside, showError]);

  const handleDownload = useCallback((url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        showError('Download unavailable', 'This download is not supported.');
        return;
      }
      openOutside(parsed.toString());
    } catch {
      showError('Download unavailable', 'This download is not supported.');
    }
  }, [openOutside, showError]);

  const retry = useCallback(() => {
    if (isRetrying) return;
    setError(undefined);
    setRetrying(true);
    setProgress(0);
    webViewRef.current?.reload();
  }, [isRetrying]);

  return {
    webViewRef, isInitialLoading, progress, error, isRetrying, retry, handleRequest,
    updateNavigation,
    getCurrentUrl: () => currentUrlRef.current,
    isCurrentMainFrame: (url: string) => url === currentUrlRef.current,
    onLoadStart: () => { setProgress(0); },
    onProgress: (value: number) => { setProgress(Math.max(0, Math.min(value, 1))); },
    onLoadEnd: () => { setInitialLoading(false); setRetrying(false); setProgress(1); },
    showMainFrameError: () => showError('Page unavailable', 'This page could not be loaded. Check your connection and try again.'),
    showRendererError: () => showError('Page unavailable', 'This page could not be loaded. Please try again.'),
    handleDownload,
  };
}
