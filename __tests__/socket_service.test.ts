/**
 * socketService (ulanish, auth, hodisalar, bildirishnoma matni/ko'rsatish) xarakteristika testlari — wave C bo'linishidan
 * OLDIN yozilgan. Jamoat API (default export: init/on/emit/off/connected/updateToken/getSocket/ping/disconnect/
 * initSubscribeWithId/reciveNotification/sendNotification/returnzBody/checkingSum) qotirilgan.
 * returnzBody goldenlari (fixtures/socket_body_golden.json) eski realizatsiyadan yozilgan:
 *   SB_GEN=1 npx jest socket_service   (FAQAT eski kod bilan)
 * DIQQAT (wave D): 34 holatda (type 0 kreditor / type 8 debitor) xizmat haqi "NaN" edi — xato tuzatilib, faqat shu summ/sum1 qiymatlari yangilandi.
 */
import fs from 'fs';
import path from 'path';

type Handler = (...a: any[]) => any;
const mockSockets: any[] = [];
const mockIo = jest.fn();
const mockDispatch = jest.fn((a: unknown) => a);
const mockForceLogout = jest.fn();
const mockCreateChannel = jest.fn();
const mockDisplay = jest.fn();
const mockUnsub = jest.fn();
let mockTokenCb: ((t: string) => void) | null = null;
let mockOwnPw = false;
let mockState: any = {};
const mockMem = new Map<string, any>();

const makeSocket = () => {
  const handlers = new Map<string, Handler[]>();
  const ioHandlers = new Map<string, Handler[]>();
  const s: any = {
    connected: false,
    auth: { token: 't0' },
    handlers,
    ioHandlers,
    on: jest.fn((e: string, h: Handler) => {
      handlers.set(e, [...(handlers.get(e) || []), h]);
      return s;
    }),
    once: jest.fn((e: string, h: Handler) => {
      handlers.set(e, [...(handlers.get(e) || []), h]);
      return s;
    }),
    off: jest.fn((e: string, h?: Handler) => {
      handlers.set(e, h ? (handlers.get(e) || []).filter(x => x !== h) : []);
      return s;
    }),
    emit: jest.fn(),
    connect: jest.fn(() => {
      s.connected = true;
    }),
    disconnect: jest.fn(() => {
      const was = s.connected;
      s.connected = false;
      if (was) (handlers.get('disconnect') || []).forEach(h => h('io client disconnect'));
    }),
    removeAllListeners: jest.fn(() => handlers.clear()),
    io: {
      opts: { auth: { token: 't0' } },
      on: jest.fn((e: string, h: Handler) => ioHandlers.set(e, [...(ioHandlers.get(e) || []), h])),
      off: jest.fn((e: string, h: Handler) => ioHandlers.set(e, (ioHandlers.get(e) || []).filter(x => x !== h))),
    },
    fire: (e: string, ...a: any[]) => Promise.all((handlers.get(e) || []).map(h => h(...a))),
  };
  return s;
};

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: (...a: unknown[]) => mockCreateChannel(...a),
    displayNotification: (...a: unknown[]) => mockDisplay(...a),
  },
  AndroidVisibility: { PRIVATE: 0 },
}));
jest.mock('socket.io-client', () => ({
  io: (...a: unknown[]) => {
    mockIo(...a);
    const s = makeSocket();
    mockSockets.push(s);
    return s;
  },
}));
jest.mock('../src/store/api/token/getToken', () => ({
  storage: { getString: (k: string) => (typeof mockMem.get(k) === 'string' ? mockMem.get(k) : undefined) },
}));
jest.mock('../src/store/api/authInterceptor', () => ({
  onTokenRefreshed: (cb: (t: string) => void) => {
    mockTokenCb = cb;
    return mockUnsub;
  },
}));
jest.mock('../src/helper/forceLogout', () => ({ forceLogout: (...a: unknown[]) => mockForceLogout(...a) }));
jest.mock('../src/helper/passwordChangeSession', () => ({ isOwnPasswordChangeActive: () => mockOwnPw }));
jest.mock('../src/helper/userAgent', () => ({ getDeviceUserAgent: () => 'UA/1' }));
jest.mock('../src/screens/constants', () => ({ SOCKET_URL: 'https://sock.example' }));
jest.mock('../src/store/store/Store', () => ({
  Store: { dispatch: (...a: unknown[]) => mockDispatch(...a), getState: () => mockState },
}));
jest.mock('../src/store/api/home', () => ({
  getCreditorAndDebitorData: () => ({ type: 'getCAD' }),
  getCreditorDataAndDebitorData: () => ({ type: 'getCDAD' }),
}));
jest.mock('../src/store/reducers/HomeReducer', () => ({
  setChangeEndDate: (p: unknown) => ({ type: 'setChangeEndDate', p }),
  setNotification: (p: unknown) => ({ type: 'setNotification', p }),
}));
jest.mock('i18next', () => ({
  __esModule: true,
  default: { t: (k: string, o?: unknown) => `${k}|${JSON.stringify(o)}` },
}));
jest.mock('../src/helper/returnName', () => ({
  __esModule: true,
  default: {
    returnDebitorName: (i: any) => `DN(${i.id})`,
    returnCreditorName: (i: any) => `CN(${i.id})`,
  },
}));
jest.mock('../src/screens/components/StatisticCard', () => ({ sortText: (v: unknown) => `s${v}` }));
jest.mock('../src/helper/index', () => ({ settingDate: (v: unknown) => `d${v}` }));
jest.mock('../src/screens/home/notifications/all/QarzShartnomasiRejectTime', () => ({
  getFullName: (who: string, i: any) => `FN(${who},${i.id})`,
}));

