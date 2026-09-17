import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {defaultConfig} from '../src/app/config/defaultConfig';
import type {ClientConfig} from '../src/app/config/types';
import {ClientConfigProvider} from '../src/app/providers/ClientConfigProvider';
import {HomeScreen} from '../src/presentation/screens/HomeScreen';
import {ThemeProvider} from '../src/presentation/theme';
import {useHomeActionExecutor} from '../src/presentation/hooks/useHomeActionExecutor';

jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');
jest.mock('react-native-safe-area-context', () => { const {View} = require('react-native'); return {SafeAreaView: View}; });
jest.mock('../src/presentation/hooks/useHomeActionExecutor', () => ({useHomeActionExecutor: jest.fn()}));

const mockUseExecutor = jest.mocked(useHomeActionExecutor);
const execute = jest.fn(async () => undefined);

beforeEach(() => {
  execute.mockClear();
  mockUseExecutor.mockReturnValue({execute, executingActionId: undefined, errorMessage: undefined});
});

function renderHome(config: ClientConfig = defaultConfig) {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<ClientConfigProvider config={config}><ThemeProvider><HomeScreen /></ThemeProvider></ClientConfigProvider>); });
  if (!renderer) throw new Error('Renderer was not created.');
  return renderer;
}

test('renders configured home actions', () => {
  const renderer = renderHome();
  expect(renderer.root.findByProps({children: 'View Website'})).toBeTruthy();
  expect(renderer.root.findByProps({children: 'Settings'})).toBeTruthy();
});

test('renders the prepared client brand logo', () => {
  const logo = {uri: 'test-client-logo'};
  const config: ClientConfig = {...defaultConfig, branding: {...defaultConfig.branding, logo}};
  const renderer = renderHome(config);
  expect(renderer.root.findByProps({accessibilityLabel: 'White Label App logo'}).props.source).toEqual(logo);
});

test('pressing an action delegates to the executor', async () => {
  const renderer = renderHome();
  await ReactTestRenderer.act(async () => { await renderer.root.findByProps({accessibilityLabel: 'View Website'}).props.onPress(); });
  expect(execute).toHaveBeenCalledWith(defaultConfig.home.actions[0]);
});

test('shows a safe executor error and disables cards during execution', () => {
  mockUseExecutor.mockReturnValue({execute, executingActionId: 'website', errorMessage: 'This link could not be opened.'});
  const renderer = renderHome();
  expect(renderer.root.findByProps({children: 'This link could not be opened.'})).toBeTruthy();
  expect(renderer.root.findByProps({accessibilityLabel: 'View Website'}).props.disabled).toBe(true);
});

test('does not render disabled configured actions', () => {
  const action = defaultConfig.home.actions[0];
  if (!action) throw new Error('Expected a default action.');
  const config: ClientConfig = {...defaultConfig, home: {...defaultConfig.home, actions: [{...action, enabled: false}]}};
  const renderer = renderHome(config);
  expect(renderer.root.findAllByProps({accessibilityLabel: 'View Website'})).toHaveLength(0);
  expect(execute).not.toHaveBeenCalled();
});
