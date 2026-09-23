/**
 * financeMoney.ts — Shaxsiy moliya moduli uchun pul/sana yordamchilari.
 *
 * MUHIM: backend DECIMAL(18,2) maydonlarni STRING qaytaradi ("1500000.00") —
 * shu sabab har joyda `num()` (Number) bilan parse qilamiz.
 * Formatlash Hermes-xavfsiz (toLocale(uz-UZ) ISHLATILMAYDI — Hermes'da Intl cheklangan);
 * mingtalik ajratgich sof regex bilan.
 */

import { t } from 'i18next';

export const num = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

// "1 500 000 UZS" — to'liq mingtalik (probel) + valyuta kodi.
export const fMoney = (v: any, cur: string = 'UZS'): string => {
  const n = Math.round(num(v));
  const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${s} ${cur}`;
};

// KOMPAKT B/M/K (so'rov: Shaxsiy moliyada barcha summalar Mlrd→B, mln→M, ming→K):
// "68,2 M UZS", "684,2 K UZS", "5,9 B UZS". Kichik summalar (<100 ming) to'liq
// mingtalik: "50 000 UZS". Home-kartadagi (money.ts compactKMB) format bilan izchil.
export const fCompact = (v: any, cur?: string): string => {
  const n = num(v);
  const abs = Math.abs(n);
  const unit = (div: number) =>
    String(Number((n / div).toFixed(1))).replace('.', ',');
  let s: string;
  // So'rov: BARCHA elementlar K/M/B (masalan 53 000→"53 K"). ming-chegara 1e5→1e4
  // (5-xonali sonlar ham K bo'lsin); 1e4 dan kichik (masalan 5 000) to'liq qoladi.
  if (abs >= 1e9) s = `${unit(1e9)} B`;
  else if (abs >= 1e6) s = `${unit(1e6)} M`;
  else if (abs >= 1e4) s = `${unit(1e3)} K`;
  else s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return cur ? `${s} ${cur}` : s;
};

// Qisqa: 1.2M / 350K (grafik o'qi/kompakt joylar uchun).
export const fShort = (v: any, cur?: string): string => {
  const n = num(v);
  let s: string;
  if (Math.abs(n) >= 1_000_000) s = `${(n / 1_000_000).toFixed(1)}M`;
  else if (Math.abs(n) >= 1_000) s = `${Math.round(n / 1_000)}K`;
  else s = String(Math.round(n));
  return cur ? `${s} ${cur}` : s;
};

// Aralash valyutali massivni per-currency qatorlarga: ["300 000 UZS","100 USD"], UZS birinchi.
// Element {currency,total} yoki {currency,amount} bo'lishi mumkin.
export const currencyTotals = (arr: any[]): string[] => {
  const map: Record<string, number> = {};
  (arr || []).forEach(r => {
    const c = r?.currency || 'UZS';
    map[c] = (map[c] || 0) + num(r?.total ?? r?.amount);
  });
  const keys = Object.keys(map).filter(c => map[c] > 0);
  keys.sort((a, b) => (a === 'UZS' ? -1 : b === 'UZS' ? 1 : a.localeCompare(b)));
  return keys.map(c => fMoney(map[c], c));
};

// currencyTotals'ning KOMPAKT varianti (mln/ming/mlrd) — dashboard kartalarida
// katta summalar sig'masligini oldini oladi (so'rov).
export const currencyTotalsCompact = (arr: any[]): string[] => {
  const map: Record<string, number> = {};
  (arr || []).forEach(r => {
    const c = r?.currency || 'UZS';
    map[c] = (map[c] || 0) + num(r?.total ?? r?.amount);
  });
  const keys = Object.keys(map).filter(c => map[c] > 0);
  keys.sort((a, b) => (a === 'UZS' ? -1 : b === 'UZS' ? 1 : a.localeCompare(b)));
  return keys.map(c => fCompact(map[c], c));
};

// Input ko'rsatish: "1500000" -> "1 500 000" (mingtalik). Faqat raqam saqlaydi.
export const amountToDisplay = (raw: any): string => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
export const amountToRaw = (display: any): string =>
  String(display ?? '').replace(/\D/g, '');

// Lokal YYYY-MM-DD (UTC surilishsiz — server bilan bir kun farq qilmasin).
export const localDateKey = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Server DATE ustunlari ("expense_date"/"income_date"/"deadline") mysql2'dan Date obyekti
// -> ISO-TZ sifatida keladi (masalan Toshkent yarim tuni = "...T19:00:00.000Z", ya'ni -5s).
// LOKAL kalendar kunni olish uchun `new Date()` + LOKAL getter ishlatamiz (UZ +5 qurilmada
// to'g'ri kun). Bu web `localDateKey` bilan bir xil yondashuv. Sof "YYYY-MM-DD" ham ishlaydi.
const dateParts = (s?: string): { y: number; mo: number; d: number } | null => {
  if (!s) return null;
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    return { y: dt.getFullYear(), mo: dt.getMonth() + 1, d: dt.getDate() };
  }
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) } : null;
};

// Server DATE'dan LOKAL "YYYY-MM-DD" kalit (guruhlash/sortlash uchun).
/**
 * SS10 ILDIZ FIX (2026-09-15): backend DATE ustunini `timezone:'+05:00'` bilan
 * qaytaradi, ya'ni 2026-09-15 -> "2026-09-14T19:00:00.000Z". ISO satrini REGEX
 * bilan kesib olish (eski usul) UTC+5 da DOIM BIR KUN OLDINGI sanani berardi —
 * xarajat/daromadni tahrirlashda aynan shu ko'rinardi. Ro'yxat esa `dateParts`
 * orqali LOKAL komponentlarni o'qigani uchun to'g'ri ko'rsatardi.
 *
 * Shu bois formalar ham SHU yordamchidan foydalanadi — sanani o'qishning
 * yagona usuli qoladi.
 */
export const parseLocalDate = (s?: string | null): Date | null => {
  const p = dateParts(s || undefined);
  return p ? new Date(p.y, p.mo - 1, p.d) : null;
};

export const dateKeyOf = (s?: string): string => {
  const p = dateParts(s);
  if (!p) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
};

// Siyrak kunlik qatorlarni ({date,total}) to'liq oy seriyasiga yoyadi:
// [{day:1,total:0}, ... {day:daysInMonth,total:X}]. Analytics endpoint faqat pul
// kirgan kunlarni qaytaradi (GROUP BY DATE) — grafik butun oyni ko'rsatishi uchun
// bo'sh kunlarni 0 bilan to'ldiramiz (dashboard buni server tomonda qiladi).
export const fillDailySeries = (
  rows: any[],
  year: number,
  month: number,
): { day: number; total: number }[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const series = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, total: 0 }));
  (rows || []).forEach(r => {
    const p = dateParts(r?.date);
    if (!p) return;
    const idx = Math.min(daysInMonth, Math.max(1, p.d)) - 1;
    series[idx].total += num(r?.total);
  });
  return series;
};

// Sana ko'rsatish DD.MM.YYYY.
export const fDate = (s?: string): string => {
  const p = dateParts(s);
  if (!p) return s ? String(s) : '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(p.d)}.${pad(p.mo)}.${p.y}`;
};

