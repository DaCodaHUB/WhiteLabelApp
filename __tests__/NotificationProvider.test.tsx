import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type {ClientConfig} from '../src/app/config/types';
import {defaultConfig} from '../src/app/config/defaultConfig';
import {ClientConfigProvider} from '../src/app/providers/ClientConfigProvider';
import {NotificationProvider, useNotifications} from '../src/app/providers/NotificationProvider';
import type {NotificationPermissionState, NotificationService} from '../src/domain/services/NotificationService';

function service(): NotificationService {
  return {initialize: jest.fn(), requestPermission: jest.fn(async () => true), getPermissionState: jest.fn(async () => 'notDetermined'), canRequestPermission: jest.fn(async () => true), addNotificationClickListener: jest.fn(() => jest.fn()), addPermissionChangeListener: jest.fn(() => jest.fn()), login: jest.fn(), logout: jest.fn()};
}
function config(enabled: boolean, appId?: string): ClientConfig { return {...defaultConfig, notifications: {...defaultConfig.notifications, ...(appId ? {oneSignalAppId: appId} : {})}, features: {...defaultConfig.features, notifications: enabled}}; }
let context: ReturnType<typeof useNotifications> | undefined;
function Consumer() { context = useNotifications(); return null; }
async function render(configValue: ClientConfig, notificationService: NotificationService) {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => { renderer = ReactTestRenderer.create(<ClientConfigProvider config={configValue}><NotificationProvider service={notificationService}><Consumer /></NotificationProvider></ClientConfigProvider>); });
  if (!renderer || !context) throw new Error('Provider did not render.');
  return {renderer, value: context};
}

test('disabled or missing-App-ID configuration does not initialize', async () => {
  const disabledService = service(); await render(config(false), disabledService); expect(disabledService.initialize).not.toHaveBeenCalled();
  const missingService = service(); await render(config(true), missingService); expect(missingService.initialize).not.toHaveBeenCalled();
});
test('initializes once, registers lifecycle listeners, and never requests permission at startup', async () => {
  const notificationService = service();
  const {renderer} = await render(config(true, 'test-app-id'), notificationService);
  expect(notificationService.initialize).toHaveBeenCalledTimes(1);
  expect(notificationService.requestPermission).not.toHaveBeenCalled();
  expect(notificationService.addNotificationClickListener).toHaveBeenCalledTimes(1);
  const removeClick = jest.mocked(notificationService.addNotificationClickListener).mock.results[0]?.value;
  const removePermission = jest.mocked(notificationService.addPermissionChangeListener).mock.results[0]?.value;
  ReactTestRenderer.act(() => renderer.unmount());
  expect(removeClick).toHaveBeenCalled(); expect(removePermission).toHaveBeenCalled();
});
test('explicit permission and identity methods delegate safely', async () => {
  const notificationService = service(); const {value} = await render(config(true, 'test-app-id'), notificationService);
  await ReactTestRenderer.act(async () => { await value.requestPermission(); });
  expect(notificationService.requestPermission).toHaveBeenCalledTimes(1);
  value.identifyNotificationUser('  stable-user-1  '); value.clearNotificationUser();
  expect(notificationService.login).toHaveBeenCalledWith('stable-user-1'); expect(notificationService.logout).toHaveBeenCalled();
  expect(() => value.identifyNotificationUser(' ')).toThrow('1 to 128');
});
test('permission listener updates exposed state', async () => {
  const notificationService = service(); await render(config(true, 'test-app-id'), notificationService);
  const listener = jest.mocked(notificationService.addPermissionChangeListener).mock.calls[0]?.[0];
  if (!listener) throw new Error('Missing listener.');
  await ReactTestRenderer.act(async () => listener('authorized' as NotificationPermissionState));
  expect(context?.permissionState).toBe('authorized');
});
