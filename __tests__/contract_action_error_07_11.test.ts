/**
 * 07.11: backend qarz shartnomasi amallarini rolga qarab tekshiradi — xato kodlari (`msg` | `message`) aniq
 * tarjima qilingan toast matniga aylanadi; eskirgan bildirishnoma (`stale`) belgilanadi; UI rol aniqlash.
 */
jest.mock('i18next', () => ({ t: (k: string) => k }));

import {
  classifyContractActionError,
  contractActionErrorCode,
  contractActionErrorToast,
  contractRole,
} from '../src/helper/contractActionError';

const axiosErr = (status: number, data: any) => ({ response: { status, data } });

describe('classifyContractActionError', () => {
  test.each([
    [403, { code: 'FORBIDDEN', msg: 'only-lender' }, 'Bu amalni faqat qarz beruvchi bajara oladi', false],
    [403, { message: 'only-lender' }, 'Bu amalni faqat qarz beruvchi bajara oladi', false],
    [403, { code: 'FORBIDDEN', msg: 'only-borrower' }, 'Bu amalni faqat qarz oluvchi bajara oladi', false],
    [400, { msg: 'invalid-end-date' }, 'Muddat kelajakdagi sana bo‘lishi kerak', false],
    [409, { message: 'already-processed' }, 'Bu so‘rov allaqachon ko‘rib chiqilgan', true],
    [403, { msg: 'creator-cannot-approve' }, 'O‘zingiz yaratgan shartnomani tasdiqlay olmaysiz', false],
    [403, { msg: 'notification-type-mismatch' }, 'Bu bildirishnoma ushbu amal uchun yaroqsiz', true],
    [403, { message: 'notification-act-mismatch' }, 'Bu bildirishnoma ushbu amal uchun yaroqsiz', true],
    [403, { message: 'act-type-mismatch' }, 'Bu bildirishnoma ushbu amal uchun yaroqsiz', true],
    [400, { message: 'act-required' }, 'So‘rov noto‘g‘ri yuborildi. Ilovani yangilang.', false],
    [400, { message: 'invalid-stype' }, 'So‘rov noto‘g‘ri yuborildi. Ilovani yangilang.', false],
    [400, { msg: 'invalid-act-type' }, 'So‘rov noto‘g‘ri yuborildi. Ilovani yangilang.', false],
    [409, {}, 'Bu so‘rov allaqachon ko‘rib chiqilgan', true],
    [403, { msg: 'something-else' }, 'Ruxsat yo‘q', false],
    [500, {}, 'Server xatosi. Birozdan so‘ng qayta urinib ko‘ring.', false],
  ])('%s %j -> %s', (status, data, message, stale) => {
    const f = classifyContractActionError(axiosErr(status as number, data));
    expect(f.message).toBe(message);
    expect(f.stale).toBe(stale);
  });

  test('tarmoq xatosi -> chaqiruvchining umumiy matni', () => {
    expect(classifyContractActionError(new Error('Network Error')).message).toBe('Xatolik sodir bo‘ldi');
    expect(classifyContractActionError(new Error('x'), '294').message).toBe('294');
  });

  test('oferta / o‘chirilgan hisob — interceptor ko‘rsatgan, toast yo‘q', () => {
    const e: any = axiosErr(403, { code: 'OFERTA_REQUIRED' });
    e.ofertaRequired = true;
    const f = classifyContractActionError(e);
    expect(f.message).toBeNull();
    expect(contractActionErrorToast(f)).toBeNull();
  });

  test('kod: msg -> message -> code', () => {
    expect(contractActionErrorCode(axiosErr(403, { code: 'FORBIDDEN', msg: 'only-lender' }))).toBe('only-lender');
    expect(contractActionErrorCode(axiosErr(403, { message: 'already-processed' }))).toBe('already-processed');
    expect(contractActionErrorCode(axiosErr(403, { code: 'FORBIDDEN' }))).toBe('FORBIDDEN');
    expect(contractActionErrorCode(undefined)).toBe('');
  });

  test('toast parametrlari — error2 uslubi', () => {
    const f = classifyContractActionError(axiosErr(403, { msg: 'only-lender' }));
    expect(contractActionErrorToast(f, 3000)).toEqual({
      autoHide: true,
      visibilityTime: 3000,
      position: 'bottom',
      type: 'error2',
      props: { desc: 'Bu amalni faqat qarz beruvchi bajara oladi' },
    });
  });
});

describe('contractRole', () => {
  test('debitor = qarz beruvchi, creditor = qarz oluvchi (son/satr farqsiz)', () => {
    expect(contractRole(2, { debitor: 2, creditor: 1 })).toBe('lender');
    expect(contractRole('1', { debitor: 2, creditor: 1 })).toBe('borrower');
    expect(contractRole(3, { debitor: 2, creditor: 1 })).toBe('none');
  });
  test('ma‘lumot yetishmasa — noma‘lum (UI eski xulqni saqlaydi)', () => {
    expect(contractRole(undefined, { debitor: 2, creditor: 1 })).toBeUndefined();
    expect(contractRole(2, {})).toBeUndefined();
    expect(contractRole(2, null)).toBeUndefined();
  });
});
