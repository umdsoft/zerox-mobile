// SS-SEC (2026-09-25): PIN-kod OCHIQ MATNDA saqlanmaydi.
// SEC (2026-10-31): sha256(salt:pin) o'rniga PBKDF2-HMAC-SHA256 (js-sha256 hmac bilan).
//
// Format (`pin_hash`): 'v2$<iter>$<saltHex>$<hashHex>'. Salt formatning ichida.
// Eski format (v1): `pin_salt` + `pin_hash` = sha256(salt + ':' + pin) hex —
// muvaffaqiyatli verifyPin'da v2'ga JIM ko'chiriladi. Undan ham eski ochiq `k2`
// ham birinchi muvaffaqiyatli tekshiruvda v2'ga o'tkaziladi.
// Eslatma: PIN 4 xonali (10^4 variant) — KDF oflayn brute-force'ni faqat sekinlashtiradi;
// asosiy to'siq: shifrlangan MMKV (Keychain kaliti) + urinish qulfi (pinLockout.ts).
import 'react-native-get-random-values';
import { sha256 } from 'js-sha256';
import { storage } from './getToken';
import { resetPinLockout } from './pinLockout';

const KEY_HASH = 'pin_hash';
const KEY_SALT = 'pin_salt'; // faqat v1
// Eski (ochiq matn) kalitlar — faqat migratsiya/tozalash uchun.
const LEGACY_PIN = 'k2';
const LEGACY_PIN_STEP1 = 'k1';
const LEGACY_TMP_KEYS = ['key1', 'key2'];

// 4000: arzon Android'da (Hermes, sof JS) PIN klaviaturasi qotmasin; 4 xonali PIN uchun asosiy
// to'siq — urinish qulfi va Keychain'dagi shifrlash kaliti.
export const PBKDF2_ITERATIONS = 4000;
const V2_PREFIX = 'v2$';

function randomSaltHex(): string {
  const bytes = new Uint8Array(16);
  (globalThis as any).crypto.getRandomValues(bytes);
  return toHex(bytes);
}

function utf8Bytes(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) {
      c = 0x10000 + ((c & 0x3ff) << 10) + (s.charCodeAt(++i) & 0x3ff);
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

function toHex(bytes: ArrayLike<number>): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

/** PBKDF2-HMAC-SHA256, dkLen = 32 (bitta blok). Hex qaytaradi. Test uchun eksport. */
export function pbkdf2Sha256Hex(password: string, salt: string, iterations: number): string {
  const key = utf8Bytes(password);
  const saltBytes = utf8Bytes(salt);
  let u: number[] = sha256.hmac.array(key, saltBytes.concat([0, 0, 0, 1]));
  const t = u.slice();
  for (let i = 1; i < iterations; i++) {
    u = sha256.hmac.array(key, u);
    for (let j = 0; j < 32; j++) t[j] ^= u[j];
  }
  return toHex(t);
}

function hashV1(salt: string, pin: string): string {
  return sha256(salt + ':' + pin);
}

// Vaqt bo'yicha barqaror solishtirish.
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
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

function writeV2(pin: string): void {
  const salt = randomSaltHex();
  const hash = pbkdf2Sha256Hex(pin, salt, PBKDF2_ITERATIONS);
  storage.set(KEY_HASH, `${V2_PREFIX}${PBKDF2_ITERATIONS}$${salt}$${hash}`);
  storage.delete(KEY_SALT);
  clearLegacyPinKeys();
}

/** PIN'ni v2 (PBKDF2) ko'rinishida saqlaydi; eski qiymatlarni o'chiradi. */
export function setPin(pin: string): void {
  writeV2(pin);
  // Yangi PIN autentifikatsiyalangan oqim (SMS tiklash / eski PIN) orqali o'rnatiladi.
  resetPinLockout();
}

function verifyV2(stored: string, pin: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const iter = parseInt(parts[1], 10);
  if (!Number.isFinite(iter) || iter < 1 || iter > 1000000) return false;
  return safeEqual(pbkdf2Sha256Hex(pin, parts[2], iter), parts[3]);
}

/**
 * PIN to'g'rimi. v1/ochiq `k2` muvaffaqiyatda v2'ga ko'chiriladi. DIQQAT: bu funksiya
 * urinishlarni HISOBLAMAYDI — UI faqat pinLockout.attemptPin(verifyPin, pin) orqali chaqirsin.
 */
export function verifyPin(pin: string): boolean {
  const hash = storage.getString(KEY_HASH);
  if (hash && hash.startsWith(V2_PREFIX)) {
    const ok = verifyV2(hash, pin);
    if (ok && parseInt(hash.split('$')[1], 10) !== PBKDF2_ITERATIONS) writeV2(pin);
    return ok;
  }
  const salt = storage.getString(KEY_SALT);
  if (salt && hash) {
    const ok = safeEqual(hashV1(salt, pin), hash);
    if (ok) writeV2(pin);
    return ok;
  }
  const legacy = storage.getString(LEGACY_PIN);
  if (legacy !== undefined) {
    const ok = safeEqual(legacy, pin);
    if (ok) writeV2(pin);
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
