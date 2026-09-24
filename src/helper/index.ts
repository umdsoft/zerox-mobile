import { t } from 'i18next';
import type { User, CompanyUser, PersonUser } from '../types';

/**
 * Formats a number with space-separated thousands
 * @param text - Number or string to format
 * @returns Formatted string with spaces every 3 digits
 * @example
 * textInputPlace(1000000) // "1 000 000"
 */
export const textInputPlace = (text: string | number): string => {
  const arr: string[] = [];
  text
    .toString()
    .split('')
    .forEach(item => {
      if (item !== ' ') {
        arr.push(item);
      }
    });

  return arr.join('').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Returns a localized toast message based on type
 * @param type - Message type identifier
 * @returns Localized message string
 */
export const toastMessage = (type: number): string => {
  switch (type) {
    // case 1:
    //   return 'Qabul qilindi.';
    default:
      return t('243');
  }
};

/**
 * Returns the display name for a user based on their type
 * @param item - User object (company or person)
 * @returns Display name string
 */
export const checkningPeople = (item: User): string | undefined => {
  switch (item.dtypes) {
    case 1:
      return (item as CompanyUser).dcompany;
    case 2:
      return ReturnName.returnDebitorName(item as PersonUser);
    default:
      return undefined;
  }
};

/**
 * Formats a date object or string to DD.MM.YYYY format
 * @param text - Date string or Date object
 * @returns Formatted date string in DD.MM.YYYY format
 * @example
 * settingDate('2024-01-15') // "15.01.2024"
 */
export const settingDate = (text: string | Date): string => {
  // SS-DEV (2026-09-24): noto'g'ri/bo'sh qiymatda "NaN.NaN.NaN" qaytmasin.
  const d = parseApiDate(text);
  return d ? fmtDDMMYYYY(d) : '';
};

/**
 * SS-DEV (2026-09-24): backend sanalarini MUSTAHKAM parse qilish.
 *
 * ILDIZ SABAB ("Qarzni qaytarish sanasi: NaN.NaN.NaN"): mobil ro'yxatlar
 * (`/contract/return`, `/contract/report`) sanani `contracts.end_date` dan emas,
 * OXIRGI dalolatnoma (`acts.end_date`, VARCHAR) dan oladi. "Qaytarishni talab
 * qilish" endi `acts` ga type=7 yozuv qo'shadi va unga `end_date: conn.end_date`
 * (JS Date obyekti) yozadi — mysql2 uni "2025-11-09 00:00:00.000" ko'rinishida
 * saqlaydi. Eski `checkDate` esa BARCHA nuqtalarni "-" ga almashtirar edi
 * ("...00:00:00-000") -> Invalid Date -> NaN.NaN.NaN.
 *
 * Qo'llab-quvvatlanadi: Date, ISO ("2025-11-08T19:00:00.000Z"), "YYYY-MM-DD",
 * "YYYY-MM-DD HH:MM:SS[.mmm]", "DD.MM.YYYY", "DD-MM-YYYY". Aks holda null.
 */
export const parseApiDate = (
  value?: string | number | Date | null,
): Date | null => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(value).trim();
  if (!s) return null;

  // "YYYY-MM-DD" yoki "YYYY-MM-DD HH:MM:SS[.mmm]" (probel yoki T bilan, TZ'siz)
  const ymd = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/,
  );
  if (ymd) {
    const d = new Date(
      Number(ymd[1]),
      Number(ymd[2]) - 1,
      Number(ymd[3]),
      Number(ymd[4] || 0),
      Number(ymd[5] || 0),
      Number(ymd[6] || 0),
    );
    return isNaN(d.getTime()) ? null : d;
  }

  // "DD.MM.YYYY" yoki "DD-MM-YYYY"
  const dmy = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO (TZ bilan) va boshqa standart formatlar — avvalgidek `new Date`.
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const fmtDDMMYYYY = (d: Date): string => {
  const yyyy = d.getFullYear();
  let mm: string | number = d.getMonth() + 1; // Months start at 0!
  let dd: string | number = d.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};

/**
 * Converts a date string from one format to DD.MM.YYYY format
 * @param text - Date string to convert
 * @returns Formatted date string in DD.MM.YYYY format ('' if invalid)
 * @example
 * checkDate('15.01.2024') // "15.01.2024"
 */
export const checkDate = (text?: string | null): string => {
  // SS-DEV (2026-09-24): ilgari `split('.').join('-')` ISO/ms-li sanani buzar edi.
  const d = parseApiDate(text);
  return d ? fmtDDMMYYYY(d) : '';
};

// Import ReturnName for backward compatibility
import ReturnName from './returnName';
