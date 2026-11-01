/**
 * type 49 (SMS yetkazilmadi) bildirishnomasi: «Ok» o'rniga «Qayta yuborish».
 * resend (POST) -> toast + karta olib tashlanadi + qarz sahifasiga o'tish; har bir xato kodi; qo'sh bosish = 1 so'rov;
 * «Qarzga o'tish» -> navigatsiya + PUT /ok; boshqa turlarda «Ok» o'zgarmagan.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockDispatch = jest.fn();
const mockToast = jest.fn();
const mockPut = jest.fn();
const mockPost = jest.fn();
const mockEmit = jest.fn();
const mockOpen = jest.fn();
const mockRnToast = jest.fn();
let mockFocused = true;

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn: (s: any) => any) => fn({ HomeReducer: { user: { data: { id: 5 } } } }),
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn(), isFocused: () => mockFocused }) }));
jest.mock('react-native-toast-message/lib/src/Toast', () => ({ Toast: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockRnToast(...a) } }));
jest.mock('axios', () => ({ __esModule: true, default: { put: (...a: unknown[]) => mockPut(...a), post: (...a: unknown[]) => mockPost(...a) } }));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/store/reducers/HomeReducer', () => ({ filter_notification: (id: any) => ({ type: 'filter', id }) }));
jest.mock('../src/store/api/home', () => ({
  getCreditorDataAndDebitorData: () => ({ type: 'gcd' }),
  HomeApi: () => ({ type: 'HomeApi' }),
}));
jest.mock('../src/helper', () => ({ toastMessage: (t: any) => `toast:${t}` }));
jest.mock('../src/helper/socketService', () => ({ __esModule: true, default: { emit: (...a: unknown[]) => mockEmit(...a) } }));
jest.mock('../src/hooks/useOfertaGuard', () => ({ useOfertaGuard: () => (fn: () => void) => fn() }));
jest.mock('../src/screens/home/modules/qarzAmaliyot', () => ({ openCreationAmaliyot: (...a: unknown[]) => mockOpen(...a) }));
jest.mock('../src/screens/home/modules/components/smsDeliveryFormat', () => ({ smsFailureText: () => 'sabab' }));
jest.mock('../src/theme/rd', () => ({
  rd: { color: new Proxy({}, { get: () => '#000' }), font: new Proxy({}, { get: () => 'F' }), radius: new Proxy({}, { get: () => 8 }) },
  rs: (n: number) => n,
}));
jest.mock('../src/theme/style', () => ({ style: { fontSize: new Proxy({}, { get: () => 12 }) } }));
jest.mock('../src/screens/components/NotificationShell', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: ({ actions, onOk, children }: any) => R.createElement('Shell', null, children, actions, onOk ? R.createElement('OkBtn', { onPress: onOk }) : null),
    NotifButton: (p: any) => R.createElement('Btn', p),
  };
});
// Boshqa tur kartalari (35/40/...) bu testda kerak emas.
jest.mock('../src/screens/home/notifications/all/Expire_Passport', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/notifications/all/GapTaklif', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/notifications/all/MoliyaEslatma', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/notifications/all/QarzDaftariEslatma', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/notifications/all/ShaxsiyQarzEslatma', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/notifications/all/DebtPlanEslatma', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/notifications/all/FamilyInviteTaklif', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/notifications/all/Shikoyat', () => ({ __esModule: true, default: () => null }));

import { useNotificationActions } from '../src/screens/home/notification/useNotificationActions';
import { renderOtherNotification } from '../src/screens/home/notification/renderOtherNotification';

const ITEM = { id: 149, type: 49, ud_qarz_id: 77, ud_mijoz: 'Ali', failure_reason: null };

const Harness = ({ item }: { item: any }) => {
  const actions = useNotificationActions();
  return <>{renderOtherNotification(item, actions as any)}</>;
};
const mount = async (item: any = ITEM) => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => { r = TestRenderer.create(<Harness item={item} />); });
  return r;
};
const btn = (r: TestRenderer.ReactTestRenderer, label: string) => r.root.findAll(n => String(n.type) === 'Btn' && n.props.label === label)[0];
const press = async (r: TestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => { await btn(r, label).props.onPress(); });
};
const err = (status: number, code: string) => ({ response: { status, data: { success: false, code, message: code } } });
const toastDesc = () => mockToast.mock.calls.map(c => c[0].props.desc);
const removed = () => mockDispatch.mock.calls.some(c => c[0]?.type === 'filter' && c[0].id === 149);

beforeEach(() => {
  [mockDispatch, mockToast, mockPut, mockPost, mockEmit, mockOpen, mockRnToast].forEach(m => m.mockReset());
  mockFocused = true;
  mockOpen.mockResolvedValue(true);
  mockPut.mockResolvedValue({ status: 200 });
});

test('type 49: «Ok» yo\'q, «Qayta yuborish» va «Qarzga o\'tish» bor', async () => {
  const r = await mount();
  expect(btn(r, 'Ok')).toBeUndefined();
  expect(btn(r, 'Qayta yuborish')).toBeDefined();
  expect(btn(r, 'Qarzga o‘tish')).toBeDefined();
});

test('resend muvaffaqiyat: POST, toast, karta olib tashlandi, qarz sahifasiga o\'tildi', async () => {
  mockPost.mockResolvedValue({ data: { success: true, sent: true, renotified: false } });
  const r = await mount();
  await press(r, 'Qayta yuborish');
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockPost.mock.calls[0][0]).toBe('http://x/notification/sms-undelivered/149/resend');
  expect(toastDesc()).toEqual(['SMS qayta yuborildi']);
  expect(removed()).toBe(true);
  expect(mockOpen).toHaveBeenCalledWith(expect.anything(), 77);
  expect(mockPut).not.toHaveBeenCalled();
});

test('resend: yana yetkazilmadi (renotified) — alohida toast, karta olib tashlanadi, navigatsiya', async () => {
  mockPost.mockResolvedValue({ data: { success: true, sent: false, renotified: true, reason: 'UNDELIV' } });
  const r = await mount();
  await press(r, 'Qayta yuborish');
  expect(toastDesc()).toEqual(['SMS qayta yuborildi, lekin yana yetkazilmadi']);
  expect(removed()).toBe(true);
  expect(mockOpen).toHaveBeenCalledTimes(1);
});

test.each([
  ['plan-required', 403, 'Bu amal uchun tarif kerak', false],
  ['no-sms-package', 402, 'SMS paketi tugadi', false],
  ['already-resent', 409, 'Bu SMS allaqachon qayta yuborilgan', true],
  ['debt-gone', 410, 'Qarz mavjud emas', true],
  ['debt-closed', 410, 'Qarz yopilgan', true],
  ['not-found', 404, 'Xatolik sodir bo‘ldi', true],
  ['not-allowed', 403, 'Xatolik sodir bo‘ldi', false],
  ['sms-not-sent', 502, 'SMS yuborib bo‘lmadi. Keyinroq urinib ko‘ring.', false],
  ['not-migrated', 503, 'Xatolik sodir bo‘ldi', false],
  ['invalid-id', 400, 'Xatolik sodir bo‘ldi', false],
  ['', 429, 'Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.', false],
])('resend xatosi %s (%i): toast "%s", karta o\'chadi=%s, navigatsiya yo\'q', async (code, status, msg, isRemoved) => {
  mockPost.mockRejectedValue(err(status as number, code as string));
  const r = await mount();
  await press(r, 'Qayta yuborish');
  expect(toastDesc()).toEqual([msg]);
  expect(mockToast.mock.calls[0][0].type).toBe('error2');
  expect(removed()).toBe(isRemoved);
  // Ma'nosiz bildirishnoma serverdan ham o'chadi (PUT /ok, jim); qolganlarida PUT yo'q.
  await act(async () => { await Promise.resolve(); });
  if (isRemoved) expect(mockPut.mock.calls.map(c => c[0])).toEqual(['http://x/notification/ok/149']);
  else expect(mockPut).not.toHaveBeenCalled();
  expect(mockOpen).not.toHaveBeenCalled();
});

test('remove:true xatosida PUT /ok yiqilsa ham jim', async () => {
  mockPost.mockRejectedValue(err(410, 'debt-gone'));
  mockPut.mockRejectedValue(new Error('x'));
  const r = await mount();
  await press(r, 'Qayta yuborish');
  await act(async () => { await Promise.resolve(); });
  expect(toastDesc()).toEqual(['Qarz mavjud emas']);
});

test('tarmoq xatosi (javobsiz) — umumiy xato, karta qoladi', async () => {
  mockPost.mockRejectedValue(new Error('Network Error'));
  const r = await mount();
  await press(r, 'Qayta yuborish');
  expect(toastDesc()).toEqual(['Xatolik sodir bo‘ldi']);
  expect(removed()).toBe(false);
});

test('ikki marta tez bosish — bitta so\'rov', async () => {
  let resolve!: (v: unknown) => void;
  mockPost.mockReturnValue(new Promise(res => { resolve = res; }));
  const r = await mount();
  await act(async () => {
    const p1 = btn(r, 'Qayta yuborish').props.onPress();
    const p2 = btn(r, 'Qayta yuborish').props.onPress();
    resolve({ data: { success: true, sent: true, renotified: false } });
    await Promise.all([p1, p2]);
  });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockOpen).toHaveBeenCalledTimes(1);
});

test('«Qarzga o\'tish»: navigatsiya + PUT /ok + karta olib tashlanadi', async () => {
  const r = await mount();
  await press(r, 'Qarzga o‘tish');
  expect(mockOpen).toHaveBeenCalledWith(expect.anything(), 77);
  expect(mockPut).toHaveBeenCalledTimes(1);
  expect(mockPut.mock.calls[0][0]).toBe('http://x/notification/ok/149');
  expect(removed()).toBe(true);
  expect(mockPost).not.toHaveBeenCalled();
});

test('«Qarzga o\'tish»: PUT /ok xato bersa ham yiqilmaydi, toast yo\'q', async () => {
  mockPut.mockRejectedValue(new Error('x'));
  const r = await mount();
  await press(r, 'Qarzga o‘tish');
  expect(mockOpen).toHaveBeenCalledTimes(1);
  expect(mockToast).not.toHaveBeenCalled();
});

test('«Qarzga o\'tish»: sahifa ochilmasa karta qoladi', async () => {
  mockOpen.mockResolvedValue(false);
  const r = await mount();
  await press(r, 'Qarzga o‘tish');
  expect(mockPut).not.toHaveBeenCalled();
  expect(removed()).toBe(false);
});

test('boshqa bildirishnoma turida «Ok» o\'zgarmagan (okay chaqiriladi, resend yo\'q)', async () => {
  const r = await mount({ id: 9, type: 999, created: 'c' });
  expect(btn(r, 'Qayta yuborish')).toBeUndefined();
  const ok = r.root.findAll(n => String(n.type) === 'OkBtn')[0];
  expect(ok).toBeDefined();
  await act(async () => { await ok.props.onPress(); });
  expect(mockPut.mock.calls[0][0]).toBe('http://x/notification/ok/9');
  expect(mockPost).not.toHaveBeenCalled();
});

test('resend muvaffaqiyatidan keyin ekran fokusda emas: navigatsiya yo‘q (karta baribir olinadi)', async () => {
  mockPost.mockResolvedValue({ data: { success: true, sent: true, renotified: false } });
  mockFocused = false;
  const r = await mount();
  await press(r, 'Qayta yuborish');
  expect(removed()).toBe(true);
  expect(mockOpen).not.toHaveBeenCalled();
});

test('resend muvaffaqiyati, lekin qarz sahifasi ochilmadi — xato toast', async () => {
  mockPost.mockResolvedValue({ data: { success: true, sent: true, renotified: false } });
  mockOpen.mockResolvedValue(false);
  const r = await mount();
  await press(r, 'Qayta yuborish');
  expect(mockRnToast).toHaveBeenCalledWith({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
});

test('qarz id yo‘q: «Qarzga o‘tish» serverdan o‘chiradi (PUT /ok) va Qarz topilmadi deydi, navigatsiya yo‘q', async () => {
  const r = await mount({ id: 149, type: 49, ud_mijoz: 'Ali' });
  await press(r, 'Qarzga o‘tish');
  expect(mockOpen).not.toHaveBeenCalled();
  expect(mockPut.mock.calls[0][0]).toBe('http://x/notification/ok/149');
  expect(removed()).toBe(true);
  expect(mockRnToast).toHaveBeenCalledWith({ type: 'error2', props: { desc: 'Qarz topilmadi' } });
});

test('resend ketayotganda «Qarzga o‘tish» disabled, bir kadrdagi ikkinchi bosish spinnerni o‘chirmaydi', async () => {
  let resolve!: (v: unknown) => void;
  mockPost.mockReturnValue(new Promise(res => { resolve = res; }));
  const r = await mount();
  let p1!: Promise<void>;
  await act(async () => {
    p1 = btn(r, 'Qayta yuborish').props.onPress();
    await btn(r, 'Qayta yuborish').props.onPress(); // ikkinchi bosish — darhol qaytadi
    await btn(r, 'Qarzga o‘tish').props.onPress(); // ref qo'riqchi: ochilmaydi
  });
  expect(btn(r, 'Qayta yuborish').props.loading).toBe(true);
  expect(btn(r, 'Qarzga o‘tish').props.disabled).toBe(true);
  expect(mockOpen).not.toHaveBeenCalled();
  await act(async () => { resolve({ data: { success: true, sent: true, renotified: false } }); await p1; });
  expect(mockPost).toHaveBeenCalledTimes(1);
});

test('type 49 kartasiga okay uzatilmaydi', () => {
  const el: any = renderOtherNotification(ITEM, { okay: jest.fn(), smsResend: jest.fn(), smsUndeliveredSeen: jest.fn() } as any);
  expect(el.props.okay).toBeUndefined();
  expect(typeof el.props.onResend).toBe('function');
});
