/**
 * Dashboard (jami / muddati o'tgan) va near-expiration proyeksiyasi.
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import { Turi } from './types';
import { customerDebts, isLocalOnlyCustomer, qarzRowFromOp, repayScope, repaySumma, siblingSrc, withCreates } from './projectionAllocation';
import type { Json, ProjectionCtx, QarzCreateOp } from './projectionBase';
import { EPS, NEAR_LIMIT, NEAR_WINDOW_DAYS, curKey, daysBetween, isCreate, isEffective, isRepay, num, qarzCreates, repays, round2, sameId, tkYmdOf } from './projectionBase';
import { installmentSchedule } from './projectionInstallments';
import { shopScope, touchedCustomers } from './projectionScope';

type Money = { uzs: number; usd: number };
type TuriMoney = Record<Turi, Money>;
const zeroTuri = (): TuriMoney => ({ berish: { uzs: 0, usd: 0 }, olish: { uzs: 0, usd: 0 } });

/** Oddiy qarzning muddati o'tgan qoldig'i (backend: bolib_tolash=0, qaytarish_sanasi < bugun). */
const overdueOf = (r: Json, today: string): number => {
  if (r.status !== 'aktiv' || num(r.bolib_tolash) === 1) return 0;
  const due = tkYmdOf(r.qaytarish_sanasi);
  return due && due < today ? num(r.qoldiq) : 0;
};

/**
 * 24.10: "muddati o'tgan" (daftari) o'zgarishi — yangi oflayn qarzlar va qaytarishlar. Faqat aniqlab
 * bo'ladigan holatlar: mijozning qardosh to'plami keshda (yoki mijoz oflayn yaratilgan). Bo'lib to'lash
 * qarzining muddati o'tgan BO'LAKLARI tarixda yo'q — hisobga olinmaydi.
 */
function overdueDelta(url: string, ctx: ProjectionCtx, inShop: (f: unknown) => boolean): TuriMoney {
  const today = tkYmdOf(ctx.now) as string;
  const delta = zeroTuri();
  const add = (r: Json, sign: number) => {
    const v = overdueOf(r, today);
    if (!v || !inShop(r.savdo_faoliyat_id) || (r.turi !== 'berish' && r.turi !== 'olish')) return;
    delta[r.turi as Turi][curKey(r.valyuta)] += sign * v;
  };
  const scoped = ctx.ops.filter(op => (isCreate(op) ? inShop(op.payload.body.savdo_faoliyat_id) : !isRepay(op) || inShop(op.meta.faoliyatId)));
  const sctx = { ...ctx, ops: scoped };
  const ownCreates = new Set(scoped.filter(isCreate).map(o => o.id));
  touchedCustomers(scoped, [], sctx).forEach(mijozId => {
    const src = siblingSrc(url, sctx, mijozId);
    if (src || isLocalOnlyCustomer(ctx, mijozId)) {
      const set = customerDebts([], src, sctx, mijozId);
      set.rows.forEach(r => add(r, 1));
      set.start.filter(r => !ownCreates.has(r._opId)).forEach(r => add(r, -1));
    } else {
      withCreates([], scoped, sctx, mijozId).forEach(r => add(r, 1));
    }
  });
  return delta;
}

export function projectDashboard(url: string, body: Json, ctx: ProjectionCtx): Json {
  if (!body?.data) return body;
  const inScope = shopScope(url, ctx);
  const delta = zeroTuri();
  let touched = false;
  qarzCreates(ctx)
    .filter(isEffective)
    .forEach(op => {
      const b = op.payload.body;
      if (!inScope(b.savdo_faoliyat_id)) return;
      delta[b.turi][curKey(b.valyuta)] += qarzRowFromOp(op).qoldiq;
      touched = true;
    });
  repays(ctx).forEach(op => {
    if (!inScope(op.meta.faoliyatId)) return;
    const sc = repayScope(op, [], ctx);
    if (!sc.turi) return;
    delta[sc.turi][curKey(sc.valyuta)] -= repaySumma(op);
    touched = true;
  });
  if (!touched) return body;
  const od = overdueDelta(url, ctx, inScope);
  const d = body.data;
  const adj = (src: Json, dd: Money) => ({
    ...(src || {}),
    uzs: round2(Math.max(num(src?.uzs) + dd.uzs, 0)),
    usd: round2(Math.max(num(src?.usd) + dd.usd, 0)),
  });
  const adjOverdue = (m: Json, dd: Money) => (m ? { ...adj(m, dd), daftari: adj(m.daftari, dd) } : m);
  return {
    ...body,
    data: {
      ...d,
      berilgan_qarz: d.berilgan_qarz ? { ...d.berilgan_qarz, daftari: adj(d.berilgan_qarz.daftari, delta.berish) } : d.berilgan_qarz,
      olingan_qarz: d.olingan_qarz ? { ...d.olingan_qarz, daftari: adj(d.olingan_qarz.daftari, delta.olish) } : d.olingan_qarz,
      muddati_otgan_debitor: adjOverdue(d.muddati_otgan_debitor, od.berish),
      muddati_otgan_kreditor: adjOverdue(d.muddati_otgan_kreditor, od.olish),
      _pendingChange: true,
    },
  };
}

