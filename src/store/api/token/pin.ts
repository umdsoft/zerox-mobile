// SS-SEC (2026-09-25): PIN-kod endi OCHIQ MATNDA saqlanmaydi.
//
// Ilgari `k2` (o'rnatilgan PIN) va `k1` (birinchi qadamdagi PIN) MMKV'da ochiq
// matn edi. Endi PIN faqat `SHA-256(salt + pin)` ko'rinishida saqlanadi:
//   - `pin_salt` — 16 bayt CSPRNG (hex), har qurilma/PIN uchun alohida;
//   - `pin_hash` — sha256(salt + pin) hex.
// MMKV o'zi ham shifrlangan (getToken.tsx), bu ikkinchi himoya qatlami:
// MMKV fayli/kaliti oqib ketsa ham PIN o'zi bevosita o'qilmaydi.
//
// MIGRATSIYA (eski foydalanuvchi): storage'da eski ochiq `k2` topilsa,
// `hasPin()` true qaytaradi (qulf ekrani chiqadi), `verifyPin()` esa ochiq
// qiymat bilan solishtiradi va BIRINCHI muvaffaqiyatli tekshiruvda hash'ga
// o'tkazib, `k2`/`k1` ni o'chiradi. Foydalanuvchi PIN'ni qayta o'rnatmaydi.
import 'react-native-get-random-values';
import { sha256 } from 'js-sha256';
import { storage } from './getToken';

const KEY_HASH = 'pin_hash';
const KEY_SALT = 'pin_salt';
// Eski (ochiq matn) kalitlar — faqat migratsiya/tozalash uchun.
const LEGACY_PIN = 'k2';
const LEGACY_PIN_STEP1 = 'k1';
const LEGACY_TMP_KEYS = ['key1', 'key2'];

function randomSaltHex(): string {
  const bytes = new Uint8Array(16);
  (globalThis as any).crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hashPin(salt: string, pin: string): string {
  return sha256(salt + ':' + pin);
}

// Vaqt bo'yicha barqaror solishtirish (uzunligi teng hex satrlar).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** PIN o'rnatilganmi (hash yoki eski ochiq `k2`). */
export function hasPin(): boolean {
  try {
    return storage.contains(KEY_HASH) || storage.contains(LEGACY_PIN);
  } catch {
    return false;
  }
}

/** PIN'ni hash ko'rinishida saqlaydi; eski ochiq qiymatlarni o'chiradi. */
export function setPin(pin: string): void {
  const salt = randomSaltHex();
  storage.set(KEY_SALT, salt);
  storage.set(KEY_HASH, hashPin(salt, pin));
  clearLegacyPinKeys();
}

/**
 * PIN to'g'rimi. Eski ochiq `k2` bo'lsa u bilan solishtiradi va muvaffaqiyatda
 * hash'ga ko'chiradi (bir martalik migratsiya).
 */
export function verifyPin(pin: string): boolean {
  const salt = storage.getString(KEY_SALT);
  const hash = storage.getString(KEY_HASH);
  if (salt && hash) {
    return safeEqual(hashPin(salt, pin), hash);
  }
  const legacy = storage.getString(LEGACY_PIN);
  if (legacy !== undefined) {
    const ok = safeEqual(legacy, pin);
    if (ok) setPin(pin); // migratsiya: ochiq -> hash
    return ok;
  }
  return false;
}

/** PIN'ni (va eski ochiq qoldiqlarni) butunlay o'chiradi. */
export function clearPin(): void {
  storage.delete(KEY_HASH);
  storage.delete(KEY_SALT);
  clearLegacyPinKeys();
}

/** Eski ochiq-matn kalitlarini tozalaydi (`k1`, `k2`, vaqtinchalik `key1/key2`). */
export function clearLegacyPinKeys(): void {
  try {
    storage.delete(LEGACY_PIN);
    storage.delete(LEGACY_PIN_STEP1);
    LEGACY_TMP_KEYS.forEach(k => storage.delete(k));
  } catch {}
}
