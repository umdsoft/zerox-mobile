/**
 * debtPlanApi.ts — "Qarzdan chiqish" (qarz to'lash rejasi) moduli: REST chaqiruvlari,
 * turlar va javoblarni normallashtirish.
 *
 * Shartnoma: DESIGN.md §1 (dvigatel natijasi), §3 (API). Backend javobi `{ success, data }`.
 * Hisob-kitob FAQAT backendda (deterministik dvigatel) — mobil faqat ko'rsatadi.
 * Yagona istisno: `realAnnualRate` — sozlash formasida "haqiqiy stavka" ni darhol
 * ko'rsatish uchun (F4, Nyuton); rejaga ta'sir qilmaydi, server o'zi qayta hisoblaydi.
 *
 * Backend maydonlari camelCase yoki snake_case (DB qatori) bo'lishi mumkin — `pick`
 * ikkalasini ham o'qiydi, shuning uchun ekranlar bitta normal shaklda ishlaydi.
 */
import axios from 'axios';
import { URL } from '../../../constants';
import { storage } from '../../../../store/api/token/getToken';

const auth = () => ({
  headers: { Authorization: `Bearer ${storage.getString('token')}` },
});
const base = `${URL}/finance`;

// ─────────── Turlar ───────────
export type DebtKind = 'annuity' | 'differentiated' | 'card' | 'installment' | 'dated' | 'open';
export type PrepayMode = 'shorten_term' | 'lower_payment';
export type Strategy = 'optimal' | 'snowball' | 'manual';
export type ScenarioKey = 'conservative' | 'base' | 'optimistic';

export const DEBT_KINDS: DebtKind[] = ['annuity', 'differentiated', 'card', 'installment', 'dated', 'open'];
export const STRATEGIES: Strategy[] = ['optimal', 'snowball', 'manual'];
export const SCENARIOS: ScenarioKey[] = ['conservative', 'base', 'optimistic'];
export const ALL_MONTHS_MASK = 4095;

export type PlanDebt = {
  id: number;
  title: string;
  kind: DebtKind | null;
  currency: string;
  balance: number; // joriy qoldiq, o'z valyutasida
  amount: number; // boshlang'ich summa (progress uchun)
  apr: number | null;
  termMonths: number | null;
  minPayment: number | null;
  cardMinPct: number | null;
  cardMinAbs: number | null;
  prepayFeePct: number;
  prepayMode: PrepayMode;
  penaltyPct: number;
  dueDate: string | null;
  paymentDay: number | null;
  priority: number | null;
  excluded: boolean;
  receivedAmount: number | null;
  sourceType: string | null;
  status: string | null;
  kindInferred: boolean; // tur foydalanuvchi tomonidan tanlanmagan — backend taxmini
};

export type PlanIncome = {
  key: string; // UI kaliti (id bo'lmasa ham)
  id?: number | null;
  title: string;
  amount: number;
  currency: string;
  monthsMask: number; // 12 bit; 4095 = har oy; 0 = bir martalik
  oneOffYm: string | null; // 'YYYY-MM' (bir martalik)
  dayOfMonth: number;
  reliability: number; // 1 | 0.8 | 0.5 (F10 avto-moslashuvdan keyin aniq qiymat, masalan 0.62)
  reliabilityAuto?: boolean; // oylik cron ishonchlilikni o'zi moslashtiradi (F10)
  scheduledIncomeId?: number | null;
};

export type PlanSettings = {
  strategy: Strategy;
  fixedExpense: number;
  livingMedian: number;
  livingMad: number;
  historyMonths: number;
  livingConfidence: number;
  freeMoney: number | null;
  freeMoneyPct: number;
  survivalPct: number;
  bufferTarget: number | null;
  bufferCurrent: number;
  devaluationPct: number;
  inflationPct: number;
  incomeGrowthPct: number;
};

/**
 * Reja ichidagi qarz kaliti — SATR: haqiqiy qarzlar "12", yetishmovchilik uchun dvigatel
 * yaratgan sintetik qarzlar "new_debt_1" ("Yangi qarz (yetishmovchilik)").
 */
export type DebtKey = string;
export const isNewDebtKey = (k: DebtKey | null | undefined) => /^new_debt/.test(String(k || ''));

