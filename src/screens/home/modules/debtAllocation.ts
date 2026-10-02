/**
 * debtAllocation.ts — bir nechta shaxsiy qarzga BITTA summani taqsimlash.
 *
 * 02.10: sayt `frontend/utils/debtAllocation.js` va backend
 * `services/personalDebtAllocation.service.js` bilan AYNAN bir xil qoida:
 *  - tartib: muddati yaqin → uzoq (muddatsizlar oxirida), so'ng qarz sanasi, so'ng id;
 *  - summa jami qoldiqdan oshmaydi; null — hammasi to'liq yopiladi;
 *  - hisob tiyinlarda (kasr xatoliklari yo'q). Valyuta tekshiruvi chaqiruvchida.
 * Ishlatilishi: qarz tanlash oynasidagi oldindan ko'rish (preview) va backend
 * `allocate-payment` marshruti yo'q bo'lsa (404) ketma-ket zaxira to'lovlar.
 */
import { num } from './financeMoney';

export type Allocation = {
  debt: any;
  pay: number;
  remainingAfter: number;
  closes: boolean;
};

export type AllocationResult = {
  total: number;
  paid: number;
  over: boolean;
  allocations: Allocation[];
};

const toCents = (v: any): number => Math.round(num(v) * 100);
const fromCents = (c: number): number => Math.round(c) / 100;

const dateRank = (v: any): number => {
  if (v == null || v === '') return Number.POSITIVE_INFINITY;
  const t = new Date(String(v).replace(' ', 'T')).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
};

/** Muddati yaqin → uzoq; muddatsizlar oxirida; teng bo'lsa eski qarz va kichik id oldin. */
export const compareByDue = (a: any, b: any): number => {
  const byDue = dateRank(a?.due_date) - dateRank(b?.due_date);
  if (byDue) return byDue;
  const byStart = dateRank(a?.start_date || a?.created_at) - dateRank(b?.start_date || b?.created_at);
  if (byStart) return byStart;
  return num(a?.id) - num(b?.id);
};

/** `amount` null — tanlangan qarzlar to'liq yopiladi. */
export const allocatePayment = (debts: any[], amount: number | null): AllocationResult => {
  const sorted = [...(debts || [])].sort(compareByDue);
  const totalC = sorted.reduce((s, d) => s + Math.max(0, toCents(d?.remaining_amount)), 0);
  const wantC = amount == null ? totalC : Math.max(0, toCents(amount));
  if (wantC > totalC) {
    return { total: fromCents(totalC), paid: fromCents(wantC), over: true, allocations: [] };
  }
  let leftC = wantC;
  const allocations = sorted.map(d => {
    const remC = Math.max(0, toCents(d?.remaining_amount));
    const payC = Math.min(remC, leftC);
    leftC -= payC;
    return {
      debt: d,
      pay: fromCents(payC),
      remainingAfter: fromCents(remC - payC),
      closes: payC > 0 && remC - payC <= 0,
    };
  });
  return { total: fromCents(totalC), paid: fromCents(wantC), over: false, allocations };
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
