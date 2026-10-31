/**
 * Umumiy turlar, konstantalar va kichik yordamchilar (barcha proyeksiya modullari tayanadigan eng quyi qatlam).
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import { normalizeUrl } from './responseCache';
import { tkYmdLoose } from '../helper/date';
import { toFiniteNum } from '../helper/num';
import { OutboxOp } from './types';

// Server JSON'i dinamik — bu modulda ataylab keng tur (faqat shu yerda).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

/** Keshdagi boshqa javob: body + saqlangan vaqti + SHU javobga qo'yiladigan amallar (opsForProjection). */
export interface CachedSource {
  data: Json;
  savedAt: number;
  ops: OutboxOp[];
}

export interface ProjectionCtx {
  /**
   * Joriy aktorning FAOL amallari (pending/syncing/failed/blocked) + asosiy ma'lumotdan KEYIN
   * sinxronlangan `done` amallar (`opsForProjection`), yaratilish tartibida.
   */
  ops: OutboxOp[];
  resolve: (id: number) => number | undefined;
  now: number;
  ownerName?: string;
  /** 24.10: asosiy javob olingan vaqt (yo'q — eng yangi deb olinadi). Qardosh manba bilan solishtirish uchun. */
  baseAt?: number;
  /**
   * 24.10: keshdagi qardosh javob (kalit — normalizeUrl yo'li, masalan `/api/qarz-daftari/mijozlar/20/history`).
   * Yo'q bo'lsa — eski xulq (faqat shu javob qatorlari bo'yicha).
   */
  cached?: (path: string) => CachedSource | null;
}

export const OFFLINE_FAILED = 'offline_failed';
export const EPS = 0.0001;
export const DAY_MS = 86400000;
export const NEAR_WINDOW_DAYS = 30;
export const NEAR_LIMIT = 20;
export const FULL_CLOSE = 1e12;
// backend utils/money.round2 bilan bir xil: EPSILON, NaN/Infinity -> 0.
export const round2 = (n: number): number => (Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : 0);
export const num = toFiniteNum;
export const curKey = (v: unknown): 'uzs' | 'usd' => (v === 'USD' ? 'usd' : 'uzs');
/**
 * Summaga ta'sir qiluvchi amal. `done` — chaqiruvchi faqat asosiy ma'lumot (server/kesh) shu amal
 * sinxronlanishidan OLDIN olingan bo'lsa uzatadi (qayta yuklanguncha yozuv "yo'qolib" qolmasin).
 */
export const isEffective = (op: OutboxOp): boolean => op.status === 'pending' || op.status === 'syncing' || op.status === 'done';
export const iso = (ms: number): string => new Date(ms).toISOString();

/** Ikki id bir obyektmi (temp <-> server xaritasi hisobga olinadi). */
export const sameId = (ctx: ProjectionCtx, a: unknown, b: unknown): boolean => {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x === 0 || y === 0) return false;
  if (x === y) return true;
  const rx = x < 0 ? ctx.resolve(x) : x;
  const ry = y < 0 ? ctx.resolve(y) : y;
  return rx !== undefined && ry !== undefined && rx === ry;
};

/** Server id (temp bo'lsa xaritadan); hal qilinmagan temp — undefined. */
export const serverIdOf = (ctx: ProjectionCtx, id: unknown): number | undefined => {
  const n = Number(id);
  if (!Number.isFinite(n) || n === 0) return undefined;
  return n < 0 ? ctx.resolve(n) : n;
};

/** URL'ning `/qarz-daftari/` dan oldingi qismi (kesh kalitlari shu prefiks bilan: `/api`). */
export const apiPrefix = (url: string): string => {
  const p = normalizeUrl(url).split('?')[0];
  const i = p.indexOf('/qarz-daftari/');
  return i >= 0 ? p.slice(0, i) : '';
};

/**
 * Toshkent (UTC+5) bo'yicha 'YYYY-MM-DD' (backend tkYmd/tkYmdOf bilan bir xil). Zonasiz satr = Toshkent devor
 * vaqti (knexfile '+05:00') -> o'sha kun; 'Z'/ofsetli/son/Date -> oniy vaqt + 5s. Yagona qoida: helper/date.tkYmdLoose.
 */
export const tkYmdOf = (v: unknown): string | null => tkYmdLoose(v);
export const daysBetween = (fromYmd: string, toYmd: string): number =>
  Math.round((Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`)) / DAY_MS);

// ---------------------------------------------------------------------------
// Lokal yozuvlar (amaldan)
// ---------------------------------------------------------------------------
export type QarzCreateOp = Extract<OutboxOp, { kind: 'qarz.create' }>;
export type MijozCreateOp = Extract<OutboxOp, { kind: 'mijoz.create' }>;
export type RepayOp = Extract<OutboxOp, { kind: 'qarz.yopish' | 'mijoz.yopish' | 'qarz.vozKechish' | 'tolov.tolandi' }>;

export const isRepay = (op: OutboxOp): op is RepayOp =>
  op.kind === 'qarz.yopish' || op.kind === 'mijoz.yopish' || op.kind === 'qarz.vozKechish' || op.kind === 'tolov.tolandi';
export const isCreate = (op: OutboxOp): op is QarzCreateOp => op.kind === 'qarz.create';

// ---------------------------------------------------------------------------
// Endpoint proyeksiyalari
// ---------------------------------------------------------------------------
export const qarzCreates = (ctx: ProjectionCtx): QarzCreateOp[] => ctx.ops.filter(isCreate);
export const mijozCreates = (ctx: ProjectionCtx): MijozCreateOp[] =>
  ctx.ops.filter((o): o is MijozCreateOp => o.kind === 'mijoz.create');
export const repays = (ctx: ProjectionCtx): RepayOp[] => ctx.ops.filter(isRepay).filter(isEffective);

export const parseQuery = (url: string): Record<string, string> => {
  const q = normalizeUrl(url).split('?')[1] || '';
  const out: Record<string, string> = {};
  q.split('&').forEach(p => {
    if (!p) return;
    const [k, v = ''] = p.split('=');
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  });
  return out;
};

export const pathOf = (url: string): string => normalizeUrl(url).split('?')[0].replace(/^\/api/, '');

