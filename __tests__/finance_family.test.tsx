/**
 * FinanceFamily (oila moliyasi) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/finance_family_tree.json) + amal testlari (financeApi payloadlari, toast, navigatsiya).
 * Faqat chegaralar mock. Qayta yaratish (FAQAT eski komponent bilan): FF_TREE_GEN=1 npx jest finance_family
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockToast = jest.fn();
const mockRefresh = { fam: jest.fn(), budget: jest.fn(), cats: jest.fn() };
const mockFocus: { cb: null | (() => void) } = { cb: null };
let mockFetch: Record<string, any> = {};
const mockApi: Record<string, jest.Mock> = {
  addBudgetMember: jest.fn(),
  removeBudgetMember: jest.fn(),
  setBudgetViewers: jest.fn(),
  updateFamily: jest.fn(),
  inviteFamily: jest.fn(),
  respondFamily: jest.fn(),
  deleteFamily: jest.fn(),
};

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }),
  useFocusEffect: (cb: () => void) => {
    mockFocus.cb = cb;
    require('react').useEffect(() => {
      cb();
    }, []);
  },
}));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/hooks/useFetch', () => ({
  useFetch: ({ url }: { url: string }) =>
    url.endsWith('/family/budget')
      ? { data: mockFetch.budget, onRefresh: mockRefresh.budget }
      : url.endsWith('/expenses/categories')
      ? { data: mockFetch.cats, onRefresh: mockRefresh.cats }
      : { data: mockFetch.fam, onRefresh: mockRefresh.fam },
}));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/screens/home/modules/financeApi', () => ({
  financeApi: new Proxy({}, { get: (_t, k) => (...a: unknown[]) => (mockApi as any)[k](...a) }),
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
jest.mock('../src/screens/home/redesign/Donut', () => ({
  __esModule: true,
  default: (p: any) =>
    require('react').createElement('Donut', { segments: p.segments, centerValue: p.centerValue, centerLabel: p.centerLabel }),
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color })) },
    ),
);

import FinanceFamily from '../src/screens/home/modules/FinanceFamily';

const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n)))[0];
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => press(r, n => textOf(n).trim() === text);
const byLabel = (r: TestRenderer.ReactTestRenderer, label: string) => outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label));
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const inputs = (r: TestRenderer.ReactTestRenderer) => outer(r.root.findAll(n => typeof n.props.onChangeText === 'function'));
const switches = (r: TestRenderer.ReactTestRenderer) => outer(r.root.findAll(n => typeof n.props.onValueChange === 'function' && 'trackColor' in n.props));
const toasts = () => mockToast.mock.calls.map(c => c[0]);

const PENDING = [
  { id: 1, other_name: 'Ali Valiyev', relation_label: 'Aka', my_role: 'target' },
  { id: 2, member_name: 'Vali', my_role: 'viewer' },
  { id: 3 },
];
const VIEWER = [
  { id: 10, other_name: 'Zarina', status: 'active', relation_label: 'Rafiqam' },
  { id: 11, owner_name: 'Bobur', status: 'pending' },
];
const TARGET = [
  { id: 20, other_name: 'Sardor', status: 'active', permissions: JSON.stringify({ income: { view: true, detail: 'summary' }, set_limit: true }), monthly_limit: 1000000, limit_spent: 900000, limit_currency: 'UZS', category_limits: [{ category_id: 5, amount: 300000, spent: 350000, currency: 'UZS', over: true }, { category_id: 99, amount: 0, spent: 0, currency: 'UZS' }], over_limit: true },
  { id: 21, other_name: 'Dilnoza', status: 'pending', permissions: { goals: { view: true, detail: 'full' } } },
  { id: 22, member_name: 'Kamol', status: 'active', permissions: 'not json{', monthly_limit: 500000, limit_spent: 100, limit_currency: 'USD' },
];
const FAM = { data: { pending: PENDING, as_viewer: VIEWER, as_target: TARGET } };
const BUDGET = {
  data: {
    total_income_uzs: '5000000',
    total_expense_uzs: '3000000',
    net_uzs: '2000000',
    can_manage: true,
    viewers: [7, '8'],
    members: [
      { id: 1, name: 'Men', is_self: true, income_uzs: 3000000, expense_uzs: 1000000 },
      { id: 2, name: 'Zarina', income_uzs: 2000000, expense_uzs: 2000000 },
    ],
    available_members: [{ id: 30, name: 'Yangi', can_add: true }, { id: 31, name: 'Ruxsatsiz', can_add: false }],
    shareable_members: [{ id: 7, name: 'Ali' }, { id: 9, name: 'Vali' }],
    expense_by_category: [{ name: 'food', icon: '🍎', total_uzs: 2000000 }, { name: 'transport', total_uzs: 1000000 }],
  },
};
const CATS = { data: [{ id: 5, name: 'food' }, { id: 6, label: 'Custom' }] };

const setup = (o: { fam?: any; budget?: any; cats?: any } = {}) => {
  mockFetch = { fam: o.fam === undefined ? FAM : o.fam, budget: o.budget === undefined ? BUDGET : o.budget, cats: o.cats === undefined ? CATS : o.cats };
};
const mount = async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<FinanceFamily />);
  });
  return r;
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.values(mockApi).forEach(m => m.mockReset().mockResolvedValue({ data: { success: true } }));
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'finance_family_tree.json');
const GEN = !!process.env.FF_TREE_GEN;

describe('FinanceFamily — render daraxti', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['full', async () => (setup(), mount())],
    ['no data', async () => (setup({ fam: null, budget: null, cats: null }), mount())],
    ['empty family', async () => (setup({ fam: { data: {} }, budget: null }), mount())],
    ['budget zero totals hidden', async () => (setup({ budget: { data: { total_income_uzs: 0, total_expense_uzs: 0 } } }), mount())],
    ['budget single member (no donuts)', async () => (setup({ budget: { data: { ...BUDGET.data, members: [BUDGET.data.members[0]] } } }), mount())],
    ['budget cannot manage, negative net', async () => (setup({ budget: { data: { ...BUDGET.data, can_manage: false, net_uzs: -500000, expense_by_category: [] } } }), mount())],
    ['invite modal (watched)', async () => { setup(); const r = await mount(); await tap(byText(r, 'Taklif yuborish')); return r; }],
    ['invite modal (watcher via empty CTA)', async () => { setup({ fam: { data: {} } }); const r = await mount(); await tap(byText(r, 'Kuzatuvchi qo‘shish')); return r; }],
    ['perms edit modal', async () => { setup(); const r = await mount(); await tap(byLabel(r, 'Ruxsatlarni tahrirlash')[0]); return r; }],
    ['perms edit modal (pending, object perms)', async () => { setup(); const r = await mount(); await tap(byLabel(r, 'Ruxsatlarni tahrirlash')[1]); return r; }],
    ['perms edit modal (bad json)', async () => { setup(); const r = await mount(); await tap(byLabel(r, 'Ruxsatlarni tahrirlash')[2]); return r; }],
    ['budget manager modal', async () => { setup(); const r = await mount(); await tap(press(r, n => n.props.hitSlop && n.props.hitSlop.top === 10 && n.props.activeOpacity === 0.8)); return r; }],
    ['limit detail modal', async () => { setup(); const r = await mount(); await tap(press(r, n => /Batafsil/.test(textOf(n)))); return r; }],
    ['delete confirm (active)', async () => { setup(); const r = await mount(); await tap(byLabel(r, 'Aloqani uzish')[0]); return r; }],
    ['delete confirm (pending)', async () => { setup(); const r = await mount(); await tap(byLabel(r, 'Aloqani uzish')[1]); return r; }],
    ['info sheet watch', async () => { setup(); const r = await mount(); await tap(byLabel(r, 'Bu bo‘lim haqida')[0]); return r; }],
    ['info sheet watcher', async () => { setup(); const r = await mount(); await tap(byLabel(r, 'Bu bo‘lim haqida')[1]); return r; }],
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

describe('FinanceFamily — amallar', () => {
  it('birinchi fokus yangilamaydi, keyingisi oila ro\'yxatini yangilaydi', async () => {
    setup();
    await mount();
    expect(mockRefresh.fam).not.toHaveBeenCalled();
    await act(async () => {
      mockFocus.cb!();
    });
    expect(mockRefresh.fam).toHaveBeenCalledWith({});
  });
  it('faol a\'zo kartasi -> FinanceFamilyOverview; kutilayotganda ochilmaydi', async () => {
    setup();
    const r = await mount();
    const rows = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && /Zarina/.test(textOf(n)) && n.props.activeOpacity !== undefined));
    expect(rows.length).toBeGreaterThan(0);
    await tap(rows[0]);
    expect(mockNavigate).toHaveBeenCalledWith('FinanceFamilyOverview', { id: 10, name: 'Zarina' });
    mockNavigate.mockClear();
    const pend = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && /Bobur/.test(textOf(n))));
    expect(pend).toHaveLength(0);
  });
  it('taklifga javob: accept / reject (payload, toast, yangilash); band bo\'lsa e\'tiborsiz; xato', async () => {
    setup();
    const r = await mount();
    await tap(byText(r, 'Qabul qilish'));
    expect(mockApi.respondFamily).toHaveBeenCalledWith(1, { action: 'accept' });
    expect(mockRefresh.fam).toHaveBeenCalledWith({});
    expect(toasts().pop()).toEqual({ type: 'omad', props: { desc: 'Qabul qilindi' } });
    await tap(byText(r, 'Rad etish'));
    expect(mockApi.respondFamily).toHaveBeenLastCalledWith(1, { action: 'reject' });
    expect(toasts().pop()).toEqual({ type: 'omad', props: { desc: 'Rad etildi' } });
    mockApi.respondFamily.mockRejectedValue(new Error('x'));
    await tap(byText(r, 'Qabul qilish'));
    expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
  });
  describe('taklif yuborish', () => {
    const open = async (cta = 'Taklif yuborish') => {
      setup();
      const r = await mount();
      await tap(byText(r, cta));
      return r;
    };
    const setPhone = async (r: TestRenderer.ReactTestRenderer, v: string) => {
      await act(async () => {
        inputs(r)[0].props.onChangeText(v);
      });
    };
    it('qisqa telefon -> toast, so\'rov yo\'q', async () => {
      const r = await open();
      await setPhone(r, '9012');
      await tap(byText(r, 'Yuborish'));
      expect(toasts()).toEqual([{ type: 'error2', props: { desc: 'Telefon raqamini to‘liq kiriting' } }]);
      expect(mockApi.inviteFamily).not.toHaveBeenCalled();
    });
    it('to\'liq: payload (default ruxsatlar), toast, yopiladi va tozalanadi', async () => {
      const r = await open();
      await setPhone(r, '90 123 45 67');
      await act(async () => {
        inputs(r)[1].props.onChangeText('  Rafiqam ');
      });
      await tap(byText(r, 'Yuborish'));
      expect(mockApi.inviteFamily).toHaveBeenCalledWith({
        phone: '+998901234567',
        relation_label: 'Rafiqam',
        role: 'watched',
        permissions: {
          income: { view: true, detail: 'full' },
          expense: { view: true, detail: 'full' },
          scheduled_income: { view: false, detail: 'summary' },
          scheduled_payment: { view: false, detail: 'summary' },
          goals: { view: false, detail: 'summary' },
          set_limit: false,
        },
      });
      expect(toasts().pop()).toEqual({ type: 'omad', props: { desc: 'Taklif yuborildi' } });
      expect(mockRefresh.fam).toHaveBeenCalledWith({});
      expect(byText(r, 'Yuborish')).toBeUndefined();
    });
    it('watcher maqomi + bo\'sh munosabat -> null; ruxsat o\'zgartirish', async () => {
      const r = await open();
      await setPhone(r, '901234567');
      await tap(press(r, n => textOf(n).startsWith('Kuzatuvchi') && /U sizning/.test(textOf(n))));
      const sw = switches(r);
      await act(async () => {
        sw[2].props.onValueChange(true); // scheduled_income view
      });
      await act(async () => {
        sw[sw.length - 1].props.onValueChange(true); // set_limit
      });
      await tap(press(r, n => textOf(n).trim() === 'Faqat summa' && !!n.props.style));
      await tap(byText(r, 'Yuborish'));
      const body = mockApi.inviteFamily.mock.calls[0][0];
      expect(body.role).toBe('watcher');
      expect(body.relation_label).toBeNull();
      expect(body.permissions.scheduled_income.view).toBe(true);
      expect(body.permissions.set_limit).toBe(true);
    });
    it('xato: server xabari yoki standart', async () => {
      const r = await open();
      await setPhone(r, '901234567');
      mockApi.inviteFamily.mockRejectedValue({ response: { data: { message: 'Bu raqam topilmadi' } } });
      await tap(byText(r, 'Yuborish'));
      expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Bu raqam topilmadi' } });
      mockApi.inviteFamily.mockRejectedValue(new Error('x'));
      await tap(byText(r, 'Yuborish'));
      expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    });
    it('bekor qilish yopadi va maydonlarni tozalaydi', async () => {
      const r = await open();
      await setPhone(r, '901234567');
      await tap(byText(r, 'Bekor qilish'));
      await tap(byText(r, 'Taklif yuborish'));
      expect(inputs(r)[0].props.value).toBe('');
    });
  });
  describe('ruxsatlarni tahrirlash', () => {
    it('saqlash: updateFamily(id, {permissions}) (JSON ruxsatlar birlashtiriladi)', async () => {
      setup();
      const r = await mount();
      await tap(byLabel(r, 'Ruxsatlarni tahrirlash')[0]);
      await tap(byText(r, 'Saqlash'));
      expect(mockApi.updateFamily).toHaveBeenCalledWith(20, {
        permissions: {
          income: { view: true, detail: 'summary' },
          expense: { view: true, detail: 'full' },
          scheduled_income: { view: false, detail: 'summary' },
          scheduled_payment: { view: false, detail: 'summary' },
          goals: { view: false, detail: 'summary' },
          set_limit: true,
        },
      });
      expect(toasts().pop()).toEqual({ type: 'omad', props: { desc: 'Ruxsatlar saqlandi' } });
      expect(mockRefresh.fam).toHaveBeenCalled();
    });
    it('xato toast', async () => {
      setup();
      const r = await mount();
      await tap(byLabel(r, 'Ruxsatlarni tahrirlash')[0]);
      mockApi.updateFamily.mockRejectedValue({ response: { data: { message: 'M' } } });
      await tap(byText(r, 'Saqlash'));
      expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'M' } });
    });
  });
  describe('aloqani uzish', () => {
    it('tasdiq -> deleteFamily(id), toast, yangilash', async () => {
      setup();
      const r = await mount();
      await tap(byLabel(r, 'Aloqani uzish')[0]);
      await tap(byText(r, 'Uzish'));
      expect(mockApi.deleteFamily).toHaveBeenCalledWith(10);
      expect(toasts().pop()).toEqual({ type: 'omad', props: { desc: 'O‘chirildi' } });
      expect(mockRefresh.fam).toHaveBeenCalledWith({});
    });
    it('xato toast; bekor qilish so\'rovsiz yopadi', async () => {
      setup();
      const r = await mount();
      await tap(byLabel(r, 'Aloqani uzish')[0]);
      mockApi.deleteFamily.mockRejectedValue(new Error('x'));
      await tap(byText(r, 'Uzish'));
      expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
      await tap(byText(r, 'Bekor qilish'));
      expect(mockApi.deleteFamily).toHaveBeenCalledTimes(1);
    });
  });
  describe('byudjet boshqaruvi', () => {
    const open = async () => {
      setup();
      const r = await mount();
      await tap(press(r, n => n.props.hitSlop && n.props.hitSlop.top === 10 && n.props.activeOpacity === 0.8));
      return r;
    };
    it('a\'zo qo\'shish / chiqarish: API + byudjet yangilash', async () => {
      const r = await open();
      await tap(byText(r, '+ Qo‘shish'));
      expect(mockApi.addBudgetMember).toHaveBeenCalledWith({ member_id: 30 });
      expect(mockRefresh.budget).toHaveBeenCalledWith({});
      await tap(byText(r, 'Chiqarish'));
      expect(mockApi.removeBudgetMember).toHaveBeenCalledWith(2);
    });
    it('xato: server xabari yoki "Xatolik"', async () => {
      const r = await open();
      mockApi.addBudgetMember.mockRejectedValue({ response: { data: { message: 'Limit' } } });
      await tap(byText(r, '+ Qo‘shish'));
      expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Limit' } });
      mockApi.removeBudgetMember.mockRejectedValue(new Error('x'));
      await tap(byText(r, 'Chiqarish'));
      expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Xatolik' } });
    });
    it('ko\'ruvchilarni saqlash: boshlang\'ich tanlov string, almashtirish, payload', async () => {
      const r = await open();
      const sw = switches(r);
      expect(sw.map(s => s.props.value)).toEqual([true, false]);
      await act(async () => {
        sw[1].props.onValueChange();
      });
      await act(async () => {
        switches(r)[0].props.onValueChange();
      });
      await tap(byText(r, 'Saqlash'));
      expect(mockApi.setBudgetViewers).toHaveBeenCalledWith({ viewer_ids: ['8', '9'] });
      expect(toasts().pop()).toEqual({ type: 'omad', props: { desc: 'Saqlandi' } });
    });
    it('saqlash xatosi toast; yopish', async () => {
      const r = await open();
      mockApi.setBudgetViewers.mockRejectedValue({ response: { data: { message: 'Q' } } });
      await tap(byText(r, 'Saqlash'));
      expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Q' } });
      await tap(byText(r, 'Yopish'));
      expect(byText(r, 'Chiqarish')).toBeUndefined();
    });
  });
  it('limit tafsiloti: kategoriya nomi (cats), umumiy limit; yopish', async () => {
    setup();
    const r = await mount();
    await tap(press(r, n => /Batafsil/.test(textOf(n))));
    const t = tree(r);
    expect(t).toContain('Menga qo‘yilgan limit');
    expect(t).toContain('Umumiy limit');
    expect(t).toContain('Kategoriya');
    await tap(byText(r, 'Yopish'));
  });
});
