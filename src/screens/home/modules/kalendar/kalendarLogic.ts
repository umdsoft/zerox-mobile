import { fTime } from '../financeMoney';

export const GREEN = '#16a34a';
export const RED = '#dc2626';
export const CYAN = '#0891b2';
// SS-DEV (2026-09-24): semantik ranglar — berilgan (chiqim) qizil, undirilgan (kirim) yashil.
export const BER_COLOR = RED;
export const UND_COLOR = GREEN;
export const BER_RGB = '220,38,38';
export const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];
export const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export type Kun = { kun: number; berilgan: number; undirilgan: number };

// SS-DEV (2026-09-24): /qarz-daftari/kalendar/kun javobidagi bitta amaliyot.
export type KunAmal = {
  id: number;
  qarz_id: number;
  turi: string; // 'berish' | 'qaytarish' | ...
  summa: number;
  valyuta: string;
  izoh?: string | null;
  vaqt?: string | null;
  mijoz?: string | null;
  telefon?: string | null;
  dokon?: string | null;
  qarz_status?: string | null;
  qoldiq?: number | null;
  /** biz qo'shamiz — hafta ro'yxatida qaysi kun ekani ko'rinsin */
  _date: string;
};

export type Varaq = {
  turi: 'kun' | 'hafta';
  title: string;
  dates: string[];
};

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const dateKey = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;

/**
 * Backend DATETIME ni +05:00 bilan UTC'ga o'girib ("...T11:44:51.000Z") yuboradi —
 * saytdagi kabi LOKAL soat ko'rsatamiz (Date orqali); yaroqsiz bo'lsa satrdan.
 */
export const hhmm = (s?: string | null): string => {
  if (!s) return '';
  const d = new Date(s);
  if (!isNaN(d.getTime())) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return fTime(s);
};
export const ddmm = (key: string) => {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}` : key;
};
