import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as vm from 'vm';
import {StyleSheet, TurboModuleRegistry} from 'react-native';
import {defaultConfig} from '../src/app/config/defaultConfig';
import {ClientConfigProvider} from '../src/app/providers/ClientConfigProvider';
import type {ExternalLinking} from '../src/app/homeActions';
import {ThemeProvider} from '../src/presentation/theme';
import {AppWebView} from '../src/presentation/webview';
import {createMainFrameBridgeCapability, mainFrameBridgeScript} from '../src/presentation/webview/mainFrameBridge';

const mockCapability = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
jest.spyOn(TurboModuleRegistry, 'get').mockReturnValue({getRandomBase64: () => mockCapability} as never);

const mockReload = jest.fn();
const mockInjectJavaScript = jest.fn();
jest.mock('react-native-webview', () => {
  const ReactModule = require('react');
  const {View} = require('react-native');
  return {
    WebView: ReactModule.forwardRef((props: Record<string, unknown>, ref: React.Ref<{reload: () => void; goBack: () => void; injectJavaScript: (script: string) => void}>) => {
      ReactModule.useImperativeHandle(ref, () => ({reload: mockReload, goBack: jest.fn(), injectJavaScript: mockInjectJavaScript}));
      return ReactModule.createElement(View, props);
    }),
  };
});

function renderWebView(linking: ExternalLinking = {canOpenUrl: jest.fn(async () => true), openUrl: jest.fn(async () => undefined)}, bridge?: React.ComponentProps<typeof AppWebView>['bridge']) {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<ClientConfigProvider config={defaultConfig}><ThemeProvider><AppWebView initialUrl="https://example.com" allowedDomains={['example.com']} linking={linking} bridge={bridge} /></ThemeProvider></ClientConfigProvider>); });
  if (!renderer) throw new Error('Renderer was not created.');
  return renderer;
}

function webNode(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.find(node => node.props.source?.uri === 'https://example.com');
}

test('shows initial loading and responds to progress', () => {
  const renderer = renderWebView();
  expect(renderer.root.findByProps({accessibilityLabel: 'Loading page'})).toBeTruthy();
  ReactTestRenderer.act(() => webNode(renderer).props.onLoadProgress({nativeEvent: {progress: 0.5}}));
  expect(renderer.root.find(node => StyleSheet.flatten(node.props.style)?.width === '50%')).toBeTruthy();
});

test('allows internal links and prevents external links from loading', async () => {
  const linking = {canOpenUrl: jest.fn(async () => true), openUrl: jest.fn(async () => undefined)};
  const renderer = renderWebView(linking);
  expect(webNode(renderer).props.onShouldStartLoadWithRequest({url: 'https://example.com/page'})).toBe(true);
  expect(webNode(renderer).props.onShouldStartLoadWithRequest({url: 'https://outside.test'})).toBe(false);
  await ReactTestRenderer.act(async () => {});
  expect(linking.openUrl).toHaveBeenCalledWith('https://outside.test/');
});

test('main-frame error displays safe feedback and retry reloads', () => {
  mockReload.mockClear();
  const renderer = renderWebView();
  ReactTestRenderer.act(() => webNode(renderer).props.onError({nativeEvent: {}}));
  expect(renderer.root.findByProps({children: 'This page could not be loaded. Check your connection and try again.'})).toBeTruthy();
  ReactTestRenderer.act(() => renderer.root.findByProps({accessibilityLabel: 'Try again'}).props.onPress());
  expect(mockReload).toHaveBeenCalledTimes(1);
  expect(renderer.root.findAllByProps({children: 'This page could not be loaded. Check your connection and try again.'})).toHaveLength(0);
});

test('external linking failure shows safe feedback', async () => {
  const linking = {canOpenUrl: jest.fn(async () => false), openUrl: jest.fn(async () => undefined)};
  const renderer = renderWebView(linking);
  webNode(renderer).props.onShouldStartLoadWithRequest({url: 'https://outside.test'});
  await ReactTestRenderer.act(async () => {});
  expect(renderer.root.findByProps({children: 'This link is not supported.'})).toBeTruthy();
});

