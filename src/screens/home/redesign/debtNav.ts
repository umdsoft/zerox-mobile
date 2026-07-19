/**
 * debtNav.ts — Qarzdorlik ro'yxatiga (SearchDebitor ekrani) navigatsiya paramlari.
 *
 * NIMA UCHUN ALOHIDA FAYL: bu paramlar ilgari faqat HomeRedesign ichida edi, endi
 * QarzShartnomasi kartalari ham shu ro'yxatga o'tadi. Ikki joyda nusxa saqlamaslik
 * uchun bitta manbaga chiqarildi (URL/param bir joyda o'zgaradi).
 *
 * SearchDebitor real `/contract/report` endpointidan ro'yxatni yuklaydi va ichida
 * `all | active | near | overdue` filtr tab'lari bor. `initialTab` — qaysi tab
 * ochilgan holda kirish (berilmasa 'all' — eski xatti-harakat o'zgarmaydi).
 */

export type DebtTab = 'all' | 'active' | 'near' | 'overdue';
export type DebtRole = 'debitor' | 'creditor';

export const DEBT_NAV = {
  creditor: {
    title: 'Kreditor qarzdorlik',
    type: 3,
    person: 'creditor',
    isHave: false,
    url: '/contract/report?type=creditor&page=1&limit=1000&status=all&start=0&end=0',
    searchUrl: '/contract/report/search?type=creditor&page=1&limit=500&search=',
    iconType: 3,
  },
  debitor: {
    title: 'Debitor qarzdorlik',
    type: 1,
    person: 'debitor',
    isHave: false,
    url: '/contract/report?type=debitor&page=1&limit=1000&status=all&start=0&end=0',
    searchUrl: '/contract/report/search?type=debitor&page=1&limit=500&search=',
    iconType: 3,
  },
};

/**
 * Ro'yxatga o'tish paramlarini tayyorlaydi.
 *   debtNav('debitor')                       -> barcha debitor qarzlar
 *   debtNav('debitor', 'overdue', 'Muddati…') -> muddati o'tganlar filtri bilan
 * Asl DEBT_NAV obyekti o'zgartirilmaydi (nusxa qaytariladi).
 */
export const debtNav = (role: DebtRole, initialTab: DebtTab = 'all', title?: string) => ({
  ...DEBT_NAV[role],
  initialTab,
  ...(title ? { title } : null),
});
