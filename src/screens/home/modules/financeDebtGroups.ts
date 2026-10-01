/**
 * financeDebtGroups.ts — "Shaxsiy qarz" bosh sahifasi va ro'yxat sahifasi uchun
 * SOF (UI'siz) hisob-kitoblar.
 *
 * SS-DEV (2026-09-29, 29.09 hujjat 4-band): bosh sahifa "Qarz shartnomasi" va
 * saytning Shaxsiy qarz sahifasi (pages/finance/debts/index.vue) tartibida:
 *   1) Berilgan qarz | Olingan qarz  (ochiq qarzlar qoldig'i, UZS + USD)
 *   2) Muddati o'tgan — berilgan | olingan (svod)
 *   3) Muddati oz qolgan berilgan / olingan qarzlar
 *   4) Tugallangan shaxsiy qarzlar
 * Kartalar bosilganda ro'yxat ALOHIDA sahifada (FinanceDebtList, `kind` bo'yicha).
 *
 * Manba YAGONA: GET /finance/debts?limit=100 (`data` — o'z qarzlarim +
 * `mirror_debts` — hamkor/do'kon ko'zgu qarzlari). Sarlavha summalari va
 * ro'yxatlar shu bitta massivdan hisoblanadi (SS-DEV 2026-09-24 qoidasi).
 */
import { phoneLast9 } from '../../../helper/phone';
import { URL } from '../../constants';
import { isDebtOpen, isDebtOverdue, num, parseLocalDate } from './financeMoney';

/** Ro'yxat sahifasi turlari (sayt `/finance/debts/list/:kind` bilan bir xil nomlar). */
export type DebtListKind =
  | 'given'
  | 'taken'
  | 'overdue-given'
  | 'overdue-taken'
  | 'upcoming-given'
  | 'upcoming-taken'
  | 'completed';

export const DEBT_KIND_TITLE: Record<DebtListKind, string> = {
  given: 'Berilgan qarz',
  taken: 'Olingan qarz',
  'overdue-given': 'Muddati o‘tgan berilgan qarzlar',
  'overdue-taken': 'Muddati o‘tgan olingan qarzlar',
  'upcoming-given': 'Muddati oz qolgan berilgan qarzlar',
  'upcoming-taken': 'Muddati oz qolgan olingan qarzlar',
  completed: 'Tugallangan shaxsiy qarzlar',
};

/** Yagona manba — bosh sahifa va ro'yxat sahifasi (useFetch keshi ulashiladi). */
export const FINANCE_DEBTS_URL = `${URL}/finance/debts?limit=100`;

/** "Muddati oz qolgan" oynasi — sayt `UPCOMING_DAYS` bilan bir xil. */
export const UPCOMING_DAYS = 7;

/** Backend javobidan (o'z + ko'zgu) yagona massiv. */
export const mergeDebts = (payload: any): any[] => {
  const own: any[] = Array.isArray(payload?.data) ? payload.data : [];
  const mir: any[] = Array.isArray(payload?.mirror_debts) ? payload.mirror_debts : [];
  return [...own, ...mir];
};

/** Yopilgan (tugallangan) qarz: completed/cancelled yoki qoldiq 0. */
export const isDebtClosed = (d: any): boolean =>
  d?.status === 'completed' || d?.status === 'cancelled' || num(d?.remaining_amount) <= 0;

const isLent = (d: any) => d?.type !== 'borrowed';

/** UZS/USD bo'yicha qoldiq yig'indisi. */
export type CurSum = { uzs: number; usd: number };
const sumByCur = (rows: any[]): CurSum =>
  rows.reduce(
    (acc: CurSum, d: any) => {
      const v = num(d?.remaining_amount);
      return String(d?.currency || 'UZS').toUpperCase() === 'USD'
        ? { uzs: acc.uzs, usd: acc.usd + v }
        : { uzs: acc.uzs + v, usd: acc.usd };
    },
    { uzs: 0, usd: 0 },
  );

export type DebtSummary = {
  given: CurSum;
  taken: CurSum;
  overdueGiven: CurSum;
  overdueTaken: CurSum;
  overdueGivenCount: number;
  overdueTakenCount: number;
  completedCount: number;
};

/** Bosh sahifadagi 4 karta + tugallanganlar soni. */
export const summarizeDebts = (debts: any[]): DebtSummary => {
  const open = debts.filter(isDebtOpen);
  const overdue = open.filter(isDebtOverdue);
  const og = overdue.filter(isLent);
  const ot = overdue.filter(d => !isLent(d));
  return {
    given: sumByCur(open.filter(isLent)),
    taken: sumByCur(open.filter(d => !isLent(d))),
    overdueGiven: sumByCur(og),
    overdueTaken: sumByCur(ot),
    overdueGivenCount: og.length,
    overdueTakenCount: ot.length,
    completedCount: debts.filter(isDebtClosed).length,
  };
};

