/**
 * Projection — sinxronlanmagan amallarni server (yoki kesh) javobi USTIGA optimistik qo'yish.
 *
 * Sof funksiyalar: (url, body, ctx) -> yangi body (kirish o'zgarmaydi). Natijadagi lokal yozuvlarda
 * `_offline` (amal holati: pending|syncing|failed|blocked) va `_opId` maydonlari bor — ekranlar
 * "Sinxronlanmagan" / "Xato" nishonini shu bo'yicha ko'rsatadi.
 *
 * Qoidalar:
 *  - Yaratilgan obyektlar (mijoz, qarz) har qanday faol holatda KO'RINADI (failed bo'lsa ham — foydalanuvchi topib hal qilsin).
 *    24.10: rad etilgan/bloklangan qarz `status: 'offline_failed'` — ro'yxatda bor, lekin jami/taqsimotda YO'Q.
 *  - Summaga ta'sir faqat `pending`/`syncing`/`done` amallardan (rad etilgan qaytarish qoldiqni kamaytirmaydi).
 *  - Qaytarish taqsimoti backend `repayment.service` (planAllocation) bilan bir xil: mijozning shu
 *    turi+valyutadagi BARCHA aktiv qarzlari bo'ylab, avval oddiy, so'ng bo'lib to'lash; muddati yaqinidan.
 *    Voz kechish — faqat muddat bo'yicha (backend vozKechish). Qardosh qarzlar manbai — keshdagi mijoz
 *    tarixi (`ctx.cached`). Bu faqat KO'RINISH — haqiqat sinxrondan keyin serverdan.
 *
 * Fayl hajmi (~1250 qator, 800 chegaradan oshiq) ataylab: barcha endpoint proyeksiyalari bitta taqsimlash yadrosiga
 * (applyRepayment / customerDebts) tayanadi — bo'lib tashlansa aylanma import paydo bo'ladi.
 */
import { normalizeUrl } from './responseCache';
import { tkYmdFromMs } from '../helper/date';
import { toFiniteNum } from '../helper/num';
import { OutboxOp, Turi, Valyuta } from './types';

// Server JSON'i dinamik — bu modulda ataylab keng tur (faqat shu yerda).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

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
const EPS = 0.0001;
const DAY_MS = 86400000;
const NEAR_WINDOW_DAYS = 30;
const NEAR_LIMIT = 20;
const FULL_CLOSE = 1e12;
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
export const num = toFiniteNum;
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

/** Server id (temp bo'lsa xaritadan); hal qilinmagan temp — undefined. */
const serverIdOf = (ctx: ProjectionCtx, id: unknown): number | undefined => {
  const n = Number(id);
  if (!Number.isFinite(n) || n === 0) return undefined;
  return n < 0 ? ctx.resolve(n) : n;
};

/** URL'ning `/qarz-daftari/` dan oldingi qismi (kesh kalitlari shu prefiks bilan: `/api`). */
const apiPrefix = (url: string): string => {
  const p = normalizeUrl(url).split('?')[0];
  const i = p.indexOf('/qarz-daftari/');
  return i >= 0 ? p.slice(0, i) : '';
};

