/**
 * Types (Tariflar: obuna + SMS paket xaridi) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan.
 * Xarid TO'LOV payloadlari/URLlari aniq qotirilgan (toBe/toEqual): tarif -> POST /finance/subscription/purchase-from-balance
 * { plan }, SMS paket -> POST /finance/subscription/purchase-addon-from-balance { package_name }.
 * Render daraxti goldenlari: fixtures/tariff_types_tree.json. Qayta yaratish (FAQAT eski komponent bilan): TT_TREE_GEN=1 npx jest tariff_types
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockToast = jest.fn();
const mockPost = jest.fn();
const mockRefresh = { me: jest.fn(), sms: jest.fn(), sub: jest.fn() };
const mockSubProps: { current: any } = { current: null };
let mockFetch: Record<string, any> = {};
let mockUser: any = { data: { balance: 0 } };

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])),
  }),
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }) }));
jest.mock('react-redux', () => ({ useSelector: (fn: (s: any) => any) => fn({ HomeReducer: { user: mockUser } }) }));
jest.mock('react-native-toast-message/lib/src/Toast', () => ({ Toast: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/store/api/apiClient', () => ({ __esModule: true, default: { post: (...a: unknown[]) => mockPost(...a) } }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/hooks/useFetch', () => ({
  useFetch: ({ url }: { url: string }) =>
    url.endsWith('/user/me')
      ? { data: mockFetch.me, onRefresh: mockRefresh.me }
      : url.endsWith('/sms-balance')
      ? { data: mockFetch.sms, onRefresh: mockRefresh.sms }
      : { data: mockFetch.sub, onRefresh: mockRefresh.sub },
}));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdHeader', { title: p.title }),
}));
jest.mock('../src/screens/home/drawer/drawerScreens/SubscriptionStatusCard', () => ({
  __esModule: true,
  default: (p: any) => {
    mockSubProps.current = p;
    return require('react').createElement('SubCard', { sub: p.sub, previous: p.previous, busy: p.busy });
  },
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color })) },
    ),
);

import Types from '../src/screens/home/drawer/drawerScreens/Types';

const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n)))[0];
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => press(r, n => textOf(n).trim() === text);
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const modalVisible = (r: TestRenderer.ReactTestRenderer) => r.root.findAll(n => n.props.transparent === true && typeof n.props.onRequestClose === 'function')[0]?.props.visible;
const toasts = () => mockToast.mock.calls.map(c => c[0]);

const SUB_START = {
  data: { subscription: { plan: 'start', expires_at: '2026-12-01' }, previous: null },
};
const setup = (o: { balance?: any; plan?: string; sms?: any; subData?: any; userBalance?: any } = {}) => {
  mockFetch = {
    me: o.balance === undefined ? { data: { balance: 150000 } } : o.balance,
    sms: o.sms ?? { data: { total: 500, remaining: 120, sent: 370, used: 380 } },
    sub: o.subData ?? { data: { subscription: { plan: o.plan ?? 'free' }, previous: null } },
  };
  mockUser = { data: { balance: o.userBalance ?? 0 } };
};
const mount = async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<Types />);
  });
  return r;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPost.mockReset().mockResolvedValue({ data: { success: true } });
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'tariff_types_tree.json');
const GEN = !!process.env.TT_TREE_GEN;

describe('Types — render daraxti', () => {
  const connectBtn = (r: TestRenderer.ReactTestRenderer, i: number) =>
    outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.85 && textOf(n).trim() === 'Ulanish'))[i];
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['free plan, balance 150000', async () => (setup(), mount())],
    ['start plan current', async () => (setup({ plan: 'start', subData: SUB_START }), mount())],
    ['premium plan current', async () => (setup({ plan: 'premium' }), mount())],
    ['no data at all', async () => ((mockFetch = {}), (mockUser = null), mount())],
    ['balance from redux fallback', async () => (setup({ balance: { data: {} }, userBalance: 5000 }), mount())],
    ['sms balance empty', async () => (setup({ sms: { data: {} } }), mount())],
    ['sms used > total clamp', async () => (setup({ sms: { data: { total: 100, remaining: 0, used: 150 } } }), mount())],
    ['sms used derived (no used field)', async () => (setup({ sms: { data: { total: 100, remaining: 40 } } }), mount())],
    [
      'pay modal start (enough balance)',
      async () => {
        setup({ balance: { data: { balance: 150000 } } });
        const r = await mount();
        await tap(connectBtn(r, 0));
        return r;
      },
    ],
    [
      'pay modal premium (insufficient)',
      async () => {
        setup({ balance: { data: { balance: 150000 } } });
        const r = await mount();
        await tap(connectBtn(r, 1));
        return r;
      },
    ],
    [
      'pay modal sms packet medium',
      async () => {
        setup({ balance: { data: { balance: 50000 } } });
        const r = await mount();
        await tap(outer(r.root.findAll(n => typeof n.props.onPress === 'function' && textOf(n).trim() === 'Sotib olish'))[1]);
        return r;
      },
    ],
    [
      'pay modal exact balance equals price',
      async () => {
        setup({ balance: { data: { balance: 99000 } } });
        const r = await mount();
        await tap(connectBtn(r, 0));
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

describe('Types — xarid payloadlari va oqim (QOTIRILGAN)', () => {
  const connect = (r: TestRenderer.ReactTestRenderer, i: number) =>
    outer(r.root.findAll(n => typeof n.props.onPress === 'function' && textOf(n).trim() === 'Ulanish'))[i];
  const packet = (r: TestRenderer.ReactTestRenderer, i: number) =>
    outer(r.root.findAll(n => typeof n.props.onPress === 'function' && textOf(n).trim() === 'Sotib olish'))[i];

  it('Start: POST /finance/subscription/purchase-from-balance {plan:"start"}', async () => {
    setup({ balance: { data: { balance: 150000 } } });
    const r = await mount();
    await tap(connect(r, 0));
    expect(modalVisible(r)).toBe(true);
    await tap(byText(r, 'Tasdiqlash'));
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toBe('/finance/subscription/purchase-from-balance');
    expect(mockPost.mock.calls[0][1]).toEqual({ plan: 'start' });
    expect(mockPost.mock.calls[0]).toHaveLength(2);
  });
  it('wave E: bir renderda ikki marta Tasdiqlash - bitta POST', async () => {
    setup({ balance: { data: { balance: 150000 } } });
    mockPost.mockReturnValue(new Promise(() => {}));
    const r = await mount();
    await tap(connect(r, 0));
    const node = byText(r, 'Tasdiqlash');
    await act(async () => {
      node.props.onPress();
      node.props.onPress();
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
  it('Premium: body {plan:"premium"}', async () => {
    setup({ balance: { data: { balance: 250000 } } });
    const r = await mount();
    await tap(connect(r, 1));
    await tap(byText(r, 'Tasdiqlash'));
    expect(mockPost.mock.calls[0][0]).toBe('/finance/subscription/purchase-from-balance');
    expect(mockPost.mock.calls[0][1]).toEqual({ plan: 'premium' });
  });
  it.each([
    [0, 'small'],
    [1, 'medium'],
    [2, 'large'],
  ])('SMS paket #%i: POST /finance/subscription/purchase-addon-from-balance {package_name:"%s"}', async (i, name) => {
    setup({ balance: { data: { balance: 100000 } } });
    const r = await mount();
    await tap(packet(r, i as number));
    await tap(byText(r, 'Tasdiqlash'));
    expect(mockPost.mock.calls[0][0]).toBe('/finance/subscription/purchase-addon-from-balance');
    expect(mockPost.mock.calls[0][1]).toEqual({ package_name: name });
  });
  it('modal matnlari: sarlavha, tarif, narx (plan / paket)', async () => {
    setup();
    let r = await mount();
    await tap(connect(r, 0));
    let t = tree(r);
    expect(t).toContain('Tarifga ulanish');
    expect(t).toContain('START');
    r = await mount();
    await tap(packet(r, 1));
    t = tree(r);
    expect(t).toContain('SMS paket sotib olish');
    expect(t).toContain('200 SMS');
  });
  it('muvaffaqiyat: toast (plan/paket matni), uchala so\'rov yangilanadi, modal yopiladi', async () => {
    setup();
    const r = await mount();
    await tap(connect(r, 0));
    await tap(byText(r, 'Tasdiqlash'));
    expect(toasts()).toEqual([{ autoHide: true, visibilityTime: 2400, position: 'bottom', type: 'omad', props: { desc: 'Tarif muvaffaqiyatli ulandi' } }]);
    expect(mockRefresh.me).toHaveBeenCalledWith({});
    expect(mockRefresh.sms).toHaveBeenCalledWith({});
    expect(mockRefresh.sub).toHaveBeenCalledWith({});
    expect(modalVisible(r)).toBe(false);
    mockToast.mockClear();
    await tap(packet(r, 0));
    await tap(byText(r, 'Tasdiqlash'));
    expect(toasts()[0].props.desc).toBe('SMS paket qo‘shildi');
  });
  it('402 insufficient-balance: tegishli xato toast, modal yopiladi, yangilanmaydi', async () => {
    setup();
    mockPost.mockRejectedValue({ response: { status: 402, data: { code: 'insufficient-balance' } } });
    const r = await mount();
    await tap(connect(r, 0));
    await tap(byText(r, 'Tasdiqlash'));
    expect(toasts()).toEqual([{ autoHide: true, visibilityTime: 2600, position: 'bottom', type: 'error2', props: { desc: 'Mobil hisobda mablag‘ yetarli emas' } }]);
    expect(modalVisible(r)).toBe(false);
    expect(mockRefresh.me).not.toHaveBeenCalled();
  });
  it('boshqa xato (402 boshqa kod / tarmoq): umumiy xato toast', async () => {
    setup();
    for (const err of [{ response: { status: 402, data: { code: 'x' } } }, { response: { status: 500 } }, new Error('net')]) {
      mockToast.mockClear();
      mockPost.mockRejectedValue(err);
      const r = await mount();
      await tap(connect(r, 0));
      await tap(byText(r, 'Tasdiqlash'));
      expect(toasts()).toEqual([
        { autoHide: true, visibilityTime: 2600, position: 'bottom', type: 'error2', props: { desc: 'Amalni bajarib bo‘lmadi. Birozdan so‘ng urinib ko‘ring' } },
      ]);
    }
  });
  it('band vaqtida ikkinchi tasdiqlash e\'tiborsiz, tugmalar bloklanadi', async () => {
    setup();
    let resolve: (v: any) => void = () => {};
    mockPost.mockReturnValue(new Promise(res => (resolve = res)));
    const r = await mount();
    await tap(connect(r, 0));
    const confirm = byText(r, 'Tasdiqlash');
    await act(async () => {
      confirm.props.onPress();
    });
    const disabled = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.disabled === true));
    expect(disabled.length).toBeGreaterThan(3);
    await act(async () => {
      disabled.forEach(n => n.props.onPress());
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockSubProps.current.busy).toBe(true);
    await act(async () => {
      resolve({});
    });
    expect(mockSubProps.current.busy).toBe(false);
  });
  it('balans yetmasa: "Mobil hisobni to\'ldirish" -> PayScreen, so\'rov yo\'q', async () => {
    setup({ balance: { data: { balance: 1000 } } });
    const r = await mount();
    await tap(connect(r, 0));
    expect(byText(r, 'Tasdiqlash')).toBeUndefined();
    await tap(byText(r, 'Mobil hisobni to‘ldirish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('PayScreen');
    expect(mockPost).not.toHaveBeenCalled();
    expect(modalVisible(r)).toBe(false);
  });
  it('balans narxga teng bo\'lsa Tasdiqlash chiqadi', async () => {
    setup({ balance: { data: { balance: 99000 } } });
    const r = await mount();
    await tap(connect(r, 0));
    expect(byText(r, 'Tasdiqlash')).toBeDefined();
  });
  it('bekor qilish va yopish tugmasi modalni yopadi', async () => {
    setup();
    const r = await mount();
    await tap(connect(r, 0));
    await tap(byText(r, 'Bekor qilish'));
    expect(modalVisible(r)).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
    await tap(connect(r, 0));
    const modal = r.root.findAll(n => n.props.transparent === true && typeof n.props.onRequestClose === 'function')[0];
    await act(async () => {
      modal.props.onRequestClose();
    });
    expect(modalVisible(r)).toBe(false);
  });
  it('SubscriptionStatusCard.onRenew -> shu tarif modali (nomi bilan)', async () => {
    setup({ subData: SUB_START });
    const r = await mount();
    expect(mockSubProps.current.sub).toEqual(SUB_START.data.subscription);
    await act(async () => {
      mockSubProps.current.onRenew('premium');
    });
    expect(tree(r)).toContain('Premium');
  });
  it('onRenew noma\'lum tarif kaliti: nomi kalitning o\'zi', async () => {
    setup();
    const r = await mount();
    await act(async () => {
      mockSubProps.current.onRenew('zzz');
    });
    expect(modalVisible(r)).toBe(true);
    expect(tree(r)).toContain('zzz');
  });
  it('joriy tarif / bepul tarif belgisi, boshqa tarifda "Ulanish"', async () => {
    setup({ plan: 'start' });
    const r = await mount();
    expect(tree(r)).toContain('Joriy tarif');
    expect(tree(r)).toContain('Bepul tarif');
    expect(connect(r, 0)).toBeDefined();
    expect(connect(r, 1)).toBeUndefined();
  });
  it('tugmalar: SMS tarixi, balansni to\'ldirish', async () => {
    setup();
    const r = await mount();
    await tap(press(r, n => n.props.accessibilityLabel === 'SMS xabarlar tarixi'));
    expect(mockNavigate).toHaveBeenLastCalledWith('SmsHistory');
    await tap(byText(r, 'To‘ldirish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('PayScreen');
  });
});
