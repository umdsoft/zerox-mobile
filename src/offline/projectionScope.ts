/**
 * Do'kon doirasi, qaytarish tegadigan mijozlar va oflayn mijoz sintezi.
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import { OutboxOp } from './types';
import { repayScope } from './projectionAllocation';
import type { Json, MijozCreateOp, ProjectionCtx, RepayOp } from './projectionBase';
import { apiPrefix, isCreate, isEffective, isRepay, iso, parseQuery, sameId } from './projectionBase';

/**
 * 24.10 (do'kon doirasi): `faoliyat_id` bo'lsa — faqat shu do'kon. "Barcha do'konlar" rejimida backend
 * faqat O'Z do'konlarini qaytaradi (xodim bo'lgan begona do'kon qo'shilmaydi) — keshdagi do'konlar
 * ro'yxatidan (`is_xodim_role`) aniqlanadi; ro'yxat keshda yo'q bo'lsa filtr yo'q.
 */
export function shopScope(url: string, ctx: ProjectionCtx): (fid: unknown) => boolean {
  const q = parseQuery(url);
  if (q.faoliyat_id) {
    const fid = Number(q.faoliyat_id);
    return f => Number(f) === fid;
  }
  const list = ctx.cached?.(`${apiPrefix(url)}/qarz-daftari/savdo-faoliyat`)?.data?.data;
  if (!Array.isArray(list) || !list.length) return () => true;
  const own = new Set(list.filter((s: Json) => !s?.is_xodim_role).map((s: Json) => Number(s?.id)));
  return f => f === undefined || f === null || own.has(Number(f));
}

/** Amalning mijozi (server/temp id) — qatorlardan ham qidiriladi. */
export const opMijoz = (op: RepayOp, rows: Json[], ctx: ProjectionCtx): number | undefined => repayScope(op, rows, ctx).mijozId;

/** Amallar tegadigan mijozlar (takrorsiz; temp va server id bir xil hisoblanadi). */
export function touchedCustomers(ops: OutboxOp[], rows: Json[], ctx: ProjectionCtx): number[] {
  const out: number[] = [];
  ops.forEach(op => {
    let m: number | undefined;
    if (isRepay(op) && isEffective(op)) m = opMijoz(op, rows, ctx);
    else if (isCreate(op)) m = Number(op.payload.body.mijoz_id);
    if (m !== undefined && Number.isFinite(m) && !out.some(x => sameId(ctx, x, m))) out.push(m);
  });
  return out;
}

export function synthMijoz(op: MijozCreateOp): Json {
  return {
    id: op.tempId,
    fish: op.payload.fish,
    telefon: op.payload.telefon || null,
    savdo_faoliyat_id: op.payload.faoliyatId,
    savdoFaoliyat: op.meta.faoliyatNomi ? { nomi: op.meta.faoliyatNomi } : null,
    created_at: iso(op.createdAt),
    _offline: op.status,
    _opId: op.id,
  };
}