import socketService from '../src/helper/socketService';

const sock = () => mockSockets[mockSockets.length - 1];
const baseState = (over: any = {}) => ({
  HomeReducer: {
    appState: 'active',
    notification: { bild: [] },
    fbNotificationId: null,
    usd: 12000,
    user: { data: { id: 1 } },
    ...over,
  },
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockSockets.length = 0;
  mockMem.clear();
  mockMem.set('token', 'tok1');
  mockTokenCb = null;
  mockOwnPw = false;
  mockState = baseState();
  mockCreateChannel.mockResolvedValue('chan');
  mockDisplay.mockResolvedValue(undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  socketService.disconnect();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('socketService — init va ulanish sozlamalari', () => {
  it('id yo\'q / token yo\'q -> xato', async () => {
    await expect(socketService.init('')).rejects.toThrow('uidx is required');
    mockMem.delete('token');
    await expect(socketService.init('7')).rejects.toThrow('token is missing');
    expect(mockIo).not.toHaveBeenCalled();
  });
  it('io(SOCKET_URL, opts): auth token handshake orqali, polling->websocket, UA', async () => {
    await socketService.init('7');
    expect(mockIo).toHaveBeenCalledTimes(1);
    expect(mockIo.mock.calls[0][0]).toBe('https://sock.example');
    expect(mockIo.mock.calls[0][1]).toEqual({
      autoConnect: false, timeout: 20000, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, randomizationFactor: 0.5, transports: ['polling', 'websocket'], tryAllTransports: true,
      secure: true, auth: { token: 'tok1' }, extraHeaders: { 'User-Agent': 'UA/1' },
    });
  });
  it('ikkinchi init (allaqachon ulangan) -> yangi socket yaratilmaydi', async () => {
    await socketService.init('7');
    await socketService.init('7');
    expect(mockIo).toHaveBeenCalledTimes(1);
  });
  it('hodisalar ro\'yxatga olinadi', async () => {
    await socketService.init('7');
    const s = sock();
    expect([...s.handlers.keys()].sort()).toEqual(
      ['auth_error', 'connect', 'disconnect', 'error', 'realTimeChange', 'recive_notification', 'session_revoked'].sort(),
    );
    expect([...s.ioHandlers.keys()]).toEqual(['reconnect']);
  });
  it('getSocket / connected / on / emit / off / sendNotification / initSubscribeWithId', async () => {
    expect(socketService.getSocket()).toBeNull();
    expect(socketService.connected()).toBe('Offline');
    socketService.on('x', () => {});
    socketService.emit('x', 1);
    socketService.off('x');
    socketService.initSubscribeWithId('9');
    await socketService.sendNotification({ a: 1 });
    await socketService.init('7');
    const s = sock();
    expect(socketService.getSocket()).toBe(s);
    expect(socketService.connected()).toBe('Offline');
    s.connected = true;
    expect(socketService.connected()).toBe('Online');
    const cb = jest.fn();
    socketService.on('x', cb);
    expect(s.on).toHaveBeenCalledWith('x', cb);
    socketService.emit('y', { b: 2 });
    expect(s.emit).toHaveBeenCalledWith('y', { b: 2 });
    socketService.off('x', cb);
    expect(s.off).toHaveBeenCalledWith('x', cb);
    socketService.initSubscribeWithId('9');
    expect(s.emit).toHaveBeenCalledWith('register', { id: '9' });
    await socketService.sendNotification({ a: 1 });
    expect(s.emit).toHaveBeenCalledWith('send_notification', { a: 1 });
  });
  it('realTimeChange -> getCreditorAndDebitorData dispatch', async () => {
    await socketService.init('7');
    sock().fire('realTimeChange');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'getCAD' });
  });
  it('error / auth_error faqat log (holat o\'zgarmaydi)', async () => {
    await socketService.init('7');
    sock().fire('error', { code: 'RATE_LIMIT', message: 'm' });
    sock().fire('auth_error', { message: 'bad' });
    expect(console.error).toHaveBeenCalledWith('Socket error:', 'RATE_LIMIT', 'm');
    expect(console.warn).toHaveBeenCalledWith('Socket auth_error:', 'bad');
  });
});

describe('socketService — ping, disconnect, qayta ulanish', () => {
  it('connect -> 30s ping; ulanmagan bo\'lsa yubormaydi; disconnect to\'xtatadi', async () => {
    await socketService.init('7');
    const s = sock();
    s.connected = true;
    await s.fire('connect');
    jest.advanceTimersByTime(30000);
    expect(s.emit).toHaveBeenCalledWith('ping');
    s.emit.mockClear();
    s.connected = false;
    jest.advanceTimersByTime(30000);
    expect(s.emit).not.toHaveBeenCalled();
    s.connected = true;
    await s.fire('disconnect', 'transport close');
    jest.advanceTimersByTime(60000);
    expect(s.emit).not.toHaveBeenCalled();
  });
  it('ping(): socket yo\'q/ulanmagan bo\'lsa hech narsa', async () => {
    socketService.ping();
    await socketService.init('7');
    socketService.ping();
    expect(sock().emit).not.toHaveBeenCalled();
    sock().connected = true;
    socketService.ping();
    expect(sock().emit).toHaveBeenCalledWith('ping');
  });
  it('"io server disconnect": 2s dan keyin bir marta qayta ulanadi', async () => {
    await socketService.init('7');
    const s = sock();
    await s.fire('disconnect', 'io server disconnect');
    expect(s.connect).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2000);
    expect(s.connect).toHaveBeenCalledTimes(1);
  });
  it('"io client disconnect" (ataylab) -> isInitialized=false: keyingi init yangi socket', async () => {
    await socketService.init('7');
    const s = sock();
    await s.fire('disconnect', 'io client disconnect');
    await socketService.init('7');
    expect(mockIo).toHaveBeenCalledTimes(2);
    expect(s.removeAllListeners).toHaveBeenCalled();
    expect(s.disconnect).toHaveBeenCalled();
  });
  it('disconnect(): to\'liq tozalash, token obunasi bekor, socket null', async () => {
    await socketService.init('7');
    const s = sock();
    socketService.disconnect();
    expect(s.io.off).toHaveBeenCalledWith('reconnect', expect.any(Function));
    expect(s.removeAllListeners).toHaveBeenCalled();
    expect(s.disconnect).toHaveBeenCalled();
    expect(mockUnsub).toHaveBeenCalledTimes(1);
    expect(socketService.getSocket()).toBeNull();
    await socketService.init('7');
    expect(mockIo).toHaveBeenCalledTimes(2);
  });
  it('reconnect (io) -> register(userId); disconnect keyin userId yo\'q', async () => {
    await socketService.init('42');
    const s = sock();
    s.ioHandlers.get('reconnect')![0]();
    expect(s.emit).toHaveBeenCalledWith('register', { id: '42' });
  });
});

