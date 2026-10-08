/**
 * passwordChangeSession.ts — 08.10: foydalanuvchi O'Z parolini o'zgartirgandan keyin
 * sessiyani jim davom ettirish.
 *
 * ILDIZ: backend `/user/edit/password` muvaffaqiyatda `bumpAuthVersion` chaqiradi —
 * foydalanuvchining BARCHA sessiyalari (shu qurilma ham) bekor qilinadi. Keyingi
 * har qanday so'rov 401 `SESSION_REVOKED` oladi -> authInterceptor -> forceLogout('revoked')
 * -> "Sessiya boshqa qurilmadan tugatildi" qizil toast'i. Aslida sessiyani foydalanuvchining
 * o'zi (parol almashtirib) tugatgan.
 *
 * YECHIM:
 *   1) so'rovdan OLDIN `beginOwnPasswordChange()` — shu oraliqda kelgan SESSION_REVOKED /
 *      refresh rad etilishi "boshqa qurilma" deb hisoblanmaydi (authInterceptor kutadi);
 *   2) muvaffaqiyatda `resumeSessionAfterPasswordChange()`:
 *        a) javobda yangi tokenlar bo'lsa — saqlaymiz (login bilan AYNAN bir xil MMKV kalitlari);
 *        b) bo'lmasa — yangi parol bilan jim qayta login (/user/login);
 *        c) ikkalasi ham bo'lmasa — neytral xabar bilan login ekraniga ('password-changed').
 *   3) xato/rad javobida `cancelOwnPasswordChange()` — eski sessiya o'z kuchida.
 *
 * Haqiqiy "boshqa qurilmadan tugatildi" holati o'zgarmaydi: bayroq faqat shu oqim
 * davomida va undan keyingi qisqa (OWN_CHANGE_GRACE_MS) oynada amal qiladi.
 *
 * Aylanma import bo'lmasligi uchun authInterceptor/forceLogout `require` bilan kech olinadi.
 */
import axios from 'axios';
import { Platform } from 'react-native';
import { URL } from '../screens/constants';
import { storage } from '../store/api/token/getToken';

/** 08.10: parol o'zgartirish endpointi — uning O'Z 401 javobi o'zini kutmasligi uchun. */
export const OWN_PASSWORD_CHANGE_PATH = '/user/edit/password';

/** 08.10: muvaffaqiyatdan keyin kech kelgan eski-token javoblari uchun himoya oynasi. */
const OWN_CHANGE_GRACE_MS = 20 * 1000;
const RELOGIN_TIMEOUT_MS = 15000;

export type SessionTokens = { token: string; refreshToken: string | null };

let pending: Promise<string | null> | null = null;
let resolvePending: ((token: string | null) => void) | null = null;
let settledAt = 0;

const settle = (token: string | null): void => {
  if (resolvePending) resolvePending(token);
  resolvePending = null;
  settledAt = Date.now();
};

/** 08.10: parol o'zgartirish so'rovi yuborilishidan OLDIN chaqiriladi. */
export const beginOwnPasswordChange = (): void => {
  if (resolvePending) resolvePending(null);
  pending = new Promise<string | null>(resolve => {
    resolvePending = resolve;
  });
  settledAt = 0;
};

/** 08.10: so'rov rad etildi/xato — eski sessiya o'z kuchida, bayroq darhol tushiriladi. */
export const cancelOwnPasswordChange = (): void => {
  settle(null);
  pending = null;
  settledAt = 0;
};

/** 08.10: o'z parolimizni o'zgartirish oqimi davom etmoqdami (yoki yaqinda tugadimi). */
export const isOwnPasswordChangeActive = (): boolean => {
  if (!pending) return false;
  if (resolvePending) return true;
  return Date.now() - settledAt < OWN_CHANGE_GRACE_MS;
};

/** 08.10: oqim natijasini kutish — yangi access token yoki null. */
export const waitForOwnPasswordChange = (): Promise<string | null> =>
  isOwnPasswordChangeActive() && pending ? pending : Promise.resolve(null);

const pickString = (...values: unknown[]): string | null => {
  const found = values.find(v => typeof v === 'string' && v.trim().length > 0);
  return typeof found === 'string' ? found : null;
};

/**
 * 08.10: javobdan tokenlarni ajratish — keng tarqalgan nomlar, ham `data.*`, ham top-level:
 * access_token | accessToken | token, refresh_token | refreshToken.
 */
export const extractSessionTokens = (payload: any): SessionTokens | null => {
  const sources = [payload?.data, payload];
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    const token = pickString(src.access_token, src.accessToken, src.token);
    if (token) {
      return { token, refreshToken: pickString(src.refresh_token, src.refreshToken) };
    }
  }
  return null;
};

/** 08.10: yangi parol bilan jim qayta login (LoginWithPhone bilan bir xil so'rov). */
const silentRelogin = async (newPassword: string): Promise<SessionTokens | null> => {
  const phone = storage.getString('phoneNumber');
  if (!phone || !newPassword) return null;
  try {
    const { data } = await axios.post(
      URL + '/user/login',
      {
        phone: '+998' + phone,
        password: newPassword,
        device: Platform.OS === 'ios' ? 'iOS' : 'Android',
      },
      { timeout: RELOGIN_TIMEOUT_MS },
    );
    if (!data?.success) return null;
    return extractSessionTokens(data);
  } catch {
    return null;
  }
};

/**
 * 08.10: parol muvaffaqiyatli o'zgartirilgach chaqiriladi. true — sessiya jim davom etdi;
 * false — neytral xabar bilan login ekraniga yo'naltirildi.
 */
export const resumeSessionAfterPasswordChange = async (
  responseData: any,
  newPassword: string,
): Promise<boolean> => {
  const tokens = extractSessionTokens(responseData) || (await silentRelogin(newPassword));
  if (tokens) {
    try {
      require('../store/api/authInterceptor').applySessionTokens(
        tokens.token,
        tokens.refreshToken,
      );
      settle(tokens.token);
      return true;
    } catch {
      // saqlab bo'lmadi — pastdagi neytral chiqishga o'tamiz
    }
  }
  settle(null);
  require('./forceLogout').forceLogout('password-changed');
  return false;
};
