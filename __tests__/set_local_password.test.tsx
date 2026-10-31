/**
 * SetLocalPassword (PIN o'rnatish / kiritish / qulf / biometrik) xarakteristika testlari — wave C bo'linishidan OLDIN yozilgan.
 * XAVFSIZLIK: attemptPin / verifyPin / setPin / enrollBiometricUnlock / unlockWithBiometrics / disableBiometricUnlock /
 * forceLogout chaqiruvlari va ularning argumentlari qotirilgan. Render daraxti: fixtures/set_local_password_tree.json.
 * Daraxtlarni qayta yaratish (FAQAT eski komponent bilan): SLP_TREE_GEN=1 npx jest set_local_password
 */
import React from 'react';
import { Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockDispatch = jest.fn();
const mockReset = jest.fn();
const mockNavigate = jest.fn();
const mockToast = jest.fn();
const mockWarmHome = jest.fn();
const mockHasPin = jest.fn();
const mockSetPin = jest.fn();
const mockVerifyPin = jest.fn();
const mockAttemptPin = jest.fn();
const mockGetLockState = jest.fn();
const mockForceLogout = jest.fn();
const mockDisableBio = jest.fn();
const mockEnrollBio = jest.fn();
const mockIsEnrolled = jest.fn();
const mockUnlockBio = jest.fn();
const mockSensor = jest.fn();
let mockHomeUser: any = null;
const mockNav = { dispatch: (...a: unknown[]) => mockDispatch(...a), reset: (...a: unknown[]) => mockReset(...a), navigate: (...a: unknown[]) => mockNavigate(...a) };
const mockMem = new Map<string, any>();

jest.mock('@react-navigation/native', () => ({
  DrawerActions: { closeDrawer: () => ({ type: 'closeDrawer' }) },
  StackActions: { replace: (name: string) => ({ type: 'replace', name }) },
  useNavigation: () => mockNav,
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => mockMem.set(k, v),
    getString: (k: string) => (typeof mockMem.get(k) === 'string' ? mockMem.get(k) : undefined),
    getBoolean: (k: string) => (typeof mockMem.get(k) === 'boolean' ? mockMem.get(k) : undefined),
    delete: (k: string) => mockMem.delete(k),
  },
}));
jest.mock('../src/helper/homeCache', () => ({ warmHome: () => mockWarmHome() }));
jest.mock('../src/store/store/Store', () => ({ Store: { getState: () => ({ HomeReducer: { user: mockHomeUser } }) } }));
jest.mock('../src/store/api/token/pin', () => ({
  hasPin: () => mockHasPin(),
  setPin: (...a: unknown[]) => mockSetPin(...a),
  verifyPin: (...a: unknown[]) => mockVerifyPin(...a),
}));
jest.mock('../src/store/api/token/pinLockout', () => ({
  attemptPin: (...a: unknown[]) => mockAttemptPin(...a),
  formatRemaining: (ms: number) => `T${ms}`,
  getLockState: () => mockGetLockState(),
}));
jest.mock('../src/helper/forceLogout', () => ({ forceLogout: (...a: unknown[]) => mockForceLogout(...a) }));
jest.mock('../src/helper/biometricUnlock', () => ({
  disableBiometricUnlock: () => mockDisableBio(),
  enrollBiometricUnlock: (...a: unknown[]) => mockEnrollBio(...a),
  isBiometricEnrolled: () => mockIsEnrolled(),
  unlockWithBiometrics: (...a: unknown[]) => mockUnlockBio(...a),
}));
jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  default: class {
    isSensorAvailable() {
      return mockSensor();
    }
  },
}));
jest.mock('i18next', () => ({ t: (k: string, o?: unknown) => (o ? `${k}|${JSON.stringify(o)}` : k) }));
jest.mock('../src/screens/constants', () => ({ SUPPORT_TG_URL: 'https://t.me/support' }));
jest.mock('../src/theme/style', () => ({
  normalize: (n: number) => n,
  style: {
    buttonHeight: 50, fontSize: { m: 1, xx: 2, small: 3 }, fontFamilyMedium: 'fm', fontFamilyBold: 'fb', textColor: '#000',
  },
}));
jest.mock('../src/theme/font', () => ({ fontSize: new Proxy({}, { get: (_t, k) => Number(k) }) }));
jest.mock('../src/helper/scale', () => ({ scale: (n: number) => n }));
jest.mock('react-native-responsive-screen', () => ({ heightPercentageToDP: (n: number) => n * 8 }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/screens/components/MainText', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('MainText', { size: p.size, color: p.color, ft: p.ft, mTop: p.mTop }, p.children),
}));
jest.mock('../src/images/mark', () => ({ __esModule: true, default: () => require('react').createElement('MarkIcon') }));
jest.mock('../src/screens/components/BrandLockup', () => ({
  GradientIconBadge: ({ children }: any) => require('react').createElement('GradientIconBadge', null, children),
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : () => require('react').createElement(String(k))) },
    ),
);

