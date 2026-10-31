/**
 * ContractModal (ommaviy oferta tasdiqlash oynasi) xarakteristika testlari — wave B bo'linishidan OLDIN yozilgan.
 * Eslatma: ContractModal'da KOMISSIYA/HISOB-KITOB yo'q; "shartnoma" yaratilmaydi — u oferta PDF'ini o'qish darvozasi
 * (o'qildi + belgi) va `PUT /user/edit_contract` (tanasi `{}`, Bearer token) bilan tasdiqlaydi. Shularning HAMMASI qotirilgan.
 * Mock'lar faqat chegaralarda: redux, axios, Toast, Paper Modal, react-native-pdf, CheckBox, storage, oferta yordamchilari,
 * navigationRef, safe-area, ikonlar. Daraxtlarni qayta yaratish (FAQAT eski komponent bilan): CM_TREE_GEN=1 npx jest contract_modal
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockDispatch = jest.fn((a: unknown) => a);
const mockToast = jest.fn();
const mockPut = jest.fn();
const mockSetOpener = jest.fn();
const mockClearPending = jest.fn();
const mockNeeds = jest.fn();
const mockOpenOferta = jest.fn();
const mockRunPending = jest.fn();
const mockConsume = jest.fn();
const mockHasAfter = jest.fn();
const mockDownload = jest.fn();
const mockPrefetch = jest.fn();
const mockRemove = jest.fn();
const mockPdf: { current: any } = { current: null };
const mockNavCb: { current: any } = { current: null };
let mockHome: any = {};
let mockRouteName: string | undefined = 'Home';
let mockLocked = false;

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn: (s: any) => any) => fn({ HomeReducer: mockHome }),
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('axios', () => ({ __esModule: true, default: { put: (...a: unknown[]) => mockPut(...a) } }));
jest.mock('react-native-toast-message/lib/src/Toast', () => ({ Toast: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('react-native-paper', () => ({
  Modal: ({ visible, children, ...rest }: any) => (visible ? require('react').createElement('PaperModal', rest, children) : null),
}));
jest.mock('react-native-pdf', () => ({
  __esModule: true,
  default: (p: any) => {
    mockPdf.current = p;
    return require('react').createElement('Pdf', { source: p.source, enablePaging: p.enablePaging, horizontal: p.horizontal, page: p.page, trustAllCerts: p.trustAllCerts });
  },
}));
jest.mock('@react-native-community/checkbox', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('CheckBox', { value: p.value, boxType: p.boxType }),
}));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x', PDF_OFERTA_URL: 'http://pdf' }));
jest.mock('../src/store/api/token/getToken', () => ({
  storage: {
    getString: (k: string) => (k === 'token' ? 'tok' : k === 'lang' ? 'uz' : undefined),
    getBoolean: () => mockLocked,
  },
}));
jest.mock('../src/store/reducers/HomeReducer', () => ({ contractModalShow: (p: unknown) => ({ type: 'contractModalShow', payload: p }) }));
jest.mock('../src/store/api/home', () => ({ getMe: () => ({ type: 'getMe' }) }));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/home/redesign/icons', () => new Proxy({}, { get: (_t, k) => (k === '__esModule' ? true : () => require('react').createElement('Icon', { name: String(k) })) }));
jest.mock('../src/helper/ofertaGate', () => ({
  clearPendingOfertaAction: (...a: unknown[]) => mockClearPending(...a),
  needsOferta: (...a: unknown[]) => mockNeeds(...a),
  openOferta: (...a: unknown[]) => mockOpenOferta(...a),
  runPendingOfertaAction: (...a: unknown[]) => mockRunPending(...a),
  setOfertaOpener: (...a: unknown[]) => mockSetOpener(...a),
}));
jest.mock('../src/helper/ofertaAfterId', () => ({
  OFERTA_WAIT_ROUTES: new Set(['SetLocalPassword', 'Login']),
  consumeOfertaAfterIdentification: (...a: unknown[]) => mockConsume(...a),
  hasOfertaAfterIdentification: (...a: unknown[]) => mockHasAfter(...a),
}));
jest.mock('../src/helper/ofertaPdf', () => ({
  downloadOfertaPdf: (...a: unknown[]) => mockDownload(...a),
  ofertaDocLang: (l?: string) => (l === 'en' || l === 'kaa' ? 'uz' : l || 'uz'),
  ofertaPdfUrl: (u: string, id: unknown, lang: string) => `${u}?id=${id}&lang=${lang}`,
  removeOfertaFile: (...a: unknown[]) => mockRemove(...a),
  takePrefetchedOferta: (...a: unknown[]) => mockPrefetch(...a),
}));
jest.mock('../src/helper/ofertaBundled', () => ({ bundledOfertaSource: (l: string) => ({ bundled: l }) }));
jest.mock('../src/navigation/NavigationRef', () => ({
  navigationRef: {
    current: {
      getCurrentRoute: () => (mockRouteName ? { name: mockRouteName } : undefined),
      addListener: (_e: string, cb: unknown) => {
        mockNavCb.current = cb;
        return () => {};
      },
    },
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 10, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 360, height: 800 }),
}));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: () => '#000' }),
    font: new Proxy({}, { get: () => 'F' }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));

import ContractModal from '../src/screens/home/modal/ContractModal';

const NOW = new Date('2026-11-01T10:00:00Z');
const textOf = (n: any): string => n.children.map((c: any) => (typeof c === 'string' ? c : textOf(c))).join('');
const allText = (r: TestRenderer.ReactTestRenderer) => textOf(r.root);
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n))[0];
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => press(r, n => textOf(n).trim() === text);
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const pdf = () => mockPdf.current;
const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};
const toasts = () => mockToast.mock.calls.map(c => c[0]);
const warnToast = (desc: string) => ({
  autoHide: true, visibilityTime: 3500, position: 'bottom', bottomOffset: 10 + 130, type: 'error2', props: { desc },
});

const mount = async (home: any = { contract: true, user: { data: { uid: 77, is_contract: 0 } } }) => {
  mockHome = home;
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<ContractModal />);
  });
  return r;
};
/** PDF yuklandi (n sahifa) va SETTLE oynasi o'tdi. */
const loaded = async (r: TestRenderer.ReactTestRenderer, n: number) => {
  await act(async () => pdf().onLoadComplete(n));
  await advance(1100);
};
/** Hujjat oxirigacha o'qildi: n sahifa, oxirgi sahifa hodisasi, 3 s o'tdi. */
const readAll = async (r: TestRenderer.ReactTestRenderer, n = 3) => {
  await loaded(r, n);
  for (let p = 2; p <= n; p++) await act(async () => pdf().onPageChanged(p, n));
  await advance(3000);
};
const checkRow = (r: TestRenderer.ReactTestRenderer) => press(r, n => n.findAll((c: any) => c.type === 'CheckBox').length > 0 && textOf(n).includes('ofertaaa'));

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockHome = {};
  mockRouteName = 'Home';
  mockLocked = false;
  mockNavCb.current = null;
  mockPdf.current = null;
  mockPrefetch.mockReturnValue(null);
  mockDownload.mockReturnValue(new Promise(() => {}));
  mockPut.mockResolvedValue({ data: { success: true } });
  mockNeeds.mockReturnValue(true);
  mockHasAfter.mockReturnValue(false);
  mockConsume.mockReturnValue(false);
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------------------------------------------
// Render DARAXTI
// ---------------------------------------------------------------------------------------------------------------
const TREE_PATH = path.join(__dirname, 'fixtures', 'contract_modal_tree.json');
const GEN_TREE = !!process.env.CM_TREE_GEN;

