import { fmtLocalDate } from '../../../../helper/date';
import { sortMoneyText } from '../../../components/StatisticCard';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
export const BLUE = '#2f6fed'; // berish / berilgan
export const GREEN = '#16a34a'; // olish / olingan
export const RED = '#dc2626'; // muddati o'tgan
export const AMBER = '#f59e0b'; // aktiv

// ---------- Yordamchilar ----------
// SS1a: FAQAT milliarddan oshsa "B" bilan qisqartiramiz (1 000 460 000 -> "1,0 B"),
// aks holda to'liq ko'rinadi (mln/ming qisqartirilmaydi — so'rov shunday).
export const bigMoney = (n: any) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1).replace('.', ',')} B`;
  return sortMoneyText(v) || '0';
};

// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
export const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// ISO/sana → DD.MM.YYYY (pad).
export const fmtDate = (s?: string): string => fmtLocalDate(s);

// Qaytarish muddati BUGUNDAN oldin qolganmi (faqat sana bo'yicha, vaqtsiz).
export const isOverdue = (s?: string): boolean => {
  if (!s) return false;
  const d = new Date(s);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
};

// ---------- Ekran ----------
/**
 * SS-B2 (2026-09-16): summa kartalaridagi shrift MOSLIGI.
 *
 * 🔴 ILDIZ: `adjustsFontSizeToFit` har bir `Text` ni ALOHIDA kichraytiradi.
 * "1 500 000 UZS" tor kartaga sig'may kichrayadi, yonidagi "0 UZS" esa asl
 * o'lchamda qolaveradi — natijada ikki karta har xil shriftda ko'rinardi.
 *
 * Endi o'lcham ENG UZUN satrga qarab BIR MARTA hisoblanadi va ikkala kartaga
 * BIR XIL qo'llanadi (mutanosib kichraytirish, pastki chegara bilan).
 */
/**
 * `fits` — shu uzunlikkacha `base` o'lcham BEMALOL sig'adi; undan oshsa
 * mutanosib kichrayadi (lekin `min` dan past emas).
 *
 * ⚠️ `fits` ni CHAQIRUVCHI beradi: u shriftga BOG'LIQ. Kichik shriftda
 * kartaga ko'proq belgi sig'adi, shu bois bitta qattiq qiymat to'g'ri emas.
 */
export const fitFontSize = (
  maxLen: number,
  base: number,
  min: number,
  fits: number,
): number => {
  if (maxLen <= fits) return base;
  return Math.max(min, Math.round(((base * fits) / maxLen) * 10) / 10);
};

/**
 * 🔴 SS1 (2026-09-20): sahifa HAR MIJOZDA BOSHQACHA ochilardi.
 *
 * Summa kartalarining shrifti `base = 18` dan hisoblanardi va uzunlik 8
 * belgidan oshmaguncha AYNAN 18sp qaytarardi. Natijada:
 *   "12 650 000 UZS" -> 10.3sp (kichik),  "0 UZS" -> 18sp (katta).
 * Ya'ni dizayn foydalanuvchining summasiga qarab o'zgarardi.
 *
 * Endi o'lcham DOIMIY (11sp) — u faqat juda uzun summada (16 belgidan
 * oshganda) kichrayadi, ya'ni amalda hamma mijozda BIR XIL ko'rinadi.
 */
export const SUM_BASE = 11;
export const SUM_MIN = 8.5;
export const SUM_FITS = 16;
