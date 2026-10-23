/**
 * Projection — sinxronlanmagan amallarni server (yoki kesh) javobi USTIGA optimistik qo'yish.
 *
 * Sof funksiyalar: (url, body, ctx) -> yangi body (kirish o'zgarmaydi). Natijadagi lokal yozuvlarda
 * `_offline` (amal holati: pending|syncing|failed|blocked) va `_opId` maydonlari bor — ekranlar
 * "Sinxronlanmagan" / "Xato" nishonini shu bo'yicha ko'rsatadi.
 *
 * Qoidalar:
 *  - Yaratilgan obyektlar (mijoz, qarz) har qanday faol holatda KO'RINADI (failed bo'lsa ham — foydalanuvchi topib hal qilsin).
 *  - Summaga ta'sir faqat `pending`/`syncing` amallardan (rad etilgan qaytarish qoldiqni kamaytirmaydi).
 *  - Qaytarish/voz kechish taqsimoti backend `repayment.service` tartibida: avval oddiy qarzlar,
 *    so'ng bo'lib to'lash; muddati yaqinidan. Bu faqat KO'RINISH — haqiqat sinxrondan keyin serverdan.
 */
import { normalizeUrl } from './responseCache';
import { OutboxOp, Turi, Valyuta } from './types';

// Server JSON'i dinamik — bu modulda ataylab keng tur (faqat shu yerda).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export interface ProjectionCtx {
  /**
   * Joriy aktorning FAOL amallari (pending/syncing/failed/blocked) + asosiy ma'lumotdan KEYIN
   * sinxronlangan `done` amallar (`opsForProjection`), yaratilish tartibida.
   */
  ops: OutboxOp[];
  resolve: (id: number) => number | undefined;
  now: number;
  ownerName?: string;
}

const EPS = 0.0001;
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const curKey = (v: unknown): 'uzs' | 'usd' => (v === 'USD' ? 'usd' : 'uzs');
/**
 * Summaga ta'sir qiluvchi amal. `done` — chaqiruvchi faqat asosiy ma'lumot (server/kesh) shu amal
 * sinxronlanishidan OLDIN olingan bo'lsa uzatadi (qayta yuklanguncha yozuv "yo'qolib" qolmasin).
 */
const isEffective = (op: OutboxOp): boolean => op.status === 'pending' || op.status === 'syncing' || op.status === 'done';
const iso = (ms: number): string => new Date(ms).toISOString();

/** Ikki id bir obyektmi (temp <-> server xaritasi hisobga olinadi). */
const sameId = (ctx: ProjectionCtx, a: unknown, b: unknown): boolean => {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x === 0 || y === 0) return false;
  if (x === y) return true;
  const rx = x < 0 ? ctx.resolve(x) : x;
  const ry = y < 0 ? ctx.resolve(y) : y;
  return rx !== undefined && ry !== undefined && rx === ry;
};