describe('socketService — token yangilash', () => {
  it('onTokenRefreshed ro\'yxatga olinadi (bir marta); callback updateToken ga', async () => {
    await socketService.init('7');
    expect(mockTokenCb).toBeInstanceOf(Function);
    const s = sock();
    mockTokenCb!('newTok');
    expect(s.io.opts.auth).toEqual({ token: 'newTok' });
    expect(s.auth).toEqual({ token: 'newTok' });
    expect(s.connect).toHaveBeenCalledTimes(1);
  });
  it('ulangan socket: avval uziladi (reconnecting bayrog\'i bilan, init saqlanadi), keyin connect + once(connect)', async () => {
    await socketService.init('7');
    const s = sock();
    s.connected = true;
    socketService.updateToken('T2');
    expect(s.disconnect).toHaveBeenCalledTimes(1);
    expect(s.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(s.once).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(s.connect).toHaveBeenCalledTimes(1);
    // init holati saqlangan: yangi socket yaratilmaydi
    await socketService.init('7');
    expect(mockIo).toHaveBeenCalledTimes(1);
  });
  it('once(connect) handler -> register(userId)', async () => {
    await socketService.init('7');
    const s = sock();
    socketService.updateToken('T3');
    await s.fire('connect');
    expect(s.emit).toHaveBeenCalledWith('register', { id: '7' });
  });
  it('socket yo\'q bo\'lsa jim; xato bo\'lsa warn', async () => {
    socketService.updateToken('x');
    await socketService.init('7');
    sock().connect.mockImplementation(() => {
      throw new Error('boom');
    });
    socketService.updateToken('y');
    expect(console.warn).toHaveBeenCalledWith('Socket updateToken failed:', expect.any(Error));
  });
});

describe('socketService — session_revoked', () => {
  it('majburiy chiqish: socket uziladi + forceLogout(revoked)', async () => {
    await socketService.init('7');
    const s = sock();
    await s.fire('session_revoked');
    expect(s.disconnect).toHaveBeenCalled();
    expect(mockForceLogout).toHaveBeenCalledWith('revoked');
    expect(socketService.getSocket()).toBeNull();
  });
  it('o\'z parolini o\'zgartirish paytida e\'tiborsiz', async () => {
    mockOwnPw = true;
    await socketService.init('7');
    await sock().fire('session_revoked');
    expect(mockForceLogout).not.toHaveBeenCalled();
    expect(socketService.getSocket()).not.toBeNull();
  });
});

describe('socketService — recive_notification (ko\'rsatish oqimi)', () => {
  const note = (id: number, over: any = {}) => ({ id, type: 25, ...over });
  const fire = async (list: any[]) => {
    await socketService.init('7');
    await sock().fire('recive_notification', { notification: list });
  };
  it('yangi bildirishnoma: kanal + displayNotification + Redux yangilanadi', async () => {
    await fire([note(5)]);
    expect(mockCreateChannel).toHaveBeenCalledWith({ id: 'default', name: 'Default Channel', visibility: 0 });
    expect(mockDisplay).toHaveBeenCalledWith({
      title: 'ZeroX',
      body: '759|{}',
      android: { channelId: 'chan', visibility: 0, smallIcon: 'ic_launcher', pressAction: { id: 'default', launchActivity: 'default' } },
      ios: { sound: 'default', critical: true },
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'setNotification', p: { notification: [note(5)] } });
  });
  it('matn teglari olib tashlanadi, bo\'sh matnda zaxira', async () => {
    await fire([{ id: 1, type: 31, dtypes: 1, dcompany: '<name>ACME</name>' }]);
    expect(mockDisplay.mock.calls[0][0].body).toBe('ACME 873|{}');
    mockDisplay.mockClear();
    await fire([{ id: 2, type: 99 }]);
    expect(mockDisplay.mock.calls[0]?.[0].body ?? 'Yangi bildirishnoma').toBeDefined();
  });
  it('tanish bo\'lmagan tur (matn undefined): body = "Yangi bildirishnoma"', async () => {
    await socketService.init('7');
    mockState = baseState();
    await sock().fire('recive_notification', { notification: [{ id: 3, type: 99 }] });
    // removeObject.reduce(acc!.replace) undefined da xato beradi -> catch (console.error), displayNotification chaqirilmaydi
    expect(console.error).toHaveBeenCalledWith('Error displaying notification:', expect.any(Error));
    expect(mockDisplay).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'setNotification', p: { notification: [{ id: 3, type: 99 }] } });
  });
  it('allaqachon ma\'lum (soni teng/kam): ko\'rsatilmaydi, faqat Redux', async () => {
    mockState = baseState({ notification: { bild: [{ id: 5 }] } });
    await fire([note(5)]);
    expect(mockDisplay).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'setNotification', p: { notification: [note(5)] } });
  });
  it('fbNotificationId bilan bir xil id -> ko\'rsatilmaydi, Redux yangilanadi', async () => {
    mockState = baseState({ fbNotificationId: 5 });
    await fire([note(5)]);
    expect(mockDisplay).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'setNotification', p: { notification: [note(5)] } });
  });
  it('fon rejimi: lokal ko\'rsatilmaydi, Redux baribir yangilanadi', async () => {
    mockState = baseState({ appState: 'background' });
    await fire([note(5)]);
    expect(mockDisplay).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'setNotification', p: { notification: [note(5)] } });
  });
  it('bir vaqtda ikkinchi hodisa e\'tiborsiz (isDisplayingNotification)', async () => {
    let release!: () => void;
    mockCreateChannel.mockReturnValue(new Promise(r => { release = () => r('chan'); }));
    await socketService.init('7');
    const first = sock().fire('recive_notification', { notification: [note(5)] });
    await sock().fire('recive_notification', { notification: [note(6), note(7)] });
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'setNotification', p: { notification: [note(6), note(7)] } });
    release();
    await first;
    // oqim tugagach yana qabul qilinadi
    mockCreateChannel.mockResolvedValue('chan');
    await sock().fire('recive_notification', { notification: [note(8), note(9)] });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'setNotification', p: { notification: [note(8), note(9)] } });
  });
  it('reciveNotification: socket yo\'q bo\'lsa warn', async () => {
    await socketService.reciveNotification();
    expect(console.warn).toHaveBeenCalledWith('Cannot receive notification: socket not initialized');
  });
});