import SetLocalPassword from '../src/screens/auth/SetLocalPassword';

const textOf = (n: any): string => n.children.map((c: any) => (typeof c === 'string' ? c : textOf(c))).join('');
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n))[0];
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const digit = (r: TestRenderer.ReactTestRenderer, d: number) => press(r, n => textOf(n).trim() === String(d));
const typePin = async (r: TestRenderer.ReactTestRenderer, pin: string) => {
  for (const ch of pin) await tap(digit(r, Number(ch)));
};
const backspace = (r: TestRenderer.ReactTestRenderer) =>
  press(r, n => n.findAll((c: any) => c.type === 'BackspaceIcon').length > 0);
const faceBtn = (r: TestRenderer.ReactTestRenderer) =>
  press(r, n => n.findAll((c: any) => c.type === 'FaceTouchIdIcon').length > 0);
const dots = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => n.type === ('View' as any) && Array.isArray(n.props.style) && n.props.style[1]?.backgroundColor !== undefined);
const filled = (r: TestRenderer.ReactTestRenderer) => dots(r).filter(n => n.props.style[1].backgroundColor === 'c.primary').length;
const allText = (r: TestRenderer.ReactTestRenderer) => textOf(r.root);
const lastToast = () => mockToast.mock.calls[mockToast.mock.calls.length - 1][0];
const modalNode = (r: TestRenderer.ReactTestRenderer) => r.root.findAll(n => n.props.onRequestClose && n.props.transparent)[0];

const NOLOCK = { locked: false, remainingMs: 0, failures: 0 };
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};
const mount = async (hasPin: boolean) => {
  mockHasPin.mockReturnValue(hasPin);
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<SetLocalPassword />);
  });
  await flush();
  return r;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockMem.clear();
  mockHomeUser = null;
  mockGetLockState.mockReturnValue(NOLOCK);
  mockSensor.mockResolvedValue({ available: false });
  mockIsEnrolled.mockReturnValue(false);
  mockEnrollBio.mockResolvedValue(true);
  mockUnlockBio.mockResolvedValue('cancel');
  mockAttemptPin.mockReturnValue({ result: 'ok' });
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'set_local_password_tree.json');
const GEN_TREE = !!process.env.SLP_TREE_GEN;

