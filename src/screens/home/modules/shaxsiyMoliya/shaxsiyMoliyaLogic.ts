import { ArrowDownLeft, ArrowUpRight, BarChartIcon, HomeIcon, IconProps, ShieldIcon, StarIcon, WalletIcon } from '../../redesign/icons';
import { num } from '../financeMoney';

// Dizayn tizimidan tashqari literal ranglar (gradient/bar/kategoriya).
export const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;
export const RED = '#dc2626';
export const GREEN = '#16a34a';
export const BLUE = '#2f6fed';
export const CAT_COLORS = ['#2f6fed', '#22c55e', '#f59e0b', '#e11d48', '#7c3aed', '#0ea5e9'];

export interface MenuItem {
  key: string;
  route: string;
  Icon: (p: IconProps) => JSX.Element;
  accent: string;
  tint: string;
  title: string;
  sub: string;
}

/**
 * img1: menyu — zamonaviy "mahsulot kartalari". Tartib: Rejalashtirilgan to'lovlar/Kutilayotgan daromad → Oila/Gap →
 * Maqsadlar/Tahlil → Qarzdan chiqish. "Чёрная касса" — ATAMA (tarjima qilinmaydi).
 */
export const buildMenu = (t: (k: string) => string): MenuItem[] => [
  { key: 'sched_pay', route: 'FinanceScheduledPayments', Icon: ArrowDownLeft, accent: RED, tint: '#fdeeee', title: t('Rejalashtirilgan to‘lovlar'), sub: t('Kelgusi to‘lovlar') },
  { key: 'sched_inc', route: 'FinanceScheduledIncomes', Icon: ArrowUpRight, accent: GREEN, tint: '#e9f7ef', title: t('Kutilayotgan daromad'), sub: t('Kelgusi daromad') },
  { key: 'family', route: 'FinanceFamily', Icon: HomeIcon, accent: '#db2777', tint: '#fce8f2', title: t('Oila moliyasi'), sub: t('Oila budjeti') },
  { key: 'gap', route: 'FinanceGap', Icon: WalletIcon, accent: '#0d9488', tint: '#d8f5f0', title: t('Gap'), sub: 'Чёрная касса' },
  { key: 'goals', route: 'FinanceGoalList', Icon: StarIcon, accent: '#7c3aed', tint: '#f4efff', title: t('Maqsadlar'), sub: t('Jamg‘arma') },
  { key: 'analytics', route: 'FinanceAnalytics', Icon: BarChartIcon, accent: '#4f46e5', tint: '#eef0fe', title: t('Tahlil'), sub: t('Daromad va xarajat') },
  // 22.10: "Qarzdan chiqish" — qarz to'lash rejasi (7-plitka, to'liq kenglikda).
  { key: 'debt_plan', route: 'DebtPlan', Icon: ShieldIcon, accent: '#059669', tint: '#e8f8f1', title: t('Qarzdan chiqish'), sub: t('Qarz, kredit va muddatli to‘lovlar rejasi') },
];

/** So'nggi amaliyotlar: daromad(+) + xarajat(−), sana bo'yicha kamayish (teng bo'lsa created_at bo'yicha), 8 tagacha. */
export const mergeRecent = (incomes: any, expenses: any): any[] => {
  const inc = (incomes?.recent || []).map((r: any) => ({ ...r, _kind: 'income', _date: r?.income_date }));
  const exp = (expenses?.recent || []).map((r: any) => ({ ...r, _kind: 'expense', _date: r?.expense_date }));
  return [...inc, ...exp]
    .sort((a, b) => {
      const dd = new Date(b?._date || 0).getTime() - new Date(a?._date || 0).getTime();
      if (dd !== 0) return dd;
      return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
    })
    .slice(0, 8);
};

/** SS2: "Qoldiq" — UMUMIY balans; backend `balance` bermasa, joriy oy sofiga qaytamiz. */
export const readBalance = (d: any): number =>
  d?.balance != null
    ? num(d?.balance)
    : num(d?.incomes?.monthly_total_uzs) - num(d?.expenses?.monthly_total_uzs);

const hasFlow = (rows: any[]) => (rows || []).some((x: any) => num(x?.income) > 0 || num(x?.expense) > 0);
/** Pul oqimi grafigi faqat kunlik yoki oylik qatorlarda nolmas qiymat bo'lsa ko'rsatiladi. */
export const hasFlowData = (d: any): boolean => hasFlow(d?.daily_series) || hasFlow(d?.monthly_series);
