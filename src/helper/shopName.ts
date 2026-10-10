/**
 * Do'kon (savdo faoliyati) nomi qoidalari — yaratish va tahrirlash ekranlari uchun YAGONA manba
 * (backend `validateShopName` / sayt `utils/shopName.js` bilan bir xil).
 *
 * Nom qarz oluvchilarga yuboriladigan SMS'da chiqadi: lotin harflari, raqam, probel, nuqta, defis
 * va oddiy apostrof (') — boshqa belgilar SMS'ni UCS-2 ga o'tkazadi (narxi oshadi).
 */
export const SHOP_NAME_MAX_LEN = 28;

const APOSTROPHE_LIKE = /[ʻʼ‘’`´′ʹ‵]/g;
const DISALLOWED = /[^A-Za-z0-9 .\-']/g;
const ALLOWED_RE = /^[A-Za-z0-9 .\-']+$/;

/** Apostrof-variantlari (o‘, g‘ ...) → oddiy ' */
export const normalizeShopApos = (s: string): string => String(s ?? '').replace(APOSTROPHE_LIKE, "'");

/** Kiritish paytida: apostrof normalizatsiyasi + ruxsat etilmagan belgilarni olib tashlash. */
export const sanitizeShopNameInput = (txt: string): string =>
  normalizeShopApos(txt).replace(DISALLOWED, '').slice(0, SHOP_NAME_MAX_LEN);

/**
 * Nom xatosi — i18n KALITI (t() bilan tarjima qilinadi) yoki null.
 * Kalitlar mavjud tarjimalar bilan bir xil (QarzDaftariFaoliyat).
 */
export const shopNameErrorKey = (raw: string): string | null => {
  const nm = normalizeShopApos(raw).trim();
  if (!nm) return "Do'kon nomini kiriting";
  if (nm.length > SHOP_NAME_MAX_LEN) return 'Do‘kon nomi 28 ta belgidan oshmasin';
  if (!ALLOWED_RE.test(nm)) return 'Faqat lotin harflari, raqam, probel, nuqta, defis va apostrof ishlatilsin';
  return null;
};
