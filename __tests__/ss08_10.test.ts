/**
 * 08.10 — "Yangi mobil xatolar 07.10": o'z parolini o'zgartirgandan keyingi sessiya (1),
 * vaqt tafovuti (2), majburiy yangilanish siyosati (3) — sof mantiq.
 */
const mockMem = new Map<string, any>();
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => mockMem.set(k, v),
    getString: (k: string) => mockMem.get(k),
    delete: (k: string) => mockMem.delete(k),
  },
}));
jest.mock('react-native-device-info', () => ({ getVersion: () => '1.6' }));
jest.mock('../src/screens/constants', () => ({ URL: 'https://tb.zerox.uz/api/v1' }));

import {
  beginOwnPasswordChange,
  cancelOwnPasswordChange,
  extractSessionTokens,
  isOwnPasswordChangeActive,
  waitForOwnPasswordChange,
} from '../src/helper/passwordChangeSession';
import {
  CLOCK_SKEW_THRESHOLD_MS,
  computeSkewMs,
  parseHttpDate,
} from '../src/helper/clockSkew';
import { compareVersions, isUpdateRequired, loadCachedPolicy } from '../src/helper/forceUpdate';

describe('passwordChangeSession', () => {
  afterEach(() => cancelOwnPasswordChange());

  test('tokenlar: data.* va top-level, keng tarqalgan nomlar', () => {
    expect(extractSessionTokens({ data: { access_token: 'a', refresh_token: 'r' } })).toEqual({
      token: 'a',
      refreshToken: 'r',
    });
    expect(extractSessionTokens({ token: 't', refreshToken: 'rt' })).toEqual({
      token: 't',
      refreshToken: 'rt',
    });
    expect(extractSessionTokens({ data: { accessToken: 'x' } })).toEqual({
      token: 'x',
      refreshToken: null,
    });
    expect(extractSessionTokens({ success: true, code: 2 })).toBeNull();
  });

  test('oqim faol bo‘lganda kutish; bekor qilinsa null va faol emas', async () => {
    expect(isOwnPasswordChangeActive()).toBe(false);
    beginOwnPasswordChange();
    expect(isOwnPasswordChangeActive()).toBe(true);
    const waiting = waitForOwnPasswordChange();
    cancelOwnPasswordChange();
    await expect(waiting).resolves.toBeNull();
    expect(isOwnPasswordChangeActive()).toBe(false);
  });
});

describe('clockSkew', () => {
  test('HTTP Date sarlavhasi epoch ms ga', () => {
    expect(parseHttpDate({ date: 'Thu, 08 Oct 2026 06:09:47 GMT' })).toBe(
      Date.UTC(2026, 9, 8, 6, 9, 47),
    );
    expect(parseHttpDate({})).toBeNull();
    expect(parseHttpDate({ date: 'not a date' })).toBeNull();
  });

  test('tafovut RTT o‘rtasiga nisbatan; hujjatdagi misol bloklanadi', () => {
    const server = Date.UTC(2026, 9, 4, 16, 22); // 04.10 21:22 Toshkent
    const phone = Date.UTC(2026, 9, 2, 21, 22); // 03.10 02:22 Toshkent
    const skew = computeSkewMs(phone, phone + 400, server) as number;
    expect(Math.abs(skew)).toBeGreaterThan(CLOCK_SKEW_THRESHOLD_MS);
    expect(computeSkewMs(1000, 1200, 1100)).toBe(0);
    expect(computeSkewMs(1000, 900, 1000)).toBeNull(); // manfiy RTT — ishonchsiz
  });
});

describe('forceUpdate', () => {
  beforeEach(() => mockMem.clear());

  test('versiya solishtirish va blok qarori', () => {
    expect(compareVersions('1.10', '1.9')).toBe(1);
    expect(compareVersions('1.6', '1.6.0')).toBe(0);
    expect(isUpdateRequired(null)).toBe(false);
    expect(
      isUpdateRequired({ min_version: '1.7', latest_version: '1.7', store_url: '', store_web_url: '' }),
    ).toBe(true);
  });

  test('saqlangan siyosat: begona do‘kon havolasi standartga almashtiriladi', () => {
    mockMem.set(
      'forceUpdate.policy',
      JSON.stringify({ min_version: '1.7', store_url: 'https://evil.example/x', store_web_url: '' }),
    );
    const p = loadCachedPolicy();
    expect(p?.min_version).toBe('1.7');
    expect(p?.store_url.startsWith('https://evil')).toBe(false);
    expect(isUpdateRequired(p)).toBe(true);
  });
});
