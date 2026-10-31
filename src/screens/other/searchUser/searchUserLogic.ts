import { fmtDmyTk } from '../../../helper/date';
import { rd } from '../../../theme/rd';

// SS-DEV (2026-10-05): qidiruv sahifasi hero ranglari (yo'nalish bo'yicha).
export const ACCENT_GIVE = {
  gradient: ['#2f6fed', '#5a4fe4'] as const,
  solid: rd.color.primary,
  tint: rd.color.primaryTint,
};
export const ACCENT_TAKE = {
  gradient: ['#16a34a', '#0d9488'] as const,
  solid: rd.color.success,
  tint: rd.color.successBg,
};

export function formatDate(date: any) {
  // Date (DatePicker) -> lokal kun; server satr/son -> Toshkent kuni (helper/date.fmtDmyTk).
  return fmtDmyTk(date);
}
