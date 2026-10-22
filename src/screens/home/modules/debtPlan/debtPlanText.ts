/**
 * debtPlanText.ts — "Qarzdan chiqish" matnlari: sana (YYYY-MM → "2027-yil sentabr"),
 * qarz turi / usul / stsenariy nomlari, navbat sababi (order[].reasonKey) va
 * hodisa (events[]) tushuntirishlari. Kalitlar — o'zbekcha satrlar (i18n/new/*.json).
 */
import i18next, { t } from 'i18next';
import { fmtAmountByCurrency } from '../../../../helper/money';
import { fCompact, fDate } from '../financeMoney';
import { isNewDebtKey } from './debtPlanApi';
import type { DebtKey, DebtKind, PlanDebt, PlanEvent, PlanOrder, ScenarioKey, Strategy } from './debtPlanApi';

export const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const lang = () => String(i18next.language || 'uz');

/** 'YYYY-MM' → "2027-yil sentabr" / "сентябрь 2027" / "September 2027". */
export const fmtYm = (ym?: string | null): string => {
  const m = String(ym || '').match(/^(\d{4})-(\d{2})/);
  if (!m) return '—';
  const name = t(MONTHS_UZ[Number(m[2]) - 1] || '');
  const month = lang() === 'en' ? name : name.toLowerCase();
  return t('{{year}}-yil {{month}}', { year: m[1], month });
};

/** Qisqa oy: "sen 27" (grafik o'qi). */
export const fmtYmShort = (ym?: string | null): string => {
  const m = String(ym || '').match(/^(\d{4})-(\d{2})/);
  if (!m) return '';
  const name = t(MONTHS_UZ[Number(m[2]) - 1] || '');
  return `${name.slice(0, 3).toLowerCase()} ${m[1].slice(2)}`;
};

/** Limit sanasi ('YYYY-MM-DD' yoki ISO) → DD.MM.YYYY. */
export const fDateLimit = (s: string): string => fDate(s);

/** Reja kalitidan qarz nomi; sintetik "new_debt_N" — yetishmovchilik uchun yangi qarz. */
export const debtTitleOf = (key: DebtKey | null | undefined, byKey: Record<string, PlanDebt>, fallback = ''): string => {
  if (key == null || key === '') return fallback;
  if (isNewDebtKey(key)) return t('Yangi qarz (yetishmovchilik)');
  return byKey[key]?.title || fallback;
};

/** Qarzlar xaritasi kaliti — String(id). */
export const debtsByKey = (debts: PlanDebt[]): Record<string, PlanDebt> => {
  const m: Record<string, PlanDebt> = {};
  debts.forEach(d => (m[String(d.id)] = d));
  return m;
};

export const fmtMonths = (k: number): string => t('{{n}} oy', { n: k });

/** To'liq so'm summasi: "1 372 212 so‘m". */
export const fUzs = (v: number): string => `${fmtAmountByCurrency(Math.round(v), 'UZS')} ${t('so‘m')}`;
/** Kompakt: "8,2 M UZS". */
export const fUzsShort = (v: number): string => fCompact(v, 'UZS');

/** Foiz (vergul bilan): 3.75 → "3,75". */
export const fPct = (v: number, digits = 1): string => {
  const s = Number(v.toFixed(digits)).toString();
  return lang() === 'en' ? s : s.replace('.', ',');
};

