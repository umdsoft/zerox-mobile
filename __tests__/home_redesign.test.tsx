/**
 * HomeRedesign (bosh sahifa) xarakteristika testlari — wave B bo'linishidan OLDIN yozilgan.
 * Daraxtlar fixtures/home_redesign_tree.json da qotirilgan (eski komponentdan); !useReal (demo) shoxi O'ZGARMAGAN.
 * Mock'lar faqat chegaralarda: redux, navigatsiya, useFetch, axios, Toast, storage, socket, homeCache, qarzShop,
 * ikonlar, SVG, i18n. Qayta yaratish (FAQAT eski komponent bilan): HR_TREE_GEN=1 npx jest home_redesign
 * Tartib muhim: HomeRedesign modul darajasida dashboard KESHI saqlaydi — dashboard'siz holatlar birinchi turadi.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockNavDispatch = jest.fn();
const mockReset = jest.fn();
const mockToastHide = jest.fn();
const mockAxiosGet = jest.fn();
const mockDashRefresh = jest.fn();
const mockStatsRefresh = jest.fn();
const mockHydrate = jest.fn();
const mockPrime = jest.fn();
const mockSave = jest.fn();
const mockSocketInit = jest.fn();
const mockSocketConnect = jest.fn();
const mockDispatch = jest.fn();
const mockNavObj = { navigate: mockNavigate, dispatch: mockNavDispatch, reset: mockReset }; // barqaror (haqiqiy navigatsiya kabi)
let mockHomeCall: () => Promise<any> = () => new Promise(() => {});
let mockState: any = {};
let mockToken: string | undefined = 'tok';
let mockDash: any = { data: null, error: null, loading: false };
let mockStats: any = { data: null, error: null, loading: false };
let mockSocketState = 'Offline';
let mockSocket: any = null;
let mockShopQs = '?s=1';
let mockFocusTick = 0;

jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (k: string) => k, language: 'uz' } }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])),
    i18n: { language: 'uz' },
  }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavObj,
  DrawerActions: { openDrawer: () => ({ type: 'OPEN_DRAWER' }) },
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb, mockFocusTick]),
}));
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn: (s: any) => any) => fn({ HomeReducer: mockState }),
}));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { hide: (...a: unknown[]) => mockToastHide(...a), show: jest.fn() } }));
jest.mock('axios', () => ({ __esModule: true, default: { get: (...a: unknown[]) => mockAxiosGet(...a) } }));
jest.mock('../src/store/api/home', () => ({
  HomeApi: (a: unknown) => ({ __t: 'HomeApi', a }),
  getNotificationWithPage: (a: unknown) => ({ __t: 'Notif', a }),
}));
jest.mock('../src/store/reducers/HomeReducer', () => ({ setAnalytics: (p: unknown) => ({ type: 'setAnalytics', payload: p }) }));
jest.mock('../src/store/api/token/getToken', () => ({
  storage: { getString: (k: string) => (k === 'token' ? mockToken : k === 'user_id' ? 'u1' : undefined) },
}));
jest.mock('../src/store/api/token/qarzShop', () => ({ ownShopQuery: () => mockShopQs, useQarzShop: () => undefined }));
jest.mock('../src/helper/useFio', () => ({ fioNow: (s: string) => s }));
jest.mock('../src/helper/socketService', () => ({
  __esModule: true,
  default: {
    connected: () => mockSocketState,
    init: (...a: unknown[]) => mockSocketInit(...a),
    getSocket: () => mockSocket,
  },
}));
jest.mock('../src/helper/homeCache', () => ({
  homeDashboardUrl: () => 'dashUrl',
  homeDebtStatsUrl: () => 'statsUrl',
  hydrateHomeFromCache: (...a: unknown[]) => mockHydrate(...a),
  primeHomeFetchCache: (...a: unknown[]) => mockPrime(...a),
  saveHomeSnapshot: (...a: unknown[]) => mockSave(...a),
}));
jest.mock('../src/hooks/useFetch', () => ({
  useFetch: ({ url }: { url: string }) =>
    String(url).includes('/qarz-daftari/dashboard')
      ? { ...mockDash, onRefresh: mockDashRefresh }
      : { ...mockStats, onRefresh: mockStatsRefresh },
}));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/screens/home/modules/debtPlan/DebtPlanHomeRow', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('DebtPlanHomeRow', { data: p.data, style: p.style }),
}));
jest.mock('../src/images/TextAndLogo', () => ({ __esModule: true, default: () => require('react').createElement('Wordmark') }));
jest.mock('../src/screens/home/redesign/icons', () => new Proxy({}, { get: (_t, k) => (k === '__esModule' ? true : () => require('react').createElement('Icon', { name: String(k) })) }));
jest.mock('react-native-svg', () => {
  const R = require('react');
  const host = (name: string) => ({ children, ...rest }: any) => R.createElement(name, rest, children);
  return {
    __esModule: true,
    default: host('Svg'),
    Defs: host('Defs'),
    LinearGradient: host('LinearGradient'),
    Rect: host('Rect'),
    Stop: host('Stop'),
  };
});
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => (k === 'gradient' ? ['#111', '#222'] : '#000') }),
    font: new Proxy({}, { get: () => 'F' }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));

import HomeRedesign, { sumCur } from '../src/screens/home/redesign/HomeRedesign';

const NOW = new Date('2026-11-01T10:00:00Z');
const textOf = (n: any): string => n.children.map((c: any) => (typeof c === 'string' ? c : textOf(c))).join('');
const allText = (r: TestRenderer.ReactTestRenderer) => textOf(r.root);
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n))[0];
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => press(r, n => textOf(n).trim() === text);
// Ikonkani o'z ichiga olgan ENG ICHKI bosiladigan element (tashqi kartalar emas).
const byIcon = (r: TestRenderer.ReactTestRenderer, icon: string) => {
  const list = r.root.findAll(
    n => typeof n.props.onPress === 'function' && n.findAll((c: any) => c.type === 'Icon' && c.props.name === icon).length > 0,
  );
  return list[list.length - 1];
};
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress({ stopPropagation: () => {} });
  });
};

const user = (over: any = {}) => ({ data: { id: 1, is_active: 1, first_name: 'ALI', ...over } });
const cred = () => ({
  data: [
    { residual_amount: '1000000', currency: 'UZS' },
    { residual_amount: '50.5', currency: 'USD' },
    { residual_amount: '250000', currency: 'UZS' },
  ],
  chart: { jarayon: 3 }, five: [1, 2], expired: [1],
});
const deb = () => ({ data: [{ residual_amount: '400000', currency: 'UZS' }, { residual_amount: '10.25', currency: 'USD' }], chart: { jarayon: 2 }, five: [], expired: [1, 2] });
const dashboard = () => ({
  berilgan_qarz: { shartnoma: { uzs: 1000000, usd: 100 }, daftari: { uzs: 500000, usd: 0 }, shaxsiy: { uzs: 200000, usd: 5 } },
  olingan_qarz: { shartnoma: { uzs: 300000, usd: 0 }, daftari: { uzs: 120000, usd: 3.5 }, shaxsiy: { uzs: 80000, usd: 0 } },
});
const stats = () => ({ data: { lent_by_currency: [{ currency: 'UZS', total: '300000' }, { currency: 'USD', total: '20' }], borrowed_by_currency: [{ currency: 'UZS', total: '150000' }] } });
const bild = (n = 2) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1, amount: String(250000 + i), creditor: 1, d_first_name: 'KARIM', d_last_name: 'ALIYEV', currency: 'UZS', created: '31.10.2026', time: '14:30:00',
  }));
const realState = (over: any = {}) => ({
  user: user(), home: { creditor: { data: cred() }, debitor: { data: deb() } }, notification: { bild: bild() }, usd: 12000,
  analytics: { health: { score: 82, status: 'good' }, debts: { lent_uzs: 111, lent_usd: 2, borrowed_uzs: 222, borrowed_usd: 3 }, debtPlan: { x: 1 } }, ...over,
});

const mount = async (state: any, opts: { dash?: any; stats?: any; token?: string | undefined } = {}) => {
  mockState = state;
  mockDash = { data: opts.dash ? { data: opts.dash } : null, error: null, loading: false };
  mockStats = { data: opts.stats ?? null, error: null, loading: false };
  if ('token' in opts) mockToken = opts.token;
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<HomeRedesign />);
  });
  return r;
};
// ScrollView.refreshControl kabi element-prop'larning `_owner` (Fiber) aylanma havolasi tashlab yuboriladi.
const ser = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON(), (k, v) => (k === '_owner' ? undefined : v));
const refocus = async (r: TestRenderer.ReactTestRenderer) => {
  mockFocusTick += 1;
  await act(async () => {
    r.update(<HomeRedesign />);
  });
};

const resetAll = () => {
  jest.clearAllMocks();
  mockState = {};
  mockToken = 'tok';
  mockDash = { data: null, error: null, loading: false };
  mockStats = { data: null, error: null, loading: false };
  mockSocketState = 'Offline';
  mockSocket = null;
  mockShopQs = '?s=1';
  mockHomeCall = () => new Promise(() => {});
  mockDispatch.mockImplementation((a: any) => (a?.__t === 'HomeApi' ? { unwrap: () => mockHomeCall() } : a));
  mockSocketInit.mockResolvedValue(undefined);
  mockAxiosGet.mockResolvedValue({ data: { data: { health: { score: 5 } } } });
};
beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  resetAll();
});
afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------------------------------------------
// Render DARAXTI (TARTIB MUHIM — dashboard keshi modul darajasida)
// ---------------------------------------------------------------------------------------------------------------
const TREE_PATH = path.join(__dirname, 'fixtures', 'home_redesign_tree.json');
const GEN_TREE = !!process.env.HR_TREE_GEN;

describe('HomeRedesign — render daraxti (vizual chiqish o\'zgarmagan)', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    // --- dashboard KESHI bo'sh holatlar ---
    ['demo (no token, no home)', () => mount({ user: null, home: null, notification: null, usd: 1, analytics: null }, { token: undefined })],
    ['first load skeleton (token, nothing)', () => mount({ user: user(), home: null, notification: null, usd: 1, analytics: null })],
    ['dashboard error, real home', async () => {
      mockState = realState();
      mockDash = { data: null, error: new Error('x'), loading: false };
      mockStats = { data: null, error: null, loading: false };
      let r!: TestRenderer.ReactTestRenderer;
      await act(async () => {
        r = TestRenderer.create(<HomeRedesign />);
      });
      return r;
    }],
    // --- dashboard bor ---
    ['real full', () => mount(realState(), { dash: dashboard(), stats: stats() })],
    ['real without stats (analytics.debts fallback)', () => mount(realState(), { dash: dashboard() })],
    ['real empty home', () => mount({ user: user(), home: { creditor: { data: { data: [] } }, debitor: { data: { data: [] } } }, notification: { bild: [] }, usd: 12000, analytics: null }, { dash: {} })],
    ['real no_data health', () => mount(realState({ analytics: { health: { score: null, status: 'no_data' } } }), { dash: dashboard(), stats: stats() })],
    ['real local health fallback', () => mount(realState({ analytics: null }), { dash: dashboard(), stats: stats() })],
    ['unidentified user', () => mount(realState({ user: user({ is_active: 0 }) }), { dash: dashboard(), stats: stats() })],
    ['many notifications badge 99+', () => mount(realState({ notification: { bild: bild(120) } }), { dash: dashboard(), stats: stats() })],
    ['net negative', () => mount(realState({ home: { creditor: { data: { data: [{ residual_amount: '10', currency: 'UZS' }], chart: { jarayon: 0 }, five: [], expired: [] } }, debitor: { data: deb() } } }), { dash: dashboard(), stats: stats() })],
    ['module info modal open', async () => {
      const r = await mount(realState(), { dash: dashboard(), stats: stats() });
      await tap(byIcon(r, 'InfoIcon'));
      return r;
    }],
  ];

  if (GEN_TREE) {
    test('daraxtlarni eski komponentdan yaratish', async () => {
      const out: Record<string, string> = {};
      for (const [name, build] of states) {
        resetAll();
        jest.setSystemTime(NOW);
        const r = await build();
        out[name] = ser(r);
        await act(async () => r.unmount());
      }
      fs.writeFileSync(TREE_PATH, JSON.stringify(out, null, 1));
    });
    return;
  }
  const golden: Record<string, string> = JSON.parse(fs.readFileSync(TREE_PATH, 'utf8'));
  test('har bir holat fixture bilan qamrab olingan', () => {
    expect(Object.keys(golden).sort()).toEqual(states.map(s => s[0]).sort());
  });
  test.each(states.map(s => s[0]))('%s', async name => {
    resetAll();
    jest.setSystemTime(NOW);
    const r = await states.find(s => s[0] === name)![1]();
    expect(ser(r)).toBe(golden[name]);
    await act(async () => r.unmount());
  });
});

// ---------------------------------------------------------------------------------------------------------------
// HODISALAR VA YON TA'SIRLAR
// ---------------------------------------------------------------------------------------------------------------
describe('HomeRedesign — navigatsiya', () => {
  const setup = () => mount(realState(), { dash: dashboard(), stats: stats() });
  test('sarlavha: menyu, qo\'ng\'iroq, profil', async () => {
    const r = await setup();
    await tap(byIcon(r, 'MenuIcon'));
    expect(mockNavDispatch).toHaveBeenCalledWith({ type: 'OPEN_DRAWER' });
    await tap(byIcon(r, 'BellIcon'));
    expect(mockNavigate).toHaveBeenLastCalledWith('Notification', undefined);
    await tap(press(r, n => n.findAll((c: any) => c.type === 'Icon' && c.props.name === 'UserIcon').length > 0));
    expect(mockNavigate).toHaveBeenLastCalledWith('UserScreen', { user: realState().user.data });
  });
  test('hero, metrik kartalar, modullar, reja qatori', async () => {
    const r = await setup();
    await tap(press(r, n => n.props.accessibilityLabel === 'Moliyaviy holat'));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinancialHealth', undefined);
    await tap(press(r, n => textOf(n).includes('Berilgan qarz') && n.props.style && JSON.stringify(n.props.style).includes('totalCard') === false && textOf(n).includes('UZS') && !textOf(n).includes('Qarz')));
    expect(mockNavigate.mock.calls.pop()[0]).toBe('SearchDebitor');
    await tap(press(r, n => textOf(n).includes('Qarz shartnomasi') && textOf(n).includes('UZS')));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzShartnomasi', undefined);
    await tap(press(r, n => textOf(n).includes('Qarz daftari') && textOf(n).includes('UZS')));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftari', undefined);
    await tap(press(r, n => textOf(n).includes('Shaxsiy qarz') && textOf(n).includes('UZS')));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceDebts', undefined);
    const plan = r.root.findAll(n => (n.type as any) === 'DebtPlanHomeRow')[0];
    expect(plan.props.data).toEqual({ x: 1 });
    await act(async () => plan.parent!.props.onPress());
    expect(mockNavigate).toHaveBeenLastCalledWith('DebtPlan', undefined);
  });
  test('metrik kartalar: SearchDebitor paramlari (debitor / creditor, view=select)', async () => {
    const r = await setup();
    const cards = r.root.findAll(n => typeof n.props.onPress === 'function' && /^(Berilgan qarz|Olingan qarz)/.test(textOf(n).trim()) && textOf(n).includes('UZS') && !/Qarz (shartnomasi|daftari)|Shaxsiy/.test(textOf(n)));
    const dbt = cards.find(n => textOf(n).startsWith('Berilgan qarz'))!;
    await act(async () => dbt.props.onPress());
    const call = mockNavigate.mock.calls.pop();
    expect(call[0]).toBe('SearchDebitor');
    expect(call[1].view).toBe('select');
    expect(call[1].person).toBe('debitor');
    const crd = cards.find(n => textOf(n).startsWith('Olingan qarz'))!;
    await act(async () => crd.props.onPress());
    expect(mockNavigate.mock.calls.pop()[1].person).toBe('creditor');
  });
});

describe('HomeRedesign — yuklash va yon ta\'sirlar', () => {
  test('mount: HomeApi dedupe; UNAUTHORIZED -> LoginWithPhone reset; boshqa xato reset qilmaydi', async () => {
    mockHomeCall = () => Promise.reject({ code: 'UNAUTHORIZED' });
    await mount(realState(), { dash: dashboard() });
    expect(mockDispatch.mock.calls.map(c => c[0]).find((a: any) => a?.__t === 'HomeApi')).toEqual({ __t: 'HomeApi', a: { page: 1, dedupe: true } });
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'LoginWithPhone' }] });
    mockReset.mockClear();
    mockHomeCall = () => Promise.reject({ response: { data: { code: 'NETWORK' } } });
    await mount(realState(), { dash: dashboard() });
    expect(mockReset).not.toHaveBeenCalled();
  });
  test('skeleton birinchi yuklash tugagach (xato bo\'lsa ham) yo\'qoladi', async () => {
    mockHomeCall = () => Promise.resolve({});
    const r = await mount({ user: user(), home: null, notification: null, usd: 1, analytics: null });
    await act(async () => {});
    const settled = ser(r);
    mockHomeCall = () => new Promise(() => {});
    const r2 = await mount({ user: user(), home: null, notification: null, usd: 1, analytics: null });
    expect(settled).not.toBe(ser(r2));
  });
  test('kesh: user yo\'q bo\'lsa prime + hydrate, bor bo\'lsa chaqirilmaydi', async () => {
    await mount({ user: null, home: null, notification: null, usd: 1, analytics: null }, { token: undefined });
    expect(mockPrime).toHaveBeenCalledTimes(1);
    expect(mockHydrate).toHaveBeenCalledWith(mockDispatch);
    mockPrime.mockClear();
    mockHydrate.mockClear();
    await mount(realState(), { dash: dashboard() });
    expect(mockPrime).not.toHaveBeenCalled();
    expect(mockHydrate).not.toHaveBeenCalled();
  });
  test('socket: offline bo\'lsa init(String(id)) + connect; ulangan bo\'lsa init yo\'q', async () => {
    mockSocket = { connected: false, connect: mockSocketConnect };
    await mount(realState(), { dash: dashboard() });
    expect(mockSocketInit).toHaveBeenCalledWith('1');
    expect(mockSocketConnect).toHaveBeenCalled();
    mockSocketInit.mockClear();
    mockSocketState = 'Online';
    await mount(realState(), { dash: dashboard() });
    expect(mockSocketInit).not.toHaveBeenCalled();
  });
  test('fokus: Toast.hide, socket tekshiruvi har 20 s, o\'lik socket qayta ulanadi', async () => {
    mockSocketState = 'Online';
    mockSocket = { connected: false, connect: mockSocketConnect };
    await mount(realState(), { dash: dashboard() });
    expect(mockToastHide).toHaveBeenCalled();
    const before = mockSocketConnect.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(20000);
    });
    expect(mockSocketConnect.mock.calls.length).toBe(before + 1);
  });
  test('2-fokus: bildirishnoma jim yangilanadi, statistika + dashboard + analytics qayta yuklanadi', async () => {
    mockSocketState = 'Online';
    const r = await mount(realState(), { dash: dashboard(), stats: stats() });
    expect(mockDispatch.mock.calls.some(c => c[0]?.__t === 'Notif')).toBe(false);
    expect(mockStatsRefresh).not.toHaveBeenCalled();
    await refocus(r);
    expect(mockDispatch).toHaveBeenCalledWith({ __t: 'Notif', a: { page: 1 } });
    expect(mockStatsRefresh).toHaveBeenCalledWith({});
    expect(mockDashRefresh).toHaveBeenCalledWith({});
    expect(mockAxiosGet).toHaveBeenCalledWith('http://x/home/analytics', { headers: { Authorization: 'Bearer tok' } });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'setAnalytics', payload: { health: { score: 5 } } });
  });
  test('pull-to-refresh: HomeApi({page:1}), statistika va dashboard qayta, tugagach refreshing=false', async () => {
    let finish!: () => void;
    mockHomeCall = () => new Promise(res => { finish = () => res({}); });
    const r = await mount(realState(), { dash: dashboard(), stats: stats() });
    mockDispatch.mockClear();
    mockStatsRefresh.mockClear();
    mockDashRefresh.mockClear();
    const rc = r.root.findAll(n => typeof n.props.onRefresh === 'function' && 'refreshing' in n.props)[0];
    expect(rc.props.refreshing).toBe(false);
    await act(async () => rc.props.onRefresh());
    expect(mockDispatch).toHaveBeenCalledWith({ __t: 'HomeApi', a: { page: 1 } });
    expect(mockStatsRefresh).toHaveBeenCalledWith({});
    expect(mockDashRefresh).toHaveBeenCalledWith({});
    const rc2 = r.root.findAll(n => typeof n.props.onRefresh === 'function' && 'refreshing' in n.props)[0];
    expect(rc2.props.refreshing).toBe(true);
    await act(async () => finish());
    for (let i = 0; i < 4; i++) await act(async () => {});
    const rc3 = r.root.findAll(n => typeof n.props.onRefresh === 'function' && 'refreshing' in n.props)[0];
    expect(rc3.props.refreshing).toBe(false);
  });
  test('snapshot: 800 ms dan keyin user_id bilan yoziladi (dashboard va stats URL kalitlari)', async () => {
    await mount(realState(), { dash: dashboard(), stats: stats() });
    expect(mockSave).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    const [uid, snap] = mockSave.mock.calls[0];
    expect(uid).toBe('u1');
    expect(Object.keys(snap).sort()).toEqual(['analytics', 'bild', 'fetch', 'home', 'user']);
    expect(Object.keys(snap.fetch).sort()).toEqual(['dashUrl', 'statsUrl']);
    expect(snap.bild.length).toBe(2);
  });
  test('snapshot yozilmaydi: home yo\'q (demo)', async () => {
    await mount({ user: user(), home: null, notification: null, usd: 1, analytics: null });
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockSave).not.toHaveBeenCalled();
  });
  test('dashboard keshi: yangi javob bo\'sh bo\'lsa oldingi (shu do\'kon) qiymat qoladi; do\'kon boshqa bo\'lsa — yo\'q', async () => {
    const r1 = await mount(realState(), { dash: dashboard(), stats: stats() });
    const full = ser(r1);
    await act(async () => r1.unmount());
    const r2 = await mount(realState(), { stats: stats() }); // dashboard hali kelmagan
    expect(ser(r2)).toBe(full);
    await act(async () => r2.unmount());
    mockShopQs = '?s=2';
    const r3 = await mount(realState(), { stats: stats() });
    expect(ser(r3)).not.toBe(full);
  });
});

describe('sumCur', () => {
  test('valyuta bo\'yicha jamlash: USD tsent, UZS butun', () => {
    expect(sumCur([{ residual_amount: '10.4', currency: 'USD' }, { residual_amount: '0.3', currency: 'usd' }], 'USD')).toBe(10.7);
    expect(sumCur([{ residual_amount: '100.6', currency: 'UZS' }, { residual_amount: '1' }], 'UZS')).toBe(102);
    expect(sumCur(undefined, 'UZS')).toBe(0);
  });
});
