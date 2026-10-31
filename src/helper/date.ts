/**
 * date.ts — sana yordamchilari, YAGONA manba (refactor/ui-foundation).
 *
 * Bu yerdagi funksiya tanalari mavjud nusxalardan AYNAN ko'chirilgan; xulq o'zgarmagan
 * (__tests__/refactor_characterization.test.ts bilan qotirilgan).
 *
 * Ikki oila bor — ARALASHTIRMANG:
 *  - Toshkent (UTC+5, DST yo'q): tkYmdFromMs, fmtDateTimeUz — qurilma TZ'iga bog'liq EMAS.
 *  - Lokal (qurilma TZ): fmtDmyLocal, fmtYmdLocal — FAQAT foydalanuvchi tanlagan `Date`
 *    (DatePicker) uchun: tanlangan kun = qurilmaning kalendar kuni.
 *
 * 01.11 (REFACTOR_DIVERGENCES, egasi tasdiqlagan): server satr/son sanalarini ko'rsatuvchi
 * fmtLocalDate*, fmtDmyTk/fmtYmdTk, tkWall, tkCalendarYmd endi qurilma TZ'iga bog'liq EMAS:
 *   - zonasiz 'YYYY-MM-DD[ T]HH:mm[:ss[.f]]'  -> Toshkent devor vaqti (backend VARCHAR/raw ustunlari,
 *     knexfile mysql2 timezone '+05:00'), maydonlar to'g'ridan-to'g'ri o'qiladi;
 *   - sof 'YYYY-MM-DD'  -> o'sha kalendar kun (UTC yarim tun + 5s = Toshkent 05:00, eski Toshkent natijasi bilan bir xil);
 *   - 'Z' / ofsetli satr, epoch son, Date -> oniy vaqt (instant) + 5s.
 * Toshkentdagi qurilmada natija o'zgarmagan (__tests__/refactor_tz_proof.test.ts).
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

const ZONELESS_RE = /^(\d{4})-(\d{2})-(\d{2})(?:([T ])(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?)?$/;

/**
 * Qiymatni "Toshkent devor vaqti" ko'rinishida qaytaradi: natija Date'ning UTC getter'lari
 * (getUTCDate, getUTCHours ...) Toshkentdagi kalendar kun/soatni beradi. Yaroqsiz -> null.
 * Qurilma TZ'iga bog'liq emas (qoidalar fayl boshidagi izohda).
 */
export const tkWall = (v: unknown): Date | null => {
  if (typeof v === 'string') {
    const m = ZONELESS_RE.exec(v.trim());
    if (m) {
      const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
      // sof sana: UTC yarim tun + 5s (Toshkent 05:00) — eski natija bilan bir xil.
      const hasTime = m[4] !== undefined;
      const [h, mi, s] = hasTime ? [Number(m[5]), Number(m[6]), Number(m[7] || 0)] : [5, 0, 0];
      const w = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
      const ok =
        w.getUTCFullYear() === y && w.getUTCMonth() === mo - 1 && w.getUTCDate() === d &&
        w.getUTCHours() === h && w.getUTCMinutes() === mi && w.getUTCSeconds() === s;
      return ok ? w : null;
    }
  }
  const t = new Date(v as any).getTime();
  return Number.isFinite(t) ? new Date(t + TASHKENT_OFFSET_MS) : null;
};

/** Toshkent kalendar kuni 'YYYY-MM-DD'; yaroqsiz -> null. */
export const tkCalendarYmd = (v: unknown): string | null => {
  const w = tkWall(v);
  return w ? w.toISOString().slice(0, 10) : null;
};

/** 'YYYY-MM-DD' -> epoch'dan beri kun raqami (kunlar farqi uchun, DST/TZ'siz). */
export const tkDayNumber = (ymd: string): number => Math.round(Date.parse(`${ymd}T00:00:00Z`) / 86400000);

/** Toshkent kalendar kuni qismlari; yaroqsiz -> null. */
export const tkYmdParts = (v: unknown): { y: number; mo: number; d: number } | null => {
  const w = tkWall(v);
  return w ? { y: w.getUTCFullYear(), mo: w.getUTCMonth() + 1, d: w.getUTCDate() } : null;
};

const dmyOfWall = (w: Date): string => `${p2(w.getUTCDate())}.${p2(w.getUTCMonth() + 1)}.${w.getUTCFullYear()}`;

/**
 * "DD.MM.YYYY": `Date` nusxasi (DatePicker) -> LOKAL kun; satr/son (server) -> Toshkent kuni.
 * Yaroqsiz -> "NaN.NaN.NaN" (eski xulq).
 */
export const fmtDmyTk = (v: unknown): string => {
  if (v instanceof Date) return fmtDmyLocal(v);
  const w = tkWall(v);
  return w ? dmyOfWall(w) : 'NaN.NaN.NaN';
};

/** "YYYY-MM-DD": `Date` nusxasi (DatePicker) -> LOKAL kun; satr/son (server) -> Toshkent kuni. Yaroqsiz -> "NaN-NaN-NaN". */
export const fmtYmdTk = (v: unknown): string => {
  if (v instanceof Date) return fmtYmdLocal(v);
  return tkCalendarYmd(v) ?? 'NaN-NaN-NaN';
};

export interface LocalFmtOpts {
  /** Bo'sh/yaroqsiz kirishda qaytadigan matn (default ''). */
  fallback?: string;
  /** true: `String(s).replace(' ', 'T')` (son kirish -> String -> yaroqsiz); false: kirish o'zgarishsiz (eski ikki nusxaning farqi). */
  spaceToT?: boolean;
}

const wallOfLoose = (s: any, spaceToT: boolean): Date | null =>
  tkWall(spaceToT ? String(s).replace(' ', 'T') : s);

/** Toshkent "DD.MM.YYYY" (nomi tarixiy); bo'sh/yaroqsiz -> fallback. */
export const fmtLocalDate = (s?: any, opts: LocalFmtOpts = {}): string => {
  const { fallback = '', spaceToT = false } = opts;
  if (!s) return fallback;
  const w = wallOfLoose(s, spaceToT);
  return w ? dmyOfWall(w) : fallback;
};

/** Toshkent "DD.MM.YYYY HH:mm" (nomi tarixiy); bo'sh/yaroqsiz -> fallback. */
export const fmtLocalDateTime = (s?: any, opts: LocalFmtOpts = {}): string => {
  const { fallback = '', spaceToT = false } = opts;
  if (!s) return fallback;
  const w = wallOfLoose(s, spaceToT);
  return w ? `${dmyOfWall(w)} ${p2(w.getUTCHours())}:${p2(w.getUTCMinutes())}` : fallback;
};
