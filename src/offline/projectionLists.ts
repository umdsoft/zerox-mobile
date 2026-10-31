/**
 * Yopish-info va filtrlangan qarzlar ro'yxati proyeksiyasi.
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import { Turi } from './types';
import { applyRepayment, customerDebts, qarzRowFromOp, repayScope, repaySumma, siblingSrc } from './projectionAllocation';
import type { Json, ProjectionCtx } from './projectionBase';
import { DAY_MS, EPS, NEAR_WINDOW_DAYS, OFFLINE_FAILED, isEffective, isRepay, mijozCreates, num, parseQuery, qarzCreates, repays, round2, sameId } from './projectionBase';
import { opMijoz, shopScope, synthMijoz, touchedCustomers } from './projectionScope';

export function projectYopishInfo(url: string, body: Json, ctx: ProjectionCtx, mijozId: number): Json {
  const turi = (parseQuery(url).turi as Turi) || 'berish';
  let data: Json = body?.data;
  if (!data || !data.mijoz) {
    const creator = mijozCreates(ctx).find(op => sameId(ctx, op.tempId, mijozId));
    if (!creator) return body;
    const m = synthMijoz(creator);
    data = { mijoz: { id: m.id, fish: m.fish, telefon: m.telefon, savdo_faoliyat_id: m.savdo_faoliyat_id }, turi, qoldiqlar: [] };
  }
  const creates = qarzCreates(ctx).filter(
    op => isEffective(op) && sameId(ctx, op.payload.body.mijoz_id, mijozId) && op.payload.body.turi === turi,
  );
  const rp = repays(ctx).filter(op => {
    const sc = repayScope(op, [], ctx);
    return sc.mijozId !== undefined && sameId(ctx, sc.mijozId, mijozId) && (!sc.turi || sc.turi === turi);
  });
  if (!creates.length && !rp.length && body?.data?.mijoz) return body;
  const map = new Map<string, { valyuta: string; qoldiq: number; soni: number }>();
  (Array.isArray(data.qoldiqlar) ? data.qoldiqlar : []).forEach((r: Json) =>
    map.set(r.valyuta, { valyuta: r.valyuta, qoldiq: num(r.qoldiq), soni: num(r.soni) }),
  );
  creates.forEach(op => {
    const r = qarzRowFromOp(op);
    const e = map.get(r.valyuta) || { valyuta: r.valyuta, qoldiq: 0, soni: 0 };
    map.set(r.valyuta, { ...e, qoldiq: round2(e.qoldiq + r.qoldiq), soni: e.soni + 1 });
  });
  rp.forEach(op => {
    const sc = repayScope(op, [], ctx);
    const v = sc.valyuta || 'UZS';
    const e = map.get(v);
    if (!e) return;
    map.set(v, { ...e, qoldiq: round2(Math.max(e.qoldiq - repaySumma(op), 0)) });
  });
  const qoldiqlar = Array.from(map.values()).filter(r => r.qoldiq > EPS);
  return { ...(body || {}), success: true, data: { ...data, qoldiqlar, _pendingChange: true } };
}

/** Ro'yxat holat filtriga mosmi (rad etilgan oflayn qarz — har doim ko'rinadi). */
const matchesStatus = (r: Json, status: string | undefined): boolean => {
  if (!status || r.status === OFFLINE_FAILED) return true;
  if (status === 'aktiv' || status === 'muddati-otgan' || status === 'muddati-oz-qolgan') return r.status === 'aktiv';
  return r.status === status;
};

export function projectQarzlar(url: string, body: Json, ctx: ProjectionCtx): Json {
  const q = parseQuery(url);
  const base: Json[] = Array.isArray(body?.data) ? body.data : [];
  const inShop = shopScope(url, ctx);
  const within30 = (ymd: string | null): boolean => {
    if (!ymd) return false;
    const d = new Date(ymd).getTime() - ctx.now;
    return d >= -DAY_MS && d <= NEAR_WINDOW_DAYS * DAY_MS;
  };
  const passes = (r: Json) => (!q.turi || r.turi === q.turi) && inShop(r.savdo_faoliyat_id);
  const added: Json[] = qarzCreates(ctx)
    .filter(op => !base.some(r => sameId(ctx, r.id, op.tempId)))
    .filter(op => {
      const b = op.payload.body;
      if (!passes(b)) return false;
      if (!q.status || q.status === 'aktiv') return true;
      if (q.status === 'muddati-oz-qolgan') return within30(qarzRowFromOp(op).qaytarish_sanasi);
      return false;
    })
    .map(op => {
      const r = qarzRowFromOp(op);
      return {
        ...r,
        mijoz: { id: r.mijoz_id, fish: op.meta.fish || '', telefon: op.meta.telefon || null },
        savdoFaoliyat: { id: r.savdo_faoliyat_id, nomi: op.meta.faoliyatNomi || '' },
      };
    })
    .reverse(); // yangi — tepada (server created_at desc)
  const rp = repays(ctx).filter(op => inShop(op.meta.faoliyatId));
  if (!added.length && !rp.length) return body;

  // 24.10: taqsimot mijozning TO'LIQ to'plami bo'ylab (filtrlangan ro'yxat qatorlari emas).
  let rows: Json[] = [...added, ...base];
  const extra: Json[] = [];
  const closedFilter = q.status === 'yopilgan' || q.status === 'voz_kechilgan';
  const rowsCtx = { ...ctx, ops: ctx.ops.filter(op => !isRepay(op) || inShop(op.meta.faoliyatId)) };
  touchedCustomers(rp, rows, ctx).forEach(mijozId => {
    const primary = rows.filter(r => sameId(ctx, r.mijoz_id, mijozId));
    const src = siblingSrc(url, rowsCtx, mijozId);
    const set = customerDebts(primary, src, rowsCtx, mijozId);
    rows = rows.map(r => {
      if (!sameId(ctx, r.mijoz_id, mijozId)) return r;
      const p = set.rows.find(s => sameId(ctx, s.id, r.id));
      return p && p !== r ? { ...r, qoldiq: p.qoldiq, status: p.status, voz_kechilgan: p.voz_kechilgan ?? r.voz_kechilgan, _pendingChange: p._pendingChange } : r;
    });
    if (closedFilter && src) {
      set.rows
        .filter(s => s._pendingChange && s.status === q.status && passes(s) && !rows.some(r => sameId(ctx, r.id, s.id)))
        .forEach(s =>
          extra.push({
            ...s,
            mijoz: s.mijoz ?? { id: src.mijoz?.id, fish: src.mijoz?.fish || '', telefon: src.mijoz?.telefon ?? null },
            savdoFaoliyat: s.savdoFaoliyat ?? { id: s.savdo_faoliyat_id, nomi: s.savdo_faoliyat_nomi || '' },
          }),
        );
    }
  });
  // Mijozi aniqlanmagan amallar (eski meta) — faqat ro'yxat qatorlari bo'yicha.
  rp.filter(op => opMijoz(op, rows, ctx) === undefined).forEach(op => {
    rows = applyRepayment(rows, op, ctx).rows;
  });
  const out = [...extra, ...rows].filter(r => matchesStatus(r, q.status));
  return { ...(body || { success: true }), data: out };
}

