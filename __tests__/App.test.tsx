/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {WebView} from 'react-native-webview';
import App from '../App';
import {activeClientConfig} from '../src/generated/activeClient';

jest.mock('react-native-webview', () => ({WebView: jest.fn(() => null)}));
jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const safeArea = jest.requireActual('react-native-safe-area-context');
  const initialMetrics = {
    frame: {x: 0, y: 0, width: 360, height: 800},
    insets: {top: 0, left: 0, right: 0, bottom: 0},
  };
  return {
    ...safeArea,
    SafeAreaProvider: (props: object) =>
      ReactModule.createElement(safeArea.SafeAreaProvider, {...props, initialMetrics}),
  };
});

test('starts on the configured Home screen without mounting WebView', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  if (!renderer) throw new Error('App did not render.');
  try {
    const homeHeading = activeClientConfig.clientId === 'sample-cafe'
      ? 'Coffee made for slow mornings.'
      : activeClientConfig.home.title ?? activeClientConfig.appName;
    expect(renderer.root.findAllByProps({children: homeHeading}).length).toBeGreaterThan(0);
    expect(WebView).not.toHaveBeenCalled();
  } finally {
    const mountedApp = renderer;
    await ReactTestRenderer.act(() => mountedApp.unmount());
  }
});
