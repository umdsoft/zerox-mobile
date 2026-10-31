/**
 * money.ts — pul summalarini IXCHAM yozish uchun yagona manba.
 *
 * Nega kerak: summalar kartochkalarda ko'rsatiladi, kartochka eni esa chekli.
 * "96 700 000 so'm" ikki qatorga sinib ketardi yoki qirqilardi. Ixcham yozuv
 * ("96,7 mln so'm") bir qatorga sig'adi va tezroq o'qiladi.
 *
 * O'NLIK AJRATGICH — VERGUL (o'zbek tilidagi yozuv me'yori: 10,5 mln).
 * Ilgari kod bo'ylab uch xil formatlagich bor edi va ular nuqta ishlatardi
 * (`toMln`, `shortAmt`, QarzShartnomasi ichidagi lokal variant) — natijada
 * bir ekranda "1.0 mln", boshqasida "1 mln" chiqishi mumkin edi.
 *
 * Million/milliarddan KICHIK summalar aynan o'zicha qoladi (mingliklar
 * bo'shliq bilan): u yerda aniq raqam ixchamlikdan muhimroq.
 *
 * VALYUTA BIRLIGI ("so'm") tilga qarab o'zgaradi: i18n.t('so‘m') — ingliz/
 * qoraqalpoq tilida mos birlik chiqadi (uz — kalitning o'zi = "so‘m").
 * Chaqiruvchi ekranlar useTranslation orqali til o'zgarsa qayta render bo'ladi,
 * shuning uchun birlik ham darhol yangilanadi. (mln/mlrd — xalqaro qisqartma,
 * o'zgartirilmaydi.)
 */
import i18n from '../i18n';

/** Mingliklarni bo'shliq bilan ajratadi: 550000 -> "550 000". */
export const groupDigits = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/**
 * Ixcham summa (birliksiz raqam qismi):
 *   1 234        -> "1 234"
 *   10 500 000   -> "10,5 mln"
 *   1 200 000 000-> "1,2 mlrd"
 *
 * Butun qiymatlarda ",0" yozilmaydi: 1 000 000 -> "1 mln" ("1,0 mln" emas).
 */
export const compactMoney = (value: number | string | null | undefined) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const unit = (v: number, suffix: string) =>
    `${v.toFixed(1).replace(/\.0$/, '').replace('.', ',')} ${suffix}`;

  if (abs >= 1e9) return unit(n / 1e9, 'mlrd');
  if (abs >= 1e6) return unit(n / 1e6, 'mln');
  return groupDigits(n);
};

/** Ixcham summa + valyuta belgisi: "10,5 mln so'm" (til bo'yicha birlik). */
export const compactUzs = (value: number | string | null | undefined) =>
  `${compactMoney(value)} ${i18n.t('so‘m')}`;

/** Ixcham summa + dollar: "1,2 mln $". */
export const compactUsd = (value: number | string | null | undefined) =>
  `${compactMoney(value)} $`;

/**
 * K/M/B qisqartma (so'rov bo'yicha — "mln/mlrd" o'rniga xalqaro K/M/B):
 *   622 132       -> "622,1 K"
 *   1 700 000     -> "1,7 M"
 *   1 050 000     -> "1,05 M"
 *   1 250 000 000 -> "1,25 B"
 *   0 / 999       -> "0" / "999" (mingdan kichik — aynan o'zicha)
 * Ortiqcha nollar tushiriladi (1,70 -> 1,7; 1,00 -> 1). O'nlik = VERGUL.
 */
export const compactKMB = (value: number | string | null | undefined) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const fmt = (v: number, dec: number) =>
    v.toFixed(dec).replace(/\.?0+$/, '').replace('.', ',');
  if (abs >= 1e9) return `${fmt(n / 1e9, 2)} B`;
  if (abs >= 1e6) return `${fmt(n / 1e6, 2)} M`;
  if (abs >= 1e3) return `${fmt(n / 1e3, 1)} K`;
  // Mingdan kichik — aynan o'zicha; USD tsentlari YO'QOLMASIN (655,77 USD).
  return groupMoney(n);
};

