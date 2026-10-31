/**
 * Qarz tafsiloti va kvitansiya proyeksiyasi.
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import type { DebtSet } from './projectionAllocation';
import { applyAll, customerDebts, isLocalOnlyCustomer, qarzRowFromOp, repayScope, repaySumma, siblingSrc, txRowFromRepay, txRowsFromCreate, withCreates } from './projectionAllocation';
import type { Json, ProjectionCtx, RepayOp } from './projectionBase';
import { EPS, FULL_CLOSE, apiPrefix, num, qarzCreates, repays, round2, sameId, serverIdOf } from './projectionBase';
import { installmentSchedule } from './projectionInstallments';

export const txsOnlyNew = (rows: Json[], existing: Json[]): Json[] => rows.filter(r => !existing.some(e => e.id === r.id));

/** Amal shu qarzga (to'g'ridan-to'g'ri yoki mijoz/turi/valyuta bo'yicha qardosh sifatida) tegishlimi. */
function relevantToDebt(op: RepayOp, q: Json, mijozId: unknown, qarzId: unknown, ctx: ProjectionCtx): boolean {
  if (sameId(ctx, (op.payload as { qarzId?: number }).qarzId, qarzId)) return true;
  if (op.kind === 'tolov.tolandi' || mijozId === undefined || mijozId === null) return false;
  const sc = repayScope(op, [q], ctx);
  return (
    sc.mijozId !== undefined &&
    sameId(ctx, sc.mijozId, mijozId) &&
    (!sc.turi || !q.turi || sc.turi === q.turi) &&
    (!sc.valyuta || !q.valyuta || sc.valyuta === q.valyuta)
  );
}

/**
 * Qardosh tarixsiz zaxira: mijoz.yopish summasi keshdagi yopish-info jamisidan kam bo'lmasa — mijozning
 * shu turi+valyutadagi BARCHA qarzlari yopiladi (aniq); aks holda taqsimot noma'lum — qo'llanmaydi.
 */
function fallbackOps(url: string, q: Json, mijozId: unknown, ops: RepayOp[], ctx: ProjectionCtx): RepayOp[] {
  return ops.flatMap(op => {
    if (op.kind !== 'mijoz.yopish') return [op];
    const id = serverIdOf(ctx, mijozId);
    const info = id !== undefined ? ctx.cached?.(`${apiPrefix(url)}/qarz-daftari/mijozlar/${id}/yopish-info?turi=${op.payload.turi}`) : null;
    const row = (info?.data?.data?.qoldiqlar || []).find((r: Json) => r.valyuta === op.payload.valyuta);
    if (!row || repaySumma(op) < num(row.qoldiq) - EPS) return [];
    // To'liq yopish: to'plamdagi har bir qarz yopilsin (summa chegarasi applyRepayment'da qoldiq bo'yicha).
    return [{ ...op, payload: { ...op.payload, summa: FULL_CLOSE } } as RepayOp];
  });
}

/**
 * 24.10: bitta qarzning proyeksiyasi — qaytarish mijozning to'liq to'plami bo'ylab taqsimlanadi
 * (backend planAllocation), shu qarzning qoldig'i/holati/bo'laklari olinadi. Tranzaksiya qatori faqat
 * shu qarz anchor bo'lsa qo'shiladi.
 */
function projectDebt(url: string, q: Json, ctx: ProjectionCtx, qarzId: number): Json {
  const mijozId = q.mijoz_id ?? q.mijoz?.id;
  const rp = repays(ctx).filter(op => relevantToDebt(op, q, mijozId, qarzId, ctx));
  if (!rp.length) return q;
  const self: Json = { ...q, tolovlar: Array.isArray(q.tolovlar) ? q.tolovlar.slice() : q.tolovlar };
  const src = mijozId !== undefined && mijozId !== null ? siblingSrc(url, ctx, mijozId) : null;
  const exact = !!src || isLocalOnlyCustomer(ctx, mijozId);
  let set: DebtSet;
  if (exact) {
    set = customerDebts([self], src, ctx, mijozId);
  } else {
    const ops = fallbackOps(url, self, mijozId, rp, ctx);
    const start = withCreates([self], ctx.ops, ctx, mijozId);
    set = { start, ...applyAll(start, ops, ctx) };
  }
  const me = set.rows.find(r => sameId(ctx, r.id, qarzId)) ?? self;
  const ledger = rp.filter(op =>
    op.kind === 'mijoz.yopish' ? exact && sameId(ctx, set.anchors.get(op.id), qarzId) : sameId(ctx, op.payload.qarzId, qarzId),
  );
  const tx0: Json[] = Array.isArray(q.tranzaksiyalar) ? q.tranzaksiyalar : [];
  const tranzaksiyalar = ledger.reduce((acc: Json[], op) => [txRowFromRepay(op, qarzId), ...acc], tx0);
  return {
    ...q,
    qoldiq: me.qoldiq,
    status: me.status,
    tolovlar: me.tolovlar ?? q.tolovlar,
    ...(me.voz_kechilgan !== undefined ? { voz_kechilgan: me.voz_kechilgan } : {}),
    tranzaksiyalar,
    _pendingChange: true,
  };
}

