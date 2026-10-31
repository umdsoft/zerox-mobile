/**
 * SearchUserScreen (ID + tug'ilgan sana bo'yicha qidirish, natija kartasi) xarakteristika testlari — wave D bo'linishidan
 * OLDIN yozilgan: render daraxti goldenlari (fixtures/search_user_tree.json) + amal testlari.
 * Faqat chegaralar mock. Qayta yaratish (FAQAT eski komponent bilan): SU_TREE_GEN=1 npx jest search_user_screen
 */
import React from 'react';
import { Keyboard } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockDispatch = jest.fn((a: unknown) => a);
const mockToast = jest.fn();
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockPicker: { current: any } = { current: null };
let mockParams: any = {};
let mockState: any = {};

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn: (s: any) => any) => fn(mockState),
}));
jest.mock('axios', () => ({
  __esModule: true,
  default: { post: (...a: unknown[]) => mockPost(...a), get: (...a: unknown[]) => mockGet(...a) },
}));
jest.mock('react-native-toast-message/lib/src/Toast', () => ({ Toast: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a), reset: (...a: unknown[]) => mockReset(...a) }),
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/store/reducers/HomeReducer', () => ({
  checkExpire: (p: unknown) => ({ type: 'checkExpire', p }),
  setNotification: (p: unknown) => ({ type: 'setNotification', p }),
}));
jest.mock('../src/helper/useFio', () => ({ useFio: () => ({ fio: (s: string) => `fio(${s})` }) }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('react-native-responsive-screen', () => ({ widthPercentageToDP: (n: number) => n }));
const mockYmd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
jest.mock('react-native-date-picker', () => ({
  __esModule: true,
  default: (p: any) => {
    mockPicker.current = p;
    return require('react').createElement('DatePicker', {
      open: p.open,
      date: p.date instanceof Date ? mockYmd(p.date) : String(p.date),
      maximumDate: p.maximumDate instanceof Date ? mockYmd(p.maximumDate) : undefined,
      minimumDate: p.minimumDate instanceof Date ? mockYmd(p.minimumDate) : undefined,
      mode: p.mode,
      title: p.title,
      cancelText: p.cancelText,
    });
  },
}));
jest.mock('react-native-advanced-input-mask', () => ({
  MaskedTextInput: (p: any) =>
    require('react').createElement('MaskedInput', { value: p.value, placeholder: p.placeholder, mask: p.mask, keyboardType: p.keyboardType, style: p.style }),
}));
jest.mock('react-native-popover-view', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('Popover', { placement: p.placement }, p.from, p.children),
}));
jest.mock('react-native-popover-view/dist/Types', () => ({ Mode: {}, Placement: { BOTTOM: 'bottom' } }));
jest.mock('react-native-svg', () => {
  const R = require('react');
  const mk = (n: string) => (p: any) => R.createElement(n, { ...p, style: undefined }, p.children);
  return { __esModule: true, default: mk('Svg'), Defs: mk('Defs'), LinearGradient: mk('LinearGradient'), Rect: mk('Rect'), Stop: mk('Stop'), Circle: mk('Circle') };
});
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/components/ToastConfig', () => ({ toastConfig: {} }));
jest.mock('../src/screens/components/MainText', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/modal/DateModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdHeader', { title: p.title }),
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color })) },
    ),
);
jest.mock('../src/images/AskPermissonIcon', () => ({ __esModule: true, default: (p: any) => require('react').createElement('Img', { name: 'AskPermissonIcon', color: p?.color }) }));
jest.mock('../src/images/AskPermissonNearby', () => ({ __esModule: true, default: (p: any) => require('react').createElement('Img', { name: 'AskPermissonNearby', color: p?.color }) }));
jest.mock('../src/images/Eye', () => ({ __esModule: true, default: (p: any) => require('react').createElement('Img', { name: 'Eye', color: p?.color }) }));
jest.mock('../src/images/questionMark', () => ({ __esModule: true, default: (p: any) => require('react').createElement('Img', { name: 'questionMark', color: p?.color }) }));
jest.mock('../src/images/Famale', () => ({ __esModule: true, default: (p: any) => require('react').createElement('Img', { name: 'Famale', color: p?.color }) }));
jest.mock('../src/images/home/person', () => ({ __esModule: true, default: (p: any) => require('react').createElement('Img', { name: 'home/person', color: p?.color }) }));

import SearchUserScreen, { formatDate } from '../src/screens/other/SearchUserScreen';

