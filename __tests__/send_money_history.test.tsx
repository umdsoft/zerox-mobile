/**
 * SendMoneyHistory (kirim-chiqim tarixi + tafsilot oynasi + PDF) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/send_money_history_tree.json) + amal testlari (tafsilot, navigatsiya, PDF yuklash fayl nomi/yo'li).
 * Faqat chegaralar mock. Qayta yaratish (FAQAT eski komponent bilan): SMH_TREE_GEN=1 npx jest send_money_history
 */
import React from 'react';
import { Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockGen = jest.fn();
const mockToast = jest.fn();
const mockCopy = jest.fn();
const mockWrite = jest.fn();
const mockExists = jest.fn();
const mockOpenFile = jest.fn();
const mockHtml = jest.fn();
let mockLang = 'uz';
let mockFetch: Record<string, any> = {};

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('react-i18next', () => ({
  useTranslation: () => [(k: string) => k, { language: mockLang }],
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }) }));
jest.mock('@react-navigation/material-top-tabs', () => ({
  createMaterialTopTabNavigator: () => ({
    Navigator: ({ children }: any) => require('react').createElement('Tabs', null, children),
    Screen: ({ component: C, name }: any) => require('react').createElement('TabScreen', { name }, require('react').createElement(C)),
  }),
}));
jest.mock('../src/navigation/TopTabBarSendMoney', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/hooks/useFetch', () => ({
  useFetch: ({ url }: { url: string }) => (url.endsWith('status=0') ? mockFetch.enter : mockFetch.exit),
}));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x', renderHTMLS: (d: any) => (mockHtml(d), '<html/>') }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/theme/style', () => ({ normalize: (n: number) => n, style: { fontSize: {}, textColor: '#000' } }));
jest.mock('../src/helper/listPerf', () => ({ LIST_PERF_PROPS: {} }));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/components/TransText', () => ({
  __esModule: true,
  default: (p: any) => {
    const R = require('react');
    const comps = p.components && typeof p.components === 'object' ? Object.keys(p.components).map(k => R.cloneElement(p.components[k], { key: k })) : [];
    return R.createElement('TransText', { tKey: p.tKey, values: p.values }, ...comps);
  },
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
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), color: p?.color })) },
    ),
);
jest.mock('../src/images/Cancel', () => ({ __esModule: true, default: () => require('react').createElement('Img', { name: 'Cancel' }) }));
jest.mock('../src/images/cancel_transfer', () => ({ __esModule: true, default: (p: any) => require('react').createElement('Img', { name: 'cancel_transfer', color: p?.color }) }));
jest.mock('../src/images/Success', () => ({ __esModule: true, default: (p: any) => require('react').createElement('Img', { name: 'Success', color: p?.color }) }));
jest.mock('react-native-paper', () => ({
  Modal: (p: any) => require('react').createElement('PaperModal', { visible: p.visible, dismissable: p.dismissable, onDismiss: p.onDismiss }, p.visible ? p.children : null),
}));
// jest.config moduleNameMapper endi faqat haqiqiy fayl kengaytmasini (`x.pdf`) fileMock'ga yo'naltiradi: PdfIcon va
// react-native-html-to-pdf alohida mock qilinadi.
jest.mock('../src/images/pdf', () => ({ __esModule: true, default: () => require('react').createElement('Img', { name: 'pdf' }) }));
jest.mock('react-native-html-to-pdf', () => ({
  __esModule: true,
  generatePDF: (...a: unknown[]) => mockGen(...a),
}));
jest.mock('react-native-file-viewer', () => ({ __esModule: true, default: { open: (...a: unknown[]) => mockOpenFile(...a) } }));
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: { exists: (...a: unknown[]) => mockExists(...a), writeFile: (...a: unknown[]) => mockWrite(...a) },
    MediaCollection: { copyToMediaStore: (...a: unknown[]) => mockCopy(...a) },
  },
}));

import SendMoneyHistory from '../src/screens/other/SendMoneyHistory';

const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const rows = (r: TestRenderer.ReactTestRenderer) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.8));
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};

