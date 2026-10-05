/**
 * homeCache.ts — SS-DEV (2026-10-05): bosh sahifa DARHOL ochilishi.
 *
 * Muammo: login yoki PIN'dan keyin bosh sahifada 1–2 s spinner aylanar, ism va
 * qarzlar 0 bo'lib turardi (barcha ma'lumot faqat bosh sahifa mount bo'lgandan
 * keyin so'ralardi).
 *
 * Yechim:
 *  (a) Oxirgi muvaffaqiyatli bosh sahifa ma'lumotlari (user, /home/my,
 *      analytics, bildirishnomalar boshi, qarz-daftari dashboard, shaxsiy qarz
 *      stats) SHIFRLANGAN MMKV'da FOYDALANUVCHI ID bo'yicha saqlanadi va ekran
 *      ochilishi bilan ko'rsatiladi; fonda yangilanadi (stale-while-revalidate).
 *  (b) `warmHome()` — login javobi kelishi bilan yoki PIN ekrani ochilishi bilan
 *      so'rovlarni OLDINDAN boshlaydi; bosh sahifa mount'idagi so'rovlar ular
 *      bilan ulashiladi (HomeApi `dedupe`, useFetch inflight) — dublikat yo'q.
 *  Kalit `user_id` — boshqa foydalanuvchi keshi hech qachon o'qilmaydi;
 *  forceLogout `clearHomeCache()` + `storage.clearAll()` bilan tozalaydi.
 *
 * Aylanma import bo'lmasligi uchun Store `require` bilan kech olinadi.
 */
import { storage } from '../store/api/token/getToken';
import { URL } from '../screens/constants';
import { ownShopQuery } from '../store/api/token/qarzShop';
import { prefetchFetch, primeFetchCache } from '../hooks/useFetch';

const PREFIX = 'homeCache:v1:';
const MAX_BILD = 120; // badge "99+" dan oshmaydi; so'nggi amaliyotlar uchun yetarli

export type HomeSnapshot = {
  ts: number;
  user: any;
  home: any;
  analytics: any;
  bild: any[];
  fetch: Record<string, any>; // useFetch URL -> javob
};

export const homeDashboardUrl = () =>
  `${URL}/qarz-daftari/dashboard${ownShopQuery('?')}`;
export const homeDebtStatsUrl = () => `${URL}/finance/debts/stats`;

const currentUid = (): string | undefined => {
  try {
    return storage?.getString('user_id') || undefined;
  } catch {
    return undefined;
  }
};

export const readHomeSnapshot = (): HomeSnapshot | null => {
  const uid = currentUid();
  if (!uid) return null;
  try {
    const raw = storage.getString(PREFIX + uid);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    return snap && typeof snap === 'object' ? snap : null;
  } catch {
    return null;
  }
};

/** Snapshot faqat JORIY user_id uchun yoziladi (uidAtStart bilan mos bo'lsa). */
export const saveHomeSnapshot = (
  uidAtStart: string | undefined,
  snap: Omit<HomeSnapshot, 'ts'>,
) => {
  const uid = currentUid();
  if (!uid || uid !== uidAtStart) return;
  try {
    const bild = Array.isArray(snap.bild) ? snap.bild.slice(0, MAX_BILD) : [];
    storage.set(
      PREFIX + uid,
      JSON.stringify({ ...snap, bild, ts: Date.now() }),
    );
  } catch {}
};

export const clearHomeCache = () => {
  try {
    for (const k of storage.getAllKeys()) {
      if (k.startsWith(PREFIX)) storage.delete(k);
    }
  } catch {}
};

/** MMKV snapshot -> useFetch xotira keshi (render'dan OLDIN chaqirish xavfsiz). */
export const primeHomeFetchCache = (snap: HomeSnapshot | null = readHomeSnapshot()) => {
  if (!snap?.fetch) return;
  for (const [url, data] of Object.entries(snap.fetch)) {
    primeFetchCache(url, data);
  }
};

/** MMKV snapshot -> Redux (faqat redux bo'sh bo'lsa). true = ma'lumot qo'yildi. */
export const hydrateHomeFromCache = (dispatch?: (a: any) => any): boolean => {
  const snap = readHomeSnapshot();
  if (!snap) return false;
  primeHomeFetchCache(snap);
  try {
    const d = dispatch || require('../store/store/Store').Store.dispatch;
    const { hydrateHome } = require('../store/reducers/HomeReducer');
    d(
      hydrateHome({
        user: snap.user,
        home: snap.home,
        analytics: snap.analytics,
        bild: snap.bild,
      }),
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Login/PIN vaqtida chaqiriladi: keshdan to'ldiradi va bosh sahifa so'rovlarini
 * oldindan (parallel) boshlaydi. Xatolar jim — bosh sahifa o'zi qayta urinadi.
 */
export const warmHome = () => {
  try {
    if (!storage?.getString('token')) return;
    const { Store } = require('../store/store/Store');
    const { HomeApi } = require('../store/api/home');
    hydrateHomeFromCache(Store.dispatch);
    Promise.resolve(Store.dispatch(HomeApi({ page: 1, dedupe: true }))).catch(
      () => {},
    );
    prefetchFetch(homeDashboardUrl());
    prefetchFetch(homeDebtStatsUrl());
  } catch {}
};
