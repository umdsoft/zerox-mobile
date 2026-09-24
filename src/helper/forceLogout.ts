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
 * SS-AUDIT (2026-09-25): endi bu YAGONA logout yo'li — UserScreen'dagi oddiy
 * chiqish ham shu funksiyani (`reason: 'user'`) chaqiradi. Ilgari ikki nusxa
 * bor edi va majburiy chiqishda socket UZILMAS (keyingi login eski
 * foydalanuvchi socketida ishlardi), FCM token o'chirilmas, badge nollanmasdi.
 *
 * Qiladi:
 *   1) socket uzish, FCM tokenni o'chirish (fire-and-forget), badge = 0
 *   2) MMKV tozalash (token/refreshToken/PIN/user_id...)
 *   3) Redux BARCHA slice'larni boshlang'ich holatga ('RESET_STORE')
 *   4) Drawer yopish + navigatsiyani SelectLanguageScreen ga reset
 *   5) Sabab haqida toast (foydalanuvchi o'zi chiqsa — yo'q)
 *
 * Aylanma import bo'lmasligi uchun Store/navigation/socket `require` bilan kech
 * olinadi (authInterceptor -> forceLogout -> Store -> reducers -> ... zanjiri uzilmasin).
 */
import Toast from 'react-native-toast-message';
import i18next from 'i18next';
import { Platform } from 'react-native';
import { storage } from '../store/api/token/getToken';

export type ForceLogoutReason = 'revoked' | 'refresh-failed' | 'user';

let inProgress = false;

/** Qaytgan promise FCM tokenni o'chirish tugaganda hal bo'ladi (xato bo'lsa ham). */
export const forceLogout = (reason: ForceLogoutReason = 'revoked'): Promise<void> => {
  if (inProgress) return Promise.resolve();
  inProgress = true;
  let fcm: Promise<void> = Promise.resolve();
  try {
    // 1) Socket — eski foydalanuvchi socketi jonli qolmasin (HomeRedesign init()
    //    "Online" ko'rib o'tkazib yuborardi -> boshqa akkaunt xonasiga ulanib qolardi).
    try {
      require('./socketService').default?.disconnect?.();
    } catch {}
    // FCM token — bu qurilmaga oldingi foydalanuvchining push'lari kelmasin.
    try {
      const messaging = require('@react-native-firebase/messaging').default;
      fcm = Promise.resolve(messaging().deleteToken()).then(() => undefined, () => undefined);
    } catch {}
    // Badge = 0.
    try {
      if (Platform.OS === 'ios') {
        require('@notifee/react-native').default.setBadgeCount(0).catch(() => {});
      } else {
        require('../nativemodule/notificationBadge').NotificationBadgeModule?.setBadgeOnlyNumber?.(0);
      }
    } catch {}
    // 2) MMKV
    try {
      storage.clearAll();
    } catch {}
    // 3) Redux
    try {
      const { Store } = require('../store/store/Store');
      Store.dispatch({ type: 'RESET_STORE' });
    } catch {}
    // 4) Navigatsiya: avval drawer (reset faqat Stack'ga ta'sir qiladi, ochiq
    //    menyu qulf/til ekrani ustida osilib qolardi), so'ng reset.
    try {
      const { navigationRef } = require('../navigation/NavigationRef');
      const ref: any = navigationRef?.current;
      if (ref?.dispatch) {
        try {
          const { DrawerActions } = require('@react-navigation/native');
          ref.dispatch(DrawerActions.closeDrawer());
        } catch {}
      }
      if (ref?.reset) {
        ref.reset({ index: 0, routes: [{ name: 'SelectLanguageScreen' }] });
      }
    } catch {}
    // 5) Toast
    if (reason !== 'user') {
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
    }
  } finally {
    // Qayta login qilingach yana ishlashi uchun bayroqni bo'shatamiz. Kech kelgan
    // ESKI so'rov javobi yangi sessiyani o'chirmasligi authInterceptor'da
    // (`requestUsesCurrentToken`) tekshiriladi.
    setTimeout(() => {
      inProgress = false;
    }, 3000);
  }
  return fcm;
};

/** 401 javobi "sessiya bekor qilingan" holatimi? (backend middleware/auth.js) */
export const isSessionRevokedError = (error: any): boolean => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  return status === 401 && code === 'SESSION_REVOKED';
};