/** Toshkent (UTC+5) bo'yicha 'YYYY-MM-DD' (backend tkYmd/tkYmdOf bilan bir xil). */
export const tkYmdOf = (v: unknown): string | null => {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const t = typeof v === 'number' ? v : new Date(s).getTime();
  return Number.isFinite(t) ? tkYmdFromMs(t) : null;
};
const daysBetween = (fromYmd: string, toYmd: string): number =>
  Math.round((Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`)) / DAY_MS);

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

const byTartib = (a: Json, b: Json): number => num(a.tartib_raqami) - num(b.tartib_raqami);

/**
 * 24.10: backend `markInstallmentsPaid` — qaytarish bo'lib to'lash qarziga tushganda to'lanmagan bo'laklar
 * tartib bo'yicha `amount` gacha 'tolandi'; qisman — bo'lak summasi kamayadi; `closeAll` (qarz yopildi) —
 * barcha to'lanmaganlar 'tolandi'. Kirish tartibi saqlanadi.
 */
export function markInstallmentsPaid(tolovlar: Json[], amount: number, closeAll: boolean, opStatus: string): Json[] {
  const patch = new Map<Json, Json>();
  let left = amount;
  for (const t of tolovlar.filter(x => x.status !== 'tolandi').sort(byTartib)) {
    if (closeAll) {
      patch.set(t, { ...t, status: 'tolandi', _offline: opStatus });
      continue;
    }
    if (left <= EPS) break;
    const ts = num(t.summa);
    if (ts <= left + EPS) {
      patch.set(t, { ...t, status: 'tolandi', _offline: opStatus });
      left = round2(left - ts);
    } else {
      patch.set(t, { ...t, summa: round2(ts - left), _offline: opStatus });
      left = 0;
    }
  }
  return patch.size ? tolovlar.map(t => patch.get(t) ?? t) : tolovlar;
}

/**
 * Bo'lak to'lovi sharsharasi (backend tolovTolandi): avval tanlangan bo'lak (yetmasa — summasi kamayadi),
 * ortiqchasi BOSHQA barcha to'lanmagan bo'laklarga tartib_raqami bo'yicha (24.10: oldingilari ham —
 * backend `keyingilar` faqat tanlanganni chiqarib tashlaydi). Tanlangan allaqachon to'langan — o'zgarishsiz.
 */
export function payInstallments(tolovlar: Json[], tolovId: number, summa: number, status: string): Json[] {
  const chosen = tolovlar.find(t => Number(t.id) === Number(tolovId));
  if (!chosen || chosen.status === 'tolandi') return tolovlar;
  const patch = new Map<Json, Json>();
  const ts = num(chosen.summa);
  let left = summa;
  if (left >= ts - EPS) {
    left = round2(left - ts);
    patch.set(chosen, { ...chosen, status: 'tolandi', _offline: status });
  } else {
    patch.set(chosen, { ...chosen, summa: round2(ts - left), _offline: status });
    left = 0;
  }
  for (const t of tolovlar.filter(x => x !== chosen && x.status !== 'tolandi').sort(byTartib)) {
    if (left <= EPS) break;
    const s = num(t.summa);
    if (left >= s - EPS) {
      left = round2(left - s);
      patch.set(t, { ...t, status: 'tolandi', _offline: status });
    } else {
      patch.set(t, { ...t, summa: round2(s - left), _offline: status });
      left = 0;
    }
  }
  return tolovlar.map(t => patch.get(t) ?? t);
}

// ---------------------------------------------------------------------------
// Lokal yozuvlar (amaldan)
// ---------------------------------------------------------------------------
type QarzCreateOp = Extract<OutboxOp, { kind: 'qarz.create' }>;
type MijozCreateOp = Extract<OutboxOp, { kind: 'mijoz.create' }>;
type RepayOp = Extract<OutboxOp, { kind: 'qarz.yopish' | 'mijoz.yopish' | 'qarz.vozKechish' | 'tolov.tolandi' }>;

const isRepay = (op: OutboxOp): op is RepayOp =>
  op.kind === 'qarz.yopish' || op.kind === 'mijoz.yopish' || op.kind === 'qarz.vozKechish' || op.kind === 'tolov.tolandi';
const isCreate = (op: OutboxOp): op is QarzCreateOp => op.kind === 'qarz.create';

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
function applyAll(rows: Json[], ops: OutboxOp[], ctx: ProjectionCtx): { rows: Json[]; anchors: Map<string, unknown> } {
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
function withCreates(rows: Json[], ops: OutboxOp[], ctx: ProjectionCtx, mijozId: unknown): Json[] {
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
function siblingSrc(url: string, ctx: ProjectionCtx, mijozId: unknown): SiblingSrc | null {
  const id = serverIdOf(ctx, mijozId);
  if (!ctx.cached || id === undefined) return null;
  const hit = ctx.cached(`${apiPrefix(url)}/qarz-daftari/mijozlar/${id}/history`);
  const h = hit?.data?.data;
  if (!hit || !h || !Array.isArray(h.qarzlar)) return null;
  return { rows: h.qarzlar, savedAt: hit.savedAt, ops: hit.ops, mijoz: h.mijoz };
}

/** Mijoz serverda yo'q (oflayn yaratilgan, hali xaritalanmagan) — barcha qarzlari navbatda. */
const isLocalOnlyCustomer = (ctx: ProjectionCtx, mijozId: unknown): boolean =>
  Number(mijozId) < 0 && ctx.resolve(Number(mijozId)) === undefined;

interface DebtSet {
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
function customerDebts(primary: Json[], src: SiblingSrc | null, ctx: ProjectionCtx, mijozId: unknown): DebtSet {
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

/** Mijoz tarixi stats — backend mijozlar.controller.history bilan bir xil formula. */
export function computeHistoryStats(allQarzlar: Json[], tranzaksiyalar: Json[], opts: { vozFromRows?: boolean } = {}): Json {
  // 24.10: rad etilgan oflayn qarz serverda yo'q — hisobga kirmaydi.
  const qarzlar = allQarzlar.filter(q => q.status !== OFFLINE_FAILED);
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
    if (tr.turi !== 'voz_kechish' || opts.vozFromRows) return;
    const turi = turiOf.get(String(tr.qarz_id));
    if (!turi) return;
    const key = turi === 'berish' ? 'voz_kechilgan_berilgan' : 'voz_kechilgan_olingan';
    s[key][curKey(tr.valyuta)] += num(tr.summa);
  });
  // Tarix ro'yxatlardan hosil qilinganda (ledger yo'q) — FAQAT qatordagi `voz_kechilgan` (qarzlar ro'yxati
  // maydoni; oflayn voz kechish ham shunga qo'shiladi — tranzaksiya bilan ikki marta sanalmaydi).
  if (opts.vozFromRows) {
    qarzlar.forEach(q => {
      const key = q.turi === 'berish' ? 'voz_kechilgan_berilgan' : 'voz_kechilgan_olingan';
      s[key][curKey(q.valyuta)] += num(q.voz_kechilgan);
    });
  }
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
const qarzCreates = (ctx: ProjectionCtx): QarzCreateOp[] => ctx.ops.filter(isCreate);
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

/**
 * 24.10 (do'kon doirasi): `faoliyat_id` bo'lsa — faqat shu do'kon. "Barcha do'konlar" rejimida backend
 * faqat O'Z do'konlarini qaytaradi (xodim bo'lgan begona do'kon qo'shilmaydi) — keshdagi do'konlar
 * ro'yxatidan (`is_xodim_role`) aniqlanadi; ro'yxat keshda yo'q bo'lsa filtr yo'q.
 */
function shopScope(url: string, ctx: ProjectionCtx): (fid: unknown) => boolean {
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
const opMijoz = (op: RepayOp, rows: Json[], ctx: ProjectionCtx): number | undefined => repayScope(op, rows, ctx).mijozId;

/** Amallar tegadigan mijozlar (takrorsiz; temp va server id bir xil hisoblanadi). */
function touchedCustomers(ops: OutboxOp[], rows: Json[], ctx: ProjectionCtx): number[] {
  const out: number[] = [];
  ops.forEach(op => {
    let m: number | undefined;
    if (isRepay(op) && isEffective(op)) m = opMijoz(op, rows, ctx);
    else if (isCreate(op)) m = Number(op.payload.body.mijoz_id);
    if (m !== undefined && Number.isFinite(m) && !out.some(x => sameId(ctx, x, m))) out.push(m);
  });
  return out;
}

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

const txsOnlyNew = (rows: Json[], existing: Json[]): Json[] => rows.filter(r => !existing.some(e => e.id === r.id));

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

function projectQarz(url: string, body: Json, ctx: ProjectionCtx, qarzId: number): Json {
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

function projectKvitansiya(url: string, body: Json, ctx: ProjectionCtx, qarzId: number): Json {
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
      ...(h._derived ? { _derived: true } : {}),
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

/** Ro'yxat holat filtriga mosmi (rad etilgan oflayn qarz — har doim ko'rinadi). */
const matchesStatus = (r: Json, status: string | undefined): boolean => {
  if (!status || r.status === OFFLINE_FAILED) return true;
  if (status === 'aktiv' || status === 'muddati-otgan' || status === 'muddati-oz-qolgan') return r.status === 'aktiv';
  return r.status === status;
};

function projectQarzlar(url: string, body: Json, ctx: ProjectionCtx): Json {
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

function projectDashboard(url: string, body: Json, ctx: ProjectionCtx): Json {
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
function projectNearExpiration(url: string, body: Json, ctx: ProjectionCtx): Json {
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
    if ((m = p.match(/\/qarz-daftari\/qarz\/(-?\d+)\/kvitansiya$/))) return projectKvitansiya(url, body, ctx, Number(m[1]));
    if ((m = p.match(/\/qarz-daftari\/qarz\/(-?\d+)$/))) return projectQarz(url, body, ctx, Number(m[1]));
    if (/\/qarz-daftari\/qarzlar$/.test(p)) return projectQarzlar(url, body, ctx);
    if (/\/qarz-daftari\/dashboard$/.test(p)) return projectDashboard(url, body, ctx);
    if (/\/qarz-daftari\/near-expiration$/.test(p)) return projectNearExpiration(url, body, ctx);
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