export type PlanEvent = {
  type: 'shortfall' | 'survival_cut' | 'late' | string;
  ym: string;
  debtId: DebtKey | null;
  amount: number;
};
export type PlanScenario = {
  months: number | null; // null — muddat ichida tugamaydi / hisoblanmadi
  finishYm: string | null;
  cost: number;
  events: PlanEvent[];
  closed: Record<string, string>;
};
export type PlanPayment = {
  debtId: DebtKey;
  amount: number;
  day: number | null;
  type: 'required' | 'extra' | 'saving' | 'overdue' | string;
};
export type PlanMonth = {
  ym: string;
  payments: PlanPayment[];
  living: { L: number; F: number } | null;
  buffer: number;
  totalRemaining: number;
  income: number;
};
export type PlanOrder = {
  debtId: DebtKey;
  monthlyRate: number; // ulush (0.0375 = 3,75%/oy)
  reasonKey: string;
  reasonParams: Record<string, any>;
};
export type PlanResult = {
  feasible: boolean;
  coverage: { q: number | null; qWithSurvival: number | null; verdict: 'ok' | 'tight' | 'infeasible' };
  living: { L: number; F: number; M: number; bufferTarget: number } | null;
  order: PlanOrder[];
  scenarios: Record<ScenarioKey, PlanScenario | null>;
  monteCarlo: { p10: number; p50: number; p90: number; pNewDebt: number } | null;
  schedule: PlanMonth[];
  compare: Partial<Record<Strategy, { months: number; cost: number } | null>>;
  totals: { totalDebt: number; monthlyRequired: number; interestAndFx: number };
  startYm: string | null;
};

export type PlanBundle = {
  setupDone: boolean;
  settings: PlanSettings;
  debts: PlanDebt[];
  incomes: PlanIncome[];
  result: PlanResult | null;
  fxUsd: number | null;
  status: string | null;
  resultError: string | null;
};

export type PlanSuggestions = {
  debts: PlanDebt[];
  incomes: PlanIncome[];
  fixedExpense: number | null;
  livingMedian: number | null;
  livingMad: number | null;
  historyMonths: number;
};

export type DailyLimit = { amount: number; until: string | null; explanation: string | null };

export type MonthPayment = PlanPayment & {
  title: string;
  currency: string | null;
  amountOrig: number | null; // qarz valyutasida (USD qarz uchun)
  paid: boolean;
  isNewDebt: boolean;
};

// ─────────── Yordamchilar ───────────
const n = (v: any): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const nOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};
const bool = (v: any): boolean => v === true || v === 1 || v === '1' || v === 'true';

/** camelCase yoki snake_case maydon (birinchi topilgani). */
const pick = (o: any, ...keys: string[]): any => {
  if (!o) return undefined;
  for (const k of keys) if (o[k] !== undefined) return o[k];
  return undefined;
};

/** Envelope `{ success, data }` dan ichki ma'lumot. */
const unwrap = (res: any): any => {
  const body = res?.data;
  return body && typeof body === 'object' && 'data' in body ? body.data : body;
};

const keyOf = (v: any): DebtKey | null => (v === null || v === undefined || v === '' ? null : String(v));

const ymOf = (s: any): string | null => {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
};

