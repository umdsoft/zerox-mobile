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
