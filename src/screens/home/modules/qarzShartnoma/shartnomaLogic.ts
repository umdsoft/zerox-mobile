import { fmtUZS, fmtUSD, parseAmount } from '../../../../helper/money';

// Pie/gradient ranglari (literal hex faqat shu yerda ruxsat etilgan).
export const C_JARAYON = '#2f6fed'; // jarayonda — ko'k
export const C_TUGALLANGAN = '#16a34a'; // tugallangan — yashil
export const C_RAD = '#f59e0b'; // rad etildi — sariq/orange
export const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;

export type Row = {
  residual_amount?: number | string;
  amount?: number | string;
  currency?: string;
  end_date?: string;
  creditor_name?: string;
  debitor_name?: string;
  // So'rov SS1: qatorга bosilganда aynan shu qarz kontragenti ochilsin.
  counter_uid?: string;
  counter_type?: number;
};
export type MyData = {
  chart?: { jarayon?: number; tugallangan?: number; rad?: number };
  five?: Row[];
  expired?: Row[];
  data?: Row[];
};

// ---------- Yordamchi ----------
// 01.11 (REFACTOR_DIVERGENCES): ilgari `Number(v || 0)` — 'abc' / '1 234,50' -> NaN va sumCur butunlay NaN bo'lardi.
// Endi satrlar umumiy pul parseri (helper/money.parseAmount) orqali; manfiy belgi saqlanadi; natija har doim CHEKLI.
// Eslatma: '0x10' endi 10 (ilgari 16) — pul maydonida hex yo'q.
export const num = (v: any): number => {
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return 0;
    const n = parseAmount(t, true);
    return t.startsWith('-') && n ? -n : n;
  }
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
};
export const isCur = (r: Row, cur: string) =>
  String(r?.currency || 'UZS').toUpperCase() === cur;
// 01.11: NaN/null qator endi TypeError/NaN bermaydi (num() chekli, `r?.` himoyasi).
export const sumCur = (rows: Row[] | undefined, cur: string) =>
  (rows || []).reduce((s, r) => (isCur(r, cur) ? s + num(r?.residual_amount) : s), 0);

// UZS + USD matni — so'rov bo'yicha "UZS"/"USD" + K/M/B; qarz bo'lmasa ham
// "0 UZS"/"0 USD" DOIM ko'rsatiladi (ikkala qator turadi).
export const money = (uzs: number, usd: number) => [fmtUZS(uzs), fmtUSD(usd)];

// Hisobot ro'yxatiga navigatsiya paramlari (Statistic.tsx bilan bir xil — SearchDebitor real /contract/report endpointidan to'liq ro'yxatni yuklaydi).
export const REPORT_NAV = {
  debitor: {
    title: 'Hisobot (berilgan qarzlar)',
    type: 1,
    person: 'debitor',
    isHave: false,
    report: true,
    url: '/contract/report?type=debitor&page=1&limit=1000&status=all&start=0&end=0',
    searchUrl: '/contract/report/search?type=debitor&page=1&limit=500&search=',
    iconType: 3,
  },
  creditor: {
    title: 'Hisobot (olingan qarzlar)',
    type: 3,
    person: 'creditor',
    isHave: false,
    report: true,
    url: '/contract/report?type=creditor&page=1&limit=1000&status=all&start=0&end=0',
    searchUrl: '/contract/report/search?type=creditor&page=1&limit=500&search=',
    iconType: 3,
  },
};
