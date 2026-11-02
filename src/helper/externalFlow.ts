/**
 * SS-DEV (2026-10-06, "Yangi mobil xatolar 06.10" 1(b)-band): tashqi oqim davomida
 * fon qulfi (PIN / Touch ID / Face ID) ishga TUSHMASIN.
 *
 * ILDIZ: MyID SDK (Android'da ALOHIDA Activity), Click/Payme brauzer sahifasi —
 * ilova shu vaqt "fon"da (AppState 'background'). Yuz skaneri odatda 30 s dan
 * uzoq → qaytishda `useAppStateListener` (LOCK_TIMEOUT 30 s) stekni PIN ekraniga
 * reset qilardi. Foydalanuvchi identifikatsiyadan chiqqach avval PIN kiritardi,
 * faqat keyin oferta ochilardi.
 *
 * Endi: tashqi oqim BOSHLANISHIDAN oldin `beginExternalFlow()` chaqiriladi —
 * keyingi fon davri qulf hisobiga KIRMAYDI (bir martalik: ilova 'active' ga
 * qaytganda bayroq iste'mol qilinadi). Xavfsizlik: bayroq TTL bilan (default
 * 10 daqiqa) — foydalanuvchi oqimni tashlab ketsa, keyingi fon odatdagidek qulflanadi.
 */
import { storage } from '../store/api/token/getToken';

const KEY = 'externalFlowUntil';
export const EXTERNAL_FLOW_MAX_MS = 10 * 60_000;

/** Tashqi oqim (MyID, to'lov brauzeri) boshlanmoqda — keyingi qaytishda qulf yo'q. */
export const beginExternalFlow = (maxMs: number = EXTERNAL_FLOW_MAX_MS): void => {
  try {
    storage.set(KEY, Date.now() + maxMs);
  } catch (_) {}
};

/** Oqim tugadi (natija keldi / bekor qilindi). */
export const endExternalFlow = (): void => {
  try {
    storage.delete(KEY);
  } catch (_) {}
};

/** Tashqi oqim hozir faolmi (TTL ichida). */
export const isExternalFlowActive = (now: number = Date.now()): boolean => {
  try {
    const until = storage.getNumber(KEY);
    // Uzoq kelajakdagi qiymat (soat o'yini / buzuq yozuv) qabul qilinmaydi.
    return !!until && until > now && until - now <= EXTERNAL_FLOW_MAX_MS;
  } catch (_) {
    return false;
  }
};

/** Picker/kamera/ulashish/ruxsat oynasi uchun chegara (MyID/to'lov — 10 daqiqa). */
export const EXTERNAL_ACTIVITY_MAX_MS = 3 * 60_000;
/**
 * Amal tugagach oyna QISQARTIRILADI (o'chirilmaydi): Android'da picker natijasi 'active'
 * hodisasidan OLDIN keladi — darhol o'chirsak qaytishda qulf ishga tushardi.
 */
export const EXTERNAL_ACTIVITY_SETTLE_MS = 3_000;

/** Ilova o'zi tashqi oyna ochmoqda — keyingi fon→faol qaytishda qulf yo'q (avto-tugaydi). */
export const suppressAppLock = (maxMs: number = EXTERNAL_ACTIVITY_MAX_MS): void =>
  beginExternalFlow(maxMs);

const readUntil = (): number => {
  try {
    return storage.getNumber(KEY) || 0;
  } catch (_) {
    return 0;
  }
};

/**
 * `fn` (picker/ulashish/ruxsat/biometrik) davomida va tugagach qisqa vaqt qulf o'chiq.
 * Oldindan mavjud UZUNROQ oyna (masalan MyID) bu chaqiruv bilan qisqartirilmaydi ham, uzaytirilmaydi ham.
 */
export async function withExternalActivity<T>(
  fn: () => Promise<T> | T,
  maxMs: number = EXTERNAL_ACTIVITY_MAX_MS,
): Promise<T> {
  const prevUntil = readUntil();
  try {
    storage.set(KEY, Math.max(prevUntil, Date.now() + maxMs));
  } catch (_) {}
  try {
    return await fn();
  } finally {
    // fn davomida bayroq ISTE'MOL qilingan bo'lsa (qaytish allaqachon ko'rilgan) — qayta yoqilmaydi.
    if (readUntil() !== 0) {
      try {
        storage.set(KEY, Math.max(prevUntil, Date.now() + EXTERNAL_ACTIVITY_SETTLE_MS));
      } catch (_) {}
    }
  }
}

/** Tashqi oqim (MyID) natija berdi / chiqildi: uzoq oynani qisqa "settle"ga tushiradi (o'chirmaydi). */
export const settleExternalFlow = (): void => beginExternalFlow(EXTERNAL_ACTIVITY_SETTLE_MS);