export const normalizeDebt = (d: any): PlanDebt => ({
  id: n(pick(d, 'id', 'debtId', 'debt_id')),
  title: String(pick(d, 'title', 'source_name', 'sourceName', 'name') || '—'),
  kind: (pick(d, 'kind', 'debt_kind', 'debtKind') || null) as DebtKind | null,
  currency: String(pick(d, 'currency') || 'UZS'),
  balance: n(pick(d, 'balance', 'remaining_amount', 'remainingAmount')),
  // Boshlang'ich summa — /debt-plan javobida bo'lmasligi mumkin (0 → progress ko'rsatilmaydi).
  amount: n(pick(d, 'amount', 'original_amount', 'originalAmount')),
  apr: nOrNull(pick(d, 'apr', 'interest_rate', 'interestRate')),
  termMonths: nOrNull(pick(d, 'termMonths', 'term_months')),
  minPayment: nOrNull(pick(d, 'minPayment', 'min_payment')),
  cardMinPct: nOrNull(pick(d, 'cardMinPct', 'card_min_pct')),
  cardMinAbs: nOrNull(pick(d, 'cardMinAbs', 'card_min_abs')),
  prepayFeePct: n(pick(d, 'prepayFeePct', 'prepay_fee_pct')),
  prepayMode: (pick(d, 'prepayMode', 'prepay_mode') || 'shorten_term') as PrepayMode,
  penaltyPct: n(pick(d, 'penaltyPct', 'penalty_pct')),
  dueDate: pick(d, 'dueDate', 'due_date') ? String(pick(d, 'dueDate', 'due_date')) : null,
  paymentDay: nOrNull(pick(d, 'paymentDay', 'payment_day')),
  priority: nOrNull(pick(d, 'priority', 'plan_priority', 'planPriority')),
  excluded: bool(pick(d, 'excluded', 'plan_excluded', 'planExcluded')),
  receivedAmount: nOrNull(pick(d, 'receivedAmount', 'received_amount')),
  sourceType: pick(d, 'sourceType', 'source_type') || null,
  status: pick(d, 'status') || null,
  kindInferred: bool(pick(d, 'kindInferred', 'kind_inferred')),
});

let incomeSeq = 0;
export const newIncomeKey = () => `inc_${Date.now()}_${++incomeSeq}`;

export const normalizeIncome = (i: any): PlanIncome => {
  const oneOff = ymOf(pick(i, 'oneOffYm', 'one_off_ym', 'oneOffDate', 'one_off_date'));
  const maskRaw = pick(i, 'monthsMask', 'months_mask');
  return {
    key: newIncomeKey(),
    id: nOrNull(pick(i, 'id')),
    title: String(pick(i, 'title', 'name', 'category_name') || ''),
    amount: n(pick(i, 'amount')),
    currency: String(pick(i, 'currency') || 'UZS'),
    monthsMask: oneOff ? 0 : maskRaw == null ? ALL_MONTHS_MASK : n(maskRaw),
    oneOffYm: oneOff,
    dayOfMonth: Math.min(31, Math.max(1, n(pick(i, 'dayOfMonth', 'day_of_month')) || 1)),
    reliability: nOrNull(pick(i, 'reliability')) ?? 1,
    reliabilityAuto: bool(pick(i, 'reliabilityAuto', 'reliability_auto')),
    scheduledIncomeId: nOrNull(pick(i, 'scheduledIncomeId', 'scheduled_income_id')),
  };
};

export const DEFAULT_SETTINGS: PlanSettings = {
  strategy: 'optimal',
  fixedExpense: 0,
  livingMedian: 0,
  livingMad: 0,
  historyMonths: 0,
  livingConfidence: 0.8,
  freeMoney: null,
  freeMoneyPct: 5,
  survivalPct: 70,
  bufferTarget: null,
  bufferCurrent: 0,
  devaluationPct: 8,
  inflationPct: 10,
  incomeGrowthPct: 0,
};

export const normalizeSettings = (p: any): PlanSettings => {
  const s = p?.settings && typeof p.settings === 'object' ? { ...p, ...p.settings } : p || {};
  const numOr = (v: any, d: number) => (nOrNull(v) == null ? d : n(v));
  return {
    strategy: (pick(s, 'strategy') || 'optimal') as Strategy,
    fixedExpense: numOr(pick(s, 'fixedExpense', 'fixed_expense'), 0),
    livingMedian: numOr(pick(s, 'livingMedian', 'living_median'), 0),
    livingMad: numOr(pick(s, 'livingMad', 'living_mad'), 0),
    historyMonths: numOr(pick(s, 'historyMonths', 'history_months'), 0),
    livingConfidence: numOr(pick(s, 'livingConfidence', 'living_confidence'), 0.8),
    freeMoney: nOrNull(pick(s, 'freeMoney', 'free_money')),
    freeMoneyPct: numOr(pick(s, 'freeMoneyPct', 'free_money_pct'), 5),
    survivalPct: numOr(pick(s, 'survivalPct', 'survival_pct'), 70),
    bufferTarget: nOrNull(pick(s, 'bufferTarget', 'buffer_target')),
    bufferCurrent: numOr(pick(s, 'bufferCurrent', 'buffer_current'), 0),
    devaluationPct: numOr(pick(s, 'devaluationPct', 'devaluation_pct'), 8),
    inflationPct: numOr(pick(s, 'inflationPct', 'inflation_pct'), 10),
    incomeGrowthPct: numOr(pick(s, 'incomeGrowthPct', 'income_growth_pct'), 0),
  };
};

