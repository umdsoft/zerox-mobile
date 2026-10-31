const mockMem = new Map<string, any>();
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => mockMem.set(k, v),
    getString: (k: string) => (typeof mockMem.get(k) === 'string' ? mockMem.get(k) : undefined),
    getNumber: (k: string) => (typeof mockMem.get(k) === 'number' ? mockMem.get(k) : undefined),
    contains: (k: string) => mockMem.has(k),
    delete: (k: string) => mockMem.delete(k),
  },
}));
jest.mock('react-native-get-random-values', () => ({}));

import crypto from 'crypto';
import { sha256 } from 'js-sha256';
import { hasPin, pbkdf2Sha256Hex, PBKDF2_ITERATIONS, setPin, verifyPin } from '../src/store/api/token/pin';
import { attemptPin, getLockState, WIPE_AT } from '../src/store/api/token/pinLockout';

beforeAll(() => {
  if (!(globalThis as any).crypto?.getRandomValues) {
    (globalThis as any).crypto = { getRandomValues: (a: Uint8Array) => crypto.randomFillSync(a) };
  }
});
beforeEach(() => mockMem.clear());

describe('pin.ts PBKDF2', () => {
  it('matches node pbkdf2Sync', () => {
    for (const iter of [1, 2, 10, 1000]) {
      expect(pbkdf2Sha256Hex('1234', 'abcd', iter)).toBe(
        crypto.pbkdf2Sync('1234', 'abcd', iter, 32, 'sha256').toString('hex'),
      );
    }
  });

  it('new format verifies and wrong pin fails', () => {
    setPin('4321');
    expect(String(mockMem.get('pin_hash')).startsWith(`v2$${PBKDF2_ITERATIONS}$`)).toBe(true);
    expect(verifyPin('4321')).toBe(true);
    expect(verifyPin('1234')).toBe(false);
    expect(hasPin()).toBe(true);
  });

  it('old sha256 format verifies and migrates to v2', () => {
    mockMem.set('pin_salt', 'deadbeef');
    mockMem.set('pin_hash', sha256('deadbeef:2580'));
    expect(verifyPin('0000')).toBe(false);
    expect(mockMem.get('pin_hash')).toBe(sha256('deadbeef:2580'));
    expect(verifyPin('2580')).toBe(true);
    expect(String(mockMem.get('pin_hash')).startsWith('v2$')).toBe(true);
    expect(mockMem.has('pin_salt')).toBe(false);
    expect(verifyPin('2580')).toBe(true);
  });

  it('legacy plaintext k2 migrates', () => {
    mockMem.set('k2', '1111');
    expect(hasPin()).toBe(true);
    expect(verifyPin('1111')).toBe(true);
    expect(mockMem.has('k2')).toBe(false);
    expect(verifyPin('1111')).toBe(true);
  });

  it('10000 iterations stays fast on node', () => {
    const t = Date.now();
    pbkdf2Sha256Hex('1234', 'abcd', PBKDF2_ITERATIONS);
    expect(Date.now() - t).toBeLessThan(1500);
  });
});

describe('pinLockout', () => {
  const bad = () => false;
  const good = () => true;

  it('locks after 3 failures and persists', () => {
    const t0 = 1_000_000;
    attemptPin(bad, 'x', t0);
    attemptPin(bad, 'x', t0);
    const r = attemptPin(bad, 'x', t0);
    expect(r.result).toBe('wrong');
    expect(getLockState(t0 + 1000).locked).toBe(true);
    expect(attemptPin(good, 'x', t0 + 1000).result).toBe('locked');
    expect(getLockState(t0 + 31_000).locked).toBe(false);
  });

  it('clock set back does not unlock', () => {
    const t0 = 5_000_000;
    for (let i = 0; i < 5; i++) attemptPin(bad, 'x', t0 + i * 31_000);
    const lockedAt = t0 + 4 * 31_000;
    const s = getLockState(lockedAt - 3_600_000);
    expect(s.locked).toBe(true);
    expect(s.remainingMs).toBe(5 * 60 * 1000);
  });

  it('success resets, 10th failure wipes', () => {
    let now = 1;
    attemptPin(bad, 'x', now);
    expect(attemptPin(good, 'x', now).result).toBe('ok');
    expect(getLockState(now).failures).toBe(0);
    let last: any;
    for (let i = 0; i < WIPE_AT; i++) {
      now += 31 * 60 * 1000;
      last = attemptPin(bad, 'x', now);
    }
    expect(last.result).toBe('wipe');
  });
});