// ---------------------------------------------------------------------------
// Bo'lib to'lash jadvali (backend services/qarz-daftari/bolibTolash.service.js `hisobla` bilan bir xil).
// ---------------------------------------------------------------------------
export function installmentSchedule(qoldiq: number, oylar: number, berilganSana: string, usd: boolean): Json[] {
  if (!(oylar >= 1)) return [];
  const unit = usd ? 1 : 100;
  const totalC = Math.round((Number(qoldiq) || 0) * 100);
  const oylikC = Math.floor(totalC / oylar / unit) * unit;
  let jamiC = 0;
  const rows: Json[] = [];
  for (let i = 1; i <= oylar; i++) {
    const sana = new Date(berilganSana);
    sana.setMonth(sana.getMonth() + i);
    const summaC = i === oylar ? totalC - jamiC : oylikC;
    jamiC += summaC;
    rows.push({
      id: `offline-${i}`,
      tartib_raqami: i,
      summa: summaC / 100,
      tolov_sanasi: Number.isNaN(sana.getTime()) ? null : sana.toISOString().split('T')[0],
      status: 'kutilmoqda',
      _offline: true,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Lokal yozuvlar (amaldan)
// ---------------------------------------------------------------------------
type QarzCreateOp = Extract<OutboxOp, { kind: 'qarz.create' }>;
type MijozCreateOp = Extract<OutboxOp, { kind: 'mijoz.create' }>;
type RepayOp = Extract<OutboxOp, { kind: 'qarz.yopish' | 'mijoz.yopish' | 'qarz.vozKechish' | 'tolov.tolandi' }>;

const isRepay = (op: OutboxOp): op is RepayOp =>
  op.kind === 'qarz.yopish' || op.kind === 'mijoz.yopish' || op.kind === 'qarz.vozKechish' || op.kind === 'tolov.tolandi';

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
    status: 'aktiv',
    voz_kechilgan: 0,
    created_at: iso(op.createdAt),
    updated_at: iso(op.createdAt),
    savdo_faoliyat_nomi: op.meta.faoliyatNomi,
    _offline: op.status,
    _opId: op.id,
  };
}

function txRowsFromCreate(op: QarzCreateOp): Json[] {
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

function repaySumma(op: RepayOp): number {
  if (op.kind === 'tolov.tolandi') return round2(num(op.payload.summa ?? op.meta.summa));
  return round2(num(op.payload.summa));
}

function txRowFromRepay(op: RepayOp, anchorQarzId: unknown): Json {
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
function repayScope(op: RepayOp, rows: Json[], ctx: ProjectionCtx): { mijozId?: number; turi?: Turi; valyuta?: Valyuta } {
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

/**
 * Qaytarishni qarz qatorlari bo'ylab taqsimlash (yangi massiv). tolov.tolandi — faqat o'sha qarzga.
 * @returns { rows, anchor } anchor — tranzaksiya bog'lanadigan qarz id
 */
export function applyRepayment(rows: Json[], op: RepayOp, ctx: ProjectionCtx): { rows: Json[]; anchor: unknown } {
  const summa = repaySumma(op);
  const closed = op.kind === 'qarz.vozKechish' ? 'voz_kechilgan' : 'yopilgan';
  if (!(summa > 0)) return { rows, anchor: undefined };

  let targets: Json[];
  if (op.kind === 'tolov.tolandi') {
    targets = rows.filter(r => sameId(ctx, r.id, op.payload.qarzId) && r.status === 'aktiv');
  } else {
    const sc = repayScope(op, rows, ctx);
    if (sc.mijozId === undefined) {
      const anchorId = (op.payload as { qarzId?: number }).qarzId;
      targets = rows.filter(r => sameId(ctx, r.id, anchorId) && r.status === 'aktiv');
    } else {
      targets = rows.filter(
        r =>
          sameId(ctx, r.mijoz_id, sc.mijozId) &&
          (!sc.turi || r.turi === sc.turi) &&
          (!sc.valyuta || r.valyuta === sc.valyuta) &&
          r.status === 'aktiv',
      );
    }
  }
  const sorted = targets.slice().sort((a, b) => {
    const ga = num(a.bolib_tolash) === 1 ? 1 : 0;
    const gb = num(b.bolib_tolash) === 1 ? 1 : 0;
    if (ga !== gb) return ga - gb;
    const d = dueOf(a) - dueOf(b);
    return d !== 0 ? d : num(a.id) - num(b.id);
  });
  let remaining = summa;
  const patch = new Map<unknown, Json>();
  for (const d of sorted) {
    if (remaining <= EPS) break;
    const dq = num(d.qoldiq);
    if (dq <= EPS) continue;
    const pay = round2(Math.min(remaining, dq));
    const nq = round2(Math.max(dq - pay, 0));
    patch.set(d, { qoldiq: nq, status: nq <= EPS ? closed : 'aktiv', _pendingChange: true });
    remaining = round2(remaining - pay);
  }
  const anchor =
    op.kind === 'mijoz.yopish' ? (sorted[0] ? sorted[0].id : undefined) : (op.payload as { qarzId: number }).qarzId;
  return { rows: rows.map(r => (patch.has(r) ? { ...r, ...patch.get(r) } : r)), anchor };
}

/** Mijoz tarixi stats — backend mijozlar.controller.history bilan bir xil formula. */
export function computeHistoryStats(qarzlar: Json[], tranzaksiyalar: Json[]): Json {
  const z = () => ({ uzs: 0, usd: 0 });
  const s: Json = {
    jami_qarzlar: qarzlar.length,
    aktiv_qarzlar: qarzlar.filter(q => q.status === 'aktiv').length,
    berilgan: z(),
    olingan: z(),
    qoldiq_berilgan: z(),
    qoldiq_olingan: z(),
    voz_kechilgan_berilgan: z(),
    voz_kechilgan_olingan: z(),
    undirilgan_berilgan: z(),
    undirilgan_olingan: z(),
  };
  const turiOf = new Map<string, unknown>();
  qarzlar.forEach(q => turiOf.set(String(q.id), q.turi));
  tranzaksiyalar.forEach(tr => {
    if (tr.turi !== 'voz_kechish') return;
    const turi = turiOf.get(String(tr.qarz_id));
    if (!turi) return;
    const key = turi === 'berish' ? 'voz_kechilgan_berilgan' : 'voz_kechilgan_olingan';
    s[key][curKey(tr.valyuta)] += num(tr.summa);
  });
  qarzlar.forEach(q => {
    const c = curKey(q.valyuta);
    const miqdor = num(q.miqdor);
    const qoldiq = num(q.qoldiq);
    const kamaygan = Math.max(miqdor - qoldiq, 0);
    if (q.turi === 'berish') {
      s.berilgan[c] += miqdor;
      s.undirilgan_berilgan[c] += kamaygan;
      if (q.status === 'aktiv') s.qoldiq_berilgan[c] += qoldiq;
    } else {
      s.olingan[c] += miqdor;
      s.undirilgan_olingan[c] += kamaygan;
      if (q.status === 'aktiv') s.qoldiq_olingan[c] += qoldiq;
    }
  });
  (['uzs', 'usd'] as const).forEach(c => {
    s.undirilgan_berilgan[c] = Math.max(s.undirilgan_berilgan[c] - s.voz_kechilgan_berilgan[c], 0);
    s.undirilgan_olingan[c] = Math.max(s.undirilgan_olingan[c] - s.voz_kechilgan_olingan[c], 0);
  });
  (Object.keys(s) as string[]).forEach(k => {
    if (s[k] && typeof s[k] === 'object') {
      s[k] = { uzs: round2(s[k].uzs), usd: round2(s[k].usd) };
    }
  });
  return s;
}

// ---------------------------------------------------------------------------
// Endpoint proyeksiyalari
// ---------------------------------------------------------------------------
const qarzCreates = (ctx: ProjectionCtx): QarzCreateOp[] =>
  ctx.ops.filter((o): o is QarzCreateOp => o.kind === 'qarz.create');
const mijozCreates = (ctx: ProjectionCtx): MijozCreateOp[] =>
  ctx.ops.filter((o): o is MijozCreateOp => o.kind === 'mijoz.create');
const repays = (ctx: ProjectionCtx): RepayOp[] => ctx.ops.filter(isRepay).filter(isEffective);

const parseQuery = (url: string): Record<string, string> => {
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

const pathOf = (url: string): string => normalizeUrl(url).split('?')[0].replace(/^\/api/, '');

function synthMijoz(op: MijozCreateOp): Json {
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

function projectMijozlar(url: string, body: Json, ctx: ProjectionCtx, fid: number): Json {
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
  });
  return { ...(body || { success: true }), data: rows };
}

function projectHistory(body: Json, ctx: ProjectionCtx, mijozId: number): Json {
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
    const row = qarzRowFromOp(op);
    qarzlar = [row, ...qarzlar];
    txs = [...txsOnlyNew(txRowsFromCreate(op), txs), ...txs];
    changed = true;
  });
  // Bu mijozga tegishli qaytarishlar (qarz qatorlari shu tarixda bor)
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
    data: { ...data, qarzlar, tranzaksiyalar: txs, stats: computeHistoryStats(qarzlar, txs), _pendingChange: true },
  };
}

const txsOnlyNew = (rows: Json[], existing: Json[]): Json[] => rows.filter(r => !existing.some(e => e.id === r.id));

function projectQarz(body: Json, ctx: ProjectionCtx, qarzId: number): Json {
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
  const anchored = repays(ctx).filter(op => {
    if (op.kind === 'mijoz.yopish') return false;
    return sameId(ctx, op.payload.qarzId, qarzId);
  });
  if (!anchored.length) return body;
  let cur: Json = { ...q, tolovlar: Array.isArray(q.tolovlar) ? q.tolovlar.slice() : [], tranzaksiyalar: Array.isArray(q.tranzaksiyalar) ? q.tranzaksiyalar.slice() : [] };
  anchored.forEach(op => {
    const s = repaySumma(op);
    const before = num(cur.qoldiq);
    const nq = round2(Math.max(before - s, 0));
    cur = {
      ...cur,
      qoldiq: nq,
      status: nq <= EPS ? (op.kind === 'qarz.vozKechish' ? 'voz_kechilgan' : 'yopilgan') : cur.status,
      _pendingChange: true,
      tranzaksiyalar: [txRowFromRepay(op, cur.id), ...cur.tranzaksiyalar],
    };
    if (op.kind === 'tolov.tolandi') {
      cur.tolovlar = payInstallments(cur.tolovlar, op.payload.tolovId, s, op.status);
    }
  });
  return { ...body, data: cur };
}

/**
 * Bo'lak to'lovi sharsharasi (backend tolovTolandi kabi): avval tanlangan bo'lak, ortiqchasi keyingi
 * to'lanmagan bo'laklarga; yetmasa bo'lak summasi kamayadi va ochiq qoladi.
 */
export function payInstallments(tolovlar: Json[], tolovId: number, summa: number, status: string): Json[] {
  const sorted = tolovlar.slice().sort((a, b) => num(a.tartib_raqami) - num(b.tartib_raqami));
  const start = sorted.findIndex(t => Number(t.id) === Number(tolovId));
  if (start < 0) return tolovlar;
  let left = summa;
  return sorted.map((t, i) => {
    if (i < start || t.status === 'tolandi' || left <= EPS) return t;
    const ts = num(t.summa);
    if (left >= ts - EPS) {
      left = round2(left - ts);
      return { ...t, status: 'tolandi', _offline: status };
    }
    const rest = round2(ts - left);
    left = 0;
    return { ...t, summa: rest, _offline: status };
  });
}

function projectKvitansiya(body: Json, ctx: ProjectionCtx, qarzId: number): Json {
  if (body?.data && body.data.miqdor !== undefined) return body;
  const creator = qarzCreates(ctx).find(op => sameId(ctx, op.tempId, qarzId));
  if (!creator) return body;
  const row = qarzRowFromOp(creator);
  const owner = ctx.ownerName || '';
  const mijoz = creator.meta.fish || '';
  return {
    success: true,
    data: {
      turi: row.turi,
      qarz_oluvchi: row.turi === 'berish' ? mijoz : owner,
      qarz_beruvchi: row.turi === 'berish' ? owner : mijoz,
      miqdor: row.miqdor,
      qoldiq: row.qoldiq,
      valyuta: row.valyuta,
      mahsulot_nomi: row.mahsulot_nomi,
      berilgan_sana: row.berilgan_sana,
      yaratilgan_vaqt: row.created_at,
      qaytarish_sanasi: row.qaytarish_sanasi,
      bolib_tolash: row.bolib_tolash,
      oylar_soni: row.oylar_soni,
      tolovlar: row.bolib_tolash
        ? installmentSchedule(row.qoldiq, num(row.oylar_soni), row.berilgan_sana, row.valyuta === 'USD')
        : [],
      qaytarilgan: round2(row.miqdor - row.qoldiq),
      _offline: creator.status,
    },
  };
}

/**
 * 23.10: yopish-info keshda yo'q (mijoz oflaynda birinchi marta yopilmoqda) — asos mijozning
 * SAQLANGAN tarixidan (`/mijozlar/:id/history`) hisoblanadi: backend `mijozQoldiqlari` bilan bir xil
 * (shu tur, `aktiv`, valyuta bo'yicha jami qoldiq va soni). Navbatdagi amallar keyin proyeksiya qilinadi.
 */
export function yopishInfoFromHistory(historyBody: Json, turi: Turi): Json {
  const h = historyBody?.data;
  if (!h?.mijoz) return null;
  const map = new Map<string, { valyuta: string; qoldiq: number; soni: number }>();
  (Array.isArray(h.qarzlar) ? h.qarzlar : [])
    .filter((q: Json) => q.turi === turi && q.status === 'aktiv' && !q.deleted_at)
    .forEach((q: Json) => {
      const v = q.valyuta || 'UZS';
      const e = map.get(v) || { valyuta: v, qoldiq: 0, soni: 0 };
      map.set(v, { ...e, qoldiq: round2(e.qoldiq + num(q.qoldiq)), soni: e.soni + 1 });
    });
  const m = h.mijoz;
  return {
    success: true,
    data: {
      mijoz: { id: m.id, fish: m.fish, telefon: m.telefon ?? null, savdo_faoliyat_id: m.savdo_faoliyat_id },
      turi,
      qoldiqlar: Array.from(map.values()).filter(r => r.qoldiq > EPS),
    },
  };
}

/** Kesh kalitidan hosil qilinadigan "qardosh" URL: yopish-info -> shu mijozning tarixi. */
export function derivableFrom(url: string): { source: string; derive: (body: Json) => Json } | null {
  const m = normalizeUrl(url).match(/^(.*\/qarz-daftari\/mijozlar\/-?\d+)\/yopish-info(?:\?|$)/);
  if (!m) return null;
  const turi = (parseQuery(url).turi as Turi) === 'olish' ? 'olish' : 'berish';
  return { source: `${m[1]}/history`, derive: body => yopishInfoFromHistory(body, turi) };
}

function projectYopishInfo(url: string, body: Json, ctx: ProjectionCtx, mijozId: number): Json {
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

function projectQarzlar(url: string, body: Json, ctx: ProjectionCtx): Json {
  const q = parseQuery(url);
  const base: Json[] = Array.isArray(body?.data) ? body.data : [];
  const fid = q.faoliyat_id ? Number(q.faoliyat_id) : null;
  const within30 = (ymd: string | null): boolean => {
    if (!ymd) return false;
    const d = new Date(ymd).getTime() - ctx.now;
    return d >= -86400000 && d <= 30 * 86400000;
  };
  const added: Json[] = qarzCreates(ctx)
    .filter(op => !base.some(r => sameId(ctx, r.id, op.tempId)))
    .filter(op => {
      const b = op.payload.body;
      if (q.turi && b.turi !== q.turi) return false;
      if (fid && Number(b.savdo_faoliyat_id) !== fid) return false;
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
  const rp = repays(ctx);
  if (!added.length && !rp.length) return body;
  let rows: Json[] = [...added, ...base];
  rp.forEach(op => {
    rows = applyRepayment(rows, op, ctx).rows;
  });
  return { ...(body || { success: true }), data: rows };
}

function projectDashboard(url: string, body: Json, ctx: ProjectionCtx): Json {
  if (!body?.data) return body;
  const fid = parseQuery(url).faoliyat_id ? Number(parseQuery(url).faoliyat_id) : null;
  const inScope = (f: unknown) => !fid || Number(f) === fid;
  const delta = { berish: { uzs: 0, usd: 0 }, olish: { uzs: 0, usd: 0 } };
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
  const d = body.data;
  const adj = (src: Json, dd: { uzs: number; usd: number }) => ({
    ...(src || {}),
    uzs: round2(Math.max(num(src?.uzs) + dd.uzs, 0)),
    usd: round2(Math.max(num(src?.usd) + dd.usd, 0)),
  });
  return {
    ...body,
    data: {
      ...d,
      berilgan_qarz: d.berilgan_qarz ? { ...d.berilgan_qarz, daftari: adj(d.berilgan_qarz.daftari, delta.berish) } : d.berilgan_qarz,
      olingan_qarz: d.olingan_qarz ? { ...d.olingan_qarz, daftari: adj(d.olingan_qarz.daftari, delta.olish) } : d.olingan_qarz,
      _pendingChange: true,
    },
  };
}

/**
 * Proyeksiya uchun amallar: faol + asosiy ma'lumot olingandan (`baseAt`) keyin sinxronlangan `done`
 * (server javobida ular hali yo'q). Asosiy ma'lumot yangiroq bo'lsa `done` amallar tashlanadi.
 */
export function opsForProjection(ops: OutboxOp[], baseAt: number): OutboxOp[] {
  return ops.filter(o => o.status !== 'done' || (o.doneAt || 0) > baseAt);
}

/**
 * Asosiy kirish: URL bo'yicha mos proyeksiya. Tanilmagan URL — body o'zgarishsiz.
 * `body` null bo'lishi mumkin (kesh ham yo'q) — temp obyektlar uchun to'liq sintez qilinadi.
 */
export function project(url: string, body: Json, ctx: ProjectionCtx): Json {
  if (!ctx.ops.length) return body;
  const p = pathOf(url);
  let m: RegExpMatchArray | null;
  try {
    if ((m = p.match(/\/qarz-daftari\/savdo-faoliyat\/(\d+)\/mijozlar$/))) {
      return projectMijozlar(url, body, ctx, Number(m[1]));
    }
    if ((m = p.match(/\/qarz-daftari\/mijozlar\/(-?\d+)\/history$/))) return projectHistory(body, ctx, Number(m[1]));
    if ((m = p.match(/\/qarz-daftari\/mijozlar\/(-?\d+)\/yopish-info$/))) {
      return projectYopishInfo(url, body, ctx, Number(m[1]));
    }
    if ((m = p.match(/\/qarz-daftari\/qarz\/(-?\d+)\/kvitansiya$/))) return projectKvitansiya(body, ctx, Number(m[1]));
    if ((m = p.match(/\/qarz-daftari\/qarz\/(-?\d+)$/))) return projectQarz(body, ctx, Number(m[1]));
    if (/\/qarz-daftari\/qarzlar$/.test(p)) return projectQarzlar(url, body, ctx);
    if (/\/qarz-daftari\/dashboard$/.test(p)) return projectDashboard(url, body, ctx);
  } catch {
    // Proyeksiya xatosi hech qachon ekranni buzmasin — server/kesh javobi o'zgarishsiz.
    return body;
  }
  return body;
}

/** URL'da hal qilinmagan temp id bormi (tarmoqqa chiqmaslik uchun)? Hal qilingan bo'lsa — qayta yozilgan URL. */
export function rewriteTempUrl(url: string, resolve: (id: number) => number | undefined): { url: string; unresolved: boolean } {
  let unresolved = false;
  const out = url.replace(/\/(mijozlar|qarz)\/(-\d+)(?=\/|\?|$)/g, (_all, seg: string, raw: string) => {
    const r = resolve(Number(raw));
    if (r === undefined) {
      unresolved = true;
      return `/${seg}/${raw}`;
    }
    return `/${seg}/${r}`;
  });
  return { url: out, unresolved };
}
