/**
 * debtAllocation.ts — bir nechta shaxsiy qarzga BITTA summani taqsimlash.
 *
 * 31.10: IQTISODIY tartib ('economic_v1') — sayt `frontend/utils/debtAllocation.js` va backend
 * `services/personalDebtAllocation.service.js` (+ `personalDebtAllocationOrder.js`) bilan AYNAN bir xil:
 *  1) muddati O'TGAN (status 'overdue' yoki due_date < bugun), eng eskisi birinchi   → reason 'overdue'
 *  2) muddati yaqin (30 kun ichida), eng yaqini birinchi                             → 'due_now'
 *  3) qolgani: samarali oylik narx r_eff kamayish tartibida, teng bo'lsa kichik qoldiq → 'highest_rate';
 *     foizsizlar (0% muddatli/sanali ham) oxirida, muddati yaqini birinchi            → 'zero_rate'
 *  r_eff = (1+r)(1+δ)/(1+f)^(1/h) − 1 (backend dvigatel debtPlan/rates formulasining porti).
 *  - summa jami qoldiqdan oshmaydi; null — hammasi to'liq yopiladi; hisob tiyinlarda.
 * Valyuta tekshiruvi chaqiruvchida. Parity: __tests__/debt_allocation_parity_31_10.test.ts (umumiy fixture).
 */
import { num } from './financeMoney';
import { tkYmdFromMs } from '../../../helper/date';
import { toCents as moneyToCents } from '../../../helper/money';

export type AllocationReason = 'overdue' | 'due_now' | 'highest_rate' | 'zero_rate';
export const ORDER_RULE = 'economic_v1';

export type Allocation = {
  debt: any;
  pay: number;
  remainingAfter: number;
  closes: boolean;
  reason: AllocationReason;
};

export type AllocationResult = {
  total: number;
  paid: number;
  over: boolean;
  order_rule: string;
  allocations: Allocation[];
};

export type AllocationOpts = { today?: string; devaluationPct?: number; tranches?: Record<string, Tranche> };

const DUE_SOON_DAYS = 30;
const DEFAULT_DEVALUATION_PCT = 8;
const DAY_MS = 86400000;
const RATE_EPS = 1e-9;

// 01.11: backend utils/money.toCents bilan AYNAN bir xil (Number.EPSILON, NaN/Infinity -> 0): 1.005 -> 101 tiyin.
// Ilgari `Math.round(num(v) * 100)` edi -> .xx5 kiritishda serverdan 1 tiyin farq qilardi.
const toCents = (v: any): number => moneyToCents(v);
const fromCents = (c: number): number => Math.round(c) / 100;

const dateRank = (v: any): number => {
  if (v == null || v === '') return Number.POSITIVE_INFINITY;
  const t = new Date(String(v).replace(' ', 'T')).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
};

/** Eski tartib (muddati yaqin → uzoq). Endi taqsimotda ishlatilmaydi. */
export const compareByDue = (a: any, b: any): number => {
  const byDue = dateRank(a?.due_date) - dateRank(b?.due_date);
  if (byDue) return byDue;
  const byStart = dateRank(a?.start_date || a?.created_at) - dateRank(b?.start_date || b?.created_at);
  if (byStart) return byStart;
  return num(a?.id) - num(b?.id);
};

/** DB Date / ISO(Z) → Toshkent sanasi; 'YYYY-MM-DD[ HH:mm:ss]' → o'sha sana. */
// NOTE(refactor): differs from helper/date.tkYmdFromMs/offline tkYmdOf — tz-less '2026-10-31T21:00:00' is sliced as-is here but shifted +5h (-> 2026-11-01) by tkYmdOf on non-UTC+5 devices; 
export const ymdOf = (v: any): string | null => {
  if (v == null || v === '') return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && !/(Z|[+-]\d{2}:?\d{2})$/.test(v.trim())) {
    return v.slice(0, 10);
  }
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? tkYmdFromMs(t) : null;
};

const dayNum = (ymd: string): number => Math.floor(Date.parse(`${ymd}T00:00:00Z`) / DAY_MS);
export const todayTashkent = (nowMs: number = Date.now()): string =>
  tkYmdFromMs(nowMs);

