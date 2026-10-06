/**
 * SS-DEV (2026-10-06) — "Yangi mobil xatolar 06.10": tashqi oqim qulf bayrog'i (1b)
 * va tug'ilgan sana tanlagichi default'i (2).
 */
const mockMem = new Map<string, any>();
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => mockMem.set(k, v),
    getNumber: (k: string) => mockMem.get(k),
    delete: (k: string) => mockMem.delete(k),
  },
}));

import {
  beginExternalFlow,
  endExternalFlow,
  isExternalFlowActive,
} from '../src/helper/externalFlow';
import { BIRTH_MIN_DATE, birthPickerDefault } from '../src/helper/birthDate';

describe('externalFlow', () => {
  beforeEach(() => mockMem.clear());

  test('boshlangach faol, tugagach emas', () => {
    expect(isExternalFlowActive()).toBe(false);
    beginExternalFlow();
    expect(isExternalFlowActive()).toBe(true);
    endExternalFlow();
    expect(isExternalFlowActive()).toBe(false);
  });

  test('TTL o‘tgach faol emas (oqim tashlab ketilsa qulf qaytadi)', () => {
    beginExternalFlow(1000);
    expect(isExternalFlowActive(Date.now() + 500)).toBe(true);
    expect(isExternalFlowActive(Date.now() + 1500)).toBe(false);
  });
});

describe('birthPickerDefault', () => {
  test('bugundan 18 yil oldin', () => {
    const d = birthPickerDefault(new Date(2026, 9, 6));
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2008, 9, 6]);
  });
  test('29-fevral → 28-fevral (kabisa emas)', () => {
    const d = birthPickerDefault(new Date(2028, 1, 29));
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2010, 1, 28]);
  });
  test('minimum 1900-01-01', () => {
    expect(BIRTH_MIN_DATE.getFullYear()).toBe(1900);
  });
});
