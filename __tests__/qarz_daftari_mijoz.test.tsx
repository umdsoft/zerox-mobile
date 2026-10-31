/**
 * QarzDaftariMijoz ("Mijoz tafsiloti") xarakteristika testlari — wave D bo'linishidan OLDIN yozilgan:
 * render daraxti goldenlari (fixtures/qarz_daftari_mijoz_tree.json) + amal testlari (navigatsiya params, talab, yopish, SMS shablon argumentlari).
 * Faqat chegaralar mock. Qayta yaratish (FAQAT eski komponent bilan): QM_TREE_GEN=1 npx jest qarz_daftari_mijoz
 */
import React from 'react';
import { Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockToast = jest.fn();
const mockRefresh = jest.fn();
const mockTalabStart = jest.fn();
const mockOpenURL = jest.fn();
const mockFocus: { cb: null | (() => void) } = { cb: null };
const mockSheet: { current: any } = { current: null };
const mockSmsTpl = jest.fn((...a: unknown[]) => ['TPL:' + JSON.stringify(a.slice(1))]);
let mockParams: any = {};
let mockFetch: any = {};
let mockOnline = true;
let mockTalab: any = { locked: false, demanding: false };

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])),
  }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: (...a: unknown[]) => mockNavigate(...a) }),
  useRoute: () => ({ params: mockParams }),
  useFocusEffect: (cb: () => void) => {
    mockFocus.cb = cb;
    require('react').useEffect(() => {
      cb();
    }, []);
  },
}));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: (_t, k) => `c.${String(k)}` }),
    font: new Proxy({}, { get: (_t, k) => `f.${String(k)}` }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));
jest.mock('../src/offline/useQarzFetch', () => ({ useQarzFetch: () => ({ ...mockFetch, onRefresh: mockRefresh }) }));
jest.mock('../src/offline/netStatus', () => ({ isOnline: () => mockOnline }));
jest.mock('../src/offline/submit', () => ({
  isUnsyncedId: (id: any) => typeof id === 'number' && id < 0,
  resolveLocalId: (id: any) => (id === 'tmp' ? 777 : id),
}));
jest.mock('../src/offline/ui/OfflineBanner', () => ({ __esModule: true, default: () => require('react').createElement('OfflineBanner') }));
jest.mock('../src/offline/ui/PendingBadge', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('PendingBadge', { id: p.item?.id }),
}));
jest.mock('../src/offline/ui/NotSavedOffline', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('NotSavedOffline', { offline: p.offline, onRetry: p.onRetry }),
  isDerivedBody: (b: any) => !!(b?._derived || b?.data?._derived),
  PartialDataNote: () => require('react').createElement('PartialNote'),
}));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/components/AnimatedEmpty', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('AnimatedEmpty', { variant: p.variant }),
}));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('RdHeader', { title: p.title }),
}));
jest.mock('../src/screens/components/DemandConfirmModal', () => ({ __esModule: true, default: () => require('react').createElement('DemandModal') }));
jest.mock('../src/screens/components/SmsTemplateSheet', () => ({
  __esModule: true,
  default: (p: any) => {
    mockSheet.current = p;
    return require('react').createElement('SmsSheet', { visible: p.visible, phone: p.phone, templates: p.templates });
  },
}));
jest.mock('../src/screens/home/modules/QarzMijozTavsiyaCard', () => ({
  __esModule: true,
  default: (p: any) => require('react').createElement('Tavsiya', { mijozId: p.mijozId }),
}));
jest.mock('../src/screens/home/modules/planGate', () => ({ usePlanFeatures: () => ({ expired: false }) }));
jest.mock('../src/screens/home/modules/qarzTalab', () => ({
  useQarzTalab: () => ({ modal: { visible: false }, start: (...a: unknown[]) => mockTalabStart(...a), ...mockTalab }),
}));
jest.mock('../src/screens/home/modules/qarzAmaliyot', () => ({
  creationParams: (q: any, tx: any[]) => ({ qid: q?.id, txCount: (tx || []).length }),
}));
jest.mock('../src/screens/home/modules/qarzSmsTemplates', () => ({ buildQarzSmsTemplates: (...a: unknown[]) => mockSmsTpl(...a) }));
jest.mock('../src/screens/home/modules/DebtActionButton', () => ({
  ...jest.requireActual('../src/screens/home/modules/DebtActionButton'),
  __esModule: true,
  default: (p: any) =>
    require('react').createElement('ActBtn', { label: p.label, tone: p.tone, disabled: !!p.disabled, hasTrailing: !!p.trailing, onPress: p.onPress }),
}));
jest.mock('../src/screens/home/modules/FinanceDebtActionModal', () => ({ BanIcon: () => require('react').createElement('Icon', { name: 'BanIcon' }) }));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color })) },
    ),
);