const prepayHorizon = (termMonths: number, mode: any): number => {
  const n = Math.max(Number(termMonths) || 12, 1);
  return mode === 'lower_payment' ? (n + 1) / 2 : n;
};

export const effectiveMonthlyRate = (d: any, devaluationPct: number = DEFAULT_DEVALUATION_PCT): number => {
  const apr = Number(d?.interest_rate) || 0;
  const usd = String(d?.currency || 'UZS').toUpperCase() === 'USD';
  const delta = usd ? Math.pow(1 + (Number(devaluationPct) || 0) / 100, 1 / 12) - 1 : 0;
  const fee = (Number(d?.prepay_fee_pct) || 0) / 100;
  const term = Number(d?.term_months) > 0 ? Number(d.term_months) : 12;
  const h = Math.max(prepayHorizon(term, d?.prepay_mode), 1);
  return ((1 + apr / 1200) * (1 + delta)) / Math.pow(1 + fee, 1 / h) - 1;
};

export type Tranche = { overdue: number; due_now: number; overdue_since?: string | null; due_on?: string | null };

type Tier = 'overdue' | 'due_now' | 'rest';
type Entry = {
  d: any;
  tier: Tier;
  capC: number;
  key: number;
  zero: boolean;
  rate: number;
  remC: number;
  dueDay: number;
};

const TIER_RANK: Record<Tier, number> = { overdue: 0, due_now: 1, rest: 2 };
const idOf = (d: any): number => Number(d?.id) || 0;
const dayOrInf = (ymd: string | null | undefined): number => (ymd ? dayNum(ymd) : Number.POSITIVE_INFINITY);

/** Qarz qismlari (sentda). tranche — serverdan (GET /finance/debts/allocation-params); yo'q bo'lsa faqat sanaga ko'ra. */
const splitDebt = (d: any, todayDay: number, tranche: Tranche | null) => {
  const due = ymdOf(d?.due_date);
  const dueDay = due ? dayNum(due) : null;
  const remC = Math.max(0, toCents(d?.remaining_amount));
  let ovdC: number;
  let dueC: number;
  let since = due;
  let dueOn = due;
  if (tranche) {
    ovdC = Math.min(remC, Math.max(0, toCents(tranche.overdue)));
    dueC = Math.min(remC - ovdC, Math.max(0, toCents(tranche.due_now)));
    since = tranche.overdue_since || due;
    dueOn = tranche.due_on || due;
  } else {
    const isOverdue = d?.status === 'overdue' || (dueDay !== null && dueDay < todayDay);
    const isSoon = !isOverdue && dueDay !== null && dueDay - todayDay <= DUE_SOON_DAYS;
    ovdC = isOverdue ? remC : 0;
    dueC = isSoon ? remC : 0;
  }
  return { remC, ovdC, dueC, restC: remC - ovdC - dueC, since, dueOn };
};

const entriesOf = (d: any, todayDay: number, devaluationPct: number, tranche: Tranche | null): Entry[] => {
  const rate = effectiveMonthlyRate(d, devaluationPct);
  const zero =
    rate <= RATE_EPS || ((Number(d?.interest_rate) || 0) === 0 && (d?.debt_kind === 'installment' || d?.debt_kind === 'dated'));
  const sp = splitDebt(d, todayDay, tranche);
  const base = { d, rate, zero, remC: sp.remC, dueDay: dayOrInf(ymdOf(d?.due_date)) };
  const out: Entry[] = [];
  if (sp.ovdC > 0) out.push({ ...base, tier: 'overdue', capC: sp.ovdC, key: dayOrInf(sp.since) });
  if (sp.dueC > 0) out.push({ ...base, tier: 'due_now', capC: sp.dueC, key: dayOrInf(sp.dueOn) });
  if (sp.restC > 0 || out.length === 0) out.push({ ...base, tier: 'rest', capC: sp.restC, key: base.dueDay });
  return out;
};

