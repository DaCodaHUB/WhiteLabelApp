import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {defaultConfig} from '../src/app/config/defaultConfig';
import {ClientConfigProvider} from '../src/app/providers/ClientConfigProvider';
import {WebContentScreen} from '../src/presentation/screens/WebContentScreen';
import {ThemeProvider} from '../src/presentation/theme';

jest.mock('react-native-webview', () => ({WebView: 'WebView'}));

test('renders the validated URL supplied through route parameters', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  const route = {key: 'web-content', name: 'WebContent' as const, params: {url: 'https://example.com/services', title: 'Services'}};
  ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<ClientConfigProvider config={defaultConfig}><ThemeProvider><WebContentScreen route={route} /></ThemeProvider></ClientConfigProvider>); });
  if (!renderer) throw new Error('Renderer was not created.');
  expect(renderer.root.find(node => node.props.source?.uri === 'https://example.com/services')).toBeTruthy();
});
