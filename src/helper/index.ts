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
  const today = new Date(text);

  const yyyy = today.getFullYear();
  let mm: string | number = today.getMonth() + 1; // Months start at 0!
  let dd: string | number = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};

/**
 * Converts a date string from one format to DD.MM.YYYY format
 * @param text - Date string to convert
 * @returns Formatted date string in DD.MM.YYYY format
 * @example
 * checkDate('15.01.2024') // "15.01.2024"
 */
export const checkDate = (text?: string): string => {
  if (!text) return '';

  const leta = text?.split('.')?.join('-');

  const today = new Date(leta);

  const yyyy = today.getFullYear();
  let mm: string | number = today.getMonth() + 1; // Months start at 0!
  let dd: string | number = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};

// Import ReturnName for backward compatibility
import ReturnName from './returnName';
