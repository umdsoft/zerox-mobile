/**
 * Taqsimlash yadrosi: lokal yozuvlar (amaldan), qaytarish taqsimoti (applyRepayment) va mijozning barcha qarzlari (customerDebts).
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import { OutboxOp, Turi, Valyuta } from './types';
import type { Json, ProjectionCtx, QarzCreateOp, RepayOp } from './projectionBase';
import { EPS, OFFLINE_FAILED, apiPrefix, isCreate, isEffective, isRepay, iso, num, round2, sameId, serverIdOf } from './projectionBase';
import { installmentSchedule, markInstallmentsPaid, payInstallments } from './projectionInstallments';

export function qarzRowFromOp(op: QarzCreateOp): Json {
  const b = op.payload.body;
  const miqdor = round2(num(b.miqdor));
  const bosh = b.bolib_tolash ? round2(num(b.boshlangich_tolov)) : 0;
  const qoldiq = round2(miqdor - bosh);
  const tolovlar = b.bolib_tolash
    ? installmentSchedule(qoldiq, num(b.oylar_soni), b.berilgan_sana, b.valyuta === 'USD')
    : [];
  const last = tolovlar.length ? tolovlar[tolovlar.length - 1].tolov_sanasi : null;
  return {
    id: op.tempId,
    savdo_faoliyat_id: b.savdo_faoliyat_id,
    mijoz_id: b.mijoz_id,
    xodim_id: null,
    turi: b.turi,
    valyuta: b.valyuta,
    miqdor,
    qoldiq,
    mahsulot_nomi: b.mahsulot_nomi || null,
    berilgan_sana: b.berilgan_sana,
    qaytarish_sanasi: b.bolib_tolash ? last : b.qaytarish_sanasi,
    bolib_tolash: b.bolib_tolash ? 1 : 0,
    oylar_soni: b.bolib_tolash ? b.oylar_soni : null,
    boshlangich_tolov: bosh,
    // 24.10: rad etilgan/bloklangan qarz serverda YO'Q — ko'rinadi, lekin jami/taqsimotga kirmaydi.
    status: isEffective(op) ? 'aktiv' : OFFLINE_FAILED,
    voz_kechilgan: 0,
    created_at: iso(op.createdAt),
    updated_at: iso(op.createdAt),
    savdo_faoliyat_nomi: op.meta.faoliyatNomi,
    _offline: op.status,
    _opId: op.id,
  };
}

export function txRowsFromCreate(op: QarzCreateOp): Json[] {
  const r = qarzRowFromOp(op);
  const rows: Json[] = [
    {
      id: `offline-${op.id}-b`,
      qarz_id: op.tempId,
      xodim_id: null,
      turi: 'berish',
      summa: r.miqdor,
      valyuta: r.valyuta,
      izoh: r.mahsulot_nomi,
      berilgan_sana: r.berilgan_sana,
      qaytarish_sanasi: r.bolib_tolash ? null : r.qaytarish_sanasi,
      created_at: r.created_at,
      savdo_faoliyat_id: r.savdo_faoliyat_id,
      savdo_faoliyat_nomi: r.savdo_faoliyat_nomi,
      _offline: op.status,
      _opId: op.id,
    },
  ];
  if (r.boshlangich_tolov > 0) {
    rows.unshift({
      ...rows[0],
      id: `offline-${op.id}-p`,
      turi: 'qaytarish',
      summa: r.boshlangich_tolov,
      izoh: "Boshlang'ich to'lov",
    });
  }
  return rows;
}

export function repaySumma(op: RepayOp): number {
  if (op.kind === 'tolov.tolandi') return round2(num(op.payload.summa ?? op.meta.summa));
  return round2(num(op.payload.summa));
}

export function txRowFromRepay(op: RepayOp, anchorQarzId: unknown): Json {
  const waive = op.kind === 'qarz.vozKechish';
  return {
    id: `offline-${op.id}`,
    qarz_id: anchorQarzId ?? op.meta.qarzId ?? null,
    xodim_id: null,
    turi: waive ? 'voz_kechish' : 'qaytarish',
    summa: repaySumma(op),
    valyuta: op.kind === 'tolov.tolandi' ? op.meta.valyuta : op.payload.valyuta,
    izoh: waive ? (op.payload as { izoh?: string | null }).izoh || null : op.kind === 'tolov.tolandi' ? "Bo'lib to'lash to'lovi" : null,
    created_at: iso(op.createdAt),
    savdo_faoliyat_id: op.meta.faoliyatId,
    savdo_faoliyat_nomi: op.meta.faoliyatNomi,
    _offline: op.status,
    _opId: op.id,
  };
}

/** Qaytarish amalining (mijoz, turi, valyuta) ko'lami. */
export function repayScope(op: RepayOp, rows: Json[], ctx: ProjectionCtx): { mijozId?: number; turi?: Turi; valyuta?: Valyuta } {
  if (op.kind === 'mijoz.yopish') {
    return { mijozId: op.payload.mijozId, turi: op.payload.turi, valyuta: op.payload.valyuta };
  }
  const qarzId = op.payload.qarzId;
  const row = rows.find(r => sameId(ctx, r.id, qarzId));
  const valyuta: Valyuta | undefined =
    op.kind === 'tolov.tolandi' ? (op.meta.valyuta ?? row?.valyuta) : op.payload.valyuta;
  return {
    mijozId: op.meta.mijozId ?? (row ? num(row.mijoz_id) : undefined),
    turi: op.meta.turi ?? row?.turi,
    valyuta,
  };
}

