/**
 * FinanceDebtDetail xarakteristika testlari (wave B): render daraxti goldenlari (fixtures/debt_detail_tree.json —
 * bo'linishdan OLDINGI komponentdan yozilgan) va amal testlari (endpoint + payload + toast + navigatsiya).
 * Faqat chegaralar mock: useFetch, financeApi, Toast, navigatsiya, planGate, useFinanceDemand, i18n, ikonlar, RdHeader.
 * Daraxtlarni qayta yaratish (FAQAT eski komponent bilan): DD_TREE_GEN=1 npx jest finance_debt_detail
 */
import React from 'react';
import { Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

const mockRefresh = jest.fn();
const mockToast = jest.fn();
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockOpenURL = jest.fn();
const mockShowPlan = jest.fn();
const mockDemandStart = jest.fn();
let mockDebt: any = null;
let mockParams: any = { id: 5 };
let mockLocked: Record<string, boolean> = {};
let mockPayout: any = null;

const mockApi = {
  getPayoutCard: jest.fn(),
  addDebtPayment: jest.fn(),
  mirrorPayDebt: jest.fn(),
  forgiveDebtAny: jest.fn(),
  complainDebt: jest.fn(),
  complainShopDebt: jest.fn(),
  deleteDebt: jest.fn(),
  mirrorHideDebt: jest.fn(),
};

jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])),
  }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useRoute: () => ({ params: mockParams }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));
jest.mock('../src/hooks/useFetch', () => ({
  useFetch: () => ({ data: mockDebt ? { data: mockDebt } : null, onRefresh: mockRefresh }),
}));
jest.mock('../src/screens/home/modules/financeApi', () => ({ financeApi: new Proxy({}, { get: (_t, k) => (mockApi as any)[k] }) }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/helper/safeOpenURL', () => ({ safeOpenURL: (...a: unknown[]) => mockOpenURL(...a) }));
jest.mock('../src/screens/home/modules/planGate', () => ({
  usePlanFeatures: () => ({ expired: false }),
  isFeatureLocked: (_p: unknown, k: string) => !!mockLocked[k],
  showPlanRequired: (...a: unknown[]) => mockShowPlan(...a),
  PLAN_PAID_ONLY_TEXT: 'paid-only',
  smsPlanNotice: () => '',
}));
jest.mock('../src/screens/home/modules/useDebtGroupActions', () => ({
  useFinanceDemand: () => ({ demanding: false, start: (...a: unknown[]) => mockDemandStart(...a), modal: { visible: false } }),
}));
jest.mock('../src/screens/components/DemandConfirmModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: ({ title }: any) => {
    const R = require('react');
    const { Text } = require('react-native');
    return R.createElement(Text, null, title);
  },
}));
jest.mock('../src/screens/home/modules/financeForm', () => ({
  DateField: (p: any) => require('react').createElement('DateField', { value: p.value instanceof Date ? p.value.toISOString() : String(p.value), label: p.label }),
}));
jest.mock('../src/screens/home/modules/FinanceDebtActionModal', () => ({
  BanIcon: () => require('react').createElement('Icon', { name: 'BanIcon' }),
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : () => require('react').createElement('Icon', { name: String(k) })) },
    ),
);
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: () => '#000' }),
    font: new Proxy({}, { get: () => 'F' }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));

import { fMoney } from '../src/screens/home/modules/financeMoney';
import FinanceDebtDetail from '../src/screens/home/modules/FinanceDebtDetail';
import fs from 'fs';
import path from 'path';

const NOW = new Date('2026-11-01T10:00:00Z');

