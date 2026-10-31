/**
 * num.ts — sof (i18n/RN'siz) son yordamchisi. offline/* qatlami helper/money.ts (i18n'ga bog'liq)
 * ni import qilmasligi uchun alohida fayl; money.ts shuni qayta eksport qiladi.
 */

/**
 * Chekli songa aylantirish: NaN/Infinity/aylantirib bo'lmaydigan -> 0 (-0 saqlanadi).
 * offline/derive va offline/projection nusxalari shu yerga ko'chirilgan (xulq bir xil).
 * financeMoney/smsPools/QarzShartnomasi `num` lari ham endi chekli qiymat qaytaradi (01.11).
 */
export const toFiniteNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
