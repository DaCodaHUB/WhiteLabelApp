import React, {useCallback, useRef} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {WebView} from 'react-native-webview';
import type {FileDownloadEvent, ShouldStartLoadRequest, WebViewErrorEvent, WebViewHttpErrorEvent, WebViewMessageEvent, WebViewOpenWindowEvent, WebViewProgressEvent} from 'react-native-webview/lib/WebViewTypes';
import {parseWebBridgeEventData, serializeWebBridgeResponse} from '../../app/webBridge';
import {reactNativeLinking} from '../../infrastructure/linking/ReactNativeLinking';
import {ErrorState, LoadingState, AppText} from '../components';
import {useAppTheme} from '../theme';
import type {AppWebViewProps} from './types';
import {useWebViewController} from './useWebViewController';

const DEDUPE_WINDOW_MS = 30_000;

export function AppWebView({initialUrl, allowedDomains, linking = reactNativeLinking, bridge}: AppWebViewProps) {
  const theme = useAppTheme();
  const controller = useWebViewController(initialUrl, allowedDomains, linking);
  const handledIds = useRef(new Map<string, number>());
  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    if (!bridge?.enabled) return;
    const data = event.nativeEvent.data;
    const parsed = parseWebBridgeEventData(data, bridge.maxMessageLength);
    const now = Date.now();
    if (parsed?.id) {
      const previous = handledIds.current.get(parsed.id);
      if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) return;
      handledIds.current.set(parsed.id, now);
      for (const [id, timestamp] of handledIds.current) {
        if (now - timestamp >= DEDUPE_WINDOW_MS) handledIds.current.delete(id);
      }
    }
    try {
      const result = await bridge.handleMessage(data, controller.getCurrentUrl());
      if (result.requestId) controller.webViewRef.current?.injectJavaScript(serializeWebBridgeResponse(result));
    } catch {
      // Bridge failures are intentionally silent in native UI.
    }
  }, [bridge, controller]);
  return (
    <View style={styles.root}>
      <WebView
        ref={controller.webViewRef}
        source={{uri: initialUrl}}
        originWhitelist={['https://*', 'tel:*', 'mailto:*', 'sms:*', 'about:*']}
        onShouldStartLoadWithRequest={(request: ShouldStartLoadRequest) => controller.handleRequest(request.url)}
        onNavigationStateChange={controller.updateNavigation}
        onMessage={onMessage}
        onLoadStart={controller.onLoadStart}
        onLoadProgress={(event: WebViewProgressEvent) => controller.onProgress(event.nativeEvent.progress)}
        onLoadEnd={controller.onLoadEnd}
        onError={(_event: WebViewErrorEvent) => controller.showMainFrameError()}
        onHttpError={(event: WebViewHttpErrorEvent) => { if (event.nativeEvent.statusCode >= 400 && controller.isCurrentMainFrame(event.nativeEvent.url)) controller.showMainFrameError(); }}
        onOpenWindow={(event: WebViewOpenWindowEvent) => controller.handleRequest(event.nativeEvent.targetUrl)}
        {...(Platform.OS === 'ios' ? {
          onContentProcessDidTerminate: controller.showRendererError,
          onFileDownload: (event: FileDownloadEvent) => controller.handleDownload(event.nativeEvent.downloadUrl),
          pullToRefreshEnabled: true,
        } : {onRenderProcessGone: controller.showRendererError})}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        incognito={false}
        cacheEnabled
        mixedContentMode="never"
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        mediaPlaybackRequiresUserAction
        javaScriptCanOpenWindowsAutomatically={false}
        setSupportMultipleWindows={false}
        webviewDebuggingEnabled={__DEV__}
        overScrollMode="content"
        style={styles.webView}
      />
      {controller.progress < 1 && <View testID="web-progress" style={[styles.progressTrack, {backgroundColor: theme.colors.border}]}><View style={[styles.progress, {backgroundColor: theme.colors.primary, width: `${controller.progress * 100}%`}]} /></View>}
      {controller.isInitialLoading && !controller.error && <View style={[styles.overlay, {backgroundColor: theme.colors.background}]}><LoadingState message="Loading page" /></View>}
      {controller.error && <View style={[styles.overlay, {backgroundColor: theme.colors.background}]}><ErrorState title={controller.error.title} message={controller.error.message} onRetry={controller.retry} />{controller.isRetrying && <AppText color="textSecondary">Retrying…</AppText>}</View>}
    </View>
  );
}

const styles = StyleSheet.create({root: {flex: 1}, webView: {flex: 1}, overlay: {bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, alignItems: 'center', justifyContent: 'center', padding: 16}, progressTrack: {height: 2, left: 0, position: 'absolute', right: 0, top: 0}, progress: {height: 2}});