const normalizeScenario = (s: any): PlanScenario | null => {
  if (!s || typeof s !== 'object') return null;
  return {
    months: nOrNull(s.months),
    finishYm: ymOf(s.finishYm ?? s.finish_ym),
    cost: n(s.cost),
    events: Array.isArray(s.events)
      ? s.events.map((e: any) => ({
          type: String(e?.type || ''),
          ym: ymOf(e?.ym) || '',
          debtId: keyOf(e?.debtId ?? e?.debt_id),
          amount: n(e?.amount),
        }))
      : [],
    closed: s.closed && typeof s.closed === 'object' ? s.closed : {},
  };
};

export const normalizeResult = (r: any, startYm?: any): PlanResult | null => {
  if (!r || typeof r !== 'object') return null;
  const sc = r.scenarios || {};
  const schedule: PlanMonth[] = Array.isArray(r.schedule)
    ? r.schedule.map((m: any) => ({
        ym: ymOf(m?.ym) || '',
        payments: Array.isArray(m?.payments)
          ? m.payments.map((p: any) => ({
              debtId: keyOf(p?.debtId ?? p?.debt_id) || '',
              amount: n(p?.amount),
              day: nOrNull(p?.day),
              type: String(p?.type || 'required'),
            }))
          : [],
        living: m?.living ? { L: n(m.living.L), F: n(m.living.F) } : null,
        buffer: n(m?.buffer),
        totalRemaining: n(m?.totalRemaining ?? m?.total_remaining),
        income: n(m?.income),
      }))
    : [];
  const cov = r.coverage || {};
  const verdict = ['ok', 'tight', 'infeasible'].includes(cov.verdict) ? cov.verdict : r.feasible === false ? 'infeasible' : 'ok';
  const compare: PlanResult['compare'] = {};
  STRATEGIES.forEach(k => {
    const c = r.compare?.[k];
    compare[k] = c ? { months: n(c.months), cost: n(c.cost) } : null;
  });
  return {
    feasible: r.feasible !== false,
    coverage: { q: nOrNull(cov.q), qWithSurvival: nOrNull(cov.qWithSurvival), verdict },
    living: r.living ? { L: n(r.living.L), F: n(r.living.F), M: n(r.living.M), bufferTarget: n(r.living.bufferTarget) } : null,
    order: Array.isArray(r.order)
      ? r.order.map((o: any) => ({
          debtId: keyOf(o?.debtId ?? o?.debt_id) || '',
          monthlyRate: n(o?.monthlyRate ?? o?.monthly_rate),
          reasonKey: String(o?.reasonKey || o?.reason_key || ''),
          reasonParams: o?.reasonParams && typeof o.reasonParams === 'object' ? o.reasonParams : {},
        }))
      : [],
    scenarios: {
      conservative: normalizeScenario(sc.conservative),
      base: normalizeScenario(sc.base),
      optimistic: normalizeScenario(sc.optimistic),
    },
    monteCarlo: r.monteCarlo
      ? { p10: n(r.monteCarlo.p10), p50: n(r.monteCarlo.p50), p90: n(r.monteCarlo.p90), pNewDebt: n(r.monteCarlo.pNewDebt) }
      : null,
    schedule,
    compare,
    totals: {
      totalDebt: n(r.totals?.totalDebt),
      monthlyRequired: n(r.totals?.monthlyRequired),
      interestAndFx: n(r.totals?.interestAndFx ?? sc.base?.cost),
    },
    startYm: ymOf(r.startYm) || ymOf(startYm) || schedule[0]?.ym || null,
  };
};