/** K/M/B + "UZS": "1,7 M UZS", "0 UZS". */
export const fmtUZS = (value: number | string | null | undefined) =>
  `${compactKMB(value)} UZS`;

/** K/M/B + "USD": "500 USD", "0 USD". */
export const fmtUSD = (value: number | string | null | undefined) =>
  `${compactKMB(value)} USD`;

/**
 * FAQAT MILLIARD qisqartmasi (2026-09-14, SS6 so'rovi):
 *   999 999 999   -> "999 999 999"   (milliarddan past — AYNAN o'zicha)
 *   1 008 450 000 -> "1,01 B"
 *   1 080 000 000 -> "1,08 B"
 *
 * Nega alohida formatlagich: `compactKMB` mln/mingni ham qisqartiradi
 * ("4,56 M"), bu yerda esa aniq raqam muhim — faqat milliardga yetganda
 * card'ga sig'masligi sababli qisqartiriladi. Ortiqcha nollar tushiriladi
 * (1,10 -> 1,1; 2,00 -> 2). O'nlik ajratgich — VERGUL.
 */
export const billionOrExact = (value: number | string | null | undefined) => {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1e9) {
    return `${(n / 1e9).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')} B`;
  }
  return groupDigits(n);
};

/* ────────────────────────────────────────────────────────────────────────────
 * VALYUTAGA MOS SUMMA KIRITISH (2026-10-18, egasi hujjati: USD tsentlar).
 *
 * Muammo: barcha summa maydonlari `replace(/[^0-9]/g, '')` qilardi — "65,75"
 * yozilsa vergul tashlanib "6 575" bo'lardi. Endi USD da bitta o'nlik ajratgich
 * (',' yoki '.' — ikkalasi ham qabul) va ko'pi bilan 2 ta kasr raqam ruxsat
 * etiladi. UZS — avvalgidek faqat butun son.
 *
 * Holat (state) KANONIK xom satrda saqlanadi: raqamlar + ixtiyoriy '.' + ≤2
 * raqam ("1234.5", "0.", "15.84"). Ekranda `formatAmountInput` bilan
 * "1 234,5" ko'rinadi (mingliklar bo'shliq, o'nlik — VERGUL). API ga
 * `parseAmount` (2 xonagacha yaxlitlangan Number) yuboriladi.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Valyuta USD mi ('USD' / 'usd' / '$'). Boshqa hamma narsa — UZS (butun). */
export const isUsd = (currency: unknown): boolean => {
  const c = String(currency ?? '').trim().toUpperCase();
  return c === 'USD' || c === '$';
};

/** Summani tsentgacha yaxlitlash (float qoldiqlarsiz: 0.1+0.2 -> 0.3). */
export const round2 = (n: number | string | null | undefined): number => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.round((v + Number.EPSILON) * 100) / 100;
};

/** Summani butun tsentga o'tkazish — taqqoslash uchun (float xatosiz). */
export const toCents = (n: number | string | null | undefined): number =>
  Math.round(round2(n) * 100);

/**
 * Foydalanuvchi yozgan matnni KANONIK xom satrga keltiradi.
 *   allowCents=false: "6 575" -> "6575", "65,75" -> "6575" (UZS — butun)
 *   allowCents=true : "65,75" -> "65.75", "1 234.567" -> "1234.56",
 *                     ","     -> "0.",    "1,2,3"     -> "1.23", "007" -> "7"
 */
