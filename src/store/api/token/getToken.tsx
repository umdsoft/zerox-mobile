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

const KEYCHAIN_SERVICE = 'com.zeroxuz.securestore';
const KEYCHAIN_USERNAME = 'mmkv-encryption-key';
// prefsStorage'da (shifrlanmagan) — maxfiy store ALLAQACHON shifrlanganmi belgisi.
// reinstall'da MMKV bilan birga o'chadi → "kalit yo'qoldi (corruption xavfi)" va
// "yangi/qayta o'rnatish (toza)" holatlarini ajratish uchun ishlatiladi.
const SECURE_FLAG = 'secureStoreEncrypted';

/**
 * MMKV shifrlash kaliti — STRING bayt uzunligi <= 16 bo'lishi SHART (MMKV AES-128
 * limiti: 16 baytdan uzun kalit native tomonda throw/truncate qiladi). Oldin 64 hex
 * (64 bayt) yaratilardi -> recrypt/ochishda nomuvofiqlik -> migration buzilib k2/PIN
 * yo'qolardi -> update'dan keyin majburiy full login. Endi 8 bayt CSPRNG -> 16 hex
 * belgi = aniq 16 bayt (barchasi ASCII), MMKV bilan to'liq mos.
 * Mavjud qurilmalar Keychain'dagi ESKI kalitni o'zgartirmasdan qayta ishlatadi
 * (1-shox `existing.password`) — bu o'zgarish faqat yangi/recrypt yo'liga ta'sir qiladi.
 */
function generateEncryptionKey(): string {
  const bytes = new Uint8Array(8); // 8 bayt -> 16 hex belgi = 16-baytli string
  // react-native-get-random-values global.crypto ni polyfill qiladi.
  (globalThis as any).crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

let initPromise: Promise<void> | null = null;

/**
 * Maxfiy storage'ni shifrlangan holatga keltiradi. Idempotent (bir marta bajariladi).
 * - Keychain'da kalit BOR  → fayl allaqachon shifrlangan, kalit bilan ochamiz.
 * - Keychain'da kalit YO'Q → birinchi marta: kalit yarat → keychain'ga saqla →
 *   mavjud SHIFRLANMAGAN faylni JOYIDA shifrla (recrypt). Foydalanuvchining
 *   token/PIN'i saqlanadi (qayta login SHART EMAS).
 * - Keychain mavjud emas/xato (masalan, native rebuild'dan oldin) → degraded rejim:
 *   shifrlanmagan storage (ilova bricklanmaydi; rebuild'dan keyin shifrlanadi).
 */
export function initSecureStorage(): Promise<void> {
  if (!initPromise) {
    initPromise = doInitSecureStorage();
  }
  return initPromise;
}

async function doInitSecureStorage(): Promise<void> {
  try {
    const existing = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    const wasEncrypted = prefsStorage.getBoolean(SECURE_FLAG) === true;

    // 1) Kalit BOR → shifrlangan store'ni kalit bilan ochamiz (odatiy yo'l).
    if (existing && existing.password) {
      storage = new MMKV({ id: 'storage', encryptionKey: existing.password });
      if (!wasEncrypted) prefsStorage.set(SECURE_FLAG, true);
      return;
    }

    // 2) Kalit YO'Q, lekin flag bor → oldin shifrlangan, kalit YO'QOLGAN (reinstall EMAS;
    //    reinstall'da flag ham o'chardi). Shifrlangan data'ni ochib bo'lmaydi → uni
    //    tozalab, yangi kalit bilan boshlaymiz (recrypt qilib BUZMAYMIZ). Foydalanuvchi
    //    qayta login + PIN o'rnatadi (juda kamdan-kam holat, masalan Keystore reset).
    if (wasEncrypted) {
      const broken = new MMKV({ id: 'storage' });
      broken.clearAll();
      const newKey = generateEncryptionKey();
      await Keychain.setGenericPassword(KEYCHAIN_USERNAME, newKey, {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
      });
      broken.recrypt(newKey);
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
    await Keychain.setGenericPassword(KEYCHAIN_USERNAME, key, {
      service: KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
    legacy.recrypt(key);
    prefsStorage.set(SECURE_FLAG, true);
    storage = legacy;
  } catch (err) {
    // Keychain mavjud emas (rebuild'dan oldin) yoki xato → ilovani bricklamaslik uchun
    // shifrlanmagan fallback. Flag o'rnatilmaydi (rebuild'dan keyin shifrlanadi).
    if (__DEV__) {
      console.warn(
        'Secure storage init failed; using unencrypted fallback:',
        err,
      );
    }
    storage = new MMKV({ id: 'storage' });
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