export const normalizeBundle = (raw: any): PlanBundle => {
  const d = raw || {};
  const result = normalizeResult(d.result, d.startYm);
  const fx = nOrNull(d.fx?.USD ?? d.fx?.usd ?? d.result?.fx?.USD ?? d.fxUsd ?? d.usdRate);
  return {
    setupDone: bool(d.setupDone ?? d.setup_done ?? d.plan?.setup_done ?? d.plan?.setupDone),
    settings: normalizeSettings(d.plan || d.settings || {}),
    debts: Array.isArray(d.debts) ? d.debts.map(normalizeDebt) : [],
    incomes: Array.isArray(d.incomes) ? d.incomes.map(normalizeIncome) : [],
    result,
    fxUsd: fx,
    status: d.plan?.status || null,
    resultError: d.resultError ? String(d.resultError?.message || d.resultError) : null,
  };
};

export const normalizeSuggestions = (raw: any): PlanSuggestions => {
  const d = raw || {};
  return {
    debts: Array.isArray(d.debts) ? d.debts.map(normalizeDebt) : [],
    incomes: Array.isArray(d.incomes) ? d.incomes.map(normalizeIncome) : [],
    // { fixedExpense: { total, items } } — oddiy son ham qabul qilinadi
    fixedExpense: nOrNull(
      d.fixedExpense && typeof d.fixedExpense === 'object' ? d.fixedExpense.total : pick(d, 'fixedExpense', 'fixed_expense'),
    ),
    // { living: { median, mad, historyMonths, estimated } } — estimated=true: tarix yo'q (taxmin)
    livingMedian: nOrNull(d.living?.median ?? pick(d, 'livingMedian', 'living_median')),
    livingMad: nOrNull(d.living?.mad ?? pick(d, 'livingMad', 'living_mad')),
    historyMonths: d.living?.estimated ? 0 : n(d.living?.historyMonths ?? pick(d, 'historyMonths', 'history_months')),
  };
};

/** GET /debt-plan/month → { ym, inPlan, payments:[{debtId,isNewDebt,title,currency,amount,amountOrig,day,type,paidThisMonth}], ... } */
const PAY_ORDER: Record<string, number> = { overdue: 0, required: 1, extra: 2, saving: 3 };

/**
 * `paidThisMonth` — shu oy shu qarzga haqiqatda to'langan SUMMA (qarz valyutasida), bayroq emas.
 * U qarzning qatorlariga tartib bilan (kechikkan → majburiy → qo'shimcha) taqsimlanadi; qator to'liq
 * qoplansa — `paid`. Jamg'arma ('saving') to'lov emas.
 */
const markPaid = (rows: MonthPayment[], paidRaw: Record<string, number>): MonthPayment[] => {
  const left: Record<string, number> = { ...paidRaw };
  const order = rows.map((r, i) => i).sort((a, b) => (PAY_ORDER[rows[a].type] ?? 9) - (PAY_ORDER[rows[b].type] ?? 9));
  const out = rows.map(r => ({ ...r }));
  for (const i of order) {
    const r = out[i];
    if (r.type === 'saving' || r.paid) continue;
    const need = r.amountOrig ?? r.amount;
    const have = left[r.debtId] || 0;
    const used = Math.min(have, need);
    left[r.debtId] = have - used;
    r.paid = need > 0 && used >= need * 0.99;
  }
  return out;
};

const normalizeMonth = (raw: any): MonthPayment[] => {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.payments) ? raw.payments : [];
  const paidRaw: Record<string, number> = {};
  const rows = list.map((p: any) => {
    const key = keyOf(p?.debtId ?? p?.debt_id) || '';
    const paidAmount = p?.paidThisMonth;
    if (typeof paidAmount === 'number' || (typeof paidAmount === 'string' && paidAmount !== '')) {
      paidRaw[key] = n(paidAmount);
    }
    return {
      debtId: key,
      amount: n(p?.amount),
      amountOrig: nOrNull(p?.amountOrig ?? p?.amount_orig),
      day: nOrNull(p?.day),
      type: String(p?.type || 'required'),
      title: String(p?.title || ''),
      currency: p?.currency || null,
      paid: bool(p?.paid),
      isNewDebt: bool(p?.isNewDebt) || isNewDebtKey(key),
    };
  });
  return markPaid(rows, paidRaw);
};

