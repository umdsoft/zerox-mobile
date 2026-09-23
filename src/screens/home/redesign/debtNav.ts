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
  // MUHIM: `/contract/return` — SAYT (pages/debt-list) aynan shu endpointни ishlatadi.
  // U faqat QOLDIQLI (residual > 0) FAOL qarzlarni qaytaradi — dashboard kartasi
  // (Berilgan/Olingan qarz summasi) bilan TO'LIQ mos keladi. Tugallangan (qoldiq=0) va
  // rad etilgan shartnomalar bu ro'yxatga TUSHMAYDI (ular hisobotga tegishli).
  // Ilgari `/contract/report` ishlatilib, barcha (yoki status-2) shartnomalar chiqib,
  // saytdagi 10 o'rniga 27 ta (tugallanganlar bilan) ko'rinardi.
  // Izlash esa /contract/report/search'da qoladi (server tomon telefon+ism qidiruvi).
  creditor: {
    // "Kreditor qarzdorlik" -> "Olingan qarz" (so'rov bo'yicha).
    title: 'Olingan qarz',
    type: 3,
    person: 'creditor',
    isHave: false,
    url: '/contract/return?type=creditor&page=1&limit=1000&start=0&end=0',
    searchUrl: '/contract/report/search?type=creditor&page=1&limit=500&search=',
    iconType: 3,
  },
  debitor: {
    // "Debitor qarzdorlik" -> "Berilgan qarz" (so'rov bo'yicha).
    title: 'Berilgan qarz',
    type: 1,
    person: 'debitor',
    isHave: false,
    url: '/contract/return?type=debitor&page=1&limit=1000&start=0&end=0',
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
  // "Muddati o'tgan" / "Muddati oz qolgan" — bu MAXSUS sahifalar FAQAT o'sha
  // kategoriyani ko'rsatsin va tablar (Barchasi/oz qolgan/o'tgan) BO'LMASIN
  // (so'rov bo'yicha). `all` uchun esa tablar qoladi.
  ...(initialTab === 'near' || initialTab === 'overdue'
    ? { lockTab: initialTab }
    : null),
  ...(title ? { title } : null),
});
