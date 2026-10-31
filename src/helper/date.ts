/**
 * date.ts — sana yordamchilari, YAGONA manba (refactor/ui-foundation).
 *
 * Bu yerdagi funksiya tanalari mavjud nusxalardan AYNAN ko'chirilgan; xulq o'zgarmagan
 * (__tests__/refactor_characterization.test.ts bilan qotirilgan).
 *
 * Ikki oila bor — ARALASHTIRMANG:
 *  - Toshkent (UTC+5, DST yo'q): tkYmdFromMs, fmtDateTimeUz — qurilma TZ'iga bog'liq EMAS.
 *  - Lokal (qurilma TZ): fmtDmyLocal, fmtYmdLocal, fmtLocalDate, fmtLocalDateTime.
 *    Qurilma UTC+5 dan boshqa mintaqada bo'lsa, '...T19:30Z' boshqa kunni ko'rsatadi.
 */

export const TASHKENT_OFFSET_MS = 5 * 3600 * 1000;

/** Epoch ms (CHEKLI son) -> Toshkent 'YYYY-MM-DD'. NaN/Infinity'da RangeError tashlaydi — chaqiruvchi tekshiradi. */
export const tkYmdFromMs = (ms: number): string =>
  new Date(ms + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);

/**
 * Sana + SOAT "DD.MM.YYYY HH:MM" — O'zbekiston vaqti (UTC+5), qurilma
 * mintaqasidan qat'i nazar. Noto'g'ri/bo'sh qiymatda ''.
 * 27.09: SmsHistory ichidagi lokal `dateTime` shu yerga ko'chirildi (SmsManager
 * ham ishlatadi — DRY). Xulq o'zgarmagan.
 */
export const fmtDateTimeUz = (text: unknown): string => {
  if (!text) return '';
  const d = new Date(text as string);
  if (isNaN(d.getTime())) return '';
  const z = new Date(d.getTime() + TASHKENT_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(z.getUTCDate())}.${p(z.getUTCMonth() + 1)}.${z.getUTCFullYear()} ${p(
    z.getUTCHours(),
  )}:${p(z.getUTCMinutes())}`;
};

/** LOKAL "DD.MM.YYYY". Yaroqsiz Date -> "NaN.NaN.NaN" (eski xulq). */
export const fmtDmyLocal = (d: Date): string => {
  const yyyy = d.getFullYear();
  let mm: string | number = d.getMonth() + 1; // Months start at 0!
  let dd: string | number = d.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};

/** LOKAL "YYYY-MM-DD". Yaroqsiz Date -> "NaN-NaN-NaN" (eski xulq). */
export const fmtYmdLocal = (d: Date): string => {
  const yyyy = d.getFullYear();
  let mm: string | number = d.getMonth() + 1; // Months start at 0!
  let dd: string | number = d.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return yyyy + '-' + mm + '-' + dd;
};

const p2 = (n: number): string => String(n).padStart(2, '0');

export interface LocalFmtOpts {
  /** Bo'sh/yaroqsiz kirishda qaytadigan matn (default ''). */
  fallback?: string;
  /** true: `new Date(String(s).replace(' ', 'T'))`; false: `new Date(s)` (eski ikki nusxaning farqi). */
  spaceToT?: boolean;
}

const parseLoose = (s: any, spaceToT: boolean): Date =>
  spaceToT ? new Date(String(s).replace(' ', 'T')) : new Date(s);

/** LOKAL "DD.MM.YYYY"; bo'sh/yaroqsiz -> fallback. */
export const fmtLocalDate = (s?: any, opts: LocalFmtOpts = {}): string => {
  const { fallback = '', spaceToT = false } = opts;
  if (!s) return fallback;
  const d = parseLoose(s, spaceToT);
  if (isNaN(d.getTime())) return fallback;
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`;
};

/** LOKAL "DD.MM.YYYY HH:mm"; bo'sh/yaroqsiz -> fallback. */
export const fmtLocalDateTime = (s?: any, opts: LocalFmtOpts = {}): string => {
  const { fallback = '', spaceToT = false } = opts;
  if (!s) return fallback;
  const d = parseLoose(s, spaceToT);
  if (isNaN(d.getTime())) return fallback;
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()} ${p2(d.getHours())}:${p2(
    d.getMinutes(),
  )}`;
};