const lent = (over: any = {}) => ({
  id: 5, type: 'lent', status: 'active', amount: '1000000', remaining_amount: '600000', currency: 'UZS',
  source_name: 'Karim', phone: '+998 90 123 45 67', start_date: '2026-10-01', due_date: '2026-12-01',
  interest_rate: 5, notes: 'Mahsulot uchun', created_at: '2026-10-01 09:15:00',
  payments: [{ id: 1, amount: '400000', payment_date: '2026-10-10', created_at: '2026-10-10 12:00:00', notes: '', created_by_role: 'owner' }],
  ...over,
});
const borrowedUsd = () => lent({ id: 6, type: 'borrowed', currency: 'USD', amount: '500.50', remaining_amount: '300.25', payments: [], due_date: null, interest_rate: 0 });
const overdueDebt = () => lent({ due_date: '2026-10-15' });
const closed = () => lent({ status: 'completed', remaining_amount: '0', payments: [{ id: 1, amount: '1000000', payment_date: '2026-10-20', created_at: '2026-10-20 10:00:00', notes: 'Qarz beruvchi qayd etdi | rahmat' }], due_date: null });
const forgivenMarker = () => lent({
  status: 'completed', remaining_amount: '0', due_date: null,
  payments: [
    { id: 1, amount: '400000', payment_date: '2026-10-10', created_at: '2026-10-10 12:00:00', notes: '' },
    { id: 2, amount: '600000', payment_date: '2026-10-25', created_at: '2026-10-25 12:00:00', notes: '__forgive__' },
  ],
});
const forgivenLegacy = () => lent({ status: 'completed', remaining_amount: '0', due_date: null, notes: 'Kechirilgan (voz kechildi)', updated_at: '2026-10-26 08:00:00' });
const withIncrease = () => lent({
  amount: '1200000',
  payments: [
    { id: 1, amount: '200000', payment_date: '2026-10-05', created_at: '2026-10-05 12:00:00', notes: '__increase__|qo‘shimcha' },
    { id: 2, amount: '300000', payment_date: '2026-10-10', created_at: '2026-10-10 12:00:00', notes: '', created_by_role: 'counterparty', created_by_name: 'Anvar' },
  ],
});
const mirrorOp = (over: any = {}) => ({ ...lent({ id: 'm9', source_name: 'Hamkor Ali', can_operate: true, payments: [] }), ...over });
const mirrorBorrowedNoOp = () => mirrorOp({ type: 'borrowed', can_operate: false, payments: [], is_shop_debt: false });
const mirrorShop = () => mirrorOp({ id: 12, type: 'borrowed', can_operate: false, is_shop_debt: true, shop_phone: '+998712223344', shop_region: 'Toshkent', shop_district: 'Chilonzor' });

const textOf = (n: any): string => n.children.map((c: any) => (typeof c === 'string' ? c : textOf(c))).join('');
const allText = (r: TestRenderer.ReactTestRenderer) => textOf(r.root);
const outerPress = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n))[0];
const findPress = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) => {
  const n = outerPress(r, pred);
  return n && !n.props.disabled ? n : undefined;
};
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => findPress(r, n => textOf(n).trim() === text);
// Tasdiq oynasidagi tugma: bir xil yozuvli bir nechta tugmadan OXIRGISI (modal hujjat oxirida).
const lastByText = (r: TestRenderer.ReactTestRenderer, text: string) => {
  const all = r.root.findAll(n => typeof n.props.onPress === 'function' && textOf(n).trim() === text);
  return all[all.length - 1];
};
const byLabel = (r: TestRenderer.ReactTestRenderer, label: string) => findPress(r, n => n.props.accessibilityLabel === label);
const input = (r: TestRenderer.ReactTestRenderer, placeholder: string) =>
  r.root.findAll(n => n.props.placeholder === placeholder && typeof n.props.onChangeText === 'function')[0];
// Summa maydoni (placeholder formatida bo'sh joy turi o'zgarishi mumkin) — klaviatura turi bo'yicha.
const amountInput = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => ['number-pad', 'decimal-pad'].includes(n.props.keyboardType) && typeof n.props.onChangeText === 'function')[0];
const sw = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => n.props.accessibilityLabel === 'SMS yuborish' && typeof n.props.onValueChange === 'function')[0];
const tap = async (node: any, ...args: unknown[]) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress(...args);
  });
};
const type = async (node: any, v: string) => {
  expect(node).toBeDefined();
  await act(async () => {
    node.props.onChangeText(v);
  });
};
const toasts = () => mockToast.mock.calls.map(c => c[0]);
const lastToast = () => mockToast.mock.calls[mockToast.mock.calls.length - 1][0];

