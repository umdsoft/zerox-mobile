/**
 * Notification bola komponentlari (notifications/all/*) — xulq barmoq izi (wave D, "navigation prop drilling" olib tashlashdan OLDIN):
 * har bir bola, har ikki taraf (creditor / debitor) uchun render daraxti + HAR BIR bosiladigan elementni bosganda
 * (navigation.navigate chaqiruvlari, callback proplar, axios, toast) yozib olinadi. Eski kodda `navigation` PROP sifatida beriladi,
 * yangi kodda bola `useNavigation()` ishlatadi — useNavigation shu testda xuddi shu `mockNav` ni qaytaradi, shuning uchun natija bir xil bo'lishi SHART.
 * Qayta yaratish (FAQAT eski kod bilan): NC_GEN=1 npx jest notification_children
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import fs from 'fs';
import path from 'path';

const mockNavigate = jest.fn();
const mockToast = jest.fn();
const mockAxios = jest.fn();
const mockOpenCreation = jest.fn();
const mockOpenURL = jest.fn();
const mockGlobalNavigate = jest.fn();
const mockNav: any = {
  navigate: (...a: unknown[]) => mockNavigate(...a),
  goBack: (...a: unknown[]) => mockNavigate('__goBack', ...a),
  reset: (...a: unknown[]) => mockNavigate('__reset', ...a),
  push: (...a: unknown[]) => mockNavigate('__push', ...a),
};
let mockState: any = {};

jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: any) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])) }),
  Trans: (p: any) => require('react').createElement('Trans', { i18nKey: p.i18nKey, values: p.values }),
}));
jest.mock('react-redux', () => ({
  useSelector: (fn: (s: any) => any) => fn(mockState),
  useDispatch: () => (a: any) => a,
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNav }));
jest.mock('../src/navigation/NavigationRef', () => ({ navigate: (...a: unknown[]) => mockGlobalNavigate(...a) }));
const mkAxios = (m: string) => (...a: unknown[]) => {
  mockAxios(m, ...a);
  return Promise.resolve({ status: 200, data: { success: true, data: { id: 1, status: 'pending' } } });
};
jest.mock('axios', () => ({ __esModule: true, default: { get: mkAxios('get'), post: mkAxios('post'), put: mkAxios('put') } }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a), hide: jest.fn() } }));
jest.mock('react-native-toast-message/lib/src/Toast', () => ({ Toast: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/store/api/token/qarzShop', () => ({ setQarzShop: jest.fn(), clearQarzShop: jest.fn(), effectiveShopId: () => null }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('../src/hooks/useOfertaGuard', () => ({ useOfertaGuard: () => (fn: () => void) => fn() }));
jest.mock('../src/helper/useFio', () => ({ useFio: () => ({ fio: (s: string) => `fio(${s})` }), fioNow: (s: string) => `fioNow(${s})` }));
jest.mock('../src/helper/safeOpenURL', () => ({ safeOpenURL: (...a: unknown[]) => mockOpenURL(...a) }));
jest.mock('../src/screens/home/modules/qarzAmaliyot', () => ({
  openCreationAmaliyot: (nav: any, id: any) => {
    mockOpenCreation(nav === mockNav, id);
    return Promise.resolve(true);
  },
  fetchCreationParams: (id: any) => {
    mockOpenCreation('fetch', id);
    return Promise.resolve({ tx: { id: 1 }, qarz: { id } });
  },
}));
jest.mock('../src/screens/home/modules/financeApi', () => ({
  financeApi: new Proxy({}, { get: (_t, k) => (...a: unknown[]) => { mockAxios('financeApi.' + String(k), ...a); return Promise.resolve({ data: { success: true, data: {} } }); } }),
}));
jest.mock('../src/screens/home/modules/debtPlan/debtPlanApi', () => ({
  debtPlanApi: new Proxy({}, {
    get: (_t, k) => (...a: unknown[]) => {
      mockAxios('debtPlanApi.' + String(k), ...a);
      return Promise.resolve(k === 'reminder' ? { title: 'Kredit', amount: 250000, currency: 'UZS', due_date: '2026-11-05', paid: false } : {});
    },
  }),
}));
jest.mock('../src/screens/components/TransText', () => ({
  __esModule: true,
  default: (p: any) => {
    const R = require('react');
    const comps = p.components && typeof p.components === 'object' ? Object.keys(p.components).map(k => R.cloneElement(p.components[k], { key: k })) : [];
    return R.createElement('TransText', { tKey: p.tKey, values: p.values }, ...comps);
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
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      { get: (_t, k) => (k === '__esModule' ? true : (p: any) => require('react').createElement('Icon', { name: String(k), size: p?.size, color: p?.color })) },
    ),
);

const NOW = new Date('2026-11-01T07:00:00Z');
const ser = (v: unknown) => JSON.stringify(v, (k, x) => (k === '_owner' || k === '_store' ? undefined : typeof x === 'function' ? '[fn]' : x));
const textOf = (n: any): string => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''));
const outer = (nodes: any[]) => nodes.filter(n => !nodes.includes(n.parent));

// [modul fayli, bola nomi, notification type, qo'shimcha item maydonlari]
const CHILDREN: [string, number, any?][] = [
  ['Qarzdanvozkechilganligitogrisida', 4],
  ['QarzShartnomasiniRasmiylashtirishTogrisida', 0],
  ['Qarzmuddatiuzaytirilganligitogrisida', 16],
  ['QarzToliqQaytarilganli', 1],
  ['Qarzniqaytarishtalabqilinganligitogrisida', 17],
  ['Qarzqismanqaytarilganli', 2],
  ['Qarzmuddatiniuzaytirishsoralganligitogrisida', 3],
  ['Qarzniqaytarishqabulqilinmaganligitogrisida', 9],
  ['QarzniQaytarishQabulQilinganligiTogrisida', 10],
  ['QarzShartnomasiningRadQilinganligiTogrisida', 7],
  ['QarzShartnomasiningQabulQilinganligiTogrisida', 8],
  ['QarzMuddatiniUzaytirishRadEtilganligiTogrisida', 13],
  ['QarzShartnomasiRuxsatSorash', 19],
  ['QarzniQaytarishRadQilinganligi', 22],
  ['QarzShartnomasiRejectTime', 21],
  ['PulMablagOtkazilganligi', 24],
  ['PulMablagOtkazilganligiHaqida', 23],
  ['NewUser', 25],
  ['RecoveryPassword', 26],
  ['QarzniMuddatUzaytirishQabul', 27],
  ['MalumotniKorishgaRadEtildi', 31],
  ['MalumotniKorishgaRuxsatBerildi', 30],
  ['Eslatma', 32],
  ['Expire_Passport', 35],
  ['GapTaklif', 40, { gap_round_id: 5 }],
  ['MoliyaEslatma', 41],
  ['QarzDaftariEslatma', 44, { rem_faoliyat_id: 3, rem_faoliyat_nomi: 'Do‘kon A' }],
  ['ShaxsiyQarzEslatma', 45],
  ['DebtPlanEslatma', 47, { debt_plan_reminder_id: 8 }],
  ['FamilyInviteTaklif', 48, { family_member_id: 9, fm_status: 'pending' }],
  ['Shikoyat', 43, { pc_debt_id: 77, sh_qarz_id: 88, pc_source_name: 'Ali', sh_mijoz: 'Vali' }],
  ['SmsUndelivered', 49, { ud_qarz_id: 66, ud_mijoz: 'Ali' }],
];

const baseItem = (type: number, side: 'creditor' | 'debitor', extra: any = {}) => ({
  id: 900 + type,
  type,
  creditor: 1,
  debitor: 2,
  reciver: side === 'creditor' ? 1 : 2,
  csender: 1,
  creciver: 2,
  contract: 'C1',
  act: 'A1',
  number: 'N-1',
  amount: 1500000,
  currency: 'UZS',
  created: '01.10.2026',
  created_at: '2026-10-01 10:00:00',
  end_date: '2026-12-01',
  token: 12345,
  cuid: '123456/AB',
  duid: '654321/CD',
  ccompany: 'CCO',
  dcompany: 'DCO',
  ctypes: 2,
  dtypes: 2,
  refundable_amount: 500000,
  residual_amount: 1000000,
  inc: 100,
  vos_summa: 50,
  ...extra,
});

const callbackProps = () => {
  const log: string[] = [];
  const cb = (name: string) => (...a: unknown[]) => {
    log.push(`${name}(${ser(a)})`);
  };
  return {
    log,
    props: {
      okay: cb('okay'),
      onSuccess: cb('onSuccess'),
      onReject: cb('onReject'),
      reject: cb('reject'),
      onToliqQaytgan: cb('onToliqQaytgan'),
      onQismanQaytarilgan: cb('onQismanQaytarilgan'),
      onQarzMuddatUzaytirish: cb('onQarzMuddatUzaytirish'),
    },
  };
};

// Eski kodda `navigation` PROP beriladi; yangi kodda tashlab yuboriladi (bola useNavigation ishlatadi). Test ikkalasini ham qabul qiladi.
const withNav = process.env.NC_PASS_NAV === '1';

const render = async (mod: string, item: any, extraProps: any = {}) => {
  const Comp = require(`../src/screens/home/notifications/all/${mod}`).default;
  const cbs = callbackProps();
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<Comp item={item} {...cbs.props} {...(withNav ? { navigation: mockNav } : {})} {...extraProps} />);
  });
  await act(async () => {
    await Promise.resolve();
  });
  return { r, log: cbs.log };
};

const GOLD = path.join(__dirname, 'fixtures', 'notification_children.json');
const GEN = !!process.env.NC_GEN;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  mockState = { HomeReducer: { user: { data: { id: 1, uid: '123456/AB' } }, usd: 12000 } };
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const golden: Record<string, any> = !GEN && fs.existsSync(GOLD) ? JSON.parse(fs.readFileSync(GOLD, 'utf8')) : {};
const rec: Record<string, any> = {};
afterAll(() => {
  if (GEN) fs.writeFileSync(GOLD, JSON.stringify(rec, null, 1));
});

const fingerprint = async (mod: string, item: any, extraProps: any = {}) => {
  const first = await render(mod, item, extraProps);
  const tree = ser(first.r.toJSON());
  const nodes = outer(first.r.root.findAll(n => typeof n.props.onPress === 'function'));
  const actions: any[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    mockNavigate.mockClear();
    mockToast.mockClear();
    mockAxios.mockClear();
    mockOpenCreation.mockClear();
    mockOpenURL.mockClear();
    mockGlobalNavigate.mockClear();
    const { r, log } = await render(mod, item, extraProps);
    const list = outer(r.root.findAll(n => typeof n.props.onPress === 'function'));
    const node = list[i];
    const nodeText = textOf(node).trim().slice(0, 60);
    let threw = false;
    try {
      await act(async () => {
        await node.props.onPress({ nativeEvent: {} });
      });
      await act(async () => {
        await Promise.resolve();
        jest.advanceTimersByTime(3000);
      });
    } catch (e) {
      threw = true;
    }
    actions.push({
      i,
      text: nodeText,
      threw,
      nav: ser(mockNavigate.mock.calls),
      cbs: log,
      axios: ser(mockAxios.mock.calls),
      toast: ser(mockToast.mock.calls),
      creation: ser(mockOpenCreation.mock.calls),
      url: ser(mockOpenURL.mock.calls),
      globalNav: ser(mockGlobalNavigate.mock.calls),
    });
  }
  return { tree, actions };
};

describe.each(CHILDREN.map(c => c[0]))('%s', mod => {
  const [, type, extra] = CHILDREN.find(c => c[0] === mod)!;
  const variants: [string, any, any][] = [
    ['creditor side', baseItem(type, 'creditor', extra), {}],
    ['debitor side', baseItem(type, 'debitor', extra), {}],
  ];
  if (mod === 'MoliyaEslatma') variants.push(['daily', baseItem(46, 'creditor'), { daily: true }]);
  if (mod === 'FamilyInviteTaklif') variants.push(['accepted', baseItem(type, 'debitor', { ...extra, fm_status: 'accepted' }), {}]);
  if (mod === 'Shikoyat') variants.push(['shop 42', baseItem(42, 'creditor', extra), {}]);
  it.each(variants.map(v => v[0]))('%s', async name => {
    const v = variants.find(x => x[0] === name)!;
    const key = `${mod} | ${name}`;
    const fp = await fingerprint(mod, v[1], v[2]);
    if (GEN) rec[key] = fp;
    else expect(fp).toEqual(golden[key]);
  });
});

it('barcha bolalar goldenda bor', () => {
  if (GEN) return;
  const expected = CHILDREN.flatMap(([m]) => ['creditor side', 'debitor side', ...(m === 'MoliyaEslatma' ? ['daily'] : []), ...(m === 'FamilyInviteTaklif' ? ['accepted'] : []), ...(m === 'Shikoyat' ? ['shop 42'] : [])].map(v => `${m} | ${v}`));
  expect(Object.keys(golden).sort()).toEqual(expected.sort());
});
