/**
 * FinanceDebtGroup (bitta kontragent bo'yicha shaxsiy qarzlar) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/finance_debt_group_tree.json) + amal testlari (reload, tahrirlash, SMS, amallar, toast, navigatsiya).
 * Faqat chegaralar mock. Qayta yaratish (FAQAT eski komponent bilan): FG_TREE_GEN=1 npx jest finance_debt_group
 */
import React from 'react';
import { Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockToast = jest.fn();
const mockOpenURL = jest.fn();
const mockSafeOpen = jest.fn();
const mockShowPlan = jest.fn();
const mockHandlePlan = jest.fn();
const mockSendDemand = jest.fn();
const mockOnActConfirm = jest.fn();
const mockPayWithSms = jest.fn();
const mockActArgs: { current: any } = { current: null };
const mockActModalProps: { current: any } = { current: null };
const mockActSetter: { current: any } = { current: null };
const mockFocus: { cb: null | (() => void) } = { cb: null };
let mockParams: any = {};
let mockActBusy = false;
let mockDemanding = false;
let mockLocked: Record<string, boolean> = {};
const mockApi = { getDebts: jest.fn(), getDebtById: jest.fn(), updateDebt: jest.fn() };

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])),
  }),
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
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/helper/safeOpenURL', () => ({ safeOpenURL: (...a: unknown[]) => mockSafeOpen(...a) }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/screens/home/modules/financeApi', () => ({
  financeApi: new Proxy({}, { get: (_t, k) => (...a: unknown[]) => (mockApi as any)[k](...a) }),
}));
jest.mock('../src/screens/home/modules/planGate', () => ({
  usePlanFeatures: () => ({ expired: false }),
  isFeatureLocked: (_p: unknown, k: string) => !!mockLocked[k],
  showPlanRequired: (...a: unknown[]) => mockShowPlan(...a),
  handlePlanRequiredError: (...a: unknown[]) => mockHandlePlan(...a),
  isPlanRequiredError: (e: any) => !!e?.plan,
}));
jest.mock('../src/screens/home/modules/debtSms', () => ({
  ...jest.requireActual('../src/screens/home/modules/debtSms'),
  payDebtsWithSms: (...a: unknown[]) => mockPayWithSms(...a),
  smsNoticeText: (outcomes: any[]) => (outcomes.length ? 'sms-note' : null),
}));
jest.mock('../src/screens/home/modules/useDebtGroupActions', () => ({
  useDebtGroupActions: (args: any) => {
    mockActArgs.current = args;
    const [actModal, setActModal] = require('react').useState('');
    mockActSetter.current = setActModal;
    return {
      actModal,
      setActModal,
      actBusy: mockActBusy,
      demanding: mockDemanding,
      onActConfirm: (...a: unknown[]) => mockOnActConfirm(...a),
      sendDemand: (...a: unknown[]) => mockSendDemand(...a),
      demandModal: { visible: false },
    };
  },
}));
jest.mock('../src/screens/components/DemandConfirmModal', () => ({ __esModule: true, default: () => require('react').createElement('DemandModal') }));
jest.mock('../src/screens/components/AnimatedEmpty', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('AnimatedEmpty', { variant: p.variant, text: p.text, compact: p.compact }),
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdHeader', { title: p.title }),
}));
jest.mock('../src/screens/home/modules/DebtActionButton', () => ({
  ...jest.requireActual('../src/screens/home/modules/DebtActionButton'),
  __esModule: true,
  default: (p: any) =>
    require('react').createElement('ActBtn', { label: p.label, tone: p.tone, disabled: !!p.disabled, hasTrailing: !!p.trailing, onPress: p.onPress }),
}));
jest.mock('../src/screens/home/modules/FinanceDebtActionModal', () => ({
  __esModule: true,
  default: (p: any) => {
    mockActModalProps.current = p;
    return require('react').createElement('ActModal', {
      visible: p.visible,
      mode: p.mode,
      debtIds: (p.debts || []).map((d: any) => d.id),
      name: p.name,
      busy: p.busy,
      smsLocked: p.smsLocked,
    });
  },
  BanIcon: () => require('react').createElement('Icon', { name: 'BanIcon' }),
  totalsText: (l: any[]) => `totals(${l.length})`,
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color })) },
    ),
);