const dueOf = (d: Json): number => {
  const v = d.qaytarish_sanasi || d.berilgan_sana || d.created_at;
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
};
const byDue = (a: Json, b: Json): number => {
  const d = dueOf(a) - dueOf(b);
  return d !== 0 ? d : num(a.id) - num(b.id);
};
/** backend sortForRepayment: avval oddiy, so'ng bo'lib to'lash; muddati yaqinidan; teng — id. */
const byRepaymentOrder = (a: Json, b: Json): number => {
  const ga = num(a.bolib_tolash) === 1 ? 1 : 0;
  const gb = num(b.bolib_tolash) === 1 ? 1 : 0;
  return ga !== gb ? ga - gb : byDue(a, b);
};
const createdMs = (d: Json): number => {
  const t = new Date(String(d.created_at || '').replace(' ', 'T')).getTime();
  return Number.isNaN(t) ? 0 : t;
};
/** backend pickAnchor: eng oxirgi ro'yxatdan o'tgan aktiv qarz (teng — kattaroq id). */
const pickAnchor = (debts: Json[]): Json | undefined =>
  debts.slice().sort((a, b) => createdMs(b) - createdMs(a) || num(b.id) - num(a.id))[0];

function repayTargets(rows: Json[], op: RepayOp, ctx: ProjectionCtx): Json[] {
  if (op.kind === 'tolov.tolandi') return rows.filter(r => sameId(ctx, r.id, op.payload.qarzId) && r.status === 'aktiv');
  const sc = repayScope(op, rows, ctx);
  if (sc.mijozId === undefined) {
    const anchorId = (op.payload as { qarzId?: number }).qarzId;
    return rows.filter(r => sameId(ctx, r.id, anchorId) && r.status === 'aktiv');
  }
  return rows.filter(
    r =>
      sameId(ctx, r.mijoz_id, sc.mijozId) &&
      (!sc.turi || r.turi === sc.turi) &&
      (!sc.valyuta || r.valyuta === sc.valyuta) &&
      r.status === 'aktiv',
  );
}

export interface RepayResult {
  rows: Json[];
  /** Tranzaksiya bog'lanadigan qarz id (backend anchor). */
  anchor: unknown;
  /** Amal shu qatorlardan birortasiga tegdimi. */
  touched: boolean;
}

