/** Wave D xato tuzatishlari: bildirishnoma xizmat haqi 'NaN' bo'lmasligi. */
jest.mock("../src/i18n", () => ({ t: (k: string) => k }));
import { checkingSum } from '../src/helper/socket/serviceFee';

describe('checkingSum — obyekt bilan', () => {
  it('UZS 5 mln -> 5 000', () => expect(checkingSum({ amount: 5000000, currency: 'UZS' }, 12000)).toBe('5 000'));
  it('USD 100 (kurs 12000) -> 1 200', () => expect(checkingSum({ amount: 100, currency: 'USD' }, 12000)).toBe('1 200'));
  it('SON uzatilsa NaN (eski xato chaqiruv) — endi chaqiruvlar obyekt uzatadi', () => {
    expect(checkingSum(5000000 as any, 12000)).toBe('NaN');
  });
});