const T = (over: any) => ({ id: 1, type: 1, number: 'N-100', amount: 1500000, created_at: '2026-10-05T12:00:00', time: '14:35:22', dname: 'Ali Valiyev', cname: 'Vali Aliyev', pay: '', ...over });
const ENTER = [
  T({ id: 11, type: 2 }),
  T({ id: 12, type: 3 }),
  T({ id: 13, type: 4, pay: '' }),
  T({ id: 14, type: 5 }),
  T({ id: 15, type: 1 }),
  T({ id: 16, type: 99 }),
  { id: undefined, type: 2, amount: 5 },
];
const EXIT = [
  T({ id: 21, type: 4, pay: 'Balance' }),
  T({ id: 22, type: 4, pay: 'BalanceSms' }),
  T({ id: 23, type: 3 }),
  T({ id: 24, type: 1 }),
];
const ok = (data: any) => ({ data: { data }, loading: false, error: false });

const setup = (o: { enter?: any; exit?: any } = {}) => {
  mockFetch = { enter: o.enter ?? ok(ENTER), exit: o.exit ?? ok(EXIT) };
};
const mount = async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<SendMoneyHistory />);
  });
  return r;
};
const open = async (r: TestRenderer.ReactTestRenderer, i: number) => {
  await tap(rows(r)[i]);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLang = 'uz';
  (Platform as any).OS = 'android';
  mockExists.mockResolvedValue(false);
  mockGen.mockResolvedValue({ filePath: '/docs/x.pdf', base64: 'B64' });
  mockCopy.mockResolvedValue(undefined);
  mockWrite.mockResolvedValue(undefined);
  mockOpenFile.mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'send_money_history_tree.json');
const GEN = !!process.env.SMH_TREE_GEN;

