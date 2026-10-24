/**
 * qarzGet — imperativ (hook'siz) cache-first GET: `axios.get` bilan yuklaydigan qarz-daftari
 * joylari uchun (masalan amaliyot tafsiloti). useQarzFetch bilan bir xil qoida:
 * onlayn -> server (keshga yoziladi), tarmoq xatosi/oflayn -> kesh; temp id -> lokal sintez;
 * natijaga navbatdagi amallar proyeksiya qilinadi. Hech narsa bo'lmasa — asl xato tashlanadi.
 *
 * 24.10: kesh (yoki hosil qilingan javob) bo'lsa tarmoq so'rovi QISQA (5 s, GET retry'siz) — internetsiz
 * Wi-Fi'da ~30 s kutilmaydi; javob kelmasa kesh qaytariladi.
 */
import axios, { AxiosRequestConfig } from 'axios';
import { storage } from '../store/api/token/getToken';
import { isOnline, reportApiResult } from './netStatus';
import { CACHED_REFRESH_TIMEOUT_MS, cachedLookup, cachedOrDerived, currentActor, currentOwnerName, getOutbox, responseCache } from './offlineStore';
import { opsForProjection, project, rewriteTempUrl } from './projection';
import { ACTIVE_STATUSES } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function qarzGet(url: string): Promise<any> {
  const ob = getOutbox();
  const actor = currentActor()?.key || '';
  const { url: effUrl, unresolved } = rewriteTempUrl(url, id => ob.resolveId(id));
  const cached = !unresolved && actor ? cachedOrDerived(actor, effUrl) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let base: any = null;
  let baseAt = 0;
  let lastErr: unknown = null;

  if (!unresolved && isOnline()) {
    try {
      const token = storage.getString('token');
      const fast = cached ? { timeout: CACHED_REFRESH_TIMEOUT_MS, _netRetried: true } : {};
      const res = await axios.get(effUrl, { headers: { Authorization: `Bearer ${token}` }, ...fast } as AxiosRequestConfig);
      reportApiResult(true);
      base = res.data;
      baseAt = Date.now();
      if (actor && res.status === 200) responseCache.set(actor, effUrl, res.data);
    } catch (err: unknown) {
      lastErr = err;
      const responded = !!(err as { response?: unknown })?.response;
      reportApiResult(responded);
      if (responded) throw err; // 403/404 — haqiqiy javob, keshni ko'rsatmaymiz
    }
  }
  if (base === null && cached) {
    base = cached.data;
    baseAt = cached.savedAt;
  }
  const allOps = ob.list(actor).filter(o => ACTIVE_STATUSES.has(o.status) || o.status === 'done');
  const out = project(effUrl, base, {
    ops: opsForProjection(allOps, baseAt),
    resolve: id => ob.resolveId(id),
    now: Date.now(),
    ownerName: currentOwnerName(),
    baseAt,
    cached: cachedLookup(actor, allOps),
  });
  if (out === null || out === undefined) {
    throw lastErr || new Error('OFFLINE_NO_DATA');
  }
  return out;
}
