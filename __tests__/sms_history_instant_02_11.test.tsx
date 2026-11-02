/**
 * 02.11: "SMS xabarlar tarixi" yuqori qismi spinnersiz, keshdan darhol chiziladi.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockMem = new Map<string, any>();
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    set: (k: string, v: any) => mockMem.set(k, v),
    getString: (k: string) => (typeof mockMem.get(k) === 'string' ? mockMem.get(k) : undefined),
    getNumber: (k: string) => (typeof mockMem.get(k) === 'number' ? mockMem.get(k) : undefined),
    delete: (k: string) => mockMem.delete(k),
  },
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
const mockSub = jest.fn();
jest.mock('../src/screens/home/modules/financeApi', () => ({
  financeApi: { getSubscription: (...a: any[]) => mockSub(...a), getSmsStats: jest.fn().mockResolvedValue({ data: { data: {} } }) },
}));
jest.mock('../src/screens/home/modules/components/smsDeliveryApi', () => ({
  fetchUndeliveredPage: jest.fn().mockResolvedValue({ count: 3, rows: [] }),
}));
jest.mock('../src/screens/home/redesign/icons', () => {
  const mk = (name: string) => () => require('react').createElement('Icon', { name });
  return { CheckCircleIcon: mk('c'), ChevronRight: mk('r'), LedgerIcon: mk('l'), MessageIcon: mk('m'), WarningIcon: mk('w') };
});

import SmsStatsPanel from '../src/screens/home/drawer/drawerScreens/SmsStatsPanel';
import { readSmsStatsCache } from '../src/screens/home/drawer/drawerScreens/smsStatsCache';

const texts = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType('Text' as any).map(n => [].concat(n.props.children as any).join(''));

describe('SmsStatsPanel keshdan darhol', () => {
  beforeEach(() => { mockMem.clear(); mockSub.mockReset(); });

  test('kesh bor: birinchi renderdayoq sonlar bor, skeleton/spinner yo‘q', () => {
    mockMem.set('user_id', 5);
    mockMem.set('smsStatsCache:v1:5', JSON.stringify({ subscription: { sms: { total: 100, used: 40, remaining: 60 } }, stats: null, undelivered: 7, cachedAt: Date.now() }));
    mockSub.mockReturnValue(new Promise(() => {})); // tarmoq hali javob bermagan
    let r!: TestRenderer.ReactTestRenderer;
    act(() => { r = TestRenderer.create(<SmsStatsPanel />); });
    expect(r.root.findAllByProps({ testID: 'sms-stats-skeleton' }).length).toBe(0);
    const all = texts(r);
    expect(all).toContain('100');
    expect(all).toContain('60');
    expect(all).toContain('7');
  });

  test('kesh yo‘q (birinchi marta): skeleton; keyin ma’lumot kelgach kesh yoziladi', async () => {
    mockMem.set('user_id', 9);
    mockSub.mockResolvedValue({ data: { data: { sms: { total: 10, used: 2, remaining: 8 } } } });
    let r!: TestRenderer.ReactTestRenderer;
    act(() => { r = TestRenderer.create(<SmsStatsPanel />); });
    expect(r.root.findAllByProps({ testID: 'sms-stats-skeleton' }).length).toBeGreaterThan(0);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
    expect(r.root.findAllByProps({ testID: 'sms-stats-skeleton' }).length).toBe(0);
    expect(readSmsStatsCache()?.subscription?.sms?.total).toBe(10);
  });

  test('boshqa foydalanuvchi keshi ko‘rinmaydi', () => {
    mockMem.set('user_id', 1);
    mockMem.set('smsStatsCache:v1:2', JSON.stringify({ subscription: { sms: { total: 1 } }, stats: null, undelivered: 1 }));
    expect(readSmsStatsCache()).toBeNull();
  });

  test('yangilash xato bersa kesh qoladi (jim)', async () => {
    mockMem.set('user_id', 5);
    mockMem.set('smsStatsCache:v1:5', JSON.stringify({ subscription: { sms: { total: 100, used: 40, remaining: 60 } }, stats: null, undelivered: 7, cachedAt: Date.now() }));
    mockSub.mockRejectedValue(new Error('net'));
    let r!: TestRenderer.ReactTestRenderer;
    await act(async () => { r = TestRenderer.create(<SmsStatsPanel />); });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(texts(r)).toContain('100');
  });
});

describe('smsStatsCache: yosh va xodim', () => {
  beforeEach(() => mockMem.clear());
  const snap = (cachedAt: number) =>
    JSON.stringify({ subscription: { sms: { total: 1 } }, stats: null, undelivered: 1, cachedAt });

  test('24 soatdan eski kesh ishlatilmaydi', () => {
    mockMem.set('user_id', 5);
    mockMem.set('smsStatsCache:v1:5', snap(Date.now() - 25 * 3600_000));
    expect(readSmsStatsCache()).toBeNull();
    mockMem.set('smsStatsCache:v1:5', snap(Date.now() - 3600_000));
    expect(readSmsStatsCache()).not.toBeNull();
  });
  test('cachedAt yo‘q (eski format) ishlatilmaydi', () => {
    mockMem.set('user_id', 5);
    mockMem.set('smsStatsCache:v1:5', JSON.stringify({ subscription: { sms: {} }, stats: null, undelivered: 1 }));
    expect(readSmsStatsCache()).toBeNull();
  });
  test('xodim rejimida kesh o‘qilmaydi (egasining user_id si bilan almashadi)', () => {
    mockMem.set('user_id', 5);
    mockMem.set('xodim_session', '1');
    mockMem.set('smsStatsCache:v1:5', snap(Date.now()));
    expect(readSmsStatsCache()).toBeNull();
  });
  test('stats so‘rovi xato bersa cachedAt YANGILANMAYDI (eskirgan stats yangi bo‘lib qolmasin)', async () => {
    const old = Date.now() - 3600_000;
    mockMem.set('user_id', 5);
    mockMem.set('smsStatsCache:v1:5', JSON.stringify({ subscription: { sms: { total: 1 } }, stats: { by_type: {} }, undelivered: 1, cachedAt: old }));
    mockSub.mockResolvedValue({ data: { data: { sms: { total: 2, used: 0, remaining: 2 } } } });
    const { financeApi } = require('../src/screens/home/modules/financeApi');
    financeApi.getSmsStats.mockRejectedValueOnce(new Error('x'));
    await act(async () => { TestRenderer.create(<SmsStatsPanel />); });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    const saved = JSON.parse(mockMem.get('smsStatsCache:v1:5'));
    expect(saved.subscription.sms.total).toBe(2);
    expect(saved.stats).toEqual({ by_type: {} });
    expect(saved.cachedAt).toBe(old);
  });
});