describe('SendMoneyHistory — render daraxti', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['lists', async () => (setup(), mount())],
    ['lists ru', async () => ((mockLang = 'ru'), setup(), mount())],
    ['empty lists', async () => (setup({ enter: ok([]), exit: ok([]) }), mount())],
    ['loading enter', async () => (setup({ enter: { data: null, loading: true } }), mount())],
    ['loading exit', async () => (setup({ exit: { data: null, loading: true } }), mount())],
    ...[0, 1, 2, 3, 4, 5, 6].map(
      i =>
        [
          `modal enter #${i}`,
          async () => {
            setup();
            const r = await mount();
            await open(r, i);
            return r;
          },
        ] as [string, () => Promise<TestRenderer.ReactTestRenderer>],
    ),
    ...[0, 1, 2, 3].map(
      i =>
        [
          `modal exit #${i}`,
          async () => {
            setup();
            const r = await mount();
            await open(r, ENTER.length + i);
            return r;
          },
        ] as [string, () => Promise<TestRenderer.ReactTestRenderer>],
    ),
    [
      'modal closed again',
      async () => {
        setup();
        const r = await mount();
        await open(r, 0);
        await act(async () => {
          r.root.findAll(n => (n.type as any) === 'PaperModal')[0].props.onDismiss();
        });
        return r;
      },
    ],
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

describe('SendMoneyHistory — amallar', () => {
  it('shartnoma raqamini bosish -> DownloadStatistic', async () => {
    setup();
    const r = await mount();
    await open(r, 4); // type 1
    const link = r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.allowFontScaling === false && textOf(n) === 'N-100')[0];
    await tap(link);
    expect(mockNavigate).toHaveBeenCalledWith('DownloadStatistic', { item: ENTER[4], id: 15 });
  });
  it('bir nechta qatorni ketma-ket ochish oxirgisini ko\'rsatadi', async () => {
    setup();
    const r = await mount();
    await open(r, 0);
    await open(r, 3);
    expect(tree(r)).toContain('876');
  });

  describe('PDF yuklash', () => {
    const dl = async (idx: number, items = ENTER) => {
      setup({ enter: ok(items) });
      const r = await mount();
      await open(r, idx);
      const btn = r.root.findAll(n => typeof n.props.onPress === 'function' && /download/.test(textOf(n)))[0];
      await tap(btn);
      return r;
    };
    it('wave E: bir renderda ikki marta yuklash - PDF bitta marta yaratiladi', async () => {
      setup({ enter: ok(ENTER) });
      const r = await mount();
      await open(r, 0);
      mockGen.mockReturnValue(new Promise(() => {}));
      const btn = r.root.findAll(n => typeof n.props.onPress === 'function' && /download/.test(textOf(n)))[0];
      await act(async () => {
        btn.props.onPress();
        btn.props.onPress();
      });
      expect(mockGen).toHaveBeenCalledTimes(1);
    });
    it('android: nom, MediaStore nusxa, FileViewer', async () => {
      await dl(0);
      expect(mockHtml).toHaveBeenCalledWith(ENTER[0]);
      expect(mockGen).toHaveBeenCalledWith({ fileName: 'O‘tkazma_11', html: '<html/>', directory: 'docs', width: 200, base64: true });
      expect(mockExists).toHaveBeenCalledWith('/storage/emulated/0/Download/Zerox/O‘tkazma_11.pdf');
      expect(mockCopy).toHaveBeenCalledWith({ name: 'O‘tkazma_11.pdf', parentFolder: 'Zerox', mimeType: 'application/pdf' }, 'Download', '/docs/x.pdf');
      expect(mockWrite).not.toHaveBeenCalled();
      expect(mockOpenFile).toHaveBeenCalledWith('file:///storage/emulated/0/Download/Zerox/O‘tkazma_11.pdf');
    });
    it('mavjud fayl: (1), (2) qo\'shiladi', async () => {
      mockExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValue(false);
      await dl(0);
      expect(mockGen.mock.calls[0][0].fileName).toBe('O‘tkazma_11(2)');
      expect(mockCopy.mock.calls[0][0].name).toBe('O‘tkazma_11(2).pdf');
    });
    it('tur bo\'yicha nom va til: 4 (uz/kr/ru), 5, default', async () => {
      const names: string[] = [];
      for (const [lang, idx] of [['uz', 2], ['kr', 2], ['ru', 2], ['uz', 3], ['kr', 3], ['ru', 3], ['uz', 4], ['kr', 4], ['ru', 4], ['uz', 5], ['ru', 1]] as [string, number][]) {
        mockLang = lang;
        mockGen.mockClear();
        await dl(idx);
        names.push(mockGen.mock.calls[0][0].fileName);
      }
      expect(names).toEqual([
        'Hisobni to‘ldirish_13', 'Хисобни тўлдириш_13', 'Пополнение счет_13',
        'Bekor_qilingan_to‘lov_14', 'Бекор қилинган тўлов_14', 'Отмененный платеж_14',
        'Komissiya_15', 'Комиссия_15', 'Комиссия_15',
        'Komissiya_16', 'Перевод_12',
      ]);
    });
    it('ios: writeFile base64, FileViewer file.filePath', async () => {
      (Platform as any).OS = 'ios';
      await dl(0);
      expect(mockCopy).not.toHaveBeenCalled();
      expect(mockWrite).toHaveBeenCalledWith('/docs/x.pdf', 'B64', 'base64');
      expect(mockOpenFile).toHaveBeenCalledWith('file:///docs/x.pdf');
    });
    it('xato yutiladi (console.error), FileViewer chaqirilmaydi', async () => {
      mockGen.mockRejectedValue(new Error('pdf'));
      await dl(0);
      expect(mockOpenFile).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        autoHide: true, visibilityTime: 3000, position: 'bottom', type: 'error2', props: { desc: 'Yuklab olish amalga oshmadi' },
      });
    });
    it('wave E: fayl saqlandi, lekin FileViewer ochilmadi -> xato EMAS, "saqlandi" xabari (android)', async () => {
      mockOpenFile.mockRejectedValue(new Error('no viewer'));
      await dl(0);
      expect(mockCopy).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith({
        type: 'omad', position: 'bottom', visibilityTime: 2500,
        props: { title: 'Yuklab olindi', desc: 'Download/Zerox papkasiga saqlandi' },
      });
    });
  });
});
