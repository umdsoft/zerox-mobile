/**
 * Akkauntni o'chirish: API moduli (apiClient mock) + xato kodi -> xabar xaritasi + cooldown.
 */
jest.mock('../src/store/api/apiClient', () => ({
  __esModule: true,
  default: {get: jest.fn(), post: jest.fn()},
}));

import apiClient from '../src/store/api/apiClient';
import {
  DELETION_ERROR_KEYS,
  deleteAccount,
  fetchDeletionCheck,
  mapDeletionErrorCode,
  mapDeletionErrorKey,
  normalizeDeletionCheck,
  secondsLeft,
  sendDeletionOtp,
} from '../src/store/api/accountDeletion';

const api = apiClient as unknown as {get: jest.Mock; post: jest.Mock};
const httpErr = (status: number, data?: any) => ({response: {status, data}});

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
});

describe('mapDeletionErrorCode / mapDeletionErrorKey', () => {
  test.each([
    ['INVALID_PASSWORD', 403, 'invalid_password'],
    ['PASSWORD_REQUIRED', 400, 'invalid_password'],
    ['INVALID_OTP', 400, 'invalid_otp'],
    ['OTP_EXPIRED', 400, 'invalid_otp'],
    ['HAS_BLOCKERS', 409, 'blocked'],
    ['FORBIDDEN', 403, 'xodim_forbidden'],
    ['ADMIN_FORBIDDEN', 403, 'admin_forbidden'],
    ['NOT_READY', 503, 'not_ready'],
    ['OTP_COOLDOWN', 429, 'rate_limited'],
    ['TOO_MANY_ATTEMPTS', 429, 'rate_limited'],
    ['SMS_RATE_LIMIT', 429, 'rate_limited'],
  ])('backend %s (HTTP %i) -> %s', (code, status, expected) => {
    const e = httpErr(status as number, {code});
    expect(mapDeletionErrorCode(e)).toBe(expected);
    expect(mapDeletionErrorKey(e)).toBe(DELETION_ERROR_KEYS[expected as keyof typeof DELETION_ERROR_KEYS]);
  });

  test('429 kodsiz -> rate_limited; 403 kodsiz -> xodim_forbidden', () => {
    expect(mapDeletionErrorCode(httpErr(429))).toBe('rate_limited');
    expect(mapDeletionErrorCode(httpErr(403, {}))).toBe('xodim_forbidden');
  });

  test('javobsiz xato (tarmoq) -> network', () => {
    expect(mapDeletionErrorCode(new Error('Network Error'))).toBe('network');
    expect(mapDeletionErrorCode(undefined)).toBe('network');
  });

  test('noma‘lum kod / 500 -> unknown', () => {
    expect(mapDeletionErrorCode(httpErr(500, {code: 'weird'}))).toBe('unknown');
    expect(mapDeletionErrorCode(httpErr(400))).toBe('unknown');
  });

  test('har bir kod uchun xabar kaliti bo‘sh emas', () => {
    Object.values(DELETION_ERROR_KEYS).forEach(k => expect(k.length).toBeGreaterThan(0));
  });
});

describe('normalizeDeletionCheck', () => {
  test('to‘liq javob', () => {
    expect(
      normalizeDeletionCheck({
        success: true,
        data: {
          canDelete: false,
          blockers: {activeContracts: 2, pendingContracts: 1, qarzDaftariOpen: 3},
          balance: 1500,
          balanceWarning: true,
          requiresPassword: false,
        },
      }),
    ).toEqual({
      canDelete: false, activeContracts: 2, pendingContracts: 1, qarzDaftariOpen: 3,
      pendingPayments: 0, gapOrganizer: 0, balance: 1500, hasPassword: false,
    });
  });

  test('yetishmagan maydonlar: canDelete hisoblanadi, hasPassword=true, balans 0', () => {
    expect(normalizeDeletionCheck({data: {}})).toEqual({
      canDelete: true, activeContracts: 0, pendingContracts: 0, qarzDaftariOpen: 0,
      pendingPayments: 0, gapOrganizer: 0, balance: 0, hasPassword: true,
    });
    expect(normalizeDeletionCheck({data: {activeContracts: '3'}}).canDelete).toBe(false);
  });

  test('yangi to‘siqlar (to‘lov, Gap) canDelete ni yopadi', () => {
    const r = normalizeDeletionCheck({data: {blockers: {pendingPayments: 1, gapOrganizer: 2}}});
    expect(r.pendingPayments).toBe(1);
    expect(r.gapOrganizer).toBe(2);
    expect(r.canDelete).toBe(false);
  });

  test('bo‘sh / yaroqsiz kirish xavfsiz', () => {
    expect(normalizeDeletionCheck(undefined).canDelete).toBe(true);
    expect(normalizeDeletionCheck({data: {balance: 'abc', activeContracts: -4}}).balance).toBe(0);
  });
});

describe('API chaqiruvlari', () => {
  test('fetchDeletionCheck GET /user/account/deletion-check', async () => {
    api.get.mockResolvedValue({data: {success: true, data: {canDelete: true, balance: 10}}});
    const r = await fetchDeletionCheck();
    expect(api.get).toHaveBeenCalledWith('/user/account/deletion-check');
    expect(r.canDelete).toBe(true);
    expect(r.balance).toBe(10);
  });

  test('sendDeletionOtp POST send-otp; 429 xatosi o‘tkaziladi', async () => {
    api.post.mockResolvedValueOnce({data: {success: true}});
    await sendDeletionOtp('kaa');
    expect(api.post).toHaveBeenCalledWith('/user/account/delete/send-otp', {lang: 'uz'});
    await sendDeletionOtp('ru');
    expect(api.post).toHaveBeenLastCalledWith('/user/account/delete/send-otp', {lang: 'ru'});
    api.post.mockRejectedValueOnce(httpErr(429, {code: 'OTP_COOLDOWN'}));
    await expect(sendDeletionOtp()).rejects.toMatchObject({response: {status: 429}});
  });

  test('deleteAccount parol bilan / parolsiz', async () => {
    api.post.mockResolvedValue({data: {success: true}});
    await deleteAccount({password: 'secret', otp: '12345'});
    expect(api.post).toHaveBeenLastCalledWith('/user/account/delete', {otp: '12345', password: 'secret'});
    await deleteAccount({otp: '12345'});
    expect(api.post).toHaveBeenLastCalledWith('/user/account/delete', {otp: '12345'});
  });
});

describe('secondsLeft (deadline asosidagi cooldown)', () => {
  test('qolgan soniya yuqoriga yaxlitlanadi va manfiy bo‘lmaydi', () => {
    expect(secondsLeft(60000, 0)).toBe(60);
    expect(secondsLeft(60000, 59001)).toBe(1);
    expect(secondsLeft(60000, 60000)).toBe(0);
    expect(secondsLeft(60000, 90000)).toBe(0);
    expect(secondsLeft(0, Date.now())).toBe(0);
  });
});
