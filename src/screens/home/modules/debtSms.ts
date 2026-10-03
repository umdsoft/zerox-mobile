/**
 * debtSms.ts — 03.10: Shaxsiy qarz SMS yordamchilari (FinanceDebtDetail / FinanceDebtGroup /
 * FinanceDebtActionModal).
 *
 *   • joinAmounts      — bir nechta valyuta qoldig'i bitta matnda: "754 000 UZS va 480 000 USD"
 *                        (tayyor SMS shablonlari faqat UZS ni aytardi — 6-rasm);
 *   • stripWaiverNote  — voz kechishda backend izohga QO'SHADIGAN avtomatik matn
 *                        ("Kechirilgan (voz kechildi)" / "Kechirilgan (qarz beruvchi tomonidan)")
 *                        olib tashlanadi — tarixda "Voz kechildi" bor (8-rasm); haqiqiy izoh qoladi;
 *   • smsOutcome       — to'lov javobidagi `sms` natijasi (yuborildi / tarif / yuborilmadi);
 *   • payDebtsWithSms  — "SMS yuborish" yoqilganda yopish/qaytarish (10-rasm).
 *
 * ⚠️ Backend: `notify_sms` ni faqat `POST /debts/:id/payments` qo'llaydi (auto_sms_reminder).
 * `allocate-payment` va `mirror-payment` SMS yubormaydi — shu sabab SMS yoqilganda har qarz
 * ALOHIDA to'lanadi (taqsimot muddati yaqin qarzdan, debtAllocation). Ko'zguga ham `notify_sms`
 * beriladi (backend qo'llab-quvvatlagach ishlaydi); javobda `sms` yo'q bo'lsa — "yuborilmadi".
 */
import { allocatePayment, groupByCurrency } from './debtAllocation';
import { financeApi } from './financeApi';
import { fMoney, localDateKey, num } from './financeMoney';
import { PLAN_PAID_ONLY_TEXT, smsPlanNotice } from './planGate';

const CUR_RANK: Record<string, number> = { UZS: 0, USD: 1 };

/** Valyutalar bo'yicha summalar → "A", "A va B", "A, B va C" (UZS, USD, so'ng qolganlari). */
export const joinAmounts = (rows: { amount: number; currency: string }[]): string => {
  const parts = rows
    .filter(r => num(r.amount) > 0)
    .sort((a, b) => (CUR_RANK[a.currency] ?? 2) - (CUR_RANK[b.currency] ?? 2))
    .map(r => fMoney(r.amount, r.currency));
  if (parts.length <= 1) return parts[0] || '';
  return `${parts.slice(0, -1).join(', ')} va ${parts[parts.length - 1]}`;
};

// Backend `forgive` / `mirrorForgive` qo'shadigan avtomatik qism (+ eski / tarjima variantlari).
const WAIVER_SEGMENT_RE =
  /^(kechirilgan|кечирилган|прощен[оа]?|прощён|списан[оа]?|forgiven|waived|written off)(\s*\(.*\))?\.?$|^\(?(voz kechildi|воз кечилди|qarz beruvchi tomonidan)\)?\.?$/i;

/** Izohdan voz kechish avtomatik matnini olib tashlaydi; faqat foydalanuvchi izohi qoladi. */
export const stripWaiverNote = (notes: unknown): string =>
  String(notes ?? '')
    .split('|')
    .map(s => s.trim())
    .filter(s => s && !WAIVER_SEGMENT_RE.test(s))
    .join(' | ');

export type SmsOutcome = 'sent' | 'plan' | 'missed' | null;

/** SMS so'ralgan bo'lsa — javob bo'yicha natija; so'ralmagan bo'lsa `null`. */
export const smsOutcome = (resData: any, requested: boolean): SmsOutcome => {
  if (!requested) return null;
  const sms = resData?.sms;
  if (sms?.sent === true) return 'sent';
  if (sms?.reason === 'PLAN_REQUIRED') return 'plan';
  return 'missed';
};

export type SmsPayResult = { allClosed: boolean; outcomes: SmsOutcome[]; resData: any[] };

/** Xato + nechta to'lov bajarilgani (qisman muvaffaqiyatda ro'yxat yangilanishi uchun). */
export class SmsPayError extends Error {
  done: number;
  cause: unknown;
  constructor(cause: unknown, done: number) {
    super('sms-pay-failed');
    this.cause = cause;
    this.done = done;
  }
}

/**
 * Tanlangan qarzlarni SMS bilan yopish/qaytarish: valyuta bo'yicha, har qarz alohida.
 * `amounts[cur]` null — shu valyutadagi butun qoldiq. SMS faqat telefoni bor qarzga so'raladi.
 */
export const payDebtsWithSms = async (
  debts: any[],
  amounts: Record<string, number | null>,
): Promise<SmsPayResult> => {
  const today = localDateKey(new Date());
  const outcomes: SmsOutcome[] = [];
  const resData: any[] = [];
  let allClosed = true;
  let done = 0;
  try {
    for (const g of groupByCurrency(debts)) {
      const want = num(amounts[g.currency]) > 0 ? num(amounts[g.currency]) : null;
      for (const a of allocatePayment(g.debts, want).allocations) {
        if (!a.closes) allClosed = false;
        if (!(a.pay > 0)) continue;
        const d = a.debt;
        const notify = !!d?.phone;
        const res = d?.is_mirror
          ? await financeApi.mirrorPayDebt(d.id, { amount: a.pay, payment_date: today, notify_sms: notify })
          : await financeApi.addDebtPayment(d.id, { amount: a.pay, payment_date: today, notify_sms: notify });
        if (!res?.data?.success) throw new Error('payment failed');
        done += 1;
        resData.push(res.data);
        outcomes.push(smsOutcome(res.data, notify));
      }
    }
  } catch (e) {
    throw new SmsPayError(e, done);
  }
  return { allClosed, outcomes, resData };
};

/**
 * To'lovdan keyingi SMS izohi (toast `desc`): tarif sababli — tarif matni; boshqa sabab — "SMS
 * yuborilmadi"; hammasi ketgan bo'lsa — "SMS yuborildi". SMS so'ralmagan bo'lsa `null`.
 */
export const smsNoticeText = (outcomes: SmsOutcome[], resData: any[], t: (k: string) => string): string | null => {
  const asked = outcomes.filter(Boolean);
  if (!asked.length) return null;
  const planIdx = outcomes.indexOf('plan');
  if (planIdx >= 0) return smsPlanNotice(resData[planIdx], t) || t(PLAN_PAID_ONLY_TEXT);
  if (asked.includes('missed')) return t('To‘lov saqlandi, lekin SMS yuborilmadi.');
  return t('SMS yuborildi');
};
