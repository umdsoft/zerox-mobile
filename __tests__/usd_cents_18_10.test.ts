/**
 * 18.10 — egasi hujjati: USD summalar TSENT bilan kiritiladi (655,77 USD, 15,84 USD).
 * Ilgari "65,75" yozilsa vergul tashlanib "6 575" bo'lardi. UZS — butun.
 */
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));

import {
  adaptAmountInputToCurrency,
  amountToInput,
  compactKMB,
  exceedsAmount,
  fmtAmountByCurrency,
  formatAmountInput,
  groupMoney,
  isUsd,
  parseAmount,
  percentOfAmount,
  round2,
  sanitizeAmountInput,
  toCents,
} from '../src/helper/money';

describe('sanitizeAmountInput', () => {
  test('USD: vergul va nuqta o‘nlik ajratgich, ko‘pi bilan 2 kasr', () => {
    expect(sanitizeAmountInput('65,75', true)).toBe('65.75');
    expect(sanitizeAmountInput('655.77', true)).toBe('655.77');
    expect(sanitizeAmountInput('1 234,567', true)).toBe('1234.56');
    expect(sanitizeAmountInput(',', true)).toBe('0.');
    expect(sanitizeAmountInput('1,2,3', true)).toBe('1.23');
    expect(sanitizeAmountInput('007', true)).toBe('7');
  });

  test('UZS: faqat butun (avvalgi xulq)', () => {
    expect(sanitizeAmountInput('6 575', false)).toBe('6575');
    expect(sanitizeAmountInput('65,75', false)).toBe('6575');
    expect(sanitizeAmountInput('0012', false)).toBe('12');
  });
});

describe('formatAmountInput / parseAmount', () => {
  test('ko‘rsatish: mingliklar probel, o‘nlik vergul', () => {
    expect(formatAmountInput('1234.56', true)).toBe('1 234,56');
    expect(formatAmountInput('0.', true)).toBe('0,');
    expect(formatAmountInput('1500000', false)).toBe('1 500 000');
    expect(formatAmountInput('12.34', false)).toBe('12');
  });

  test('API uchun son', () => {
    expect(parseAmount('65.75', true)).toBe(65.75);
    expect(parseAmount('0.', true)).toBe(0);
    expect(parseAmount('15,84', true)).toBe(15.84);
    expect(parseAmount('1 500 000', false)).toBe(1500000);
  });

  test('valyuta almashtirish: USD -> UZS da tsentlar tashlanadi', () => {
    expect(adaptAmountInputToCurrency('12.34', false)).toBe('12');
    expect(adaptAmountInputToCurrency('12', true)).toBe('12');
  });
});

describe('foiz tugmalari va qoldiq tekshiruvi (tsentlarda)', () => {
  test('USD foizlari tsentgacha, 100% — qoldiqning o‘zi', () => {
    expect(percentOfAmount(655.77, 25, true)).toBe(163.94);
    expect(percentOfAmount(655.77, 50, true)).toBe(327.89);
    expect(percentOfAmount(655.77, 100, true)).toBe(655.77);
    expect(amountToInput(percentOfAmount(655.77, 75, true), true)).toBe('491.83');
  });

  test('UZS foizlari butun', () => {
    expect(percentOfAmount(100001, 50, false)).toBe(50001);
  });

  test('exceedsAmount float xatosiz', () => {
    expect(exceedsAmount(0.1 + 0.2, 0.3)).toBe(false);
    expect(exceedsAmount(655.78, '655.77')).toBe(true);
    expect(toCents(655.77)).toBe(65577);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe('ko‘rsatish formatlari tsentlarni yo‘qotmaydi', () => {
  test('groupMoney / fmtAmountByCurrency', () => {
    expect(groupMoney(655.77)).toBe('655,77');
    expect(groupMoney('1234.5')).toBe('1 234,50');
    expect(groupMoney('550000.00')).toBe('550 000');
    expect(fmtAmountByCurrency(15.84, 'USD')).toBe('15,84');
    expect(fmtAmountByCurrency(15.84, 'UZS')).toBe('16');
    expect(isUsd('usd')).toBe(true);
  });

  test('compactKMB: mingdan kichik USD tsent bilan', () => {
    expect(compactKMB(655.77)).toBe('655,77');
    expect(compactKMB(1700000)).toBe('1,7 M');
  });
});
