/**
 * QarzDaftariKalendar (qarz daftari kalendari + kun/hafta varag'i) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/qarz_daftari_kalendar_tree.json) + amal testlari (so'rov URL/headerlari, oy almashtirish,
 * varaq ochish/yopish, eski javobni e'tiborsiz qoldirish, amaliyot tafsiloti).
 * Faqat chegaralar mock. Qayta yaratish (FAQAT eski komponent bilan): QK_TREE_GEN=1 npx jest qarz_daftari_kalendar
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockGet = jest.fn();
const mockFetchTx = jest.fn();
let mockOnline = true;

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }) }));
jest.mock('axios', () => ({ __esModule: true, default: { get: (...a: unknown[]) => mockGet(...a) } }));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/offline/netStatus', () => ({ isOnline: () => mockOnline }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/screens/home/modules/qarzAmaliyot', () => ({ fetchTxParams: (...a: unknown[]) => mockFetchTx(...a) }));
jest.mock('../src/screens/components/AnimatedEmpty', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('AnimatedEmpty', { variant: p.variant }),
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color })) },
    ),
);

import QarzDaftariKalendar from '../src/screens/home/modules/QarzDaftariKalendar';

const NOW = new Date('2026-11-15T07:00:00Z'); // yakshanba, noyabr 2026
const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n)))[0];
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const tapNoWait = async (node: any) => {
  await act(async () => {
    node.props.onPress();
  });
};
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const DAILY = [
  { kun: 3, berilgan: 1000000, undirilgan: 0 },
  { kun: 10, berilgan: 250000, undirilgan: 100000 },
  { kun: 15, berilgan: 0, undirilgan: 400000 },
  { kun: 17, berilgan: 2000000, undirilgan: 50000 },
];
const AMAL = (id: number, over: any = {}) => ({
  id, qarz_id: 100 + id, turi: 'berish', summa: 500000 * id, valyuta: 'UZS', mijoz: `Mijoz ${id}`, dokon: 'Do‘kon A',
  vaqt: `2026-11-1${id}T11:4${id}:00`, ...over,
});
const kunResp = (date: string) => {
  const day = Number(date.slice(-2));
  return {
    data: {
      data: {
        berilgan: day === 15 ? [AMAL(1), AMAL(3, { vaqt: 'bad-date', mijoz: '  ' })] : [AMAL(2, { id: 200 + day, mijoz: `Mijoz ${day}` })],
        qaytarilgan: day === 15 ? [AMAL(4, { turi: 'qaytarish', dokon: null })] : [],
      },
    },
  };
};

const setupGet = (over: Record<string, any> = {}) => {
  mockGet.mockImplementation((url: string) => {
    for (const k of Object.keys(over)) if (url.includes(k)) return typeof over[k] === 'function' ? over[k](url) : over[k];
    if (url.includes('/kalendar/kun')) return Promise.resolve(kunResp(url.match(/date=([\d-]+)/)![1]));
    return Promise.resolve({ data: { data: { daily: DAILY } } });
  });
};
const mount = async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<QarzDaftariKalendar />);
  });
  await flush();
  return r;
};
const arrows = (r: TestRenderer.ReactTestRenderer) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === undefined && n.props.style && n.props.disabled === undefined)).slice(0, 2);
const reportRow = (r: TestRenderer.ReactTestRenderer, startsWith: string) =>
  press(r, n => n.props.activeOpacity === 0.7 && textOf(n).startsWith(startsWith));

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockOnline = true;
  mockFetchTx.mockResolvedValue({ tx: { id: 1 }, qarz: { id: 2 } });
  setupGet();
});
afterEach(() => {
  jest.useRealTimers();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'qarz_daftari_kalendar_tree.json');
const GEN = !!process.env.QK_TREE_GEN;

describe('QarzDaftariKalendar — render daraxti', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['loaded', async () => mount()],
    ['empty month', async () => (setupGet({ '/kalendar?': () => Promise.resolve({ data: { data: { daily: [] } } }) }), mount())],
    ['bad payload', async () => (setupGet({ '/kalendar?': () => Promise.resolve({ data: {} }) }), mount())],
    ['offline error (no response)', async () => (setupGet({ '/kalendar?': () => Promise.reject(new Error('net')) }), mount())],
    ['error with response online', async () => (setupGet({ '/kalendar?': () => Promise.reject({ response: { status: 500 } }) }), mount())],
    ['error with response but offline', async () => ((mockOnline = false), setupGet({ '/kalendar?': () => Promise.reject({ response: { status: 500 } }) }), mount())],
    ['USD', async () => { const r = await mount(); await tap(press(r, n => n.props.activeOpacity === 0.85 && textOf(n) === 'USD')); await flush(); return r; }],
    ['selected day', async () => { const r = await mount(); await tap(press(r, n => n.props.activeOpacity === 0.8 && textOf(n) === '10')); return r; }],
    ['selected day toggled off', async () => { const r = await mount(); const d = () => press(r, n => n.props.activeOpacity === 0.8 && textOf(n) === '10'); await tap(d()); await tap(d()); return r; }],
    ['prev month', async () => { const r = await mount(); await tap(arrows(r)[0]); await flush(); return r; }],
    ['kun varaq', async () => { const r = await mount(); await tap(reportRow(r, '15-Noyabr')); await flush(); return r; }],
    ['hafta varaq', async () => { const r = await mount(); await tap(reportRow(r, 'Hafta:')); await flush(); return r; }],
    ['varaq loading', async () => { setupGet({ '/kalendar/kun': () => new Promise(() => {}) }); const r = await mount(); await tapNoWait(reportRow(r, '15-Noyabr')); return r; }],
    ['varaq error', async () => { setupGet({ '/kalendar/kun': () => Promise.reject(new Error('x')) }); const r = await mount(); await tap(reportRow(r, '15-Noyabr')); await flush(); return r; }],
    ['varaq empty', async () => { setupGet({ '/kalendar/kun': () => Promise.resolve({ data: { data: {} } }) }); const r = await mount(); await tap(reportRow(r, '15-Noyabr')); await flush(); return r; }],
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
});

describe('QarzDaftariKalendar — amallar', () => {
  const auth = { headers: { Authorization: 'Bearer tok' } };
  it('mount: bugungi oy, UZS, token header', async () => {
    await mount();
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('http://x/qarz-daftari/kalendar?year=2026&month=11&valyuta=UZS', auth);
  });
  it('valyuta almashsa qayta so\'raydi', async () => {
    const r = await mount();
    await tap(press(r, n => n.props.activeOpacity === 0.85 && textOf(n) === 'USD'));
    await flush();
    expect(mockGet).toHaveBeenLastCalledWith('http://x/qarz-daftari/kalendar?year=2026&month=11&valyuta=USD', auth);
  });
  it('oy almashtirish: yanvar <-> dekabr yil o\'tishi', async () => {
    const r = await mount();
    const [prev, next] = arrows(r);
    for (let i = 0; i < 10; i++) {
      await tap(prev);
    }
    await flush();
    expect(mockGet).toHaveBeenLastCalledWith('http://x/qarz-daftari/kalendar?year=2026&month=1&valyuta=UZS', auth);
    await tap(prev);
    await flush();
    expect(mockGet).toHaveBeenLastCalledWith('http://x/qarz-daftari/kalendar?year=2025&month=12&valyuta=UZS', auth);
    await tap(next);
    await flush();
    expect(mockGet).toHaveBeenLastCalledWith('http://x/qarz-daftari/kalendar?year=2026&month=1&valyuta=UZS', auth);
  });
  it('oy almashsa tanlangan kun tozalanadi', async () => {
    const r = await mount();
    await tap(press(r, n => n.props.activeOpacity === 0.8 && textOf(n) === '10'));
    expect(tree(r)).toContain('10-Noyabr');
    await tap(arrows(r)[1]);
    await flush();
    expect(tree(r)).not.toContain('10-Noyabr');
  });
  it('kun varag\'i: bitta /kalendar/kun so\'rovi (sana, valyuta, header)', async () => {
    const r = await mount();
    mockGet.mockClear();
    await tap(reportRow(r, '15-Noyabr'));
    await flush();
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('http://x/qarz-daftari/kalendar/kun?date=2026-11-15&valyuta=UZS', auth);
  });
  it('hafta varag\'i: Du–Ya (9–15 noyabr) 7 ta parallel so\'rov, vaqt bo\'yicha tartib', async () => {
    const r = await mount();
    mockGet.mockClear();
    await tap(reportRow(r, 'Hafta:'));
    await flush();
    const urls = mockGet.mock.calls.map(c => c[0]);
    expect(urls).toEqual(Array.from({ length: 7 }, (_, i) => `http://x/qarz-daftari/kalendar/kun?date=2026-11-${String(9 + i).padStart(2, '0')}&valyuta=UZS`));
  });
  it('tanlangan kun hafta/kun bazasini o\'zgartiradi (3-noyabr -> 2–8)', async () => {
    const r = await mount();
    await tap(press(r, n => n.props.activeOpacity === 0.8 && textOf(n) === '3'));
    mockGet.mockClear();
    await tap(reportRow(r, 'Hafta:'));
    await flush();
    const urls = mockGet.mock.calls.map(c => c[0]);
    expect(urls[0]).toContain('date=2026-11-02');
    expect(urls[6]).toContain('date=2026-11-08');
  });
  it('varaq xatosi: "Qayta urinish" qayta so\'raydi', async () => {
    setupGet({ '/kalendar/kun': () => Promise.reject(new Error('x')) });
    const r = await mount();
    await tap(reportRow(r, '15-Noyabr'));
    await flush();
    setupGet();
    mockGet.mockClear();
    await tap(press(r, n => textOf(n).trim() === 'Qayta urinish'));
    await flush();
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(tree(r)).toContain('Mijoz 1');
  });
  it('eski javob yangisini bosib ketmaydi (varaq yopilib qayta ochilsa)', async () => {
    let resolveFirst: (v: any) => void = () => {};
    const first = new Promise(res => (resolveFirst = res));
    let n = 0;
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/kalendar/kun')) {
        n += 1;
        return n === 1 ? first : Promise.resolve({ data: { data: { berilgan: [AMAL(2)], qaytarilgan: [] } } });
      }
      return Promise.resolve({ data: { data: { daily: DAILY } } });
    });
    const r = await mount();
    await tapNoWait(reportRow(r, '15-Noyabr'));
    await act(async () => {
      r.root.findAll(n2 => (n2.type as any) === 'Modal' || typeof n2.props.onRequestClose === 'function')[0].props.onRequestClose();
    });
    await tap(reportRow(r, '15-Noyabr'));
    await flush();
    await act(async () => {
      resolveFirst({ data: { data: { berilgan: [AMAL(9, { mijoz: 'ESKI' })], qaytarilgan: [] } } });
    });
    await flush();
    expect(tree(r)).toContain('Mijoz 2');
    expect(tree(r)).not.toContain('ESKI');
  });
  it('amaliyot qatori: fetchTxParams -> varaq yopiladi -> QarzDaftariAmaliyot', async () => {
    const r = await mount();
    await tap(reportRow(r, '15-Noyabr'));
    await flush();
    const row = press(r, n => n.props.activeOpacity === 0.75 && /Mijoz 1/.test(textOf(n)));
    await tap(row);
    await flush();
    expect(mockFetchTx).toHaveBeenCalledWith(expect.objectContaining({ id: 1, qarz_id: 101, _date: '2026-11-15' }));
    expect(mockNavigate).toHaveBeenCalledWith('QarzDaftariAmaliyot', { tx: { id: 1 }, qarz: { id: 2 } });
  });
  it('qarz_id yo\'q bo\'lsa hech narsa qilmaydi; ochilayotganda ikkinchi bosish e\'tiborsiz', async () => {
    setupGet({ '/kalendar/kun': () => Promise.resolve({ data: { data: { berilgan: [AMAL(1, { qarz_id: 0 }), AMAL(2)], qaytarilgan: [] } } }) });
    const r = await mount();
    await tap(reportRow(r, '15-Noyabr'));
    await flush();
    await tap(press(r, n => n.props.activeOpacity === 0.75 && /Mijoz 1/.test(textOf(n))));
    expect(mockFetchTx).not.toHaveBeenCalled();
    let resolveTx: (v: any) => void = () => {};
    mockFetchTx.mockReturnValue(new Promise(res => (resolveTx = res)));
    await act(async () => {
      press(r, n => n.props.activeOpacity === 0.75 && /Mijoz 2/.test(textOf(n))).props.onPress();
    });
    await act(async () => {
      press(r, n => n.props.activeOpacity === 0.75 && /Mijoz 2/.test(textOf(n))).props.onPress();
    });
    expect(mockFetchTx).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveTx({ tx: {}, qarz: {} });
    });
    await flush();
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