export function projectQarz(url: string, body: Json, ctx: ProjectionCtx, qarzId: number): Json {
  let q: Json = body?.data && body.data.id !== undefined ? body.data : null;
  if (!q) {
    const creator = qarzCreates(ctx).find(op => sameId(ctx, op.tempId, qarzId));
    if (!creator) return body;
    const row = qarzRowFromOp(creator);
    q = {
      ...row,
      mijoz: { id: row.mijoz_id, fish: creator.meta.fish || '', telefon: creator.meta.telefon || null },
      tolovlar: row.bolib_tolash
        ? installmentSchedule(row.qoldiq, num(row.oylar_soni), row.berilgan_sana, row.valyuta === 'USD')
        : [],
      tranzaksiyalar: txRowsFromCreate(creator),
      savdoFaoliyat: creator.meta.faoliyatNomi ? { id: row.savdo_faoliyat_id, nomi: creator.meta.faoliyatNomi } : null,
    };
    body = { success: true, data: q, reliability: { level: 'none', total: 0, on_time: 0, late: 0 } };
  }
  const next = projectDebt(url, q, ctx, qarzId);
  return next === q ? body : { ...body, data: next };
}

/** Qarzning mijozi: keshdagi qarz tafsilotidan yoki amal meta'sidan. */
function mijozOfDebt(url: string, ctx: ProjectionCtx, qarzId: number): number | undefined {
  const id = serverIdOf(ctx, qarzId);
  const det = id !== undefined ? ctx.cached?.(`${apiPrefix(url)}/qarz-daftari/qarz/${id}`)?.data?.data : null;
  if (det?.mijoz_id !== undefined && det?.mijoz_id !== null) return Number(det.mijoz_id);
  const op = repays(ctx).find(o => sameId(ctx, (o.payload as { qarzId?: number }).qarzId, qarzId) && o.meta.mijozId !== undefined);
  return op?.meta.mijozId;
}

export function projectKvitansiya(url: string, body: Json, ctx: ProjectionCtx, qarzId: number): Json {
  if (body?.data && body.data.miqdor !== undefined) {
    // 24.10: mavjud qarz — navbatdagi qaytarishlar qoldiq/qaytarilgan/bo'laklarga qo'yiladi.
    const d = body.data;
    const row = {
      ...d,
      id: qarzId,
      mijoz_id: mijozOfDebt(url, ctx, qarzId),
      created_at: d.yaratilgan_vaqt,
      status: num(d.qoldiq) > EPS ? 'aktiv' : 'yopilgan',
      tranzaksiyalar: [],
    };
    const next = projectDebt(url, row, ctx, qarzId);
    if (next === row) return body;
    return {
      ...body,
      data: { ...d, qoldiq: next.qoldiq, tolovlar: next.tolovlar, qaytarilgan: round2(num(d.miqdor) - num(next.qoldiq)), _pendingChange: true },
    };
  }
  const creator = qarzCreates(ctx).find(op => sameId(ctx, op.tempId, qarzId));
  if (!creator) return body;
  const row = qarzRowFromOp(creator);
  const owner = ctx.ownerName || '';
  const mijoz = creator.meta.fish || '';
  const synth = {
    id: qarzId,
    mijoz_id: row.mijoz_id,
    turi: row.turi,
    valyuta: row.valyuta,
    bolib_tolash: row.bolib_tolash,
    created_at: row.created_at,
    qaytarish_sanasi: row.qaytarish_sanasi,
    qoldiq: row.qoldiq,
    status: row.status,
    tolovlar: row.bolib_tolash
      ? installmentSchedule(row.qoldiq, num(row.oylar_soni), row.berilgan_sana, row.valyuta === 'USD')
      : [],
  };
  const p = projectDebt(url, synth, ctx, qarzId);
  return {
    success: true,
    data: {
      turi: row.turi,
      qarz_oluvchi: row.turi === 'berish' ? mijoz : owner,
      qarz_beruvchi: row.turi === 'berish' ? owner : mijoz,
      miqdor: row.miqdor,
      qoldiq: p.qoldiq,
      valyuta: row.valyuta,
      mahsulot_nomi: row.mahsulot_nomi,
      berilgan_sana: row.berilgan_sana,
      yaratilgan_vaqt: row.created_at,
      qaytarish_sanasi: row.qaytarish_sanasi,
      bolib_tolash: row.bolib_tolash,
      oylar_soni: row.oylar_soni,
      tolovlar: p.tolovlar,
      qaytarilgan: round2(row.miqdor - num(p.qoldiq)),
      _offline: creator.status,
    },
  };
}

