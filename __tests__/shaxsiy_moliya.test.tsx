/**
 * ShaxsiyMoliya (dashboard) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/shaxsiy_moliya_tree.json) + amal testlari (navigatsiya, grafik filtrlari, fokusda yangilash).
 * Faqat chegaralar mock. Qayta yaratish (FAQAT eski komponent bilan): SM_TREE_GEN=1 npx jest shaxsiy_moliya
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockRefresh = jest.fn();
const mockFocus: { cb: null | (() => void) } = { cb: null };
let mockDash: any = {};
let mockParams: any = {};

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }),
  useRoute: () => ({ params: mockParams }),
  useFocusEffect: (cb: () => void) => {
    mockFocus.cb = cb;
    require('react').useEffect(() => {
      cb();
    }, []);
  },
}));
jest.mock('../src/hooks/useFetch', () => ({ useFetch: () => ({ ...mockDash, onRefresh: mockRefresh }) }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/components/AnimatedEmpty', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('AnimatedEmpty', { variant: p.variant, compact: p.compact }),
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdHeader', { title: p.title, showBack: p.showBack }),
}));
jest.mock('../src/screens/home/redesign/RdTopBar', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdTopBar', { title: p.title }),
}));
jest.mock('../src/screens/home/modules/FinanceCalendarCard', () => ({ __esModule: true, default: () => require('react').createElement('CalendarCard') }));
jest.mock('../src/screens/home/modules/PersonalDebtReminderCard', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('ReminderCard', { endpoint: p.endpoint, route: p.route, subtitle: p.subtitle }),
}));
jest.mock('../src/components/ui/Grad', () => ({ Grad: (p: any) => require('react').createElement('Grad', { id: p.id, colors: p.colors }) }));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, k) =>
          k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color }),
      },
    ),
);

import ShaxsiyMoliya from '../src/screens/home/modules/ShaxsiyMoliya';

const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const pressables = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean = () => true) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n)));
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => pressables(r, n => textOf(n).trim() === text)[0];
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};

const FULL = {
  balance: 1250000,
  incomes: {
    monthly_total_uzs: 5000000,
    by_currency: [{ currency: 'UZS', total: '5000000' }, { currency: 'USD', total: '120.5' }],
    by_category: [
      { name: 'salary', icon: '💼', total: '4000000', currency: 'UZS' },
      { name: 'Custom', total: '1000000', currency: 'UZS', color: '#abcdef' },
      { name: '', total: '0' },
    ],
    recent: [
      { income_date: '2026-10-20', created_at: '2026-10-20 09:00:00', description: 'Oylik', category: { name: 'salary' }, amount: '4000000', currency: 'UZS' },
      { income_date: '2026-10-25', created_at: '2026-10-25 10:00:00', description: '', category: { name: 'gift' }, amount: '50', currency: 'USD' },
    ],
  },
  expenses: {
    monthly_total_uzs: 3750000,
    by_currency: [{ currency: 'UZS', total: '3750000' }],
    top_categories: [
      { name: 'food', total: '2000000', currency: 'UZS' },
      { name: 'transport', total: '1750000', currency: 'UZS' },
    ],
    recent: [
      { expense_date: '2026-10-25', created_at: '2026-10-25 12:00:00', description: 'Bozor', category: { name: 'food' }, amount: '300000', currency: 'UZS' },
      { expense_date: '2026-10-22', created_at: '2026-10-22 08:00:00', category: null, amount: '15000', currency: undefined },
    ],
  },
  budget: { percentage: 50, spent: 1500000, planned: 3000000, remaining: 1500000 },
  daily_series: [{ income: '100', expense: '50' }, { income: 0, expense: '200' }, { income: '300', expense: 0 }],
  monthly_series: [{ label: 'Yan', income: '1000', expense: '500' }, { label: 'Fev', income: '200', expense: '900' }],
};
const withBudget = (b: any) => ({ ...FULL, budget: b });
const loaded = (data: any, extra: any = {}) => ({ data: { data }, loading: false, error: false, ...extra });

const mount = async (dash: any, params: any = {}) => {
  mockDash = dash;
  mockParams = params;
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<ShaxsiyMoliya />);
  });
  return r;
};

beforeEach(() => {
  jest.clearAllMocks();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'shaxsiy_moliya_tree.json');
const GEN = !!process.env.SM_TREE_GEN;

describe('ShaxsiyMoliya — render daraxti', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['loading, no data (stack)', () => mount({ data: [], loading: true })],
    ['loading, no data (tab)', () => mount({ data: [], loading: true }, { tab: true })],
    ['full (stack)', () => mount(loaded(FULL))],
    ['full (tab)', () => mount(loaded(FULL), { tab: true })],
    ['empty dashboard', () => mount(loaded({}))],
    ['no data object (not loading)', () => mount({ data: [], loading: false })],
    ['loading but data present', () => mount(loaded(FULL, { loading: true }))],
    ['budget 95%', () => mount(loaded(withBudget({ percentage: 95, spent: 1, planned: 2, remaining: 1 })))],
    ['budget 120% negative', () => mount(loaded(withBudget({ percentage: 120, spent: 5000000, planned: 2000000, remaining: -3000000 })))],
    ['budget 150% bar clamp', () => mount(loaded(withBudget({ percentage: 150, spent: 1, planned: 1, remaining: 0 })))],
    ['no budget', () => mount(loaded({ ...FULL, budget: null }))],
    ['balance missing -> monthly diff', () => mount(loaded({ ...FULL, balance: undefined }))],
    ['balance negative', () => mount(loaded({ ...FULL, balance: -900000 }))],
    ['no flow data', () => mount(loaded({ ...FULL, daily_series: [{ income: 0, expense: 0 }], monthly_series: [] }))],
    ['flow only monthly', () => mount(loaded({ ...FULL, daily_series: [], monthly_series: FULL.monthly_series }))],
    ['no recent, no categories', () => mount(loaded({ ...FULL, incomes: { by_currency: [] }, expenses: {} }))],
    [
      'flow monthly tab',
      async () => {
        const r = await mount(loaded(FULL));
        await tap(byText(r, 'Oylar kesimida'));
        return r;
      },
    ],
    [
      'flow income hidden',
      async () => {
        const r = await mount(loaded(FULL));
        await tap(byText(r, 'Daromad'));
        return r;
      },
    ],
    [
      'flow expense hidden',
      async () => {
        const r = await mount(loaded(FULL));
        await tap(byText(r, 'Xarajat'));
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

describe('ShaxsiyMoliya — amallar', () => {
  it('birinchi fokus yangilamaydi, keyingisi yangilaydi', async () => {
    await mount(loaded(FULL));
    expect(mockRefresh).not.toHaveBeenCalled();
    await act(async () => {
      mockFocus.cb!();
    });
    expect(mockRefresh).toHaveBeenCalledWith({});
  });
  it('hero tugmalari va tavsiya ikonkasi', async () => {
    const r = await mount(loaded(FULL));
    await tap(byText(r, 'Xarajat qo‘shish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceExpenseAdd');
    await tap(byText(r, 'Daromad qo‘shish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceIncomeAdd');
    await tap(pressables(r, n => n.props.accessibilityLabel === 'Tavsiyalar')[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceAdvice');
  });
  it('metrik kartalar va byudjet', async () => {
    const r = await mount(loaded(FULL));
    await tap(pressables(r, n => n.props.activeOpacity === 0.9 && textOf(n).includes('Oylik xarajat'))[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceExpenseList');
    await tap(pressables(r, n => n.props.activeOpacity === 0.9 && textOf(n).includes('Oylik daromad'))[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceIncomeList');
    await tap(pressables(r, n => n.props.activeOpacity === 0.9 && textOf(n).includes('Oylik limit'))[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceBudget');
  });
  it('menyu: 7 ta marshrut tartibi', async () => {
    const r = await mount(loaded(FULL));
    const cards = pressables(r, n => n.props.activeOpacity === 0.85 && /Rejalashtirilgan|Kutilayotgan|Oila|Gap|Maqsadlar|Tahlil|Qarzdan chiqish/.test(textOf(n)) && !n.props.accessibilityLabel);
    const routes: any[] = [];
    for (const c of cards) {
      mockNavigate.mockClear();
      await tap(c);
      routes.push(mockNavigate.mock.calls[0][0]);
    }
    expect(routes).toEqual([
      'FinanceScheduledPayments', 'FinanceScheduledIncomes', 'FinanceFamily', 'FinanceGap', 'FinanceGoalList', 'FinanceAnalytics', 'DebtPlan',
    ]);
  });
  it('grafik: oxirgi legendni o\'chirib bo\'lmaydi (disabled)', async () => {
    const r = await mount(loaded(FULL));
    await tap(byText(r, 'Daromad'));
    const exp = pressables(r, n => textOf(n).trim() === 'Xarajat')[0];
    expect(exp.props.disabled).toBe(true);
    const inc = pressables(r, n => textOf(n).trim() === 'Daromad')[0];
    expect(inc.props.disabled).toBeFalsy();
  });
});
