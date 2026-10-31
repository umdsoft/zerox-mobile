/**
 * GiveDebtUser (shartnoma yaratish + xizmat haqi) xarakteristika testlari — wave C bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/give_debt_user_tree.json) + amal testlari (endpoint, payload, toast, navigatsiya).
 * Mock'lar faqat chegaralarda. Daraxtlarni qayta yaratish (FAQAT eski komponent bilan): GD_TREE_GEN=1 npx jest give_debt_user
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockDispatch = jest.fn((a: unknown) => a);
const mockToast = jest.fn();
const mockToastHide = jest.fn();
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockNavigate = jest.fn();
const mockSign = jest.fn();
let mockUser: any = null;
let mockParams: any = {};
const mockPicker: { current: any } = { current: null };

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn: (s: any) => any) => fn({ HomeReducer: { user: mockUser } }),
}));
jest.mock('axios', () => ({
  __esModule: true,
  default: { post: (...a: unknown[]) => mockPost(...a), get: (...a: unknown[]) => mockGet(...a) },
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: (...a: unknown[]) => mockToast(...a), hide: () => mockToastHide() },
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  Trans: (p: any) => require('react').createElement('Trans', { i18nKey: p.i18nKey, values: p.values }),
}));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/store/api/token/getToken', () => ({
  storage: { getString: (k: string) => (k === 'token' ? 'tok' : k === 'lang' ? 'uz' : undefined) },
}));
jest.mock('../src/store/api/home', () => ({
  getMe: () => ({ type: 'getMe' }),
  HomeApi: (p: unknown) => ({ type: 'HomeApi', p }),
}));
jest.mock('../src/helper/useFio', () => ({ useFio: () => ({ fio: (s: string) => `fio(${s})` }) }));
jest.mock('../src/helper/pdfSign', () => ({ signExistingUrl: (...a: unknown[]) => mockSign(...a) }));
jest.mock('react-native-date-picker', () => ({
  __esModule: true,
  default: (p: any) => {
    mockPicker.current = p;
    return require('react').createElement('DatePicker', {
      open: p.open,
      date: p.date,
      minimumDate: p.minimumDate,
      maximumDate: p.maximumDate,
      mode: p.mode,
      title: p.title,
    });
  },
}));
jest.mock('@react-native-community/checkbox', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('CheckBox', { value: p.value, boxType: p.boxType, onValueChange: p.onValueChange }),
}));
jest.mock('react-native-paper', () => ({
  Provider: ({ children }: any) => require('react').createElement('PaperProvider', null, children),
}));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/modal/MeetInfoGiveDebtModal', () => ({ __esModule: true, default: () => require('react').createElement('MeetInfoMock') }));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: ({ title }: any) => require('react').createElement('Header', { title }),
}));
jest.mock('../src/screens/home/redesign/icons', () => ({
  CoinIcon: () => require('react').createElement('CoinIcon'),
  UserIcon: () => require('react').createElement('UserIcon'),
}));
jest.mock('../src/images/home/person', () => ({ __esModule: true, default: () => require('react').createElement('Person') }));
jest.mock('../src/images/home/juridic', () => ({ __esModule: true, default: () => require('react').createElement('Juridic') }));
jest.mock('../src/images/Famale', () => ({ __esModule: true, default: () => require('react').createElement('Famale') }));
jest.mock('../src/images/radioButtonFill', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/images/radioButton', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/helper/homeIcon', () => ({ BackGroundIcon: () => null }));
jest.mock('../src/screens/components/OtherHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/components/ToastConfig', () => ({ toastConfig: {} }));
jest.mock('../src/screens/home/modal/DateModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/components/TransText', () => ({
  __esModule: true,
  default: (p: any) => {
    const R = require('react');
    return R.createElement('TransText', { tKey: p.tKey, values: p.values }, p.components?.amount);
  },
}));
jest.mock('../src/screens/components/MainText', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('MainText', { size: p.size, color: p.color }),
}));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));

import GiveDebtUser, { formatDateMinus } from '../src/screens/other/GiveDebtUser';

const NOW = new Date('2026-11-01T10:00:00Z');

const me = (over: any = {}) => ({
  data: { id: 7, uid: 700, type: 2, gender: '1', cnt: 0, balance: '50000', first_name: 'Ali', last_name: 'Valiyev', middle_name: 'Karim', ...over },
});
const other = (over: any = {}) => ({
  id: 9, uid: 900, type: 2, gender: '2', first_name: 'Zarina', last_name: 'Aliyeva', middle_name: 'Rustam', ...over,
});

const textOf = (n: any): string => n.children.map((c: any) => (typeof c === 'string' ? c : textOf(c))).join('');
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n))[0];
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => press(r, n => textOf(n).trim() === text);
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const amountInput = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => typeof n.props.onChangeText === 'function' && ['numeric', 'decimal-pad'].includes(n.props.keyboardType))[0];
const typeAmount = async (r: TestRenderer.ReactTestRenderer, v: string) => {
  await act(async () => {
    amountInput(r).props.onChangeText(v);
  });
};
const checkbox = (r: TestRenderer.ReactTestRenderer) => r.root.findAll(n => n.type === ('CheckBox' as any))[0];
const check = async (r: TestRenderer.ReactTestRenderer) => {
  await act(async () => {
    checkbox(r).props.onValueChange();
  });
};
const dateRow = (r: TestRenderer.ReactTestRenderer) => press(r, n => n.props.activeOpacity === 0.8);
const pickDate = async (r: TestRenderer.ReactTestRenderer, d: Date) => {
  await tap(dateRow(r));
  await act(async () => {
    mockPicker.current.onConfirm(d);
  });
};
const toasts = () => mockToast.mock.calls.map(c => c[0]);
const lastToast = () => mockToast.mock.calls[mockToast.mock.calls.length - 1][0];
const buttonNode = (r: TestRenderer.ReactTestRenderer) => byText(r, '93');
const allText = (r: TestRenderer.ReactTestRenderer) => textOf(r.root);
const hasLoading = (r: TestRenderer.ReactTestRenderer) => r.root.findAll(n => n.type === ('LoadingMock' as any)).length > 0;

const FUTURE = new Date('2026-12-15T12:00:00Z');

const mount = async (type: 0 | 1, userOver: any = {}, otherOver: any = {}) => {
  mockUser = me(userOver);
  mockParams = { qarzoluvchi: other(otherOver), type };
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<GiveDebtUser />);
  });
  return r;
};
// To'ldirilgan, yuborishga tayyor holat.
const ready = async (type: 0 | 1, amount = '500000', userOver: any = {}, otherOver: any = {}) => {
  const r = await mount(type, userOver, otherOver);
  await typeAmount(r, amount);
  await check(r);
  await pickDate(r, FUTURE);
  return r;
};

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ data: [{ Rate: '12000' }] });
  mockPost.mockReset();
  mockPost.mockResolvedValue({ data: { success: true } });
  mockSign.mockImplementation((_k: string, u: string) => Promise.resolve(u + '&sig=1'));
});
afterEach(() => {
  jest.useRealTimers();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'give_debt_user_tree.json');
const GEN_TREE = !!process.env.GD_TREE_GEN;

describe('GiveDebtUser — render daraxti (vizual chiqish o\'zgarmagan)', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['borrow initial (type 0)', () => mount(0)],
    ['lend initial (type 1)', () => mount(1)],
    ['borrow cnt>0 (no fee, cnt row)', () => mount(0, { cnt: 3 })],
    ['borrow juridic user + male other', () => mount(0, { type: 1 }, { gender: '1' })],
    ['lend juridic other', () => mount(1, {}, { type: 1 })],
    ['borrow female user', () => mount(0, { gender: '2' })],
    ['uzs typed + checked + fee card', async () => {
      const r = await mount(0);
      await typeAmount(r, '5000000');
      await check(r);
      return r;
    }],
    ['usd selected typed', async () => {
      const r = await mount(0);
      await tap(byText(r, 'usd'));
      await typeAmount(r, '1234,5');
      await check(r);
      return r;
    }],
    ['ready with date', () => ready(0)],
    ['date picker open', async () => {
      const r = await mount(1);
      await tap(dateRow(r));
      return r;
    }],
    ['lend ready', () => ready(1, '250000')],
    ['loading while posting', async () => {
      const r = await ready(1);
      mockPost.mockReturnValue(new Promise(() => {}));
      await act(async () => {
        buttonNode(r).props.onPress();
      });
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

describe('GiveDebtUser — tugma holati va sana', () => {
  it('disabled: summa yo\'q / belgi yo\'q / sana bugun', async () => {
    const r = await mount(0);
    expect(buttonNode(r).props.disabled).toBe(true);
    await typeAmount(r, '500000');
    expect(buttonNode(r).props.disabled).toBe(true);
    await check(r);
    expect(buttonNode(r).props.disabled).toBe(true);
    await pickDate(r, FUTURE);
    expect(buttonNode(r).props.disabled).toBe(false);
  });
  it('sana bugun bo\'lsa yana placeholder', async () => {
    const r = await mount(0);
    expect(allText(r)).toContain('kk.oo.yyyy');
    await typeAmount(r, '500000');
    await check(r);
    await pickDate(r, new Date());
    expect(allText(r)).toContain('kk.oo.yyyy');
    expect(buttonNode(r).props.disabled).toBe(true);
  });
  it('sana tanlangach DD.MM.YYYY ko\'rsatiladi', async () => {
    const r = await mount(0);
    await pickDate(r, FUTURE);
    expect(allText(r)).toContain('15.12.2026');
  });
  it('DatePicker: min = hozir, max = hozir + 2 yil; ochish/bekor', async () => {
    const r = await mount(0);
    expect(mockPicker.current.minimumDate.getTime()).toBe(NOW.getTime());
    expect(mockPicker.current.maximumDate.getTime()).toBe(NOW.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
    expect(mockPicker.current.open).toBe(false);
    await tap(dateRow(r));
    expect(mockPicker.current.open).toBe(true);
    await act(async () => mockPicker.current.onCancel());
    expect(mockPicker.current.open).toBe(false);
  });
  it('formatDateMinus: lokal kalendar kun', () => {
    expect(formatDateMinus(new Date(2026, 11, 15, 0, 30))).toBe('2026-12-15');
    expect(formatDateMinus(new Date(2026, 11, 15, 23, 30))).toBe('2026-12-15');
  });
});

describe('GiveDebtUser — summa kiritish va valyuta', () => {
  it('UZS: minglik bo\'sh joy', async () => {
    const r = await mount(0);
    await typeAmount(r, '1234567');
    expect(amountInput(r).props.value).toBe('1 234 567');
  });
  it('"0" UZS da tozalanadi', async () => {
    const r = await mount(0);
    await typeAmount(r, '0');
    expect(amountInput(r).props.value).toBe('');
  });
  it('USD -> UZS: tsentlar tashlanadi', async () => {
    const r = await mount(0);
    await tap(byText(r, 'usd'));
    await typeAmount(r, '12,34');
    expect(amountInput(r).props.value).toBe('12,34');
    await tap(byText(r, 'uzs'));
    expect(amountInput(r).props.value).toBe('12');
    expect(amountInput(r).props.keyboardType).toBe('numeric');
  });
  it('placeholder valyutaga qarab', async () => {
    const r = await mount(0);
    expect(amountInput(r).props.placeholder).toBe('UZS');
    await tap(byText(r, 'usd'));
    expect(amountInput(r).props.placeholder).toBe('USD');
    expect(amountInput(r).props.keyboardType).toBe('decimal-pad');
  });
});

describe('GiveDebtUser — xizmat haqi (contractFee) ko\'rsatilishi', () => {
  const feeOf = (r: TestRenderer.ReactTestRenderer) => r.root.findAll(n => n.type === ('TransText' as any))[0]?.props.values?.amount;
  const feeFor = async (amount: string, usd = false) => {
    const r = await mount(0);
    if (usd) await tap(byText(r, 'usd'));
    await typeAmount(r, amount);
    await check(r);
    return feeOf(r);
  };
  it('UZS 500 ming: minimum 1 000', async () => expect(await feeFor('500000')).toBe('1 000'));
  it('UZS 1 mln: minimum 1 000', async () => expect(await feeFor('1000000')).toBe('1 000'));
  it('UZS 5 mln: 0.1% = 5 000', async () => expect(await feeFor('5000000')).toBe('5 000'));
  it('UZS 50 mln: 50 000', async () => expect(await feeFor('50000000')).toBe('50 000'));
  it('UZS 100 mln: maksimum 100 000', async () => expect(await feeFor('100000000')).toBe('100 000'));
  it('UZS 500 mln: maksimum 100 000', async () => expect(await feeFor('500000000')).toBe('100 000'));
  it('USD kurs 12000: 100$ -> 1 200', async () => expect(await feeFor('100', true)).toBe('1 200'));
  it('USD kurs 12000: 10000$ -> 100 000', async () => expect(await feeFor('10000', true)).toBe('100 000'));
  it('USD kurs 12000: 10$ -> minimum 1 000', async () => expect(await feeFor('10', true)).toBe('1 000'));
  it('karta: faqat belgi + summa + type 0 + cnt 0 bo\'lganda', async () => {
    const r = await mount(0);
    await typeAmount(r, '5000000');
    expect(feeOf(r)).toBeUndefined();
    await check(r);
    expect(feeOf(r)).toBe('5 000');
    const r2 = await mount(1);
    await typeAmount(r2, '5000000');
    await check(r2);
    expect(feeOf(r2)).toBeUndefined();
    const r3 = await mount(0, { cnt: 2 });
    await typeAmount(r3, '5000000');
    await check(r3);
    expect(feeOf(r3)).toBeUndefined();
  });
  it('CBU kursi so\'rovi manzili', async () => {
    await mount(0);
    expect(mockGet.mock.calls[0][0]).toBe('https://cbu.uz/oz/arkhiv-kursov-valyut/json/');
  });
});

describe('GiveDebtUser — yuborish: type 0 (qarz olish)', () => {
  it('payload + muvaffaqiyat toast + getMe + Home\'ga navigatsiya', async () => {
    const r = await ready(0, '500000');
    await tap(buttonNode(r));
    expect(mockPost).toHaveBeenCalledTimes(1);
    const [url, body, cfg] = mockPost.mock.calls[0];
    expect(url).toBe('http://x/contract/create');
    expect(body).toEqual({
      amount: 500000, creditor: 7, debitor: 9, currency: 'UZS', end_date: '2026-12-15',
      reciver: 9, con: 1, type: 0, sender: 7, res: 9,
    });
    expect(cfg).toEqual({ headers: { Authorization: 'Bearer tok' } });
    expect(lastToast()).toEqual({ autoHide: true, visibilityTime: 2000, position: 'bottom', type: 'omad', props: { desc: '285' } });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'getMe' });
    expect(mockNavigate).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1399);
    });
    expect(mockToastHide).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(mockToastHide).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'HomeApi', p: { page: 1 } });
    expect(mockNavigate).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(mockNavigate).toHaveBeenCalledWith('BottomTabNavigator');
  });
  it('USD payload: summa 2 xona, currency USD', async () => {
    const r = await mount(0);
    await tap(byText(r, 'usd'));
    await typeAmount(r, '655,77');
    await check(r);
    await pickDate(r, FUTURE);
    await tap(buttonNode(r));
    expect(mockPost.mock.calls[0][1]).toMatchObject({ amount: 655.77, currency: 'USD' });
  });
  it('yuridik foydalanuvchi + qarzoluvchi.id === 1 -> type 1', async () => {
    const r = await ready(0, '500000', { type: 1 }, { id: 1 });
    await tap(buttonNode(r));
    expect(mockPost.mock.calls[0][1]).toMatchObject({ type: 1, debitor: 1, reciver: 1, res: 1 });
  });
  it('sender raqamga aylantiriladi', async () => {
    const r = await ready(0, '500000', { id: '7' });
    await tap(buttonNode(r));
    expect(mockPost.mock.calls[0][1]).toMatchObject({ creditor: '7', sender: 7 });
  });
  it('balans: komissiya >= balans -> toast 294, so\'rov yo\'q', async () => {
    const r = await ready(0, '500000', { balance: '1000' });
    await tap(buttonNode(r));
    expect(mockPost).not.toHaveBeenCalled();
    expect(lastToast()).toEqual({ autoHide: true, visibilityTime: 3000, position: 'bottom', type: 'error2', props: { desc: '294' } });
  });
  it('balans yetarli (komissiya < balans) -> yuboriladi', async () => {
    const r = await ready(0, '500000', { balance: '1001' });
    await tap(buttonNode(r));
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
  it('balans: yirik summa komissiyasi 5 000 >= 5 000 -> bloklanadi', async () => {
    const r = await ready(0, '5000000', { balance: '5000' });
    await tap(buttonNode(r));
    expect(mockPost).not.toHaveBeenCalled();
  });
  it('cnt > 0 bo\'lsa balans tekshirilmaydi', async () => {
    const r = await ready(0, '500000', { cnt: 1, balance: '0' });
    await tap(buttonNode(r));
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
  it('success:false msg xaritasi', async () => {
    const cases: [string | undefined, string][] = [
      ['user-bir', 'O‘zingiz bilan qarz shartnomasi tuzib bo‘lmaydi'],
      ['date', 'Qaytarish muddati noto‘g‘ri'],
      ['rate-unavailable', 'Valyuta kursi vaqtincha mavjud emas. Birozdan so‘ng qayta urinib ko‘ring'],
      ['xyz', 'Xatolik yuz berdi'],
      [undefined, 'Xatolik yuz berdi'],
    ];
    for (const [msg, desc] of cases) {
      mockToast.mockClear();
      mockPost.mockResolvedValue({ data: { success: false, msg } });
      const r = await ready(0);
      await tap(buttonNode(r));
      expect(lastToast()).toEqual({ autoHide: true, visibilityTime: 2500, position: 'bottom', type: 'error2', props: { desc } });
      expect(hasLoading(r)).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
    }
  });
  it('type 0 da deb_expiry_date alohida ishlanmaydi (umumiy xato)', async () => {
    mockPost.mockResolvedValue({ data: { success: false, msg: 'deb_expiry_date' } });
    const r = await ready(0);
    await tap(buttonNode(r));
    expect(lastToast().props.desc).toBe('Xatolik yuz berdi');
  });
});

describe('GiveDebtUser — yuborish: type 1 (qarz berish)', () => {
  it('payload (creditor/debitor teskari, con YO\'Q) + toast + navigatsiya', async () => {
    const r = await ready(1, '500000');
    await tap(buttonNode(r));
    const [url, body, cfg] = mockPost.mock.calls[0];
    expect(url).toBe('http://x/contract/create');
    expect(body).toEqual({
      amount: 500000, creditor: 9, debitor: 7, currency: 'UZS', end_date: '2026-12-15',
      reciver: 9, type: 0, sender: 7, res: 9,
    });
    expect('con' in body).toBe(false);
    expect(cfg).toEqual({ headers: { Authorization: 'Bearer tok' } });
    expect(lastToast()).toEqual({ autoHide: true, visibilityTime: 2000, position: 'bottom', type: 'omad', props: { desc: '285' } });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'getMe' });
    await act(async () => {
      jest.advanceTimersByTime(1700);
    });
    expect(mockNavigate).toHaveBeenCalledWith('BottomTabNavigator');
  });
  it('balans tekshirilmaydi (qarz beruvchi)', async () => {
    const r = await ready(1, '500000', { balance: '0' });
    await tap(buttonNode(r));
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
  it('yuridik + id 1 -> type 1', async () => {
    const r = await ready(1, '500000', { type: 1 }, { id: 1 });
    await tap(buttonNode(r));
    expect(mockPost.mock.calls[0][1]).toMatchObject({ type: 1, creditor: 1, debitor: 7 });
  });
  it('deb_expiry_date: expire_passport toast, loading o\'chadi, navigatsiya yo\'q', async () => {
    mockPost.mockResolvedValue({ data: { success: false, msg: 'deb_expiry_date' } });
    const r = await ready(1);
    await tap(buttonNode(r));
    expect(lastToast()).toEqual({ autoHide: true, position: 'bottom', visibilityTime: 2000, type: 'error2', props: { desc: 'expire_passport' } });
    expect(hasLoading(r)).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'getMe' });
  });
  it('deb_expiry_date faqat success:false bilan; success:true+msg oddiy', async () => {
    mockPost.mockResolvedValue({ data: { success: true, msg: 'deb_expiry_date' } });
    const r = await ready(1);
    await tap(buttonNode(r));
    expect(lastToast().type).toBe('omad');
  });
  it('success:false msg xaritasi', async () => {
    mockPost.mockResolvedValue({ data: { success: false, msg: 'user-bir' } });
    const r = await ready(1);
    await tap(buttonNode(r));
    expect(lastToast()).toEqual({ autoHide: true, visibilityTime: 2500, position: 'bottom', type: 'error2', props: { desc: 'O‘zingiz bilan qarz shartnomasi tuzib bo‘lmaydi' } });
  });
});

describe('GiveDebtUser — minimal summa va xatolar', () => {
  it('UZS < 10000 -> minsum, so\'rov yo\'q', async () => {
    const r = await ready(0, '9999');
    await tap(buttonNode(r));
    expect(mockPost).not.toHaveBeenCalled();
    expect(lastToast()).toEqual({ autoHide: true, visibilityTime: 3000, position: 'bottom', type: 'error2', props: { desc: 'minsum' } });
  });
  it('UZS 10000 yetarli', async () => {
    const r = await ready(1, '10000');
    await tap(buttonNode(r));
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
  it('USD < 1 -> minusd', async () => {
    const r = await mount(1);
    await tap(byText(r, 'usd'));
    await typeAmount(r, '0,5');
    await check(r);
    await pickDate(r, FUTURE);
    await tap(buttonNode(r));
    expect(mockPost).not.toHaveBeenCalled();
    expect(lastToast().props.desc).toBe('minusd');
  });
  it('USD 1 yetarli', async () => {
    const r = await mount(1);
    await tap(byText(r, 'usd'));
    await typeAmount(r, '1');
    await check(r);
    await pickDate(r, FUTURE);
    await tap(buttonNode(r));
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
  it('503 rate-unavailable: aniq toast', async () => {
    mockPost.mockRejectedValue({ response: { data: { msg: 'rate-unavailable' } } });
    const r = await ready(0);
    await tap(buttonNode(r));
    expect(lastToast()).toEqual({ autoHide: true, visibilityTime: 2500, position: 'bottom', type: 'error2', props: { desc: 'Valyuta kursi vaqtincha mavjud emas. Birozdan so‘ng qayta urinib ko‘ring' } });
    expect(hasLoading(r)).toBe(false);
  });
  it('boshqa tarmoq xatosi: jim, loading o\'chadi, qayta yuborish mumkin', async () => {
    mockPost.mockRejectedValueOnce(new Error('net'));
    const r = await ready(1);
    await tap(buttonNode(r));
    expect(mockToast).not.toHaveBeenCalled();
    expect(hasLoading(r)).toBe(false);
    await tap(buttonNode(r));
    expect(mockPost).toHaveBeenCalledTimes(2);
  });
});

describe('GiveDebtUser — double-submit himoyasi', () => {
  it('bir kadrdagi ikki bosish -> bitta so\'rov', async () => {
    let resolve!: (v: any) => void;
    mockPost.mockReturnValue(new Promise(res => { resolve = res; }));
    const r = await ready(1);
    const btn = buttonNode(r);
    await act(async () => {
      btn.props.onPress();
      btn.props.onPress();
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ data: { success: true } }));
  });
  it('so\'rov tugagach (xato javob) yana yuborish mumkin', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: false, msg: 'date' } });
    const r = await ready(1);
    await tap(buttonNode(r));
    await tap(buttonNode(r));
    expect(mockPost).toHaveBeenCalledTimes(2);
  });
  it('validatsiya rad etsa qulf ochiladi', async () => {
    const r = await ready(1, '5');
    await tap(buttonNode(r));
    await tap(buttonNode(r));
    expect(toasts().filter(t => t.props.desc === 'minsum')).toHaveLength(2);
  });
});

describe('GiveDebtUser — shartnoma bilan tanishish (PDF havola)', () => {
  const pdf = async (type: 0 | 1, amount: string, usd = false) => {
    const r = await mount(type);
    if (usd) await tap(byText(r, 'usd'));
    await typeAmount(r, amount);
    await pickDate(r, FUTURE);
    await tap(press(r, n => textOf(n).trim() === '282'));
    return r;
  };
  it('type 0 UZS: debitor=qarzoluvchi, creditor=user; imzolanadi; Contract ochiladi', async () => {
    await pdf(0, '500000');
    expect(mockSign).toHaveBeenCalledWith(
      'free_contract',
      'https://pdf.zerox.uz/free_contract.php?debitor=900&creditor=700&download=0&amount=500000&currency=UZS&day=2026-12-15&lang=uz',
    );
    expect(mockNavigate).toHaveBeenCalledWith('Contract', {
      url: 'https://pdf.zerox.uz/free_contract.php?debitor=900&creditor=700&download=0&amount=500000&currency=UZS&day=2026-12-15&lang=uz&sig=1',
      title: '306',
    });
  });
  it('type 1 USD: debitor=user, creditor=qarzoluvchi', async () => {
    await pdf(1, '10,5', true);
    expect(mockSign.mock.calls[0][1]).toBe(
      'https://pdf.zerox.uz/free_contract.php?debitor=700&creditor=900&download=0&amount=10.5&currency=USD&day=2026-12-15&lang=uz',
    );
  });
  it('checkbox almashadi', async () => {
    const r = await mount(0);
    expect(checkbox(r).props.value).toBe(false);
    await check(r);
    expect(checkbox(r).props.value).toBe(true);
    await check(r);
    expect(checkbox(r).props.value).toBe(false);
  });
});

describe('GiveDebtUser — ishtirokchilar va sarlavha', () => {
  const header = (r: TestRenderer.ReactTestRenderer) => r.root.findAll(n => n.type === ('Header' as any))[0];
  it('sarlavha: type 1 -> 147, type 0 -> 150', async () => {
    expect(header(await mount(1)).props.title).toBe('147');
    expect(header(await mount(0)).props.title).toBe('150');
  });
  it('type 0: qarz oluvchi = user, beruvchi = qarzoluvchi', async () => {
    const t = allText(await mount(0));
    expect(t.indexOf('fio(Valiyev Ali Karim)')).toBeLessThan(t.indexOf('fio(Aliyeva Zarina Rustam)'));
  });
  it('type 1: qarz oluvchi = qarzoluvchi, beruvchi = user', async () => {
    const t = allText(await mount(1));
    expect(t.indexOf('fio(Aliyeva Zarina Rustam)')).toBeLessThan(t.indexOf('fio(Valiyev Ali Karim)'));
  });
});

describe('GiveDebtUser — CBU kursi olinmadi (wave D)', () => {
  const WARN = 'USD kursi olinmadi. Xizmat haqi hisobi aniq bo‘lmasligi mumkin.';
  const warnToasts = () => toasts().filter(x => x.props?.desc === WARN);
  it('so\'rov xato bersa: yiqilmaydi, UZS da ogohlantirish yo\'q, USD tanlansa bor', async () => {
    mockGet.mockRejectedValue(new Error('net'));
    const r = await mount(0);
    expect(warnToasts()).toHaveLength(0);
    await tap(byText(r, 'usd'));
    expect(warnToasts()).toHaveLength(1);
  });
  it('bo\'sh javob ([]) bo\'lsa ham ogohlantiradi', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const r = await mount(0);
    await tap(byText(r, 'usd'));
    expect(warnToasts()).toHaveLength(1);
  });
  it('kurs bor bo\'lsa ogohlantirish yo\'q', async () => {
    const r = await mount(0);
    await tap(byText(r, 'usd'));
    expect(warnToasts()).toHaveLength(0);
  });
});
