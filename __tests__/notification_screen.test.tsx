/**
 * Notification (bildirishnomalar ro'yxati) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan.
 * Bola komponentlar (notifications/all/*) chegarada mock: nomi + proplar (funksiyalar '[fn]', `navigation` tashlanadi) — shu bilan
 * tur -> komponent moslashuvi va proplar qotiriladi. Handlerlar (okay/onSuccess/onReject/...) bola proplari orqali chaqirilib
 * axios endpoint/payload, toast va dispatch tekshiriladi. Qayta yaratish (FAQAT eski kod bilan): NF_TREE_GEN=1 npx jest notification_screen
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockDispatch = jest.fn((a: any) => (a && a.type === 'gnp' ? { unwrap: () => Promise.resolve() } : a));
const mockToast = jest.fn();
const mockPut = jest.fn();
const mockPost = jest.fn();
const mockApiPost = jest.fn();
const mockSocketOn = jest.fn();
const mockSocketOff = jest.fn();
const mockSocketEmit = jest.fn();
const mockConnect = jest.fn();
let mockState: any = {};
let mockFocused = true;
let mockGuardBlocks = false;
let mockSocket: any = null;

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn: (s: any) => any) => fn(mockState),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useIsFocused: () => mockFocused,
}));
jest.mock('@react-navigation/material-top-tabs', () => ({
  createMaterialTopTabNavigator: () => ({
    Navigator: ({ children }: any) => require('react').createElement('Tabs', null, children),
    Screen: ({ component: C, name }: any) => require('react').createElement('TabScreen', { name }, require('react').createElement(C)),
  }),
}));
jest.mock('../src/navigation/TopTabBar', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/components/NewsNotification', () => ({ __esModule: true, default: () => null }));
jest.mock('react-native-toast-message/lib/src/Toast', () => ({ Toast: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('axios', () => ({ __esModule: true, default: { put: (...a: unknown[]) => mockPut(...a), post: (...a: unknown[]) => mockPost(...a) } }));
jest.mock('../src/store/api/apiClient', () => ({ __esModule: true, default: { post: (...a: unknown[]) => mockApiPost(...a) } }));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/store/reducers/HomeReducer', () => ({ filter_notification: (id: any) => ({ type: 'filter', id }) }));
jest.mock('../src/store/api/home', () => ({
  getCreditorDataAndDebitorData: () => ({ type: 'gcd' }),
  getNotificationWithPage: (p: any) => ({ type: 'gnp', p }),
  HomeApi: (p: any) => ({ type: 'HomeApi', p }),
}));
jest.mock('../src/helper', () => ({ toastMessage: (t: any) => `toast:${t}` }));
jest.mock('../src/helper/listPerf', () => ({ LIST_PERF_PROPS: {} }));
jest.mock('../src/helper/socketService', () => ({
  __esModule: true,
  default: {
    on: (...a: unknown[]) => mockSocketOn(...a),
    off: (...a: unknown[]) => mockSocketOff(...a),
    emit: (...a: unknown[]) => mockSocketEmit(...a),
    getSocket: () => mockSocket,
  },
}));
jest.mock('../src/hooks/useOfertaGuard', () => ({
  useOfertaGuard: () => (fn: () => void) => {
    if (!mockGuardBlocks) fn();
  },
}));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdHeader', { title: p.title }),
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size })) },
    ),
);
jest.mock('../src/screens/home/notifications/all/NotifFallback', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('NotifFallback', { id: p.item?.id }),
  NotifItemBoundary: (p: any) => require('react').createElement('Boundary', { id: p.item?.id }, p.children),
}));
jest.mock('../src/screens/home/notifications/all/Qarzdanvozkechilganligitogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('Qarzdanvozkechilganligitogrisida') }));
jest.mock('../src/screens/home/notifications/all/QarzShartnomasiniRasmiylashtirishTogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzShartnomasiniRasmiylashtirishTogrisida') }));
jest.mock('../src/screens/home/notifications/all/Qarzmuddatiuzaytirilganligitogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('Qarzmuddatiuzaytirilganligitogrisida') }));
jest.mock('../src/screens/home/notifications/all/QarzToliqQaytarilganli', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzToliqQaytarilganli') }));
jest.mock('../src/screens/home/notifications/all/Qarzniqaytarishtalabqilinganligitogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('Qarzniqaytarishtalabqilinganligitogrisida') }));
jest.mock('../src/screens/home/notifications/all/Qarzqismanqaytarilganli', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('Qarzqismanqaytarilganli') }));
jest.mock('../src/screens/home/notifications/all/Qarzmuddatiniuzaytirishsoralganligitogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('Qarzmuddatiniuzaytirishsoralganligitogrisida') }));
jest.mock('../src/screens/home/notifications/all/Qarzniqaytarishqabulqilinmaganligitogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('Qarzniqaytarishqabulqilinmaganligitogrisida') }));
jest.mock('../src/screens/home/notifications/all/QarzniQaytarishQabulQilinganligiTogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzniQaytarishQabulQilinganligiTogrisida') }));
jest.mock('../src/screens/home/notifications/all/QarzShartnomasiningRadQilinganligiTogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzShartnomasiningRadQilinganligiTogrisida') }));
jest.mock('../src/screens/home/notifications/all/QarzShartnomasiningQabulQilinganligiTogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzShartnomasiningQabulQilinganligiTogrisida') }));
jest.mock('../src/screens/home/notifications/all/QarzMuddatiniUzaytirishRadEtilganligiTogrisida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzMuddatiniUzaytirishRadEtilganligiTogrisida') }));
jest.mock('../src/screens/home/notifications/all/QarzShartnomasiRuxsatSorash', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzShartnomasiRuxsatSorash') }));
jest.mock('../src/screens/home/notifications/all/QarzniQaytarishRadQilinganligi', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzniQaytarishRadQilinganligi') }));
jest.mock('../src/screens/home/notifications/all/QarzShartnomasiRejectTime', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzShartnomasiRejectTime') }));
jest.mock('../src/screens/home/notifications/all/PulMablagOtkazilganligi', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('PulMablagOtkazilganligi') }));
jest.mock('../src/screens/home/notifications/all/PulMablagOtkazilganligiHaqida', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('PulMablagOtkazilganligiHaqida') }));
jest.mock('../src/screens/home/notifications/all/NewUser', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('NewUser') }));
jest.mock('../src/screens/home/notifications/all/RecoveryPassword', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('RecoveryPassword') }));
jest.mock('../src/screens/home/notifications/all/QarzniMuddatUzaytirishQabul', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzniMuddatUzaytirishQabul') }));
jest.mock('../src/screens/home/notifications/all/MalumotniKorishgaRadEtildi', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('MalumotniKorishgaRadEtildi') }));
jest.mock('../src/screens/home/notifications/all/MalumotniKorishgaRuxsatBerildi', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('MalumotniKorishgaRuxsatBerildi') }));
jest.mock('../src/screens/home/notifications/all/Eslatma', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('Eslatma') }));
jest.mock('../src/screens/home/notifications/all/Expire_Passport', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('ExpirePassport') }));
jest.mock('../src/screens/home/notifications/all/GapTaklif', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('GapTaklif') }));
jest.mock('../src/screens/home/notifications/all/MoliyaEslatma', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('MoliyaEslatma') }));
jest.mock('../src/screens/home/notifications/all/QarzDaftariEslatma', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('QarzDaftariEslatma') }));
jest.mock('../src/screens/home/notifications/all/ShaxsiyQarzEslatma', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('ShaxsiyQarzEslatma') }));
jest.mock('../src/screens/home/notifications/all/DebtPlanEslatma', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('DebtPlanEslatma') }));
jest.mock('../src/screens/home/notifications/all/FamilyInviteTaklif', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('FamilyInviteTaklif') }));
jest.mock('../src/screens/home/notifications/all/Shikoyat', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('Shikoyat') }));
jest.mock('../src/screens/home/notifications/all/SmsUndelivered', () => ({ __esModule: true, default: require('./helpers/notifChildMock').makeChild('SmsUndelivered') }));

import Notification from '../src/screens/home/Notification';

const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const child = (name: string) => (global as any).__notifChild?.[name];

const base = { creditor: 1, debitor: 2, reciver: 1, contract: 'C1', act: 'A1', amount: 1000, currency: 'UZS', created: 'cr' };
const mk = (type: any, id = 100 + Number(type || 0), over: any = {}) => ({ id, type, ...base, ...over });
const stateWith = (bild: any, userId: any = 7) => ({
  HomeReducer: { user: { data: { id: userId } }, pagination: {}, notification: { bild } },
});
const mount = async (bild: any, userId: any = 7) => {
  mockState = stateWith(bild, userId);
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<Notification />);
  });
  return r;
};

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).__notifChild = {};
  (global as any).__notifChildNavigationProp = {};
  mockFocused = true;
  mockGuardBlocks = false;
  mockSocket = null;
  mockPut.mockReset().mockResolvedValue({ status: 200, data: { success: true } });
  mockPost.mockReset().mockResolvedValue({ data: { success: true } });
  mockApiPost.mockReset().mockResolvedValue({});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'notification_screen_tree.json');
const GEN = !!process.env.NF_TREE_GEN;

const TYPES = [0, 1, 4, 2, 3, 17, 16, 12, 9, 15, 10, 7, 8, 13, 11, 22, 21, 24, 23, 25, 26, 27, 19, 31, 30, 32, 35, 40, 41, 44, 46, 45, 47, 48, 49, 42, 43];

describe('Notification — tur -> komponent moslashuvi (render daraxti)', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ...TYPES.map(t => [`type ${t}`, () => mount([mk(t)])] as [string, () => Promise<TestRenderer.ReactTestRenderer>]),
    ['type "17" (string)', () => mount([mk('17', 501)])],
    ['unknown type 999 -> fallback', () => mount([mk(999, 502)])],
    ['missing type -> fallback', () => mount([mk(undefined, 503)])],
    ['empty list', () => mount([])],
    ['null list', () => mount(null)],
    ['mixed list order', () => mount([mk(0, 1), mk(8, 2), mk(40, 3), mk(999, 4)])],
  ];
  const golden: Record<string, string> = !GEN && fs.existsSync(TREE_PATH) ? JSON.parse(fs.readFileSync(TREE_PATH, 'utf8')) : {};
  const rec: Record<string, string> = {};
  afterAll(() => {
    if (GEN) fs.writeFileSync(TREE_PATH, JSON.stringify(rec, null, 1));
  });
  it.each(states.map(s => s[0]))('%s', async name => {
    const r = await states.find(s => s[0] === name)![1]();
    const out = tree(r);
    if (GEN) rec[name] = out;
    else expect(out).toBe(golden[name]);
  });
  it('barcha holatlar goldenda bor', () => {
    if (!GEN) expect(Object.keys(golden).sort()).toEqual(states.map(s => s[0]).sort());
  });
  it('MoliyaEslatma: type 41 daily yo\'q, 46 da daily', async () => {
    await mount([mk(41, 1)]);
    expect(child('MoliyaEslatma').daily).toBeUndefined();
    await mount([mk(46, 2)]);
    expect(child('MoliyaEslatma').daily).toBe(true);
  });
});

describe('Notification — navigation prop drilling olib tashlandi (wave D)', () => {
  it('hech bir bola komponent `navigation` prop olmaydi (ular useNavigation ishlatadi)', async () => {
    for (const t of TYPES) await mount([mk(t, 700 + Number(t))]);
    const flags = (global as any).__notifChildNavigationProp;
    const names = Object.keys(flags);
    expect(names.length).toBeGreaterThanOrEqual(30);
    expect(names.filter(n => flags[n])).toEqual([]);
  });
});

describe('Notification — yangilash va realtime', () => {
  it('mount: bir marta jimgina yangilanadi, socket tinglanadi, uzilgan socket qayta ulanadi', async () => {
    mockSocket = { connected: false, connect: mockConnect };
    const r = await mount([]);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'gnp', p: { page: 1 } });
    expect(mockSocketOn).toHaveBeenCalledWith('recive_notification', expect.any(Function));
    expect(mockConnect).toHaveBeenCalledTimes(1);
    mockDispatch.mockClear();
    await act(async () => {
      mockSocketOn.mock.calls[0][1]();
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'gnp', p: { page: 1 } });
    await act(async () => {
      r.unmount();
    });
    expect(mockSocketOff).toHaveBeenCalledWith('recive_notification', mockSocketOn.mock.calls[0][1]);
  });
  it('ulangan socket qayta ulanmaydi', async () => {
    mockSocket = { connected: true, connect: mockConnect };
    await mount([]);
    expect(mockConnect).not.toHaveBeenCalled();
  });
  it('pull-to-refresh', async () => {
    const r = await mount([mk(0, 1)]);
    mockDispatch.mockClear();
    const rc = r.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
    await act(async () => {
      rc.props.onRefresh();
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'gnp', p: { page: 1 } });
  });
});

describe('Notification — talab dalolatnomasi tanishuvi (type 17 ack)', () => {
  it('fokusda: act bor, ack yo\'q, qabul qiluvchi o\'zim -> POST ack (bir marta)', async () => {
    await mount([mk(17, 1, { act: 'A 1/2', reciver: 7 })]);
    expect(mockApiPost).toHaveBeenCalledTimes(1);
    expect(mockApiPost).toHaveBeenCalledWith('/contract/act/A%201%2F2/ack', {});
  });
  it('fokus yo\'q / act_ack_at bor / boshqa qabul qiluvchi / act yo\'q / type boshqa -> yo\'q', async () => {
    mockFocused = false;
    await mount([mk(17, 1, { reciver: 7 })]);
    mockFocused = true;
    await mount([mk(17, 2, { reciver: 7, act_ack_at: '2026-01-01' })]);
    await mount([mk(17, 3, { reciver: 99 })]);
    await mount([mk(17, 4, { reciver: 7, act: '' })]);
    await mount([mk(16, 5, { reciver: 7 })]);
    expect(mockApiPost).not.toHaveBeenCalled();
  });
  it('reciver null bo\'lsa ham yuboriladi', async () => {
    await mount([mk(17, 1, { reciver: null })]);
    expect(mockApiPost).toHaveBeenCalledTimes(1);
  });
  it('5xx xatoda keyingi render\'da qayta uriniladi, 4xx da yo\'q', async () => {
    mockApiPost.mockRejectedValue({ response: { status: 500 } });
    const r = await mount([mk(17, 1, { reciver: 7, act: 'X5' })]);
    await act(async () => {});
    mockState = stateWith([mk(17, 1, { reciver: 7, act: 'X5' }), mk(1, 9)]);
    await act(async () => {
      r.update(<Notification />);
    });
    expect(mockApiPost.mock.calls.filter(c => c[0].includes('X5'))).toHaveLength(2);
    mockApiPost.mockClear();
    mockApiPost.mockRejectedValue({ response: { status: 403 } });
    const r2 = await mount([mk(17, 2, { reciver: 7, act: 'X4' })]);
    await act(async () => {});
    mockState = stateWith([mk(17, 2, { reciver: 7, act: 'X4' }), mk(1, 9)]);
    await act(async () => {
      r2.update(<Notification />);
    });
    expect(mockApiPost.mock.calls.filter(c => c[0].includes('X4'))).toHaveLength(1);
  });
});

describe('Notification — handlerlar (bola proplari orqali)', () => {
  const H = (name: string) => child(name);
  const headers = { headers: { Authorization: 'Bearer tok' } };

  it('okay: dispatch filter -> PUT ok -> socket emit + toast', async () => {
    await mount([mk(25, 5)]);
    await act(async () => {
      await H('NewUser').okay(5, 3);
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'filter', id: 5 });
    expect(mockPut).toHaveBeenCalledWith('http://x/notification/ok/5', {}, headers);
    expect(mockSocketEmit).toHaveBeenCalledWith('notification', { userId: 7 });
    expect(mockToast).toHaveBeenCalledWith({ autoHide: true, position: 'bottom', props: { desc: 'toast:3' }, type: 'omad', visibilityTime: 2000 });
  });
  it('okay: status 200 emas -> toast yo\'q; xato -> error2 toast', async () => {
    await mount([mk(25, 5)]);
    mockPut.mockResolvedValue({ status: 204 });
    await act(async () => {
      await H('NewUser').okay(5, 3);
    });
    expect(mockToast).not.toHaveBeenCalled();
    mockPut.mockRejectedValue(new Error('x'));
    await act(async () => {
      await H('NewUser').okay(5, 3);
    });
    expect(mockToast).toHaveBeenCalledWith({ autoHide: true, position: 'bottom', props: { desc: 'Xatolik sodir bo‘ldi' }, type: 'error2', visibilityTime: 2000 });
  });
  const itm = { id: 55, creditor: 1, debitor: 2, reciver: 1, contract: 'C1', act: 'A1' };
  it('onSuccess creditor: payload + toast 264 + dispatch', async () => {
    await mount([mk(0, 1)]);
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onSuccess(itm, 1, 'creditor');
    });
    expect(mockPut).toHaveBeenCalledWith(
      'http://x/notification/success/55',
      { act: 'A1', contract: 'C1', creditor: 1, debitor: 2, reciver: 1, stype: 1, sender: 2, res: 7 },
      headers,
    );
    expect(mockToast).toHaveBeenCalledWith({ autoHide: true, position: 'bottom', props: { desc: '264' }, type: 'omad', visibilityTime: 3000 });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'gcd' });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'filter', id: 55 });
  });
  it('onSuccess creditor: user = debitor bo\'lsa sender = creditor', async () => {
    await mount([mk(0, 1)], 2);
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onSuccess(itm, 1, 'creditor');
    });
    expect(mockPut.mock.calls[0][1].sender).toBe(1);
    expect(mockPut.mock.calls[0][1].res).toBe(2);
  });
  it('onSuccess debitor: reciver = debitor, sender/res yo\'q', async () => {
    await mount([mk(0, 1)]);
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onSuccess(itm, 2, 'debitor');
    });
    expect(mockPut.mock.calls[0][1]).toEqual({ act: 'A1', contract: 'C1', creditor: 1, debitor: 2, reciver: 2, stype: 2 });
  });
  it('onSuccess: success:false -> hech narsa; xato -> error2 toast 294', async () => {
    await mount([mk(0, 1)]);
    mockPut.mockResolvedValue({ data: { success: false } });
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onSuccess(itm, 1, 'creditor');
    });
    expect(mockToast).not.toHaveBeenCalled();
    mockPut.mockRejectedValue(new Error('x'));
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onSuccess(itm, 1, 'creditor');
    });
    expect(mockToast).toHaveBeenCalledWith({ autoHide: true, position: 'bottom', props: { desc: '294' }, type: 'error2', visibilityTime: 3000 });
  });
  it('oferta qo\'riqchisi: status 1 -> guard orqali, status 2 -> to\'g\'ridan-to\'g\'ri', async () => {
    mockGuardBlocks = true;
    await mount([mk(0, 1)]);
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onSuccess(itm, 1, 'creditor');
    });
    expect(mockPut).not.toHaveBeenCalled();
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onSuccess(itm, 2, 'creditor');
    });
    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(H('QarzToliqQaytarilganli')).toBeUndefined();
  });
  it('onReject type 1 / 2 payload; toast 261 (error2)', async () => {
    await mount([mk(0, 1)]);
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onReject(itm, 2, 1);
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'filter', id: 55 });
    expect(mockPut).toHaveBeenLastCalledWith(
      'http://x/notification/success/55',
      { debitor: 2, creditor: 1, act: 'A1', contract: 'C1', stype: 2, reciver: 1, sender: 2, res: 7 },
      headers,
    );
    expect(mockToast).toHaveBeenLastCalledWith({ autoHide: true, position: 'bottom', props: { desc: '261' }, type: 'error2', visibilityTime: 3000 });
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onReject(itm, 2, 2);
    });
    expect(mockPut.mock.calls.pop()[1]).toEqual({ debitor: 2, creditor: 1, act: 'A1', contract: 'C1', stype: 2, reciver: 2 });
  });
  it('onReject: xato -> "Xatolik sodir bo\'ldi" toast', async () => {
    await mount([mk(0, 1)]);
    mockPut.mockRejectedValue(new Error('x'));
    await act(async () => {
      await H('QarzShartnomasiniRasmiylashtirishTogrisida').onReject(itm, 2, 1);
    });
    expect(mockToast.mock.calls.pop()[0].props.desc).toBe('Xatolik sodir bo‘ldi');
  });
  it('onToliqQaytgan: POST toliq-qaytarish, status 1 -> omad + HomeApi', async () => {
    await mount([mk(1, 1)]);
    await act(async () => {
      await H('QarzToliqQaytarilganli').onToliqQaytgan(itm, 1);
    });
    expect(mockPost).toHaveBeenCalledWith(
      'http://x/notification/toliq-qaytarish/55',
      { act: 'A1', contract: 'C1', creditor: 1, debitor: 2, reciver: 2, stype: 1 },
      headers,
    );
    expect(mockToast).toHaveBeenLastCalledWith({ autoHide: true, position: 'bottom', props: { desc: '264' }, type: 'omad', visibilityTime: 3000 });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'HomeApi', p: { page: 1 } });
  });
  it('onToliqQaytgan: status 2 -> error2 261; reciver = debitor bo\'lsa creditor', async () => {
    await mount([mk(1, 1)]);
    await act(async () => {
      await H('QarzToliqQaytarilganli').onToliqQaytgan({ ...itm, reciver: 2 }, 2);
    });
    expect(mockPost.mock.calls[0][1].reciver).toBe(1);
    expect(mockToast.mock.calls.pop()[0]).toEqual({ autoHide: true, position: 'bottom', props: { desc: '261' }, type: 'error2', visibilityTime: 3000 });
  });
  it('onQismanQaytarilgan (Qarzqismanqaytarilganli orqali emas: type 1 prop)', async () => {
    await mount([mk(1, 1)]);
    await act(async () => {
      await H('QarzToliqQaytarilganli').onQismanQaytarilgan(itm, 1);
    });
    expect(mockPost).toHaveBeenCalledWith(
      'http://x/notification/qisman-qaytarish/55',
      { act: 'A1', contract: 'C1', creditor: 1, debitor: 2, reciver: 2, stype: 1 },
      headers,
    );
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'filter', id: 55 });
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'HomeApi', p: { page: 1 } });
  });
  it('onQarzMuddatUzaytirish: /time/, status 1 / 2 toast, dispatchlar', async () => {
    await mount([mk(3, 1)]);
    await act(async () => {
      await H('Qarzmuddatiniuzaytirishsoralganligitogrisida').onQarzMuddatUzaytirish(itm, 1);
    });
    expect(mockPost).toHaveBeenLastCalledWith(
      'http://x/notification/time/55',
      { debitor: 2, creditor: 1, contract: 'C1', stype: 1, act: 'A1', reciver: 2 },
      headers,
    );
    expect(mockToast).toHaveBeenLastCalledWith({ autoHide: true, position: 'bottom', props: { desc: '264' }, type: 'omad', visibilityTime: 3000 });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'gcd' });
    mockToast.mockClear();
    await act(async () => {
      await H('Qarzmuddatiniuzaytirishsoralganligitogrisida').onQarzMuddatUzaytirish({ ...itm, reciver: 2 }, 2);
    });
    expect(mockPost.mock.calls.pop()[1].reciver).toBe(1);
    expect(mockToast).toHaveBeenLastCalledWith({ autoHide: true, position: 'bottom', props: { desc: '261' }, type: 'error2', visibilityTime: 3000 });
  });
  it('onQarzMuddatUzaytirish: oferta bloklasa so\'rov ketmaydi; reject prop berilgan', async () => {
    mockGuardBlocks = true;
    await mount([mk(3, 1)]);
    await act(async () => {
      await H('Qarzmuddatiniuzaytirishsoralganligitogrisida').onQarzMuddatUzaytirish(itm, 1);
    });
    expect(mockPost).not.toHaveBeenCalled();
    expect(typeof H('Qarzmuddatiniuzaytirishsoralganligitogrisida').reject).toBe('function');
  });
});
