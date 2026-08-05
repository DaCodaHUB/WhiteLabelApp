import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {defaultConfig} from '../src/app/config/defaultConfig';
import {ClientConfigProvider} from '../src/app/providers/ClientConfigProvider';
import {useNotifications} from '../src/app/providers/NotificationProvider';
import {openApplicationSettings} from '../src/infrastructure/linking/ApplicationSettings';
import {NotificationPermissionCard} from '../src/presentation/notifications';
import {SettingsScreen} from '../src/presentation/screens/SettingsScreen';
import {ThemeProvider} from '../src/presentation/theme';

jest.mock('../src/app/providers/NotificationProvider', () => ({useNotifications: jest.fn()}));
jest.mock('../src/infrastructure/linking/ApplicationSettings', () => ({openApplicationSettings: jest.fn(async () => undefined)}));
jest.mock('react-native-safe-area-context', () => { const {View} = require('react-native'); return {SafeAreaView: View}; });

const mockUseNotifications = jest.mocked(useNotifications);
const requestPermission = jest.fn(async () => true);
const dismissPermissionPrompt = jest.fn();

function notificationValue(overrides: Partial<ReturnType<typeof useNotifications>> = {}): ReturnType<typeof useNotifications> {
  return {enabled: true, initialized: true, permissionState: 'notDetermined', canRequestPermission: true, requestPermission, identifyNotificationUser: jest.fn(), clearNotificationUser: jest.fn(), processPendingNotification: jest.fn(async () => undefined), permissionPromptDismissed: false, dismissPermissionPrompt, ...overrides};
}
function render(child: React.ReactNode) {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<ClientConfigProvider config={defaultConfig}><ThemeProvider>{child}</ThemeProvider></ClientConfigProvider>); });
  if (!renderer) throw new Error('Renderer was not created.'); return renderer;
}
beforeEach(() => { requestPermission.mockClear(); dismissPermissionPrompt.mockClear(); jest.mocked(openApplicationSettings).mockClear(); mockUseNotifications.mockReturnValue(notificationValue()); });

test('Allow invokes the explicit native permission request', async () => {
  const renderer = render(<NotificationPermissionCard />);
  await ReactTestRenderer.act(async () => { await renderer.root.findByProps({accessibilityLabel: 'Allow Notifications'}).props.onPress(); });
  expect(requestPermission).toHaveBeenCalledTimes(1); expect(dismissPermissionPrompt).toHaveBeenCalledTimes(1);
});
test('Not Now stores dismissal without requesting permission', () => {
  const renderer = render(<NotificationPermissionCard />);
  ReactTestRenderer.act(() => renderer.root.findByProps({accessibilityLabel: 'Not Now'}).props.onPress());
  expect(dismissPermissionPrompt).toHaveBeenCalledTimes(1); expect(requestPermission).not.toHaveBeenCalled();
});
test('a previously dismissed explanation does not reappear from Settings', async () => {
  mockUseNotifications.mockReturnValue(notificationValue({permissionPromptDismissed: true}));
  const renderer = render(<SettingsScreen />);
  await ReactTestRenderer.act(async () => { await renderer.root.findByProps({accessibilityLabel: 'Enable Notifications'}).props.onPress(); });
  expect(requestPermission).toHaveBeenCalledTimes(1);
  expect(renderer.root.findAllByProps({children: defaultConfig.notifications.permissionPrompt.title})).toHaveLength(0);
});
test('denied state exposes system settings behavior', async () => {
  mockUseNotifications.mockReturnValue(notificationValue({permissionState: 'denied', canRequestPermission: false}));
  const renderer = render(<SettingsScreen />);
  await ReactTestRenderer.act(async () => { await renderer.root.findByProps({accessibilityLabel: 'Open System Settings'}).props.onPress(); });
  expect(openApplicationSettings).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(renderer.toJSON())).toContain('Denied');
});
