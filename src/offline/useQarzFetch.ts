/**
 * useQarzFetch — Qarz daftari ekranlari uchun CACHE-FIRST `useFetch` o'rnini bosuvchi.
 *
 * Qaytaradi: `useFetch` bilan bir xil `{ loading, error, data, onRefresh }` (+ `offline`, `fromCache`,
 * `savedAt`) — ekranlar minimal o'zgarish bilan ko'chadi.
 *
 *  1. Ochilishi bilan DOIMIY keshdagi javob ko'rsatiladi (aktor bo'yicha, shifrlangan).
 *  2. Onlayn — serverdan yangilanadi, 200 javob keshga yoziladi.
 *  3. Tarmoq xatosi / oflayn — kesh ko'rsatilaveradi; `error` faqat hech narsa bo'lmasa.
 *  4. URL'da hali server id olmagan temp (manfiy) id — tarmoqqa chiqilmaydi, ma'lumot lokal sintez.
 *  5. Navbatdagi amallar har doim ustiga proyeksiya qilinadi (`_offline` belgili yozuvlar).
 *  6. Muvaffaqiyatli sinxrondan keyin (epoch) va oflayn->onlayn o'tishda avtomatik qayta yuklanadi.
 */
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { storage } from '../store/api/token/getToken';
import { useOutboxState } from './hooks';
import { isOnline, reportApiResult, useIsOnline } from './netStatus';
import { currentActor, currentOwnerName, getOutbox, responseCache } from './offlineStore';
import { opsForProjection, project, rewriteTempUrl } from './projection';
import { startOfflineSync, useSyncStatus } from './syncManager';
import { ACTIVE_STATUSES } from './types';

// Server JSON'i dinamik (ekranlar `data?.data` ni o'qiydi).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Body = any;

interface Options {
  url: string;
  method?: string;
}

interface Entry {
  url: string;
  body: Body;
  at: number;
  fromCache: boolean;
}

export interface QarzFetchResult {
  loading: boolean;
  error: boolean;
  data: Body;
  onRefresh: (v?: unknown) => void;
  offline: boolean;
  fromCache: boolean;
  savedAt: number | null;
}

export function useQarzFetch({ url }: Options): QarzFetchResult {
  useEffect(() => {
    startOfflineSync();
  }, []);
  const online = useIsOnline();
  const outboxState = useOutboxState();
  const { epoch } = useSyncStatus();
  const actor = currentActor()?.key || '';

  // Temp id xaritalangan bo'lsa URL qayta yoziladi (xarita o'zgarganda qayta hisoblanadi).
  const { url: effUrl, unresolved } = useMemo(
    () => (url ? rewriteTempUrl(url, id => getOutbox().resolveId(id)) : { url: '', unresolved: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, outboxState.idMap],
  );

  const [entry, setEntry] = useState<Entry | null>(() => {
    const hit = effUrl && !unresolved && actor ? responseCache.get(actor, effUrl) : null;
    return hit ? { url: effUrl, body: hit.data, at: hit.savedAt, fromCache: true } : null;
  });
  const [loading, setLoading] = useState(false);
  const [netError, setNetError] = useState(false);
  const [tick, setTick] = useState(0);

  // Effekt ichida eng so'nggi qiymat (effektni qayta ishga tushirmasdan).
  const entryRef = useRef<Entry | null>(entry);
  entryRef.current = entry;
  const mounted = useRef(true);
  useEffect(() => {
    // StrictMode / Fast Refresh: cleanup'dan keyin effekt qayta ishlaganda bayroq tiklansin.
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const onRefresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!effUrl) return;
    let cancelled = false;
    const cached = !unresolved && actor ? responseCache.get(actor, effUrl) : null;
    const sameUrlFresh = (e: Entry | null) => !!e && e.url === effUrl && !e.fromCache;

    // Shu URL uchun yangi (server) ma'lumot bo'lsa — saqlanadi; aks holda kesh (yoki bo'sh).
    setEntry(prev => {
      if (sameUrlFresh(prev)) return prev;
      if (cached) return { url: effUrl, body: cached.data, at: cached.savedAt, fromCache: true };
      return prev && prev.url === effUrl ? prev : null;
    });

    if (unresolved || !isOnline()) {
      setLoading(false);
      setNetError(!cached && !unresolved && entryRef.current?.url !== effUrl);
      return;
    }
    setLoading(!cached && entryRef.current?.url !== effUrl);
    setNetError(false);
    const token = storage.getString('token');
    axios({ url: effUrl, method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
      .then(res => {
        if (cancelled || !mounted.current) return;
        reportApiResult(true);
        if (res.status === 200) {
          setEntry({ url: effUrl, body: res.data, at: Date.now(), fromCache: false });
          if (actor) responseCache.set(actor, effUrl, res.data);
        }
      })
      .catch(err => {
        if (cancelled || !mounted.current || axios.isCancel(err)) return;
        reportApiResult(!!err?.response);
        // Kesh (yoki oldingi ma'lumot) bo'lsa — o'shani ko'rsatamiz; yo'q bo'lsa xato.
        setNetError(!cached && entryRef.current?.url !== effUrl);
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `online` — oflayn->onlayn o'tishda qayta yuklash; `epoch` — sinxrondan keyin serverdan yangilash.
  }, [effUrl, unresolved, actor, tick, online, epoch]);

  const current = entry && entry.url === effUrl ? entry : null;
  const base = current ? current.body : null;
  const baseAt = current ? current.at : 0;

  const data = useMemo(() => {
    if (!url) return [];
    const ops = opsForProjection(
      outboxState.ops.filter(o => o.actor === actor && (ACTIVE_STATUSES.has(o.status) || o.status === 'done')),
      baseAt,
    );
    const projected = project(effUrl || url, base, {
      ops,
      resolve: id => getOutbox().resolveId(id),
      now: Date.now(),
      ownerName: currentOwnerName(),
    });
    // useFetch bilan mos: ma'lumot yo'q bo'lsa [] (ekranlar `data?.data` ni o'qiydi).
    return projected === null || projected === undefined ? [] : projected;
  }, [url, effUrl, base, baseAt, outboxState, actor]);

  const hasData = Array.isArray(data) ? data.length > 0 : !!data;
  return {
    loading,
    // Temp id URL'i, lekin uni yaratuvchi amal yo'q (bekor qilingan) — "topilmadi" (abadiy spinner emas).
    error: (netError || unresolved) && !hasData,
    data,
    onRefresh,
    offline: !online,
    fromCache: !!current?.fromCache,
    savedAt: current?.fromCache ? current.at : null,
  };
}
