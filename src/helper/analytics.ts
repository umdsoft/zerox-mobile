/**
 * Firebase Analytics — yagona kirish nuqtasi (16.10).
 *
 * Qoidalar:
 *  - Analytics xatosi HECH QACHON ilova oqimini buzmaydi (hamma chaqiruv try/catch, fire-and-forget).
 *  - Shaxsiy ma'lumot (telefon, ism, PINFL, summa matni) YUBORILMAYDI — faqat ichki foydalanuvchi id'si
 *    va ekran / hodisa nomlari. Google Play "Ma'lumotlar xavfsizligi" deklaratsiyasi shunga mos bo'lishi kerak.
 *  - Ekranlar avtomatik: NavigationContainer `onStateChange` → `trackScreen` (index.js).
 */
import { getAnalytics, logEvent, logScreenView, setUserId } from '@react-native-firebase/analytics';

type Params = Record<string, string | number | boolean>;

const safe = (fn: () => Promise<unknown>) => {
  try {
    fn().catch(() => {});
  } catch {
    // jim: analytics ixtiyoriy
  }
};

/** Firebase hodisa nomi: faqat [a-zA-Z0-9_], harf bilan boshlanadi, ≤40 belgi. */
const eventName = (name: string) =>
  String(name).replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z]+/, '').slice(0, 40) || 'event';

let lastScreen: string | null = null;

/** Joriy ekran (takror yozilmaydi). */
export const trackScreen = (screenName?: string | null) => {
  if (!screenName || screenName === lastScreen) return;
  lastScreen = screenName;
  safe(() => logScreenView(getAnalytics(), { screen_name: screenName, screen_class: screenName }));
};

/** Biznes hodisa (masalan `debt_created`). Parametrlarda shaxsiy ma'lumot bo'lmasin. */
export const trackEvent = (name: string, params?: Params) => {
  safe(() => logEvent(getAnalytics(), eventName(name), params));
};

/** Kirgan foydalanuvchi (ichki id) yoki chiqish (`null`). */
export const setAnalyticsUser = (userId?: number | string | null) => {
  safe(() => setUserId(getAnalytics(), userId == null ? null : String(userId)));
};