import FinanceDebtGroup from '../src/screens/home/modules/FinanceDebtGroup';

const NOW = new Date('2026-11-01T07:00:00Z');
const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n)))[0];
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => press(r, n => textOf(n).trim() === text);
const byLabel = (r: TestRenderer.ReactTestRenderer, label: string) => press(r, n => n.props.accessibilityLabel === label);
const actBtn = (r: TestRenderer.ReactTestRenderer, label: string) => r.root.findAll(n => (n.type as any) === 'ActBtn' && n.props.label === label)[0];
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const inputs = (r: TestRenderer.ReactTestRenderer) => outer(r.root.findAll(n => typeof n.props.onChangeText === 'function' && n.props.placeholder !== undefined));
const countText = (r: TestRenderer.ReactTestRenderer) => textOf(r.root.findAll(n => (n.type as any) === 'Text' && /ta qarz/.test(textOf(n)))[0]);
const toasts = () => mockToast.mock.calls.map(c => c[0]);

const PHONE = '+998901234567';
const base = { source_name: 'Ali Valiyev', phone: PHONE, currency: 'UZS' };
const L1 = { ...base, id: 1, type: 'lent', status: 'active', amount: 1000000, remaining_amount: 600000, start_date: '2026-10-01', due_date: '2026-11-10', created_at: '2026-10-01 10:00:00', notes: 'Izoh', payments: [{ amount: 400000, notes: '', payment_date: '2026-10-10' }] };
const L2 = { ...base, id: 2, type: 'lent', status: 'active', amount: 500000, remaining_amount: 500000, start_date: '2026-09-01', due_date: '2026-10-20', created_at: '2026-09-01 10:00:00', notes: '' };
const LC = { ...base, id: 3, type: 'lent', status: 'completed', amount: 300000, remaining_amount: 0, start_date: '2026-08-01', due_date: '2026-08-20', created_at: '2026-08-01 10:00:00', payments: [{ amount: 300000, notes: '', payment_date: '2026-08-15' }] };
const LF = { ...base, id: 4, type: 'lent', status: 'completed', amount: 200000, remaining_amount: 0, start_date: '2026-07-01', created_at: '2026-07-01 10:00:00', notes: 'Kechirilgan (voz kechildi)', payments: [{ amount: 200000, notes: '__forgive__x' }] };
const B1 = { ...base, id: 5, type: 'borrowed', status: 'active', amount: 100, remaining_amount: 60, currency: 'USD', start_date: '2026-10-05', due_date: '2026-12-01', created_at: '2026-10-05 10:00:00', paid_amount: 40 };
const M1 = { ...base, id: 6, type: 'lent', status: 'active', amount: 70000, remaining_amount: 70000, is_mirror: true, can_operate: true, start_date: '2026-10-07', created_at: '2026-10-07 10:00:00' };
const M2 = { ...base, id: 7, type: 'lent', status: 'active', amount: 80000, remaining_amount: 80000, is_mirror: true, can_operate: false, start_date: '2026-10-08', created_at: '2026-10-08 10:00:00', phone: '' };
const SHOP = { id: 9, type: 'lent', status: 'active', amount: 90000, remaining_amount: 90000, currency: 'UZS', is_shop_debt: true, source_name: 'Market', shop_phone: '+998712000000', shop_region: 'Toshkent', shop_district: 'Chilonzor', start_date: '2026-10-09', created_at: '2026-10-09 10:00:00' };

