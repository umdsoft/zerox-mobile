/**
 * SS-DEV (2026-10-04, "Yangi mobil xatolar 04.10 (1)" 1-band): oferta PDF'ini
 * ISHONCHLI yuklash.
 *
 * Ilgari (24.09 dan beri) PDF'ni react-native-pdf o'zi yuklardi
 * (`source.uri = pdf.zerox.uz/oferta_test.php?...`):
 *  - so'rovda TIMEOUT yo'q — server javob bermasa, ulanish osilib qoladi;
 *  - HTTP holati tekshirilmaydi — 404/500 HTML sahifa PDF deb saqlanadi va
 *    keyin "noto'g'ri PDF" xatosi bilan yiqiladi;
 *  - ContractModal'dagi 60 s "hodisa yo'q" taymeri → 1 marta qayta yuklash →
 *    yana 60 s → "Oferta hujjatini yuklab bo'lmadi" (ZAXIRA YO'Q edi).
 * Endi: o'zimiz yuklaymiz (timeout + holat/tur tekshiruvi + 2 marta qayta
 * urinish, backoff), bo'lmasa — ilova ichidagi zaxira PDF (ofertaBundled.*).
 */
import ReactNativeBlobUtil from 'react-native-blob-util';

export type OfertaDocLang = 'uz' | 'ru' | 'kr';

/** Ilova tili → hujjat tili (sayt $apiLang bilan bir xil: en/kaa → uz). */
export const ofertaDocLang = (lang?: string | null): OfertaDocLang => {
  if (lang === 'ru') return 'ru';
  if (lang === 'kr') return 'kr';
  return 'uz';
};

/** SS-DEV (2026-10-06): oferta PDF manzili (ContractModal va prefetch uchun bitta joy). */
export const ofertaPdfUrl = (base: string, uid: string | number, lang: OfertaDocLang): string =>
  `${base}?id=${uid}&lang=${lang}&download=0`;

export const OFERTA_TIMEOUT_MS = 15000;
/** Birinchi urinishdan keyingi 2 ta qayta urinish oldidan kutish (backoff). */
export const OFERTA_RETRY_DELAYS_MS = [1500, 4000];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const headerValue = (headers: any, name: string): string => {
  if (!headers) return '';
  const key = Object.keys(headers).find(k => k.toLowerCase() === name);
  return key ? String(headers[key] ?? '') : '';
};

const unlink = (p: string) => {
  ReactNativeBlobUtil.fs.unlink(p).catch(() => {});
};

