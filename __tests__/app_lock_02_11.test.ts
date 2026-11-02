/**
 * SEC (2026-11-02): fondan qaytganda qulf — sof qaror, tashqi-faoliyat oynasi, sovuq start.
 */
const mockMem = new Map<string, any>();
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => mockMem.set(k, v),
    getNumber: (k: string) => mockMem.get(k),
    getString: (k: string) => mockMem.get(k),
    getBoolean: (k: string) => mockMem.get(k),
    delete: (k: string) => mockMem.delete(k),
  },
}));
let mockHasPin = true;
jest.mock('../src/store/api/token/pin', () => ({ hasPin: () => mockHasPin }));

import { LOCK_GRACE_MS, shouldLockOnReturn } from '../src/helper/appLock';
import { applyColdStartLock, isAppLocked } from '../src/helper/appLockState';
import {
  EXTERNAL_ACTIVITY_SETTLE_MS,
  isExternalFlowActive,
  withExternalActivity,
} from '../src/helper/externalFlow';

const NOW = 1_000_000;
const base = { now: NOW, suppressed: false, hasSession: true, hasPin: true };

describe('shouldLockOnReturn', () => {
  test('grace dan uzoq fonda tursa qulflaydi', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW - LOCK_GRACE_MS })).toBe(true);
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW - 10 * 60_000 })).toBe(true);
  });
  test('grace ichida (bildirishnoma pardasi/ruxsat oynasi) qulflamaydi', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW - (LOCK_GRACE_MS - 1) })).toBe(false);
  });
  test('grace 30 soniyadan oshmaydi', () => {
    expect(LOCK_GRACE_MS).toBeLessThanOrEqual(30_000);
  });
  test('tashqi faoliyat (suppressed) — qulf yo‘q', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW - 600_000, suppressed: true })).toBe(false);
  });
  test('sessiya yo‘q (chiqib ketgan) — qulf yo‘q', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW - 600_000, hasSession: false })).toBe(false);
  });
  test('PIN yo‘q (PIN o‘rnatish oqimi) — qulf yo‘q', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW - 600_000, hasPin: false })).toBe(false);
  });
  test('qulf ekranida turgan bo‘lsa qayta qulflanmaydi (biometrik sikl yo‘q)', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW - 600_000, onLockScreen: true })).toBe(false);
  });
  test('fonga o‘tish ko‘rilmagan (iOS inactive xolos) — qulf yo‘q', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: undefined })).toBe(false);
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: null })).toBe(false);
  });
  test('soat orqaga surilgan (manfiy farq) — XAVFSIZ tomonga qulflaydi', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW + 5_000 })).toBe(true);
  });
});

describe('withExternalActivity', () => {
  beforeEach(() => mockMem.clear());

  test('davomida faol, tugagach QISQARTIRILADI (o‘chirilmaydi) va avto-tugaydi', async () => {
    let during = false;
    const out = await withExternalActivity(async () => {
      during = isExternalFlowActive();
      return 42;
    });
    expect(out).toBe(42);
    expect(during).toBe(true);
    // 'active' hodisasi natijadan keyin kelsa ham bayroq hali bor...
    expect(isExternalFlowActive()).toBe(true);
    // ...lekin qisqa oynadan keyin o‘z-o‘zidan tugaydi (qulf abadiy o‘chmaydi).
    expect(isExternalFlowActive(Date.now() + EXTERNAL_ACTIVITY_SETTLE_MS + 500)).toBe(false);
  });
  test('fn xato tashlasa ham oyna qisqartiriladi', async () => {
    await expect(withExternalActivity(async () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(isExternalFlowActive(Date.now() + EXTERNAL_ACTIVITY_SETTLE_MS + 500)).toBe(false);
  });
});

describe('applyColdStartLock', () => {
  beforeEach(() => { mockMem.clear(); mockHasPin = true; });

  test('sessiya + PIN: appLocked=true, eskirgan belgilar tozalanadi', () => {
    mockMem.set('token', 't');
    mockMem.set('appLocked', false);
    mockMem.set('lastBackgroundTime', 1);
    mockMem.set('externalFlowUntil', Date.now() + 1e6);
    mockMem.set('preLockNavState', '{}');
    expect(applyColdStartLock()).toBe(true);
    expect(isAppLocked()).toBe(true);
    expect(mockMem.has('lastBackgroundTime')).toBe(false);
    expect(mockMem.has('externalFlowUntil')).toBe(false);
    expect(mockMem.has('preLockNavState')).toBe(false);
  });
  test('sessiya yo‘q: qulflanmaydi', () => {
    expect(applyColdStartLock()).toBe(false);
    expect(isAppLocked()).toBe(false);
  });
  test('PIN yo‘q (PIN o‘rnatish oqimi): qulflanmaydi', () => {
    mockMem.set('token', 't');
    mockHasPin = false;
    expect(applyColdStartLock()).toBe(false);
    expect(isAppLocked()).toBe(false);
  });
});

describe('externalFlow himoyalari', () => {
  beforeEach(() => mockMem.clear());
  test('uzoq kelajakdagi (>10 daqiqa) qiymat qabul qilinmaydi', () => {
    mockMem.set('externalFlowUntil', Date.now() + 3600_000);
    expect(isExternalFlowActive()).toBe(false);
  });
  test('withExternalActivity oldindan mavjud uzunroq (MyID) oynani qisqartirmaydi', async () => {
    const { beginExternalFlow } = require('../src/helper/externalFlow');
    beginExternalFlow(); // 10 daqiqa
    await withExternalActivity(async () => 1);
    expect(isExternalFlowActive(Date.now() + 5 * 60_000)).toBe(true);
  });
  test('soat orqaga: suppressed bo‘lsa ham qulflaydi', () => {
    expect(shouldLockOnReturn({ ...base, lastBackgroundAt: NOW + 1000, suppressed: true })).toBe(true);
  });
  test('settleExternalFlow uzoq oynani qisqa oynaga tushiradi', () => {
    const { beginExternalFlow, settleExternalFlow } = require('../src/helper/externalFlow');
    beginExternalFlow();
    settleExternalFlow();
    expect(isExternalFlowActive(Date.now() + EXTERNAL_ACTIVITY_SETTLE_MS + 500)).toBe(false);
  });
});

describe('withExternalActivity: fn davomida istemol qilingan bayroq qayta yoqilmaydi', () => {
  beforeEach(() => mockMem.clear());
  test('hook bayroqni ochirgan bolsa finally uni qayta yoqmaydi', async () => {
    const { endExternalFlow } = require('../src/helper/externalFlow');
    await withExternalActivity(async () => {
      endExternalFlow(); // 'active' hodisasi iste'mol qildi
    });
    expect(isExternalFlowActive()).toBe(false);
  });
});
