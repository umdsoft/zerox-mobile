/**
 * Ulanish holati (oflayn rejim uchun).
 *
 *   online = NetInfo "ulangan" (yoki noaniq) VA API'ga yetib bo'ladi.
 *
 * NetInfo (allaqachon o'rnatilgan, v11) faqat interfeys holatini biladi: Wi-Fi bor, lekin internet
 * (yoki do'kondagi router — svet) yo'q bo'lishi mumkin. Shuning uchun API'ga haqiqiy javob kelishi
 * hal qiluvchi: istalgan HTTP javob (hatto 4xx/5xx) = yetib bordi; javobsiz xato = yetib bo'lmadi.
 * Yetib bo'lmasa — heartbeat (`GET /dashboard/get-time`, ochiq endpoint) 10s→60s oraliqda tekshiradi.
 */
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { URL } from '../screens/constants';

interface NetState {
  netConnected: boolean;
  apiReachable: boolean;
}

let state: NetState = { netConnected: true, apiReachable: true };
const listeners = new Set<() => void>();
let started = false;
let probeTimer: ReturnType<typeof setTimeout> | null = null;
let probeDelay = 10_000;
const PROBE_MAX = 60_000;
const PROBE_TIMEOUT = 5_000;

const emit = () =>
  listeners.forEach(fn => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });

const setState = (patch: Partial<NetState>) => {
  const next = { ...state, ...patch };
  if (next.netConnected === state.netConnected && next.apiReachable === state.apiReachable) return;
  state = next;
  emit();
  if (isOnline()) {
    probeDelay = 10_000;
    if (probeTimer) clearTimeout(probeTimer);
    probeTimer = null;
  } else {
    scheduleProbe();
  }
};

export const isOnline = (): boolean => state.netConnected && state.apiReachable;

export const subscribeNet = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/** API so'rovi natijasi: `responded` — server istalgan javob qaytardi. */
export const reportApiResult = (responded: boolean): void => {
  setState({ apiReachable: responded });
};

/** API'ga yengil so'rov (auth'siz). true — server javob berdi. */
export const probeApi = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
  try {
    await fetch(`${URL}/dashboard/get-time`, { signal: controller.signal });
    reportApiResult(true);
    return true;
  } catch {
    reportApiResult(false);
    return false;
  } finally {
    clearTimeout(timer);
  }
};

function scheduleProbe(): void {
  if (probeTimer || !started) return;
  probeTimer = setTimeout(async () => {
    probeTimer = null;
    if (!state.netConnected) {
      scheduleProbe(); // interfeys yo'q — NetInfo hodisasini kutamiz, lekin vaqti-vaqti bilan tekshiramiz
      return;
    }
    const ok = await probeApi();
    if (!ok) {
      probeDelay = Math.min(probeDelay * 2, PROBE_MAX);
      scheduleProbe();
    }
  }, probeDelay);
}

const onNetInfo = (s: NetInfoState) => {
  const connected = s.isConnected !== false;
  const wasConnected = state.netConnected;
  setState({ netConnected: connected });
  // Interfeys qaytdi — darhol API'ni tekshiramiz (svet/router qaytgan bo'lishi mumkin).
  if (connected && !wasConnected) {
    probeDelay = 10_000;
    probeApi();
  }
};

/** Bir martalik ishga tushirish (sync manager chaqiradi). */
export function startNetMonitor(): void {
  if (started) return;
  started = true;
  NetInfo.addEventListener(onNetInfo);
  NetInfo.fetch().then(onNetInfo).catch(() => undefined);
  AppState.addEventListener('change', s => {
    if (s === 'active' && !isOnline()) probeApi();
  });
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribeNet, isOnline, isOnline);
}
