/**
 * num.ts — sof (i18n/RN'siz) son yordamchisi. offline/* qatlami helper/money.ts (i18n'ga bog'liq)
 * ni import qilmasligi uchun alohida fayl; money.ts shuni qayta eksport qiladi.
 */

/**
 * Chekli songa aylantirish: NaN/Infinity/aylantirib bo'lmaydigan -> 0 (-0 saqlanadi).
 * offline/derive va offline/projection nusxalari shu yerga ko'chirilgan (xulq bir xil).
 * Diqqat: boshqa `num` nusxalari (financeMoney, smsPools, QarzShartnomasi) Infinity/-0
 * bo'yicha FARQ qiladi — ular o'z joyida qoldi.
 */
export const toFiniteNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
