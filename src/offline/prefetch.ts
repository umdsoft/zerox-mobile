/**
 * prefetch — "OFLAYN UCHUN TAYYORLASH" (24.10).
 *
 * Muammo: kesh faqat foydalanuvchi OCHGAN sahifalardan to'lardi. Svet/internet o'chganda do'kon
 * hech ochilmagan mijozni oflayn ocholmasdi ("ma'lumot yo'q") — savdo to'xtardi.
 *
 * Yechim: onlayn paytda FONDA (UI'ni bloklamasdan, 2 parallel so'rov) asosiy qarz-daftari
 * javoblari keshga yoziladi (`cacheResponse` — joriy aktor ostida):
 *   1) do'konlar, dashboard, muddati yaqin, qarzlar ro'yxatlari (berish/olish, muddati o'tgan);
 *   2) tanlangan do'kon(lar) mijozlari (berish va olish);
 *   3) AKTIV QARZI BOR mijozlar tarixi — eng ko'p qarzdor birinchi (kesh chegarasiga sig'adigan qadar).
 *
 * Qachon: Qarz daftari dashboard'i ochilganda, ilova oldingi planga qaytganda, oflayn->onlayn
 * o'tishda — aktor+do'kon bo'yicha 30 daqiqada bir marta; muvaffaqiyatli sinxrondan keyin — 2 daqiqada bir.
 * Oflaynda — hech narsa. Xatolar jim yutiladi (bu fon ishi; ekranlar o'z so'rovini baribir qiladi).
 *
 * Xavfsizlik: yugurish boshidagi token/aktor o'zgarsa (logout, xodim rejimiga o'tish) — darhol
 * to'xtaydi: boshqa aktor ma'lumoti hech qachon yangi aktor ostiga yozilmaydi.
 */
import axios from 'axios';
import { AppState, InteractionManager } from 'react-native';
import { URL } from '../screens/constants';
import { storage } from '../store/api/token/getToken';
import { effectiveShopId, getQarzShop } from '../store/api/token/qarzShop';
import { isOnline, subscribeNet } from './netStatus';
import { cacheResponse, currentActor } from './offlineStore';
import {
  buildBaseUrls,
  buildMijozlarUrls,
  HISTORY_BYTE_BUDGET,
  historyCap,
  historyUrl,
  pickHistoryIds,
  pickShopIds,
  PREFETCH_AFTER_SYNC_MS,
  PREFETCH_INTERVAL_MS,
  shopsUrl,
  shouldPrefetch,
  throttleKey,
} from './prefetchPlan';
import { subscribeSync, getSyncStatus } from './syncManager';

export * from './prefetchPlan';

const CONCURRENCY = 2;
const REQUEST_TIMEOUT_MS = 15_000;
const LAST_RUN_PREFIX = 'qd_prefetch_at:';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Body = any;

let running = false;

/** Throttle vaqti — MMKV'da (ilova qayta ochilganda ham saqlanadi; logout'da clearAll o'chiradi). */
const readLastRun = (key: string): number | undefined => {
  try {
    const v = Number(storage.getString(LAST_RUN_PREFIX + key));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  } catch {
    return undefined;
  }
};
const writeLastRun = (key: string, at: number): void => {
  try {
    storage.set(LAST_RUN_PREFIX + key, String(at));
  } catch {
    /* ignore */
  }
};

/** Yugurish konteksti: boshlangandagi token+aktor. O'zgarsa — to'xtatamiz. */
interface RunCtx {
  token: string;
  actor: string;
}

const stillValid = (ctx: RunCtx): boolean => {
  try {
    return isOnline() && storage.getString('token') === ctx.token && currentActor()?.key === ctx.actor;
  } catch {
    return false;
  }
};

