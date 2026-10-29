/**
 * QarzDaftariYetkazilmagan ekrani: sahifalash (qo'sh bosish = 1 so'rov, oxirgi sahifada to'xtash),
 * "Qarzni ochish" -> QarzDaftariQarz { id }, do'kon id uzatilishi, oflayn (so'rovsiz), xato.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockGet = jest.fn();
const mockNavigate = jest.fn();
let mockOnline = true;
let mockParams: Record<string, unknown> = { shopId: 3 };

jest.mock('axios', () => ({ __esModule: true, default: { get: (...a: unknown[]) => mockGet(...a) } }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])) }),
}));
jest.mock('../src/helper', () => ({ fmtDateTimeUz: (v: string) => `D:${v}` }));
jest.mock('../src/offline/netStatus', () => ({ isOnline: () => mockOnline, useIsOnline: () => mockOnline }));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/offline/ui/NotSavedOffline', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/components/AnimatedEmpty', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/theme/rd', () => {
  const rdMock = {
    color: new Proxy({}, { get: () => '#000' }),
    font: new Proxy({}, { get: () => 'F' }),
    radius: new Proxy({}, { get: () => 8 }),
  };
  return { rd: rdMock, rs: (n: number) => n };
});

import QarzDaftariYetkazilmagan from '../src/screens/home/modules/QarzDaftariYetkazilmagan';

const mkRows = (from: number, n: number) =>
  Array.from({ length: n }, (_v, i) => ({ id: from + i, mijoz_fish: `M${from + i}`, phone: '9', qarz_id: 100 + from + i, sms_type: 'auto', created_at: 'd', state: 'undelivered', raw: 'UNDELIV' }));
const ok = (count: number, rows: unknown[]) => ({ data: { success: true, data: { count, rows } } });
const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
const mount = async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => { r = TestRenderer.create(<QarzDaftariYetkazilmagan />); });
  await flush();
  return r;
};
const press = (r: TestRenderer.ReactTestRenderer, label: string) =>
  r.root.findAll(n => n.props.accessibilityLabel === label && n.props.onPress)[0];

beforeEach(() => { mockGet.mockReset(); mockNavigate.mockReset(); mockOnline = true; mockParams = { shopId: 3 }; });

test('do\'kon id so\'rovga uzatiladi va "Qarzni ochish" QarzDaftariQarz{id} ga o\'tadi', async () => {
  mockGet.mockResolvedValueOnce(ok(2, mkRows(1, 2)));
  const r = await mount();
  expect(mockGet.mock.calls[0][1].params).toEqual({ days: 7, page: 1, limit: 20, faoliyat_id: 3 });
  await act(async () => { press(r, 'Qarzni ochish: M1').props.onPress(); });
  expect(mockNavigate).toHaveBeenCalledWith('QarzDaftariQarz', { id: 101 });
});

test('shopId yo\'q — faoliyat_id yuborilmaydi', async () => {
  mockParams = {};
  mockGet.mockResolvedValueOnce(ok(0, []));
  await mount();
  expect(mockGet.mock.calls[0][1].params).toEqual({ days: 7, page: 1, limit: 20 });
});

test('sahifalash: qo\'sh bosish bitta so\'rov, oxirgi sahifadan keyin tugma yo\'q', async () => {
  mockGet.mockResolvedValueOnce(ok(23, mkRows(1, 20)));
  mockGet.mockResolvedValueOnce(ok(23, mkRows(21, 3)));
  const r = await mount();
  const more = () => r.root.findAll(n => n.props.onPress && n.props.accessibilityRole === 'button' && !n.props.accessibilityLabel)[0];
  expect(more()).toBeDefined();
  await act(async () => { more().props.onPress(); more().props.onPress(); });
  await flush();
  expect(mockGet).toHaveBeenCalledTimes(2);
  expect(mockGet.mock.calls[1][1].params.page).toBe(2);
  expect(more()).toBeUndefined();
});

test('oflaynda so\'rov yuborilmaydi', async () => {
  mockOnline = false;
  await mount();
  expect(mockGet).not.toHaveBeenCalled();
});

test('xatoda qulamaydi (qayta urinish holati)', async () => {
  mockGet.mockRejectedValueOnce(new Error('500'));
  const r = await mount();
  expect(r.toJSON()).not.toBeNull();
});
