/**
 * qarzGet — imperativ (hook'siz) cache-first GET: `axios.get` bilan yuklaydigan qarz-daftari
 * joylari uchun (masalan amaliyot tafsiloti). useQarzFetch bilan bir xil qoida:
 * onlayn -> server (keshga yoziladi), tarmoq xatosi/oflayn -> kesh; temp id -> lokal sintez;
 * natijaga navbatdagi amallar proyeksiya qilinadi. Hech narsa bo'lmasa — asl xato tashlanadi.
 */
import axios from 'axios';
import { storage } from '../store/api/token/getToken';
import { isOnline, reportApiResult } from './netStatus';
import { cachedOrDerived, currentActor, currentOwnerName, getOutbox, responseCache } from './offlineStore';
import { opsForProjection, project, rewriteTempUrl } from './projection';
import { ACTIVE_STATUSES } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function qarzGet(url: string): Promise<any> {
  const ob = getOutbox();
  const actor = currentActor()?.key || '';
  const { url: effUrl, unresolved } = rewriteTempUrl(url, id => ob.resolveId(id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let base: any = null;
  let baseAt = 0;
  let lastErr: unknown = null;

  if (!unresolved && isOnline()) {
    try {
      const token = storage.getString('token');
      const res = await axios.get(effUrl, { headers: { Authorization: `Bearer ${token}` } });
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
  if (base === null && !unresolved && actor) {
    const hit = cachedOrDerived(actor, effUrl);
    if (hit) {
      base = hit.data;
      baseAt = hit.savedAt;
    }
  }
  const ops = opsForProjection(
    ob.list(actor).filter(o => ACTIVE_STATUSES.has(o.status) || o.status === 'done'),
    baseAt,
  );
  const out = project(effUrl, base, { ops, resolve: id => ob.resolveId(id), now: Date.now(), ownerName: currentOwnerName() });
  if (out === null || out === undefined) {
    throw lastErr || new Error('OFFLINE_NO_DATA');
  }
  return out;
}
