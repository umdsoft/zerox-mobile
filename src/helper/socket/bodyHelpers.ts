import i18next from 'i18next';
import ReturnName from '../returnName';
import { sortText } from '../../screens/components/StatisticCard';

/** Minglik bo'sh joy: 1234567 -> "1 234 567". */
export const spaceDigits = (v: unknown): string => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Shaxs (types === 2) -> to'liq ism, yuridik (types === 1) -> kompaniya, aks holda null. */
const person = (types: number, fullName: () => string, company: string) =>
  types === 2 ? fullName() : types === 1 ? company : null;

/** Qarz oluvchi (debitor) nomi: dtypes bo'yicha, debitor ismi funksiyasi bilan. */
export const debtorName = (item: any) => person(item.dtypes, () => ReturnName.returnDebitorName(item), item.dcompany);
/** dtypes bo'yicha, lekin kreditor ismi funksiyasi bilan (debitor tomoni matnlarida). */
export const debtorSideCreditorName = (item: any) =>
  person(item.dtypes, () => ReturnName.returnCreditorName(item), item.dcompany);
/** Qarz beruvchi (creditor) nomi: ctypes bo'yicha, kreditor ismi funksiyasi bilan. */
export const creditorName = (item: any) =>
  person(item.ctypes, () => ReturnName.returnCreditorName(item), item.ccompany);
/** ctypes bo'yicha, lekin debitor ismi funksiyasi bilan (eski matnda shunday — o'zgartirilmagan). */
export const creditorSideDebtorName = (item: any) =>
  person(item.ctypes, () => ReturnName.returnDebitorName(item), item.ccompany);

/** "summa valyuta" ko'rinishi (sortText bilan). */
export const money = (amount: unknown, currency: string) => sortText(amount as any) + ' ' + currency;

export const tr = (key: string, params: Record<string, unknown> = {}): string => i18next.t(key, params as any) as string;