/**
 * Qaytarishni qarz qatorlari bo'ylab taqsimlash (yangi massiv). tolov.tolandi — faqat o'sha qarzga
 * (bo'lak sharsharasi bilan). Qaytarish bo'lib to'lash qarziga tushsa — bo'laklar (`tolovlar` bo'lsa)
 * backend markInstallmentsPaid kabi. Voz kechish — muddat bo'yicha, `voz_kechilgan` ga qo'shiladi.
 */
export function applyRepayment(rows: Json[], op: RepayOp, ctx: ProjectionCtx): RepayResult {
  const waive = op.kind === 'qarz.vozKechish';
  const closed = waive ? 'voz_kechilgan' : 'yopilgan';
  const targets = repayTargets(rows, op, ctx);
  const tolovOp = op.kind === 'tolov.tolandi' ? op : null;
  const chosen = tolovOp && Array.isArray(targets[0]?.tolovlar)
    ? targets[0].tolovlar.find((t: Json) => Number(t.id) === Number(tolovOp.payload.tolovId))
    : undefined;
  // Summa kiritilmagan bo'lak to'lovi — bo'lak summasi (backend: kiritilgan ?? bolakSumma).
  const summa = tolovOp && !(repaySumma(op) > 0) && chosen ? round2(num(chosen.summa)) : repaySumma(op);
  const anchorOf = (): unknown =>
    op.kind === 'mijoz.yopish' ? pickAnchor(targets)?.id : (op.payload as { qarzId: number }).qarzId;
  if (!(summa > 0) || !targets.length) return { rows, anchor: targets.length ? anchorOf() : undefined, touched: false };
  // Idempotent (backend): tanlangan bo'lak allaqachon to'langan — hech narsa o'zgarmaydi.
  if (chosen && chosen.status === 'tolandi') return { rows, anchor: anchorOf(), touched: false };

  const sorted = targets.slice().sort(waive ? byDue : byRepaymentOrder);
  let remaining = summa;
  const patch = new Map<Json, Json>();
  for (const d of sorted) {
    if (remaining <= EPS) break;
    const dq = num(d.qoldiq);
    if (dq <= EPS) continue;
    const pay = round2(Math.min(remaining, dq));
    const nq = round2(Math.max(dq - pay, 0));
    const p: Json = { qoldiq: nq, status: nq <= EPS ? closed : 'aktiv', _pendingChange: true };
    if (waive) p.voz_kechilgan = round2(num(d.voz_kechilgan) + pay);
    if (Array.isArray(d.tolovlar)) {
      if (tolovOp) p.tolovlar = payInstallments(d.tolovlar, tolovOp.payload.tolovId, pay, op.status);
      else if (!waive && num(d.bolib_tolash) === 1) p.tolovlar = markInstallmentsPaid(d.tolovlar, pay, nq <= EPS, op.status);
    }
    patch.set(d, p);
    remaining = round2(remaining - pay);
  }
  return { rows: rows.map(r => (patch.has(r) ? { ...r, ...patch.get(r) } : r)), anchor: anchorOf(), touched: true };
}

/** Amallarni ketma-ket qo'llash; anchors — amal id -> tranzaksiya qarzi (faqat tekkan amallar). */
export function applyAll(rows: Json[], ops: OutboxOp[], ctx: ProjectionCtx): { rows: Json[]; anchors: Map<string, unknown> } {
  let cur = rows;
  const anchors = new Map<string, unknown>();
  ops.filter(isRepay).filter(isEffective).forEach(op => {
    const r = applyRepayment(cur, op, ctx);
    cur = r.rows;
    if (r.touched) anchors.set(op.id, r.anchor);
  });
  return { rows: cur, anchors };
}

/** Mijozning navbatdagi (hali qatorlarda yo'q) qarzlarini qo'shish — yangisi tepada. */
export function withCreates(rows: Json[], ops: OutboxOp[], ctx: ProjectionCtx, mijozId: unknown): Json[] {
  const added = ops
    .filter(isCreate)
    .filter(op => sameId(ctx, op.payload.body.mijoz_id, mijozId) && !rows.some(r => sameId(ctx, r.id, op.tempId)))
    .map(qarzRowFromOp)
    .reverse();
  return added.length ? [...added, ...rows] : rows;
}