/** Qolgan kunlar (bugun = 0). Sana yo'q/buzuq bo'lsa null. */
export const daysLeft = (due?: string | null, now: Date = new Date()): number | null => {
  const d = parseLocalDate(due || undefined);
  if (!d) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};

/**
 * "Muddati oz qolgan" qatorlari — ochiq, muddati bugundan `days` kun ichida
 * (muddati o'tganlar alohida svodda). Muddat bo'yicha o'sish tartibida.
 */
export const upcomingDebts = (
  debts: any[],
  side: 'given' | 'taken',
  days: number = UPCOMING_DAYS,
  now: Date = new Date(),
): any[] =>
  debts
    .filter(d => isDebtOpen(d) && (side === 'given' ? isLent(d) : !isLent(d)))
    .map(d => ({ d, left: daysLeft(d?.due_date, now) }))
    .filter(x => x.left !== null && (x.left as number) >= 0 && (x.left as number) <= days)
    .sort((a, b) => (a.left as number) - (b.left as number))
    .map(x => x.d);

const touchedAt = (d: any): number =>
  new Date(String(d?.updated_at || d?.created_at || '').replace(' ', 'T')).getTime() || 0;

/** Tugallangan qarzlar — eng oxirgi o'zgarganlari birinchi. */
export const completedDebts = (debts: any[]): any[] =>
  debts
    .filter(isDebtClosed)
    .slice()
    .sort((a, b) => touchedAt(b) - touchedAt(a));

/** `kind` bo'yicha qarzlar (ro'yxat sahifasi). */
export const debtsOfKind = (debts: any[], kind: DebtListKind): any[] => {
  switch (kind) {
    case 'given':
      return debts.filter(d => isLent(d) && isDebtOpen(d));
    case 'taken':
      return debts.filter(d => !isLent(d) && isDebtOpen(d));
    case 'overdue-given':
      return debts.filter(d => isLent(d) && isDebtOverdue(d));
    case 'overdue-taken':
      return debts.filter(d => !isLent(d) && isDebtOverdue(d));
    case 'upcoming-given':
      return upcomingDebts(debts, 'given');
    case 'upcoming-taken':
      return upcomingDebts(debts, 'taken');
    case 'completed':
      return completedDebts(debts);
    default:
      return debts;
  }
};

/**
 * SS2 (2026-09-18): ro'yxat KONTRAGENT bo'yicha guruhlanadi. Kalit: do'kon
 * qarzida do'kon NOMI, jismoniy shaxsda TELEFON (bo'lmasa normallashtirilgan ism).
 */
export const groupKeyOf = (d: any): string => {
  if (d?.is_shop_debt) return `shop:${String(d.source_name || '').trim().toLowerCase()}`;
  const ph = phoneLast9(d?.phone);
  if (ph) return `ph:${ph}`;
  return `nm:${String(d?.source_name || '').trim().toLowerCase()}`;
};

export type DebtGroup = {
  key: string;
  name: string;
  isShop: boolean;
  phone: string | null;
  items: any[];
  byCur: Map<string, number>; // valyuta -> sof qoldiq (berilgan − olingan)
  openAmtByCur: Map<string, number>;
  openRemByCur: Map<string, number>;
  total: number;
  paid: number;
  overdue: boolean;
  allDone: boolean;
};

/** Qarzlar → kontragent guruhlari (FinanceDebts SS2 mantig'i, o'zgarishsiz). */
export const buildDebtGroups = (debts: any[]): DebtGroup[] => {
  const map = new Map<string, DebtGroup>();
  for (const d of debts) {
    const key = groupKeyOf(d);
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        name: d.source_name,
        isShop: !!d.is_shop_debt,
        phone: d.phone || null,
        items: [],
        byCur: new Map(),
        openAmtByCur: new Map(),
        openRemByCur: new Map(),
        total: 0,
        paid: 0,
        overdue: false,
        allDone: true,
      };
      map.set(key, g);
    }
    g.items.push(d);
    const cur = d.currency || 'UZS';
    const rem = num(d.remaining_amount);
    const amt = num(d.amount);
    g.byCur.set(cur, (g.byCur.get(cur) || 0) + (d.type === 'borrowed' ? -rem : rem));
    if (isDebtOpen(d)) {
      g.openAmtByCur.set(cur, (g.openAmtByCur.get(cur) || 0) + amt);
      g.openRemByCur.set(cur, (g.openRemByCur.get(cur) || 0) + rem);
    }
    g.total += amt;
    g.paid += Math.max(amt - rem, 0);
    if (isDebtOverdue(d)) g.overdue = true;
    if (!(d.status === 'completed' || rem <= 0)) g.allDone = false;
  }
  return [...map.values()];
};

/** Qarz tafsilotiga navigatsiya paramlari (ko'zgu qarz obyekt bilan ochiladi). */
export const debtDetailParams = (d: any) => (d?.is_mirror ? { mirror: d } : { id: d?.id });
