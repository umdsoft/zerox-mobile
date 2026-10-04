/**
 * ofertaAfterId.ts — 03.10 (mobil hujjat, 1-band): "ro'yxatdan o'tish →
 * identifikatsiya → oferta sahifasi".
 *
 * ILDIZ (01.10 dagi `setTimeout(openOferta, 800)` nega ishlamasdi): MyID kamerasi
 * ALOHIDA Android Activity'da ishlaydi — shu vaqt davomida ilova "fon"da
 * hisoblanadi. Yuz skaneri odatda 30 s dan ko'p davom etadi → qaytishda
 * `useAppStateListener` ilovani QULFLAB, stekni PIN ekraniga (SetLocalPassword)
 * reset qiladi (qulfdan OLDINGI stek — tepasida identifikatsiya ekrani —
 * `preLockNavState`ga saqlanadi). MyID natijasi esa shu payt keladi: ScanFaceMyId
 * (allaqachon stekdan olib tashlangan) eski `navigation` bilan bosh sahifaga
 * o'tishga va 0.8 s dan keyin oynani ochishga urinardi — oyna PIN ekrani bilan
 * to'qnashib yo'qolar, qulf ochilgach esa stek yana identifikatsiya ekraniga
 * tiklanardi. Foydalanuvchi oferta sahifasini ko'rmasdi.
 *
 * Endi: identifikatsiya muvaffaqiyatli bo'lgach MMKV'ga "navbat" yoziladi;
 * ContractModal foydalanuvchi ilovaning ODDIY ekraniga (qulf/identifikatsiya
 * emas) tushganda uni BIR MARTA iste'mol qilib oynani ochadi. Oyna majburiy
 * emas — yopilsa qayta avtomatik ochilmaydi (keyin faqat Qarz shartnomasida
 * "Qarz berish"/"Qarz olish" bosilganda — useOfertaGuard).
 *
 * ofertaGate.ts sof (storage'siz) qoladi — bu modul alohida.
 */
import { storage } from '../store/api/token/getToken';
import { needsOferta } from './ofertaGate';

const OFERTA_AFTER_ID_KEY = 'ofertaAfterIdentification';
const ANY_USER = '*';

/** Bu ekranlarda navbat KUTADI (qulf / kirish / identifikatsiya oqimi). */
export const OFERTA_WAIT_ROUTES = new Set<string>([
  'SetLocalPassword',
  'ScanFaceMyId',
  'LoginWithPhone',
  'SelectLanguageScreen',
]);

/** Identifikatsiyadan keyin oferta oynasini ochishni navbatga qo'yadi. */
export const markOfertaAfterIdentification = (userId?: string | number | null): void => {
  try {
    storage.set(
      OFERTA_AFTER_ID_KEY,
      userId != null && userId !== '' ? String(userId) : ANY_USER,
    );
  } catch (_) {
    // MMKV yozilmasa — oyna baribir Qarz shartnomasi amalida ochiladi.
  }
};

/** Navbatda oferta oynasi bormi. */
export const hasOfertaAfterIdentification = (): boolean => {
  try {
    return !!storage.getString(OFERTA_AFTER_ID_KEY);
  } catch (_) {
    return false;
  }
};

/**
 * Navbatni iste'mol qiladi. `true` — oyna HOZIR ochilishi kerak (bir marta).
 * Foydalanuvchi ma'lumoti hali yangilanmagan bo'lsa (getMe kechikdi,
 * is_active hali 0) — navbat saqlanadi, keyingi chaqiruvda qayta tekshiriladi.
 * Boshqa akkaunt yoki oferta allaqachon tasdiqlangan bo'lsa — navbat o'chadi.
 */
export const consumeOfertaAfterIdentification = (userData: any): boolean => {
  let owner: string | undefined;
  try {
    owner = storage.getString(OFERTA_AFTER_ID_KEY);
  } catch (_) {
    return false;
  }
  if (!owner || !userData) return false;
  const otherUser =
    owner !== ANY_USER && userData.id != null && String(userData.id) !== owner;
  try {
    storage.delete(OFERTA_AFTER_ID_KEY);
  } catch (_) {
    // o'chirilmasa ham — natija quyida aniqlanadi.
  }
  /**
   * SS-DEV (2026-10-04, 04.10 hujjat 1-band): ILGARI bu yerda `is_active !== 1`
   * bo'lsa navbat KUTARDI. Navbat FAQAT `/user/isactivate` muvaffaqiyatli
   * bo'lgach yoziladi — ya'ni identifikatsiya ANIQ o'tgan. Lekin Redux'dagi
   * user ob'ekti ko'pincha hali ESKI (is_active=0): ScanFaceMyId'dagi getMe
   * MyID'dan qaytishda tarmoq/sessiya-guard sabab bo'sh qaytsa yoki qulf
   * ekranidan keyin yangilanmasa, `userData` o'zgarmaydi → navbat hech qachon
   * iste'mol qilinmas, oyna OCHILMASDI. Endi shu foydalanuvchi uchun
   * identifikatsiya o'tgan deb hisoblanadi (is_active: 1) — faqat oferta
   * allaqachon tasdiqlangan (is_contract=1) yoki xodim bo'lsa ochilmaydi.
   */
  return !otherUser && needsOferta({ ...userData, is_active: 1 });
};
