/**
 * QarzDaftari (dashboard) xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/qarz_daftari_tree.json) + amal testlari (navigatsiya, do'kon tanlovi, toast, yangilash).
 * Faqat chegaralar mock. Daraxtlarni qayta yaratish (FAQAT eski komponent bilan): QD_TREE_GEN=1 npx jest qarz_daftari_dashboard
 */
import React from 'react';
import { Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockToast = jest.fn();
const mockRefresh = { dash: jest.fn(), near: jest.fn(), shops: jest.fn() };
const mockSetShop = jest.fn();
const mockClearShop = jest.fn();
const mockSync = jest.fn();
const mockExit = jest.fn();
const mockPrefetch = jest.fn();
const mockStartPrefetch = jest.fn();
const mockOpenCreation = jest.fn();
const mockOpenURL = jest.fn();
const mockFocus: { cb: null | (() => void) } = { cb: null };
let mockShop: any = null;
let mockXodim = false;
let mockXodimNomi = '';
let mockFetch: Record<string, any> = {};

jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])),
  }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }),
  useFocusEffect: (cb: () => void) => {
    mockFocus.cb = cb;
    require('react').useEffect(() => {
      cb();
    }, []);
  },
}));
jest.mock('../src/offline/useQarzFetch', () => ({
  useQarzFetch: ({ url }: { url: string }) =>
    url.includes('/dashboard')
      ? { ...mockFetch.dash, onRefresh: mockRefresh.dash }
      : url.includes('/near-expiration')
      ? { ...mockFetch.near, onRefresh: mockRefresh.near }
      : { ...mockFetch.shops, onRefresh: mockRefresh.shops },
}));
jest.mock('../src/offline/ui/OfflineBanner', () => ({ __esModule: true, default: () => require('react').createElement('OfflineBanner') }));
jest.mock('../src/offline/ui/NotSavedOffline', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('NotSavedOffline', { offline: p.offline, onRetry: p.onRetry }),
}));
jest.mock('../src/offline/prefetch', () => ({
  prefetchForOffline: (...a: unknown[]) => mockPrefetch(...a),
  startOfflinePrefetch: (...a: unknown[]) => mockStartPrefetch(...a),
}));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/store/api/token/xodimSession', () => ({
  exitXodimSession: (...a: unknown[]) => mockExit(...a),
  isXodimSession: () => mockXodim,
  xodimFaoliyatNomi: () => mockXodimNomi,
}));
jest.mock('../src/store/api/token/qarzShop', () => ({
  clearQarzShop: (...a: unknown[]) => mockClearShop(...a),
  setQarzShop: (...a: unknown[]) => mockSetShop(...a),
  effectiveShopId: () => (mockShop ? mockShop.id : null),
  syncQarzShopWithList: (...a: unknown[]) => mockSync(...a),
  useQarzShop: () => mockShop,
}));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x', BOT_TG_APP_URL: 'tg://bot', BOT_TG_URL: 'https://t.me/bot' }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/screens/home/modules/QarzDaftariKalendar', () => ({ __esModule: true, default: () => require('react').createElement('Kalendar') }));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/components/AnimatedEmpty', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('AnimatedEmpty', { variant: p.variant, compact: p.compact }),
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/screens/home/redesign/RdTopBar', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdTopBar', { title: p.title }),
}));
jest.mock('../src/components/ui/Grad', () => ({ Grad: (p: any) => require('react').createElement('Grad', { id: p.id, colors: p.colors }) }));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, k) =>
          k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color }),
      },
    ),
);
jest.mock('../src/screens/home/modules/qarzAmaliyot', () => ({ openCreationAmaliyot: (...a: unknown[]) => mockOpenCreation(...a) }));

import QarzDaftari, { DashboardChartCard } from '../src/screens/home/modules/QarzDaftari';

const NOW = new Date('2026-11-01T07:00:00Z');
const d = (day: number) => `2026-11-${String(day).padStart(2, '0')}T12:00:00`;