import QarzDaftariMijoz, { fmtDate } from '../src/screens/home/modules/QarzDaftariMijoz';

const NOW = new Date('2026-11-01T07:00:00Z');
const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : x));
const tree = (r: TestRenderer.ReactTestRenderer) => ser(r.toJSON());
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));
const press = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  outer(r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n)))[0];
const actBtn = (r: TestRenderer.ReactTestRenderer, label: string) => r.root.findAll(n => (n.type as any) === 'ActBtn' && n.props.label === label)[0];
const tap = async (node: any) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress();
  });
};
const toasts = () => mockToast.mock.calls.map(c => c[0]);

const dt = (s: string) => `${s}T12:00:00`;
const Q1 = { id: 1, turi: 'berish', status: 'aktiv', miqdor: 1000000, qoldiq: 700000, valyuta: 'UZS', berilgan_sana: dt('2026-10-01'), qaytarish_sanasi: dt('2026-10-20'), created_at: '2026-10-01 10:00:00' };
const Q2 = { id: 2, turi: 'berish', status: 'aktiv', miqdor: 50, qoldiq: 50, valyuta: 'USD', bolib_tolash: true, berilgan_sana: dt('2026-09-01'), qaytarish_sanasi: dt('2026-12-05'), created_at: '2026-10-15 11:00:00' };
const Q3 = { id: 3, turi: 'berish', status: 'yopilgan', miqdor: 300000, qoldiq: 0, valyuta: 'UZS', berilgan_sana: dt('2026-08-01'), created_at: '2026-08-01 10:00:00' };
const Q4 = { id: 4, turi: 'olish', status: 'aktiv', miqdor: 90000, qoldiq: 90000, valyuta: 'UZS', berilgan_sana: dt('2026-10-05'), qaytarish_sanasi: dt('2026-11-20'), created_at: '2026-10-05 10:00:00' };
const MIJOZ = { id: 10, fish: 'ALI VALIYEV', telefon: '+998901234567', savdo_faoliyat_id: 3, savdoFaoliyat: { nomi: 'Do‘kon A' } };
const STATS = {
  qoldiq_berilgan: { uzs: 1500000, usd: 20 },
  qoldiq_olingan: { uzs: 90000, usd: 0 },
  undirilgan_berilgan: { uzs: 500000, usd: 0 },
  undirilgan_olingan: { uzs: 200000, usd: 5 },
};
const body = (over: any = {}) => ({ data: { mijoz: MIJOZ, stats: STATS, qarzlar: [Q1, Q2, Q3, Q4], tranzaksiyalar: [{ qarz_id: 1 }], ...over } });
const ok = (b: any, extra: any = {}) => ({ data: b, loading: false, error: false, offline: false, ...extra });

const mount = async (params: any, fetch: any = ok(body())) => {
  mockParams = params;
  mockFetch = fetch;
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<QarzDaftariMijoz />);
  });
  return r;
};

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockOnline = true;
  mockTalab = { locked: false, demanding: false };
  jest.spyOn(Linking, 'openURL').mockImplementation((u: string) => mockOpenURL(u));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const TREE_PATH = path.join(__dirname, 'fixtures', 'qarz_daftari_mijoz_tree.json');
const GEN = !!process.env.QM_TREE_GEN;