/** Yangi oflayn qarzning "muddati yaqin" qatori (backend nearExpiration shakli) yoki null. */
function nearRowOf(op: QarzCreateOp, row: Json, today: string): Json | null {
  const b = op.payload.body;
  const inWin = (ymd: string | null) => {
    if (!ymd) return null;
    const dl = daysBetween(today, ymd);
    return dl >= 0 && dl <= NEAR_WINDOW_DAYS ? dl : null;
  };
  let residual = 0;
  let end: string | null = null;
  if (b.bolib_tolash) {
    installmentSchedule(qarzRowFromOp(op).qoldiq, num(b.oylar_soni), b.berilgan_sana, b.valyuta === 'USD')
      .filter(t => inWin(t.tolov_sanasi) !== null)
      .forEach(t => {
        residual += num(t.summa);
        if (!end || t.tolov_sanasi < end) end = t.tolov_sanasi;
      });
    residual = Math.min(residual, num(row.qoldiq));
  } else if (inWin(tkYmdOf(b.qaytarish_sanasi)) !== null) {
    residual = num(row.qoldiq);
    end = tkYmdOf(b.qaytarish_sanasi);
  }
  if (!end || residual <= EPS) return null;
  return {
    qarz_id: op.tempId,
    mijoz_id: b.mijoz_id,
    turi: b.turi,
    currency: b.valyuta,
    residual_amount: round2(residual),
    end_date: end,
    mijoz_fish: op.meta.fish || '',
    days_left: daysBetween(today, end),
    _offline: op.status,
    _opId: op.id,
  };
}

/**
 * 24.10: "Muddati yaqin" (`/near-expiration`, { debitor, kreditor }): to'liq qaytarilgan qarzlar olib
 * tashlanadi (oddiy qarzda qoldiq yangilanadi), 30 kun ichida muddati keladigan yangi oflayn qarzlar qo'shiladi.
 */
export function projectNearExpiration(url: string, body: Json, ctx: ProjectionCtx): Json {
  const inShop = shopScope(url, ctx);
  const scoped = ctx.ops.filter(op => (isCreate(op) ? inShop(op.payload.body.savdo_faoliyat_id) : !isRepay(op) || inShop(op.meta.faoliyatId)));
  const creates = scoped.filter(isCreate).filter(isEffective);
  const rp = scoped.filter(isRepay).filter(isEffective);
  if (!creates.length && !rp.length) return body;
  const d = body?.data && typeof body.data === 'object' ? body.data : { debitor: [], kreditor: [] };
  const sctx = { ...ctx, ops: scoped };
  const today = tkYmdOf(ctx.now) as string;
  const projected: Json[] = [];
  touchedCustomers(scoped, [], sctx).forEach(mijozId => {
    const src = siblingSrc(url, sctx, mijozId);
    if (src || isLocalOnlyCustomer(ctx, mijozId)) projected.push(...customerDebts([], src, sctx, mijozId).rows);
    else projected.push(...withCreates([], scoped, sctx, mijozId));
  });
  const fix = (list: Json[]): Json[] =>
    (Array.isArray(list) ? list : []).flatMap(r => {
      const p = projected.find(x => sameId(ctx, x.id, r.qarz_id));
      if (!p || !p._pendingChange) return [r];
      if (p.status !== 'aktiv') return [];
      const residual = num(p.bolib_tolash) === 1 ? Math.min(num(r.residual_amount), num(p.qoldiq)) : num(p.qoldiq);
      return [{ ...r, residual_amount: round2(residual), _pendingChange: true }];
    });
  const fresh = creates
    .filter(op => !projected.some(p => sameId(ctx, p.id, op.tempId) && p.status !== 'aktiv'))
    .map(op => nearRowOf(op, projected.find(p => sameId(ctx, p.id, op.tempId)) ?? qarzRowFromOp(op), today))
    .filter((r): r is Json => !!r);
  const merge = (list: Json[], turi: Turi) =>
    [...fix(list), ...fresh.filter(r => r.turi === turi && !(list || []).some((x: Json) => sameId(ctx, x.qarz_id, r.qarz_id)))]
      .sort((a, b) => num(a.days_left) - num(b.days_left))
      .slice(0, NEAR_LIMIT);
  return {
    ...(body || { success: true }),
    data: { ...d, debitor: merge(d.debitor, 'berish'), kreditor: merge(d.kreditor, 'olish'), _pendingChange: true },
  };
}