test('prevents duplicate external launches while one is pending', async () => {
  let resolveAvailability: ((value: boolean) => void) | undefined;
  const linking = {canOpenUrl: jest.fn(() => new Promise<boolean>(resolve => { resolveAvailability = resolve; })), openUrl: jest.fn(async () => undefined)};
  const renderer = renderWebView(linking);
  webNode(renderer).props.onShouldStartLoadWithRequest({url: 'https://outside.test'});
  webNode(renderer).props.onShouldStartLoadWithRequest({url: 'https://outside.test'});
  expect(linking.canOpenUrl).toHaveBeenCalledTimes(1);
  resolveAvailability?.(true);
  await ReactTestRenderer.act(async () => {});
});

test('delegates bridge messages, deduplicates IDs, and injects responses only for IDs', async () => {
  mockInjectJavaScript.mockClear();
  const handleMessage = jest.fn(async (data: string) => {
    const parsed: unknown = JSON.parse(data);
    const id = typeof parsed === 'object' && parsed !== null && 'id' in parsed && typeof parsed.id === 'string' ? parsed.id : undefined;
    return id ? {status: 'success' as const, requestId: id} : {status: 'success' as const};
  });
  const renderer = renderWebView(undefined, {enabled: true, maxMessageLength: 8192, handleMessage});
  const message = {nativeEvent: {url: 'https://example.com', data: JSON.stringify({capability: mockCapability, data: JSON.stringify({version: 1, id: 'request-1', type: 'openPhone'})})}};
  await ReactTestRenderer.act(async () => { await webNode(renderer).props.onMessage(message); await webNode(renderer).props.onMessage(message); });
  expect(handleMessage).toHaveBeenCalledTimes(1);
  expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(async () => { await webNode(renderer).props.onMessage({nativeEvent: {url: 'https://example.com', data: JSON.stringify({capability: mockCapability, data: JSON.stringify({version: 1, type: 'openPhone'})})}}); });
  expect(handleMessage).toHaveBeenCalledTimes(2);
  expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);
});

test('rejects untrusted frames, disallowed origins, and messages without the main-frame capability', async () => {
  const handleMessage = jest.fn(async () => ({status: 'success' as const}));
  const renderer = renderWebView(undefined, {enabled: true, maxMessageLength: 8192, handleMessage});
  const payload = JSON.stringify({version: 1, type: 'openPhone'});
  const authorized = JSON.stringify({capability: mockCapability, data: payload});
  const send = async (data: string, url: string) => webNode(renderer).props.onMessage({nativeEvent: {data, url}});
  await ReactTestRenderer.act(async () => {
    await send(payload, 'https://example.com');
    await send(JSON.stringify({capability: 'guessed', data: payload}), 'https://example.com');
    await send(authorized, 'https://outside.test/frame');
    await send(authorized, 'about:blank');
    await send('{', 'https://example.com');
    await send(JSON.stringify({capability: mockCapability, data: '{'}), 'https://example.com');
  });
  expect(handleMessage).toHaveBeenCalledTimes(1);
  expect(handleMessage).toHaveBeenCalledWith('{', 'https://example.com');
});

test('installs the bridge API only in the top frame', () => {
  const sent: string[] = [];
  const topFrame: Record<string, unknown> = {ReactNativeWebView: {postMessage: (value: string) => sent.push(value)}};
  topFrame.top = topFrame;
  const childFrame: Record<string, unknown> = {top: topFrame, ReactNativeWebView: {postMessage: (value: string) => sent.push(value)}};
  const script = mainFrameBridgeScript('test-capability');
  vm.runInNewContext(script, {window: topFrame});
  vm.runInNewContext(script, {window: childFrame});
  expect(childFrame.WhiteLabelBridge).toBeUndefined();
  (topFrame.WhiteLabelBridge as {postMessage: (value: string) => void}).postMessage('{"version":1,"type":"openPhone"}');
  expect(JSON.parse(sent[0] as string)).toEqual({capability: 'test-capability', data: '{"version":1,"type":"openPhone"}'});
});

test('fails closed if native secure randomness is unavailable', () => {
  jest.mocked(TurboModuleRegistry.get).mockReturnValueOnce(null);
  expect(createMainFrameBridgeCapability()).toBeUndefined();
});

test('does not process messages when bridge is disabled', async () => {
  const handleMessage = jest.fn(async () => ({status: 'success' as const}));
  const renderer = renderWebView(undefined, {enabled: false, maxMessageLength: 8192, handleMessage});
  await ReactTestRenderer.act(async () => { await webNode(renderer).props.onMessage({nativeEvent: {data: '{}'}}); });
  expect(handleMessage).not.toHaveBeenCalled();
});
