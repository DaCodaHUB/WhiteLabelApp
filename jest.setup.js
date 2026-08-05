jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    initialize: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    Notifications: {
      requestPermission: jest.fn(() => Promise.resolve(false)),
      permissionNative: jest.fn(() => Promise.resolve(0)),
      getPermissionAsync: jest.fn(() => Promise.resolve(false)),
      canRequestPermission: jest.fn(() => Promise.resolve(true)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  },
  OSNotificationPermission: {NotDetermined: 0, Denied: 1, Authorized: 2, Provisional: 3, Ephemeral: 4},
}));

const mockMmkvValues = new Map();
jest.mock('react-native-mmkv', () => ({createMMKV: jest.fn(() => ({
  getString: jest.fn(key => mockMmkvValues.get(key)),
  set: jest.fn((key, value) => mockMmkvValues.set(key, value)),
  remove: jest.fn(key => mockMmkvValues.delete(key)),
  clearAll: jest.fn(() => mockMmkvValues.clear()),
}))}));

jest.mock('react-native-webview', () => {
  const {View} = require('react-native');
  return {WebView: View};
});

jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');
