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
 *
 * 02.10 (mobil hujjat, 2/3/10b/11-band) — sayt bilan PARITET:
 *   - "Muddati oz qolgan" — sayt kabi GET /finance/debts/upcoming?days=7 (o'z + ko'zgu +
 *     do'kon, 100 ta cheklovsiz); endpoint javob bermasa ro'yxatdan hisoblanadi (fallback).
 *     Bosh sahifa bloki va "Barchasini ko'rish" sahifasi AYNAN bitta funksiyadan
 *     (`resolveUpcoming`) foydalanadi — ikkalasida bir xil qarzlar.
 *   - SVOD (sayt utils/debtSummary.js): jami / qaytarilgan / jarayonda / voz kechilgan.
 *   - Yakunlangan qarzlar (tugallangan + voz kechilgan) — berilgan / olingan kesimida.
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

// ───────────────────────── 02.10: sayt bilan paritet ─────────────────────────

/** 02.10: "Muddati oz qolgan" — sayt index.vue `getUpcomingDebts(UPCOMING_DAYS)` bilan bir xil. */
export const FINANCE_UPCOMING_URL = `${URL}/finance/debts/upcoming?days=${UPCOMING_DAYS}`;

export type DebtSide = 'lent' | 'borrowed';
type DebtKindTag = 'own' | 'mirror' | 'shop';

const kindTagOf = (d: any): DebtKindTag => (d?.is_shop_debt ? 'shop' : d?.is_mirror ? 'mirror' : 'own');

/** "Muddati oz qolgan" qatori — endpoint va fallback uchun YAGONA shakl. */
export type UpcomingRow = {
  key: string;
  id: any;
  kind: DebtKindTag;
  type: DebtSide;
  name: string;
  phone: string | null;
  amount: number;
  remaining: number;
  currency: string;
  due_date: string | null;
  left: number | null;
  /** /finance/debts ro'yxatidagi to'liq yozuv (tafsilotga o'tish uchun); topilmasa null. */
  debt: any | null;
};

const findDebt = (all: any[], kind: DebtKindTag, id: any): any | null =>
  all.find(d => kindTagOf(d) === kind && String(d?.id) === String(id)) || null;

/**
 * 02.10 (11-band) — bosh sahifa bloki va "Barchasini ko'rish" sahifasi uchun YAGONA manba.
 * Sayt kabi: backend /finance/debts/upcoming javobi (`data.given|taken`) bo'lsa — o'sha
 * (100 ta cheklovsiz, o'z + ko'zgu + do'kon); bo'lmasa/xato bo'lsa — /finance/debts
 * ro'yxatidan hisoblanadi (`upcomingDebts`). Muddat bo'yicha o'sish tartibida.
 */
export const resolveUpcoming = (payload: any, all: any[], side: 'given' | 'taken'): UpcomingRow[] => {
  const api = payload?.success ? payload?.data?.[side] : undefined;
  if (Array.isArray(api)) {
    return api
      .map((it: any): UpcomingRow => {
        const kind: DebtKindTag = it?.kind === 'shop' || it?.kind === 'mirror' ? it.kind : 'own';
        return {
          key: `${kind}-${it?.id}`,
          id: it?.id,
          kind,
          type: side === 'given' ? 'lent' : 'borrowed',
          name: String(it?.partner_name || '').trim() || '—',
          phone: it?.partner_phone || null,
          amount: num(it?.amount),
          remaining: num(it?.remaining),
          currency: String(it?.currency || 'UZS').toUpperCase(),
          due_date: it?.due_date || null,
          left: Number.isFinite(Number(it?.days_left)) ? Number(it.days_left) : daysLeft(it?.due_date),
          debt: findDebt(all, kind, it?.id),
        };
      })
      .sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
  }
  return upcomingDebts(all, side).map(
    (d): UpcomingRow => ({
      key: `${kindTagOf(d)}-${d?.id}`,
      id: d?.id,
      kind: kindTagOf(d),
      type: isLent(d) ? 'lent' : 'borrowed',
      name: String(d?.source_name || '').trim() || '—',
      phone: d?.phone || d?.shop_phone || null,
      amount: num(d?.amount),
      remaining: num(d?.remaining_amount),
      currency: String(d?.currency || 'UZS').toUpperCase(),
      due_date: d?.due_date || null,
      left: daysLeft(d?.due_date),
      debt: d,
    }),
  );
};

/**
 * "Muddati oz qolgan" qatoridan qayerga o'tish: to'liq yozuv bo'lsa — qarz tafsiloti
 * (ko'zgu — obyekt bilan); o'z qarzim — id bilan; aks holda kontragent guruhi.
 */
export const upcomingTarget = (
  row: UpcomingRow,
  all: any[],
): { screen: string; params: any } | null => {
  if (row.debt) return { screen: 'FinanceDebtDetail', params: debtDetailParams(row.debt) };
  if (row.kind === 'own' && row.id != null) return { screen: 'FinanceDebtDetail', params: { id: row.id } };
  const key = groupKeyOf({
    is_shop_debt: row.kind === 'shop',
    source_name: row.name,
    phone: row.phone,
  });
  const items = all.filter(d => groupKeyOf(d) === key);
  if (!items.length) return null;
  if (items.length === 1) return { screen: 'FinanceDebtDetail', params: debtDetailParams(items[0]) };
  return { screen: 'FinanceDebtGroup', params: { title: row.name, isShop: row.kind === 'shop', items } };
};

const MARKER_RE = /^__(increase|forgive)__/;
const FORGIVE_RE = /^__forgive__/;
const MARKER_INCREASE_RE = /^__increase__/;

/** Ochiq qarz (sayt `isOpenDebt`): active | overdue. */
export const isOpenStatus = (d: any): boolean => d?.status === 'active' || d?.status === 'overdue';

/** Voz kechilgan (tugallangan) qarz — `__forgive__` marker yoki eski izoh (sayt `isForgivenDebt`). */
export const isForgivenDebt = (d: any): boolean => {
  if (!d || d.status !== 'completed') return false;
  const pays: any[] = Array.isArray(d.payments) ? d.payments : [];
  if (pays.some(p => FORGIVE_RE.test(String(p?.notes || '')))) return true;
  return /Kechirilgan|voz kechildi/i.test(String(d.notes || ''));
};

/**
 * Haqiqiy to'lovlar yig'indisi (markerlarsiz), qarz summasidan OSHMAYDI (sayt `paidOfDebt`).
 * Do'kon ko'zgusida `payments` bo'sh — `paid_amount` (miqdor − qoldiq) ishlatiladi.
 */
export const paidOfDebt = (d: any): number => {
  if (!d) return 0;
  const pays: any[] = Array.isArray(d.payments) ? d.payments : [];
  if (pays.length) {
    const sum = pays
      .filter(p => !MARKER_RE.test(String(p?.notes || '')))
      .reduce((s, p) => s + num(p?.amount), 0);
    const total = num(d.amount);
    return total > 0 ? Math.min(sum, total) : sum;
  }
  if (d.paid_amount != null) return num(d.paid_amount);
  if (isForgivenDebt(d)) return 0;
  return Math.max(0, num(d.amount) - num(d.remaining_amount));
};

export type SvodRow = { currency: string; total: number; paid: number; left: number; forgiven: number };
export type DebtSvod = {
  rows: SvodRow[];
  count: number;
  openCount: number;
  closedCount: number;
  forgivenCount: number;
};

const CUR_RANK: Record<string, number> = { UZS: 0, USD: 1 };
const curRank = (c: string) => (CUR_RANK[c] != null ? CUR_RANK[c] : 2);

/**
 * Valyuta kesimidagi SVOD (sayt `summarizeDebts`): jami = `amount`, qaytarilgan = haqiqiy
 * to'lovlar, jarayonda = ochiq qarzlar qoldig'i, voz kechilgan = yopilgandagi to'lanmagan qism.
 * `rows` bo'sh bo'lsa ham bitta UZS qatori qaytadi ("0 UZS").
 */
export const summarizeDebtSvod = (debts: any[]): DebtSvod => {
  const map: Record<string, SvodRow> = {};
  let openCount = 0;
  let closedCount = 0;
  let forgivenCount = 0;
  const list = (debts || []).filter(Boolean);
  for (const d of list) {
    const cur = String(d.currency || 'UZS').toUpperCase();
    const prev = map[cur] || { currency: cur, total: 0, paid: 0, left: 0, forgiven: 0 };
    const total = num(d.amount);
    const paid = paidOfDebt(d);
    const open = isOpenStatus(d);
    const left = open ? num(d.remaining_amount) : 0;
    map[cur] = {
      currency: cur,
      total: prev.total + total,
      paid: prev.paid + paid,
      left: prev.left + left,
      forgiven: prev.forgiven + (open ? 0 : Math.max(0, total - paid - left)),
    };
    if (open) openCount += 1;
    else if (d.status === 'completed') closedCount += 1;
    if (isForgivenDebt(d)) forgivenCount += 1;
  }
  const rows = Object.values(map).sort((a, b) => curRank(a.currency) - curRank(b.currency));
  return {
    rows: rows.length ? rows : [{ currency: 'UZS', total: 0, paid: 0, left: 0, forgiven: 0 }],
    count: list.length,
    openCount,
    closedCount,
    forgivenCount,
  };
};

/** Yakunlangan (tugallangan + voz kechilgan) qarzlar — sayt: status 'completed', tur bo'yicha. */
export const finishedOfSide = (debts: any[], side: DebtSide): any[] =>
  (debts || []).filter(d => d?.type === side && d?.status === 'completed');

/** Svod qatorlaridan UZS / USD jami (bosh sahifa kartalari "0 UZS / 0 USD" formatida). */
export const svodTotals = (svod: DebtSvod): CurSum =>
  svod.rows.reduce(
    (acc: CurSum, r) =>
      r.currency === 'USD' ? { uzs: acc.uzs, usd: acc.usd + r.total } : r.currency === 'UZS'
        ? { uzs: acc.uzs + r.total, usd: acc.usd }
        : acc,
    { uzs: 0, usd: 0 },
  );

/** Yopilgan sana — oxirgi haqiqiy to'lov / voz kechish (qo'shimcha qarz emas); bo'lmasa updated_at. */
export const closedDateOf = (d: any): string | null => {
  const pays: any[] = (Array.isArray(d?.payments) ? d.payments : []).filter(
    (p: any) => !MARKER_INCREASE_RE.test(String(p?.notes || '')),
  );
  let best: string | null = null;
  for (const p of pays) {
    const v = p?.created_at || p?.payment_date;
    if (v && (!best || new Date(String(v).replace(' ', 'T')) > new Date(String(best).replace(' ', 'T')))) best = v;
  }
  return best || d?.updated_at || null;
};

/** Sayt S5 qidiruvi: FISh / telefon / summa (raqamlar) bo'yicha. */
export const matchDebtSearch = (
  q: string,
  name: any,
  phone: any,
  amounts: any[],
): boolean => {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return true;
  const digits = s.replace(/\D/g, '');
  if (String(name || '').toLowerCase().includes(s)) return true;
  if (digits && String(phone || '').replace(/\D/g, '').includes(digits)) return true;
  if (digits && amounts.map(a => String(a ?? '')).join(' ').replace(/\D/g, ' ').includes(digits)) return true;
  return false;
};

/** Qarz yozuvi bo'yicha qidiruv (ro'yxat sahifalari). */
export const debtMatches = (d: any, q: string): boolean =>
  matchDebtSearch(q, d?.source_name, d?.phone || d?.shop_phone, [d?.amount, d?.remaining_amount]);

/** Yuklangan sahifalarni birlashtirish: (tur-id) bo'yicha takrorsiz, created_at kamayish tartibida. */
export const uniqueDebts = (rows: any[]): any[] => {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const d of rows) {
    const k = `${kindTagOf(d)}-${d?.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(d);
  }
  const ts = (d: any) => new Date(String(d?.created_at || '').replace(' ', 'T')).getTime() || 0;
  return out.sort((a, b) => ts(b) - ts(a));
};