describe('QarzDaftariMijoz — render daraxti', () => {
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['berish (default)', () => mount({ id: 10, turi: 'berish', fish: 'param fish' })],
    ['olish', () => mount({ id: 10, turi: 'olish' })],
    ['no params', () => mount(undefined as any)],
    ['bad turi -> berish', () => mount({ id: 10, turi: 'zzz' })],
    ['talab locked', async () => ((mockTalab = { locked: true, demanding: false }), mount({ id: 10, turi: 'berish' }))],
    ['talab demanding', async () => ((mockTalab = { locked: false, demanding: true }), mount({ id: 10, turi: 'berish' }))],
    ['no phone', () => mount({ id: 10, turi: 'berish' }, ok(body({ mijoz: { ...MIJOZ, telefon: '' } })))],
    ['no shop name', () => mount({ id: 10, turi: 'berish' }, ok(body({ mijoz: { ...MIJOZ, savdoFaoliyat: null } })))],
    ['no active debts', () => mount({ id: 10, turi: 'berish' }, ok(body({ qarzlar: [Q3] })))],
    ['empty data', () => mount({ id: 10, turi: 'berish', fish: 'Fallback Fish' }, ok({ data: {} }))],
    ['null data', () => mount({ id: 10, turi: 'berish' }, ok(null))],
    ['huge sums (B + long)', () => mount({ id: 10, turi: 'berish' }, ok(body({ stats: { ...STATS, qoldiq_berilgan: { uzs: 12650000000, usd: 123456789 }, undirilgan_berilgan: { uzs: 1000460000, usd: 0 } } })))],
    ['loading', () => mount({ id: 10 }, { data: null, loading: true })],
    ['error offline', () => mount({ id: 10, turi: 'berish' }, { data: null, loading: false, error: true, offline: true })],
    ['error online', () => mount({ id: 10, turi: 'olish' }, { data: null, loading: false, error: true, offline: false })],
    ['derived body note', () => mount({ id: 10, turi: 'berish' }, ok({ ...body(), _derived: true }))],
    ['unsynced id (tavsiya null)', () => mount({ id: -5, turi: 'berish' })],
    ['temp id resolved', () => mount({ id: 'tmp', turi: 'berish' })],
    [
      'sms sheet open',
      async () => {
        const r = await mount({ id: 10, turi: 'berish' });
        await tap(press(r, n => n.props.accessibilityLabel === 'SMS yuborish'));
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

describe('QarzDaftariMijoz — amallar', () => {
  it('fmtDate eksporti', () => {
    expect(fmtDate(dt('2026-10-05'))).toBe('05.10.2026');
    expect(fmtDate('')).toBe('');
  });
  it('birinchi fokus yangilamaydi, ikkinchisi yangilaydi', async () => {
    await mount({ id: 10, turi: 'berish' });
    expect(mockRefresh).not.toHaveBeenCalled();
    await act(async () => {
      mockFocus.cb!();
    });
    expect(mockRefresh).toHaveBeenCalledWith({});
  });
  it('xato holatida "Qayta urinish" yangilaydi', async () => {
    const r = await mount({ id: 10 }, { data: null, loading: false, error: true, offline: false });
    await act(async () => {
      r.root.findAll(n => (n.type as any) === 'NotSavedOffline')[0].props.onRetry();
    });
    expect(mockRefresh).toHaveBeenCalledWith({});
  });
  it('tahrirlash qalami: QarzDaftariMijozYangi edit params', async () => {
    const r = await mount({ id: 10, turi: 'olish', fish: 'p' });
    await tap(press(r, n => n.props.activeOpacity === 0.7 && n.props.hitSlop && n.props.hitSlop.top === 12));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariMijozYangi', {
      edit: true, mijoz_id: 10, faoliyat_id: 3, fish: 'ALI VALIYEV', telefon: '+998901234567', turi: 'olish',
    });
  });
  it('qo\'ng\'iroq tugmasi: tel:', async () => {
    const r = await mount({ id: 10, turi: 'berish' });
    await tap(press(r, n => n.props.activeOpacity === 0.85 && /tel:/.test(String(n.props.onPress))));
    expect(mockOpenURL).toHaveBeenCalledWith('tel:+998901234567');
  });
  it('"Yangi qarz": params (qoldiq turi bo\'yicha)', async () => {
    let r = await mount({ id: 10, turi: 'berish' });
    await tap(actBtn(r, 'Yangi qarz'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariYangi', {
      faoliyat_id: 3, mijoz_id: 10, fish: 'Ali Valiyev', turi: 'berish', qoldiq_uzs: 1500000, qoldiq_usd: 20,
    });
    r = await mount({ id: 10, turi: 'olish' });
    await tap(actBtn(r, 'Yangi qarz'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariYangi', expect.objectContaining({ turi: 'olish', qoldiq_uzs: 90000, qoldiq_usd: 0 }));
  });
  it('"Yangi qarz": mijoz yo\'q -> toast', async () => {
    const r = await mount({ id: 10, turi: 'berish' }, ok({ data: {} }));
    await tap(actBtn(r, 'Yangi qarz'));
    expect(toasts()).toEqual([{ type: 'error2', props: { desc: 'Mijoz ma’lumotlari topilmadi' } }]);
  });
  it('yopish: ENG YANGI aktiv qarz (created_at), valyuta qoldiqqa qarab', async () => {
    const r = await mount({ id: 10, turi: 'berish' });
    await tap(actBtn(r, 'Qarzni yopish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariYopish', { mode: 'mijoz', mijoz_id: 10, turi: 'berish', valyuta: 'UZS', id: 2 });
  });
  it('yopish: faqat USD qoldiq -> USD; ikkalasi 0 -> qarz valyutasi', async () => {
    let r = await mount({ id: 10, turi: 'berish' }, ok(body({ stats: { ...STATS, qoldiq_berilgan: { uzs: 0, usd: 5 } } })));
    await tap(actBtn(r, 'Qarzni yopish'));
    expect(mockNavigate.mock.calls.pop()[1].valyuta).toBe('USD');
    r = await mount({ id: 10, turi: 'berish' }, ok(body({ stats: { ...STATS, qoldiq_berilgan: { uzs: 0, usd: 0 } } })));
    await tap(actBtn(r, 'Qarzni yopish'));
    expect(mockNavigate.mock.calls.pop()[1].valyuta).toBe('USD'); // Q2 (eng yangi) valyutasi
  });
  it('olish: "Qarzni qaytarish" yopish oqimi; talab/voz kechish tugmalari yo\'q', async () => {
    const r = await mount({ id: 10, turi: 'olish' });
    expect(actBtn(r, 'Talab qilish')).toBeUndefined();
    expect(actBtn(r, 'Voz kechish')).toBeUndefined();
    await tap(actBtn(r, 'Qarzni qaytarish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariYopish', { mode: 'mijoz', mijoz_id: 10, turi: 'olish', valyuta: 'UZS', id: 4 });
  });
  it('aktiv qarz yo\'q: yopish/voz kechish/talab hint', async () => {
    const r = await mount({ id: 10, turi: 'berish' }, ok(body({ qarzlar: [Q3] })));
    for (const l of ['Qarzni yopish', 'Voz kechish', 'Talab qilish']) {
      mockToast.mockClear();
      await act(async () => {
        actBtn(r, l).props.onPress();
      });
      expect(toasts()).toEqual([{ type: 'error2', visibilityTime: 3500, props: { desc: 'Aktiv qarzlar yo‘q' } }]);
    }
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  it('voz kechish: eng yangi aktiv qarz id', async () => {
    const r = await mount({ id: 10, turi: 'berish' });
    await tap(actBtn(r, 'Voz kechish'));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariVozKechish', { id: 2 });
  });
  it('talab: oflayn -> hint; sinxronlanmagan qarz -> hint; telefon yo\'q -> hint; OK -> start', async () => {
    mockOnline = false;
    let r = await mount({ id: 10, turi: 'berish' });
    await act(async () => {
      actBtn(r, 'Talab qilish').props.onPress();
    });
    expect(toasts().pop().props.desc).toBe('Talab SMS faqat internet bilan (sinxronlangan qarz uchun) yuboriladi');
    mockOnline = true;
    r = await mount({ id: -3, turi: 'berish' });
    await act(async () => {
      actBtn(r, 'Talab qilish').props.onPress();
    });
    expect(toasts().pop().props.desc).toBe('Talab SMS faqat internet bilan (sinxronlangan qarz uchun) yuboriladi');
    r = await mount({ id: 10, turi: 'berish' }, ok(body({ mijoz: { ...MIJOZ, telefon: '' } })));
    expect(actBtn(r, 'Talab qilish').props.disabled).toBe(true);
    await act(async () => {
      actBtn(r, 'Talab qilish').props.onPress();
    });
    expect(toasts().pop().props.desc).toBe('Mijoz telefoni yo‘q');
    r = await mount({ id: 10, turi: 'berish' });
    await tap(actBtn(r, 'Talab qilish'));
    expect(mockTalabStart).toHaveBeenCalledWith({ id: 2, faoliyatId: 3, faoliyatNomi: 'Do‘kon A', amount: 50, valyuta: 'USD' });
  });
  it('talab: qoldiq null bo\'lsa miqdor; demanding bo\'lsa takror e\'tiborsiz', async () => {
    let r = await mount({ id: 10, turi: 'berish' }, ok(body({ qarzlar: [{ ...Q1, qoldiq: null }] })));
    await tap(actBtn(r, 'Talab qilish'));
    expect(mockTalabStart).toHaveBeenCalledWith(expect.objectContaining({ amount: 1000000 }));
    mockTalabStart.mockClear();
    mockTalab = { locked: false, demanding: true };
    r = await mount({ id: 10, turi: 'berish' });
    await tap(actBtn(r, 'Yuborilmoqda...'));
    expect(mockTalabStart).not.toHaveBeenCalled();
  });
  it('aktiv qarz qatori: creationParams + mijoz', async () => {
    const r = await mount({ id: 10, turi: 'berish' });
    const rows = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.8 && /Qoldiq:/.test(textOf(n))));
    expect(rows).toHaveLength(2);
    await tap(rows[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariAmaliyot', { qid: 2, txCount: 1, mijoz: MIJOZ });
  });
  it('aktiv qarzlar tartibi: eskisi oldin (berilgan_sana bo\'yicha)', async () => {
    const r = await mount({ id: 10, turi: 'berish' });
    const rows = outer(r.root.findAll(n => typeof n.props.onPress === 'function' && n.props.activeOpacity === 0.8 && /Qoldiq:/.test(textOf(n))));
    expect(textOf(rows[0])).toContain('50 USD');
    expect(textOf(rows[1])).toContain('700 000');
  });
  it('"Amaliyotlar tarixi" navigatsiyasi', async () => {
    const r = await mount({ id: 10, turi: 'olish' });
    await tap(press(r, n => n.props.activeOpacity === 0.8 && /Amaliyotlar tarixi/.test(textOf(n))));
    expect(mockNavigate).toHaveBeenLastCalledWith('QarzDaftariAmaliyotlar', { mijoz_id: 10, turi: 'olish' });
  });
  it('tavsiya: mijoz id (hal qilingan)', async () => {
    const r = await mount({ id: 'tmp', turi: 'berish' });
    expect(r.root.findAll(n => (n.type as any) === 'Tavsiya')[0].props.mijozId).toBe(777);
  });
  it('SMS shablon argumentlari: berish / olish, muddati o\'tgan eng eski sana, qisman to\'langan', async () => {
    let r = await mount({ id: 10, turi: 'berish' });
    await tap(press(r, n => n.props.accessibilityLabel === 'SMS yuborish'));
    const call = mockSmsTpl.mock.calls.pop() as any[];
    expect(call[1]).toEqual({
      turi: 'berish', ism: 'Ali Valiyev', dokon: 'Do‘kon A', summa: '1 500 000 UZS va 20 USD', sana: '20.10.2026', overdue: true, partlyPaid: true,
    });
    expect(mockSheet.current.templates[0]).toMatch(/^TPL:/);
    expect(mockSheet.current.phone).toBe('+998901234567');
    r = await mount({ id: 10, turi: 'olish' });
    await tap(press(r, n => n.props.accessibilityLabel === 'SMS yuborish'));
    expect((mockSmsTpl.mock.calls.pop() as any[])[1]).toEqual({
      turi: 'olish', ism: 'Ali Valiyev', dokon: 'Do‘kon A', summa: '90 000 UZS', sana: '20.11.2026', overdue: false, partlyPaid: true,
    });
  });
  it('SMS shablonlar oyna yopiqda tuzilmaydi; yopilganda bo\'shaydi', async () => {
    const r = await mount({ id: 10, turi: 'berish' });
    expect(mockSmsTpl).not.toHaveBeenCalled();
    await tap(press(r, n => n.props.accessibilityLabel === 'SMS yuborish'));
    await act(async () => {
      mockSheet.current.onClose();
    });
    expect(mockSheet.current.visible).toBe(false);
    expect(mockSheet.current.templates).toEqual([]);
  });
  it('SMS: muddati o\'tgan yo\'q -> eng yaqin kelgusi; undirilgan 0 -> partlyPaid false', async () => {
    const r = await mount(
      { id: 10, turi: 'berish' },
      ok(body({ qarzlar: [Q2], stats: { ...STATS, undirilgan_berilgan: { uzs: 0, usd: 0 } } })),
    );
    await tap(press(r, n => n.props.accessibilityLabel === 'SMS yuborish'));
    const a = (mockSmsTpl.mock.calls.pop() as any[])[1];
    expect(a.sana).toBe('05.12.2026');
    expect(a.overdue).toBe(false);
    expect(a.partlyPaid).toBe(false);
  });
});
