/**
 * QarzShartnomasi (Qarz shartnomasi bosh sahifasi) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/qarz_shartnomasi_tree.json) + amal testlari (navigatsiya paramlari, oferta qo'riqchisi, yangilash).
 * Faqat chegaralar mock. Qayta yaratish (FAQAT eski komponent bilan): QS_TREE_GEN=1 npx jest qarz_shartnomasi
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockRefresh = { deb: jest.fn(), cred: jest.fn() };
let mockFetch: Record<string, any> = {};
let mockGuardBlocks = false;
let mockUser: any = { data: { first_name: 'Ali' } };

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])) }),
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }) }));
jest.mock('react-redux', () => ({ useSelector: (fn: (s: any) => any) => fn({ HomeReducer: { user: mockUser } }) }));
jest.mock('../src/hooks/useFetch', () => ({
  useFetch: ({ url }: { url: string }) =>
    url.endsWith('type=debitor') ? { ...mockFetch.deb, onRefresh: mockRefresh.deb } : { ...mockFetch.cred, onRefresh: mockRefresh.cred },
}));
jest.mock('../src/hooks/useOfertaGuard', () => ({
  useOfertaGuard: () => (fn: () => void) => {
    if (!mockGuardBlocks) fn();
  },
}));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/components/ui/Grad', () => ({ Grad: (p: any) => require('react').createElement('Grad', { id: p.id }) }));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/components/AnimatedEmpty', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('AnimatedEmpty', { variant: p.variant, text: p.text }),
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/redesign/RdTopBar', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdTopBar', { title: p.title }),
}));
jest.mock('../src/screens/home/redesign/Donut', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('Donut', { segments: p.segments, centerValue: p.centerValue }),
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color })) },
    ),
);

import QarzShartnomasi, { num, sumCur } from '../src/screens/home/modules/QarzShartnomasi';

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
const dt = (d: string) => `${d}T12:00:00`;

const ROWS = {
  data: [
    { residual_amount: '1500000', currency: 'UZS' },
    { residual_amount: 2500000, currency: 'uzs' },
    { residual_amount: '120.5', currency: 'USD' },
    { residual_amount: 'abc', currency: 'UZS' },
    { residual_amount: null },
  ],
  expired: [{ residual_amount: '300000', currency: 'UZS' }, { residual_amount: '-50', currency: 'USD' }],
  five: [
    { residual_amount: 1000000, currency: 'UZS', end_date: dt('2026-11-03'), counter_uid: 'U1', counter_type: 2 },
    { residual_amount: 500000, currency: 'UZS', end_date: dt('2026-11-01'), counter_uid: '', counter_type: 0 },
    { residual_amount: 70, currency: 'USD', end_date: dt('2026-11-09'), counter_uid: 'U2', counter_type: '1' },
    { residual_amount: 20, currency: 'UZS', end_date: dt('2026-10-28') },
  ],
};
const loaded = (data: any) => ({ data: { data }, loading: false });

const setup = (o: { deb?: any; cred?: any; user?: any } = {}) => {
  mockFetch = { deb: o.deb ?? loaded(ROWS), cred: o.cred ?? loaded({ ...ROWS, five: [ROWS.five[0]] }) };
  mockUser = o.user === undefined ? { data: { first_name: 'Ali' } } : o.user;
};
const mount = async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<QarzShartnomasi />);
  });
  return r;
};

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockGuardBlocks = false;
});
afterEach(() => {
  jest.useRealTimers();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'qarz_shartnomasi_tree.json');
const GEN = !!process.env.QS_TREE_GEN;

describe('QarzShartnomasi — render daraxti', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['full', async () => (setup(), mount())],
    ['no user', async () => (setup({ user: null }), mount())],
    ['both loading', async () => (setup({ deb: { data: null, loading: true }, cred: { data: null, loading: true } }), mount())],
    ['only debitor loading', async () => (setup({ deb: { data: null, loading: true } }), mount())],
    ['empty data', async () => (setup({ deb: loaded({}), cred: loaded({}) }), mount())],
    ['null data', async () => (setup({ deb: { data: null, loading: false }, cred: { data: null, loading: false } }), mount())],
    ['no near rows', async () => (setup({ deb: loaded({ ...ROWS, five: [] }), cred: loaded({ ...ROWS, five: undefined }) }), mount())],
    [
      'near USD tab',
      async () => {
        setup();
        const r = await mount();
        await tap(press(r, n => n.props.activeOpacity === 0.8 && textOf(n) === 'USD'));
        return r;
      },
    ],
    [
      'info open',
      async () => {
        setup();
        const r = await mount();
        await tap(press(r, n => n.props.accessibilityRole === 'button' && n.props.accessibilityState && 'expanded' in n.props.accessibilityState));
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

describe('QarzShartnomasi — yordamchilar (eksport)', () => {
  it('num: satr / son / NaN / manfiy / bo\'sh', () => {
    expect(num('1 500 000')).toBe(1500000);
    expect(num('-50')).toBe(-50);
    expect(num('')).toBe(0);
    expect(num('abc')).toBe(0);
    expect(num(null)).toBe(0);
    expect(num(7)).toBe(7);
    expect(num(Infinity)).toBe(0);
  });
  it('sumCur: valyuta bo\'yicha (registr farqsiz, default UZS)', () => {
    expect(sumCur(ROWS.data as any, 'UZS')).toBe(4000000);
    expect(sumCur(ROWS.data as any, 'USD')).toBe(120.5);
    expect(sumCur(undefined, 'UZS')).toBe(0);
  });
});

describe('QarzShartnomasi — amallar', () => {
  it('hero tugmalari: DebtEntry type 1 (berish) / 0 (olish) oferta orqali', async () => {
    setup();
    const r = await mount();
    await tap(press(r, n => n.props.activeOpacity === 0.9 && textOf(n) === 'Qarz berish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('DebtEntry', { type: 1 });
    await tap(press(r, n => n.props.activeOpacity === 0.9 && textOf(n) === 'Qarz olish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('DebtEntry', { type: 0 });
    mockNavigate.mockClear();
    mockGuardBlocks = true;
    await tap(press(r, n => n.props.activeOpacity === 0.9 && textOf(n) === 'Qarz berish'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  it('4 ta qarz kartasi -> SearchDebitor (debtNav paramlari)', async () => {
    setup();
    const r = await mount();
    const cards = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && /Olish kerak|Berish kerak|Muddati o‘tgan/.test(textOf(n)) && !/Muddati oz qolgan/.test(textOf(n)) && n.props.activeOpacity !== 0.6 && n.props.activeOpacity !== 1));
    expect(cards).toHaveLength(4);
    const calls: any[] = [];
    for (const c of cards) {
      mockNavigate.mockClear();
      await tap(c);
      calls.push(mockNavigate.mock.calls[0]);
    }
    expect(calls.map(c => c[0])).toEqual(['SearchDebitor', 'SearchDebitor', 'SearchDebitor', 'SearchDebitor']);
    if (GEN) callsRec.cards = ser(calls);
    else expect(ser(calls)).toBe(goldenCalls.cards);
  });
  it('muddati oz qolgan: karta (SearchDebitor near) va qator (ShowUserDetails, oferta)', async () => {
    setup();
    const r = await mount();
    const cards = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.9 && /Muddati oz qolgan/.test(textOf(n))));
    expect(cards).toHaveLength(2);
    mockNavigate.mockClear();
    await tap(cards[0]);
    const near1 = ser(mockNavigate.mock.calls[0]);
    mockNavigate.mockClear();
    await tap(cards[1]);
    const near2 = ser(mockNavigate.mock.calls[0]);
    const rows = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.6));
    expect(rows).toHaveLength(1 + 1); // debitor: U1 (tappable) ; kreditor: U1
    mockNavigate.mockClear();
    await tap(rows[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('ShowUserDetails', { id: 'U1', type: 2 });
    mockGuardBlocks = true;
    mockNavigate.mockClear();
    await tap(rows[1]);
    expect(mockNavigate).not.toHaveBeenCalled();
    if (GEN) callsRec.near = ser([near1, near2]);
    else expect(ser([near1, near2])).toBe(goldenCalls.near);
  });
  it('qatorlar: counter_uid bo\'sh -> bosilmaydi (disabled)', async () => {
    setup();
    const r = await mount();
    const all = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.disabled === true));
    expect(all.length).toBeGreaterThan(0);
  });
  it('hisobot kartalari: REPORT_NAV params + sarlavha', async () => {
    setup();
    const r = await mount();
    await tap(press(r, n => n.props.accessibilityLabel === 'Berilgan qarzlar'));
    const a = mockNavigate.mock.calls.pop();
    await tap(press(r, n => n.props.accessibilityLabel === 'Olingan qarzlar'));
    const b = mockNavigate.mock.calls.pop();
    expect(a[0]).toBe('SearchDebitor');
    expect(a[1]).toEqual({
      title: 'Berilgan qarzlar',
      type: 1,
      person: 'debitor',
      isHave: false,
      report: true,
      url: '/contract/report?type=debitor&page=1&limit=1000&status=all&start=0&end=0',
      searchUrl: '/contract/report/search?type=debitor&page=1&limit=500&search=',
      iconType: 3,
    });
    expect(b[1]).toEqual({
      title: 'Olingan qarzlar',
      type: 3,
      person: 'creditor',
      isHave: false,
      report: true,
      url: '/contract/report?type=creditor&page=1&limit=1000&status=all&start=0&end=0',
      searchUrl: '/contract/report/search?type=creditor&page=1&limit=500&search=',
      iconType: 3,
    });
  });
  it('yangilash: ikkala so\'rov qayta o\'qiladi', async () => {
    setup();
    const r = await mount();
    const rc = r.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
    await act(async () => {
      rc.props.onRefresh();
    });
    expect(mockRefresh.deb).toHaveBeenCalledWith({});
    expect(mockRefresh.cred).toHaveBeenCalledWith({});
  });
});

// Navigatsiya paramlari (debtNav) eski kodda yozib olingan (QS_TREE_GEN=1) — fixtures/qarz_shartnomasi_calls.json.
const CALLS_PATH = path.join(__dirname, 'fixtures', 'qarz_shartnomasi_calls.json');
const callsRec: Record<string, unknown> = {};
afterAll(() => {
  if (GEN) fs.writeFileSync(CALLS_PATH, JSON.stringify(callsRec, null, 1));
});
const goldenCalls: Record<string, unknown> = !GEN && fs.existsSync(CALLS_PATH) ? JSON.parse(fs.readFileSync(CALLS_PATH, 'utf8')) : {};
