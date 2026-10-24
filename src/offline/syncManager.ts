/**
 * Sync manager — SyncEngine'ni ilovaga ulaydi:
 *  - yuboruvchi: markaziy `apiClient` (auth refresh interceptor'i bilan) + `Idempotency-Key`;
 *  - triggerlar: oflayn->onlayn o'tish, ilova faollashishi, navbatga yangi amal, backoff taymeri;
 *  - holat (UI uchun): ishlayaptimi, oxirgi natija, auth to'xtatganmi, "sync epoch" (muvaffaqiyatli
 *    sinxrondan keyin ekranlar serverdan qayta yuklaydi).
 */
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import apiClient from '../store/api/apiClient';
import { refreshAccessToken } from '../store/api/authInterceptor';
import { storage } from '../store/api/token/getToken';
import { actorFromToken } from './actor';
import { currentActor, getOutbox } from './offlineStore';
import { isOnline, probeApi, reportApiResult, startNetMonitor, subscribeNet } from './netStatus';
import { parseRetryAfter } from './opSpec';
import { RunSummary, SyncEngine } from './syncEngine';
import { OpRequest, SendResult } from './types';

// 24.10: 20s -> 8s. Wi-Fi bor, internet yo'q holatda onlayn yuborish ekranni uzoq ushlab turmasin;
// timeout'da amal O'SHA kalit bilan navbatda qoladi (server ikki marta bajarmaydi).
const SEND_TIMEOUT_MS = 8_000;

export interface SyncStatus {
  running: boolean;
  authBlocked: boolean;
  lastRunAt: number;
  lastSummary: RunSummary | null;
  /** Har muvaffaqiyatli (≥1 amal) sinxrondan keyin oshadi — ekranlar qayta yuklaydi. */
  epoch: number;
}

let status: SyncStatus = { running: false, authBlocked: false, lastRunAt: 0, lastSummary: null, epoch: 0 };
const listeners = new Set<() => void>();
const setStatus = (patch: Partial<SyncStatus>) => {
  status = { ...status, ...patch };
  listeners.forEach(fn => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
};

export const getSyncStatus = (): SyncStatus => status;
export const subscribeSync = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const useSyncStatus = (): SyncStatus => useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus);

type HeaderBag = { get?: (k: string) => unknown; [k: string]: unknown } | undefined;
const retryAfterOf = (headers: HeaderBag): number | undefined => {
  const raw = typeof headers?.get === 'function' ? headers.get('retry-after') : headers?.['retry-after'];
  return parseRetryAfter(raw);
};

/**
 * Bitta amal so'rovi — onlayn to'g'ridan-to'g'ri yuborishda ham, sinxronda ham shu.
 *
 * 24.10: `actor` — amal aktori. Token so'rov oldidan o'qiladi va SHU aktorniki bo'lishi shart (aks holda
 * so'rov yuborilmaydi: `actorMismatch`); o'sha token `transformRequest` da qat'iy qo'yiladi (interceptor
 * orada almashgan tokenni qo'ymasin). Interceptor'ning avtomatik refresh+qayta yuborishi o'chiriladi
 * (`_retry`) — refresh'dan keyin aktorni chaqiruvchi (dvigatel / submit) qayta tekshiradi.
 */
export async function sendOpRequest(req: OpRequest, idempotencyKey: string, actor?: string): Promise<SendResult> {
  let token: string | undefined;
  try {
    token = storage?.getString('token');
  } catch {
    token = undefined;
  }
  if (actor && actorFromToken(token)?.key !== actor) return { status: null, actorMismatch: true };
  const pinAuth = (data: unknown, headers: { set?: (k: string, v: string) => void }) => {
    if (token && typeof headers?.set === 'function') headers.set('Authorization', `Bearer ${token}`);
    return data;
  };
  const defaults = apiClient.defaults.transformRequest;
  const transformRequest = [pinAuth, ...(Array.isArray(defaults) ? defaults : defaults ? [defaults] : [])];
  try {
    const res = await apiClient.request({
      method: req.method,
      url: req.path,
      data: req.body,
      timeout: SEND_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      transformRequest: transformRequest as never,
      _retry: true, // authInterceptor: avtomatik refresh YO'Q (aktor almashishi mumkin)
    } as Parameters<typeof apiClient.request>[0]);
    reportApiResult(true);
    return { status: res.status, data: res.data };
  } catch (err: unknown) {
    const response = (err as { response?: { status: number; data?: unknown; headers?: HeaderBag } })?.response;
    if (response) {
      reportApiResult(true);
      return { status: response.status, data: response.data, retryAfterMs: retryAfterOf(response.headers) };
    }
    reportApiResult(false);
    return { status: null };
  }
}

// Outbox MMKV `storage` init'idan KEYIN ochilishi kerak — engine birinchi ishlatilganda yaratiladi.
let engine: SyncEngine | null = null;
const getEngine = (): SyncEngine => {
  if (!engine) {
    engine = new SyncEngine({
      outbox: getOutbox(),
      send: sendOpRequest,
      getActor: () => currentActor()?.key ?? null,
      refreshAuth: async () => !!(await refreshAccessToken()),
    });
  }
  return engine;
};

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleRetry = (at?: number) => {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  if (!at) return;
  const delay = Math.max(at - Date.now(), 500);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    requestSync();
  }, delay);
};

/**
 * Sinxronni boshlash. Oflaynda — hech narsa (heartbeat onlayn bo'lganda chaqiradi).
 * @param force backoff'ni kutmasdan ("Hozir sinxronlash").
 */
export async function requestSync(force = false): Promise<RunSummary | null> {
  if (!isOnline()) {
    if (force) {
      const ok = await probeApi();
      if (!ok) return null;
    } else {
      return null;
    }
  }
  const actor = currentActor();
  if (!actor) return null;
  const ob = getOutbox();
  if (!ob.activeOps(actor.key).some(o => o.status === 'pending')) return null;

  setStatus({ running: true });
  try {
    const summary = await getEngine().run(force);
    const progressed = summary.synced + summary.linked + summary.committed > 0;
    setStatus({
      running: false,
      lastRunAt: Date.now(),
      lastSummary: summary,
      authBlocked: summary.stoppedBy === 'auth',
      epoch: progressed ? status.epoch + 1 : status.epoch,
    });
    scheduleRetry(summary.stoppedBy === 'transient' ? summary.nextAttemptAt : undefined);
    return summary;
  } catch {
    setStatus({ running: false });
    return null;
  }
}

const requestSyncSoon = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    requestSync();
  }, 400);
};

let started = false;

/**
 * Bir martalik ishga tushirish (idempotent). Qarz daftari ekranlari, banner va NoInternet chaqiradi —
 * ilova qayta ochilganda navbat birinchi qarz-daftari ekranida (yoki onlayn bo'lishi bilan) yuboriladi.
 */
export function startOfflineSync(): void {
  if (started) return;
  started = true;
  startNetMonitor();
  const ob = getOutbox();
  ob.prune();

  let wasOnline = isOnline();
  subscribeNet(() => {
    const now = isOnline();
    if (now && !wasOnline) requestSync(true); // ulanish tiklandi — kutmasdan
    wasOnline = now;
  });
  let lastLen = ob.getState().ops.length;
  ob.subscribe(s => {
    // Yangi amal qo'shildi — tez orada yuboramiz (onlayn bo'lsa).
    if (s.ops.length > lastLen) requestSyncSoon();
    lastLen = s.ops.length;
  });
  AppState.addEventListener('change', s => {
    if (s === 'active') requestSyncSoon();
  });
  requestSyncSoon();
}