// --------------------------------------------------------------------------------------------------------------
// returnzBody / checkingSum goldenlari
// --------------------------------------------------------------------------------------------------------------
const GOLD_PATH = path.join(__dirname, 'fixtures', 'socket_body_golden.json');
const GEN = !!process.env.SB_GEN;

const mkItem = (over: any) => ({
  id: 1, number: 'N1', created: 'cr', created_at: 'ca', amount: 5000000, currency: 'UZS', refundable_amount: 1234567,
  residual_amount: 7654321, inc: 111, vos_summa: 222, end_date: '2026-12-01', token: 98765, cuid: '123456789', duid: 'DU1',
  dcompany: 'DCO', ccompany: 'CCO', dtypes: 2, ctypes: 2, creditor: 1, debitor: 2, reciver: 1, creciver: 5, csender: 6, ...over,
});
const SIDE_TYPES = [0, 1, 4, 2, 3, 17, 12, 16, 9, 15, 10, 7, 8, 13, 11, 22, 99];
const FIXED_TYPES = [49, 21, 24, 23, 25, 27, 19, 31, 30];

const cases = (): [string, any, number][] => {
  const out: [string, any, number][] = [];
  const kinds: [number, number][] = [[2, 2], [1, 1], [0, 0]];
  for (const [d, c] of kinds) {
    for (const t of SIDE_TYPES) {
      out.push([`cred side t${t} d${d}c${c}`, mkItem({ type: t, dtypes: d, ctypes: c, creditor: 1, debitor: 2, reciver: 1 }), 1]);
      out.push([`deb side t${t} d${d}c${c}`, mkItem({ type: t, dtypes: d, ctypes: c, creditor: 1, debitor: 2, reciver: 2 }), 1]);
    }
  }
  for (const t of SIDE_TYPES) out.push([`all-equal t${t}`, mkItem({ type: t, creditor: 1, debitor: 1, reciver: 1 }), 1]);
  for (const t of SIDE_TYPES) out.push([`none t${t}`, mkItem({ type: t, creditor: 1, debitor: 2, reciver: 3 }), 1]);
  for (const [amount, currency] of [[500000, 'UZS'], [1000000, 'UZS'], [5000000, 'UZS'], [100000000, 'UZS'], [200000000, 'UZS'],
    [50, 'USD'], [100, 'USD'], [5000, 'USD'], [20000, 'USD']] as [number, string][]) {
    for (const t of [0, 8, 7]) {
      out.push([`amt ${amount}${currency} cred t${t}`, mkItem({ type: t, amount, currency, token: t === 8 ? 5 : null }), 1]);
      out.push([`amt ${amount}${currency} cred t${t} tokenNull`, mkItem({ type: t, amount, currency, token: null }), 1]);
      out.push([`amt ${amount}${currency} deb t${t}`, mkItem({ type: t, amount, currency, reciver: 2 }), 1]);
    }
  }
  for (const uid of [1, 5, 6, 2, 3]) {
    for (const t of FIXED_TYPES) {
      for (const [d, c] of kinds) {
        out.push([`fixed t${t} user${uid} d${d}c${c}`, mkItem({ type: t, dtypes: d, ctypes: c, creditor: 1, debitor: 2, reciver: 3 }), uid]);
        out.push([`fixed t${t} user${uid} d${d}c${c} swapped`, mkItem({ type: t, dtypes: d, ctypes: c, creditor: 2, debitor: uid, reciver: uid, token: 1234567, cuid: 'abcdefghij' }), uid]);
      }
    }
  }
  return out;
};

