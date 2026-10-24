/**
 * prefetchPlan — "oflayn uchun tayyorlash" rejasining SOF qismi (RN/MMKV'siz, testlanadi).
 *
 * URL'lar ekranlardagi `useQarzFetch` URL'lari bilan AYNAN bir xil yasaladi — kesh kaliti
 * (`normalizeUrl`: host va `_=` olib tashlanadi, query tartiblanadi) mos kelishi shart, aks holda
 * oflaynda ekran keshni topa olmaydi:
 *   QarzDaftari.tsx          -> /qarz-daftari/savdo-faoliyat, /dashboard{shopQs}, /near-expiration{shopQs}
 *   QarzDaftariQarzlar.tsx   -> /qarz-daftari/qarzlar?turi=..[&status=muddati-otgan][&faoliyat_id=..]
 *   QarzDaftariMijozlar.tsx  -> /qarz-daftari/savdo-faoliyat/:fid/mijozlar?turi=..
 *   QarzDaftariMijoz.tsx     -> /qarz-daftari/mijozlar/:id/history
 */
import { CACHE_LIMITS } from './responseCache';

export type Turi = 'berish' | 'olish';
const TURLAR: Turi[] = ['berish', 'olish'];

/** Bir yugurishda keshga yoziladigan mijoz tarixlari soni (yuqori chegara). */
export const HISTORY_CAP = 300;
/** Kesh yozuvlari chegarasidan (250) boshqa ekranlar (kvitansiya, qarz tafsiloti...) uchun zaxira. */
export const RESERVED_ENTRIES = 60;
/** Tarixlar uchun taxminiy bayt byudjeti (kesh jami 6 MB — LRU kerakli yozuvlarni siqib chiqarmasin). */
export const HISTORY_BYTE_BUDGET = 4 * 1024 * 1024;
/** Oddiy chastota: aktor+do'kon bo'yicha 30 daqiqada bir marta. */
export const PREFETCH_INTERVAL_MS = 30 * 60 * 1000;
/** Muvaffaqiyatli sinxrondan keyin — tezroq (lekin ketma-ket sinxronlarda takrorlanmasin). */
export const PREFETCH_AFTER_SYNC_MS = 2 * 60 * 1000;
/** USD qoldig'ini "eng ko'p qarzdor" saralashda UZS bilan solishtirish uchun taxminiy kurs. */
const USD_WEIGHT = 12_500;

/** `shopQuery()` bilan bir xil bo'lak: `faoliyat_id=5` (yoki bo'sh). */
const shopPart = (shopId: number | null): string => (shopId ? `faoliyat_id=${shopId}` : '');

/** QarzDaftariQarzlar bilan AYNAN bir xil tartibda query yig'iladi (turi, status, do'kon). */
export function qarzlarUrl(base: string, turi: Turi, status: string | undefined, shopId: number | null): string {
  const qs = [`turi=${turi}`, status ? `status=${status}` : '', shopPart(shopId)].filter(Boolean).join('&');
  return `${base}/qarz-daftari/qarzlar?${qs}`;
}

export const mijozlarUrl = (base: string, faoliyatId: number | string, turi: Turi): string =>
  `${base}/qarz-daftari/savdo-faoliyat/${faoliyatId}/mijozlar?turi=${turi}`;

export const historyUrl = (base: string, mijozId: number | string): string =>
  `${base}/qarz-daftari/mijozlar/${mijozId}/history`;

export const shopsUrl = (base: string): string => `${base}/qarz-daftari/savdo-faoliyat`;

/**
 * 1-bosqich: do'kon ro'yxatiga bog'liq bo'lmagan URL'lar.
 * @param shopId `effectiveShopId()` — dashboard/qarzlar filtri (xodim sessiyasida null).
 */
export function buildBaseUrls(base: string, shopId: number | null): string[] {
  const q = shopId ? `?${shopPart(shopId)}` : '';
  const urls = [shopsUrl(base), `${base}/qarz-daftari/dashboard${q}`, `${base}/qarz-daftari/near-expiration${q}`];
  for (const turi of TURLAR) {
    urls.push(qarzlarUrl(base, turi, undefined, shopId));
    urls.push(qarzlarUrl(base, turi, 'muddati-otgan', shopId));
  }
  return urls;
}

/**
 * Mijozlar ro'yxati qaysi do'konlar uchun olinadi: tanlangan do'kon (ro'yxatda bo'lsa) —
 * aks holda (tanlov yo'q / 2+ do'kon) barcha do'konlar, `maxShops` gacha.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pickShopIds(shops: any[], selectedId: number | null, maxShops = 5): number[] {
  const ids = (Array.isArray(shops) ? shops : [])
    .map(s => Number(s?.id))
    .filter(n => Number.isFinite(n) && n > 0);
  if (selectedId && ids.includes(selectedId)) return [selectedId];
  return Array.from(new Set(ids)).slice(0, maxShops);
}

export function buildMijozlarUrls(base: string, shopIds: number[]): string[] {
  return shopIds.flatMap(fid => TURLAR.map(turi => mijozlarUrl(base, fid, turi)));
}

/**
 * 2-bosqich: aktiv qarzi bor mijozlar (barcha mijozlar ro'yxatlaridan, takrorsiz) —
 * eng ko'p qarzdor birinchi, teng bo'lsa yangisi (katta id) birinchi. `cap` gacha.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pickHistoryIds(lists: any[][], cap: number): number[] {
  const best = new Map<number, number>();
  for (const list of lists) {
    for (const c of Array.isArray(list) ? list : []) {
      const id = Number(c?.id);
      if (!Number.isFinite(id) || id <= 0) continue; // temp (manfiy) id — serverda yo'q
      const uzs = Number(c?.qoldiq_uzs || 0);
      const usd = Number(c?.qoldiq_usd || 0);
      const active = Number(c?.aktiv_qarz_soni || 0) > 0 || uzs > 0 || usd > 0;
      if (!active) continue;
      const weight = uzs + usd * USD_WEIGHT;
      best.set(id, Math.max(best.get(id) ?? 0, weight));
    }
  }
  return Array.from(best.entries())
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])
    .slice(0, Math.max(0, cap))
    .map(([id]) => id);
}

/** Kesh chegarasiga sig'adigan tarixlar soni (1-bosqich yozuvlari va zaxira hisobga olinadi). */
export const historyCap = (phase1Count: number, maxEntries: number = CACHE_LIMITS.maxEntries): number =>
  Math.max(0, Math.min(HISTORY_CAP, maxEntries - phase1Count - RESERVED_ENTRIES));

/** Throttle kaliti: aktor + do'kon. */
export const throttleKey = (actor: string, shopId: number | null): string => `${actor}|${shopId ?? 'all'}`;

/** Oxirgi yugurishdan `minIntervalMs` o'tganmi (soat orqaga ketgan bo'lsa ham — ishlaydi). */
export const shouldPrefetch = (lastAt: number | undefined, now: number, minIntervalMs: number): boolean =>
  !lastAt || now < lastAt || now - lastAt >= minIntervalMs;