// ─────────── Qarz turi ───────────
export const KIND_META: Record<DebtKind, { label: string; hint: string }> = {
  annuity: {
    label: 'Bank krediti (annuitet)',
    hint: 'Har oy teng to‘lov. Ortiqcha to‘lov muddatni qisqartiradi yoki to‘lovni kamaytiradi.',
  },
  differentiated: {
    label: 'Bank krediti (differensial)',
    hint: 'Asosiy qarzning teng qismi + qoldiq foizi. To‘lov har oy kamayib boradi.',
  },
  card: {
    label: 'Kredit karta',
    hint: 'Minimal to‘lov — qoldiqning foizi yoki eng kam summa. Foizi odatda eng yuqori.',
  },
  installment: {
    label: 'Muddatli to‘lov (0%)',
    hint: 'Qoldiq ÷ oylar, qat’iy. Foiz yo‘q — oldindan to‘lash foyda bermaydi.',
  },
  dated: {
    label: 'Sanasi bor qarz',
    hint: 'Sanagacha to‘lov yo‘q, sanada butun summa. Reja sanagacha teng ulushlarda jamg‘aradi.',
  },
  open: {
    label: 'Muddatsiz qarz',
    hint: 'Foizsiz va muddatsiz (do‘st, qarindosh). Narxi 0 — navbat oxirida, qo‘lda oldinga surish mumkin.',
  },
};
export const kindLabel = (k?: DebtKind | null): string => (k && KIND_META[k] ? t(KIND_META[k].label) : t('Turi tanlanmagan'));

// ─────────── Usul / stsenariy ───────────
export const STRATEGY_META: Record<Strategy, { label: string; hint: string }> = {
  optimal: {
    label: 'Algoritm (optimal)',
    hint: 'Har ortiqcha so‘m samarali stavkasi eng yuqori qarzga. Muddat ham, jami narx ham eng kichik.',
  },
  snowball: {
    label: 'Qor ko‘chkisi',
    hint: 'Eng kichik qoldiq birinchi. Tez “g‘alaba” beradi, lekin odatda qimmatroq.',
  },
  manual: {
    label: 'O‘zim tanlayman',
    hint: 'Navbatni o‘zingiz belgilaysiz (qarz tafsilotida “Navbat”).',
  },
};
export const strategyLabel = (s: Strategy): string => t(STRATEGY_META[s]?.label || s);

export const SCENARIO_META: Record<ScenarioKey, { label: string; hint: string }> = {
  conservative: { label: 'Ehtiyotkor', hint: 'Faqat kafolatlangan daromad' },
  base: { label: 'Asosiy', hint: 'Har daromad × ishonchliligi' },
  optimistic: { label: 'Optimistik', hint: 'Hamma kutilgan daromad to‘liq' },
};

// ─────────── Ishonchlilik ───────────
export const RELIABILITY = [
  { value: 1, label: 'Kafolatlangan', hint: 'Maosh, pensiya — har doim keladi' },
  { value: 0.8, label: 'Odatda keladi', hint: 'Bonus, doimiy mijoz' },
  { value: 0.5, label: 'Ehtimoliy', hint: 'Frilans, sotuv — kelmasligi mumkin' },
];
export const reliabilityLabel = (v: number): string => {
  const best = RELIABILITY.reduce((a, b) => (Math.abs(b.value - v) < Math.abs(a.value - v) ? b : a));
  return t(best.label);
};

// ─────────── Navbat sababi ───────────
type ReasonId =
  | 'overdue'
  | 'usd'
  | 'dated'
  | 'installment'
  | 'manual'
  | 'snowball'
  | 'open'
  | 'zero_small'
  | 'prepay'
  | 'excluded'
  | 'rate';

const REASON_TEXT: Record<ReasonId, string> = {
  overdue: 'Muddati o‘tgan to‘lov — navbatsiz birinchi to‘lanadi',
  usd: 'USD qarz: so‘m qadrsizlanishi bilan samarali stavka yillik {{rateYear}}%',
  dated: 'Sanasi bor qarz: {{date}} gacha teng ulushlarda jamg‘ariladi',
  installment: 'Foizsiz muddatli to‘lov: faqat majburiy to‘lov, ortiqcha berish foyda bermaydi',
  manual: 'Siz tanlagan tartib: {{priority}}-o‘rin',
  snowball: 'Qor ko‘chkisi: qoldig‘i eng kichik qarz birinchi',
  open: 'Muddatsiz foizsiz qarz: narxi 0, shuning uchun navbat oxirida',
  zero_small: 'Foizsiz qarz: qoldig‘i kichik — tez yopilib, to‘lovni bo‘shatadi',
  prepay: 'Muddatidan oldin to‘lash jarimasi hisobga olingan: samarali stavka yillik {{rateYear}}%',
  excluded: 'Rejadan chiqarilgan',
  rate: 'Samarali stavka yillik {{rateYear}}% (oyiga {{rateMonth}}%) — eng qimmatlaridan',
};

