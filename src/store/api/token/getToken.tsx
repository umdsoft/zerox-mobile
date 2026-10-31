// CSPRNG polyfill (crypto.getRandomValues) — shifrlash kaliti uchun. Eng birinchi import.
import 'react-native-get-random-values';
import { MMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';

/**
 * prefsStorage — MAXFIY BO'LMAGAN sozlamalar (til/lang, theme ...).
 * Shifrlanmagan va SINXRON: i18n import paytida `lang` ni o'qigani uchun
 * async bo'lishi mumkin emas. Bu yerda hech qachon JWT/PIN saqlanmaydi.
 */
export const prefsStorage = new MMKV({ id: 'prefs' });

/**
 * storage — MAXFIY data (JWT, PIN k1/k2, PINFL, user_id ...). AES bilan SHIFRLANGAN.
 * Shifrlash kaliti Android Keystore / iOS Keychain'da (react-native-keychain).
 *
 * Kalit async olinadi, shuning uchun `storage` darhol yaratilmaydi — u
 * `initSecureStorage()` da tayinlanadi (live-binding). `initSecureStorage()` esa
 * index.js'da AppRegistry'dan OLDIN va background-handler'lar boshida await qilinadi.
 * Modul-yuklanish paytida storage HECH QAYERDA ishlatilmaydi (faqat funksiya ichida).
 */
export let storage: MMKV = undefined as unknown as MMKV;

// 23.10 (oflayn rejim): asosiy store kaliti — boshqa SHIFRLANGAN instansiyalar uchun
// (masalan oflayn navbat). Faqat xotirada; hech qachon saqlanmaydi/log qilinmaydi.
let secureKey: string | undefined;

/**
 * 23.10: alohida SHIFRLANGAN MMKV instansiyasi (o'sha Keychain kaliti bilan).
 * Oflayn navbat (outbox) shu yerda turadi: logout'dagi `storage.clearAll()` uni
 * O'CHIRMAYDI — sinxronlanmagan amallar jim yo'qolmasin. `initSecureStorage()` dan
 * KEYIN chaqirilishi kerak. Degraded rejimda (Keychain yo'q) — vaqtinchalik instansiya.
 */
export function openSecureMMKV(id: string): MMKV {
  if (secureKey) return new MMKV({ id, encryptionKey: secureKey });
  // Keychain yo'q: navbat ochiq faylga YOZILMAYDI — tasodifiy, saqlanmaydigan kalitli
  // vaqtinchalik instansiya (shifrlangan haqiqiy fayl kalitsiz ochilmaydi).
  const eph = new MMKV({ id: `${id}-degraded`, encryptionKey: generateEncryptionKey() });
  eph.clearAll();
  return eph;
}

const KEYCHAIN_SERVICE = 'com.zeroxuz.securestore';
const KEYCHAIN_USERNAME = 'mmkv-encryption-key';
// prefsStorage'da (shifrlanmagan) — maxfiy store ALLAQACHON shifrlanganmi belgisi.
// reinstall'da MMKV bilan birga o'chadi → "kalit yo'qoldi (corruption xavfi)" va
// "yangi/qayta o'rnatish (toza)" holatlarini ajratish uchun ishlatiladi.
const SECURE_FLAG = 'secureStoreEncrypted';

/**
 * MMKV shifrlash kaliti — STRING bayt uzunligi <= 16 bo'lishi SHART (MMKV AES-128
 * limiti). SEC (2026-10-31): ilgari 8 bayt CSPRNG -> 16 hex belgi (64 bit entropiya).
 * Endi 16 belgi, 62 belgili alifbodan (a-zA-Z0-9) — CSPRNG + rejection sampling
 * (bayt < 248 qabul qilinadi, mod 62: modul og'ishi yo'q) -> ~95 bit entropiya.
 */
const KEY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const KEY_LENGTH = 16;
const KEY_ACCEPT_BELOW = 248; // 62 * 4

function generateEncryptionKey(): string {
  let out = '';
  while (out.length < KEY_LENGTH) {
    const bytes = new Uint8Array(32);
    // react-native-get-random-values global.crypto ni polyfill qiladi.
    (globalThis as any).crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length && out.length < KEY_LENGTH; i++) {
      if (bytes[i] < KEY_ACCEPT_BELOW) out += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
    }
  }
  return out;
}

// Kalit zaxiraga ko'chmaydi (THIS_DEVICE_ONLY); birinchi qulf ochilishidan keyin fon
// FCM handler'iga ham o'qiladi.
const KEY_ACCESSIBLE = Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
// prefsStorage (shifrlanmagan, SINXRON) bayrog'i: kalit yangi (62 belgili) formatda yaratilgan.
// Mavjud o'rnatishlar ESKI kalitda qoladi (ataylab): MMKV'da joyida recrypt jarayon o'ldirilsa
// fayl yo'qotilishi mumkin, kalit esa baribir Keychain/Keystore himoyasida.
const KEY_V2_FLAG = 'secureKeyV2';

let storageDegraded = false;
/** Keychain mavjud emas -> ilova tokenlarsiz (har ishga tushganda qayta kirish) ishlayapti. */
export const isStorageDegraded = (): boolean => storageDegraded;

async function writeKey(service: string, key: string): Promise<void> {
  await Keychain.setGenericPassword(KEYCHAIN_USERNAME, key, {
    service,
    accessible: KEY_ACCESSIBLE,
  });
}

function reportStorageIssue(err: unknown, where: string): void {
  try {
    const crashlytics = require('@react-native-firebase/crashlytics').default;
    crashlytics().log(`secure storage: ${where}`);
    crashlytics().recordError(err instanceof Error ? err : new Error(`secure storage: ${where}`));
  } catch {}
}