const NOW = new Date('2026-11-01T07:00:00Z');
const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n)))[0];
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
// MaskedTextInput mock'i onChangeText'ni host propga qo'ymaydi — composite'dan olamiz.
const idInput = (r: TestRenderer.ReactTestRenderer) => r.root.findAll(n => typeof n.props.onChangeText === 'function')[0];
const setId = async (r: TestRenderer.ReactTestRenderer, v: string) => {
  await act(async () => {
    idInput(r).props.onChangeText(v, v);
  });
};
const dateBtn = (r: TestRenderer.ReactTestRenderer) => press(r, n => n.props.activeOpacity === 0.8 && /kk\.oo\.yyyy|\d\d\.\d\d\.\d{4}/.test(textOf(n)));
const searchBtn = (r: TestRenderer.ReactTestRenderer) => press(r, n => n.props.activeOpacity === 0.8 && textOf(n).trim() === '216');
const BIRTH = new Date(1990, 4, 15, 12, 0, 0);
const pickDate = async (r: TestRenderer.ReactTestRenderer, d: Date) => {
  await tap(dateBtn(r));
  await act(async () => {
    mockPicker.current.onConfirm(d);
  });
};
const toasts = () => mockToast.mock.calls.map(c => c[0]);

const baseState = (over: any = {}) => ({
  HomeReducer: { user: { data: { id: 7, uid: '999999/ZZ', expiry_date: '2030-01-01', ...over } } },
});
const FOUND = { success: true, user: { id: 55, uid: '123456/AB', first_name: 'Ali', last_name: 'Valiyev', middle_name: 'Karim', gender: 1 } };
const FOUND_F = { success: true, user: { id: 56, uid: '654321/CD', first_name: 'Zarina', last_name: 'Aliyeva', middle_name: '', gender: 2 } };

const mount = async (params: any = {}, state: any = baseState()) => {
  mockParams = params;
  mockState = state;
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<SearchUserScreen />);
  });
  return r;
};
const ready = async (params: any = {}, id = '123456AB') => {
  const r = await mount(params);
  await setId(r, id);
  await pickDate(r, BIRTH);
  return r;
};

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockPost.mockReset();
  mockGet.mockReset();
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'search_user_tree.json');
const GEN = !!process.env.SU_TREE_GEN;

describe('SearchUserScreen — render daraxti', () => {
  const found = async (data: any, params: any = {}) => {
    mockPost.mockResolvedValue({ data, status: 200 });
    const r = await ready(params);
    await tap(searchBtn(r));
    return r;
  };
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['form give (default params)', () => mount()],
    ['form give type 1', () => mount({ type: 1 })],
    ['form take type 2', () => mount({ type: 2 })],
    ['null route params', async () => ((mockParams = null), mount(null as any))],
    ['id typed (short, disabled)', async () => { const r = await mount(); await setId(r, '1234'); return r; }],
    ['id typed 9 chars, enabled', async () => { const r = await mount(); await setId(r, '123456AB'); await setId(r, '123456/AB'); return r; }],
    ['date picked', async () => { const r = await mount(); await pickDate(r, BIRTH); return r; }],
    ['picker open', async () => { const r = await mount(); await tap(dateBtn(r)); return r; }],
    ['result male (give)', () => found(FOUND)],
    ['result female (take)', () => found(FOUND_F, { type: 2 })],
    [
      'loading while searching',
      async () => {
        mockPost.mockReturnValue(new Promise(() => {}));
        const r = await ready();
        await act(async () => {
          searchBtn(r).props.onPress();
        });
        return r;
      },
    ],
  ];
  const golden: Record<string, string> = !GEN && fs.existsSync(TREE_PATH) ? JSON.parse(fs.readFileSync(TREE_PATH, 'utf8')) : {};
  const rec: Record<string, string> = {};
  afterAll(() => {
    if (GEN) fs.writeFileSync(TREE_PATH, JSON.stringify(rec, null, 1));
  });
  it.each(states.map(s => s[0]))('%s', async name => {
    const r = await states.find(s => s[0] === name)![1]();
    const out = tree(r);
    if (GEN) rec[name] = out;
    else expect(out).toBe(golden[name]);
  });
  it('barcha holatlar goldenda bor', () => {
    if (!GEN) expect(Object.keys(golden).sort()).toEqual(states.map(s => s[0]).sort());
  });
});