// ─────────── PUT tanasi ───────────
/** PUT /finance/debt-plan tanasi — snake_case (backend shartnomasi); daromadlar to'liq almashtiriladi. */
export const buildPlanBody = (st: PlanSettings, incomes: PlanIncome[], setupDone: boolean) => ({
  settings: {
    strategy: st.strategy,
    fixed_expense: st.fixedExpense,
    living_median: st.livingMedian,
    living_mad: st.livingMad,
    history_months: st.historyMonths,
    living_confidence: st.livingConfidence,
    free_money: st.freeMoney,
    free_money_pct: st.freeMoneyPct,
    survival_pct: st.survivalPct,
    buffer_target: st.bufferTarget,
    buffer_current: st.bufferCurrent,
    devaluation_pct: st.devaluationPct,
    inflation_pct: st.inflationPct,
    income_growth_pct: st.incomeGrowthPct,
  },
  incomes: incomes.map(i => ({
    title: i.title.trim(),
    amount: i.amount,
    currency: i.currency,
    // Bir martalikda backend niqobni sanadan oladi (validator: months_mask 1..4095 — 0 yuborilmaydi)
    months_mask: i.oneOffYm ? ALL_MONTHS_MASK : i.monthsMask,
    one_off_date: i.oneOffYm ? `${i.oneOffYm}-01` : null,
    day_of_month: i.dayOfMonth,
    reliability: i.reliability,
    // PUT daromadlarni TO'LIQ almashtiradi — avto-moslashuv belgisi yo'qolmasin
    reliability_auto: !!i.reliabilityAuto,
    scheduled_income_id: i.scheduledIncomeId ?? null,
  })),
  setup_done: setupDone,
});

/** PATCH /finance/debts/:id/plan tanasi (DB ustun nomlari, DESIGN §3). */
export const buildDebtPlanPatch = (d: PlanDebt) => ({
  debt_kind: d.kind,
  min_payment: d.minPayment,
  term_months: d.termMonths,
  card_min_pct: d.cardMinPct,
  card_min_abs: d.cardMinAbs,
  prepay_fee_pct: d.prepayFeePct || 0,
  prepay_mode: d.prepayMode,
  penalty_pct: d.penaltyPct || 0,
  payment_day: d.paymentDay,
  plan_priority: d.priority,
  plan_excluded: d.excluded,
  received_amount: d.receivedAmount,
  interest_rate: d.apr,
});

// ─────────── API ───────────
export const debtPlanApi = {
  get: async (): Promise<PlanBundle> =>
    normalizeBundle(unwrap(await axios.get(`${base}/debt-plan`, auth()))),
  suggestions: async (): Promise<PlanSuggestions> =>
    normalizeSuggestions(unwrap(await axios.get(`${base}/debt-plan/suggestions`, auth()))),
  save: (body: ReturnType<typeof buildPlanBody>) => axios.put(`${base}/debt-plan`, body, auth()),
  simulate: async (body: {
    strategy?: Strategy;
    whatIf?: { extraMonthly?: number; oneOff?: { ym: string; amount: number } | null };
  }): Promise<PlanResult | null> => {
    const data = unwrap(await axios.post(`${base}/debt-plan/simulate`, body, auth()));
    return normalizeResult(data?.result ?? data, data?.startYm);
  },
  month: async (ym: string): Promise<MonthPayment[]> =>
    normalizeMonth(unwrap(await axios.get(`${base}/debt-plan/month`, { ...auth(), params: { ym } }))),
  dailyLimit: async (): Promise<DailyLimit | null> => {
    const d = unwrap(await axios.get(`${base}/debt-plan/daily-limit`, auth()));
    if (!d || typeof d !== 'object') return null;
    return {
      amount: n(d.amount),
      until: d.until ? String(d.until) : null,
      // explanation obyekt bo'lishi mumkin — faqat matnli qismini ko'rsatamiz.
      explanation:
        typeof d.explanation === 'string'
          ? d.explanation
          : typeof d.explanation?.text === 'string'
            ? d.explanation.text
            : null,
    };
  },
  patchDebt: (id: number, d: PlanDebt) =>
    axios.patch(`${base}/debts/${id}/plan`, buildDebtPlanPatch(d), auth()),
  getDebt: async (id: number): Promise<any> => unwrap(await axios.get(`${base}/debts/${id}`, auth())),
  pay: (id: number, body: { amount: number; payment_date: string; notes?: string }) =>
    axios.post(`${base}/debts/${id}/payments`, { ...body, create_expense: true }, auth()),
  // Bildirishnoma (type 47) — to'lov kuni eslatmasi: tafsilot va "To'ladim" (409 — allaqachon to'langan).
  reminder: async (id: number | string): Promise<any> =>
    unwrap(await axios.get(`${base}/debt-plan/reminders/${id}`, auth())),
  payReminder: (id: number | string) => axios.post(`${base}/debt-plan/reminders/${id}/pay`, {}, auth()),
};

