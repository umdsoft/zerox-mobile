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
    return !!until && until > now;
  } catch (_) {
    return false;
  }
};
