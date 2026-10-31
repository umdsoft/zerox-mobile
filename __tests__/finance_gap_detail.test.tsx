/**
 * FinanceGapDetail xarakteristika (render) testlari — SOLID 2-bosqich bo'linishidan OLDIN yozilgan va
 * bo'linishdan keyin O'ZGARMAGAN. Mock'lar faqat chegaralarda: useFetch, financeApi, axios-siz tarmoq,
 * Toast, navigatsiya, i18n, RNBlobUtil, Share, MapPicker, DateField, ikonlar, RdHeader.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockRefresh = jest.fn();
const mockToast = jest.fn();
const mockGoBack = jest.fn();
const mockOpenURL = jest.fn();
const mockShareOpen = jest.fn();
const mockBlobFetch = jest.fn();
const mockExists = jest.fn();
const mockMapProps: { current: any } = { current: null };
let mockG: any = null;

const mockApi = {
  deleteGap: jest.fn(),
  addGapMember: jest.fn(),
  deleteGapMember: jest.fn(),
  shuffleGap: jest.fn(),
  payGap: jest.fn(),
  unpayGap: jest.fn(),
  updateGap: jest.fn(),
  setGapCoOrganizer: jest.fn(),
  removeGapCoOrganizer: jest.fn(),
  setGapRoundVenue: jest.fn(),
  notifyGapRound: jest.fn(),
};

jest.mock('../src/i18n', () => ({ t: (k: string) => k }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n])),
  }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({ params: { id: 7 } }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));
jest.mock('../src/hooks/useFetch', () => ({
  useFetch: () => ({ data: mockG ? { data: mockG } : null, onRefresh: mockRefresh }),
}));
jest.mock('../src/screens/home/modules/financeApi', () => ({ financeApi: new Proxy({}, { get: (_t, k) => (mockApi as any)[k] }) }));
jest.mock('../src/screens/constants', () => ({ URL: 'http://x' }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: (...a: unknown[]) => mockToast(...a) } }));
jest.mock('../src/helper/safeOpenURL', () => ({ safeOpenURL: (...a: unknown[]) => mockOpenURL(...a) }));
jest.mock('react-native-share', () => ({ __esModule: true, default: { open: (...a: unknown[]) => mockShareOpen(...a) } }));
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: { dirs: { CacheDir: '/cache' }, exists: (...a: unknown[]) => mockExists(...a), unlink: jest.fn() },
    config: () => ({ fetch: (...a: unknown[]) => mockBlobFetch(...a) }),
  },
}));
jest.mock('../src/store/api/token/getToken', () => ({ storage: { getString: () => 'tok' } }));
jest.mock('../src/screens/components/Loading', () => ({ __esModule: true, default: () => require('react').createElement('LoadingMock') }));
jest.mock('../src/screens/home/redesign/RdHeader', () => ({
  __esModule: true,
  default: ({ title, right }: any) => {
    const R = require('react');
    const { Text } = require('react-native');
    return R.createElement(R.Fragment, null, R.createElement(Text, null, title), right);
  },
}));
jest.mock('../src/screens/home/modules/financeForm', () => ({ DateField: () => null }));
jest.mock('../src/screens/home/modules/MapPicker', () => ({
  __esModule: true,
  default: (p: any) => {
    mockMapProps.current = p;
    return null;
  },
}));
jest.mock(
  '../src/screens/home/redesign/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, k) => (k === '__esModule' ? true : () => require('react').createElement('Icon', { name: String(k) })),
      },
    ),
);
jest.mock('../src/theme/rd', () => ({
  rd: {
    color: new Proxy({}, { get: () => '#000' }),
    font: new Proxy({}, { get: () => 'F' }),
    radius: new Proxy({}, { get: () => 8 }),
  },
  rs: (n: number) => n,
}));

import FinanceGapDetail from '../src/screens/home/modules/FinanceGapDetail';
import { fMoney } from '../src/screens/home/modules/financeMoney';

const NOW = new Date('2026-11-01T10:00:00Z');
const members = [
  { id: 1, name: 'Ali', phone: '+998901112233', user_id: 100, turn_order: 1 },
  { id: 2, name: 'Vali', phone: '+998909998877', user_id: 200, turn_order: 2 },
  { id: 3, name: 'Sami', phone: '+998905556677', user_id: null, turn_order: 3 },
];
const draftGap = () => ({
  id: 7, name: 'Oila gap', status: 'draft', is_organizer: true, is_primary_organizer: true, organizer_id: 100,
  co_organizer_id: null, my_member_id: 1, amount: '500000', currency: 'UZS', frequency: 'monthly', day_of_month: 5,
  start_date: '2026-11-05', members, rounds: [],
});
const activeGap = (over: any = {}) => ({
  ...draftGap(),
  status: 'active',
  rounds: [
    {
      id: 11, round_no: 1, due_date: '2026-11-05', recipient_name: 'Ali', recipient_member_id: 1, status: 'pending',
      paid_count: 1, total_count: 3, venue: 'Kafe Navo', location: 'https://maps.google.com/?q=41.3,69.2',
      card_number: '8600123456789012', card_holder: 'ALI VALIYEV',
      attendance: { going: ['Vali'], not_going: ['Sami'] },
      payments: [
        { id: 101, payer_name: 'Vali', amount: '500000', currency: 'UZS', status: 'paid', paid_at: '2026-11-01 08:00:00' },
        { id: 102, payer_name: 'Sami', amount: '500000', currency: 'UZS', status: 'pending' },
        { id: 103, payer_name: 'Old', amount: '500000', currency: 'UZS', status: 'paid', paid_at: '2026-10-20 08:00:00' },
      ],
    },
    {
      id: 12, round_no: 2, due_date: '2026-12-05', recipient_name: 'Vali', recipient_member_id: 2, status: 'pending',
      paid_count: 0, total_count: 3, venue: '', card_number: '', payments: [],
    },
  ],
  ...over,
});

const textOf = (n: any): string => n.children.map((c: any) => (typeof c === 'string' ? c : textOf(c))).join('');
const allText = (r: TestRenderer.ReactTestRenderer) => textOf(r.root);
// Eng tashqi mos kelgan tugma (document tartibida birinchi); disabled bo'lsa — bosib bo'lmaydi (undefined).
const outerPress = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) =>
  r.root.findAll(n => typeof n.props.onPress === 'function' && pred(n))[0];
const findPress = (r: TestRenderer.ReactTestRenderer, pred: (n: any) => boolean) => {
  const n = outerPress(r, pred);
  return n && !n.props.disabled ? n : undefined;
};
const byText = (r: TestRenderer.ReactTestRenderer, text: string) => findPress(r, n => textOf(n).trim() === text);
const byLabel = (r: TestRenderer.ReactTestRenderer, label: string) => findPress(r, n => n.props.accessibilityLabel === label);
const byIcon = (r: TestRenderer.ReactTestRenderer, icon: string, nth = 0) =>
  r.root
    .findAll(n => typeof n.props.onPress === 'function' && n.findAll((c: any) => c.type === 'Icon' && c.props.name === icon).length > 0)
    .filter(n => textOf(n).trim() === '')[nth];
const input = (r: TestRenderer.ReactTestRenderer, placeholder: string) =>
  r.root.findAll(n => n.props.placeholder === placeholder && typeof n.props.onChangeText === 'function')[0];
const tap = async (node: any, ...args: unknown[]) => {
  expect(node).toBeDefined();
  await act(async () => {
    await node.props.onPress(...args);
  });
};
const type = async (node: any, v: string) => {
  expect(node).toBeDefined();
  await act(async () => {
    node.props.onChangeText(v);
  });
};
const mount = async (g: any) => {
  mockG = g;
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<FinanceGapDetail />);
  });
  return r;
};
const toasts = () => mockToast.mock.calls.map(c => [c[0].type, c[0].props.desc]);

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  Object.values(mockApi).forEach(f => f.mockReset().mockResolvedValue({ data: {} }));
  mockExists.mockResolvedValue(false);
  mockBlobFetch.mockResolvedValue({ info: () => ({ status: 200 }) });
  mockShareOpen.mockResolvedValue({});
  mockG = null;
});
afterEach(() => jest.useRealTimers());

describe('FinanceGapDetail — yuklanish', () => {
  test('g yo\'q: Loading; keyin yuklansa hook soni o\'zgarmaydi ("Rendered more hooks" yo\'q)', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const r = await mount(null);
    expect(r.root.findAll(n => (n.type as any) === 'LoadingMock').length).toBe(1);
    expect(allText(r)).toContain('Gap');
    mockG = draftGap();
    await act(async () => {
      r.update(<FinanceGapDetail />);
    });
    expect(allText(r)).toContain('Oila gap');
    expect(errSpy.mock.calls.filter(c => /hooks/i.test(String(c[0])))).toEqual([]);
    errSpy.mockRestore();
  });
});

describe('FinanceGapDetail — draft (tashkilotchi)', () => {
  test('matnlar, jami, statuslar va tugmalar', async () => {
    const r = await mount(draftGap());
    const txt = allText(r);
    expect(txt).toContain('Oila gap');
    expect(txt).toContain('Qoralama');
    expect(txt).toContain('3 a‘zo');
    expect(txt).toContain(fMoney('500000', 'UZS'));
    expect(txt).toContain('A‘zolar (3)');
    expect(txt).toContain('Ali');
    expect(txt).toContain('+998909998877'); // ism tagida telefon
    expect(txt).toContain('Tashkilotchi'); // Ali (organizer_id)
    expect(txt).toContain('Gapni boshlash (navbat aniqlanadi)');
    expect(txt).toContain('Gapni o‘chirish');
    expect(txt).toContain('📄 PDF');
    expect(txt).not.toContain('Davralar');
    expect(byText(r, 'Tashkilotchi qilish')).toBeDefined(); // Vali (user_id bor, qo'shimcha yo'q)
    expect(byText(r, '⚙️')).toBeDefined();
  });

  test('tashkilotchi bo\'lmagan a\'zo: boshlash/o\'chirish/qo\'shish/gear yo\'q', async () => {
    const r = await mount({ ...draftGap(), is_organizer: false, is_primary_organizer: false });
    const txt = allText(r);
    expect(txt).not.toContain('Gapni boshlash');
    expect(txt).not.toContain('Gapni o‘chirish');
    expect(txt).not.toContain('A‘zo qo‘shish');
    expect(byText(r, '⚙️')).toBeUndefined();
  });

  test('a\'zolar akkordeoni yopiladi/ochiladi', async () => {
    const r = await mount(draftGap());
    expect(allText(r)).toContain('Vali');
    await tap(findPress(r, n => textOf(n).includes('A‘zolar (3)') && textOf(n).includes('PDF')));
    expect(allText(r)).not.toContain('Vali');
    await tap(findPress(r, n => textOf(n).includes('A‘zolar (3)') && textOf(n).includes('PDF')));
    expect(allText(r)).toContain('Vali');
  });

  test('a\'zo qo\'shish: tekshiruvlar va to\'g\'ri payload', async () => {
    const r = await mount(draftGap());
    await tap(byText(r, 'A‘zo qo‘shish'));
    expect(toasts()).toEqual([['error2', 'Ism kiriting']]);
    await type(input(r, 'Ism'), '  Dilnoza ');
    await tap(byText(r, 'A‘zo qo‘shish'));
    expect(toasts()[1]).toEqual(['error2', 'Telefon raqamini to‘liq kiriting']);
    await type(input(r, '__ ___ __ __'), '93 123 45 67');
    await type(input(r, 'Summa'), '150000');
    expect(mockApi.addGapMember).not.toHaveBeenCalled();
    await tap(byText(r, 'A‘zo qo‘shish'));
    expect(mockApi.addGapMember).toHaveBeenCalledWith(7, { name: 'Dilnoza', phone: '+998931234567', amount: 150000 });
    expect(mockRefresh).toHaveBeenCalledWith({});
    expect(toasts()[2]).toEqual(['omad', 'A‘zo qo‘shildi']);
    expect(input(r, 'Ism').props.value).toBe(''); // forma tozalandi
  });

  test('a\'zo qo\'shish xatosi: server xabari ko\'rsatiladi', async () => {
    mockApi.addGapMember.mockRejectedValue({ response: { data: { message: 'Telefon band' } } });
    const r = await mount(draftGap());
    await type(input(r, 'Ism'), 'X');
    await type(input(r, '__ ___ __ __'), '931234567');
    await tap(byText(r, 'A‘zo qo‘shish'));
    expect(toasts().pop()).toEqual(['error2', 'Telefon band']);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  test('a\'zoni o\'chirish: avval tasdiq oynasi, keyin deleteGapMember', async () => {
    const r = await mount(draftGap());
    await tap(byIcon(r, 'TrashIcon', 0)); // Vali (Ali = my_member_id — savat yo'q)
    expect(allText(r)).toContain('"Vali" haqiqatda ham gapdan o‘chirilsinmi?');
    expect(mockApi.deleteGapMember).not.toHaveBeenCalled();
    await tap(byText(r, 'O‘chirish'));
    expect(mockApi.deleteGapMember).toHaveBeenCalledWith(7, 2);
    expect(toasts()).toContainEqual(['omad', 'A‘zo o‘chirildi']);
    expect(allText(r)).not.toContain('haqiqatda ham gapdan');
  });

  test('boshlash: tasodifiy — bo\'sh body; < 2 a\'zo — xabar', async () => {
    const r = await mount(draftGap());
    await tap(byText(r, 'Gapni boshlash (navbat aniqlanadi)'));
    expect(mockApi.shuffleGap).toHaveBeenCalledWith(7, {});
    expect(toasts()).toContainEqual(['omad', 'Gap boshlandi']);
    mockApi.shuffleGap.mockClear();
    const r2 = await mount({ ...draftGap(), members: [members[0]] });
    await tap(byText(r2, 'Gapni boshlash (navbat aniqlanadi)'));
    expect(mockApi.shuffleGap).not.toHaveBeenCalled();
    expect(toasts().pop()).toEqual(['error2', 'Kamida 2 a‘zo kerak']);
  });

  test('boshlash: qo\'lda tartib — ▼ bosilgach order yuboriladi', async () => {
    const r = await mount(draftGap());
    await tap(byText(r, '✋ O‘zimiz tanlaymiz'));
    expect(outerPress(r, n => textOf(n).trim() === '▲').props.disabled).toBe(true); // 1-qator ▲ o'chirilgan
    await tap(byText(r, '▼')); // Ali pastga
    const txt = allText(r).slice(allText(r).indexOf('A‘zolar (3)'));
    expect([txt.indexOf('Vali'), txt.indexOf('Ali'), txt.indexOf('Sami')]).toEqual(
      [txt.indexOf('Vali'), txt.indexOf('Ali'), txt.indexOf('Sami')].slice().sort((x, y) => x - y),
    ); // ko'rsatish tartibi: Vali, Ali, Sami
    expect(txt.indexOf('Vali')).toBeLessThan(txt.indexOf('Ali'));
    await tap(byText(r, 'Gapni boshlash (navbat aniqlanadi)'));
    expect(mockApi.shuffleGap).toHaveBeenCalledWith(7, { order: [2, 1, 3] });
  });

  test('qo\'shimcha tashkilotchi: tayinlash tasdig\'i -> setGapCoOrganizer', async () => {
    const r = await mount(draftGap());
    await tap(byText(r, 'Tashkilotchi qilish'));
    expect(allText(r)).toContain('"Vali" ham tashkilotchi bo‘ladi');
    await tap(byText(r, 'Tasdiqlash'));
    expect(mockApi.setGapCoOrganizer).toHaveBeenCalledWith(7, 2);
    expect(toasts()).toContainEqual(['omad', 'Tashkilotchi qo‘shildi']);
  });

  test('qo\'shimcha tashkilotchini olib tashlash -> removeGapCoOrganizer', async () => {
    const r = await mount(draftGap().co_organizer_id === null ? { ...draftGap(), co_organizer_id: 200 } : null);
    await tap(byLabel(r, 'Tashkilotchilikni olib tashlash'));
    expect(allText(r)).toContain('"Vali" endi tashkilotchi bo‘lmaydi.');
    await tap(byText(r, 'Olib tashlash'));
    expect(mockApi.removeGapCoOrganizer).toHaveBeenCalledWith(7);
    expect(toasts()).toContainEqual(['omad', 'Tashkilotchilik olib tashlandi']);
  });

  test('sozlamalar: ochiladi, nom bo\'sh bo\'lsa xabar, saqlash -> updateGap payload', async () => {
    const r = await mount(draftGap());
    await tap(byText(r, '⚙️'));
    expect(allText(r)).toContain('⚙️ Gap sozlamalari');
    await type(input(r, 'Gap nomi'), '   ');
    await tap(byText(r, 'Saqlash'));
    expect(toasts()).toEqual([['error2', 'Gap nomini kiriting']]);
    await type(input(r, 'Gap nomi'), ' Yangi nom ');
    await tap(byText(r, 'Har 15 kunda'));
    await tap(byText(r, 'Saqlash'));
    expect(mockApi.updateGap).toHaveBeenCalledWith(7, {
      name: 'Yangi nom', frequency: '15days', day_of_month: 5, start_date: '2026-11-05',
    });
    expect(toasts().pop()).toEqual(['omad', 'Sozlamalar saqlandi']);
    expect(allText(r)).not.toContain('⚙️ Gap sozlamalari');
  });

  test('gapni o\'chirish: tasdiq -> deleteGap, toast, goBack', async () => {
    const r = await mount(draftGap());
    await tap(byText(r, 'Gapni o‘chirish'));
    expect(allText(r)).toContain('"Oila gap" gapini o‘chirasizmi?');
    await tap(byText(r, 'O‘chirish'));
    expect(mockApi.deleteGap).toHaveBeenCalledWith(7);
    expect(toasts()).toContainEqual(['omad', 'O‘chirildi']);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  test('gapni o\'chirish xatosi: goBack chaqirilmaydi, server xabari', async () => {
    mockApi.deleteGap.mockRejectedValue({ response: { data: { message: 'Mumkin emas' } } });
    const r = await mount(draftGap());
    await tap(byText(r, 'Gapni o‘chirish'));
    await tap(byText(r, 'O‘chirish'));
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(toasts().pop()).toEqual(['error2', 'Mumkin emas']);
  });
});

describe('FinanceGapDetail — faol gap (davralar)', () => {
  test('davra sarlavhasi, qabul qiluvchi, progress, sana, statuslar', async () => {
    const r = await mount(activeGap());
    const txt = allText(r);
    expect(txt).toContain('Faol');
    expect(txt).toContain('Davralar');
    expect(txt).toContain('1-davra');
    expect(txt).toContain('05.11.2026');
    expect(txt).toContain('Qabul qiluvchi:');
    expect(txt).toContain('1/3 to‘langan');
    expect(txt).toContain('0/3 to‘langan');
    expect(txt).not.toContain('Gapni boshlash');
    // 1-davra (birinchi yakunlanmagan) OCHIQ: joy, karta, to'lovlar
    expect(txt).toContain('Kafe Navo');
    expect(txt).toContain('Xaritada ochish');
    expect(txt).toContain('8600 1234 5678 9012');
    expect(txt).toContain('ALI VALIYEV');
    expect(txt).toContain('✅ Boradi (1)');
    expect(txt).toContain('❌ Bora olmaydi (1)');
    expect(txt).toContain('✓ To‘langan');
    expect(txt).toContain('To‘landi');
    expect(txt).toContain(fMoney('500000', 'UZS'));
    expect(txt).toContain('📨 Taklif yuborish');
    // 2-davra YOPIQ: undagi "Uchrashuv joyini kiritish" ko'rinmaydi
    expect(txt).not.toContain('Uchrashuv joyini kiritish');
  });

  test('davra ochib-yopiladi', async () => {
    const r = await mount(activeGap());
    await tap(findPress(r, n => textOf(n).includes('2-davra')));
    expect(allText(r)).toContain('Uchrashuv joyini kiritish');
    // MAVJUD XULQ (o'zgartirilmagan): toggleRound `?? false` ishlatadi, standart-ochiq davrani 1-bosish YOPMAYDI
    // (openRounds[k]=true bo'ladi), 2-bosish yopadi.
    await tap(findPress(r, n => textOf(n).includes('1-davra')));
    expect(allText(r)).toContain('Kafe Navo');
    await tap(findPress(r, n => textOf(n).includes('1-davra')));
    expect(allText(r)).not.toContain('Kafe Navo');
  });

  test('yakunlangan davra standart YOPIQ, birinchi yakunlanmagani OCHIQ', async () => {
    const g = activeGap();
    g.rounds[0] = { ...g.rounds[0], status: 'completed' };
    const r = await mount(g);
    expect(allText(r)).not.toContain('Kafe Navo'); // 1-davra yopiq
    expect(allText(r)).toContain('Uchrashuv joyini kiritish'); // 2-davra ochiq
  });

  test('to\'landi -> payGap; xato: qat\'iy matn', async () => {
    const r = await mount(activeGap());
    await tap(byText(r, 'To‘landi'));
    expect(mockApi.payGap).toHaveBeenCalledWith(7, 102);
    expect(toasts()).toContainEqual(['omad', 'To‘lov belgilandi']);
    mockApi.payGap.mockRejectedValue({ response: { data: { message: 'server' } } });
    await tap(byText(r, 'To‘landi'));
    expect(toasts().pop()).toEqual(['error2', 'Xatolik yuz berdi']); // pay: server xabari ishlatilmaydi
  });

  test('bekor qilish: faqat 24 soat ichida; unpayGap', async () => {
    const r = await mount(activeGap());
    const buttons = r.root
      .findAll(n => n.props.accessibilityLabel === 'To‘lov belgisini bekor qilish' && typeof n.props.onPress === 'function')
      .filter(n => n.parent?.props.accessibilityLabel !== 'To‘lov belgisini bekor qilish');
    expect(buttons.length).toBe(1); // 101 (bugun) bor, 103 (12 kun oldin) yo'q
    await tap(buttons[0]);
    expect(mockApi.unpayGap).toHaveBeenCalledWith(7, 101);
    expect(toasts()).toContainEqual(['omad', 'To‘lov bekor qilindi']);
  });

  test('oddiy a\'zo (tashkilotchi emas, qabul qiluvchi ham emas): to\'landi/bekor yo\'q, "Kutilmoqda"', async () => {
    const r = await mount(activeGap({ is_organizer: false, is_primary_organizer: false, my_member_id: 3 }));
    expect(allText(r)).toContain('Kutilmoqda');
    expect(byText(r, 'To‘landi')).toBeUndefined();
    expect(byLabel(r, 'To‘lov belgisini bekor qilish')).toBeUndefined();
    expect(byText(r, '📨 Taklif yuborish')).toBeUndefined();
    expect(byLabel(r, 'Uchrashuv joyini o‘zgartirish')).toBeUndefined();
  });

  test('taklif yuborish -> notifyGapRound; muddati o\'tgan davra: ogohlantirish matni', async () => {
    const r = await mount(activeGap());
    await tap(byText(r, '📨 Taklif yuborish'));
    expect(mockApi.notifyGapRound).toHaveBeenCalledWith(7, 11);
    expect(toasts()).toContainEqual(['omad', 'Yuborildi']);

    jest.setSystemTime(new Date('2026-11-10T10:00:00Z'));
    mockToast.mockClear();
    const r2 = await mount(activeGap());
    expect(byText(r2, '📨 Taklif yuborish')).toBeUndefined();
    await tap(byText(r2, '💳 To‘lov haqida ogohlantirish'));
    expect(toasts()).toContainEqual(['omad', 'Ogohlantirish yuborildi (muddat o‘tgan — ishtirok so‘ralmaydi)']);
  });

  test('taklif: round_expired kodi tushunarli xabar bilan, 5s', async () => {
    mockApi.notifyGapRound.mockRejectedValue({ response: { data: { code: 'round_expired', message: 'x' } } });
    const r = await mount(activeGap());
    await tap(byText(r, '📨 Taklif yuborish'));
    const call = mockToast.mock.calls.pop()![0];
    expect(call.type).toBe('error2');
    expect(call.visibilityTime).toBe(5000);
    expect(call.props.desc).toContain('Bu davraning muddati o‘tgan');
  });

  test('uchrashuv joyi: tahrirlash oynasi, bo\'sh manzil xabari, saqlash payload', async () => {
    const r = await mount(activeGap());
    await tap(byLabel(r, 'Uchrashuv joyini o‘zgartirish'));
    expect(allText(r)).toContain('Uchrashuv joyi');
    const addr = input(r, 'Masalan: Chilonzor, 5-kvartal, kafe');
    expect(addr.props.value).toBe('Kafe Navo');
    await type(addr, '  ');
    await tap(byText(r, 'Saqlash'));
    expect(toasts()).toEqual([['error2', 'Manzilni kiriting']]);
    await type(input(r, 'Masalan: Chilonzor, 5-kvartal, kafe'), ' Yangi joy ');
    await tap(byText(r, 'Saqlash'));
    expect(mockApi.setGapRoundVenue).toHaveBeenCalledWith(7, 11, { venue: 'Yangi joy', location: 'https://maps.google.com/?q=41.3,69.2' });
    expect(toasts().pop()).toEqual(['omad', 'Ma’lumot saqlandi']);
    expect(mockRefresh).toHaveBeenCalledWith({});
  });

  test('xaritadan belgilash: MapPicker onPick lokatsiyani yozadi', async () => {
    const r = await mount(activeGap());
    await tap(byLabel(r, 'Uchrashuv joyini o‘zgartirish'));
    expect(allText(r)).toContain('41.30000, 69.20000');
    await tap(byText(r, 'Xaritada belgilangan — o‘zgartirish'));
    expect(mockMapProps.current.visible).toBe(true);
    expect(mockMapProps.current.initial).toEqual({ lat: 41.3, lng: 69.2 });
    await act(async () => {
      mockMapProps.current.onPick({ lat: 40.1, lng: 65.2 });
    });
    expect(mockMapProps.current.visible).toBe(false);
    await tap(byText(r, 'Saqlash'));
    expect(mockApi.setGapRoundVenue).toHaveBeenCalledWith(7, 11, { venue: 'Kafe Navo', location: 'https://maps.google.com/?q=40.1,65.2' });
  });

  test('plastik karta: tahrirlash oynasi formatlaydi, faqat karta maydonlari yuboriladi', async () => {
    const r = await mount(activeGap());
    await tap(byLabel(r, 'Karta raqamini o‘zgartirish'));
    expect(allText(r)).toContain('💳 Plastik karta raqami');
    await type(input(r, '8600 1234 5678 9012'), '9860123412341234999');
    await tap(byText(r, 'Saqlash'));
    expect(mockApi.setGapRoundVenue).toHaveBeenCalledWith(7, 11, { card_number: '9860 1234 1234 1234', card_holder: 'ALI VALIYEV' });
  });

  test('uchrashuv joyi saqlash xatosi: server xabari', async () => {
    mockApi.setGapRoundVenue.mockRejectedValue({ response: { data: { message: 'Ruxsat yo‘q' } } });
    const r = await mount(activeGap());
    await tap(byLabel(r, 'Uchrashuv joyini o‘zgartirish'));
    await tap(byText(r, 'Saqlash'));
    expect(toasts().pop()).toEqual(['error2', 'Ruxsat yo‘q']);
    expect(allText(r)).toContain('Uchrashuv joyi'); // oyna ochiq qoladi
  });

  test('lokatsiya ochish: https havola o\'zicha, boshqasi maps.google.com ga o\'raladi', async () => {
    const r = await mount(activeGap());
    await tap(byText(r, 'Xaritada ochish'));
    expect(mockOpenURL).toHaveBeenCalledWith('https://maps.google.com/?q=41.3,69.2');
    const g = activeGap();
    g.rounds[0].location = 'Chilonzor 5';
    const r2 = await mount(g);
    await tap(byText(r2, 'Xaritada ochish'));
    expect(mockOpenURL).toHaveBeenLastCalledWith('https://maps.google.com/?q=Chilonzor%205');
  });

  test('PDF: serverdan yuklab, ulashish oynasi; xato: toast', async () => {
    const r = await mount(activeGap());
    await tap(byText(r, '📄 PDF'));
    expect(mockBlobFetch).toHaveBeenCalledWith('GET', 'http://x/finance/gap/7/pdf', { Authorization: 'Bearer tok' });
    expect(mockShareOpen).toHaveBeenCalledWith({ url: 'file:///cache/gap_7.pdf', type: 'application/pdf', title: 'Gap', failOnCancel: false });
    mockBlobFetch.mockResolvedValue({ info: () => ({ status: 500 }) });
    await tap(byText(r, '📄 PDF'));
    expect(toasts().pop()).toEqual(['error2', 'PDF tayyorlanmadi']);
  });

  test('karta raqamini nusxalash tugmasi bor (raqamlar bilan)', async () => {
    const r = await mount(activeGap());
    expect(byLabel(r, 'Karta raqamidan nusxa olish')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Render DARAXTI: bo'linishdan OLDINGI FinanceGapDetail (1324 qatorli) daraxti fixtures/gap_detail_tree.json da qotirilgan
// (har holat uchun JSON.stringify(toJSON()): host elementlar, uslub massivlari, matnlar; funksiya-prop'lar tushib qoladi).
// Qayta yaratish (FAQAT eski komponent nusxasi FinanceGapDetail.orig.tsx bilan): GAP_TREE_GEN=1 npx jest finance_gap_detail
// ---------------------------------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';

const TREE_PATH = path.join(__dirname, 'fixtures', 'gap_detail_tree.json');
const GEN_TREE = !!process.env.GAP_TREE_GEN;

describe('FinanceGapDetail — render daraxti (vizual chiqish o\'zgarmagan)', () => {
  const Comp: React.ComponentType = GEN_TREE
    ? require('../src/screens/home/modules/FinanceGapDetail.orig').default
    : FinanceGapDetail;
  const mountC = async (g: any) => {
    mockG = g;
    let r!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      r = TestRenderer.create(<Comp />);
    });
    return r;
  };
  const states: [string, () => Promise<TestRenderer.ReactTestRenderer>][] = [
    ['loading', () => mountC(null)],
    ['draft organizer', () => mountC(draftGap())],
    ['draft non-organizer', () => mountC({ ...draftGap(), is_organizer: false, is_primary_organizer: false })],
    ['draft manual order', async () => {
      const r = await mountC(draftGap());
      await tap(byText(r, '✋ O‘zimiz tanlaymiz'));
      await tap(byText(r, '▼'));
      return r;
    }],
    ['draft members collapsed', async () => {
      const r = await mountC(draftGap());
      await tap(findPress(r, n => textOf(n).includes('A‘zolar (3)') && textOf(n).includes('PDF')));
      return r;
    }],
    ['draft co-organizer set', () => mountC({ ...draftGap(), co_organizer_id: 200 })],
    ['draft add form filled', async () => {
      const r = await mountC(draftGap());
      await type(input(r, 'Ism'), 'Dilnoza');
      await type(input(r, '__ ___ __ __'), '931234567');
      await type(input(r, 'Summa'), '150000');
      return r;
    }],
    ['active default', () => mountC(activeGap())],
    ['active round 2 opened', async () => {
      const r = await mountC(activeGap());
      await tap(findPress(r, n => textOf(n).includes('2-davra')));
      return r;
    }],
    ['active round 1 closed (2 taps)', async () => {
      const r = await mountC(activeGap());
      await tap(findPress(r, n => textOf(n).includes('1-davra')));
      await tap(findPress(r, n => textOf(n).includes('1-davra')));
      return r;
    }],
    ['active completed first round', () => {
      const g = activeGap();
      g.rounds[0] = { ...g.rounds[0], status: 'completed' };
      return mountC(g);
    }],
    ['active overdue (warning button)', async () => {
      jest.setSystemTime(new Date('2026-11-10T10:00:00Z'));
      return mountC(activeGap());
    }],
    ['active non-organizer', () => mountC(activeGap({ is_organizer: false, is_primary_organizer: false, my_member_id: 3 }))],
    ['active recipient (member 2) sees manage buttons', () => mountC(activeGap({ is_organizer: false, is_primary_organizer: false, my_member_id: 2, rounds: [{ ...activeGap().rounds[1], status: 'pending' }] }))],
    ['modal settings', async () => {
      const r = await mountC(draftGap());
      await tap(byText(r, '⚙️'));
      return r;
    }],
    ['modal settings 15days', async () => {
      const r = await mountC(draftGap());
      await tap(byText(r, '⚙️'));
      await tap(byText(r, 'Har 15 kunda'));
      return r;
    }],
    ['modal venue', async () => {
      const r = await mountC(activeGap());
      await tap(byLabel(r, 'Uchrashuv joyini o‘zgartirish'));
      return r;
    }],
    ['modal card', async () => {
      const r = await mountC(activeGap());
      await tap(byLabel(r, 'Karta raqamini o‘zgartirish'));
      return r;
    }],
    ['modal delete member', async () => {
      const r = await mountC(draftGap());
      await tap(byIcon(r, 'TrashIcon', 0));
      return r;
    }],
    ['modal co-org add', async () => {
      const r = await mountC(draftGap());
      await tap(byText(r, 'Tashkilotchi qilish'));
      return r;
    }],
    ['modal co-org remove', async () => {
      const r = await mountC({ ...draftGap(), co_organizer_id: 200 });
      await tap(byLabel(r, 'Tashkilotchilikni olib tashlash'));
      return r;
    }],
    ['modal delete gap', async () => {
      const r = await mountC(draftGap());
      await tap(byText(r, 'Gapni o‘chirish'));
      return r;
    }],
  ];

  if (GEN_TREE) {
    test('daraxtlarni eski komponentdan yaratish', async () => {
      const out: Record<string, string> = {};
      for (const [name, build] of states) {
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