interface SiblingSrc {
  rows: Json[];
  savedAt: number;
  ops: OutboxOp[];
  mijoz: Json;
}

/** Keshdagi mijoz tarixi — qardosh qarzlar manbai (yo'q / temp mijoz — null). */
export function siblingSrc(url: string, ctx: ProjectionCtx, mijozId: unknown): SiblingSrc | null {
  const id = serverIdOf(ctx, mijozId);
  if (!ctx.cached || id === undefined) return null;
  const hit = ctx.cached(`${apiPrefix(url)}/qarz-daftari/mijozlar/${id}/history`);
  const h = hit?.data?.data;
  if (!hit || !h || !Array.isArray(h.qarzlar)) return null;
  return { rows: h.qarzlar, savedAt: hit.savedAt, ops: hit.ops, mijoz: h.mijoz };
}

/** Mijoz serverda yo'q (oflayn yaratilgan, hali xaritalanmagan) — barcha qarzlari navbatda. */
export const isLocalOnlyCustomer = (ctx: ProjectionCtx, mijozId: unknown): boolean =>
  Number(mijozId) < 0 && ctx.resolve(Number(mijozId)) === undefined;

export interface DebtSet {
  /** Amallar qo'llanishidan OLDINGI to'plam (asosiy javob vaqtidagi holat). */
  start: Json[];
  rows: Json[];
  anchors: Map<string, unknown>;
}

/**
 * 24.10: mijozning TO'LIQ qarzlar to'plami (backend shu to'plam bo'ylab taqsimlaydi) va navbatdagi
 * amallardan keyingi holati. `primary` — asosiy javob qatorlari (`ctx.baseAt` holati), `src` — keshdagi tarix.
 *  - tarix YANGIROQ: tarix qatorlari (asosiy qatorning boshqa maydonlari saqlanib) + tarixdan keyingi amallar;
 *  - tarix ESKIROQ: tarix avval asosiy javob vaqtigacha "yetkaziladi" (oradagi `done` amallar), so'ng
 *    asosiy qatorlar ustidan almashtiriladi va asosiy javobdan keyingi amallar qo'llanadi.
 * Shu tarzda bitta amal ikki marta qo'llanmaydi.
 */
export function customerDebts(primary: Json[], src: SiblingSrc | null, ctx: ProjectionCtx, mijozId: unknown): DebtSet {
  if (!src) {
    const start = withCreates(primary, ctx.ops, ctx, mijozId);
    return { start, ...applyAll(start, ctx.ops, ctx) };
  }
  const inList = (list: Json[], row: Json) => list.some(x => sameId(ctx, x.id, row.id));
  const primaryOf = (row: Json) => primary.find(p => sameId(ctx, p.id, row.id));
  const baseAt = ctx.baseAt ?? Number.POSITIVE_INFINITY;
  if (src.savedAt >= baseAt) {
    const h = src.rows.map(r => {
      const p = primaryOf(r);
      return p ? { ...p, qoldiq: r.qoldiq, status: r.status } : r;
    });
    const start = withCreates([...primary.filter(p => !inList(src.rows, p)), ...h], src.ops, ctx, mijozId);
    return { start, ...applyAll(start, src.ops, ctx) };
  }
  const own = new Set(ctx.ops.map(o => o.id));
  const catchUp = src.ops.filter(o => !own.has(o.id));
  const caught = applyAll(withCreates(src.rows, catchUp, ctx, mijozId), catchUp, ctx).rows;
  const merged = caught.map(r => primaryOf(r) ?? r);
  const start = withCreates([...primary.filter(p => !inList(caught, p)), ...merged], ctx.ops, ctx, mijozId);
  return { start, ...applyAll(start, ctx.ops, ctx) };
}