const compareEntries = (a: Entry, b: Entry): number => {
  if (a.tier !== b.tier) return TIER_RANK[a.tier] - TIER_RANK[b.tier];
  const byKeyThenRem = () => a.key - b.key || a.remC - b.remC || idOf(a.d) - idOf(b.d);
  if (a.tier !== 'rest') return byKeyThenRem();
  if (a.zero !== b.zero) return a.zero ? 1 : -1;
  if (a.zero) return byKeyThenRem();
  if (Math.abs(a.rate - b.rate) > RATE_EPS) return b.rate - a.rate;
  return a.remC - b.remC || a.key - b.key || idOf(a.d) - idOf(b.d);
};

/** Tartiblangan to'lov nishonlari (har qarz bir necha qism bilan qatnashishi mumkin). */
export const economicEntries = (
  debts: any[],
  opts: AllocationOpts = {},
): { debt: any; tier: Tier; capC: number; reason: AllocationReason }[] => {
  const todayDay = dayNum(opts.today || todayTashkent());
  const dev = opts.devaluationPct == null ? DEFAULT_DEVALUATION_PCT : opts.devaluationPct;
  const tranches = opts.tranches || {};
  const all: Entry[] = [];
  for (const d of debts || []) all.push(...entriesOf(d, todayDay, dev, tranches[d?.id] || tranches[String(d?.id)] || null));
  return all.sort(compareEntries).map(e => ({
    debt: e.d,
    tier: e.tier,
    capC: e.capC,
    reason: (e.tier === 'rest' ? (e.zero ? 'zero_rate' : 'highest_rate') : e.tier) as AllocationReason,
  }));
};

/** Iqtisodiy tartibdagi qarzlar (birinchi qatnashgan qismi bo'yicha) + sabab kodi. */
export const economicOrder = (debts: any[], opts: AllocationOpts = {}): { debt: any; reason: AllocationReason }[] => {
  const seen = new Set<any>();
  const out: { debt: any; reason: AllocationReason }[] = [];
  for (const e of economicEntries(debts, opts)) {
    if (seen.has(e.debt)) continue;
    seen.add(e.debt);
    out.push({ debt: e.debt, reason: e.reason });
  }
  return out;
};

/** `amount` null — tanlangan qarzlar to'liq yopiladi. */
export const allocatePayment = (debts: any[], amount: number | null, opts: AllocationOpts = {}): AllocationResult => {
  const entries = economicEntries(debts, opts);
  const order = economicOrder(debts, opts);
  const totalC = (debts || []).reduce((s, d) => s + Math.max(0, toCents(d?.remaining_amount)), 0);
  const wantC = amount == null ? totalC : Math.max(0, toCents(amount));
  if (wantC > totalC) {
    return { total: fromCents(totalC), paid: fromCents(wantC), over: true, order_rule: ORDER_RULE, allocations: [] };
  }
  let leftC = wantC;
  const paidC = new Map<any, number>();
  for (const e of entries) {
    const payC = Math.min(e.capC, leftC);
    leftC -= payC;
    paidC.set(e.debt, (paidC.get(e.debt) || 0) + payC);
  }
  const allocations = order.map(({ debt: d, reason }) => {
    const remC = Math.max(0, toCents(d?.remaining_amount));
    const payC = paidC.get(d) || 0;
    return {
      debt: d,
      pay: fromCents(payC),
      remainingAfter: fromCents(remC - payC),
      closes: payC > 0 && remC - payC <= 0,
      reason,
    };
  });
  return { total: fromCents(totalC), paid: fromCents(wantC), over: false, order_rule: ORDER_RULE, allocations };
};

/** Qarzlar valyuta bo'yicha guruhlari (UZS, USD, so'ng qolganlari) — har biri ALOHIDA to'lanadi. */
export const groupByCurrency = (debts: any[]): { currency: string; debts: any[] }[] => {
  const rank = (c: string) => (c === 'UZS' ? 0 : c === 'USD' ? 1 : 2);
  const map = new Map<string, any[]>();
  for (const d of debts || []) {
    const c = String(d?.currency || 'UZS');
    map.set(c, [...(map.get(c) || []), d]);
  }
  return [...map.keys()]
    .sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0))
    .map(currency => ({ currency, debts: map.get(currency) || [] }));
};