const mount = async (debt: any, params: any = { id: 5 }) => {
  mockDebt = debt;
  mockParams = params;
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<FinanceDebtDetail />);
  });
  return r;
};
const mountMirror = (m: any, extra: any = {}) => mount(null, { id: m.id, mirror: m, ...extra });

const resetMocks = () => {
  jest.clearAllMocks();
  Object.values(mockApi).forEach(f => f.mockReset().mockResolvedValue({ data: {} }));
  mockApi.getPayoutCard.mockImplementation(() => Promise.resolve({ data: { data: mockPayout } }));
  mockLocked = {};
  mockPayout = null;
  mockDebt = null;
  mockParams = { id: 5 };
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
};
beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  resetMocks();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------------------------------------------
// Render DARAXTI
// ---------------------------------------------------------------------------------------------------------------
const TREE_PATH = path.join(__dirname, 'fixtures', 'debt_detail_tree.json');
const GEN_TREE = !!process.env.DD_TREE_GEN;
const payOpen = async (debt: any, params?: any) => {
  const r = await mount(debt, params);
  await tap(byText(r, debt.type === 'borrowed' ? 'Qarzni qaytarish' : 'Qarzni yopish'));
  return r;
};

describe('FinanceDebtDetail — render daraxti (vizual chiqish o\'zgarmagan)', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['loading', () => mount(null)],
    ['lent active', () => mount(lent())],
    ['borrowed active usd', () => mount(borrowedUsd())],
    ['lent overdue', () => mount(overdueDebt())],
    ['closed lent', () => mount(closed())],
    ['forgiven marker', () => mount(forgivenMarker())],
    ['forgiven legacy synthetic', () => mount(forgivenLegacy())],
    ['with increase + partner payment', () => mount(withIncrease())],
    ['hideParty', () => mount(lent(), { id: 5, hideParty: true })],
    ['plan locked + card not ready', async () => {
      mockLocked = { manual_sms_send: true, auto_sms_reminder: true };
      mockPayout = { ready: false, card_number: '' };
      return mount(lent());
    }],
    ['payout card ready', async () => {
      mockPayout = { ready: true, card_number: '8600123456789012', telegram_phone: '+998901112233' };
      return mount(lent());
    }],
    ['mirror can_operate', () => mountMirror(mirrorOp())],
    ['mirror borrowed no operate (complaint)', () => mountMirror(mirrorBorrowedNoOp())],
    ['mirror shop debt', () => mountMirror(mirrorShop())],
    ['mirror closed', () => mountMirror(mirrorOp({ status: 'completed', remaining_amount: '0' }))],
    ['modal pay full', () => payOpen(lent())],
    ['modal pay partial typed', async () => {
      const r = await payOpen(lent());
      await tap(byText(r, 'Qisman'));
      await type(amountInput(r), '250000');
      await type(input(r, 'Qo‘shimcha ma\'lumot...'), 'nota');
      return r;
    }],
    ['modal pay partial over', async () => {
      const r = await payOpen(lent());
      await tap(byText(r, 'Qisman'));
      await type(amountInput(r), '700000');
      return r;
    }],
    ['modal pay borrowed usd partial', async () => {
      const r = await payOpen(borrowedUsd());
      await tap(byText(r, 'Qisman'));
      await type(amountInput(r), '100.5');
      return r;
    }],
    ['modal pay sms on', async () => {
      const r = await payOpen(lent());
      await act(async () => sw(r).props.onValueChange(true));
      return r;
    }],
    ['modal pay sms locked', async () => {
      mockLocked = { auto_sms_reminder: true };
      return payOpen(lent());
    }],
    ['modal sms templates lent', async () => {
      const r = await mount(lent());
      await tap(byLabel(r, 'SMS yuborish'));
      return r;
    }],
    ['modal sms templates borrowed overdue card', async () => {
      mockPayout = { ready: true, card_number: '8600123456789012', telegram_phone: '' };
      const r = await mount(lent({ type: 'borrowed', due_date: '2026-10-15' }));
      await tap(byLabel(r, 'SMS yuborish'));
      return r;
    }],
    ['modal sms templates lent card+partly', async () => {
      mockPayout = { ready: true, card_number: '8600123456789012', telegram_phone: '+998901112233' };
      const r = await mount(overdueDebt());
      await tap(byLabel(r, 'SMS yuborish'));
      return r;
    }],
    ['modal forgive', async () => {
      const r = await mount(lent());
      await tap(byText(r, 'Voz kechish'));
      return r;
    }],
    ['modal delete', async () => {
      const r = await mount(closed());
      await tap(byText(r, 'O‘chirish'));
      return r;
    }],
    ['modal complaint', async () => {
      const r = await mountMirror(mirrorBorrowedNoOp());
      await tap(byText(r, 'Shikoyat qilish'));
      return r;
    }],
    ['modal complaint reason+note', async () => {
      const r = await mountMirror(mirrorShop());
      await tap(byText(r, 'Shikoyat qilish'));
      await tap(byText(r, 'Qarzimni to‘liq qaytargan edim-ku?'));
      await type(input(r, 'Qo‘shimcha izoh (ixtiyoriy)'), 'izoh matni');
      return r;
    }],
    ['modal complaint sent', async () => {
      mockApi.complainDebt.mockResolvedValue({ data: { success: true } });
      const r = await mountMirror(mirrorBorrowedNoOp());
      await tap(byText(r, 'Shikoyat qilish'));
      await tap(byText(r, 'Qarzimni bir qismini qaytarganman-ku?'));
      await tap(byText(r, 'Yuborish'));
      return r;
    }],
  ];

  if (GEN_TREE) {
    test('daraxtlarni eski komponentdan yaratish', async () => {
      const out: Record<string, string> = {};
      for (const [name, build] of states) {
        jest.setSystemTime(NOW);
        jest.restoreAllMocks();
        resetMocks();
        const r = await build();
        out[name] = JSON.stringify(r.toJSON());
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
    jest.setSystemTime(NOW);
    const r = await states.find(s => s[0] === name)![1]();
    expect(JSON.stringify(r.toJSON())).toBe(golden[name]);
    await act(async () => r.unmount());
  });
});

