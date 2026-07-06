/**
 * useMyIdSession — MyID sessiyasini OLDINDAN (prefetch) olib, cache'lab beruvchi umumiy hook.
 *
 * Nega kerak: backend MyID sessiya yaratish api.myid.uz'ga 2-3 ketma-ket round-trip qiladi
 * (client access-token → create session → PINFL bind) — bu 4-8s. Agar buni tugma bosilganda
 * qilsak, foydalanuvchi kutadi. Shuning uchun ekran ochilishi bilan OLDINDAN olamiz.
 *
 * MUHIM: bu hook faqat SESSIYA olishni tezlashtiradi. Android'dagi asosiy 10-12s kechikish —
 * MyID capture SDK ichidagi Play Integrity attestatsiyasi — SDK'ning start() ichida bajariladi
 * va JS'dan boshqarib bo'lmaydi (iOS'da yo'q → iOS tez). U production imzo bilan tezlashadi/o'tadi.
 *
 * DIZAYN (poyga/xato-yutish/double-use oldini olish):
 *   - rawFetch() HECH QACHON onError chaqirmaydi va throw qilmaydi; {session} yoki {error}
 *     qaytaradi. In-flight promise'ni prefetch + getSession ulashsa ham, xato natijada bo'ladi —
 *     "silent" bayroq closure'da qotmaydi. Xatoni FAQAT getSession (tugma) ko'rsatadi.
 *   - Bir-martalik sessiya `taken` bayrog'i bilan himoyalanadi (double-use "session already used" yo'q).
 *   - Cache TOKEN bilan kalitlanadi; token o'zgarsa cache+inflight tozalanadi (eski token sessiyasi
 *     qaytmasin).
 *   - IIFE microtask'ga kechiktiriladi (Promise.resolve().then) → inflightRef SINXRON o'rnatiladi;
 *     axios sinxron throw qilsa ham inflightRef qotib qolmaydi (retry mumkin).
 *   - Unmount/token-o'zgarishida in-flight so'rov AbortController bilan bekor qilinadi.
 */
import { useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

export type MyIdSession = { sessionId: string; pinflBound: boolean };

export type MyIdSessionError = {
  httpStatus?: number;
  code?: string; // backend `error` maydoni (invalid-or-expired-token, myid-bind-failed, no-token, canceled...)
  message?: string;
  response?: any; // axios error.response (yoki logic-fail'da {data}) — chaqiruvchi map'i uchun
};

type Options = {
  url: string;
  token?: string;
  body?: Record<string, unknown>; // default { method: 'face' }
  timeoutMs?: number; // default 15000
  onError?: (e: MyIdSessionError) => void; // FAQAT getSession (tugma) yiqilganda
};

type FetchResult = { session?: MyIdSession; error?: MyIdSessionError; taken?: boolean };

const FRESH_MS = 90000; // 90s freshness oynasi

const isCanceled = (err: any) =>
  (axios as any).isCancel?.(err) ||
  err?.name === 'CanceledError' ||
  err?.code === 'ERR_CANCELED';

export function useMyIdSession(opts: Options) {
  const { url, token, timeoutMs = 15000 } = opts;

  const onErrorRef = useRef(opts.onError);
  onErrorRef.current = opts.onError;
  const bodyRef = useRef(opts.body);
  bodyRef.current = opts.body;

  const cacheRef = useRef<{ s: MyIdSession; ts: number; token: string } | null>(null);
  const inflightRef = useRef<Promise<FetchResult> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Bitta so'rov (dedupe). HECH QACHON throw/onError qilmaydi — natijani qaytaradi.
  const rawFetch = useCallback((): Promise<FetchResult> => {
    if (!token) return Promise.resolve({ error: { code: 'no-token' } });
    if (inflightRef.current) return inflightRef.current;

    const controller = new AbortController();
    abortRef.current = controller;

    // Body microtask'da → `inflightRef.current = p` SINXRON o'rnatiladi (sync-throw xavfsiz).
    const p: Promise<FetchResult> = Promise.resolve().then(async () => {
      try {
        const { data } = await axios.post(url, bodyRef.current ?? { method: 'face' }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: timeoutMs,
          signal: controller.signal,
        });
        if (data?.success && data?.sessionId) {
          return { session: { sessionId: data.sessionId, pinflBound: !!data.pinflBound } };
        }
        return { error: { code: data?.error, response: { data } } };
      } catch (err: any) {
        if (isCanceled(err)) return { error: { code: 'canceled' } };
        return {
          error: {
            httpStatus: err?.response?.status,
            code: err?.response?.data?.error,
            message: err?.message,
            response: err?.response,
          },
        };
      } finally {
        if (inflightRef.current === p) inflightRef.current = null;
      }
    });

    inflightRef.current = p;
    return p;
  }, [url, token, timeoutMs]);

  // Prefetch — sessiyani oldindan cache'ga. JIM. `taken`/`!cacheRef` bilan double-use'siz.
  const prefetch = useCallback(() => {
    rawFetch().then(r => {
      if (r.session && !r.taken && !cacheRef.current) {
        cacheRef.current = { s: r.session, ts: Date.now(), token: token as string };
      }
    });
  }, [rawFetch, token]);

  // Ekran ochilishi / token o'zgarishi bilan: eski cache'ni tozalab qayta prefetch; unmount'da abort.
  useEffect(() => {
    cacheRef.current = null; // token o'zgargan bo'lsa eski token sessiyasi qaytmasin
    prefetch();
    return () => {
      abortRef.current?.abort?.();
    };
  }, [prefetch]);

  // Foydalanish: fresh (va SHU token) cache bo'lsa darhol; aks holda yangisini olamiz.
  // Xato bo'lsa onError chaqiriladi (tugma JIM o'lmaydi). Sessiya bir martalik.
  const getSession = useCallback(async (): Promise<MyIdSession | undefined> => {
    const c = cacheRef.current;
    if (c && c.token === token && Date.now() - c.ts < FRESH_MS) {
      cacheRef.current = null;
      return c.s;
    }
    cacheRef.current = null;

    const r = await rawFetch();
    if (r.session) {
      r.taken = true; // prefetch .then endi buni qayta cache'lamaydi
      cacheRef.current = null; // prefetch cache'lagan bo'lsa tozalaymiz (double-use yo'q)
      return r.session;
    }
    if (r.error && r.error.code !== 'canceled') onErrorRef.current?.(r.error);
    return undefined;
  }, [rawFetch, token]);

  return { getSession, prefetch };
}