export const sanitizeAmountInput = (
  text: string | number | null | undefined,
  allowCents: boolean,
): string => {
  const s = String(text ?? '').replace(/\s/g, '');
  if (!allowCents) {
    return s.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
  }
  const cleaned = s.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned.replace(/^0+(?=\d)/, '');
  const intPart = cleaned.slice(0, dot).replace(/^0+(?=\d)/, '') || '0';
  const frac = cleaned
    .slice(dot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  return `${intPart}.${frac}`;
};

/**
 * Valyuta almashtirilganda (UZS↔USD) xom satrni moslash: USD -> UZS da kasr
 * qismi TASHLANADI ("12.34" -> "12"; raqamlar qo'shilib "1234" bo'lmaydi),
 * UZS -> USD da qiymat o'zgarmaydi.
 */
export const adaptAmountInputToCurrency = (
  raw: string | number | null | undefined,
  allowCents: boolean,
): string =>
  allowCents
    ? sanitizeAmountInput(raw, true)
    : sanitizeAmountInput(String(raw ?? '').split('.')[0], false);

/**
 * Xom satrni ekranda ko'rsatish: "1234.5" -> "1 234,5", "0." -> "0,".
 * allowCents=false bo'lsa kasr qismi tashlanadi (UZS).
 */
export const formatAmountInput = (
  raw: string | number | null | undefined,
  allowCents: boolean,
): string => {
  const s = adaptAmountInputToCurrency(raw, allowCents);
  if (!s) return '';
  const [intPart, frac] = s.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return frac === undefined ? grouped : `${grouped},${frac}`;
};

/** Xom/formatlangan satrdan API uchun son (USD: 2 xona, UZS: butun). */
export const parseAmount = (
  raw: string | number | null | undefined,
  allowCents = true,
): number => {
  const s = sanitizeAmountInput(raw, allowCents);
  const n = Number(s.endsWith('.') ? s.slice(0, -1) : s);
  if (!Number.isFinite(n)) return 0;
  return allowCents ? round2(n) : Math.round(n);
};

/**
 * Sonni maydonga qo'yish uchun xom satrga (foiz tugmalari, "Hammasi",
 * qoldiqni oldindan to'ldirish): 655.77 -> "655.77", 15.5 -> "15.5", 100 -> "100".
 */
export const amountToInput = (
  n: number | string | null | undefined,
  allowCents: boolean,
): string => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return '';
  if (!allowCents) return String(Math.round(v));
  return String(round2(v));
};

/**
 * Qoldiqdan foiz (25/50/75/100%): USD — tsentgacha, UZS — butun so'mgacha.
 * 100% har doim qoldiqning O'ZI (yaxlitlash xatosisiz).
 */
export const percentOfAmount = (
  total: number | string | null | undefined,
  pct: number,
  allowCents: boolean,
): number => {
  const t = Number(total) || 0;
  if (pct >= 100) return allowCents ? round2(t) : Math.round(t);
  const v = (t * pct) / 100;
  return allowCents ? round2(v) : Math.round(v);
};

/** a > b mi — tsentlarda (float xatosiz). "max = qoldiq" tekshiruvi uchun. */
export const exceedsAmount = (
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): boolean => toCents(a) > toCents(b);

/**
 * Raqamni mingliklar bilan, kasr bo'lsa 2 xona VERGUL bilan:
 *   655.77 -> "655,77", 1234.5 -> "1 234,50", 1500 -> "1 500".
 * USD summalarni ro'yxat/kartada ko'rsatish uchun (groupDigits butunlaydi).
 */
export const groupMoney = (n: number | string | null | undefined): string => {
  const v = round2(n);
  const neg = v < 0;
  const abs = Math.abs(v);
  const intPart = Math.floor(abs);
  const cents = Math.round((abs - intPart) * 100);
  const head = `${neg ? '-' : ''}${groupDigits(intPart)}`;
  return cents ? `${head},${String(cents).padStart(2, '0')}` : head;
};

/** Valyutaga mos to'liq summa: USD — tsent bilan, UZS — butun. */
export const fmtAmountByCurrency = (
  n: number | string | null | undefined,
  currency: unknown,
): string => (isUsd(currency) ? groupMoney(n) : groupDigits(Number(n) || 0));

/** Shartnoma komissiyasi (UZS): 0.1%, min 1 000, max 100 000. Faqat SON qaytaradi. */
export const MIN_CONTRACT_FEE = 1000;
export const MAX_CONTRACT_FEE = 100000;
export const contractFee = (
  amount: number,
  isUzs: boolean,
  usdRate: number | string = 0,
): number => {
  const a = Number(amount);
  if (!Number.isFinite(a) || a <= 0) return MIN_CONTRACT_FEE;
  const uzs = isUzs ? a : a * Number(usdRate || 0);
  if (!Number.isFinite(uzs) || uzs <= 1000000) return MIN_CONTRACT_FEE;
  if (uzs >= 100000000) return MAX_CONTRACT_FEE;
  return Math.round(uzs * 0.001);
};
