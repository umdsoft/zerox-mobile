/**
 * Derive — keshda YO'Q javobni boshqa saqlangan ("qardosh") javoblardan hosil qilish (24.10).
 *
 * Oflaynda hech ochilmagan sahifa bo'sh ko'rinmasin:
 *  - `/mijozlar/:id/history`  <- keshdagi `/qarzlar?...` ro'yxatlari (mijoz qarzlari) + `/savdo-faoliyat/:fid/mijozlar`
 *  - `/mijozlar/:id/yopish-info` <- tarix (keshdagi yoki hosil qilingan)
 *  - `/qarz/:id`              <- keshdagi tarix qatori (tranzaksiyalari bilan) yoki ro'yxat qatori
 *  - `/qarz/:id/kvitansiya`   <- qarz tafsiloti (keshdagi yoki hosil qilingan)
 * Hosil qilingan body'da `_derived: true` — ekran "to'liq bo'lmagan ma'lumot" eslatmasini ko'rsatadi.
 * `savedAt` — ishlatilgan manbalarning ENG ESKISI (proyeksiya undan keyingi amallarni qo'yadi).
 * Sof modul: manbalar `DeriveSources` orqali (testda xotira keshi).
 */
import { computeHistoryStats, yopishInfoFromHistory } from './projection';
import { CacheHit, normalizeUrl, ScanHit } from './responseCache';
import { Turi } from './types';
import { toFiniteNum } from '../helper/num';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export interface DeriveSources {
  get: (url: string) => CacheHit<Json> | null;
  scan: (pathRe: RegExp) => ScanHit<Json>[];
  ownerName?: string;
}

const MAX_DEPTH = 3;
const LIST_RE = /\/qarz-daftari\/qarzlar(?:\?|$)/;
const MIJOZLAR_RE = /\/qarz-daftari\/savdo-faoliyat\/\d+\/mijozlar(?:\?|$)/;
const HISTORY_RE = /\/qarz-daftari\/mijozlar\/\d+\/history$/;

export const num = toFiniteNum;
const rowsOf = (hit: ScanHit<Json>): Json[] => (Array.isArray(hit.data?.data) ? hit.data.data : []);
const isDebtRow = (r: Json): boolean => !!r && r.id !== undefined && r.turi !== undefined && r.qoldiq !== undefined;

/** Bir nechta manbadan bir xil id'li qatorlar — eng yangi saqlangani olinadi. */
function newestById(hits: ScanHit<Json>[], pick: (r: Json) => boolean): { rows: Json[]; used: number[] } {
  const best = new Map<string, { row: Json; at: number }>();
  const used = new Set<number>();
  hits.forEach(h =>
    rowsOf(h)
      .filter(pick)
      .forEach(r => {
        used.add(h.savedAt);
        const cur = best.get(String(r.id));
        if (!cur || h.savedAt > cur.at) best.set(String(r.id), { row: r, at: h.savedAt });
      }),
  );
  return { rows: Array.from(best.values()).map(v => v.row), used: Array.from(used) };
}

const createdDesc = (a: Json, b: Json): number =>
  String(b.created_at || '').localeCompare(String(a.created_at || '')) || num(b.id) - num(a.id);

/** Mijoz tarixi — keshdagi qarzlar ro'yxatlari va mijozlar ro'yxatidan. */
export function historyFromLists(mijozId: number, src: DeriveSources): CacheHit<Json> | null {
  const { rows, used } = newestById(
    src.scan(LIST_RE),
    r => isDebtRow(r) && Number(r.mijoz_id ?? r.mijoz?.id) === mijozId,
  );
  const customers = newestById(src.scan(MIJOZLAR_RE), r => Number(r?.id) === mijozId);
  const listMijoz = customers.rows[0];
  const rowMijoz = rows.find(r => r.mijoz)?.mijoz;
  if (!listMijoz && !rowMijoz) return null;
  const m = { ...(rowMijoz || {}), ...(listMijoz || {}) };
  const fid = m.savdo_faoliyat_id ?? rows[0]?.savdo_faoliyat_id ?? null;
  const qarzlar = rows.map(r => ({ ...r, mijoz_id: mijozId })).sort(createdDesc);
  const times = [...used, ...(listMijoz ? customers.used : [])];
  return {
    savedAt: Math.min(...times),
    data: {
      success: true,
      data: {
        mijoz: {
          id: mijozId,
          fish: m.fish || '',
          telefon: m.telefon ?? null,
          savdo_faoliyat_id: fid,
          savdoFaoliyat: m.savdoFaoliyat ?? (rows[0]?.savdoFaoliyat ? { nomi: rows[0].savdoFaoliyat.nomi } : null),
          created_at: m.created_at ?? null,
        },
        stats: computeHistoryStats(qarzlar, [], { vozFromRows: true }),
        qarzlar,
        tranzaksiyalar: [],
        _derived: true,
        // Mijozlar ro'yxatida aktiv qarzi bor, lekin qatorlari keshda yo'q — ataylab belgilanadi.
        ...(num(listMijoz?.aktiv_qarz_soni) > qarzlar.filter(q => q.status === 'aktiv').length ? { _partial: true } : {}),
      },
    },
  };
}

