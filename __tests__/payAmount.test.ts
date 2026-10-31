import {
  validatePayAmount,
  buildClickUrl,
  buildPaymeUrl,
  isPaymentCredited,
  MAX_PAY_AMOUNT,
} from '../src/helper/payAmount';

describe('validatePayAmount', () => {
  test('to\'g\'ri summa (probel bilan)', () => {
    expect(validatePayAmount('10 000')).toEqual({ok: true, amount: 10000});
    expect(validatePayAmount('1000')).toEqual({ok: true, amount: 1000});
  });
  test('min / max', () => {
    expect(validatePayAmount('999')).toEqual({ok: false, reason: 'min'});
    expect(validatePayAmount('0')).toEqual({ok: false, reason: 'min'});
    expect(validatePayAmount(String(MAX_PAY_AMOUNT + 1))).toEqual({ok: false, reason: 'max'});
  });
  test('raqam bo\'lmagan / xavfsiz bo\'lmagan butun', () => {
    for (const bad of ['', '12a', '1e5', '-5000', '1000.5', '1000&x=1', '99999999999999999999']) {
      expect(validatePayAmount(bad).ok).toBe(false);
    }
  });
});

describe('URL builderlar', () => {
  test('Click: kodlangan parametrlar', () => {
    const u = buildClickUrl(5000, 'a&b=1');
    expect(u).toContain('amount=5000');
    expect(u).toContain('transaction_param=a%26b%3D1');
    expect(u).toContain('return_url=zeroxuz%3A%2F%2FUserMoneyResult');
  });
  test('Payme: yangi qaytarish URL va tiyin', () => {
    const raw = (s: string) => s;
    const u = buildPaymeUrl(5000, 77, raw);
    expect(u).toContain('a=500000');
    expect(u).toContain('c=https://zerox.uz/payme-return.html');
    expect(u).not.toContain('alisherrahimov');
  });
});

describe('isPaymentCredited', () => {
  test('kamida kiritilgan summaga oshgan bo\'lishi shart', () => {
    expect(isPaymentCredited(1000, 6000, 5000)).toBe(true);
    expect(isPaymentCredited(1000, 3000, 5000)).toBe(false); // qisman / boshqa kirim
    expect(isPaymentCredited(1000, 1000, 5000)).toBe(false);
    expect(isPaymentCredited(undefined, 6000, 5000)).toBe(false);
  });
});