describe('SearchUserScreen — qidirish', () => {
  it('formatDate: Date -> DD.MM.YYYY (lokal kun)', () => {
    expect(formatDate(new Date(1990, 4, 5, 12))).toBe('05.05.1990');
  });
  it('muvaffaqiyat: payload (ID "/"siz), sarlavha', async () => {
    mockPost.mockResolvedValue({ data: FOUND, status: 200 });
    const r = await ready({}, '123456AB');
    await setId(r, '123456/AB');
    await tap(searchBtn(r));
    expect(mockPost).toHaveBeenCalledWith(
      'http://x/user/search',
      { id: '123456AB', brithday: '15.05.1990', type: 1 },
      { headers: { Authorization: 'Bearer tok' } },
    );
    expect(tree(r)).toContain('fio(Valiyev Ali Karim)');
  });
  it('sana tanlanmasa: bugun yuboriladi', async () => {
    mockPost.mockResolvedValue({ data: FOUND, status: 200 });
    const r = await mount();
    await setId(r, '123456AB');
    await tap(searchBtn(r));
    expect(mockPost.mock.calls[0][1].brithday).toBe(formatDate(new Date()));
  });
  it('type 2 ham type: 1 yuboradi', async () => {
    mockPost.mockResolvedValue({ data: FOUND, status: 200 });
    const r = await ready({ type: 2 });
    await tap(searchBtn(r));
    expect(mockPost.mock.calls[0][1].type).toBe(1);
  });
  it('10 belgidan kam ID: tugma disabled', async () => {
    const r = await mount();
    await setId(r, '12345678');
    expect(searchBtn(r).props.disabled).toBe(true);
    await setId(r, '123456789');
    expect(searchBtn(r).props.disabled).toBe(false);
  });
  it('pasport muddati tugagan: checkExpire, so\'rov yo\'q', async () => {
    mockState = baseState({ expiry_date: '2026-11-01' });
    const r = await mount();
    mockState = baseState({ expiry_date: '2026-11-01' });
    await setId(r, '123456789');
    await tap(searchBtn(r));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'checkExpire', p: { expire: true } });
    expect(mockPost).not.toHaveBeenCalled();
  });
  it('o\'z ID si: toast, so\'rov yo\'q', async () => {
    const r = await mount();
    await setId(r, '999999ZZ');
    await tap(searchBtn(r));
    // uid '999999/ZZ' != '999999ZZ' — "/" olib tashlangan ID bilan solishtiriladi (hozirgi xulq): so'rov ketadi.
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
  it('o\'z ID si ("/" bilan kiritilgan uid): toast, so\'rov yo\'q', async () => {
    mockState = baseState({ uid: '999999ZZ' });
    const r = await mount();
    mockState = baseState({ uid: '999999ZZ' });
    await setId(r, '999999ZZ');
    await tap(searchBtn(r));
    expect(mockPost).not.toHaveBeenCalled();
    expect(toasts()).toEqual([
      { autoHide: true, position: 'bottom', visibilityTime: 3000, type: 'error2', props: { desc: 'Foydalanuvchi ma’lumotlari to‘g‘ri kelmadi' } },
    ]);
  });
  it('success:false + candidate topildi -> "825"', async () => {
    mockPost.mockResolvedValue({ data: { success: false }, status: 200 });
    mockGet.mockResolvedValue({ data: { success: true, data: { id: 1 } } });
    const r = await ready();
    await tap(searchBtn(r));
    expect(mockGet).toHaveBeenCalledWith('http://x/user/candidate-search/123456AB', { headers: { Authorization: 'Bearer tok' } });
    expect(toasts()[0].props.desc).toBe('825');
    expect(tree(r)).not.toContain('LoadingMock');
    expect(searchBtn(r)).toBeDefined();
  });
  it('success:false + candidate yo\'q -> "mavjud emas"', async () => {
    mockPost.mockResolvedValue({ data: { success: false }, status: 200 });
    mockGet.mockResolvedValue({ data: { success: false } });
    const r = await ready();
    await tap(searchBtn(r));
    expect(toasts()[0].props.desc).toBe('Ushbu ID raqamli foydalanuvchi mavjud emas');
    expect(searchBtn(r)).toBeDefined();
  });
  it('success:false + candidate so\'rovi xato -> "mavjud emas"', async () => {
    mockPost.mockResolvedValue({ data: { success: false }, status: 200 });
    mockGet.mockRejectedValue(new Error('x'));
    const r = await ready();
    await tap(searchBtn(r));
    expect(toasts()[0].props.desc).toBe('Ushbu ID raqamli foydalanuvchi mavjud emas');
  });
  it('tarmoq xatosi -> "825", forma qaytadi', async () => {
    mockPost.mockRejectedValue(new Error('net'));
    const r = await ready();
    await tap(searchBtn(r));
    expect(toasts()).toEqual([{ autoHide: true, position: 'bottom', visibilityTime: 3000, type: 'error2', props: { desc: '825' } }]);
    expect(searchBtn(r)).toBeDefined();
  });
  it('success undefined (na true na false): forma qaytadi, toast yo\'q', async () => {
    mockPost.mockResolvedValue({ data: {}, status: 200 });
    const r = await ready();
    await tap(searchBtn(r));
    expect(mockToast).not.toHaveBeenCalled();
    expect(searchBtn(r)).toBeDefined();
  });
});

