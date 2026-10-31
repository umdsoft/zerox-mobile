/** To'lov (Click / Payme) summasi va havolalari — sof funksiyalar (testlanadi). */

export const MIN_PAY_AMOUNT = 1000; // UZS — joriy biznes minimum (toast '828')
export const MAX_PAY_AMOUNT = 100_000_000; // UZS — aqlli yuqori chegara

export type PayAmountResult =
  | {ok: true; amount: number}
  | {ok: false; reason: 'invalid' | 'min' | 'max'};

/** Faqat raqamlar (probel/boshqa belgilar tashlanadi). */
export const digitsOnly = (v: unknown): string => String(v ?? '').replace(/\D/g, '');

export const validatePayAmount = (raw: unknown): PayAmountResult => {
  const s = String(raw ?? '').replace(/\s/g, '');
  if (!/^\d+$/.test(s)) return {ok: false, reason: 'invalid'};
  const n = Number(s);
  if (!Number.isSafeInteger(n)) return {ok: false, reason: 'invalid'};
  if (n < MIN_PAY_AMOUNT) return {ok: false, reason: 'min'};
  if (n > MAX_PAY_AMOUNT) return {ok: false, reason: 'max'};
  return {ok: true, amount: n};
};

export const CLICK_RETURN_URL = 'zeroxuz://UserMoneyResult';
// Payme brauzerdan ilovaga qaytarish sahifasi (u zeroxuz://UserMoneyResult ga yo'naltiradi).
export const PAYME_RETURN_URL = 'https://zerox.uz/payme-return.html';

export const buildClickUrl = (amount: number, uid: string | number): string =>
  `https://my.click.uz/services/pay?service_id=24899&merchant_id=17375` +
  `&amount=${encodeURIComponent(String(amount))}` +
  `&transaction_param=${encodeURIComponent(String(uid))}` +
  `&return_url=${encodeURIComponent(CLICK_RETURN_URL)}`;

export const buildPaymeUrl = (
  amount: number,
  uid: string | number,
  encode: (s: string) => string,
): string => {
  const params: Array<[string, string | number]> = [
    ['m', '62fa657ea12ad7a48f4b2dd9'],
    ['ac.user_id', String(uid)],
    ['a', amount * 100], // tiyin
    ['c', PAYME_RETURN_URL],
    ['ct', 200],
    ['l', 'uz'],
  ];
  return `https://checkout.paycom.uz/${encode(
    params.map(([k, v]) => `${k}=${v}`).join(';'),
  )}`;
};

/** Balans kiritilgan summadan KAM bo'lmagan miqdorda oshdimi. */
export const isPaymentCredited = (
  baseline: unknown,
  current: unknown,
  amount: number,
): boolean => {
  const b = Number(baseline);
  const c = Number(current);
  if (!Number.isFinite(b) || !Number.isFinite(c) || !(amount > 0)) return false;
  return c - b >= amount;
};