// ---------------------------------------------------------------------------------------------------------------
// AMALLAR
// ---------------------------------------------------------------------------------------------------------------
describe('FinanceDebtDetail — to\'lov (qarzni yopish / qaytarish)', () => {
  test('to\'liq (berilgan qarz): addDebtPayment payload, refresh, "Qarz yopildi", oyna yopiladi', async () => {
    const r = await payOpen(lent());
    await tap(byText(r, 'Yopish'));
    expect(mockApi.addDebtPayment).toHaveBeenCalledWith(5, { amount: 600000, payment_date: '2026-11-01', create_expense: false, notify_sms: false });
    expect(mockRefresh).toHaveBeenCalledWith({});
    expect(toasts()).toEqual([{ type: 'omad', props: { desc: 'Qarz yopildi' } }]);
    expect(allText(r)).not.toContain('To‘lov summasi');
  });
  test('qisman + izoh (olingan USD qarz): create_expense=true, tsent aniqligi, "To\'lov qayd etildi"', async () => {
    const r = await payOpen(borrowedUsd());
    await tap(byText(r, 'Qisman'));
    await type(amountInput(r), '100.5');
    await type(input(r, 'Qo‘shimcha ma\'lumot...'), '  qism  ');
    await tap(byText(r, 'Qayd etish'));
    expect(mockApi.addDebtPayment).toHaveBeenCalledWith(6, { amount: 100.5, payment_date: '2026-11-01', create_expense: true, notify_sms: false, notes: 'qism' });
    expect(toasts()).toEqual([{ type: 'omad', props: { desc: 'To‘lov qayd etildi' } }]);
  });
  test('qoldiqdan oshsa tugma bosilmaydi; summasiz ham', async () => {
    const r = await payOpen(lent());
    await tap(byText(r, 'Qisman'));
    expect(byText(r, 'Qayd etish')).toBeUndefined();
    await type(amountInput(r), '700000');
    expect(byText(r, 'Qayd etish')).toBeUndefined();
    expect(allText(r)).toContain('Summa qoldiqdan oshmasligi kerak');
    expect(mockApi.addDebtPayment).not.toHaveBeenCalled();
  });
  test('SMS yoqilgan: notify_sms=true; javobda sms yo\'q -> sarlavhali 5s toast', async () => {
    const r = await payOpen(lent());
    await act(async () => sw(r).props.onValueChange(true));
    await tap(byText(r, 'Yopish'));
    expect(mockApi.addDebtPayment.mock.calls[0][1].notify_sms).toBe(true);
    const t0 = lastToast();
    expect(t0.type).toBe('omad');
    expect(t0.visibilityTime).toBe(5000);
    expect(t0.props.title).toBe('Qarz yopildi');
    expect(typeof t0.props.desc).toBe('string');
  });
  test('SMS tarifda qulflangan: Switch Tariflar taklifini ochadi, oyna yopiladi, SMS yoqilmaydi', async () => {
    mockLocked = { auto_sms_reminder: true };
    const r = await payOpen(lent());
    await act(async () => sw(r).props.onValueChange(true));
    expect(mockShowPlan).toHaveBeenCalledTimes(1);
    expect(mockShowPlan.mock.calls[0][0]).toEqual({ expired: false });
    expect(Object.keys(mockShowPlan.mock.calls[0][1]).sort()).toEqual(['navigation', 't']);
    expect(allText(r)).not.toContain('To‘lov summasi');
  });
  test('xato: over-remaining kodi, server xabari, zaxira matn', async () => {
    const r = await payOpen(lent());
    mockApi.addDebtPayment.mockRejectedValueOnce({ response: { data: { code: 'over-remaining', message: 'srv' } } });
    await tap(byText(r, 'Yopish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'Summa qoldiqdan oshmasligi kerak' } });
    mockApi.addDebtPayment.mockRejectedValueOnce({ response: { data: { message: 'server xabari' } } });
    await tap(byText(r, 'Yopish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'server xabari' } });
    mockApi.addDebtPayment.mockRejectedValueOnce(new Error('net'));
    await tap(byText(r, 'Yopish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(allText(r)).toContain('To‘lov summasi'); // xatoda oyna ochiq qoladi
  });
  test('ko\'zgu (men qarz beruvchi): to\'liq = summasiz mirrorPayDebt; mahalliy nusxa yopiladi', async () => {
    mockApi.mirrorPayDebt.mockResolvedValue({ data: { remaining_amount: 0, data: { id: 77, amount: 600000, payment_date: '2026-11-01', notes: '' } } });
    const r = await mountMirror(mirrorOp());
    await tap(byText(r, 'Qarzni yopish'));
    await tap(byText(r, 'Yopish'));
    expect(mockApi.mirrorPayDebt).toHaveBeenCalledWith('m9', { payment_date: '2026-11-01' });
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(lastToast()).toEqual({ type: 'omad', props: { desc: 'Qarz yopildi' } });
    expect(allText(r)).toContain('Yopilgan');
  });
  test('ko\'zgu qisman: amount + notes + notify_sms', async () => {
    const r = await mountMirror(mirrorOp());
    await tap(byText(r, 'Qarzni yopish'));
    await tap(byText(r, 'Qisman'));
    await type(amountInput(r), '100000');
    await type(input(r, 'Qo‘shimcha ma\'lumot...'), 'x');
    await act(async () => sw(r).props.onValueChange(true));
    await tap(byText(r, 'Qayd etish'));
    expect(mockApi.mirrorPayDebt).toHaveBeenCalledWith('m9', { payment_date: '2026-11-01', amount: 100000, notes: 'x', notify_sms: true });
    expect(allText(r)).toContain(fMoney(500000, 'UZS')); // qoldiq 600000-100000
  });
});

describe('FinanceDebtDetail — voz kechish, o\'chirish, shikoyat, talab, SMS, navigatsiya', () => {
  test('voz kechish: forgiveDebtAny(id,false), refresh, toast; xato: already-closed / server / zaxira', async () => {
    const r = await mount(lent());
    await tap(byText(r, 'Voz kechish'));
    await tap(lastByText(r, 'Voz kechish'));
    expect(mockApi.forgiveDebtAny).toHaveBeenCalledWith(5, false);
    expect(mockRefresh).toHaveBeenCalledWith({});
    expect(lastToast()).toEqual({ type: 'omad', props: { desc: 'Qarzdan voz kechildi' } });
    await tap(byText(r, 'Voz kechish'));
    mockApi.forgiveDebtAny.mockRejectedValueOnce({ response: { data: { code: 'already-closed' } } });
    await tap(lastByText(r, 'Voz kechish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'Qarz allaqachon yopilgan' } });
    mockApi.forgiveDebtAny.mockRejectedValueOnce({ response: { data: { message: 'm' } } });
    await tap(lastByText(r, 'Voz kechish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'm' } });
    mockApi.forgiveDebtAny.mockRejectedValueOnce(new Error('x'));
    await tap(lastByText(r, 'Voz kechish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
  });
  test('ko\'zgu voz kechish: forgiveDebtAny(id,true) va mahalliy yopish', async () => {
    const r = await mountMirror(mirrorOp());
    await tap(byText(r, 'Voz kechish'));
    await tap(lastByText(r, 'Voz kechish'));
    expect(mockApi.forgiveDebtAny).toHaveBeenCalledWith('m9', true);
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(allText(r)).toContain('Yopilgan'); // mahalliy nusxada faqat status/qoldiq yangilanadi
  });
  test('o\'chirish: deleteDebt / mirrorHideDebt, toast, goBack; xato: server xabari', async () => {
    const r = await mount(closed());
    await tap(byText(r, 'O‘chirish'));
    await tap(lastByText(r, 'O‘chirish'));
    expect(mockApi.deleteDebt).toHaveBeenCalledWith(5);
    expect(lastToast()).toEqual({ type: 'omad', props: { desc: 'O‘chirildi' } });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    mockToast.mockClear();
    mockApi.deleteDebt.mockRejectedValueOnce({ response: { data: { message: 'bor' } } });
    await tap(byText(r, 'O‘chirish'));
    await tap(lastByText(r, 'O‘chirish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'bor' } });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    const rm = await mountMirror(mirrorOp({ status: 'completed', remaining_amount: '0' }));
    await tap(byText(rm, 'O‘chirish'));
    await tap(lastByText(rm, 'O‘chirish'));
    expect(mockApi.mirrorHideDebt).toHaveBeenCalledWith('m9');
  });
  test('shikoyat: complainDebt payload; do\'kon: complainShopDebt; success=false va xato toastlari', async () => {
    mockApi.complainDebt.mockResolvedValue({ data: { success: true } });
    const r = await mountMirror(mirrorBorrowedNoOp());
    await tap(byText(r, 'Shikoyat qilish'));
    expect(byText(r, 'Yuborish')).toBeUndefined();
    await tap(byText(r, 'Men qarz olmaganman-ku?'));
    await tap(byText(r, 'Yuborish'));
    expect(mockApi.complainDebt).toHaveBeenCalledWith('m9', { reason: 'not_taken', izoh: '' });
    expect(lastToast()).toEqual({ type: 'omad', props: { desc: 'Shikoyat yuborildi' } });
    expect(allText(r)).toContain('Shikoyatingiz qarz bergan shaxsga');
    await tap(byText(r, 'Ok'));
    expect(allText(r)).not.toContain('Qarz bo‘yicha shikoyat');

    mockApi.complainShopDebt.mockResolvedValue({ data: { success: false, message: 'rad' } });
    const rs2 = await mountMirror(mirrorShop());
    await tap(byText(rs2, 'Shikoyat qilish'));
    await type(input(rs2, 'Sabab tanlanmasa — izoh yozing (majburiy)'), '  izoh  ');
    await tap(byText(rs2, 'Yuborish'));
    expect(mockApi.complainShopDebt).toHaveBeenCalledWith(12, { reason: 'other', izoh: 'izoh' });
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'rad' } });
    mockApi.complainShopDebt.mockRejectedValueOnce({ response: { data: { message: 'srv' } } });
    await tap(byText(rs2, 'Yuborish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'srv' } });
    mockApi.complainShopDebt.mockRejectedValueOnce(new Error('x'));
    await tap(byText(rs2, 'Yuborish'));
    expect(lastToast()).toEqual({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
  });
  test('talab qilish: useFinanceDemand.start({id, is_mirror}); karta hint', async () => {
    mockPayout = { ready: false };
    const r = await mount(lent());
    expect(allText(r)).toContain('Talab qilish uchun avval plastik karta');
    await tap(byText(r, 'Talab qilish'));
    expect(mockDemandStart).toHaveBeenCalledWith({ id: 5, is_mirror: false });
    const rm = await mountMirror(mirrorOp());
    await tap(byText(rm, 'Talab qilish'));
    expect(mockDemandStart).toHaveBeenLastCalledWith({ id: 'm9', is_mirror: true });
  });
  test('yana qarz: navigate(FinanceDebtAdd, ...) turi bo\'yicha', async () => {
    const r = await mount(lent());
    await tap(byText(r, 'Yana qarz berish'));
    expect(mockNavigate).toHaveBeenCalledWith('FinanceDebtAdd', { initialType: 'lent', initialName: 'Karim', initialPhone: '+998 90 123 45 67' });
    const rb = await mount(borrowedUsd());
    await tap(byText(rb, 'Yana qarz olish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('FinanceDebtAdd', { initialType: 'borrowed', initialName: 'Karim', initialPhone: '+998 90 123 45 67' });
  });
  test('SMS: shablon -> sms:...?body=, bo\'sh SMS; yopilgan qarzda to\'g\'ridan-to\'g\'ri; qo\'ng\'iroq', async () => {
    const r = await mount(lent());
    await tap(byLabel(r, 'SMS yuborish'));
    const tpl = findPress(r, n => textOf(n).startsWith(`Assalomu alaykum. Karim, ${fMoney(600000, 'UZS')} qarzingizni qachon`));
    await tap(tpl);
    expect(mockOpenURL).toHaveBeenCalledWith(`sms:+998901234567?body=${encodeURIComponent(`Assalomu alaykum. Karim, ${fMoney(600000, 'UZS')} qarzingizni qachon qaytarasiz?`)}`);
    await tap(byLabel(r, 'SMS yuborish'));
    await tap(byText(r, 'Bo‘sh SMS yozish'));
    expect(mockOpenURL).toHaveBeenLastCalledWith('sms:+998901234567');
    await tap(byLabel(r, 'Qo‘ng‘iroq qilish'));
    expect(Linking.openURL).toHaveBeenCalledWith('tel:+998901234567');
    const rc = await mount(closed());
    await tap(byLabel(rc, 'SMS yuborish'));
    expect(mockOpenURL).toHaveBeenLastCalledWith('sms:+998901234567');
  });
  test('karta rekvizitlari fokusda o\'qiladi (getPayoutCard)', async () => {
    await mount(lent());
    expect(mockApi.getPayoutCard).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 01.11 mustahkamlash (eski komponentda YO'Q): bir renderdagi IKKI tezkor bosish bitta so'rov (useApiAction himoyasi).
// ---------------------------------------------------------------------------------------------------------------
describe('FinanceDebtDetail — qo\'sh bosish himoyasi (yangi)', () => {
  test('"Yopish" ikki marta tez bosilsa addDebtPayment BIR marta chaqiriladi', async () => {
    const r = await payOpen(lent());
    const btn = byText(r, 'Yopish');
    await act(async () => {
      void btn.props.onPress();
      void btn.props.onPress();
    });
    expect(mockApi.addDebtPayment).toHaveBeenCalledTimes(1);
  });
  test('o\'chirish ikki marta tez bosilsa deleteDebt BIR marta', async () => {
    const r = await mount(closed());
    await tap(byText(r, 'O‘chirish'));
    const btn = lastByText(r, 'O‘chirish');
    await act(async () => {
      void btn.props.onPress();
      void btn.props.onPress();
    });
    expect(mockApi.deleteDebt).toHaveBeenCalledTimes(1);
  });
});