let initPromise: Promise<void> | null = null;

/**
 * Maxfiy storage'ni shifrlangan holatga keltiradi. Idempotent (bir marta bajariladi).
 * - Keychain'da kalit BOR  → fayl allaqachon shifrlangan, kalit bilan ochamiz
 *   (eski formatdagi kalit ham shunday qoladi — joyida recrypt qilinmaydi).
 * - Keychain'da kalit YO'Q → birinchi marta: kalit yarat → keychain'ga saqla →
 *   mavjud SHIFRLANMAGAN faylni JOYIDA shifrla (recrypt).
 * - Keychain mavjud emas/xato → degraded: tokenlar saqlanmaydi (har ishga tushishda
 *   qayta kirish), crashlytics'ga xabar.
 */
export function initSecureStorage(): Promise<void> {
  if (!initPromise) {
    initPromise = doInitSecureStorage();
  }
  return initPromise;
}

// SS-SEC (2026-09-25): Keychain o'qishi vaqtinchalik xato bersa (masalan qurilma
// qayta yoqilgach fon FCM handler'i birinchi qulf ochilishidan oldin ishga tushsa)
// bir marta qisqa kutib qayta urinamiz — shifrlangan faylni kalitsiz ochmaslik uchun.
async function readKeychainKeyWithRetry() {
  try {
    return await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  } catch (firstErr) {
    await new Promise<void>(r => setTimeout(r, 300));
    try {
      return await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
    } catch {
      throw firstErr;
    }
  }
}

async function doInitSecureStorage(): Promise<void> {
  try {
    const existing = await readKeychainKeyWithRetry();
    const wasEncrypted = prefsStorage.getBoolean(SECURE_FLAG) === true;
    const mainKey = existing && existing.password ? existing.password : undefined;

    // 1) Kalit BOR → shifrlangan store'ni kalit bilan ochamiz (odatiy yo'l).
    if (mainKey) {
      secureKey = mainKey;
      storage = new MMKV({ id: 'storage', encryptionKey: mainKey });
      if (!wasEncrypted) prefsStorage.set(SECURE_FLAG, true);
      return;
    }

    // 2) Kalit YO'Q, lekin flag bor → oldin shifrlangan, kalit YO'QOLGAN (reinstall EMAS;
    //    reinstall'da flag ham o'chardi). Shifrlangan data'ni ochib bo'lmaydi → uni
    //    tozalab, yangi kalit bilan boshlaymiz. Foydalanuvchi qayta login + PIN o'rnatadi.
    if (wasEncrypted) {
      const broken = new MMKV({ id: 'storage' });
      broken.clearAll();
      const newKey = generateEncryptionKey();
      await writeKey(KEYCHAIN_SERVICE, newKey);
      broken.recrypt(newKey);
      prefsStorage.set(KEY_V2_FLAG, true);
      secureKey = newKey;
      storage = broken;
      return;
    }

    // 3) Kalit YO'Q + flag YO'Q → HAQIQIY birinchi/qayta o'rnatish. Mavjud
    //    (shifrlanmagan) data JOYIDA shifrlanadi — eski foydalanuvchi qayta login
    //    QILMAYDI; reinstall'da esa MMKV bo'sh → toza boshlanadi.
    const legacy = new MMKV({ id: 'storage' });

    // `lang` ni prefs'ga ko'chiramiz (i18n sinxron o'qiydi).
    const oldLang = legacy.getString('lang');
    if (oldLang && !prefsStorage.getString('lang')) {
      prefsStorage.set('lang', oldLang);
    }

    const key = generateEncryptionKey();
    // Kalitni AVVAL keychain'ga saqlaymiz: recrypt yarmida uzilsa ham keyingi ishga
    // tushishda kalit topiladi va shifrlangan fayl o'qiladi (data yo'qolmaydi).
    await writeKey(KEYCHAIN_SERVICE, key);
    legacy.recrypt(key);
    prefsStorage.set(SECURE_FLAG, true);
    prefsStorage.set(KEY_V2_FLAG, true);
    secureKey = key;
    storage = legacy;
  } catch (err) {
    if (__DEV__) {
      console.warn('Secure storage init failed; using degraded fallback:', err);
    }
    reportStorageIssue(err, 'init');
    storageDegraded = true;
    // SEC (2026-10-31): Keychain ishlamasa tokenlar HECH QACHON ochiq faylda turmaydi.
    // Har ishga tushishda tasodifiy, saqlanmaydigan kalitli vaqtinchalik instansiya —
    // ilova "chiqqan" holatda ishlaydi (qayta kirish). Hech qachon shifrlanmagan bo'lsa
    // eski ochiq 'storage' (token bo'lishi mumkin) tozalanadi; ALLAQACHON shifrlangan
    // bo'lsa tegilmaydi (kalitsiz ochish uni buzadi).
    try {
      if (prefsStorage.getBoolean(SECURE_FLAG) !== true) {
        new MMKV({ id: 'storage' }).clearAll();
      }
    } catch {}
    const ephemeral = new MMKV({
      id: 'storage-degraded',
      encryptionKey: generateEncryptionKey(),
    });
    ephemeral.clearAll();
    storage = ephemeral;
  }
}

const setStorageItem = (key: string, value: string | number | boolean) => {
  storage.set(key, value);
};
const getStorageItem = (key: string) => {
  return storage.getString(key)!;
};

const getStorageItemBoolean = (key: string) => {
  return storage.getBoolean(key);
};

const getStorageItemNumber = (key: string) => {
  return storage.getNumber(key);
};

const removeStorageItem = (key: string) => {
  storage.delete(key);
};
const clearStorageAll = () => {
  storage.clearAll();
};

export {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearStorageAll,
  getStorageItemBoolean,
  getStorageItemNumber,
};
