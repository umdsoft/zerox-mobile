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