// "4-avgust, 2026" ko'rinishidagi guruh sarlavhasi.
const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];
export const fDateHeader = (s?: string): string => {
  const p = dateParts(s);
  if (!p) return s ? String(s) : '';
  return `${p.d}-${UZ_MONTHS[p.mo - 1]}, ${p.y}`;
};

// Vaqt HH:MM (created_at "YYYY-MM-DD HH:mm:ss" dan).
export const fTime = (s?: string): string => {
  if (!s) return '';
  const m = String(s).match(/[T ](\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
};

// Kategoriya slug -> ko'rsatiladigan nom (uz). Slug xaritada bo'lmasa o'zini qaytaradi.
const CAT_UZ: Record<string, string> = {
  // xarajat kategoriyalari
  oziq_ovqat: 'Oziq-ovqat',
  kommunal: 'Kommunal',
  kredit: 'Kredit',
  ijara: 'Ijara',
  internet_telefon: 'Internet/Telefon',
  kongil_ochar: 'Ko‘ngilochar',
  transport_yoqilgi: 'Transport/Yoqilg‘i',
  soglik: 'Sog‘liq',
  kiyim_xaridlar: 'Kiyim/Xaridlar',
  qarz_ehson: 'Qarz/Ehson',
  boshqalar: 'Boshqalar',
  // daromad kategoriyalari
  salary: 'Oylik',
  business: 'Biznes',
  dividend: 'Dividend',
  deposit_income: 'Omonat foizi',
  rental_income: 'Ijara daromadi',
  gift: 'Sovg‘a',
  other_income: 'Boshqa daromad',
};
export const catLabel = (name?: string): string => {
  if (!name) return t('Boshqa');
  return t(CAT_UZ[name] || name);
};

// To'lov usuli yorlig'i.
export const payLabel = (pm?: string): string => {
  switch (pm) {
    case 'cash':
      return t('Naqd');
    case 'card':
      return t('Karta');
    case 'transfer':
      return t('O‘tkazma');
    default:
      return '';
  }
};

// Yozuv manbasi (source) -> ko'rsatiladigan yorliq (so'rov N13).
export const sourceLabel = (s?: string): string => {
  switch (s) {
    case 'mobile':
      return 'Mobil ilova';
    case 'telegram':
      return 'Telegram';
    case 'web':
      return 'Sayt';
    default:
      return '';
  }
};

// Sog'liq status -> uzbekcha.
export const healthStatusUz = (s?: string): string =>
  ({ excellent: 'A’lo', good: 'Yaxshi', fair: 'O‘rtacha', poor: 'Yomon' } as Record<string, string>)[
    s || 'poor'
  ] || 'Yomon';
