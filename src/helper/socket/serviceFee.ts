import { spaceDigits } from './bodyHelpers';

const MIN_FEE = 1000;
const MAX_FEE = 100000;
const MIN_FEE_BELOW = 1000000;
const MAX_FEE_ABOVE = 100000000;
const FEE_RATE = 0.1 / 100;

/**
 * Bildirishnoma matnidagi xizmat haqi (UZS/USD): <= 1 mln -> 1 000, > 100 mln -> 100 000, oralig'ida 0.1%.
 * `item` — `{amount, currency}` obyekti (2026-11: SON uzatilgan chaqiruvlar tuzatildi — avval "NaN" chiqardi).
 */
export const checkingSum = (item: any, usd: any): string => {
  if (item.currency === 'USD') {
    const inUzs = item.amount * usd;
    if (inUzs > MAX_FEE_ABOVE) return spaceDigits(MAX_FEE);
    if (inUzs <= MIN_FEE_BELOW) return spaceDigits(MIN_FEE);
    return spaceDigits(Math.floor(item.amount * usd * FEE_RATE));
  }
  if (item.amount > MAX_FEE_ABOVE) return spaceDigits(MAX_FEE);
  if (item.amount <= MIN_FEE_BELOW) return spaceDigits(MIN_FEE);
  return spaceDigits(Math.floor(item.amount * FEE_RATE));
};
