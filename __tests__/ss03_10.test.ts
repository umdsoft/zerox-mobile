/**
 * 03.10 (mobil hujjat) — identifikatsiyadan keyingi oferta navbati (helper/ofertaAfterId).
 */
const mockMem = new Map<string, string>();
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: string) => mockMem.set(k, String(v)),
    getString: (k: string) => mockMem.get(k),
    delete: (k: string) => mockMem.delete(k),
  },
}));
jest.mock('react-native-toast-message', () => {
  const Toast: any = () => null;
  Toast.show = jest.fn();
  return { __esModule: true, default: Toast };
});

import {
  consumeOfertaAfterIdentification,
  hasOfertaAfterIdentification,
  markOfertaAfterIdentification,
} from '../src/helper/ofertaAfterId';

const fresh = { id: 7, is_active: 1, is_contract: 0 };

describe('ofertaAfterId', () => {
  beforeEach(() => mockMem.clear());

  test('navbat yo‘q bo‘lsa oyna ochilmaydi', () => {
    expect(hasOfertaAfterIdentification()).toBe(false);
    expect(consumeOfertaAfterIdentification(fresh)).toBe(false);
  });

  test('identifikatsiyadan keyin BIR MARTA ochiladi', () => {
    markOfertaAfterIdentification(7);
    expect(hasOfertaAfterIdentification()).toBe(true);
    expect(consumeOfertaAfterIdentification(fresh)).toBe(true);
    expect(hasOfertaAfterIdentification()).toBe(false);
    expect(consumeOfertaAfterIdentification(fresh)).toBe(false);
  });

  // SS-DEV (2026-10-06): 04.10 dan beri navbat faqat isactivate MUVAFFAQIYATLI bo'lgach
  // yoziladi — eski Redux (is_active=0) bilan ham oyna OCHILADI (kutmaydi). Test shunga moslandi.
  test('eski (is_active=0) ma’lumotda ham ochiladi; user yo‘q bo‘lsa kutadi', () => {
    markOfertaAfterIdentification(7);
    expect(consumeOfertaAfterIdentification(undefined)).toBe(false);
    expect(hasOfertaAfterIdentification()).toBe(true);
    expect(consumeOfertaAfterIdentification({ ...fresh, is_active: 0 })).toBe(true);
    expect(hasOfertaAfterIdentification()).toBe(false);
  });

  test('oferta allaqachon tasdiqlangan — ochilmaydi, navbat o‘chadi', () => {
    markOfertaAfterIdentification(7);
    expect(consumeOfertaAfterIdentification({ ...fresh, is_contract: 1 })).toBe(false);
    expect(hasOfertaAfterIdentification()).toBe(false);
  });

  test('boshqa akkaunt — ochilmaydi, navbat o‘chadi', () => {
    markOfertaAfterIdentification(7);
    expect(consumeOfertaAfterIdentification({ ...fresh, id: 8 })).toBe(false);
    expect(hasOfertaAfterIdentification()).toBe(false);
  });

  test('id noma’lum bo‘lsa istalgan joriy foydalanuvchiga ochiladi', () => {
    markOfertaAfterIdentification(undefined);
    expect(consumeOfertaAfterIdentification({ ...fresh, id: 99 })).toBe(true);
  });
});
