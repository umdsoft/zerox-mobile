import { phoneDigits9 } from '../../../../helper/phone';
import { rd } from '../../../../theme/rd';
import { EyeIcon, ShieldIcon } from '../../redesign/icons';
import { familyInitials, FamilyInfo } from '../FinanceFamilySections';

export const BLUE = rd.color.primary;
export const GREEN = '#16a34a';
export const RED = '#dc2626';

export const WATCH_ACCENT = rd.color.primary;
export const WATCH_TINT = rd.color.primaryTint;
export const WATCHER_ACCENT = '#7c3aed';
export const WATCHER_TINT = '#f1eafe';

export const MEMBER_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#ef4444', '#64748b'];
export const memberColor = (i: number) => MEMBER_COLORS[i % MEMBER_COLORS.length];

export const initials = familyInitials; // 21.10: yagona manba (FinanceFamilySections)

// SS-AUDIT (2026-09-25): helper/phone.phoneDigits9 (yagona manba).
export const fmtPhone = phoneDigits9;

// So'rov N8: ruxsatlar (sayt kabi) — qaysi bo'lim + qanday (to'liq/summa) ko'rinadi.
export const DEFAULT_PERMS = {
  income: { view: true, detail: 'full' },
  expense: { view: true, detail: 'full' },
  scheduled_income: { view: false, detail: 'summary' },
  scheduled_payment: { view: false, detail: 'summary' },
  goals: { view: false, detail: 'summary' },
  set_limit: false,
};

export const personName = (it: any) => it.other_name || it.member_name || it.owner_name || 'Foydalanuvchi';

/** as_target aloqasidagi `permissions` (JSON satr yoki obyekt) -> ruxsatlar holati (yaroqsiz bo'lsa standart). */
export const parsePermissions = (it: any) => {
  let cur: any = it?.permissions;
  if (typeof cur === 'string') { try { cur = JSON.parse(cur); } catch { cur = null; } }
  return { ...DEFAULT_PERMS, ...(cur && typeof cur === 'object' ? cur : {}) };
};

/** 21.10: "i" izohlari (backend semantikasi: watched — siz a'zoni ko'rasiz; watcher — u sizni). */
export const buildFamilyInfos = (t: (k: string) => string): { watchInfo: FamilyInfo; watcherInfo: FamilyInfo } => ({
watchInfo: {
  accent: WATCH_ACCENT,
  tint: WATCH_TINT,
  Icon: EyeIcon,
  title: t('Men kuzatayotganlar'),
  lead: t('Bu yerda siz moliyasini kuzatayotgan oila a’zolari ko‘rsatiladi.'),
  points: [
    t('A’zo taklifingizni qabul qilgach, uning daromad, xarajat va boshqa bo‘limlarini ko‘ra olasiz.'),
    t('Ma’lumotlar faqat ko‘rish uchun — siz ularni o‘zgartira olmaysiz.'),
    t('Nimalarni ko‘rishingizni a’zoning o‘zi belgilaydi. Ruxsat bersa, unga oylik limit ham qo‘ya olasiz.'),
  ],
},
watcherInfo: {
  accent: WATCHER_ACCENT,
  tint: WATCHER_TINT,
  Icon: ShieldIcon,
  title: t('Meni kuzatayotganlar'),
  lead: t('Bu yerda sizning daromad va xarajatlaringizni ko‘ra oladigan odamlar ko‘rsatiladi.'),
  points: [
    t('Ular nimani ko‘rishini siz belgilaysiz — qalamcha tugmasi orqali ruxsatlarni o‘zgartiring.'),
    t('Ular ma’lumotlaringizni faqat ko‘radi, o‘zgartira olmaydi.'),
    t('Kirish huquqini istalgan vaqtda bekor qilishingiz mumkin — aloqani uzing.'),
  ],
},
});