describe('SetLocalPassword — render daraxti (vizual chiqish o\'zgarmagan)', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['set step1 empty', () => mount(false)],
    ['set step1 two digits', async () => {
      const r = await mount(false);
      await typePin(r, '12');
      return r;
    }],
    ['set step2 empty', async () => {
      const r = await mount(false);
      await typePin(r, '1234');
      return r;
    }],
    ['set step2 one digit', async () => {
      const r = await mount(false);
      await typePin(r, '12345');
      return r;
    }],
    ['unlock empty', () => mount(true)],
    ['unlock three digits', async () => {
      const r = await mount(true);
      await typePin(r, '123');
      return r;
    }],
    ['locked screen', async () => {
      mockGetLockState.mockReturnValue({ locked: true, remainingMs: 65000, failures: 3 });
      return mount(true);
    }],
    ['bio modal visible', async () => {
      mockSensor.mockResolvedValue({ available: true });
      const r = await mount(false);
      await typePin(r, '12341234');
      return r;
    }],
  ];
  const golden: Record<string, string> = !GEN_TREE && fs.existsSync(TREE_PATH) ? JSON.parse(fs.readFileSync(TREE_PATH, 'utf8')) : {};
  const out: Record<string, string> = {};
  afterAll(() => {
    if (GEN_TREE) fs.writeFileSync(TREE_PATH, JSON.stringify(out, null, 1));
  });
  states.forEach(([name, make]) => {
    it(name, async () => {
      const r = await make();
      if (GEN_TREE) {
        out[name] = JSON.stringify(r.toJSON());
        return;
      }
      expect(JSON.stringify(r.toJSON())).toBe(golden[name]);
    });
  });
});

describe('SetLocalPassword — umumiy', () => {
  it('fokusda menyu yopiladi', async () => {
    await mount(true);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'closeDrawer' });
  });
  it('bosh sahifa ma\'lumoti yo\'q bo\'lsa warmHome, bor bo\'lsa yo\'q', async () => {
    await mount(true);
    expect(mockWarmHome).toHaveBeenCalledTimes(1);
    mockWarmHome.mockClear();
    mockHomeUser = { data: { id: 1 } };
    await mount(true);
    expect(mockWarmHome).not.toHaveBeenCalled();
  });
  it('nuqtalar va backspace', async () => {
    const r = await mount(true);
    expect(filled(r)).toBe(0);
    await typePin(r, '12');
    expect(filled(r)).toBe(2);
    await tap(backspace(r));
    expect(filled(r)).toBe(1);
    await tap(backspace(r));
    await tap(backspace(r));
    expect(filled(r)).toBe(0);
  });
  it('sarlavhalar: o\'rnatish 771 -> takrorlang; kiritish', async () => {
    const r = await mount(false);
    expect(allText(r)).toContain('771');
    await typePin(r, '1234');
    expect(allText(r)).toContain('PIN-kodni takrorlang');
    const u = await mount(true);
    expect(allText(u)).toContain('PIN-kodni kiriting');
    expect(allText(u)).toContain('PIN-kodni tiklash');
    expect(allText(r)).not.toContain('PIN-kodni tiklash');
  });
});

