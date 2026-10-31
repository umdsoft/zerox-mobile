// Jest umumiy setup: native modullar mock'lari (App.test.tsx va boshqa render testlari uchun).
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'), {virtual: false});

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
jest.mock('react-native-mmkv', () => {
  class MMKV {
    constructor() {
      this.store = new Map();
    }
    set(k, v) {
      this.store.set(k, v);
    }
    getString(k) {
      const v = this.store.get(k);
      return typeof v === 'string' ? v : undefined;
    }
    getNumber(k) {
      const v = this.store.get(k);
      return typeof v === 'number' ? v : undefined;
    }
    getBoolean(k) {
      const v = this.store.get(k);
      return typeof v === 'boolean' ? v : undefined;
    }
    delete(k) {
      this.store.delete(k);
    }
    contains(k) {
      return this.store.has(k);
    }
    getAllKeys() {
      return [...this.store.keys()];
    }
    clearAll() {
      this.store.clear();
    }
  }
  return {MMKV};
});

jest.mock('@react-native-firebase/app', () => ({__esModule: true, default: () => ({}), getApp: jest.fn()}));
jest.mock('@react-native-firebase/analytics', () => {
  const api = {logEvent: jest.fn(), logScreenView: jest.fn(), setUserId: jest.fn(), setAnalyticsCollectionEnabled: jest.fn()};
  return {__esModule: true, default: () => api, ...api, getAnalytics: () => api};
});
jest.mock('@react-native-firebase/crashlytics', () => {
  const api = {log: jest.fn(), recordError: jest.fn(), setUserId: jest.fn(), setCrashlyticsCollectionEnabled: jest.fn()};
  return {__esModule: true, default: () => api, ...api, getCrashlytics: () => api};
});
jest.mock('@react-native-firebase/messaging', () => {
  const api = {
    getToken: jest.fn(() => Promise.resolve('token')),
    onMessage: jest.fn(() => () => {}),
    onTokenRefresh: jest.fn(() => () => {}),
    onNotificationOpenedApp: jest.fn(() => () => {}),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBackgroundMessageHandler: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    hasPermission: jest.fn(() => Promise.resolve(1)),
  };
  return {__esModule: true, default: () => api, ...api, getMessaging: () => api};
});
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    onForegroundEvent: jest.fn(() => () => {}),
    onBackgroundEvent: jest.fn(),
    displayNotification: jest.fn(),
    createChannel: jest.fn(() => Promise.resolve('ch')),
    requestPermission: jest.fn(() => Promise.resolve({authorizationStatus: 1})),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBadgeCount: jest.fn(),
    cancelAllNotifications: jest.fn(),
  },
  AndroidImportance: {HIGH: 4, DEFAULT: 3},
  EventType: {PRESS: 1, DISMISSED: 0},
}));
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  ACCESSIBLE: {},
}));

// iOS MyID native moduli (src/helper yoki ekranlar modul yuklanishida NativeModules.MyIdModule.startMyId o'qiydi).
require('react-native').NativeModules.MyIdModule = {
  startMyId: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};
jest.mock('react-native-nitro-myid', () => ({
  __esModule: true,
  default: {},
  MyIdLocale: {UZ: 'uz', RU: 'ru', EN: 'en'},
  NitroMyid: {},
}), {virtual: false});

// Native-bog'liq kutubxonalar: render testi uchun bo'sh (Proxy) stublar.
const stubModule = () => {
  const fn = jest.fn(() => stubModule());
  return new Proxy(fn, {
    get: (t, p) => (p === '__esModule' ? true : p === 'default' ? stubModule() : p === 'then' ? undefined : t[p] || (t[p] = jest.fn(() => stubModule()))),
  });
};
[
  'react-native-otp-verify',
  'react-native-capture-protection',
  'react-native-vision-camera',
  'react-native-biometrics',
  'react-native-permissions',
  'react-native-share',
  'react-native-blob-util',
  'react-native-file-viewer',
  'react-native-fs',
  'react-native-html-to-pdf',
  'react-native-pdf',
  'react-native-view-shot',
  'react-native-background-timer',
  'react-native-date-picker',
  '@sayem314/react-native-keep-awake',
  'react-native-advanced-input-mask',
].forEach(name => jest.mock(name, () => stubModule()));
jest.mock('react-native-webview', () => ({WebView: 'WebView', default: 'WebView'}));
jest.mock('lottie-react-native', () => ({__esModule: true, default: 'LottieView'}));
jest.mock('@shopify/react-native-skia', () => new Proxy({}, {get: (_t, p) => (p === '__esModule' ? true : p)}));
jest.mock('react-native-pager-view', () => ({__esModule: true, default: 'PagerView'}));