/** Bitta qarz tafsiloti — keshdagi tarix (tranzaksiyalari bilan) yoki ro'yxat qatoridan. */
export function debtFromCache(qarzId: number, src: DeriveSources): CacheHit<Json> | null {
  const fromHistory = src
    .scan(HISTORY_RE)
    .map(h => ({ h, row: (h.data?.data?.qarzlar || []).find((q: Json) => Number(q.id) === qarzId) }))
    .filter(x => !!x.row)
    .sort((a, b) => b.h.savedAt - a.h.savedAt)[0];
  let row: Json;
  let mijoz: Json;
  let txs: Json[] = [];
  let savedAt: number;
  if (fromHistory) {
    const h = fromHistory.h.data.data;
    row = fromHistory.row;
    mijoz = h.mijoz;
    txs = (h.tranzaksiyalar || []).filter((t: Json) => Number(t.qarz_id) === qarzId);
    savedAt = fromHistory.h.savedAt;
  } else {
    const hits = src.scan(LIST_RE);
    const best = newestById(hits, r => isDebtRow(r) && Number(r.id) === qarzId);
    if (!best.rows.length) return null;
    row = best.rows[0];
    mijoz = row.mijoz;
    savedAt = Math.max(...best.used);
  }
  return {
    savedAt,
    data: {
      success: true,
      data: {
        ...row,
        mijoz: mijoz ? { id: mijoz.id ?? row.mijoz_id, fish: mijoz.fish || '', telefon: mijoz.telefon ?? null } : null,
        tolovlar: Array.isArray(row.tolovlar) ? row.tolovlar : [],
        tranzaksiyalar: txs,
        savdoFaoliyat: row.savdoFaoliyat ?? (row.savdo_faoliyat_nomi ? { id: row.savdo_faoliyat_id, nomi: row.savdo_faoliyat_nomi } : null),
        _derived: true,
      },
      reliability: { level: 'none', total: 0, on_time: 0, late: 0 },
    },
  };
}

/** Kvitansiya — qarz tafsilotidan (backend kvitansiya shakli). */
export function kvitansiyaFromDebt(qarzBody: Json, ownerName: string): Json {
  const q = qarzBody?.data;
  if (!q || q.miqdor === undefined) return null;
  const mijoz = q.mijoz?.fish || '';
  return {
    success: true,
    data: {
      turi: q.turi,
      qarz_oluvchi: q.turi === 'berish' ? mijoz : ownerName,
      qarz_beruvchi: q.turi === 'berish' ? ownerName : mijoz,
      miqdor: q.miqdor,
      qoldiq: q.qoldiq,
      valyuta: q.valyuta,
      mahsulot_nomi: q.mahsulot_nomi,
      berilgan_sana: q.berilgan_sana,
      yaratilgan_vaqt: q.created_at,
      qaytarish_sanasi: q.qaytarish_sanasi,
      bolib_tolash: q.bolib_tolash,
      oylar_soni: q.oylar_soni,
      tolovlar: Array.isArray(q.tolovlar) ? q.tolovlar : [],
      qaytarilgan: num(q.miqdor) - num(q.qoldiq),
      _derived: true,
    },
  };
}

/**
 * URL uchun hosil qilingan javob (keshda yo'q bo'lganda). Manba ham keshda bo'lmasa — o'zi ham
 * hosil qilinadi (masalan yopish-info <- tarix <- ro'yxatlar). Topilmasa null.
 */
export function deriveCached(url: string, src: DeriveSources, depth = 0): CacheHit<Json> | null {
  if (depth > MAX_DEPTH) return null;
  const norm = normalizeUrl(url);
  const path = norm.split('?')[0];
  const getOrDerive = (u: string) => src.get(u) ?? deriveCached(u, src, depth + 1);
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^(.*\/qarz-daftari\/mijozlar\/\d+)\/yopish-info$/))) {
    const h = getOrDerive(`${m[1]}/history`);
    const turi: Turi = /(?:^|[?&])turi=olish(?:&|$)/.test(norm) ? 'olish' : 'berish';
    const data = h ? yopishInfoFromHistory(h.data, turi) : null;
    return data && h ? { data, savedAt: h.savedAt } : null;
  }
  if ((m = path.match(/\/qarz-daftari\/mijozlar\/(\d+)\/history$/))) return historyFromLists(Number(m[1]), src);
  if ((m = path.match(/^(.*\/qarz-daftari\/qarz\/\d+)\/kvitansiya$/))) {
    const q = getOrDerive(m[1]);
    const data = q ? kvitansiyaFromDebt(q.data, src.ownerName || '') : null;
    return data && q ? { data, savedAt: q.savedAt } : null;
  }
  if ((m = path.match(/\/qarz-daftari\/qarz\/(\d+)$/))) return debtFromCache(Number(m[1]), src);
  return null;
}