const DASH = {
  data: {
    berilgan_qarz: { daftari: { uzs: 1050000, usd: 120.5 } },
    olingan_qarz: { daftari: { uzs: 550000, usd: 0 } },
    muddati_otgan_debitor: { daftari: { uzs: 200000, usd: 5 } },
    muddati_otgan_kreditor: { daftari: { uzs: 0, usd: 0 } },
  },
};
const NEAR = {
  data: {
    debitor: [
      { qarz_id: 11, mijoz_id: 101, mijoz_fish: 'ALI VALIYEV', turi: 'berish', end_date: d(1), residual_amount: 1500000, currency: 'UZS' },
      { qarz_id: 12, mijoz_id: null, mijoz_fish: 'bobur karimov', turi: 'berish', end_date: d(4), residual_amount: 2000000, currency: 'UZS' },
      { qarz_id: 13, mijoz_id: 103, mijoz_fish: '', turi: 'berish', end_date: d(20), residual_amount: 90, currency: 'USD' },
      { qarz_id: 14, mijoz_id: 104, mijoz_fish: 'Eski Qarz', turi: 'berish', end_date: '2026-10-29T12:00:00', residual_amount: 10, currency: 'uzs' },
      { qarz_id: 15, mijoz_id: 105, mijoz_fish: 'Nodate', turi: 'berish', end_date: undefined, residual_amount: 7, currency: undefined },
    ],
    kreditor: [{ qarz_id: 21, mijoz_id: 201, mijoz_fish: 'SALIMA RAHIMOVA', turi: 'olish', end_date: d(9), residual_amount: 300000, currency: 'UZS' }],
  },
};
const SHOPS2 = { data: [{ id: 1, nomi: 'Do‘kon A', is_xodim_role: false }, { id: 2, nomi: 'Do‘kon B', is_xodim_role: true }] };
const SHOP1 = { data: [{ id: 1, nomi: 'Do‘kon A' }] };
const ok = (data: any, extra: any = {}) => ({ data, loading: false, error: false, offline: false, ...extra });
const unknownShops = (offline: boolean) => ({ data: [], loading: false, error: true, offline });

const setup = (o: { dash?: any; near?: any; shops?: any; shop?: any; xodim?: boolean; xodimNomi?: string } = {}) => {
  mockFetch = {
    dash: o.dash ?? ok(DASH),
    near: o.near ?? ok(NEAR),
    shops: o.shops ?? ok(SHOPS2),
  };
  mockShop = o.shop ?? null;
  mockXodim = !!o.xodim;
  mockXodimNomi = o.xodimNomi ?? '';
};
const mount = async () => {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<QarzDaftari />);
  });
  return r;
};
const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n))[0];
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => press(r, n => textOf(n).trim() === text);
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const shopCard = (r: TestRenderer.ReactTestRenderer, text: string) =>
  press(r, n => n.props.activeOpacity === 0.85 && textOf(n).includes(text));
const pickerRow = (r: TestRenderer.ReactTestRenderer, text: string) =>
  press(r, n => n.props.activeOpacity === 0.7 && textOf(n).includes(text));
// findAll kompozit va uning ichki host tugunlarini ham qaytaradi — faqat eng tashqarisini qoldiramiz.
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const dueRows = (r: TestRenderer.ReactTestRenderer) =>
  outer(r.root.findAll(n => n.props.activeOpacity === 0.7 && typeof n.props.onPress === 'function' && /kun|Bugun/.test(textOf(n))));

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockOpenCreation.mockResolvedValue(true);
  jest.spyOn(Linking, 'openURL').mockImplementation((u: string) => mockOpenURL(u));
  mockOpenURL.mockResolvedValue(undefined);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'qarz_daftari_tree.json');
const GEN = !!process.env.QD_TREE_GEN;

