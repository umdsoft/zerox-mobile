import { TASHKENT_OFFSET_MS } from './date'; // UTC+5, DST yo'q

const DAY_MS = 86400000;

/** Instantning Toshkent taqvimidagi kun raqami (epoch'dan). */
const tashkentDay = (ts: number): number =>
  Math.floor((ts + TASHKENT_OFFSET_MS) / DAY_MS);

/**
 * `date` va `now` orasidagi TAQVIM kunlari farqi (Toshkent vaqti, yarim tunga
 * normallangan). Kelajak = musbat, o'tgan = manfiy. Noto'g'ri sana -> NaN.
 */
export const tashkentDayDiff = (
  date: Date | string | number,
  now: Date | number = Date.now(),
): number => {
  const d = new Date(date).getTime();
  const n = new Date(now).getTime();
  if (Number.isNaN(d) || Number.isNaN(n)) return NaN;
  return tashkentDay(d) - tashkentDay(n);
};
