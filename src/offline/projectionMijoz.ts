/**
 * Mijozlar ro'yxati va mijoz tarixi proyeksiyasi.
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import { Turi } from './types';
import { applyRepayment, customerDebts, isLocalOnlyCustomer, qarzRowFromOp, repayScope, repaySumma, siblingSrc, txRowFromRepay, txRowsFromCreate } from './projectionAllocation';
import type { Json, ProjectionCtx } from './projectionBase';
import { EPS, curKey, isEffective, mijozCreates, num, parseQuery, qarzCreates, repays, round2, sameId } from './projectionBase';
import { txsOnlyNew } from './projectionDebt';
import { synthMijoz } from './projectionScope';
import { computeHistoryStats } from './projectionStats';

export function projectMijozlar(url: string, body: Json, ctx: ProjectionCtx, fid: number): Json {
  const q = parseQuery(url);
  const turi = q.turi as Turi | undefined;
  const base: Json[] = Array.isArray(body?.data) ? body.data : [];
  const year = new Date(ctx.now).getFullYear();
  const added: Json[] = mijozCreates(ctx)
    .filter(op => Number(op.payload.faoliyatId) === fid)
    .filter(op => !base.some(r => sameId(ctx, r.id, op.tempId)))
    .map(op => ({
      ...synthMijoz(op),
      qarz_soni: 0,
      aktiv_qarz_soni: 0,
      qoldiq_uzs: 0,
      qoldiq_usd: 0,
      jami_uzs: 0,
      jami_usd: 0,
      undirilgan_uzs: 0,
      undirilgan_usd: 0,
    }));
  if (!added.length && !qarzCreates(ctx).length && !repays(ctx).length) return body;

  const rows: Json[] = [...added, ...base].map(r => ({ ...r }));
  const find = (id: unknown) => rows.find(r => sameId(ctx, r.id, id));

  qarzCreates(ctx).forEach(op => {
    const b = op.payload.body;
    if (Number(b.savdo_faoliyat_id) !== fid || (turi && b.turi !== turi)) return;
    const r = find(b.mijoz_id);
    if (!r) return;
    r._pendingChange = true;
    if (!isEffective(op)) return;
    const c = curKey(b.valyuta);
    const qr = qarzRowFromOp(op);
    r.qarz_soni = num(r.qarz_soni) + 1;
    r.aktiv_qarz_soni = num(r.aktiv_qarz_soni) + 1;
    r[`qoldiq_${c}`] = round2(num(r[`qoldiq_${c}`]) + qr.qoldiq);
    if (new Date(b.berilgan_sana).getFullYear() === year) r[`jami_${c}`] = round2(num(r[`jami_${c}`]) + qr.miqdor);
    if (qr.boshlangich_tolov > 0) r[`undirilgan_${c}`] = round2(num(r[`undirilgan_${c}`]) + qr.boshlangich_tolov);
  });

  const repaid = new Set<Json>();
  repays(ctx).forEach(op => {
    const sc = repayScope(op, [], ctx);
    if (sc.mijozId === undefined || (turi && sc.turi && sc.turi !== turi)) return;
    const r = find(sc.mijozId);
    if (!r) return;
    const c = curKey(sc.valyuta);
    const s = repaySumma(op);
    const before = num(r[`qoldiq_${c}`]);
    const paid = Math.min(s, before);
    r[`qoldiq_${c}`] = round2(Math.max(before - s, 0));
    if (op.kind !== 'qarz.vozKechish') r[`undirilgan_${c}`] = round2(num(r[`undirilgan_${c}`]) + paid);
    r._pendingChange = true;
    repaid.add(r);
  });

  // 24.10: to'liq yopilgan qarzlar aktiv sonidan ayriladi (qardosh to'plam bo'lsa — aniq; bo'lmasa
  // qoldiq ikkala valyutada 0 bo'lsa — 0).
  repaid.forEach(r => {
    const src = siblingSrc(url, ctx, r.id);
    if (src || isLocalOnlyCustomer(ctx, r.id)) {
      const set = customerDebts([], src, ctx, r.id);
      const inScope = (d: Json) => Number(d.savdo_faoliyat_id) === fid && (!turi || d.turi === turi);
      const closedNow = set.rows.filter(
        d => inScope(d) && d.status !== 'aktiv' && set.start.some(s => s.status === 'aktiv' && sameId(ctx, s.id, d.id)),
      ).length;
      r.aktiv_qarz_soni = Math.max(num(r.aktiv_qarz_soni) - closedNow, 0);
    } else if (num(r.qoldiq_uzs) <= EPS && num(r.qoldiq_usd) <= EPS) {
      r.aktiv_qarz_soni = 0;
    }
  });
  return { ...(body || { success: true }), data: rows };
}

export function projectHistory(body: Json, ctx: ProjectionCtx, mijozId: number): Json {
  let data: Json = body?.data;
  if (!data || !data.mijoz) {
    const creator = mijozCreates(ctx).find(op => sameId(ctx, op.tempId, mijozId));
    if (!creator) return body;
    data = { mijoz: synthMijoz(creator), stats: computeHistoryStats([], []), qarzlar: [], tranzaksiyalar: [] };
  }
  const synthesized = !body?.data?.mijoz;
  const creates = qarzCreates(ctx).filter(op => sameId(ctx, op.payload.body.mijoz_id, mijozId));
  const rp = repays(ctx);
  if (!creates.length && !rp.length && !synthesized) return body;

  let changed = synthesized;
  let qarzlar: Json[] = Array.isArray(data.qarzlar) ? data.qarzlar.slice() : [];
  let txs: Json[] = Array.isArray(data.tranzaksiyalar) ? data.tranzaksiyalar.slice() : [];
  creates.forEach(op => {
    if (qarzlar.some(q => sameId(ctx, q.id, op.tempId))) return;
    qarzlar = [qarzRowFromOp(op), ...qarzlar];
    txs = [...txsOnlyNew(txRowsFromCreate(op), txs), ...txs];
    changed = true;
  });
  // Bu mijozga tegishli qaytarishlar (tarixning o'zi — to'liq qardosh to'plam)
  rp.forEach(op => {
    const sc = repayScope(op, qarzlar, ctx);
    const belongs =
      sc.mijozId !== undefined
        ? sameId(ctx, sc.mijozId, mijozId)
        : qarzlar.some(q => sameId(ctx, q.id, (op.payload as { qarzId?: number }).qarzId));
    if (!belongs) return;
    const { rows, anchor } = applyRepayment(qarzlar, op, ctx);
    qarzlar = rows;
    txs = [txRowFromRepay(op, anchor), ...txs];
    changed = true;
  });
  if (!changed) return body;
  return {
    ...(body || { success: true }),
    success: true,
    data: {
      ...data,
      qarzlar,
      tranzaksiyalar: txs,
      stats: computeHistoryStats(qarzlar, txs, { vozFromRows: !!data._derived }),
      _pendingChange: true,
    },
  };
}