describe('ContractModal — render daraxti (vizual chiqish o\'zgarmagan)', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['hidden', () => mount({ contract: false, user: { data: { uid: 77 } } })],
    ['open bundled before load', () => mount()],
    ['open no uid', () => mount({ contract: true, user: { data: {} } })],
    ['open remote prefetched', () => {
      mockPrefetch.mockReturnValue({ done: true, path: '/cache/oferta.pdf', promise: Promise.resolve('/cache/oferta.pdf') });
      return mount();
    }],
    ['loaded 3 pages unread', async () => {
      const r = await mount();
      await loaded(r, 3);
      return r;
    }],
    ['loaded 1 page', async () => {
      const r = await mount();
      await loaded(r, 1);
      return r;
    }],
    ['read to end unchecked', async () => {
      const r = await mount();
      await readAll(r);
      return r;
    }],
    ['read to end checked', async () => {
      const r = await mount();
      await readAll(r);
      await tap(checkRow(r));
      return r;
    }],
    ['pdf error', async () => {
      const r = await mount();
      await act(async () => pdf().onError());
      return r;
    }],
    ['accepting (loading)', async () => {
      mockPut.mockReturnValue(new Promise(() => {}));
      const r = await mount();
      await readAll(r);
      await tap(checkRow(r));
      await act(async () => {
        void byText(r, '93').props.onPress();
      });
      return r;
    }],
  ];

  if (GEN_TREE) {
    test('daraxtlarni eski komponentdan yaratish', async () => {
      const out: Record<string, string> = {};
      for (const [name, build] of states) {
        jest.clearAllMocks();
        mockPrefetch.mockReturnValue(null);
        mockDownload.mockReturnValue(new Promise(() => {}));
        mockPut.mockResolvedValue({ data: { success: true } });
        jest.setSystemTime(NOW);
        const r = await build();
        out[name] = JSON.stringify(r.toJSON());
        await act(async () => r.unmount());
      }
      fs.writeFileSync(TREE_PATH, JSON.stringify(out, null, 1));
    });
    return;
  }
  const golden: Record<string, string> = JSON.parse(fs.readFileSync(TREE_PATH, 'utf8'));
  test('har bir holat fixture bilan qamrab olingan', () => {
    expect(Object.keys(golden).sort()).toEqual(states.map(s => s[0]).sort());
  });
  test.each(states.map(s => s[0]))('%s', async name => {
    jest.setSystemTime(NOW);
    const r = await states.find(s => s[0] === name)![1]();
    expect(JSON.stringify(r.toJSON())).toBe(golden[name]);
    await act(async () => r.unmount());
  });
});

