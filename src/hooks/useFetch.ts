import {useState, useEffect, useCallback, useRef} from 'react';
import axios from 'axios';
import {storage} from '../store/api/token/getToken';

/**
 * SS-PERF (2026-09-25): stale-while-revalidate kesh (30s).
 *  - Bir xil URL yaqinda (<=30s) yuklangan bo'lsa, ekran OCHILISHI BILAN keshdagi
 *    javob ko'rsatiladi (spinner/skeleton yo'q), fonda esa so'rov baribir ketadi va
 *    yangi javob kelgach almashtiriladi. Tarmoq so'rovlari SONI o'zgarmaydi —
 *    faqat ko'rinish tezlashadi (ma'lumot eskirmaydi).
 *  - Bir vaqtning o'zida BIR XIL URL'ga ikki so'rov (masalan ikki ekran/kartochka
 *    `/home/my?type=debitor`) — bitta in-flight so'rov ulashiladi (dedupe).
 *  - `onRefresh({})` avvalgidek majburiy qayta yuklaydi.
 * Kesh xotirada (modul darajasida), logout'da tozalanadi (clearFetchCache).
 */
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, {data: any; ts: number}>();
const inflight = new Map<string, Promise<any>>();

export const clearFetchCache = () => {
  cache.clear();
  inflight.clear();
};

const cacheKey = (url: string, method: string) => `${method}:${url}`;

export const useFetch = ({url, method}) => {
  const m = String(method || 'GET').toUpperCase();
  const initial = url ? cache.get(cacheKey(url, m)) : undefined;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initial ? initial.data : []);
  const [error, setError] = useState(false);
  const [shouldRefresh, onRefresh] = useState({});
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const ApiFetch = useCallback(
    async (signal?: AbortSignal) => {
      const key = cacheKey(url, m);
      const hit = cache.get(key);
      const fresh = !!hit && Date.now() - hit.ts <= CACHE_TTL_MS;
      try {
        if (fresh) {
          // Keshdan darhol ko'rsatamiz; fonda yangilaymiz (loading ko'rsatilmaydi).
          setData(hit!.data);
          setLoading(false);
        } else {
          setLoading(true);
        }
        setError(false);

        let p = inflight.get(key);
        if (!p) {
          const token = storage.getString('token');
          p = axios({
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            url: url,
            method: m,
          })
            .then(res => {
              if (res.status === 200) cache.set(key, {data: res.data, ts: Date.now()});
              return res;
            })
            .finally(() => {
              inflight.delete(key);
            });
          inflight.set(key, p);
        }
        const res = await p;
        // Bekor qilingan (unmount / url o'zgardi) — eski javobni yozmaymiz.
        if (signal?.aborted || !mounted.current) return;
        if (res.status === 200) {
          setData(res.data);
        }
      } catch (err) {
        if (signal?.aborted || !mounted.current) return;
        // Bekor qilingan so'rov (yangi qidiruv boshlandi) — bu xato EMAS, e'tiborsiz.
        if (axios.isCancel(err)) return;
        setError(true);
      } finally {
        if (!signal?.aborted && mounted.current) setLoading(false);
      }
    },
    [m, url],
  );
  useEffect(() => {
    // SS-AUDIT (2026-09-25): bo'sh URL (masalan FinanceDebtDetail ko'zgu qarzda
    // `url: ''`) — so'rov YUBORILMAYDI. Ilgari har mount/fokusda axios({url:''})
    // ketib rad etilar va `error=true` qolib ketardi.
    if (!url) return;
    // C-008: url/method o'zgarganda (har harfda) OLDINGI so'rov natijasi tashlab
    // yuboriladi — eski (sekin) javob yangisining ustiga yozib qo'ymasin (race).
    // Dedupe tufayli so'rovning o'zi ulashilgan bo'lishi mumkin, shuning uchun
    // tarmoqni emas, NATIJANI bekor qilamiz (signal.aborted tekshiruvi).
    const controller = new AbortController();
    ApiFetch(controller.signal);
    return () => controller.abort();
  }, [url, m, shouldRefresh, ApiFetch]);
  return {loading, error, data, onRefresh};
};
