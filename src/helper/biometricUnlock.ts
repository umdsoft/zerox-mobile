/**
 * SEC (2026-10-31): biometrik qulf ochish endi BOOLEAN emas.
 *
 * Ilgari Android BiometricPrompt (CryptoObject'siz) / iOS simplePrompt natijasi `true`
 * bo'lsa `appLocked=false` qilinardi — Frida/hook bilan bitta qaytish qiymati yetardi.
 * Endi: yoqishda tasodifiy sir (secret) yaratiladi va Keychain/Keystore'da
 * BIOMETRY_CURRENT_SET kirish nazorati bilan saqlanadi — sirni FAQAT haqiqiy biometrik
 * tasdiq (Keystore kaliti auth-bound) chiqarib beradi. MMKV'da faqat uning SHA-256'i
 * turadi; qulf ochishda Keychain'dan olingan sir hash'i bilan solishtiriladi.
 * Yangi barmoq izi/yuz qo'shilsa BIOMETRY_CURRENT_SET kaliti yaroqsiz bo'ladi ->
 * 'invalid' (PIN'ga qaytamiz, foydalanuvchidan qayta yoqish so'raladi).
 */
import 'react-native-get-random-values';
import * as Keychain from 'react-native-keychain';
import { sha256 } from 'js-sha256';
import { storage } from '../store/api/token/getToken';

const BIO_SERVICE = 'zx_bio_unlock';
const BIO_USERNAME = 'zx-bio';
const K_BIO_HASH = 'bio_secret_hash';

export type BioUnlockResult = 'ok' | 'cancelled' | 'invalid' | 'unavailable';

type Prompt = { title: string; cancel: string; subtitle?: string };

function randomSecretHex(): string {
  const bytes = new Uint8Array(32);
  (globalThis as any).crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** Biometrik sir ro'yxatdan o'tkazilganmi (MMKV'da hash bor). */
export function isBiometricEnrolled(): boolean {
  try {
    return storage.contains(K_BIO_HASH);
  } catch {
    return false;
  }
}

/** Sirni Keychain'dan va MMKV'dan o'chiradi (o'chirish/yangi barmoq izi/logout). */
export async function disableBiometricUnlock(): Promise<void> {
  try {
    storage?.delete(K_BIO_HASH);
  } catch {}
  try {
    await Keychain.resetGenericPassword({ service: BIO_SERVICE });
  } catch {}
}

/** Yangi tasodifiy sirni biometrik-bog'langan holda saqlaydi. true = muvaffaqiyat. */
export async function enrollBiometricUnlock(prompt: Prompt): Promise<boolean> {
  try {
    const secret = randomSecretHex();
    const res = await Keychain.setGenericPassword(BIO_USERNAME, secret, {
      service: BIO_SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: { title: prompt.title, subtitle: prompt.subtitle, cancel: prompt.cancel },
    });
    if (!res) return false;
    storage.set(K_BIO_HASH, sha256(secret));
    return true;
  } catch {
    await disableBiometricUnlock();
    return false;
  }
}

// `user` so'zi yo'q: UserNotAuthenticatedException (kalit yaroqsiz) 'cancelled' deb chalg'itmasin.
const CANCEL_RE = /cancel|negative|dismiss|lockout|too many/i;

/** Biometrik tasdiqlash orqali sirni olib, hash bilan solishtiradi. */
export async function unlockWithBiometrics(prompt: Prompt): Promise<BioUnlockResult> {
  const expected = (() => {
    try {
      return storage.getString(K_BIO_HASH);
    } catch {
      return undefined;
    }
  })();
  if (!expected) return 'unavailable';
  try {
    const creds = await Keychain.getGenericPassword({
      service: BIO_SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      authenticationPrompt: { title: prompt.title, subtitle: prompt.subtitle, cancel: prompt.cancel },
    });
    if (!creds) {
      // Yozuv yo'q (masalan, kalit yaroqsiz bo'lib Keychain o'chirgan).
      await disableBiometricUnlock();
      return 'invalid';
    }
    return safeEqual(sha256(creds.password), expected) ? 'ok' : 'invalid';
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? '');
    if (CANCEL_RE.test(msg)) return 'cancelled';
    // Boshqa xato: kalit yaroqsiz (yangi biometrika qo'shilgan) bo'lishi mumkin. Yozuv
    // hali bormi tekshiramiz; yo'q bo'lsa — qayta yoqish talab etiladi.
    let still = true;
    try {
      still = await Keychain.hasGenericPassword({ service: BIO_SERVICE });
    } catch {}
    if (!still || /invalidat|permanently|key/i.test(msg)) {
      await disableBiometricUnlock();
      return 'invalid';
    }
    return 'cancelled';
  }
}