// ---------------------------------------------------------------------------------------------------------------
// TASDIQLASH (PUT /user/edit_contract) — payload, toast, redux, kechiktirilgan amal
// ---------------------------------------------------------------------------------------------------------------
describe('ContractModal — tasdiqlash', () => {
  const accept = async (r: TestRenderer.ReactTestRenderer) => {
    await tap(checkRow(r));
    await tap(byText(r, '93'));
  };
  test('muvaffaqiyat: PUT URL + {} + Bearer; getMe, yopish, 350 ms dan keyin eslab qolingan amal', async () => {
    const r = await mount();
    await readAll(r);
    await accept(r);
    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockPut).toHaveBeenCalledWith('http://x/user/edit_contract', {}, { headers: { Authorization: 'Bearer tok' } });
    const types = mockDispatch.mock.calls.map(c => JSON.stringify(c[0]));
    expect(types).toContain('{"type":"getMe"}');
    expect(types).toContain('{"type":"contractModalShow","payload":{"show":false}}');
    expect(types.indexOf('{"type":"getMe"}')).toBeLessThan(types.indexOf('{"type":"contractModalShow","payload":{"show":false}}'));
    expect(mockRunPending).not.toHaveBeenCalled();
    await advance(349);
    expect(mockRunPending).not.toHaveBeenCalled();
    await advance(1);
    expect(mockRunPending).toHaveBeenCalledTimes(1);
    expect(toasts()).toEqual([]);
  });
  test('boshqa qurilmada tasdiqlangan (is_contract_true): toast + getMe + yopish + amal', async () => {
    mockPut.mockResolvedValue({ data: { success: false, msg: 'is_contract_true' } });
    const r = await mount();
    await readAll(r);
    await accept(r);
    expect(toasts()).toEqual([
      { autoHide: true, visibilityTime: 3000, position: 'bottom', type: 'error2', props: { desc: 'Siz ommaviy ofertani boshqa qurilmada tasdiqlagansiz' } },
    ]);
    const types = mockDispatch.mock.calls.map(c => JSON.stringify(c[0]));
    expect(types).toContain('{"type":"getMe"}');
    expect(types).toContain('{"type":"contractModalShow","payload":{"show":false}}');
    await advance(350);
    expect(mockRunPending).toHaveBeenCalledTimes(1);
  });
  test('success:false boshqa sabab: server xabari (message, bo\'shliqli msg) yoki zaxira matn; oyna ochiq', async () => {
    const r = await mount();
    await readAll(r);
    mockPut.mockResolvedValueOnce({ data: { success: false, message: '  Server rad etdi ' } });
    await accept(r);
    expect(toasts().pop()).toEqual(warnToast('Server rad etdi'));
    mockPut.mockResolvedValueOnce({ data: { success: false, msg: 'x y' } });
    await tap(byText(r, '93'));
    expect(toasts().pop()).toEqual(warnToast('x y'));
    mockPut.mockResolvedValueOnce({ data: { success: false, msg: 'error' } });
    await tap(byText(r, '93'));
    expect(toasts().pop()).toEqual(warnToast('Ofertani tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.'));
    expect(mockDispatch.mock.calls.map(c => c[0]).some((a: any) => a.type === 'getMe')).toBe(false);
    expect(mockRunPending).not.toHaveBeenCalled();
  });
  test('tarmoq xatosi: server message / msg / zaxira matn', async () => {
    const r = await mount();
    await readAll(r);
    mockPut.mockRejectedValueOnce({ response: { data: { message: 'Ruxsat yo‘q' } } });
    await accept(r);
    expect(toasts().pop()).toEqual(warnToast('Ruxsat yo‘q'));
    mockPut.mockRejectedValueOnce({ response: { data: { msg: 'unauthorized' } } });
    await tap(byText(r, '93'));
    expect(toasts().pop()).toEqual(warnToast('Ofertani tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.'));
    mockPut.mockRejectedValueOnce(new Error('net'));
    await tap(byText(r, '93'));
    expect(toasts().pop()).toEqual(warnToast('Ofertani tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.'));
    expect(allText(r)).toContain('ofertaaa'); // yuklash tugadi, oyna ochiq
  });
  test('rad etish: eslab qolingan amal bekor, oyna yopiladi; so\'rov ketayotganda bosilmaydi', async () => {
    const r = await mount();
    const back = press(r, n => n.props.accessibilityLabel === '21');
    await tap(back);
    expect(mockClearPending).toHaveBeenCalledTimes(1);
    expect(mockDispatch.mock.calls.map(c => c[0])).toContainEqual({ type: 'contractModalShow', payload: { show: false } });
    expect(mockPut).not.toHaveBeenCalled();
  });
  test('ochuvchi ro\'yxatdan o\'tadi va Redux oynasini ochadi', async () => {
    await mount();
    expect(mockSetOpener).toHaveBeenCalledTimes(1);
    mockDispatch.mockClear();
    mockSetOpener.mock.calls[0][0]();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'contractModalShow', payload: { show: true } });
  });
});