const mount = async (params: any) => {
  mockParams = params;
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<FinanceDebtGroup />);
  });
  return r;
};

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockActBusy = false;
  mockDemanding = false;
  mockLocked = {};
  mockApi.getDebts.mockReset();
  mockApi.getDebtById.mockReset().mockResolvedValue({ data: {} });
  mockApi.updateDebt.mockReset().mockResolvedValue({ data: { success: true } });
  mockHandlePlan.mockReturnValue(false);
  jest.spyOn(Linking, 'openURL').mockImplementation((u: string) => mockOpenURL(u));
  mockOpenURL.mockResolvedValue(undefined);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'finance_debt_group_tree.json');
const GEN = !!process.env.FG_TREE_GEN;

describe('FinanceDebtGroup — render daraxti', () => {
  const lent = { title: 'Ali Valiyev', kind: 'given', items: [L1, L2, LC, LF, M1, M2] };
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['lent side (given)', () => mount(lent)],
    ['lent side demand locked', async () => ((mockLocked = { manual_sms_send: true }), mount(lent))],
    ['lent side act busy/demanding', async () => ((mockDemanding = true), mount(lent))],
    ['borrowed side (taken)', () => mount({ title: 'Ali Valiyev', kind: 'taken', items: [B1] })],
    ['side from items (all lent, no kind)', () => mount({ title: 'Ali', items: [L1, LC] })],
    ['side from items (all borrowed, no kind)', () => mount({ title: 'Ali', items: [B1] })],
    ['mixed -> no side (balance card)', () => mount({ title: 'Ali', items: [L1, B1, LC] })],
    ['all closed -> no side', () => mount({ title: 'Ali', items: [LC, LF] })],
    ['empty items', () => mount({ title: 'Ali', items: [] })],
    ['no params', () => mount(undefined)],
    ['shop group', () => mount({ title: 'Market', isShop: true, items: [SHOP] })],
    ['no phone', () => mount({ title: 'Ali', kind: 'given', items: [{ ...L1, phone: '' }] })],
    ['empty lent side (open none)', () => mount({ title: 'Ali', kind: 'given', items: [LC] })],
    [
      'reliability server reliable',
      async () => {
        mockApi.getDebtById.mockResolvedValue({ data: { reliability: { level: 'reliable', total: 5, on_time: 5, late: 0 } } });
        return mount(lent);
      },
    ],
    [
      'reliability local risky',
      () => mount({ title: 'Ali', kind: 'given', items: [{ ...L2 }, { ...L2, id: 12 }, { ...LC, id: 13, payments: [{ amount: 1, payment_date: '2026-09-01' }] }] }),
    ],
    ['reliability local reliable', () => mount({ title: 'Ali', kind: 'given', items: [L1, LC] })],
    [
      'sms templates open',
      async () => {
        const r = await mount(lent);
        await tap(byLabel(r, 'SMS yuborish'));
        return r;
      },
    ],
    [
      'edit open',
      async () => {
        const r = await mount(lent);
        await tap(byLabel(r, 'Tahrirlash'));
        return r;
      },
    ],
    [
      'action modal close open',
      async () => {
        const r = await mount(lent);
        await tap(actBtn(r, 'Qarzni yopish'));
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

describe('FinanceDebtGroup — amallar', () => {
  const lent = { title: 'Ali Valiyev', kind: 'given', items: [L1, L2, LC, M1] };

  it('addDebt: "Yana qarz berish" / "Yana qarz olish" / bo\'lim noma\'lum', async () => {
    let r = await mount(lent);
    await tap(actBtn(r, 'Yana qarz berish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceDebtAdd', { initialType: 'lent', initialName: 'Ali Valiyev', initialPhone: PHONE });
    r = await mount({ title: 'Ali', kind: 'taken', items: [B1] });
    await tap(actBtn(r, 'Yana qarz olish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceDebtAdd', { initialType: 'borrowed', initialName: 'Ali', initialPhone: PHONE });
    r = await mount({ title: 'Ali', items: [LC] });
    await tap(actBtn(r, 'Qarz olish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceDebtAdd', { initialType: 'borrowed', initialName: 'Ali', initialPhone: PHONE });
    await tap(actBtn(r, 'Qarz berish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceDebtAdd', expect.objectContaining({ initialType: 'lent' }));
  });
  it('qarz kartasi: o\'z qarzi -> id, ko\'zgu -> mirror', async () => {
    const r = await mount({ ...lent, items: [L1, M1] });
    const cards = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.85 && /Berilgan/.test(textOf(n))));
    expect(cards).toHaveLength(2);
    await tap(cards[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceDebtDetail', expect.objectContaining({ hideParty: true }));
    await tap(cards[1]);
    const calls = mockNavigate.mock.calls.map(c => c[1]);
    expect(calls).toContainEqual({ id: 1, hideParty: true });
    expect(calls).toContainEqual({ mirror: M1, hideParty: true });
  });
  it('amal tugmalari: yopish / voz kechish modal rejimi, bo\'sh bo\'lsa hint', async () => {
    let r = await mount(lent);
    await tap(actBtn(r, 'Qarzni yopish'));
    expect(mockActModalProps.current.mode).toBe('close');
    expect(mockActModalProps.current.visible).toBe(true);
    expect(mockActModalProps.current.debts.map((d: any) => d.id)).toEqual([1, 2, 6]);
    await act(async () => {
      mockActModalProps.current.onCancel();
    });
    expect(mockActModalProps.current.visible).toBe(false);
    expect(mockActModalProps.current.mode).toBe('close'); // oxirgi rejim saqlanadi
    await tap(actBtn(r, 'Voz kechish'));
    expect(mockActModalProps.current.mode).toBe('forgive');
    r = await mount({ title: 'Ali', kind: 'taken', items: [B1] });
    await tap(actBtn(r, 'Qarzni qaytarish'));
    expect(mockActModalProps.current.mode).toBe('pay');
    r = await mount({ title: 'Ali', kind: 'given', items: [LC] });
    mockToast.mockClear();
    await act(async () => {
      actBtn(r, 'Qarzni yopish').props.onPress();
    });
    expect(toasts()).toEqual([{ type: 'error2', visibilityTime: 3500, props: { desc: 'Aktiv qarzlar yo‘q' } }]);
  });
  it('actBusy: openAct e\'tiborsiz', async () => {
    mockActBusy = true;
    const r = await mount(lent);
    await act(async () => {
      actBtn(r, 'Qarzni yopish').props.onPress();
    });
    expect(mockActModalProps.current.visible).toBe(false);
  });
  it('talab: qarz yo\'q / telefon yo\'q / OK', async () => {
    let r = await mount({ title: 'Ali', kind: 'given', items: [LC] });
    await act(async () => {
      actBtn(r, 'Talab qilish').props.onPress();
    });
    expect(toasts().pop().props.desc).toBe('Aktiv qarzlar yo‘q');
    r = await mount({ title: 'Ali', kind: 'given', items: [{ ...L1, phone: '' }] });
    mockToast.mockClear();
    await act(async () => {
      actBtn(r, 'Talab qilish').props.onPress();
    });
    expect(toasts().pop().props.desc).toBe('Qarzdorning telefon raqami kiritilmagan — qarz tafsilotida qo‘shing');
    r = await mount(lent);
    await tap(actBtn(r, 'Talab qilish'));
    expect(mockSendDemand).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
  it('talab: mirror bo\'lsa telefonsiz ham maqsad', async () => {
    const r = await mount({ title: 'Ali', kind: 'given', items: [{ ...M2, can_operate: true }] });
    await tap(actBtn(r, 'Talab qilish'));
    expect(mockSendDemand).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });
  it('useDebtGroupActions argumentlari', async () => {
    mockLocked = { manual_sms_send: true };
    await mount(lent);
    const a = mockActArgs.current;
    expect(a.demandLocked).toBe(true);
    expect(typeof a.reload).toBe('function');
    expect(a.plan).toEqual({ expired: false });
  });

  describe('reload', () => {
    it('birinchi fokus yangilamaydi; keyingisi sahifalab o\'qiydi, guruh+bo\'lim bo\'yicha filtrlaydi', async () => {
      const other = { ...L1, id: 50, phone: '+998909999999' };
      mockApi.getDebts.mockResolvedValueOnce({ data: { data: [L1, other, B1], mirror_debts: [M1] } });
      const r = await mount(lent);
      expect(mockApi.getDebts).not.toHaveBeenCalled();
      await act(async () => {
        await mockFocus.cb!();
      });
      expect(mockApi.getDebts).toHaveBeenCalledWith({ limit: 100, page: 1 });
      // lent bo'limi: B1 (borrowed) va boshqa guruh tushib qoladi -> L1 + ko'zgu M1
      expect(countText(r)).toBe('2 ta qarz');
    });
    it('100 ta to\'liq sahifa -> keyingisini ham o\'qiydi; ko\'zgular faqat 1-sahifadan', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({ ...L1, id: 1000 + i }));
      mockApi.getDebts
        .mockResolvedValueOnce({ data: { data: page1, mirror_debts: [M1] } })
        .mockResolvedValueOnce({ data: { data: [L1], mirror_debts: [M2] } });
      await mount(lent);
      await act(async () => {
        await mockFocus.cb!();
      });
      expect(mockApi.getDebts).toHaveBeenCalledTimes(2);
      expect(mockApi.getDebts).toHaveBeenLastCalledWith({ limit: 100, page: 2 });
    });
    it('xato yutiladi, ro\'yxat o\'zgarmaydi', async () => {
      mockApi.getDebts.mockRejectedValue(new Error('x'));
      const r = await mount(lent);
      const before = tree(r);
      await act(async () => {
        await mockFocus.cb!();
      });
      expect(tree(r)).toBe(before);
    });
    it('kalit yo\'q (items bo\'sh) -> so\'rov yo\'q', async () => {
      await mount({ title: 'Ali', items: [] });
      await act(async () => {
        await mockFocus.cb!();
      });
      expect(mockApi.getDebts).not.toHaveBeenCalled();
    });
  });

  describe('tahrirlash', () => {
    const open = async () => {
      const r = await mount({ title: 'Ali Valiyev', kind: 'given', items: [L1, M1] });
      await tap(byLabel(r, 'Tahrirlash'));
      return r;
    };
    it('qalam faqat o\'z qarzi bor va do\'kon emas bo\'lsa', async () => {
      expect(byLabel(await mount({ title: 'Market', isShop: true, items: [SHOP] }), 'Tahrirlash')).toBeUndefined();
      expect(byLabel(await mount({ title: 'Ali', kind: 'given', items: [M1] }), 'Tahrirlash')).toBeUndefined();
    });
    it('boshlang\'ich qiymatlar: ism, telefon oxirgi 9 raqam', async () => {
      const r = await open();
      const [nameIn, phoneIn] = inputs(r);
      expect(nameIn.props.value).toBe('Ali Valiyev');
      expect(phoneIn.props.value).toBe('901234567');
    });
    it('telefon raqam bo\'lmagan belgilarni tashlaydi va 9 ga qisqartiradi', async () => {
      const r = await open();
      await act(async () => {
        inputs(r)[1].props.onChangeText('90-123 45 67 89 0');
      });
      expect(inputs(r)[1].props.value).toBe('901234567');
    });
    it('ism < 2 belgi -> toast, so\'rov yo\'q', async () => {
      const r = await open();
      await act(async () => {
        inputs(r)[0].props.onChangeText(' A ');
      });
      await tap(byText(r, 'Saqlash'));
      expect(toasts()).toEqual([{ type: 'error2', props: { desc: 'Ismni kiriting' } }]);
      expect(mockApi.updateDebt).not.toHaveBeenCalled();
    });
    it('telefon 9 ta emas -> toast', async () => {
      const r = await open();
      await act(async () => {
        inputs(r)[1].props.onChangeText('90123');
      });
      await tap(byText(r, 'Saqlash'));
      expect(toasts()).toEqual([{ type: 'error2', props: { desc: 'Telefon raqamini to‘liq kiriting' } }]);
    });
    it('muvaffaqiyat: faqat o\'z qarzlari yangilanadi, modal yopiladi, toast', async () => {
      const r = await open();
      await act(async () => {
        inputs(r)[0].props.onChangeText('  Vali Aliyev ');
      });
      await tap(byText(r, 'Saqlash'));
      expect(mockApi.updateDebt).toHaveBeenCalledTimes(1);
      expect(mockApi.updateDebt).toHaveBeenCalledWith(1, { source_name: 'Vali Aliyev', phone: '+998901234567' });
      expect(toasts().pop()).toEqual({ type: 'omad', props: { desc: 'Saqlandi' } });
      expect(tree(r)).toContain('Vali');
    });
    it('telefon bo\'sh -> null yuboriladi', async () => {
      const r = await open();
      await act(async () => {
        inputs(r)[1].props.onChangeText('');
      });
      await tap(byText(r, 'Saqlash'));
      expect(mockApi.updateDebt).toHaveBeenCalledWith(1, { source_name: 'Ali Valiyev', phone: null });
    });
    it('qisman muvaffaqiyat: muvaffaqiyatlilar yangilanadi, xato toast, modal ochiq', async () => {
      mockApi.updateDebt.mockImplementation((id: number) => (id === 1 ? Promise.resolve({}) : Promise.reject(new Error('x'))));
      const r = await mount({ title: 'Ali Valiyev', kind: 'given', items: [L1, L2] });
      await tap(byLabel(r, 'Tahrirlash'));
      await act(async () => {
        inputs(r)[0].props.onChangeText('Yangi Ism');
      });
      await tap(byText(r, 'Saqlash'));
      expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
      expect(byText(r, 'Saqlash')).toBeDefined();
    });
    it('saqlash vaqtida ikkinchi bosish e\'tiborsiz', async () => {
      let resolve: (v: any) => void = () => {};
      mockApi.updateDebt.mockReturnValue(new Promise(res => (resolve = res)));
      const r = await open();
      await act(async () => {
        byText(r, 'Saqlash').props.onPress();
      });
      await act(async () => {
        byText(r, '...').props.onPress();
      });
      expect(mockApi.updateDebt).toHaveBeenCalledTimes(1);
      await act(async () => {
        resolve({});
      });
    });
    it('bekor qilish modalni yopadi', async () => {
      const r = await open();
      await tap(byText(r, 'Bekor qilish'));
      expect(byText(r, 'Saqlash')).toBeUndefined();
    });
  });

  describe('SMS / qo\'ng\'iroq', () => {
    it('qo\'ng\'iroq: tel: probelsiz; xato yutiladi', async () => {
      mockOpenURL.mockRejectedValue(new Error('x'));
      const r = await mount({ title: 'Ali', kind: 'given', items: [{ ...L1, phone: '+998 90 123 45 67' }] });
      await tap(byLabel(r, 'Qo‘ng‘iroq qilish'));
      expect(mockOpenURL).toHaveBeenCalledWith('tel:+998901234567');
    });
    it('qoldiq bor: shablonlar ochiladi; shablon tanlanadi -> sms:?body=', async () => {
      const r = await mount(lent);
      await tap(byLabel(r, 'SMS yuborish'));
      const tpls = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.85 && /Assalomu alaykum/.test(textOf(n))));
      expect(tpls.length).toBeGreaterThan(1);
      await tap(tpls[0]);
      expect(mockSafeOpen).toHaveBeenCalledTimes(1);
      expect(mockSafeOpen.mock.calls[0][0]).toMatch(/^sms:\+998901234567\?body=Assalomu%20alaykum%2C%20Ali%20Valiyev\./);
      expect(byText(r, 'Bo‘sh SMS yozish')).toBeUndefined();
    });
    it('"Bo\'sh SMS yozish": faqat sms:raqam', async () => {
      const r = await mount(lent);
      await tap(byLabel(r, 'SMS yuborish'));
      await tap(byText(r, 'Bo‘sh SMS yozish'));
      expect(mockSafeOpen).toHaveBeenCalledWith('sms:+998901234567');
    });
    it('qoldiq yo\'q (hammasi yopiq): shablon oynasiz darhol sms:', async () => {
      const r = await mount({ title: 'Ali', items: [LC] });
      await tap(byLabel(r, 'SMS yuborish'));
      expect(mockSafeOpen).toHaveBeenCalledWith('sms:+998901234567');
    });
    it('shablonlar: men qarzdorman / sizning qarzingiz / ikkalasi', async () => {
      const grab = async (items: any[]) => {
        const r = await mount({ title: 'Ali', items });
        await tap(byLabel(r, 'SMS yuborish'));
        return outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.85 && /Assalomu alaykum/.test(textOf(n)))).map(n => textOf(n));
      };
      const owe = await grab([B1]);
      expect(owe.some(x => x.includes('gacha qaytaraman'))).toBe(true);
      const owed = await grab([L1]);
      expect(owed.some(x => x.includes('qachon qaytarasiz'))).toBe(true);
      const both = await grab([L1, B1]);
      expect(both.some(x => x.includes('Hisob-kitob'))).toBe(true);
    });
    it('shablon oynasini bekor qilish', async () => {
      const r = await mount(lent);
      await tap(byLabel(r, 'SMS yuborish'));
      await tap(byText(r, 'Bekor qilish'));
      expect(byText(r, 'Bo‘sh SMS yozish')).toBeUndefined();
    });
  });

  describe('to\'lov + SMS', () => {
    const confirm = async (r: TestRenderer.ReactTestRenderer, res: any) => {
      await act(async () => {
        await mockActModalProps.current.onConfirm(res);
      });
    };
    it('sms o\'chiq -> onActConfirm', async () => {
      const r = await mount(lent);
      await tap(actBtn(r, 'Qarzni yopish'));
      await confirm(r, { debts: [L1], amounts: {}, sms: false });
      expect(mockOnActConfirm).toHaveBeenCalledWith({ debts: [L1], amounts: {}, sms: false });
      expect(mockPayWithSms).not.toHaveBeenCalled();
    });
    it('forgive + sms -> baribir onActConfirm', async () => {
      const r = await mount(lent);
      await tap(actBtn(r, 'Voz kechish'));
      await confirm(r, { debts: [L1], amounts: {}, sms: true });
      expect(mockOnActConfirm).toHaveBeenCalledTimes(1);
      expect(mockPayWithSms).not.toHaveBeenCalled();
    });
    it('sms yoqiq: muvaffaqiyat toast (izohli), modal yopiladi, reload', async () => {
      mockPayWithSms.mockResolvedValue({ allClosed: true, outcomes: ['sent'], resData: [{}] });
      mockApi.getDebts.mockResolvedValue({ data: { data: [L1] } });
      const r = await mount(lent);
      await tap(actBtn(r, 'Qarzni yopish'));
      await confirm(r, { debts: [L1], amounts: { UZS: null }, sms: true });
      expect(mockPayWithSms).toHaveBeenCalledWith([L1], { UZS: null });
      expect(toasts().pop()).toEqual({ type: 'omad', visibilityTime: 5000, props: { title: 'Qarz yopildi', desc: 'sms-note' } });
      expect(mockActModalProps.current.visible).toBe(false);
      expect(mockApi.getDebts).toHaveBeenCalled();
    });
    it('sms yoqiq: izohsiz, qisman -> "To\'lov qayd etildi"', async () => {
      mockPayWithSms.mockResolvedValue({ allClosed: false, outcomes: [], resData: [] });
      mockApi.getDebts.mockResolvedValue({ data: { data: [L1] } });
      const r = await mount(lent);
      await tap(actBtn(r, 'Qarzni yopish'));
      await confirm(r, { debts: [L1], amounts: {}, sms: true });
      expect(toasts().pop()).toEqual({ type: 'omad', props: { desc: 'To‘lov qayd etildi' } });
    });
    it('bo\'sh debts yoki band bo\'lsa hech narsa qilmaydi', async () => {
      const r = await mount(lent);
      await tap(actBtn(r, 'Qarzni yopish'));
      await confirm(r, { debts: [], amounts: {}, sms: true });
      expect(mockPayWithSms).not.toHaveBeenCalled();
    });
    it('xato: over-remaining / already-closed / message / default', async () => {
      const r = await mount(lent);
      await tap(actBtn(r, 'Qarzni yopish'));
      const { SmsPayError } = jest.requireActual('../src/screens/home/modules/debtSms');
      const cases: [any, string][] = [
        [{ response: { data: { code: 'over-remaining' } } }, 'Summa qoldiqdan oshmasligi kerak'],
        [{ response: { data: { code: 'already-closed' } } }, 'Qarz allaqachon yopilgan'],
        [{ response: { data: { message: 'Server xabari' } } }, 'Server xabari'],
        [{}, 'Xatolik yuz berdi'],
      ];
      for (const [cause, msg] of cases) {
        mockToast.mockClear();
        mockPayWithSms.mockRejectedValue(new SmsPayError(cause, 0));
        await confirm(r, { debts: [L1], amounts: {}, sms: true });
        expect(toasts().pop()).toEqual({ type: 'error2', visibilityTime: 4000, props: { desc: msg } });
      }
    });
    it('xato: qisman bajarilgan (done>0) -> modal yopiladi + reload; oddiy Error -> to\'g\'ridan-to\'g\'ri', async () => {
      const { SmsPayError } = jest.requireActual('../src/screens/home/modules/debtSms');
      mockApi.getDebts.mockResolvedValue({ data: { data: [L1] } });
      const r = await mount(lent);
      await tap(actBtn(r, 'Qarzni yopish'));
      mockPayWithSms.mockRejectedValue(new SmsPayError({}, 2));
      await confirm(r, { debts: [L1], amounts: {}, sms: true });
      expect(mockApi.getDebts).toHaveBeenCalledTimes(1);
      expect(mockActModalProps.current.visible).toBe(false);
      await tap(actBtn(r, 'Qarzni yopish'));
      mockToast.mockClear();
      mockPayWithSms.mockRejectedValue({ response: { data: { message: 'M' } } });
      await confirm(r, { debts: [L1], amounts: {}, sms: true });
      expect(toasts().pop().props.desc).toBe('M');
    });
    it('plan-required xatosi: modal yopiladi, handlePlanRequiredError chaqiriladi, toast yo\'q', async () => {
      const { SmsPayError } = jest.requireActual('../src/screens/home/modules/debtSms');
      mockHandlePlan.mockReturnValue(true);
      const r = await mount(lent);
      await tap(actBtn(r, 'Qarzni yopish'));
      mockPayWithSms.mockRejectedValue(new SmsPayError({ plan: true }, 0));
      await confirm(r, { debts: [L1], amounts: {}, sms: true });
      expect(mockHandlePlan).toHaveBeenCalled();
      expect(mockActModalProps.current.visible).toBe(false);
      expect(toasts()).toHaveLength(0);
    });
    it('sms qulfi: modal yopiladi, tarif ekrani', async () => {
      mockLocked = { auto_sms_reminder: true };
      const r = await mount(lent);
      await tap(actBtn(r, 'Qarzni yopish'));
      expect(mockActModalProps.current.smsLocked).toBe(true);
      await act(async () => {
        mockActModalProps.current.onSmsLocked();
      });
      expect(mockActModalProps.current.visible).toBe(false);
      expect(mockShowPlan).toHaveBeenCalledWith({ expired: false }, expect.objectContaining({ t: expect.any(Function) }));
    });
  });
});