/** reasonKey har xil yozilishi mumkin (high_rate, highestRate, reason.dated...) — mazmuni bo'yicha. */
const reasonId = (key: string, rate: number): ReasonId => {
  const k = String(key || '').toLowerCase();
  if (k.includes('overdue') || k.includes('late')) return 'overdue';
  if (k.includes('exclu')) return 'excluded';
  if (k.includes('manual') || k.includes('priority')) return 'manual';
  if (k.includes('snow') || k.includes('smallest')) return 'snowball';
  if (k.includes('usd') || k.includes('fx') || k.includes('deval')) return 'usd';
  if (k.includes('dated') || k.includes('due')) return 'dated';
  if (k.includes('install')) return 'installment';
  if (k.includes('prepay') || k.includes('fee')) return 'prepay';
  if (k.includes('open') || k.includes('last')) return 'open';
  if (k.includes('zero') || k.includes('small') || k.includes('free')) return 'zero_small';
  if (k.includes('rate') || k.includes('high') || k.includes('card') || k.includes('cost')) return 'rate';
  return rate > 0 ? 'rate' : 'open';
};

/** Oylik stavka ulushi (0.0375) → foiz; agar server foizda yuborsa (3.75) ham to'g'ri. */
export const monthlyPct = (r: number): number => (r > 1 ? r : r * 100);
/** Oylik samarali stavka → yillik (murakkab): (1+r)^12 − 1. */
export const yearlyPct = (r: number): number => {
  const m = monthlyPct(r) / 100;
  return (Math.pow(1 + m, 12) - 1) * 100;
};

export const reasonText = (o: PlanOrder, rank: number): string => {
  const id = reasonId(o.reasonKey, o.monthlyRate);
  const p = o.reasonParams || {};
  const dateRaw = p.date || p.dueDate || p.ym || '';
  const date = /^\d{4}-\d{2}/.test(String(dateRaw)) ? fmtYm(String(dateRaw)) : String(dateRaw || '—');
  return t(REASON_TEXT[id], {
    ...p,
    rateYear: fPct(yearlyPct(o.monthlyRate)),
    rateMonth: fPct(monthlyPct(o.monthlyRate), 2),
    date,
    priority: p.priority ?? rank,
  });
};

// ─────────── Hodisalar ───────────
export const eventText = (e: PlanEvent, debtTitle: string): string => {
  const params = { date: fmtYm(e.ym), debt: debtTitle || '—', amount: fUzs(e.amount) };
  if (e.type === 'shortfall') return t('{{date}}: “{{debt}}” uchun {{amount}} yetmaydi', params);
  if (e.type === 'survival_cut') return t('{{date}}: yashash puli {{amount}} ga qisqaradi', params);
  if (e.type === 'late') return t('{{date}}: “{{debt}}” to‘lovi kechikadi ({{amount}})', params);
  return t('{{date}}: {{amount}}', params);
};

// ─────────── To'lov turi ───────────
export const PAYMENT_TYPE: Record<string, { label: string; color: string; bg: string }> = {
  required: { label: 'Majburiy', color: '#2f6fed', bg: '#e7effd' },
  extra: { label: 'Qo‘shimcha', color: '#16a34a', bg: '#e7f7ef' },
  saving: { label: 'Jamg‘arma', color: '#7c3aed', bg: '#f4efff' },
  overdue: { label: 'Kechikkan', color: '#e5484d', bg: '#fdecec' },
};
export const paymentTypeMeta = (type: string) => PAYMENT_TYPE[type] || PAYMENT_TYPE.required;
