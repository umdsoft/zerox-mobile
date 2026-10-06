// SS-DEV (2026-10-06, "Yangi mobil xatolar 06.10" 2-band): tug'ilgan sana tanlagichi.
// Backend'da yosh cheklovi yo'q (User.search: ID + sana mosligi) — maksimum = bugun.

/** Eng erta tanlanadigan tug'ilgan sana. */
export const BIRTH_MIN_DATE = new Date(1900, 0, 1);

/** Tanlagich ochiladigan sana — bugundan 18 yil oldin (lokal kun). */
export function birthPickerDefault(now: Date = new Date()): Date {
  const d = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  // 29-fevral → 18 yil oldin kabisa bo'lmasa 1-mart'ga o'tib ketmasin (28-fevral).
  if (d.getMonth() !== now.getMonth()) d.setDate(0);
  return d;
}
