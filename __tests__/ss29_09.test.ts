/**
 * SS-DEV (2026-09-29) — 29.09 mobil hujjatlari: sof (UI'siz) yordamchilar testi.
 *  - qarzSmsTemplates: SMS shablonlari (3-band)
 *  - financeDebtGroups: Shaxsiy qarz bosh sahifasi hisob-kitoblari (4-band)
 *  - ofertaGate: oferta faqat shartnoma amalida (doc2 3-rasm)
 *  - PrivacyConsentNote.splitConsent: maxfiylik siyosati havolasi (doc2 4-rasm)
 */
jest.mock('../src/screens/constants', () => ({ URL: 'https://example.test/api/v1' }));
jest.mock('i18next', () => ({ t: (k: string) => k }));
jest.mock('react-native-toast-message', () => {
  const Toast: any = () => null;
  Toast.show = jest.fn();
  Toast.hide = jest.fn();
  return { __esModule: true, default: Toast };
});

import { buildQarzSmsTemplates, buildSmsUrl } from '../src/screens/home/modules/qarzSmsTemplates';
import {
  completedDebts,
  daysLeft,
  debtsOfKind,
  summarizeDebts,
  upcomingDebts,
} from '../src/screens/home/modules/financeDebtGroups';
import {
  clearPendingOfertaAction,
  guardOferta,
  isOfertaRequiredError,
  needsOferta,
  openOferta,
  runPendingOfertaAction,
  setOfertaOpener,
} from '../src/helper/ofertaGate';

// i18next `t` o'rnini bosuvchi: {{x}} ni almashtiradi.
const tt = (k: string, o?: Record<string, unknown>) =>
  k.replace(/\{\{(\w+)\}\}/g, (_, n) => String(o?.[n] ?? ''));

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
};

describe('qarzSmsTemplates', () => {
  test('berilgan qarz: bir nechta muloyim shablon, do‘kon/summa/ism qo‘yilgan', () => {
    const list = buildQarzSmsTemplates(tt, { turi: 'berish', ism: 'Jamshid', dokon: 'BBJ13', summa: '366 668 UZS' });
    expect(list.length).toBeGreaterThanOrEqual(3);
    list.forEach(m => {
      expect(m).toContain('Assalomu alaykum, Jamshid!');
      expect(m).toContain('Hurmat bilan, BBJ13.');
    });
    expect(list.some(m => m.includes('366 668 UZS'))).toBe(true);
  });

  test('muddati o‘tgan bo‘lsa — birinchi shablon muddat haqida', () => {
    const [first] = buildQarzSmsTemplates(tt, { turi: 'berish', ism: 'A', dokon: 'D', summa: '1 UZS', sana: '01.09.2026', overdue: true });
    expect(first).toContain('01.09.2026');
    expect(first).toContain('o‘tib ketdi');
  });

  test('ism noma’lum — murojaatsiz salom; qarz yo‘q — faqat minnatdorchilik', () => {
    const list = buildQarzSmsTemplates(tt, { turi: 'berish', ism: 'Noma’lum', dokon: 'D', summa: '' });
    expect(list).toHaveLength(1);
    expect(list[0].startsWith('Assalomu alaykum!')).toBe(true);
  });

  test('olingan qarz (biz qarzdor) — boshqa matnlar', () => {
    const list = buildQarzSmsTemplates(tt, { turi: 'olish', ism: 'Ali', dokon: 'D', summa: '5 USD' });
    expect(list[0]).toContain('qarzimizni');
  });

  test('sms: havola — iOS &body, Android ?body, matnsiz — faqat raqam', () => {
    expect(buildSmsUrl('+998 90 123-45-67', 'a b', true)).toBe('sms:+998901234567&body=a%20b');
    expect(buildSmsUrl('+998901234567', 'a b', false)).toBe('sms:+998901234567?body=a%20b');
    expect(buildSmsUrl('+998901234567', undefined, false)).toBe('sms:+998901234567');
  });
});

describe('financeDebtGroups', () => {
  const debts = [
    { id: 1, type: 'lent', status: 'active', currency: 'UZS', amount: 100, remaining_amount: 100, due_date: inDays(-2) },
    { id: 2, type: 'lent', status: 'active', currency: 'USD', amount: 50, remaining_amount: 20, due_date: inDays(3) },
    { id: 3, type: 'borrowed', status: 'overdue', currency: 'UZS', amount: 70, remaining_amount: 70, due_date: inDays(1) },
    { id: 4, type: 'borrowed', status: 'completed', currency: 'UZS', amount: 40, remaining_amount: 0 },
    { id: 5, type: 'lent', status: 'active', currency: 'UZS', amount: 10, remaining_amount: 10, due_date: inDays(30) },
  ];

  test('summarizeDebts — ochiq qoldiqlar valyuta bo‘yicha + muddati o‘tgan svod', () => {
    const s = summarizeDebts(debts);
    expect(s.given).toEqual({ uzs: 110, usd: 20 });
    expect(s.taken).toEqual({ uzs: 70, usd: 0 });
    expect(s.overdueGiven).toEqual({ uzs: 100, usd: 0 });
    expect(s.overdueGivenCount).toBe(1);
    expect(s.overdueTaken).toEqual({ uzs: 0, usd: 0 });
    expect(s.completedCount).toBe(1);
  });

  test('upcomingDebts — 7 kun ichida, muddati o‘tganlar va uzoqlari yo‘q, tartiblangan', () => {
    expect(upcomingDebts(debts, 'given').map(d => d.id)).toEqual([2]);
    expect(upcomingDebts(debts, 'taken').map(d => d.id)).toEqual([3]);
  });

  test('debtsOfKind / completedDebts', () => {
    expect(debtsOfKind(debts, 'given').map(d => d.id).sort()).toEqual([1, 2, 5]);
    expect(debtsOfKind(debts, 'overdue-given').map(d => d.id)).toEqual([1]);
    expect(debtsOfKind(debts, 'upcoming-taken').map(d => d.id)).toEqual([3]);
    expect(completedDebts(debts).map(d => d.id)).toEqual([4]);
  });

  test('daysLeft — bugun 0, buzuq sana null', () => {
    expect(daysLeft(inDays(0))).toBe(0);
    expect(daysLeft('yo‘q')).toBeNull();
  });
});

