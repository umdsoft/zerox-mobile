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
  return groupDigits(n);
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