describe('QarzDaftari — render daraxti (vizual chiqish o\'zgarmagan)', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['2 shops, none selected', async () => (setup(), mount())],
    ['one shop selected', async () => (setup({ shops: ok(SHOP1), shop: { id: 1, nomi: 'Do‘kon A' } }), mount())],
    ['selected shop without name', async () => (setup({ shops: ok(SHOP1), shop: { id: 1 } }), mount())],
    ['no shops', async () => (setup({ shops: ok({ data: [] }) }), mount())],
    ['shops unknown offline', async () => (setup({ shops: unknownShops(true) }), mount())],
    ['shops unknown online error', async () => (setup({ shops: unknownShops(false) }), mount())],
    ['xodim mode with name', async () => (setup({ xodim: true, xodimNomi: 'Mening do‘konim' }), mount())],
    ['xodim mode no name', async () => (setup({ xodim: true }), mount())],
    ['dashboard error online', async () => (setup({ dash: { data: [], loading: false, error: true, offline: false } }), mount())],
    ['dashboard error offline', async () => (setup({ dash: { data: [], loading: false, error: true, offline: true } }), mount())],
    ['empty dashboard + near', async () => (setup({ dash: ok([]), near: ok([]) }), mount())],
    ['loading both', async () => (setup({ dash: { data: [], loading: true }, near: { data: [], loading: true } }), mount())],
    ['loading dash only', async () => (setup({ dash: { data: [], loading: true } }), mount())],
    [
      'picker open (2 shops, selected B)',
      async () => {
        setup({ shop: { id: 2, nomi: 'Do‘kon B', isXodim: true } });
        const r = await mount();
        await tap(shopCard(r, 'Do‘kon B'));
        return r;
      },
    ],
    [
      'picker open (2 shops, none selected)',
      async () => {
        setup();
        const r = await mount();
        await tap(shopCard(r, 'Barcha do‘konlar'));
        return r;
      },
    ],
    [
      'picker open (no shops)',
      async () => {
        setup({ shops: ok({ data: [] }) });
        const r = await mount();
        await tap(byText(r, 'Qarzga berish'));
        return r;
      },
    ],
    [
      'picker open (1 shop)',
      async () => {
        setup({ shops: ok(SHOP1) });
        const r = await mount();
        await tap(shopCard(r, 'Barcha do‘konlar'));
        return r;
      },
    ],
    [
      'due table berilgan USD tab',
      async () => {
        setup();
        const r = await mount();
        await tap(press(r, n => textOf(n) === 'USD' && n.props.activeOpacity === 0.8));
        return r;
      },
    ],
    [
      'warning dismissed',
      async () => {
        setup();
        const r = await mount();
        await tap(byText(r, 'Tushundim'));
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

describe('QarzDaftari — DashboardChartCard (eksport)', () => {
  const render = (props: any) => {
    let r!: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      r = TestRenderer.create(
        <DashboardChartCard
          accent="#123456"
          Icon={(p: any) => React.createElement('Icon', p)}
          title="T"
          usdRate={12000}
          shartnomaUzs={1000}
          shartnomaUsd={1}
          daftariUzs={2000}
          daftariUsd={0}
          {...props}
        />,
      );
    });
    return r;
  };
  const GOLD = path.join(__dirname, 'fixtures', 'qarz_daftari_chart_tree.json');
  const cases: Record<string, any> = {
    default: {},
    withPersonal: { shaxsiyUzs: 5000, shaxsiyUsd: 2 },
    noRate: { usdRate: 0 },
    zero: { shartnomaUzs: 0, shartnomaUsd: 0, daftariUzs: 0 },
  };
  const golden: Record<string, string> = !GEN && fs.existsSync(GOLD) ? JSON.parse(fs.readFileSync(GOLD, 'utf8')) : {};
  const rec: Record<string, string> = {};
  afterAll(() => {
    if (GEN) fs.writeFileSync(GOLD, JSON.stringify(rec, null, 1));
  });
  it.each(Object.keys(cases))('%s', name => {
    const out = ser(render(cases[name]).toJSON());
    if (GEN) rec[name] = out;
    else expect(out).toBe(golden[name]);
  });
});

describe('QarzDaftari — amallar', () => {
  it('mount: oflayn prefetch ishga tushadi, do\'konlar ro\'yxati sinxronlanadi', async () => {
    setup();
    await mount();
    expect(mockStartPrefetch).toHaveBeenCalledTimes(1);
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
    expect(mockSync).toHaveBeenCalledWith(SHOPS2.data);
  });
  it('ro\'yxat massiv bo\'lmasa sinxronlanmaydi', async () => {
    setup({ shops: { data: undefined, loading: false, error: true, offline: true } });
    await mount();
    expect(mockSync).not.toHaveBeenCalled();
  });
  it('birinchi fokus yangilamaydi, ikkinchisi uchala ro\'yxatni yangilaydi', async () => {
    setup();
    await mount();
    expect(mockRefresh.dash).not.toHaveBeenCalled();
    await act(async () => {
      mockFocus.cb!();
    });
    expect(mockRefresh.dash).toHaveBeenCalledWith({});
    expect(mockRefresh.near).toHaveBeenCalledWith({});
    expect(mockRefresh.shops).toHaveBeenCalledWith({});
  });
  it('fokusda xodim holati qayta o\'qiladi', async () => {
    setup();
    const r = await mount();
    expect(tree(r)).not.toContain('Xodim rejimi');
    mockXodim = true;
    mockXodimNomi = 'X';
    await act(async () => {
      mockFocus.cb!();
    });
    expect(tree(r)).toContain('Xodim rejimi');
  });
  it('xodimdan chiqish: sessiya yopiladi, banner yo\'qoladi, summalar yangilanadi', async () => {
    setup({ xodim: true, xodimNomi: 'N' });
    const r = await mount();
    await tap(byText(r, 'Chiqish'));
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockRefresh.dash).toHaveBeenCalledWith({});
    expect(mockRefresh.near).toHaveBeenCalledWith({});
    expect(tree(r)).not.toContain('Xodim rejimi');
  });
  it('Qarzga berish/olish: tanlangan do\'kon bo\'lsa darhol mijozlar', async () => {
    setup({ shop: { id: 7, nomi: 'S' } });
    const r = await mount();
    await tap(byText(r, 'Qarzga berish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariMijozlar', { faoliyat_id: 7, faoliyat_nomi: 'S', turi: 'berish' });
    await tap(byText(r, 'Qarzga olish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariMijozlar', { faoliyat_id: 7, faoliyat_nomi: 'S', turi: 'olish' });
  });
  it('tanlangan do\'kon + ro\'yxat noma\'lum (oflayn): baribir mijozlar', async () => {
    setup({ shop: { id: 7, nomi: 'S' }, shops: unknownShops(true) });
    const r = await mount();
    await tap(byText(r, 'Qarzga olish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariMijozlar', { faoliyat_id: 7, faoliyat_nomi: 'S', turi: 'olish' });
  });
  it('do\'kon yo\'q: yaratish sahifasi', async () => {
    setup({ shops: ok({ data: [] }) });
    const r = await mount();
    await tap(byText(r, 'Qarzga berish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariFaoliyat', undefined);
  });
  it('ro\'yxat noma\'lum oflayn: toast, navigatsiya yo\'q', async () => {
    setup({ shops: unknownShops(true) });
    const r = await mount();
    await tap(byText(r, 'Qarzga berish'));
    expect(mockToast).toHaveBeenCalledWith({ type: 'error2', props: { desc: 'Bu ma’lumot oflayn saqlanmagan — internet tiklanganda yuklanadi' } });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  it('ro\'yxat noma\'lum onlayn: qayta o\'qiladi', async () => {
    setup({ shops: unknownShops(false) });
    const r = await mount();
    await tap(byText(r, 'Qarzga berish'));
    expect(mockRefresh.shops).toHaveBeenCalledWith({});
    expect(mockToast).not.toHaveBeenCalled();
  });
  it('do\'kon kartasi: noma\'lum -> hint', async () => {
    setup({ shops: unknownShops(true) });
    const r = await mount();
    await tap(press(r, n => n.props.activeOpacity === 0.85));
    expect(mockToast).toHaveBeenCalledTimes(1);
  });
  it('do\'kon kartasi: bo\'sh -> yaratish sahifasi', async () => {
    setup({ shops: ok({ data: [] }) });
    const r = await mount();
    await tap(press(r, n => n.props.activeOpacity === 0.85));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariFaoliyat', undefined);
  });
  it('2+ do\'kon, tanlanmagan: Qarzga berish tanlagichni ochadi; do\'kon tanlansa mijozlarga o\'tadi', async () => {
    setup();
    const r = await mount();
    await tap(byText(r, 'Qarzga berish'));
    expect(mockNavigate).not.toHaveBeenCalled();
    await tap(pickerRow(r, 'Do‘kon A'));
    expect(mockSetShop).toHaveBeenCalledWith({ id: 1, nomi: 'Do‘kon A', isXodim: false });
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariMijozlar', { faoliyat_id: 1, faoliyat_nomi: 'Do‘kon A', turi: 'berish' });
  });
  it('tanlagichdan xodim do\'koni: isXodim true, navigatsiya yo\'q (kutilayotgan amal yo\'q)', async () => {
    setup();
    const r = await mount();
    await tap(shopCard(r, 'Barcha do‘konlar'));
    await tap(pickerRow(r, 'Do‘kon B'));
    expect(mockSetShop).toHaveBeenCalledWith({ id: 2, nomi: 'Do‘kon B', isXodim: true });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  it('"Barcha do\'konlar" qatori tanlovni tozalaydi', async () => {
    setup({ shop: { id: 1, nomi: 'Do‘kon A' } });
    const r = await mount();
    await tap(shopCard(r, 'Do‘kon A'));
    await tap(press(r, n => n.props.activeOpacity === 0.7 && textOf(n).trim() === 'Barcha do‘konlar'));
    expect(mockClearShop).toHaveBeenCalledTimes(1);
    expect(mockSetShop).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  it('tanlagich yopilsa kutilayotgan amal bekor qilinadi', async () => {
    setup();
    const r = await mount();
    await tap(byText(r, 'Qarzga berish'));
    const modal = r.root.findAll(n => typeof n.props.onRequestClose === 'function')[0];
    await act(async () => {
      modal.props.onRequestClose();
    });
    await tap(shopCard(r, 'Barcha do‘konlar'));
    await tap(pickerRow(r, 'Do‘kon A'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  it('tahrirlash qalami: faqat egasi do\'koni, Faoliyat edit', async () => {
    setup();
    const r = await mount();
    await tap(shopCard(r, 'Barcha do‘konlar'));
    const pencils = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.hitSlop && n.props.hitSlop.top === 12));
    expect(pencils).toHaveLength(1);
    await tap(pencils[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariFaoliyat', { faoliyat_id: 1, faoliyat_nomi: 'Do‘kon A', edit: true });
  });
  it('"Yangi do\'kon qo\'shish" -> yaratish sahifasi', async () => {
    setup();
    const r = await mount();
    await tap(shopCard(r, 'Barcha do‘konlar'));
    await tap(byText(r, 'Yangi do‘kon qo‘shish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariFaoliyat', undefined);
  });
  it('summa kartalari navigatsiyasi', async () => {
    setup();
    const r = await mount();
    const cards = outer(
      r.root.findAll(
        n => n.props.activeOpacity === 0.9 && typeof n.props.onPress === 'function' && /Olish kerak|Berish kerak|Muddati o‘tgan/.test(textOf(n)),
      ),
    );
    // Hero tugmalari ham 0.9; faqat pill matni bor kartalar qoladi.
    const seen: any[] = [];
    for (const c of cards) {
      mockNavigate.mockClear();
      await tap(c);
      seen.push(mockNavigate.mock.calls[0]);
    }
    expect(seen).toEqual([
      ['QarzDaftariQarzlar', { turi: 'berish' }],
      ['QarzDaftariQarzlar', { turi: 'olish' }],
      ['QarzDaftariQarzlar', { turi: 'berish', status: 'muddati-otgan' }],
      ['QarzDaftariQarzlar', { turi: 'olish', status: 'muddati-otgan' }],
    ]);
  });
  it('muddati yaqin qator: mijoz bor -> mijoz sahifasi (ism titleCase)', async () => {
    setup();
    const r = await mount();
    const rows = dueRows(r);
    expect(rows.length).toBeGreaterThan(2);
    await tap(rows[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariMijoz', { id: 101, turi: 'berish', fish: 'Ali Valiyev' });
  });
  it('muddati yaqin qator: mijoz yo\'q -> amaliyot tafsiloti; ochilmasa toast', async () => {
    setup();
    const r = await mount();
    await tap(dueRows(r)[1]);
    expect(mockOpenCreation).toHaveBeenCalledWith({ navigate: expect.any(Function) }, 12);
    expect(mockToast).not.toHaveBeenCalled();
    mockOpenCreation.mockResolvedValue(false);
    await tap(dueRows(r)[1]);
    expect(mockToast).toHaveBeenCalledWith({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
  });
  it('wave E: bir renderda ikki marta bosish - amaliyot tafsiloti bitta marta ochiladi', async () => {
    setup();
    const r = await mount();
    mockOpenCreation.mockReturnValue(new Promise(() => {}));
    const row = dueRows(r)[1];
    await act(async () => {
      row.props.onPress();
      row.props.onPress();
    });
    expect(mockOpenCreation).toHaveBeenCalledTimes(1);
  });
  it('wave E: A qator kutayotganda B qator ishlaydi (kalit = qarz id); A ga ikkinchi bosish yuborilmaydi', async () => {
    const near = ok({
      data: {
        debitor: [
          { qarz_id: 31, mijoz_id: null, mijoz_fish: 'Aaa', turi: 'berish', end_date: d(1), residual_amount: 5, currency: 'UZS' },
          { qarz_id: 32, mijoz_id: null, mijoz_fish: 'Bbb', turi: 'berish', end_date: d(2), residual_amount: 6, currency: 'UZS' },
        ],
        kreditor: [],
      },
    });
    setup({ near });
    const r = await mount();
    mockOpenCreation.mockReturnValue(new Promise(() => {}));
    const rows = dueRows(r);
    expect(rows.length).toBeGreaterThan(1);
    await act(async () => {
      rows[0].props.onPress();
      rows[0].props.onPress();
      rows[1].props.onPress();
    });
    expect(mockOpenCreation.mock.calls.map(c => c[1])).toEqual([31, 32]);
  });
  it('amaliyotga uzatilgan navigate route+params uzatadi', async () => {
    setup();
    const r = await mount();
    await tap(dueRows(r)[1]);
    mockOpenCreation.mock.calls[0][0].navigate('X', { a: 1 });
    expect(mockNavigate).toHaveBeenLastCalledWith('X', { a: 1 });
  });
  it('Telegram havolasi: ilova, xato bo\'lsa brauzer', async () => {
    setup();
    const r = await mount();
    await tap(press(r, n => n.props.accessibilityRole === 'link'));
    expect(mockOpenURL).toHaveBeenLastCalledWith('tg://bot');
    mockOpenURL.mockImplementation((u: string) => (u === 'tg://bot' ? Promise.reject(new Error('x')) : Promise.resolve()));
    await tap(press(r, n => n.props.accessibilityRole === 'link'));
    expect(mockOpenURL).toHaveBeenLastCalledWith('https://t.me/bot');
  });
  it('dashboard xatosi: "Qayta urinish" yangilaydi', async () => {
    setup({ dash: { data: [], loading: false, error: true, offline: false } });
    const r = await mount();
    await act(async () => {
      r.root.findAll(n => (n.type as any) === 'NotSavedOffline')[0].props.onRetry();
    });
    expect(mockRefresh.dash).toHaveBeenCalledWith({});
  });
  it('do\'kon o\'zgarsa prefetch qayta ishlaydi', async () => {
    setup({ shop: { id: 1, nomi: 'A' } });
    const r = await mount();
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
    setup({ shop: { id: 2, nomi: 'B' } });
    await act(async () => {
      r.update(<QarzDaftari />);
    });
    expect(mockPrefetch).toHaveBeenCalledTimes(2);
  });
});
