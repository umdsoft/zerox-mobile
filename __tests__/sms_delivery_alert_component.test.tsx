/**
 * SmsDeliveryAlert komponent testi: yashirinish (xato/oflayn), do'kon almashuvi poygasi,
 * sahifalash to'xtashi, "Qarzni ochish" navigatsiya parametri, sessiya almashuvi.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockGet = jest.fn();
const mockNavigate = jest.fn();
let mockOnline = true;

jest.mock('axios', () => ({ __esModule: true, default: { get: (...a: unknown[]) => mockGet(...a) } }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])) }),
}));
jest.mock('../src/helper', () => ({ fmtDateTimeUz: (v: string) => `D:${v}` }));
jest.mock('../src/offline/netStatus', () => ({ isOnline: () => mockOnline, useIsOnline: () => mockOnline }));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/screens/home/redesign/icons', () => ({ MessageIcon: () => null }));
jest.mock('../src/theme/rd', () => {
  const rdMock = { color: new Proxy({}, { get: () => '#000' }), font: new Proxy({}, { get: () => 'F' }) };
  return { rd: rdMock, rs: (n: number) => n };
});

import SmsDeliveryAlert from '../src/screens/home/modules/components/SmsDeliveryAlert';

const mkRows = (from: number, n: number) =>
  Array.from({ length: n }, (_v, i) => ({ id: from + i, mijoz_id: 1, mijoz_fish: `M${from + i}`, phone: '9', qarz_id: 100 + from + i, sms_type: 'auto', created_at: 'd', state: 'undelivered', raw: 'UNDELIV' }));
const ok = (count: number, rows: unknown[]) => ({ data: { success: true, data: { count, rows } } });
const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
const texts = (r: { root: TestRenderer.ReactTestInstance }) =>
  r.root.findAll(n => (n.type as unknown) === 'Text').map(n => [n.props.children].flat().join(''));

const mount = async (props: Partial<React.ComponentProps<typeof SmsDeliveryAlert>> = {}) => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => { r = TestRenderer.create(<SmsDeliveryAlert shopId={null} {...props} />); });
  await flush();
  return r;
};

beforeEach(() => { mockGet.mockReset(); mockNavigate.mockReset(); mockOnline = true; });

test('xatoda karta ko\'rinmaydi', async () => {
  mockGet.mockRejectedValue(new Error('net'));
  const r = await mount();
  expect(r.toJSON()).toBeNull();
});

test('oflaynda so\'rov yuborilmaydi va karta yo\'q', async () => {
  mockOnline = false;
  const r = await mount();
  expect(mockGet).not.toHaveBeenCalled();
  expect(r.toJSON()).toBeNull();
});

test('count > 0 bo\'lsa karta; faoliyat_id faqat do\'kon tanlanganda', async () => {
  mockGet.mockResolvedValue(ok(2, mkRows(1, 2)));
  const r = await mount({ shopId: 7 });
  expect(texts(r).some(t => t.includes('2 ta SMS'))).toBe(true);
  expect(mockGet.mock.calls[0][1].params).toEqual({ days: 7, page: 1, limit: 20, faoliyat_id: 7 });
});

test('do\'kon almashsa eski javob tashlanadi (poyga)', async () => {
  let resolveA!: (v: unknown) => void;
  mockGet.mockImplementationOnce(() => new Promise(res => { resolveA = res; }));
  mockGet.mockResolvedValueOnce(ok(5, mkRows(1, 5)));
  const r = await mount({ shopId: 1 });
  await act(async () => { r.update(<SmsDeliveryAlert shopId={2} />); });
  await flush();
  await act(async () => { resolveA(ok(99, mkRows(50, 3))); });
  await flush();
  const all = texts(r).join('|');
  expect(all).toContain('5 ta SMS');
  expect(all).not.toContain('99 ta SMS');
});

test('sahifalash: <limit qator qaytsa "Yana ko\'rsatish" yo\'qoladi; Qarzni ochish param', async () => {
  mockGet.mockResolvedValueOnce(ok(25, mkRows(1, 20)));
  mockGet.mockResolvedValueOnce(ok(25, mkRows(21, 3)));
  const r = await mount();
  expect(texts(r).includes('Yana ko‘rsatish')).toBe(false); // modal yopiq
  const open = r.root.findAll(n => n.props.onPress && [n.props.children].flat().some((c: any) => c?.props?.children === 'Ko‘rish'))[0];
  await act(async () => { open.props.onPress(); });
  const more = () => r.root.findAll(n => n.props.onPress && texts({ root: n }).includes('Yana ko‘rsatish'))[0];
  expect(more()).toBeDefined();
  await act(async () => { more().props.onPress(); more().props.onPress(); }); // qo'sh bosish
  await flush();
  expect(mockGet).toHaveBeenCalledTimes(2);
  expect(mockGet.mock.calls[1][1].params.page).toBe(2);
  expect(more()).toBeUndefined();
  const debt = r.root.findAll(n => n.props.accessibilityLabel === 'Qarzni ochish: M1')[0];
  await act(async () => { debt.props.onPress(); });
  expect(mockNavigate).toHaveBeenCalledWith('QarzDaftariQarz', { id: 101 });
});

test('sessionKey o\'zgarsa eski qatorlar tozalanadi', async () => {
  mockGet.mockResolvedValueOnce(ok(1, mkRows(1, 1)));
  mockGet.mockRejectedValueOnce(new Error('403'));
  const r = await mount({ sessionKey: 'xodim:A' });
  expect(r.toJSON()).not.toBeNull();
  await act(async () => { r.update(<SmsDeliveryAlert shopId={null} sessionKey="owner" />); });
  await flush();
  expect(r.toJSON()).toBeNull();
});
