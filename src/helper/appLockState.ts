/**
 * appLockState.ts — SEC (2026-11-02): qulf holati (MMKV) bilan ishlovchi yordamchilar.
 * Sof qaror mantig'i — helper/appLock.ts.
 */
import { storage } from '../store/api/token/getToken';
import { hasPin } from '../store/api/token/pin';
import { LAST_BACKGROUND_KEY, shouldLockOnReturn } from './appLock';
import { isExternalFlowActive } from './externalFlow';

const PENDING_DEEP_LINK_KEY = 'pendingDeepLink';
const PENDING_NAV_AT_KEY = 'pendingNavigationAt';
/** Qulf ochilmasa kutilayotgan deep-link/bildirishnoma shu vaqtdan keyin eskiradi. */
export const PENDING_TTL_MS = 10 * 60_000;
/** Deep-link orqali (qulfdan keyin) ochilishi mumkin bo'lgan ekranlar. */
const REPLAY_ROUTES = new Set(['Click', 'UserMoneyResult']);

const hasSessionSafe = (): boolean => {
  try {
    return !!storage.getString('token');
  } catch {
    return true; // o'qib bo'lmadi — FAIL-CLOSED
  }
};

/**
 * Ilova hozir qulfdami. `appLocked` bayrog'idan TASHQARI vaqtga ham qaraydi: warm qaytishda
 * Android onNewIntent / iOS openURL / bildirishnoma bosilishi AppState 'active'dan OLDIN kelishi
 * mumkin — shu paytda ham grace o'tgan bo'lsa "qulfda" deb hisoblanadi. Xatoda sessiya bo'lsa true.
 */
export const isAppLocked = (): boolean => {
  try {
    if (storage.getBoolean('appLocked') === true) return true;
    const last = storage.getNumber(LAST_BACKGROUND_KEY);
    if (last == null) return false;
    return shouldLockOnReturn({
      lastBackgroundAt: last,
      now: Date.now(),
      suppressed: isExternalFlowActive(),
      hasSession: !!storage.getString('token'),
      hasPin: hasPin(),
    });
  } catch {
    return hasSessionSafe();
  }
};

/**
 * YANGI JARAYON / yangi UI (telefon qayta yoqildi, OS ilovani o'ldirdi, orqaga bosib chiqilgan):
 * sessiya + PIN bo'lsa ilova DOIM qulfda boshlanadi. Eskirgan fon belgisi, tashqi-oqim bayrog'i,
 * oldingi jarayondan qolgan nav-holat va eskirgan kutilayotgan yo'nalishlar tozalanadi.
 * Xatoda (sessiya bo'lishi mumkin) qulflaydi.
 */
export const applyColdStartLock = (): boolean => {
  try {
    storage.delete(LAST_BACKGROUND_KEY);
    storage.delete('externalFlowUntil');
    storage.delete('preLockNavState');
    storage.delete(PENDING_DEEP_LINK_KEY);
    // Fon handler (index.js) hozirgina yozgan bildirishnoma bosilishi saqlanadi; eskirgani o'chadi.
    const at = storage.getNumber(PENDING_NAV_AT_KEY);
    if (at == null || Date.now() - at > 2 * 60_000 || Date.now() < at) {
      storage.delete('pendingNavigation');
      storage.delete(PENDING_NAV_AT_KEY);
    }
    const lock = !!storage.getString('token') && hasPin();
    if (lock) storage.set('appLocked', true);
    return lock;
  } catch {
    try {
      storage.set('appLocked', true);
    } catch {}
    return true;
  }
};

/** Bildirishnoma BOSILDI (faqat PRESS) — qulf ochilgach Notification ochiladi. */
export const deferNotificationPress = (): void => {
  try {
    storage.set('pendingNavigation', JSON.stringify({ screen: 'NotificationScreen', data: {} }));
    storage.set(PENDING_NAV_AT_KEY, Date.now());
  } catch {}
};

/** Deep-link'dan ekran nomini ajratadi (faqat REPLAY_ROUTES). */
export const routeFromUrl = (url: string): string | null => {
  if (typeof url !== 'string') return null;
  const path = /^https?:\/\//i.test(url)
    ? url.replace(/^https?:\/\/[^/]+\/?/i, '')
    : url.replace(/^[a-z][\w+.-]*:\/\//i, '');
  const seg = path.split(/[/?#]/)[0];
  return REPLAY_ROUTES.has(seg) ? seg : null;
};

/** Qulf paytida kelgan deep-link'ni KEYINGA qoldiradi (tashlab yubormaydi). */
export const deferDeepLink = (url: string): void => {
  try {
    if (!routeFromUrl(url)) return;
    storage.set(PENDING_DEEP_LINK_KEY, JSON.stringify({ url, at: Date.now() }));
  } catch {}
};

/** URL so'rov parametrlari (Click: type/title). */
export const paramsFromUrl = (url: string): Record<string, string> | undefined => {
  const q = url.split('#')[0].split('?')[1];
  if (!q) return undefined;
  const out: Record<string, string> = {};
  q.split('&').forEach(pair => {
    if (!pair) return;
    const i = pair.indexOf('=');
    const dec = (v: string) => {
      try {
        return decodeURIComponent(v.replace(/[+]/g, ' '));
      } catch {
        return v;
      }
    };
    const k = dec(i < 0 ? pair : pair.slice(0, i));
    if (k) out[k] = i < 0 ? '' : dec(pair.slice(i + 1));
  });
  return Object.keys(out).length ? out : undefined;
};

/** Qulf ochilgach: kutilayotgan deep-link (ekran + parametrlar; bir martalik, TTL bilan) yoki null. */
export const consumePendingDeepLink = (
  now: number = Date.now(),
): { route: string; params?: Record<string, string> } | null => {
  try {
    const raw = storage.getString(PENDING_DEEP_LINK_KEY);
    if (!raw) return null;
    storage.delete(PENDING_DEEP_LINK_KEY);
    const v = JSON.parse(raw);
    if (!v || typeof v.at !== 'number' || now - v.at > PENDING_TTL_MS || now < v.at) return null;
    const route = routeFromUrl(v.url);
    return route ? { route, params: paramsFromUrl(v.url) } : null;
  } catch {
    return null;
  }
};
