/**
 * SEC (2026-11-02): useAppStateListener — fon -> faol qaytishda qulf (hook darajasidagi test).
 */
import React from 'react';
import { AppState } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

const mockMem = new Map<string, any>();
let mockRoute = 'Home';
let mockHasPin = true;
const mockNav = {
  reset: jest.fn(),
  dispatch: jest.fn(),
  getState: jest.fn(() => ({ routes: [], index: 0 })),
};

jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => mockMem.set(k, v),
    getNumber: (k: string) => (typeof mockMem.get(k) === 'number' ? mockMem.get(k) : undefined),
    getString: (k: string) => (typeof mockMem.get(k) === 'string' ? mockMem.get(k) : undefined),
    getBoolean: (k: string) => (typeof mockMem.get(k) === 'boolean' ? mockMem.get(k) : undefined),
    delete: (k: string) => mockMem.delete(k),
  },
}));
jest.mock('../src/store/api/token/pin', () => ({ hasPin: () => mockHasPin }));
jest.mock('react-redux', () => ({ useDispatch: () => jest.fn() }));
jest.mock('../src/store/reducers/HomeReducer', () => ({ setAppState: (x: any) => x }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNav,
  DrawerActions: { closeDrawer: () => ({ type: 'closeDrawer' }) },
}));
jest.mock('../src/navigation/NavigationRef', () => ({
  navigationRef: {
    current: {
      getCurrentRoute: () => ({ name: mockRoute }),
      getRootState: () => ({ routes: [{ name: 'StackNavigator' }], index: 0 }),
    },
  },
}));

import useAppStateListener from '../src/hooks/useAppStateListener';
import { beginExternalFlow, isExternalFlowActive } from '../src/helper/externalFlow';

let handler: (s: string) => void = () => {};
let now = 1_000_000;
const Harness = () => {
  useAppStateListener();
  return null;
};

const mount = () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<Harness />);
  });
  return r;
};
const send = (s: string, at: number) => {
  now = at;
  act(() => handler(s));
};

describe('useAppStateListener: fon -> faol qulf', () => {
  let r: TestRenderer.ReactTestRenderer;
  beforeEach(() => {
    mockMem.clear();
    mockRoute = 'Home';
    mockHasPin = true;
    mockNav.reset.mockClear();
    mockNav.dispatch.mockClear();
    mockMem.set('token', 't');
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, h: any) => {
      handler = h;
      return { remove: () => {} };
    }) as any);
    r = mount();
  });
  afterEach(() => {
    act(() => r.unmount());
    jest.restoreAllMocks();
  });

  test('grace dan uzoq fonda tursa: SetLocalPassword\'ga reset + appLocked + nav-holat saqlanadi', () => {
    send('background', 1_000_000);
    send('active', 1_000_000 + 20_000);
    expect(mockNav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'SetLocalPassword' }] });
    expect(mockMem.get('appLocked')).toBe(true);
    expect(mockMem.get('preLockNavState')).toContain('StackNavigator');
    expect(mockMem.has('lastBackgroundTime')).toBe(false);
  });

  test('grace ichida: qulf yo\'q', () => {
    send('background', 1_000_000);
    send('active', 1_000_000 + 3_000);
    expect(mockNav.reset).not.toHaveBeenCalled();
    expect(mockMem.get('appLocked')).toBeUndefined();
  });

  test('iOS inactive -> active (Face ID oynasi): qulf yo\'q va tashqi-oqim bayrog\'i sarflanmaydi', () => {
    beginExternalFlow();
    send('inactive', 1_000_000);
    send('active', 1_000_000 + 60_000);
    expect(mockNav.reset).not.toHaveBeenCalled();
    expect(isExternalFlowActive(now)).toBe(true);
  });

  test('tashqi faoliyat (picker/MyID) qaytishi: qulf yo\'q, bayroq bir martalik sarflanadi', () => {
    beginExternalFlow();
    send('background', 1_000_000);
    send('active', 1_000_000 + 120_000);
    expect(mockNav.reset).not.toHaveBeenCalled();
    expect(isExternalFlowActive(now)).toBe(false);
    // keyingi oddiy chiqish-qaytish — qulflanadi
    send('background', now + 1_000);
    send('active', now + 60_000);
    expect(mockNav.reset).toHaveBeenCalledTimes(1);
  });

  test('qulf/tiklash ekranida (ResetPassCode): reset YO\'Q, lekin appLocked yoqiladi, preLockNavState ustiga yozilmaydi', () => {
    mockRoute = 'ResetPassCode';
    mockMem.set('appLocked', true); // haqiqiy qulf oqimi: lock ekranidan boshlangan
    mockMem.set('preLockNavState', 'OLD');
    send('background', 1_000_000);
    send('active', 1_000_000 + 60_000);
    expect(mockNav.reset).not.toHaveBeenCalled();
    expect(mockMem.get('appLocked')).toBe(true);
    expect(mockMem.get('preLockNavState')).toBe('OLD');
  });

  test('OCHIQ holatda ChangeLocalPassword (Securitydan): grace dan keyin SetLocalPassword reset, qaytish joyi sifatida saqlanmaydi', () => {
    mockRoute = 'ChangeLocalPassword';
    mockMem.set('preLockNavState', 'OLD');
    send('background', 1_000_000);
    send('active', 1_000_000 + 60_000);
    expect(mockNav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'SetLocalPassword' }] });
    expect(mockMem.get('appLocked')).toBe(true);
    expect(mockMem.get('preLockNavState')).toBe('OLD');
  });

  test('OCHIQ holatda RecoveryPassword (Securitydan): reset qilinadi', () => {
    mockRoute = 'RecoveryPassword';
    send('background', 1_000_000);
    send('active', 1_000_000 + 60_000);
    expect(mockNav.reset).toHaveBeenCalledTimes(1);
    expect(mockMem.get('appLocked')).toBe(true);
  });

  test('PIN ornatilgach biometrik opt-in (SetLocalPassword, ochiq): grace dan keyin QULFLANADI', () => {
    mockRoute = 'SetLocalPassword';
    mockMem.set('appLocked', false);
    send('background', 1_000_000);
    send('active', 1_000_000 + 60_000);
    expect(mockNav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'SetLocalPassword' }] });
    expect(mockMem.get('appLocked')).toBe(true);
  });

  test('allaqachon qulfda (appLocked) oddiy ekranda: preLockNavState ustiga yozilmaydi', () => {
    mockMem.set('appLocked', true);
    mockMem.set('preLockNavState', 'OLD');
    send('background', 1_000_000);
    send('active', 1_000_000 + 60_000);
    expect(mockNav.reset).toHaveBeenCalledTimes(1);
    expect(mockMem.get('preLockNavState')).toBe('OLD');
  });

  test('soat orqaga surilgan: tashqi-oqim bayrog\'i bo\'lsa ham qulflaydi (fail-closed)', () => {
    beginExternalFlow();
    send('background', 2_000_000);
    send('active', 1_500_000);
    expect(mockNav.reset).toHaveBeenCalledTimes(1);
  });

  test('sessiya yo\'q (chiqib ketgan) yoki PIN yo\'q: qulf yo\'q', () => {
    mockMem.delete('token');
    send('background', 1_000_000);
    send('active', 1_000_000 + 60_000);
    expect(mockNav.reset).not.toHaveBeenCalled();
    mockMem.set('token', 't');
    mockHasPin = false;
    send('background', now + 1);
    send('active', now + 60_000);
    expect(mockNav.reset).not.toHaveBeenCalled();
  });
});
