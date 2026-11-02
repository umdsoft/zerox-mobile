/**
 * SEC (2026-11-02): qulf oqimlari — NavigationRef.navigate, linking kechiktirish + qayta ochish,
 * fail-closed, UpdateLocalPassCode (PIN tiklash) qulfni yechishi.
 */
import React from 'react';
import { Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

const mockMem = new Map<string, any>();
let mockHasPin = true;
let mockStorageBroken = false;
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockDispatch = jest.fn();
const mockNav = {
  navigate: (...a: unknown[]) => mockNavigate(...a),
  reset: (...a: unknown[]) => mockReset(...a),
  dispatch: (...a: unknown[]) => mockDispatch(...a),
};

const guard = <T,>(fn: () => T): T => {
  if (mockStorageBroken) throw new Error('mmkv');
  return fn();
};
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => guard(() => mockMem.set(k, v)),
    getNumber: (k: string) => guard(() => (typeof mockMem.get(k) === 'number' ? mockMem.get(k) : undefined)),
    getString: (k: string) => guard(() => (typeof mockMem.get(k) === 'string' ? mockMem.get(k) : undefined)),
    getBoolean: (k: string) => guard(() => (typeof mockMem.get(k) === 'boolean' ? mockMem.get(k) : undefined)),
    delete: (k: string) => guard(() => mockMem.delete(k)),
  },
}));
jest.mock('../src/store/api/token/pin', () => ({ hasPin: () => mockHasPin, setPin: jest.fn(), verifyPin: jest.fn() }));
jest.mock('../src/store/api/token/pinLockout', () => ({ attemptPin: jest.fn(), formatRemaining: () => '' }));
jest.mock('../src/helper/forceLogout', () => ({ forceLogout: jest.fn() }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNav,
  StackActions: { replace: (name: string) => ({ type: 'replace', name }) },
  DrawerActions: { closeDrawer: () => ({ type: 'closeDrawer' }) },
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => () => null);
jest.mock('../src/screens/home/redesign/icons', () => ({ BackspaceIcon: () => null, LockIcon: () => null }));

import { navigate, navigationRef } from '../src/navigation/NavigationRef';
import { getInitialURLGuarded, subscribeGuarded } from '../src/navigation/linkingLock';
import {
  PENDING_TTL_MS,
  applyColdStartLock,
  consumePendingDeepLink,
  deferDeepLink,
  isAppLocked,
  routeFromUrl,
} from '../src/helper/appLockState';
import { useUnlockNavigation } from '../src/screens/auth/setLocalPassword/useUnlockNavigation';
import UpdateLocalPassCode from '../src/screens/auth/UpdateLocalPassCode';

const reset = () => {
  mockMem.clear();
  mockHasPin = true;
  mockStorageBroken = false;
  mockNavigate.mockClear();
  mockReset.mockClear();
  mockDispatch.mockClear();
  mockMem.set('token', 't');
};

describe('NavigationRef.navigate qulfda', () => {
  const refNavigate = jest.fn();
  beforeEach(() => {
    reset();
    refNavigate.mockClear();
    (navigationRef as any).current = { navigate: refNavigate };
  });
  afterEach(() => {
    (navigationRef as any).current = null;
  });

  test('ochiq: navigatsiya bajariladi', () => {
    navigate('Notification');
    expect(refNavigate).toHaveBeenCalledWith('Notification', undefined);
  });
  test('appLocked: navigatsiya bloklanadi', () => {
    mockMem.set('appLocked', true);
    navigate('Notification');
    expect(refNavigate).not.toHaveBeenCalled();
  });
  test('warm qaytish ("active"dan OLDIN, grace o\'tgan): bloklanadi; grace ichida — yo\'q', () => {
    mockMem.set('lastBackgroundTime', Date.now() - 60_000);
    navigate('Notification');
    expect(refNavigate).not.toHaveBeenCalled();
    mockMem.set('lastBackgroundTime', Date.now() - 2_000);
    navigate('Notification');
    expect(refNavigate).toHaveBeenCalledTimes(1);
  });
});

describe('linking: qulfda KECHIKTIRISH va qulf ochilgach qayta ochish', () => {
  beforeEach(reset);
  afterEach(() => jest.restoreAllMocks());

  test('sovuq start (qulf): getInitialURL null, URL kechiktiriladi', async () => {
    mockMem.set('appLocked', true);
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue('zeroxuz://UserMoneyResult');
    expect(await getInitialURLGuarded()).toBeNull();
    expect(consumePendingDeepLink()?.route).toBe('UserMoneyResult');
    expect(consumePendingDeepLink()).toBeNull(); // bir martalik
  });
  test('ochiq: URL o\'tkaziladi', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue('zeroxuz://Click');
    expect(await getInitialURLGuarded()).toBe('zeroxuz://Click');
  });
  test('subscribe: qulfda listener chaqirilmaydi va kechiktiriladi; ochiqda chaqiriladi', () => {
    let cb: (e: { url: string }) => void = () => {};
    jest.spyOn(Linking, 'addEventListener').mockImplementation(((_: string, h: any) => {
      cb = h;
      return { remove: () => {} };
    }) as any);
    const listener = jest.fn();
    subscribeGuarded(listener);
    mockMem.set('appLocked', true);
    cb({ url: 'https://zerox.uz/Click' });
    expect(listener).not.toHaveBeenCalled();
    expect(consumePendingDeepLink()?.route).toBe('Click');
    mockMem.set('appLocked', false);
    cb({ url: 'zeroxuz://Click' });
    expect(listener).toHaveBeenCalledWith('zeroxuz://Click');
  });
  test('noma\'lum yo\'nalish kechiktirilmaydi, TTL o\'tgach tashlanadi', () => {
    expect(routeFromUrl('zeroxuz://Evil')).toBeNull();
    deferDeepLink('zeroxuz://Evil');
    expect(consumePendingDeepLink()).toBeNull();
    deferDeepLink('zeroxuz://UserMoneyResult');
    expect(consumePendingDeepLink(Date.now() + PENDING_TTL_MS + 1000)).toBeNull();
  });
  test('qulf ochilgach (restoreAfterUnlock) kechiktirilgan deep-link PARAMETRLARI bilan ochiladi', () => {
    deferDeepLink('zeroxuz://Click?type=1&title=Hello%20World');
    let api!: ReturnType<typeof useUnlockNavigation>;
    const H = () => {
      api = useUnlockNavigation();
      return null;
    };
    act(() => {
      TestRenderer.create(<H />);
    });
    act(() => api.restoreAfterUnlock());
    expect(mockReset).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('Click', { type: '1', title: 'Hello World' });
  });
});

