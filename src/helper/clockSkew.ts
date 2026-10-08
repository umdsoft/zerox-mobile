/**
 * clockSkew.ts — 08.10: qurilma soati va server vaqti o'rtasidagi tafovutni aniqlash.
 *
 * Nega: telefon sanasi/vaqti qo'lda noto'g'ri qo'yilsa (masalan haqiqiy vaqt 04.10 21:22,
 * telefonda 03.10 02:22) muddatlar, OTP, JWT va jadval hisob-kitoblari buziladi. Tafovut
 * CLOCK_SKEW_THRESHOLD_MS dan oshsa ilova to'liq ekranli oyna bilan bloklanadi
 * (screens/components/ClockSkewGate), vaqt to'g'rilangach o'zi ochiladi.
 *
 * Server vaqti manbalari (arzon, timezone'ga bog'liq emas — epoch bilan solishtiriladi):
 *   1) istalgan API javobining HTTP `Date` sarlavhasi (axios interceptor — passiv kuzatuv);
 *   2) tasdiqlash so'rovi: GET /time ({ now, epoch_ms } — bo'lsa) yoki /dashboard/get-time
 *      (mavjud, ochiq) — tana `epoch_ms` bo'lsa u, bo'lmasa `Date` sarlavhasi.
 * Passiv namuna faqat SIGNAL — bloklash/ochish qarori doim keshsiz tasdiqlash so'rovi bilan.
 * Eski timeChecker.checkPhoneTime xatosi takrorlanmaydi: u Toshkent lokal matnini
 * qurilma lokal vaqti sifatida parse qilardi (boshqa timezone/format -> soxta blok).
 * Server javob bermasa (tarmoq yo'q) — holat O'ZGARMAYDI (yangi blok qo'yilmaydi).
 */
import axios, { AxiosResponse } from 'axios';
import { URL } from '../screens/constants';

/** 08.10: ruxsat etilgan maksimal tafovut — 5 daqiqa. */
export const CLOCK_SKEW_THRESHOLD_MS = 5 * 60 * 1000;
const VERIFY_TIMEOUT_MS = 8000;
/** Passiv signal bo'yicha tasdiqlash so'rovlari orasidagi minimal oraliq. */
const SIGNAL_VERIFY_MIN_INTERVAL_MS = 30 * 1000;
/** Tarmoq kechikishi juda katta bo'lsa namuna ishonchsiz (yarim RTT xatosi). */
const MAX_TRUSTED_RTT_MS = 60 * 1000;

const TIME_PATH = '/time';
const LEGACY_TIME_PATH = '/dashboard/get-time';

type Listener = (blocked: boolean) => void;

let blocked = false;
let lastSkewMs: number | null = null;
let timeEndpointMissing = false;
let verifying: Promise<boolean> | null = null;
let lastSignalVerifyAt = 0;
const listeners = new Set<Listener>();

export const isClockBlocked = (): boolean => blocked;
export const getLastClockSkewMs = (): number | null => lastSkewMs;

export const subscribeClockSkew = (cb: Listener): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const setBlocked = (next: boolean): void => {
  if (next === blocked) return;
  blocked = next;
  listeners.forEach(l => {
    try {
      l(next);
    } catch {}
  });
};

/** 08.10: HTTP `Date` sarlavhasi (RFC 7231, GMT) -> epoch ms; yaroqsiz bo'lsa null. */
export const parseHttpDate = (headers: any): number | null => {
  const raw = typeof headers?.get === 'function' ? headers.get('date') : headers?.date ?? headers?.Date;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
};

/**
 * 08.10: tafovut = qurilma vaqti - server vaqti. Server vaqti so'rov o'rtasiga (RTT/2)
 * to'g'ri keladi deb hisoblaymiz. Ishonchsiz namuna (manfiy/juda katta RTT) -> null.
 */
export const computeSkewMs = (sentAt: number, receivedAt: number, serverMs: number): number | null => {
  const rtt = receivedAt - sentAt;
  if (!Number.isFinite(serverMs) || rtt < 0 || rtt > MAX_TRUSTED_RTT_MS) return null;
  return sentAt + rtt / 2 - serverMs;
};

const isSkewTooLarge = (skewMs: number): boolean => Math.abs(skewMs) > CLOCK_SKEW_THRESHOLD_MS;

const readServerMs = (res: AxiosResponse | undefined): number | null => {
  if (!res) return null;
  const epoch = Number(res.data?.epoch_ms ?? res.data?.data?.epoch_ms);
  if (res.status === 200 && Number.isFinite(epoch) && epoch > 0) return epoch;
  return parseHttpDate(res.headers);
};

/** Keshsiz bitta o'lchov; server javob bermasa null. */
const measureOnce = async (): Promise<number | null> => {
  const path = timeEndpointMissing ? LEGACY_TIME_PATH : TIME_PATH;
  const sentAt = Date.now();
  try {
    const res = await axios.get(URL + path, {
      params: { _: sentAt },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      timeout: VERIFY_TIMEOUT_MS,
      // 404 ham `Date` sarlavhasiga ega — xato emas, natija sifatida olamiz.
      validateStatus: () => true,
    });
    const receivedAt = Date.now();
    if (res.status === 404 && path === TIME_PATH) timeEndpointMissing = true;
    const serverMs = readServerMs(res);
    return serverMs === null ? null : computeSkewMs(sentAt, receivedAt, serverMs);
  } catch {
    return null; // tarmoq yo'q / timeout — bilmaymiz
  }
};

/**
 * 08.10: server bilan solishtirib holatni yangilaydi. Natija — bloklanganmi.
 * Server vaqti olinmasa holat o'zgarmaydi (yangi blok qo'yilmaydi).
 */
export const verifyClock = (): Promise<boolean> => {
  if (verifying) return verifying;
  verifying = measureOnce()
    .then(skew => {
      if (skew !== null) {
        lastSkewMs = skew;
        setBlocked(isSkewTooLarge(skew));
      }
      return blocked;
    })
    .catch(() => blocked)
    .finally(() => {
      verifying = null;
    });
  return verifying;
};

/** Passiv namuna holatga zid bo'lsa — keshsiz tasdiqlash (tez-tez emas). */
const onPassiveSample = (skew: number | null): void => {
  if (skew === null || isSkewTooLarge(skew) === blocked) return;
  const now = Date.now();
  if (now - lastSignalVerifyAt < SIGNAL_VERIFY_MIN_INTERVAL_MS) return;
  lastSignalVerifyAt = now;
  verifyClock();
};

const isOwnApi = (url: unknown): boolean => typeof url === 'string' && url.startsWith(URL);

const samplePassively = (res: AxiosResponse | undefined): void => {
  try {
    const cfg: any = res?.config;
    if (!res || !cfg || !isOwnApi(cfg.url) || typeof cfg.__clockSentAt !== 'number') return;
    const serverMs = parseHttpDate(res.headers);
    if (serverMs === null) return;
    onPassiveSample(computeSkewMs(cfg.__clockSentAt, Date.now(), serverMs));
  } catch {}
};

let installed = false;
/** 08.10: default axios instansiyasiga passiv `Date` kuzatuvchisini o'rnatadi (bir marta). */
export const installClockSkewWatcher = (): void => {
  if (installed) return;
  installed = true;
  axios.interceptors.request.use(config => {
    (config as any).__clockSentAt = Date.now();
    return config;
  });
  axios.interceptors.response.use(
    response => {
      samplePassively(response);
      return response;
    },
    error => {
      samplePassively(error?.response);
      return Promise.reject(error);
    },
  );
};
