/**
 * forceLogout.ts — SS-DEV (2026-09-23): sessiya SERVER tomonidan bekor qilinganda
 * (masalan "Ulangan qurilmalar"da shu qurilma boshqa qurilmadan TUGATILGANDA)
 * ilovani majburiy chiqarish.
 *
 * Nega kerak: ilgari qurilma tugatilsa ham mobil ilova shaxsiy kabinetda
 * ishlayverardi — access token 30 daqiqa yashar, socket ulanib turar, 401
 * kelganda esa faqat "token expired" holati ishlov ko'rardi. Endi backend
 * 401 + code:'SESSION_REVOKED' qaytaradi va socket orqali 'session_revoked'
 * yuboradi; ikkalasi ham shu funksiyaga keladi.
 *
 * Qiladi (UserScreen'dagi oddiy logout bilan bir xil tartibda):
 *   1) MMKV tozalash (token/refreshToken/PIN/user_id...)
 *   2) Redux BARCHA slice'larni boshlang'ich holatga ('RESET_STORE')
 *   3) Navigatsiyani SelectLanguageScreen ga reset (login oqimi boshidan)
 *   4) Foydalanuvchiga sabab haqida toast
 *
 * Aylanma import bo'lmasligi uchun Store/navigation `require` bilan kech olinadi
 * (authInterceptor -> forceLogout -> Store -> reducers -> ... zanjiri uzilmasin).
 */
import Toast from 'react-native-toast-message';
import i18next from 'i18next';
import { storage } from '../store/api/token/getToken';

let inProgress = false;

export const forceLogout = (reason: 'revoked' | 'refresh-failed' = 'revoked'): void => {
  if (inProgress) return;
  inProgress = true;
  try {
    try {
      storage.clearAll();
    } catch {}
    try {
      const { Store } = require('../store/store/Store');
      Store.dispatch({ type: 'RESET_STORE' });
    } catch {}
    try {
      const { navigationRef } = require('../navigation/NavigationRef');
      const ref: any = navigationRef?.current;
      if (ref?.reset) {
        ref.reset({ index: 0, routes: [{ name: 'SelectLanguageScreen' }] });
      }
    } catch {}
    try {
      Toast.show({
        autoHide: true,
        visibilityTime: 4500,
        position: 'bottom',
        type: 'error2',
        props: {
          desc: i18next.t(
            reason === 'revoked'
              ? 'Sessiya boshqa qurilmadan tugatildi. Iltimos, qayta kiring.'
              : 'Sessiya muddati tugadi. Iltimos, qayta kiring.',
          ),
        },
      });
    } catch {}
  } finally {
    // Qayta login qilingach yana ishlashi uchun bayroqni bo'shatamiz.
    setTimeout(() => {
      inProgress = false;
    }, 3000);
  }
};

/** 401 javobi "sessiya bekor qilingan" holatimi? (backend middleware/auth.js) */
export const isSessionRevokedError = (error: any): boolean => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  return status === 401 && code === 'SESSION_REVOKED';
};