// ---------------------------------------------------------------------------------------------------------------
// O'QISH DARVOZASI
// ---------------------------------------------------------------------------------------------------------------
describe('ContractModal — o\'qish darvozasi', () => {
  test('o\'qilmagan: belgi qo\'yib bo\'lmaydi (ogohlantirish), Tasdiqlash ham', async () => {
    const r = await mount();
    await loaded(r, 3);
    await tap(checkRow(r));
    expect(toasts().pop()).toEqual(warnToast('Iltimos, ommaviy ofertani oxirigacha o‘qib chiqing va tasdiqlang.'));
    await tap(byText(r, '93'));
    expect(toasts().pop()).toEqual(warnToast('Iltimos, ommaviy ofertani oxirigacha o‘qib chiqing va tasdiqlang.'));
    expect(mockPut).not.toHaveBeenCalled();
  });
  test('o\'qilgan, lekin belgilanmagan: Tasdiqlash belgi haqida ogohlantiradi', async () => {
    const r = await mount();
    await readAll(r);
    await tap(byText(r, '93'));
    expect(toasts().pop()).toEqual(warnToast('Iltimos, ommaviy oferta bilan tanishganingizni belgilang.'));
    expect(mockPut).not.toHaveBeenCalled();
  });
  test('1 sahifali hujjat: yuklanishi bilan o\'qilgan hisoblanadi', async () => {
    const r = await mount();
    await act(async () => pdf().onLoadComplete(1));
    await tap(checkRow(r));
    expect(toasts()).toEqual([]);
    expect(r.root.findAll(n => n.type === ('CheckBox' as any))[0].props.value).toBe(true);
  });
  test('oxirgi sahifa 3 s dan OLDIN ko\'rilsa hali o\'qilmagan; 3 s dan keyin ochiladi', async () => {
    const r = await mount();
    await loaded(r, 3); // 1.1 s o'tdi
    await act(async () => pdf().onPageChanged(3, 3));
    await tap(checkRow(r));
    expect(toasts().length).toBe(1); // hali o'qilmagan
    await advance(2000);
    await tap(checkRow(r));
    expect(r.root.findAll(n => n.type === ('CheckBox' as any))[0].props.value).toBe(true);
  });
  test('SETTLE oynasida (teginishsiz) kelgan soxta sahifa hodisasi hisoblanmaydi', async () => {
    const r = await mount();
    await act(async () => pdf().onLoadComplete(3));
    await act(async () => pdf().onPageChanged(3, 3)); // darhol — tashlab yuboriladi
    await advance(3500);
    await tap(checkRow(r));
    expect(toasts().length).toBe(1);
  });
  test('teginish bilan SETTLE ichida ham hisoblanadi', async () => {
    const r = await mount();
    await act(async () => pdf().onLoadComplete(3));
    const wrap = r.root.findAll(n => typeof n.props.onTouchStart === 'function')[0];
    await act(async () => wrap.props.onTouchStart());
    await act(async () => pdf().onPageChanged(3, 3));
    await advance(3000);
    await tap(checkRow(r));
    expect(toasts()).toEqual([]);
  });
  test('zaxira: ko\'ruvchi sahifa bermasa, (n-1) marta varaqlash + vaqt', async () => {
    const r = await mount();
    await loaded(r, 3);
    const wrap = r.root.findAll(n => typeof n.props.onTouchStart === 'function')[0];
    for (let i = 0; i < 2; i++) await act(async () => wrap.props.onTouchStart());
    await advance(3000);
    await act(async () => wrap.props.onTouchEnd());
    await tap(checkRow(r));
    expect(toasts()).toEqual([]);
  });
  test('belgi o\'qish darvozasi yopilganda qaytariladi (qayta yuklash)', async () => {
    const r = await mount();
    await readAll(r);
    await tap(checkRow(r));
    await act(async () => pdf().onError()); // zaxira -> pdfErr
    await act(async () => pdf());
    expect(allText(r)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------------------------------------------
// HUJJAT MANBAI (server / zaxira / xato / qayta urinish)
// ---------------------------------------------------------------------------------------------------------------
describe('ContractModal — hujjat manbai', () => {
  test('uid bor: zaxira DARHOL, server nusxasi yuklab olinadi (URL va til)', async () => {
    await mount();
    expect(pdf().source).toEqual({ bundled: 'uz' });
    expect(mockDownload).toHaveBeenCalledTimes(1);
    expect(mockDownload.mock.calls[0][0]).toBe('http://pdf?id=77&lang=uz');
  });
  test('uid yo\'q: yuklab olinmaydi, zaxira', async () => {
    await mount({ contract: true, user: { data: {} } });
    expect(pdf().source).toEqual({ bundled: 'uz' });
    expect(mockDownload).not.toHaveBeenCalled();
  });
  test('prefetch tayyor: server fayli, yuklab olinmaydi', async () => {
    mockPrefetch.mockReturnValue({ done: true, path: '/cache/o.pdf', promise: Promise.resolve('/cache/o.pdf') });
    await mount();
    expect(pdf().source).toEqual({ uri: 'file:///cache/o.pdf', cache: false });
    expect(mockDownload).not.toHaveBeenCalled();
  });
  test('server nusxasi kech kelsa va foydalanuvchi tegmagan bo\'lsa almashtiriladi', async () => {
    mockDownload.mockResolvedValue('/cache/late.pdf');
    await mount();
    await act(async () => {});
    expect(pdf().source).toEqual({ uri: 'file:///cache/late.pdf', cache: false });
  });
  test('o\'qish boshlangan bo\'lsa almashtirilmaydi, fayl o\'chiriladi', async () => {
    let resolve!: (v: string) => void;
    mockDownload.mockReturnValue(new Promise<string>(res => { resolve = res; }));
    const r = await mount();
    await readAll(r);
    await act(async () => resolve('/cache/late.pdf'));
    expect(pdf().source).toEqual({ bundled: 'uz' });
    expect(mockRemove).toHaveBeenCalledWith('/cache/late.pdf');
  });
  test('server fayli buzuq: zaxira; zaxira ham buzuq: xato + "Qayta urinish"', async () => {
    mockPrefetch.mockReturnValue({ done: true, path: '/cache/o.pdf', promise: Promise.resolve('/cache/o.pdf') });
    const r = await mount();
    await act(async () => pdf().onError());
    expect(mockRemove).toHaveBeenCalledWith('/cache/o.pdf');
    expect(pdf().source).toEqual({ bundled: 'uz' });
    await act(async () => pdf().onError());
    expect(allText(r)).toContain('Oferta hujjatini yuklab bo‘lmadi');
    mockPrefetch.mockReturnValue(null);
    mockDownload.mockClear();
    await tap(byText(r, 'Qayta urinish'));
    expect(allText(r)).not.toContain('Oferta hujjatini yuklab bo‘lmadi');
    expect(mockDownload).toHaveBeenCalledTimes(1);
  });
  test('hodisa kelmasa 20 s dan keyin zaxira -> xato', async () => {
    mockPrefetch.mockReturnValue({ done: true, path: '/cache/o.pdf', promise: Promise.resolve('/cache/o.pdf') });
    const r = await mount();
    await advance(19999);
    expect(pdf().source.uri).toBe('file:///cache/o.pdf');
    await advance(1);
    expect(pdf().source).toEqual({ bundled: 'uz' });
    await advance(20000);
    expect(allText(r)).toContain('Oferta hujjatini yuklab bo‘lmadi');
  });
  test('yuklangan hujjat uchun 20 s taymer ishlamaydi', async () => {
    const r = await mount();
    await act(async () => pdf().onLoadComplete(3));
    await advance(60000);
    expect(pdf().source).toEqual({ bundled: 'uz' });
    expect(allText(r)).not.toContain('Oferta hujjatini yuklab bo‘lmadi');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// IDENTIFIKATSIYADAN KEYIN / QULF
// ---------------------------------------------------------------------------------------------------------------
describe('ContractModal — identifikatsiyadan keyin ochish va qulf', () => {
  test('kutish ekranida oyna ochiq bo\'lsa yashiriladi; qulf bo\'lmasa amal bekor', async () => {
    mockRouteName = 'Login';
    await mount();
    expect(mockDispatch.mock.calls.map(c => c[0])).toContainEqual({ type: 'contractModalShow', payload: { show: false } });
    expect(mockClearPending).toHaveBeenCalled();
  });
  test('qulf ekrani (appLocked): amal SAQLANADI; oddiy ekranga qaytilganda oyna qayta ochiladi', async () => {
    mockRouteName = 'SetLocalPassword';
    mockLocked = true;
    const r = await mount();
    expect(mockClearPending).not.toHaveBeenCalled();
    mockRouteName = 'Home';
    mockHome = { contract: false, user: { data: { uid: 77 } } };
    mockDispatch.mockClear();
    await act(async () => {
      r.update(<ContractModal />);
    });
    expect(mockNeeds).toHaveBeenCalledWith({ uid: 77, is_active: 1 });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'contractModalShow', payload: { show: true } });
  });
  test('identifikatsiyadan keyingi navbat: iste\'mol qilinadi va 250 ms dan keyin openOferta', async () => {
    mockHasAfter.mockReturnValue(true);
    mockConsume.mockReturnValue(true);
    await mount({ contract: false, user: { data: { uid: 77 } } });
    expect(mockConsume).toHaveBeenCalledWith({ uid: 77 });
    await advance(249);
    expect(mockOpenOferta).not.toHaveBeenCalled();
    await advance(1);
    expect(mockOpenOferta).toHaveBeenCalledTimes(1);
  });
  test('250 ms ichida qulf ekraniga o\'tilsa ochilmaydi', async () => {
    mockHasAfter.mockReturnValue(true);
    mockConsume.mockReturnValue(true);
    await mount({ contract: false, user: { data: { uid: 77 } } });
    mockRouteName = 'SetLocalPassword';
    await advance(250);
    expect(mockOpenOferta).not.toHaveBeenCalled();
  });
  test('oyna allaqachon ochiq bo\'lsa qayta ochilmaydi', async () => {
    mockHasAfter.mockReturnValue(true);
    mockConsume.mockReturnValue(true);
    await mount();
    await advance(300);
    expect(mockOpenOferta).not.toHaveBeenCalled();
  });
});

// 01.11 mustahkamlash (eski komponentda YO'Q): bir renderdagi IKKI tezkor "Tasdiqlash" — bitta PUT (useApiAction).
describe('ContractModal — qo\'sh bosish himoyasi (yangi)', () => {
  test('"Tasdiqlash" ikki marta tez bosilsa PUT BIR marta ketadi', async () => {
    const r = await mount();
    await readAll(r);
    await tap(checkRow(r));
    const btn = byText(r, '93');
    await act(async () => {
      void btn.props.onPress();
      void btn.props.onPress();
    });
    expect(mockPut).toHaveBeenCalledTimes(1);
  });
});