/** Bitta GET + keshga yozish. Tarmoq xatosi -> `null` (javob kelgan 4xx/5xx ham `null`). */
async function fetchAndCache(ctx: RunCtx, url: string): Promise<Body | null> {
  if (!stillValid(ctx)) return null;
  try {
    const res = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.token}` },
    });
    if (res.status !== 200 || res.data === undefined) return null;
    // Javob kutilayotganda logout/xodim almashuvi bo'lgan bo'lsa — YOZILMAYDI.
    if (!stillValid(ctx)) return null;
    cacheResponse(url, res.data);
    return res.data;
  } catch {
    return null;
  }
}

/** Past parallellikdagi navbat (UI so'rovlariga joy qoldiradi). */
async function runPool<T>(items: T[], worker: (item: T) => Promise<boolean>): Promise<void> {
  let next = 0;
  let stop = false;
  const lane = async () => {
    while (!stop && next < items.length) {
      const item = items[next++];
      const ok = await worker(item);
      if (!ok) stop = true;
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, lane));
}

async function runPrefetch(ctx: RunCtx): Promise<void> {
  const base = URL;
  const shopId = effectiveShopId();

  // 1) Asosiy ro'yxatlar.
  const baseUrls = buildBaseUrls(base, shopId);
  const results = new Map<string, Body>();
  await runPool(baseUrls, async url => {
    const body = await fetchAndCache(ctx, url);
    if (body !== null) results.set(url, body);
    return stillValid(ctx);
  });
  if (!stillValid(ctx)) return;

  // 2) Mijozlar ro'yxatlari (do'kon tanlovi — xom saqlangan tanlov: QarzDaftariMijozlar shu id bilan ochiladi).
  const shopsBody = results.get(shopsUrl(base));
  const shops = Array.isArray(shopsBody?.data) ? shopsBody.data : [];
  const mijozlarUrls = buildMijozlarUrls(base, pickShopIds(shops, getQarzShop()?.id ?? null));
  const lists: Body[][] = [];
  await runPool(mijozlarUrls, async url => {
    const body = await fetchAndCache(ctx, url);
    if (Array.isArray(body?.data)) {
      lists.push(body.data);
      results.set(url, body);
    }
    return stillValid(ctx);
  });
  if (!stillValid(ctx)) return;

  // 3) Aktiv qarzli mijozlar tarixi — kesh chegarasiga sig'adigan qadar (LRU asosiylarni siqib chiqarmasin).
  const ids = pickHistoryIds(lists, historyCap(results.size));
  let bytes = 0;
  await runPool(ids, async id => {
    if (bytes >= HISTORY_BYTE_BUDGET) return false;
    const body = await fetchAndCache(ctx, historyUrl(base, id));
    if (body !== null) {
      try {
        bytes += JSON.stringify(body).length;
      } catch {
        /* ignore */
      }
    }
    return stillValid(ctx);
  });

  // LRU: tarixlar asosiy ro'yxatlardan KEYIN yozildi — asosiylarni qayta "yangilab" qo'yamiz
  // (tarmoqsiz, xotiradagi javob), shunda ular eng oxirgi ishlatilgan bo'ladi.
  if (!stillValid(ctx)) return;
  results.forEach((body, url) => cacheResponse(url, body));
}

export interface PrefetchOptions {
  /** Throttle oralig'i (standart 30 daqiqa). */
  minIntervalMs?: number;
}

/**
 * Fon tayyorlashni boshlash (idempotent: bir vaqtda bitta yugurish). Hech qachon tashlamaydi.
 * @returns ishga tushdimi (throttle/oflayn bo'lsa `false`).
 */
export function prefetchForOffline(opts: PrefetchOptions = {}): boolean {
  if (running || !isOnline()) return false;
  const actor = currentActor()?.key;
  let token: string | undefined;
  try {
    token = storage.getString('token');
  } catch {
    token = undefined;
  }
  if (!actor || !token) return false;
  const key = throttleKey(actor, effectiveShopId());
  const now = Date.now();
  if (!shouldPrefetch(readLastRun(key), now, opts.minIntervalMs ?? PREFETCH_INTERVAL_MS)) return false;

  running = true;
  writeLastRun(key, now);
  const ctx: RunCtx = { token, actor };
  // Animatsiya/navigatsiya tugagach — ekran ochilishini sekinlashtirmaydi.
  InteractionManager.runAfterInteractions(() => {
    runPrefetch(ctx)
      .catch(() => undefined)
      .finally(() => {
        running = false;
      });
  });
  return true;
}

let started = false;

/**
 * Bir martalik obunalar: ilova oldingi planga qaytganda, oflayn->onlayn o'tishda va
 * muvaffaqiyatli sinxrondan keyin (epoch oshganda) tayyorlash qayta ishga tushadi.
 * Qarz daftari dashboard'i chaqiradi (startOfflineSync'dan keyin).
 */
export function startOfflinePrefetch(): void {
  if (started) return;
  started = true;
  AppState.addEventListener('change', s => {
    if (s === 'active') prefetchForOffline();
  });
  let wasOnline = isOnline();
  subscribeNet(() => {
    const now = isOnline();
    if (now && !wasOnline) prefetchForOffline();
    wasOnline = now;
  });
  let lastEpoch = getSyncStatus().epoch;
  subscribeSync(() => {
    const { epoch, running: syncing } = getSyncStatus();
    if (epoch !== lastEpoch && !syncing) {
      lastEpoch = epoch;
      prefetchForOffline({ minIntervalMs: PREFETCH_AFTER_SYNC_MS });
    }
  });
}
