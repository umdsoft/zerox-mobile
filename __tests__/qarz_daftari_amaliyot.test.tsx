/**
 * QarzDaftariAmaliyot (amaliyot tafsiloti) xarakteristika testlari — wave B bo'linishidan OLDIN yozilgan.
 * Daraxtlar fixtures/qarz_amaliyot_tree.json da (eski komponentdan); amallar: to'lov (submitQarzOp payload + toast),
 * kvitansiya ulashish (PDF -> kesh -> Share), grafik yuklash, do'kon nomi. Qayta yaratish (FAQAT eski komponent bilan):
 * QA_TREE_GEN=1 npx jest qarz_daftari_amaliyot
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockToast = jest.fn();
const mockQarzGet = jest.fn();
const mockSubmit = jest.fn();
const mockShowQueued = jest.fn();
const mockOutboxErr = jest.fn();
const mockGeneratePdf = jest.fn();
const mockShareOpen = jest.fn();
const mockCp = jest.fn();
const mockExists = jest.fn();
const mockUnlink = jest.fn();
let mockParams: any = {};
let mockOnline = true;
let mockShop: any = null;
let mockUnsynced = false;

jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (k: string) => k, language: 'uz' } }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])) }),
}));
jest.mock('@react-navigation/native', () => ({ useRoute: () => ({ params: mockParams }) }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('react-native-html-to-pdf', () => ({ generatePDF: (...a: unknown[]) => mockGeneratePdf(...a) }));
jest.mock('react-native-share', () => ({ __esModule: true, default: { open: (...a: unknown[]) => mockShareOpen(...a) } }));
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: { fs: { dirs: { CacheDir: '/cache' }, exists: (...a: unknown[]) => mockExists(...a), unlink: (...a: unknown[]) => mockUnlink(...a), cp: (...a: unknown[]) => mockCp(...a) } },
}));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/store/api/token/qarzShop', () => ({ getQarzShop: () => mockShop }));
jest.mock('../src/offline/qarzGet', () => ({ qarzGet: (...a: unknown[]) => mockQarzGet(...a) }));
jest.mock('../src/offline/netStatus', () => ({ isOnline: () => mockOnline }));
jest.mock('../src/offline/submit', () => ({
  isUnsyncedId: () => mockUnsynced,
  submitQarzOp: (...a: unknown[]) => mockSubmit(...a),
}));
jest.mock('../src/offline/ui/queuedToast', () => ({
  outboxErrorText: (...a: unknown[]) => mockOutboxErr(...a),
  showQueuedResult: (...a: unknown[]) => mockShowQueued(...a),
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: ({ title }: any) => require('react').createElement(require('react-native').Text, null, title),
}));
jest.mock('../src/screens/home/redesign/icons', () => new Proxy({}, { get: (_t, k) => (k === '__esModule' ? true : () => require('react').createElement('Icon', { name: String(k) })) }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: () => '#000' }),
    font: new Proxy({}, { get: () => 'F' }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));

import QarzDaftariAmaliyot from '../src/screens/home/modules/QarzDaftariAmaliyot';

const NOW = new Date('2026-11-01T10:00:00Z');
const textOf = (n: any): string => n.children.map((c: any) => (typeof c === 'string' ? c : textOf(c))).join('');
const allText = (r: TestRenderer.ReactTestRenderer) => textOf(r.root);
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n))[0];
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => press(r, n => textOf(n).trim() === text && !n.props.disabled);
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const type = async (node: any, v: string) => {
  expect(node).toBeDefined();
  await act(async () => node.props.onChangeText(v));
};
const toasts = () => mockToast.mock.calls.map(c => c[0]);
const ser = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON(), (k, v) => (k === '_owner' ? undefined : v));

const qarz = (over: any = {}) => ({
  id: 5, miqdor: 305000, valyuta: 'UZS', status: 'aktiv', mahsulot_nomi: 'Eski mahsulot', mijoz: { fish: 'Ali Valiyev' }, mijoz_id: 9,
  turi: 'berilgan', savdo_faoliyat_id: 3, qaytarish_sanasi: '2026-12-15', berilgan_sana: '2026-09-01', ...over,
});
const txBerish = (over: any = {}) => ({
  id: 11, turi: 'berish', summa: 250000, valyuta: 'UZS', created_at: '2026-10-30 14:05:00', bajaruvchi_telefon: '+998901112233',
  izoh: 'Telefon', berilgan_sana: '2026-10-30', qaytarish_sanasi: '2026-11-30', savdo_faoliyat_id: 3, qarz_id: 5, ...over,
});
const txOther = (turi: string) => ({ id: 12, turi, summa: 55000, created_at: '2026-10-31 09:00:00', bajaruvchi_telefon: '', izoh: 'Qisman', qarz_id: 5 });
const bolibQarz = (over: any = {}) => qarz({ bolib_tolash: 1, oylar_soni: 3, boshlangich_tolov: 50000, miqdor: 350000, ...over });
const grafikRows = () => [
  { id: 103, tartib_raqami: 3, tolov_sanasi: '2027-01-15', summa: 100000, status: 'kutilmoqda' },
  { id: 101, tartib_raqami: 1, tolov_sanasi: '2026-09-01', summa: 100000, status: 'tolandi' },
  { id: 102, tartib_raqami: 2, tolov_sanasi: '2026-09-15', summa: 100000, status: 'kutilmoqda' },
];

const mount = async (params: any, detail: any = undefined) => {
  mockParams = params;
  if (detail !== undefined) mockQarzGet.mockImplementation(() => (detail instanceof Error ? Promise.reject(detail) : Promise.resolve(detail)));
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<QarzDaftariAmaliyot />);
  });
  return r;
};

const resetAll = () => {
  jest.clearAllMocks();
  mockParams = {};
  mockOnline = true;
  mockShop = null;
  mockUnsynced = false;
  mockQarzGet.mockResolvedValue({ data: {} });
  mockSubmit.mockResolvedValue({ status: 'done' });
  mockOutboxErr.mockReturnValue(null);
  mockExists.mockResolvedValue(false);
  mockGeneratePdf.mockResolvedValue({ filePath: '/docs/k.pdf' });
  mockCp.mockResolvedValue(undefined);
  mockUnlink.mockResolvedValue(undefined);
  mockShareOpen.mockResolvedValue({});
};
beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  resetAll();
});
afterEach(() => jest.useRealTimers());

// ---------------------------------------------------------------------------------------------------------------
// Render DARAXTI
// ---------------------------------------------------------------------------------------------------------------
const TREE_PATH = path.join(__dirname, 'fixtures', 'qarz_amaliyot_tree.json');
const GEN_TREE = !!process.env.QA_TREE_GEN;

describe('QarzDaftariAmaliyot — render daraxti (vizual chiqish o\'zgarmagan)', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['berish', () => mount({ tx: txBerish(), qarz: qarz() })],
    ['berish closed status', () => mount({ tx: txBerish(), qarz: qarz({ status: 'yopilgan' }) })],
    ['olish usd', () => mount({ tx: txBerish({ turi: 'olish', valyuta: 'USD', summa: 120.5 }), qarz: qarz({ valyuta: 'USD', status: 'voz_kechilgan' }) })],
    ['qaytarish', () => mount({ tx: txOther('qaytarish'), qarz: qarz() })],
    ['voz_kechish', () => mount({ tx: txOther('voz_kechish'), qarz: qarz() })],
    ['unknown turi, empty params', () => mount({})],
    ['bolib with grafik', () => mount({ tx: txBerish(), qarz: bolibQarz() }, { data: { tolovlar: grafikRows() } })],
    ['bolib grafik error', () => mount({ tx: txBerish(), qarz: bolibQarz() }, new Error('x'))],
    ['bolib grafik offline', async () => {
      mockOnline = false;
      return mount({ tx: txBerish(), qarz: bolibQarz() }, new Error('x'));
    }],
    ['bolib usd', () => mount({ tx: txBerish({ valyuta: 'USD', summa: 300 }), qarz: bolibQarz({ valyuta: 'USD', miqdor: 350.5, boshlangich_tolov: 50.25 }) }, { data: { tolovlar: grafikRows().map(g => ({ ...g, summa: 99.99 })) } })],
    ['shop name from selected', async () => {
      mockShop = { id: 3, nomi: 'Chilonzor do‘kon' };
      return mount({ tx: txBerish({ savdo_faoliyat_id: 3 }), qarz: qarz() });
    }],
    ['shop name from route', () => mount({ tx: txBerish(), qarz: qarz({ savdoFaoliyat: { nomi: 'Marjon' } }) })],
    ['shop name fetched', () => mount({ tx: txBerish({ savdo_faoliyat_id: undefined }), qarz: qarz({ savdo_faoliyat_id: undefined }) }, { data: { savdoFaoliyat: { nomi: 'Fetched do‘kon' } } })],
    ['modal pay uzs', async () => {
      const r = await mount({ tx: txBerish(), qarz: bolibQarz() }, { data: { tolovlar: grafikRows() } });
      await tap(byText(r, 'To‘lovni kiritish'));
      return r;
    }],
    ['modal pay usd', async () => {
      const r = await mount({ tx: txBerish({ valyuta: 'USD' }), qarz: bolibQarz({ valyuta: 'USD' }) }, { data: { tolovlar: grafikRows().map(g => ({ ...g, summa: 99.99 })) } });
      await tap(byText(r, 'To‘lovni kiritish'));
      return r;
    }],
    ['modal receipt', async () => {
      const r = await mount({ tx: txBerish(), qarz: qarz() });
      await tap(byText(r, 'Kvitansiya'));
      return r;
    }],
    ['modal receipt qaytarish', async () => {
      const r = await mount({ tx: txOther('qaytarish'), qarz: qarz() });
      await tap(byText(r, 'Kvitansiya'));
      return r;
    }],
  ];

  if (GEN_TREE) {
    test('daraxtlarni eski komponentdan yaratish', async () => {
      const out: Record<string, string> = {};
      for (const [name, build] of states) {
        resetAll();
        jest.setSystemTime(NOW);
        const r = await build();
        out[name] = ser(r);
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
    resetAll();
    jest.setSystemTime(NOW);
    const r = await states.find(s => s[0] === name)![1]();
    expect(ser(r)).toBe(golden[name]);
    await act(async () => r.unmount());
  });
});

// ---------------------------------------------------------------------------------------------------------------
// AMALLAR
// ---------------------------------------------------------------------------------------------------------------
describe('QarzDaftariAmaliyot — grafik va do\'kon nomi so\'rovlari', () => {
  test('bo\'lib to\'lash qarzida qarzGet(URL/qarz-daftari/qarz/:id) chaqiriladi; oddiy qarzda yo\'q', async () => {
    await mount({ tx: txBerish(), qarz: bolibQarz() }, { data: { tolovlar: grafikRows() } });
    expect(mockQarzGet).toHaveBeenCalledWith('http://x/qarz-daftari/qarz/5');
    mockQarzGet.mockClear();
    mockShop = { id: 3, nomi: 'Tanlangan' }; // do'kon nomi tanlangandan topiladi -> qo'shimcha so'rov yo'q
    await mount({ tx: txBerish(), qarz: qarz() });
    expect(mockQarzGet).not.toHaveBeenCalled();
    mockShop = null; // topilmasa — qarz tafsiloti so'raladi
    await mount({ tx: txBerish(), qarz: qarz() });
    expect(mockQarzGet).toHaveBeenCalledWith('http://x/qarz-daftari/qarz/5');
  });
  test('grafik tartib raqami bo\'yicha saralanadi', async () => {
    const r = await mount({ tx: txBerish(), qarz: bolibQarz() }, { data: { tolovlar: grafikRows() } });
    const nums = r.root.findAll(n => n.props.style && Array.isArray(n.props.style) && typeof n.children[0] === 'string' && /^[123]$/.test(n.children[0] as string)).map(n => n.children[0]);
    expect(nums.slice(0, 3)).toEqual(['1', '2', '3']);
  });
  test('muddati o\'tgan bo\'lak: "Muddati o\'tgan"; to\'langan: "To\'landi"; kelgusi: "Kutilmoqda"', async () => {
    const r = await mount({ tx: txBerish(), qarz: bolibQarz() }, { data: { tolovlar: grafikRows() } });
    const t = allText(r);
    expect(t).toContain('To‘landi');
    expect(t).toContain('Muddati o‘tgan');
    expect(t).toContain('Kutilmoqda');
  });
});

describe('QarzDaftariAmaliyot — bo\'lakni to\'langan deb belgilash', () => {
  const open = async (qOver: any = {}, valyuta = 'UZS') => {
    const r = await mount({ tx: txBerish({ valyuta }), qarz: bolibQarz({ valyuta, ...qOver }) }, { data: { tolovlar: grafikRows() } });
    await tap(byText(r, 'To‘lovni kiritish')); // birinchi to'lanmagan qator
    return r;
  };
  const payInput = (r: TestRenderer.ReactTestRenderer) => r.root.findAll(n => n.props.placeholder === '0' && typeof n.props.onChangeText === 'function')[0];

  test('submitQarzOp payload + meta; muvaffaqiyat toast; oyna yopiladi; grafik qayta yuklanadi', async () => {
    const r = await open();
    await type(payInput(r), '120000');
    mockQarzGet.mockClear();
    await tap(byText(r, 'Saqlash'));
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith({
      kind: 'tolov.tolandi',
      payload: { tolovId: 102, qarzId: 5, summa: 120000 },
      meta: { fish: 'Ali Valiyev', qarzId: 5, mijozId: 9, turi: 'berilgan', valyuta: 'UZS', summa: 120000, faoliyatId: 3 },
    });
    expect(toasts()).toEqual([{ type: 'omad', props: { desc: 'To‘lov qayd etildi' } }]);
    expect(mockQarzGet).toHaveBeenCalledTimes(1); // loadGrafik
    expect(allText(r)).not.toContain('Grafikdagidan ko‘p to‘lansa');
  });
  test('USD: tsent aniqligi (15,84 -> 15.84)', async () => {
    const r = await open({}, 'USD');
    await type(payInput(r), '15.84');
    await tap(byText(r, 'Saqlash'));
    expect(mockSubmit.mock.calls[0][0].payload.summa).toBe(15.84);
    expect(mockSubmit.mock.calls[0][0].meta.valyuta).toBe('USD');
  });
  test('oflayn navbat: showQueuedResult(op, matn, t, 0), "qayd etildi" toast yo\'q', async () => {
    mockSubmit.mockResolvedValue({ status: 'queued', op: { id: 'op1' } });
    const r = await open();
    await type(payInput(r), '100000');
    await tap(byText(r, 'Saqlash'));
    expect(mockShowQueued).toHaveBeenCalledTimes(1);
    expect(mockShowQueued.mock.calls[0][0]).toEqual({ id: 'op1' });
    expect(mockShowQueued.mock.calls[0][1]).toBe('To‘lov oflayn saqlandi — internet tiklanganda yuboriladi');
    expect(mockShowQueued.mock.calls[0][3]).toBe(0);
    expect(toasts()).toEqual([]);
  });
  test('summa bo\'sh/0: "Summani kiriting", so\'rov yo\'q', async () => {
    const r = await open();
    await type(payInput(r), '');
    await tap(byText(r, 'Saqlash'));
    expect(toasts()).toEqual([{ type: 'error2', props: { desc: 'Summani kiriting' } }]);
    expect(mockSubmit).not.toHaveBeenCalled();
  });
  test('qarz hali sinxronlanmagan: aniq xabar, so\'rov yo\'q', async () => {
    mockUnsynced = true;
    const r = await open();
    await type(payInput(r), '100000');
    await tap(byText(r, 'Saqlash'));
    expect(toasts()[0].props.desc).toContain('Qarz hali sinxronlanmagan');
    expect(mockSubmit).not.toHaveBeenCalled();
  });
  test('xato: outbox xabari ustun; aks holda server xabari (t() orqali) yoki zaxira', async () => {
    const r = await open();
    await type(payInput(r), '100000');
    mockOutboxErr.mockReturnValueOnce('Navbat to‘lgan');
    mockSubmit.mockRejectedValueOnce(new Error('q'));
    await tap(byText(r, 'Saqlash'));
    expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Navbat to‘lgan' } });
    mockSubmit.mockRejectedValueOnce({ response: { data: { message: 'Server xabari' } } });
    await tap(byText(r, 'Saqlash'));
    expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Server xabari' } });
    mockSubmit.mockRejectedValueOnce(new Error('net'));
    await tap(byText(r, 'Saqlash'));
    expect(toasts().pop()).toEqual({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    expect(allText(r)).toContain('Grafikdagidan ko‘p to‘lansa'); // xatoda oyna ochiq
  });
  test('bekor qilish oynani yopadi', async () => {
    const r = await open();
    await tap(byText(r, 'Bekor qilish'));
    expect(allText(r)).not.toContain('Grafikdagidan ko‘p to‘lansa');
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});

describe('QarzDaftariAmaliyot — kvitansiya ulashish', () => {
  test('PDF: html qatorlari (escape), kesh nusxa, Share.open, keyin o\'chirish', async () => {
    const r = await mount({ tx: txBerish({ id: 11, bajaruvchi_telefon: '<b>+998</b>' }), qarz: qarz() });
    await tap(byText(r, 'Ulashish'));
    expect(mockGeneratePdf).toHaveBeenCalledTimes(1);
    const arg = mockGeneratePdf.mock.calls[0][0];
    expect(arg.fileName).toBe('kvitansiya_11');
    expect(arg.directory).toBe('Documents');
    expect(arg.html).toContain('&lt;b&gt;+998&lt;/b&gt;');
    expect(arg.html).toContain('<h1>Kvitansiya</h1>');
    expect(arg.html).toContain('Qarz daftari — Amaliyot tafsiloti');
    expect(mockCp).toHaveBeenCalledWith('/docs/k.pdf', '/cache/kvitansiya_11.pdf');
    expect(mockShareOpen).toHaveBeenCalledWith({ url: 'file:///cache/kvitansiya_11.pdf', type: 'application/pdf', title: 'Kvitansiya', failOnCancel: false });
    mockExists.mockResolvedValue(true);
    await tap(byText(r, 'Ulashish'));
    expect(mockUnlink).toHaveBeenCalledWith('/cache/kvitansiya_11.pdf');
  });
  test('xato: "Kvitansiyani ulashib bo\'lmadi"; bekor qilish (cancel) — xato emas', async () => {
    const r = await mount({ tx: txBerish(), qarz: qarz() });
    mockGeneratePdf.mockRejectedValueOnce(new Error('boom'));
    await tap(byText(r, 'Ulashish'));
    expect(toasts()).toEqual([{ type: 'error2', props: { desc: 'Kvitansiyani ulashib bo‘lmadi' } }]);
    mockToast.mockClear();
    mockShareOpen.mockRejectedValueOnce(new Error('User did cancel'));
    await tap(byText(r, 'Ulashish'));
    expect(toasts()).toEqual([]);
    mockGeneratePdf.mockResolvedValueOnce({});
    await tap(byText(r, 'Ulashish'));
    expect(toasts()).toEqual([{ type: 'error2', props: { desc: 'Kvitansiyani ulashib bo‘lmadi' } }]);
  });
});

describe('fmtDate / fmtDateTime (eksport saqlangan)', () => {
  test('Toshkent kuni, bo\'sh -> "—"', () => {
    const m = require('../src/screens/home/modules/QarzDaftariAmaliyot');
    expect(m.fmtDate('2026-10-30 14:05:00')).toBe('30.10.2026');
    expect(m.fmtDateTime('2026-10-30 14:05:00')).toBe('30.10.2026 14:05');
    expect(m.fmtDate(undefined)).toBe('—');
    expect(m.fmtDateTime('')).toBe('—');
  });
});

// 01.11 mustahkamlash (eski komponentda YO'Q): bir renderdagi IKKI tezkor bosish — bitta so'rov (useApiAction).
describe('QarzDaftariAmaliyot — qo\'sh bosish himoyasi (yangi)', () => {
  test('"Saqlash" ikki marta tez bosilsa submitQarzOp BIR marta', async () => {
    const r = await mount({ tx: txBerish(), qarz: bolibQarz() }, { data: { tolovlar: grafikRows() } });
    await tap(byText(r, 'To‘lovni kiritish'));
    await type(r.root.findAll(n => n.props.placeholder === '0' && typeof n.props.onChangeText === 'function')[0], '100000');
    const btn = byText(r, 'Saqlash');
    await act(async () => {
      void btn.props.onPress();
      void btn.props.onPress();
    });
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
  test('"Ulashish" ikki marta tez bosilsa PDF BIR marta', async () => {
    const r = await mount({ tx: txBerish(), qarz: qarz() });
    const btn = byText(r, 'Ulashish');
    await act(async () => {
      void btn.props.onPress();
      void btn.props.onPress();
    });
    expect(mockGeneratePdf).toHaveBeenCalledTimes(1);
  });
});