describe('fail-closed', () => {
  beforeEach(reset);

  test('storage xato bersa isAppLocked() true (sessiyani aniqlab bo\'lmaydi)', () => {
    mockStorageBroken = true;
    expect(isAppLocked()).toBe(true);
  });
  test('applyColdStartLock xatoda qulflaydi', () => {
    mockStorageBroken = true;
    expect(applyColdStartLock()).toBe(true);
  });
  test('sessiya yo\'q: isAppLocked() false', () => {
    mockMem.delete('token');
    expect(isAppLocked()).toBe(false);
  });
  test('sovuq start eskirgan pendingNavigation\'ni tozalaydi, yangi PRESS\'ni saqlaydi', () => {
    mockMem.set('pendingNavigation', 'x');
    applyColdStartLock();
    expect(mockMem.has('pendingNavigation')).toBe(false);
    mockMem.set('pendingNavigation', 'x');
    mockMem.set('pendingNavigationAt', Date.now());
    applyColdStartLock();
    expect(mockMem.has('pendingNavigation')).toBe(true);
  });
});

describe('UpdateLocalPassCode (PIN tiklash) qulfni yechadi', () => {
  beforeEach(() => {
    reset();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  const press = (r: TestRenderer.ReactTestRenderer, digit: string) => {
    const txt = r.root.findAll(n => (n.type as any) === 'Text' && [].concat(n.props.children).join('') === digit)[0];
    let n: any = txt;
    while (n && !n.props.onPress) n = n.parent;
    act(() => n.props.onPress());
  };

  test('yangi PIN ikki marta kiritilgach: appLocked=false, saqlangan holat tiklanadi', () => {
    mockMem.set('appLocked', true);
    mockMem.set('preLockNavState', JSON.stringify({ routes: [{ name: 'X' }], index: 0 }));
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<UpdateLocalPassCode />);
    });
    for (let k = 0; k < 2; k++) ['1', '2', '3', '4'].forEach(d => press(r, d));
    expect(mockMem.get('appLocked')).toBe(true); // toast ko'rsatilayotganda hali
    act(() => {
      jest.advanceTimersByTime(1500 + 600);
    });
    expect(mockMem.get('appLocked')).toBe(false);
    expect(mockReset).toHaveBeenCalledWith({ routes: [{ name: 'X' }], index: 0 });
  });
});