/** Server xato matni (yo'q bo'lsa null). */
export const apiErrorText = (e: any): string | null => {
  const m = e?.response?.data?.message;
  return m ? String(m) : null;
};

// ─────────── Hisob yordamchilari (faqat ko'rsatish) ───────────

/** 'YYYY-MM' + k oy. */
export const addMonths = (ym: string, k: number): string => {
  const m = String(ym).match(/^(\d{4})-(\d{2})/);
  if (!m) return ym;
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) + k;
  const y = Math.floor(total / 12);
  const mo = (total % 12) + 1;
  return `${y}-${String(mo).padStart(2, '0')}`;
};

export const currentYm = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Monte-Karlo foizli oy soni → sana (asosiy stsenariy tugash oyiga nisbatan). */
export const mcYm = (base: PlanScenario | null, months: number | null | undefined): string | null => {
  if (!base?.finishYm || !months || base.months == null) return null;
  return addMonths(base.finishYm, months - base.months);
};

/** Qarzni UZS ga (ko'rsatish uchun). Kurs noma'lum bo'lsa null. */
export const toUzs = (amount: number, currency: string, fxUsd: number | null): number | null => {
  if (String(currency).toUpperCase() !== 'USD') return amount;
  return fxUsd ? amount * fxUsd : null;
};

/** Umumiy progress (%): to'langan / boshlang'ich, UZS bo'yicha. */
export const progressPct = (debts: PlanDebt[], fxUsd: number | null): number | null => {
  let start = 0;
  let left = 0;
  for (const d of debts) {
    if (d.excluded) continue;
    const a = toUzs(Math.max(d.amount, d.balance), d.currency, fxUsd);
    const b = toUzs(d.balance, d.currency, fxUsd);
    if (a == null || b == null) continue;
    start += a;
    left += b;
  }
  if (start <= 0) return null;
  return Math.max(0, Math.min(100, Math.round(((start - left) / start) * 100)));
};

/**
 * F4 — haqiqiy oylik stavka (Nyuton): g(r) = A·(1−(1+r)^−n)/r − P0 = 0.
 * Faqat forma ichida darhol ko'rsatish uchun; null — hisoblab bo'lmasa.
 * Qaytaradi: yillik % (r·12·100).
 */
export const realAnnualRate = (A: number, nMonths: number, P0: number): number | null => {
  if (!(A > 0) || !(nMonths > 0) || !(P0 > 0)) return null;
  if (A * nMonths <= P0) return 0;
  let r = (2 * (nMonths * A - P0)) / (nMonths * P0);
  for (let i = 0; i < 50; i++) {
    const q = Math.pow(1 + r, -nMonths);
    const g = (A * (1 - q)) / r - P0;
    const dg = (A * (nMonths * Math.pow(1 + r, -nMonths - 1) * r - (1 - q))) / (r * r);
    if (!Number.isFinite(dg) || dg === 0) return null;
    const next = r - g / dg;
    if (!Number.isFinite(next) || next <= 0) return null;
    if (Math.abs(next - r) < 1e-10) {
      r = next;
      break;
    }
    r = next;
  }
  return r * 12 * 100;
};

/** Annuitet A ≤ P·r — to'lov foizni ham qoplamaydi (kiritish xatosi). */
export const paymentBelowInterest = (d: PlanDebt): boolean => {
  if (d.kind !== 'annuity' && d.kind !== 'differentiated') return false;
  if (!(d.minPayment && d.minPayment > 0) || !(d.apr && d.apr > 0)) return false;
  return d.minPayment <= (d.balance * d.apr) / 1200;
};

/** Oylar maskasi uchun bit (0 = yanvar). */
export const maskHas = (mask: number, monthIdx: number) => (mask & (1 << monthIdx)) !== 0;
export const maskToggle = (mask: number, monthIdx: number) => mask ^ (1 << monthIdx);