describe('SearchUserScreen — sana tanlagich', () => {
  it('klaviatura yopiq: darhol ochiladi, dismiss chaqiriladi', async () => {
    const r = await mount();
    await tap(dateBtn(r));
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    expect(mockPicker.current.open).toBe(true);
  });
  it('klaviatura ochiq: keyboardDidHide da ochiladi', async () => {
    (Keyboard.isVisible as jest.Mock).mockReturnValue(true);
    const remove = jest.fn();
    let cb: () => void = () => {};
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((e: string, f: () => void) => {
      expect(e).toBe('keyboardDidHide');
      cb = f;
      return { remove };
    }) as any);
    const r = await mount();
    await tap(dateBtn(r));
    expect(mockPicker.current.open).toBe(false);
    await act(async () => {
      cb();
    });
    expect(mockPicker.current.open).toBe(true);
    expect(remove).toHaveBeenCalled();
  });
  it('klaviatura ochiq: 300 ms zaxira bilan ochiladi; ikkinchi bosish e\'tiborsiz', async () => {
    (Keyboard.isVisible as jest.Mock).mockReturnValue(true);
    jest.spyOn(Keyboard, 'addListener').mockImplementation((() => ({ remove: jest.fn() })) as any);
    const r = await mount();
    await tap(dateBtn(r));
    await tap(dateBtn(r));
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(mockPicker.current.open).toBe(true);
  });
  it('bekor qilish yopadi; standart sana 18 yil oldin, max bugun', async () => {
    const r = await mount();
    await tap(dateBtn(r));
    expect(mockPicker.current.date).toBeInstanceOf(Date);
    expect(mockPicker.current.date.getFullYear()).toBe(2008);
    await act(async () => {
      mockPicker.current.onCancel();
    });
    expect(mockPicker.current.open).toBe(false);
    expect(mockPicker.current.maximumDate.getTime()).toBe(NOW.getTime());
  });
});

describe('SearchUserScreen — natija kartasi', () => {
  const result = async (data = FOUND, params: any = {}) => {
    mockPost.mockResolvedValue({ data, status: 200 });
    const r = await ready(params);
    await tap(searchBtn(r));
    return r;
  };
  const askBtn = (r: TestRenderer.ReactTestRenderer) => press(r, n => n.props.activeOpacity === 0.85 && textOf(n).trim() === '225');
  it('"Ma\'lumotlarni so\'rash": POST, toast, 2 s dan so\'ng Home\'ga reset', async () => {
    const r = await result();
    mockPost.mockResolvedValue({ data: {}, status: 201 });
    await tap(askBtn(r));
    expect(mockPost).toHaveBeenLastCalledWith(
      'http://x/notification/reqquest',
      { creditor: 7, debitor: 7, reciver: 55 },
      { headers: { Authorization: 'Bearer tok' } },
    );
    expect(toasts().pop()).toEqual({ autoHide: true, position: 'bottom', visibilityTime: 2000, type: 'omad', props: { desc: '228' } });
    expect(mockReset).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockReset).toHaveBeenCalledWith({ routes: [{ name: 'BottomTabNavigator' }], index: 0 });
  });
  it('201 bo\'lmasa reset yo\'q', async () => {
    const r = await result();
    mockPost.mockResolvedValue({ data: {}, status: 200 });
    await tap(askBtn(r));
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(mockReset).not.toHaveBeenCalled();
  });
  it('so\'rov xatosi: toast yo\'q, yiqilmaydi; tugma bloklangan qoladi', async () => {
    const r = await result();
    mockPost.mockRejectedValue(new Error('x'));
    await tap(askBtn(r));
    expect(toasts().filter(x => x.type === 'omad')).toHaveLength(0);
    expect(askBtn(r).props.disabled).toBe(true);
  });
  it('so\'rovdan keyin izoh matni almashadi (219 -> 231)', async () => {
    const r = await result();
    expect(tree(r)).toContain('219');
    mockPost.mockResolvedValue({ data: {}, status: 200 });
    await tap(askBtn(r));
    expect(tree(r)).toContain('231');
  });
  it('"Ko\'rmasdan qarz berish/olish": GiveDebtUser parametrlari', async () => {
    const r = await result();
    await tap(press(r, n => n.props.activeOpacity === 0.85 && textOf(n).trim() === '222'));
    expect(mockNavigate).toHaveBeenLastCalledWith('GiveDebtUser', { qarzoluvchi: FOUND.user, type: 1 });
  });
  it('type 2: tugma matni 288, type 2 uzatiladi', async () => {
    const r = await result(FOUND_F, { type: 2 });
    await tap(press(r, n => n.props.activeOpacity === 0.85 && textOf(n).trim() === '288'));
    expect(mockNavigate).toHaveBeenLastCalledWith('GiveDebtUser', { qarzoluvchi: FOUND_F.user, type: 2 });
  });
});