describe('ofertaGate', () => {
  const identified = { is_active: 1, is_contract: 0 };

  test('needsOferta — faqat identifikatsiyalangan, ofertasiz, xodim emas', () => {
    expect(needsOferta(identified)).toBe(true);
    expect(needsOferta({ is_active: 1, is_contract: 1 })).toBe(false);
    expect(needsOferta({ is_active: 0, is_contract: 0 })).toBe(false);
    expect(needsOferta({ ...identified, is_xodim: true })).toBe(false);
    expect(needsOferta(undefined)).toBe(false);
  });

  test('tasdiqlangan foydalanuvchida amal DARHOL bajariladi', () => {
    const action = jest.fn();
    const open = jest.fn();
    expect(guardOferta({ is_active: 1, is_contract: 1 }, action, open)).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  test('ofertasiz — oyna ochiladi, amal tasdiqlangandan KEYIN bajariladi', () => {
    const action = jest.fn();
    expect(guardOferta(identified, action)).toBe(false);
    expect(action).not.toHaveBeenCalled();
    runPendingOfertaAction();
    expect(action).toHaveBeenCalledTimes(1);
    runPendingOfertaAction(); // bir martalik
    expect(action).toHaveBeenCalledTimes(1);
  });

  test('oyna yopilsa — amal bekor', () => {
    const action = jest.fn();
    guardOferta(identified, action);
    clearPendingOfertaAction();
    runPendingOfertaAction();
    expect(action).not.toHaveBeenCalled();
  });

  test('isOfertaRequiredError — faqat 403 + OFERTA_REQUIRED', () => {
    expect(isOfertaRequiredError({ response: { status: 403, data: { code: 'OFERTA_REQUIRED' } } })).toBe(true);
    expect(isOfertaRequiredError({ response: { status: 403, data: { code: 'FORBIDDEN' } } })).toBe(false);
    expect(isOfertaRequiredError({ response: { status: 500, data: { code: 'OFERTA_REQUIRED' } } })).toBe(false);
    expect(isOfertaRequiredError(undefined)).toBe(false);
  });
});

// 01.10 (mobil hujjat, 4-band): identifikatsiyadan keyin oferta AVTOMATIK ochiladi,
// lekin majburiy emas (yopilsa hech qanday amal bajarilmaydi).
describe('oferta — identifikatsiyadan keyin (01.10)', () => {
  afterEach(() => setOfertaOpener(null));

  test('getMe kechiksa ham (is_active hali 0) — oferta ochilishi kerak', () => {
    expect(needsOferta({ is_active: 1, ...{} })).toBe(true);
    expect(needsOferta({ ...{ is_active: 0, is_contract: 0 }, is_active: 1 })).toBe(true);
    expect(needsOferta({ ...{ is_active: 0, is_contract: 1 }, is_active: 1 })).toBe(false);
    expect(needsOferta({ ...{ is_xodim: true }, is_active: 1 })).toBe(false);
  });

  test('openOferta() amalsiz — oyna ochiladi, yopilsa hech narsa bajarilmaydi', () => {
    const opener = jest.fn();
    setOfertaOpener(opener);
    openOferta();
    expect(opener).toHaveBeenCalledTimes(1);
    expect(() => runPendingOfertaAction()).not.toThrow();
  });

  test('yangi i18n kalitlari 5 tilda bor', () => {
    const keys = [
      'subCell.start.head', 'subCell.start.tail', 'subCell.end.head', 'subCell.end.tail',
      'subCell.left.head', 'subCell.left.tail',
      'Qarz qayd etilganda qarzdorga avtomatik SMS',
      'Iltimos, ofertani tasdiqlash uchun uni oxirigacha o‘qib chiqing.',
      'Iltimos, ommaviy oferta bilan tanishganingizni belgilang.',
    ];
    for (const lang of ['uz', 'ru', 'kr', 'en', 'kaa']) {
      const tr = require(`../src/i18n/new/${lang}.json`).translation;
      for (const k of keys) expect(typeof tr[k]).toBe('string');
    }
  });
});