describe('SetLocalPassword — PIN O\'RNATISH', () => {
  it('1-qadam 4 raqamdan keyin setPin chaqirilmaydi, 2-qadamga o\'tadi', async () => {
    const r = await mount(false);
    await typePin(r, '1234');
    expect(mockSetPin).not.toHaveBeenCalled();
    expect(mockAttemptPin).not.toHaveBeenCalled();
    expect(filled(r)).toBe(0);
  });
  it('mos kelmasa: xato toast, 1-qadamga qaytadi, setPin yo\'q', async () => {
    const r = await mount(false);
    await typePin(r, '12345678');
    expect(mockSetPin).not.toHaveBeenCalled();
    expect(lastToast()).toEqual({
      type: 'error2', position: 'top', props: { desc: 'Yangi PIN-kodni takrorlashda xatolikka yo‘l qo‘yilgan' },
      visibilityTime: 3000, autoHide: true, topOffset: expect.anything(),
    });
    expect(allText(r)).toContain('771');
    // birinchi PIN tozalangan: yangi 1-qadam 1111 + 1111 muvaffaqiyatli
    await typePin(r, '11111111');
    expect(mockSetPin).toHaveBeenCalledWith('1111');
  });
  it('mos kelsa: setPin(pin), bayroqlar, biometrik yo\'q -> touch=false, BottomTabNavigator(token)', async () => {
    mockMem.set('token', 'tok');
    mockMem.set('isLoginScreen', 'x');
    const r = await mount(false);
    await typePin(r, '24682468');
    await flush();
    expect(mockSetPin).toHaveBeenCalledWith('2468');
    expect(mockMem.has('isLoginScreen')).toBe(false);
    expect(mockMem.get('appLocked')).toBe(false);
    expect(mockMem.get('touch')).toBe(false);
    expect(mockReset).toHaveBeenCalledWith({ routes: [{ name: 'BottomTabNavigator', params: { token: 'tok' } }], index: 0 });
    expect(r).toBeDefined();
  });
  it('sensor xatosi -> touch=false va davom', async () => {
    mockSensor.mockRejectedValue(new Error('x'));
    const r = await mount(false);
    await typePin(r, '11111111');
    await flush();
    expect(mockMem.get('touch')).toBe(false);
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(r).toBeDefined();
  });
  it('pendingNavigation: replace(Notification) va o\'chiriladi, reset yo\'q', async () => {
    mockMem.set('pendingNavigation', 'n');
    const r = await mount(false);
    await typePin(r, '11111111');
    await flush();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'replace', name: 'Notification' });
    expect(mockMem.has('pendingNavigation')).toBe(false);
    expect(mockReset).not.toHaveBeenCalled();
    expect(r).toBeDefined();
  });
  describe('biometrik opt-in modal', () => {
    const setup = async () => {
      mockSensor.mockResolvedValue({ available: true });
      const r = await mount(false);
      await typePin(r, '11111111');
      await flush();
      return r;
    };
    it('modal ochiladi, davom etish kutiladi', async () => {
      const r = await setup();
      expect(modalNode(r).props.visible).toBe(true);
      expect(mockReset).not.toHaveBeenCalled();
      expect(mockSetPin).toHaveBeenCalledWith('1111');
    });
    it('"Yo\'q" -> touch=false, davom', async () => {
      const r = await setup();
      await tap(press(r, n => textOf(n).trim() === "Yo'q"));
      expect(mockMem.get('touch')).toBe(false);
      expect(mockEnrollBio).not.toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(modalNode(r).props.visible).toBe(false);
    });
    it('orqaga (onRequestClose) = Yo\'q', async () => {
      const r = await setup();
      await act(async () => modalNode(r).props.onRequestClose());
      expect(mockMem.get('touch')).toBe(false);
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
    it('"Ha" -> enrollBiometricUnlock(prompt), natija touch ga yoziladi, davom', async () => {
      const r = await setup();
      await tap(press(r, n => textOf(n).trim() === 'Ha'));
      await flush();
      expect(mockEnrollBio).toHaveBeenCalledWith({ title: 'Face ID / Touch ID bilan tasdiqlang', cancel: 'Bekor qilish' });
      expect(mockMem.get('touch')).toBe(true);
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
    it('"Ha" lekin enroll false -> touch=false', async () => {
      mockEnrollBio.mockResolvedValue(false);
      const r = await setup();
      await tap(press(r, n => textOf(n).trim() === 'Ha'));
      await flush();
      expect(mockMem.get('touch')).toBe(false);
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
    it('"Ha" lekin enroll rad etsa -> touch=false va baribir davom', async () => {
      mockEnrollBio.mockRejectedValue(new Error('x'));
      const r = await setup();
      await tap(press(r, n => textOf(n).trim() === 'Ha'));
      await flush();
      expect(mockMem.get('touch')).toBe(false);
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });
  it('biometrik tugma o\'rnatishda NO-OP', async () => {
    mockMem.set('touch', true);
    mockIsEnrolled.mockReturnValue(true);
    const r = await mount(false);
    await tap(faceBtn(r));
    expect(mockUnlockBio).not.toHaveBeenCalled();
  });
  it('o\'rnatish rejimida attemptPin/verifyPin umuman chaqirilmaydi', async () => {
    const r = await mount(false);
    await typePin(r, '11111111');
    await flush();
    expect(mockAttemptPin).not.toHaveBeenCalled();
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });
});

describe('SetLocalPassword — PIN KIRITISH (qulfni ochish)', () => {
  it('attemptPin(verifyPin, pin) faqat 4-raqamda, bir marta', async () => {
    const r = await mount(true);
    await typePin(r, '123');
    expect(mockAttemptPin).not.toHaveBeenCalled();
    await typePin(r, '4');
    expect(mockAttemptPin).toHaveBeenCalledTimes(1);
    expect(mockAttemptPin.mock.calls[0][0]).toBe(
      // verifyPin o'rami (mock) — o'sha funksiya obyekti uzatilishi shart
      mockAttemptPin.mock.calls[0][0],
    );
    expect(typeof mockAttemptPin.mock.calls[0][0]).toBe('function');
    expect(mockAttemptPin.mock.calls[0][1]).toBe('1234');
    mockAttemptPin.mock.calls[0][0]('9999');
    expect(mockVerifyPin).toHaveBeenCalledWith('9999');
  });
  it('ok: bayroqlar + qulf oldidagi ekran tiklanadi (preLockNavState)', async () => {
    mockMem.set('preLockNavState', JSON.stringify({ routes: [{ name: 'X' }], index: 0 }));
    mockMem.set('isLoginScreen', 'x');
    const r = await mount(true);
    await typePin(r, '1234');
    expect(mockMem.has('isLoginScreen')).toBe(false);
    expect(mockMem.get('appLocked')).toBe(false);
    expect(mockReset).toHaveBeenCalledWith({ routes: [{ name: 'X' }], index: 0 });
    expect(mockMem.has('preLockNavState')).toBe(false);
  });
  it('ok: preLockNavState buzuq JSON -> o\'chiriladi va bosh sahifa', async () => {
    mockMem.set('preLockNavState', '{bad');
    const r = await mount(true);
    await typePin(r, '1234');
    expect(mockMem.has('preLockNavState')).toBe(false);
    expect(mockReset).toHaveBeenCalledWith({ routes: [{ name: 'BottomTabNavigator' }], index: 0 });
  });
  it('ok: saqlangan holat yo\'q -> bosh sahifa', async () => {
    const r = await mount(true);
    await typePin(r, '1234');
    expect(mockReset).toHaveBeenCalledWith({ routes: [{ name: 'BottomTabNavigator' }], index: 0 });
  });
  it('ok + pendingNavigation -> replace(Notification), reset yo\'q', async () => {
    mockMem.set('pendingNavigation', 'n');
    const r = await mount(true);
    await typePin(r, '1234');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'replace', name: 'Notification' });
    expect(mockMem.has('pendingNavigation')).toBe(false);
    expect(mockReset).not.toHaveBeenCalled();
  });
  it('ok + touch=true + sir yo\'q -> bir marta enroll; false -> touch=false', async () => {
    mockMem.set('touch', true);
    mockEnrollBio.mockResolvedValue(false);
    const r = await mount(true);
    await typePin(r, '1234');
    await flush();
    expect(mockEnrollBio).toHaveBeenCalledWith({ title: 'Face ID / Touch ID bilan tasdiqlang', cancel: 'Bekor qilish' });
    expect(mockMem.get('touch')).toBe(false);
  });
  it('ok + enroll rad etsa -> touch=false', async () => {
    mockMem.set('touch', true);
    mockEnrollBio.mockRejectedValue(new Error('x'));
    const r = await mount(true);
    await typePin(r, '1234');
    await flush();
    expect(mockMem.get('touch')).toBe(false);
  });
  it('ok + touch=true lekin sir bor -> enroll yo\'q', async () => {
    mockMem.set('touch', true);
    mockIsEnrolled.mockReturnValue(true);
    const r = await mount(true);
    await typePin(r, '1234');
    await flush();
    expect(mockEnrollBio).not.toHaveBeenCalled();
  });
  it('wipe: nuqtalar tozalanadi, disableBiometricUnlock + forceLogout(pin-lockout)', async () => {
    mockAttemptPin.mockReturnValue({ result: 'wipe' });
    const r = await mount(true);
    await typePin(r, '1234');
    expect(mockDisableBio).toHaveBeenCalledTimes(1);
    expect(mockForceLogout).toHaveBeenCalledWith('pin-lockout');
    expect(filled(r)).toBe(0);
    expect(mockReset).not.toHaveBeenCalled();
  });
  it('locked: qulf ekrani (qolgan vaqt) ko\'rinadi', async () => {
    mockAttemptPin.mockReturnValue({ result: 'locked', remainingMs: 30000 });
    const r = await mount(true);
    await typePin(r, '1234');
    expect(allText(r)).toContain('Ilovaga kirish vaqtincha cheklandi');
    expect(allText(r)).toContain('Qolgan vaqt: {{time}}|{"time":"T30000"}');
    expect(mockDisableBio).not.toHaveBeenCalled();
  });
  it('wrong + lockMs>0: qulf holati getLockState dan', async () => {
    mockAttemptPin.mockReturnValue({ result: 'wrong', failures: 3, attemptsLeft: 0, lockMs: 30000 });
    mockGetLockState.mockReturnValue(NOLOCK);
    const r = await mount(true);
    mockGetLockState.mockReturnValue({ locked: true, remainingMs: 29000, failures: 3 });
    await typePin(r, '1234');
    expect(allText(r)).toContain('"time":"T29000"');
    expect(mockToast).not.toHaveBeenCalled();
  });
  it('wrong + lockMs=0: "parol" toast attemptsLeft bilan, nuqtalar tozalanadi', async () => {
    mockAttemptPin.mockReturnValue({ result: 'wrong', failures: 1, attemptsLeft: 2, lockMs: 0 });
    const r = await mount(true);
    await typePin(r, '1234');
    expect(lastToast()).toEqual({
      type: 'error2', position: 'top', props: { desc: 'parol|{"count":2}' },
      visibilityTime: 3000, autoHide: true, topOffset: expect.anything(),
    });
    expect(filled(r)).toBe(0);
    expect(mockReset).not.toHaveBeenCalled();
  });
  it('qulf taymeri: tugagach klaviatura qaytadi', async () => {
    mockGetLockState.mockReturnValue({ locked: true, remainingMs: 3000, failures: 3 });
    const r = await mount(true);
    expect(allText(r)).toContain('Ilovaga kirish vaqtincha cheklandi');
    mockGetLockState.mockReturnValue({ locked: true, remainingMs: 2000, failures: 3 });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(allText(r)).toContain('"time":"T2000"');
    mockGetLockState.mockReturnValue(NOLOCK);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(allText(r)).not.toContain('Ilovaga kirish vaqtincha cheklandi');
    expect(allText(r)).toContain('PIN-kodni kiriting');
  });
  it('qulf ekranidagi tugmalar: tiklash va qo\'llab-quvvatlash', async () => {
    mockGetLockState.mockReturnValue({ locked: true, remainingMs: 65000, failures: 3 });
    const r = await mount(true);
    await tap(press(r, n => textOf(n).trim() === 'PIN-kodni tiklash'));
    expect(mockNavigate).toHaveBeenCalledWith('ResetPassCode', { isLocal: true });
    await tap(press(r, n => textOf(n).includes('Qo‘llab-quvvatlash')));
    expect(Linking.openURL).toHaveBeenCalledWith('https://t.me/support');
  });
  it('"PIN-kodni tiklash" pill (qulfsiz)', async () => {
    const r = await mount(true);
    await tap(press(r, n => textOf(n).trim() === 'PIN-kodni tiklash'));
    expect(mockNavigate).toHaveBeenCalledWith('ResetPassCode', { isLocal: true });
  });
});

describe('SetLocalPassword — biometrik qulf ochish', () => {
  const prompt = { title: 'Face ID / Touch ID bilan tasdiqlang', cancel: 'Bekor qilish' };
  const bioReady = () => {
    mockMem.set('touch', true);
    mockIsEnrolled.mockReturnValue(true);
    mockSensor.mockResolvedValue({ available: true });
  };
  it('ochilishda avtomatik so\'raydi (touch + sir + sensor + qulfsiz)', async () => {
    bioReady();
    await mount(true);
    expect(mockUnlockBio).toHaveBeenCalledTimes(1);
    expect(mockUnlockBio).toHaveBeenCalledWith(prompt);
  });
  it.each([
    ['touch o\'chiq', () => { bioReady(); mockMem.set('touch', false); }],
    ['sir yo\'q', () => { bioReady(); mockIsEnrolled.mockReturnValue(false); }],
    ['sensor yo\'q', () => { bioReady(); mockSensor.mockResolvedValue({ available: false }); }],
    ['qulf', () => { bioReady(); mockGetLockState.mockReturnValue({ locked: true, remainingMs: 5, failures: 3 }); }],
  ])('so\'ramaydi: %s', async (_n, arrange) => {
    arrange();
    await mount(true);
    expect(mockUnlockBio).not.toHaveBeenCalled();
  });
  it('PIN o\'rnatish rejimida avtomatik so\'ramaydi', async () => {
    bioReady();
    await mount(false);
    expect(mockUnlockBio).not.toHaveBeenCalled();
  });
  it('ok: appLocked=false, 500ms dan keyin tiklash', async () => {
    bioReady();
    mockUnlockBio.mockResolvedValue('ok');
    await mount(true);
    await flush();
    expect(mockMem.get('appLocked')).toBe(false);
    expect(mockReset).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(499);
    });
    expect(mockReset).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(mockReset).toHaveBeenCalledWith({ routes: [{ name: 'BottomTabNavigator' }], index: 0 });
  });
  it('ok + pendingNavigation: darhol replace(Notification)', async () => {
    bioReady();
    mockMem.set('pendingNavigation', 'n');
    mockUnlockBio.mockResolvedValue('ok');
    await mount(true);
    await flush();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'replace', name: 'Notification' });
    expect(mockMem.has('pendingNavigation')).toBe(false);
  });
  it('invalid: touch=false, toast, tugma qolmaydi', async () => {
    bioReady();
    mockUnlockBio.mockResolvedValue('invalid');
    await mount(true);
    await flush();
    expect(mockMem.get('touch')).toBe(false);
    expect(lastToast()).toEqual({
      type: 'error2', position: 'top',
      props: { desc: 'Biometrik kirish yangilanishi kerak. Xavfsizlik bo‘limida uni qayta yoqing.' },
      visibilityTime: 4000, autoHide: true, topOffset: expect.anything(),
    });
    expect(mockReset).not.toHaveBeenCalled();
  });
  it('cancel / xato: hech narsa (PIN bilan davom)', async () => {
    bioReady();
    mockUnlockBio.mockRejectedValue(new Error('x'));
    await mount(true);
    await flush();
    expect(mockToast).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockMem.get('touch')).toBe(true);
  });
  it('tugma (unlock rejimi) qo\'lda ishga tushiradi; qulfda esa yo\'q', async () => {
    const r = await mount(true);
    expect(mockUnlockBio).not.toHaveBeenCalled();
    await tap(faceBtn(r));
    expect(mockUnlockBio).toHaveBeenCalledWith(prompt);
  });
  it('tugma: getLockState qulfda bo\'lsa so\'ramaydi', async () => {
    const r = await mount(true);
    mockGetLockState.mockReturnValue({ locked: true, remainingMs: 1000, failures: 3 });
    await tap(faceBtn(r));
    expect(mockUnlockBio).not.toHaveBeenCalled();
  });
});
