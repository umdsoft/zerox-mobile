/**
 * 10.10: do'kon eslatmasi — hafta kunlari (0 = Yakshanba … 6 = Shanba, backend bilan bir xil).
 * Ekranda dushanbadan boshlab ko'rsatiladi. QarzDaftariEslatma va do'konni tahrirlash kartasi ishlatadi.
 */
export const WEEK: { day: number; key: string }[] = [
  { day: 1, key: 'hafta_du' }, { day: 2, key: 'hafta_se' }, { day: 3, key: 'hafta_ch' }, { day: 4, key: 'hafta_pa' },
  { day: 5, key: 'hafta_ju' }, { day: 6, key: 'hafta_sh' }, { day: 0, key: 'hafta_ya' },
];
const WORKDAYS = [1, 2, 3, 4, 5];

/** Tanlangan kunlar → qisqa yozuv ("Har kuni", "Ish kunlari", "Du, Ch, Ju" ...). */
export function repeatLabel(days: number[], t: (k: string) => string): string {
  const set = new Set(days);
  if (set.size === 7) return t('Har kuni');
  if (set.size === 5 && WORKDAYS.every(d => set.has(d))) return t('Ish kunlari');
  if (set.size === 2 && set.has(6) && set.has(0)) return t('Dam olish kunlari');
  if (!set.size) return t('Kun tanlanmagan');
  return WEEK.filter(w => set.has(w.day)).map(w => t(w.key)).join(', ');
}