/** Bitta urinish: PDF'ni keshga yozadi va fayl yo'lini qaytaradi. */
const downloadOnce = async (
  url: string,
  onTask: (task: any) => void,
): Promise<string> => {
  const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/oferta_${Date.now()}.pdf`;
  const task: any = ReactNativeBlobUtil.config({
    path,
    timeout: OFERTA_TIMEOUT_MS,
    trusty: false,
  }).fetch('GET', url);
  onTask(task);
  try {
    const res: any = await task;
    const info = res?.info?.() || {};
    const status = Number(info.status) || 0;
    const ctype = headerValue(info.headers, 'content-type').toLowerCase();
    const stat: any = await ReactNativeBlobUtil.fs.stat(path).catch(() => null);
    const size = Number(stat?.size) || 0;
    // 404 ("Hujjat topilmadi") / 5xx / HTML xato sahifasi — PDF emas.
    if (status !== 200 || size < 1024 || (ctype && !ctype.includes('pdf'))) {
      throw new Error(`oferta: status=${status} type=${ctype} size=${size}`);
    }
    return path;
  } catch (e) {
    unlink(path);
    throw e;
  }
};

/**
 * PDF'ni yuklaydi: 1 + 2 qayta urinish (1.5 s, 4 s backoff), har biri
 * OFERTA_TIMEOUT_MS. `isCancelled()` true bo'lsa — to'xtaydi (null).
 */
export const downloadOfertaPdf = async (
  url: string,
  isCancelled: () => boolean,
  onTask: (task: any) => void = () => {},
): Promise<string | null> => {
  for (let attempt = 0; attempt <= OFERTA_RETRY_DELAYS_MS.length; attempt++) {
    if (isCancelled()) return null;
    if (attempt > 0) {
      await sleep(OFERTA_RETRY_DELAYS_MS[attempt - 1]);
      if (isCancelled()) return null;
    }
    try {
      const path = await downloadOnce(url, onTask);
      if (isCancelled()) {
        unlink(path);
        return null;
      }
      return path;
    } catch (e) {
      // keyingi urinish
    }
  }
  return null;
};

export const removeOfertaFile = (path?: string | null) => {
  if (path) unlink(path);
};

/**
 * SS-DEV (2026-10-06, "Yangi mobil xatolar 06.10" 1(a)-band): identifikatsiyadan
 * keyin oferta 5–6 s spinner bilan ochilardi. ILDIZ: oyna ochilgandagina server
 * PDF'i (pdf.zerox.uz, mPDF — 06.10 o'lchov: TTFB 0.6–1.5 s Mac/Wi-Fi'dan; mobil
 * tarmoqda + TLS + 8 sahifa render ko'proq) yuklana boshlardi va tayyor bo'lguncha
 * `docSrc='loading'` (katta spinner) turardi; bunga `isactivate` → `getMe` kutish va
 * 0.8 s kechikish qo'shilardi.
 * Endi: (1) PDF identifikatsiya muvaffaqiyatli bo'lgan ZAHOTI fonda oldindan
 * yuklanadi (prefetch); (2) oyna ochilganda prefetch tayyor bo'lsa — darhol server
 * nusxasi, aks holda DARHOL ilova ichidagi zaxira ko'rsatiladi va server nusxasi
 * kelganda (foydalanuvchi hali 1-sahifada bo'lsa) almashtiriladi.
 */
type OfertaPrefetch = {
  url: string;
  at: number;
  done: boolean;
  path: string | null;
  cancelled: boolean;
  promise: Promise<string | null>;
};
/** Prefetch shu vaqtdan eski bo'lsa ishlatilmaydi (fayl/sessiya eskirgan). */
export const OFERTA_PREFETCH_TTL_MS = 10 * 60_000;
let prefetched: OfertaPrefetch | null = null;

/** Oferta PDF'ini fonda oldindan yuklaydi (bir xil URL uchun takrorlanmaydi). */
export const prefetchOfertaPdf = (url: string): void => {
  const cur = prefetched;
  if (
    cur &&
    cur.url === url &&
    !cur.cancelled &&
    Date.now() - cur.at < OFERTA_PREFETCH_TTL_MS &&
    (!cur.done || cur.path)
  ) {
    return;
  }
  if (cur && cur.url !== url) {
    cur.cancelled = true;
    if (cur.done) removeOfertaFile(cur.path);
  }
  const entry = {
    url,
    at: Date.now(),
    done: false,
    path: null,
    cancelled: false,
  } as OfertaPrefetch;
  entry.promise = downloadOfertaPdf(url, () => entry.cancelled).then(p => {
    entry.done = true;
    entry.path = p;
    return p;
  });
  prefetched = entry;
};

/**
 * Prefetch natijasini oladi (bir martalik — keyingi chaqiruv null). URL mos
 * kelmasa yoki eskirgan bo'lsa — null.
 */
export const takePrefetchedOferta = (
  url: string,
): { done: boolean; path: string | null; promise: Promise<string | null> } | null => {
  const cur = prefetched;
  if (!cur || cur.cancelled || cur.url !== url) return null;
  prefetched = null;
  if (Date.now() - cur.at >= OFERTA_PREFETCH_TTL_MS) {
    cur.cancelled = true;
    if (cur.done) removeOfertaFile(cur.path);
    return null;
  }
  return { done: cur.done, path: cur.path, promise: cur.promise };
};