describe('returnzBody — eski realizatsiya bilan bir xil natija va yon ta\'sirlar', () => {
  const golden: Record<string, any> = !GEN && fs.existsSync(GOLD_PATH) ? JSON.parse(fs.readFileSync(GOLD_PATH, 'utf8')) : {};
  const rec: Record<string, any> = {};
  afterAll(() => {
    if (GEN) fs.writeFileSync(GOLD_PATH, JSON.stringify(rec, null, 0));
  });
  it('barcha holatlar', async () => {
    const all = cases();
    const results: Record<string, any> = {};
    for (const [name, item, uid] of all) {
      mockDispatch.mockClear();
      mockState = baseState({ user: { data: { id: uid } } });
      let out: any;
      try {
        out = await socketService.returnzBody(item);
      } catch (e) {
        out = `THROW:${(e as Error).message}`;
      }
      results[name] = { out: out === undefined ? '__undef__' : out, dispatches: mockDispatch.mock.calls.map(c => c[0]) };
    }
    if (GEN) {
      Object.assign(rec, results);
      return;
    }
    expect(Object.keys(results)).toEqual(Object.keys(golden));
    for (const k of Object.keys(results)) expect(results[k]).toEqual(golden[k]);
  });
});

describe('checkingSum — xizmat haqi (UZS/USD chegaralari)', () => {
  const sum = (amount: number, currency: string, usd = 12000) => socketService.checkingSum({ amount, currency }, usd);
  it('UZS', () => {
    expect(sum(500000, 'UZS')).toBe('1 000');
    expect(sum(1000000, 'UZS')).toBe('1 000');
    expect(sum(5000000, 'UZS')).toBe('5 000');
    expect(sum(100000000, 'UZS')).toBe('100 000');
    expect(sum(100000001, 'UZS')).toBe('100 000');
  });
  it('USD (kurs 12000)', () => {
    expect(sum(50, 'USD')).toBe('1 000');
    expect(sum(100, 'USD')).toBe('1 200');
    expect(sum(8333, 'USD')).toBe('99 996');
    expect(sum(9000, 'USD')).toBe('100 000');
  });
});
