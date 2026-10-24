/**
 * ResponseCache — Qarz daftari GET javoblarining DOIMIY keshi (oflayn o'qish uchun).
 *
 * - Asosiy SHIFRLANGAN `storage` da (logout'dagi `clearAll()` bilan o'chadi — PII qolmaydi).
 * - Kalit aktor bo'yicha: boshqa sessiya (xodim/ega, boshqa foydalanuvchi) keshi hech qachon o'qilmaydi.
 * - Cheklovlar: yozuv ≤ 1 MB, jami ≤ 6 MB, ≤ 1500 yozuv (LRU — eng eski ishlatilgan o'chiriladi),
 *   30 kundan eski yozuv qaytarilmaydi.
 * - Indeks bitta kalitda (url-hash -> {size, at, a, u}); yozuvlar alohida kalitlarda (katta JSON'ni
 *   har o'qishda butunlay parse qilmaslik uchun). 24.10: indeksda aktor (`a`) va URL (`u`) ham —
 *   `scan` (qardosh javoblardan hosil qilish) uchun; eski yozuvlarda yo'q bo'lsa yozuvdan o'qiladi.
 *
 * 24.10 — sinxrondan keyingi ESKI kesh (item 3): `done` amal outbox'da 24 soat turadi (DONE_TTL_MS),
 * kesh esa 30 kun. Shu 24 soat ichida eski javob ustiga `done` amal proyeksiya qilinadi (to'g'ri).
 * Amal tozalangach esa amaldan OLDIN saqlangan javob eski (to'lanmagan) qoldiqni ko'rsatardi.
 * Yechim: sinxron vaqtlari (`markSynced`) saqlanadi; amal tozalanishiga yaqinlashgan (TTL - 1 soat)
 * sinxron vaqtidan OLDIN saqlangan yozuv qaytarilmaydi va o'chiriladi (`staleBefore`). Oflaynda
 * noto'g'ri raqamdan ko'ra "ma'lumot yo'q" xavfsizroq; onlaynda ekran baribir yangilanadi.
 */
import { KV } from './types';

const PREFIX = 'qdc:v1:';
const INDEX_KEY = `${PREFIX}index`;
const SYNC_KEY = `${PREFIX}synced`;
export const CACHE_LIMITS = {
  maxEntryBytes: 1024 * 1024,
  maxTotalBytes: 6 * 1024 * 1024,
  maxEntries: 1500,
  maxAgeMs: 30 * 24 * 3600 * 1000,
};
/** outbox `DONE_TTL_MS` bilan bir xil (done amal shu muddatdan keyin tozalanadi). */
export const SYNC_MARK_TTL_MS = 24 * 3600 * 1000;
/** Tozalanishdan OLDINROQ eskirgan deb hisoblash zaxirasi (erta — xavfsiz, kech — noto'g'ri raqam). */
const STALE_SAFETY_MS = 3600 * 1000;
const MAX_SYNC_MARKS = 200;

interface IndexEntry {
  size: number;
  at: number; // saqlangan vaqt
  used: number; // oxirgi foydalanish (LRU)
  a?: string; // aktor (24.10)
  u?: string; // normalizeUrl (24.10)
}
type Index = Record<string, IndexEntry>;
type SyncMarks = Record<string, number[]>;

export interface CacheHit<T = unknown> {
  data: T;
  savedAt: number;
}

export interface ScanHit<T = unknown> extends CacheHit<T> {
  url: string;
}

/** djb2 — qisqa barqaror kalit (URL'da token yo'q, lekin uzun bo'lishi mumkin). */
const hash = (s: string): string => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

/** URL -> kesh kaliti: host olib tashlanadi, `_=` (cache-buster) parametri e'tiborsiz. */
export const normalizeUrl = (url: string): string => {
  const noHost = url.replace(/^https?:\/\/[^/]+/i, '');
  const [path, query = ''] = noHost.split('?');
  const params = query
    .split('&')
    .filter(p => p && !p.startsWith('_='))
    .sort();
  return params.length ? `${path}?${params.join('&')}` : path;
};

export class ResponseCache {
  constructor(private readonly kv: () => KV | undefined, private readonly now: () => number = () => Date.now()) {}

  private readJson<T>(kv: KV, key: string, fallback: T): T {
    try {
      const raw = kv.getString(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private readIndex(kv: KV): Index {
    return this.readJson<Index>(kv, INDEX_KEY, {});
  }

  private writeIndex(kv: KV, idx: Index): void {
    try {
      kv.set(INDEX_KEY, JSON.stringify(idx));
    } catch {
      /* ignore */
    }
  }

  private keyOf(actor: string, url: string): string {
    return hash(`${actor}|${normalizeUrl(url)}`);
  }

  /** Yozuvning aktor/URL'i (eski indeks yozuvida yo'q bo'lsa — yozuvning o'zidan). */
  private ownerOf(kv: KV, k: string, meta: IndexEntry): { a: string; u: string } | null {
    if (meta.a && meta.u) return { a: meta.a, u: meta.u };
    const parsed = this.readJson<{ a?: string; u?: string } | null>(kv, PREFIX + k, null);
    return parsed?.a && parsed?.u ? { a: parsed.a, u: parsed.u } : null;
  }

  get<T = unknown>(actor: string, url: string): CacheHit<T> | null {
    const kv = this.kv();
    if (!kv || !actor) return null;
    const k = this.keyOf(actor, url);
    const idx = this.readIndex(kv);
    const meta = idx[k];
    if (!meta) return null;
    if (this.now() - meta.at > CACHE_LIMITS.maxAgeMs || meta.at < this.staleBefore(actor)) {
      this.remove(kv, idx, k);
      return null;
    }
    try {
      const raw = kv.getString(PREFIX + k);
      if (!raw) {
        this.remove(kv, idx, k);
        return null;
      }
      const parsed = JSON.parse(raw) as { a: string; u: string; d: T };
      // Hash to'qnashuvi himoyasi: aktor va URL aynan mos bo'lishi shart.
      if (parsed.a !== actor || parsed.u !== normalizeUrl(url)) return null;
      this.writeIndex(kv, { ...idx, [k]: { ...meta, used: this.now(), a: actor, u: parsed.u } });
      return { data: parsed.d, savedAt: meta.at };
    } catch {
      this.remove(kv, idx, k);
      return null;
    }
  }

  /**
   * 24.10: aktorning yo'li `pathRe` ga mos (normalizeUrl ustida) barcha yaroqli yozuvlari — qardosh
   * javoblardan ma'lumot hosil qilish uchun. LRU vaqti yangilanmaydi (fon o'qish).
   */
  scan<T = unknown>(actor: string, pathRe: RegExp): ScanHit<T>[] {
    const kv = this.kv();
    if (!kv || !actor) return [];
    const idx = this.readIndex(kv);
    const stale = this.staleBefore(actor);
    const t = this.now();
    const out: ScanHit<T>[] = [];
    let backfill: Index | null = null;
    Object.entries(idx).forEach(([k, meta]) => {
      if (meta.a && meta.a !== actor) return;
      if (t - meta.at > CACHE_LIMITS.maxAgeMs || meta.at < stale) return;
      if (meta.u && !pathRe.test(meta.u)) return;
      const parsed = this.readJson<{ a?: string; u?: string; d?: T } | null>(kv, PREFIX + k, null);
      if (!parsed?.a || !parsed?.u) return;
      if (!meta.a) backfill = { ...(backfill || idx), [k]: { ...meta, a: parsed.a, u: parsed.u } };
      if (parsed.a !== actor || !pathRe.test(parsed.u)) return;
      out.push({ url: parsed.u, data: parsed.d as T, savedAt: meta.at });
    });
    if (backfill) this.writeIndex(kv, backfill);
    return out;
  }

  set(actor: string, url: string, data: unknown): void {
    const kv = this.kv();
    if (!kv || !actor || data === undefined) return;
    const u = normalizeUrl(url);
    let raw: string;
    try {
      raw = JSON.stringify({ a: actor, u, d: data });
    } catch {
      return;
    }
    if (raw.length > CACHE_LIMITS.maxEntryBytes) return; // juda katta javob keshlanmaydi
    const k = this.keyOf(actor, url);
    const t = this.now();
    let idx: Index = { ...this.readIndex(kv), [k]: { size: raw.length, at: t, used: t, a: actor, u } };
    try {
      kv.set(PREFIX + k, raw);
    } catch {
      return;
    }
    idx = this.evict(kv, idx, k);
    this.writeIndex(kv, idx);
  }

  /** LRU bo'yicha limitlarga tushirish (hozirgina yozilgan `keep` saqlanadi). */
  private evict(kv: KV, idx: Index, keep: string): Index {
    const next = { ...idx };
    let total = Object.values(next).reduce((s, e) => s + e.size, 0);
    const order = Object.entries(next)
      .filter(([k]) => k !== keep)
      .sort((a, b) => a[1].used - b[1].used)
      .map(([k]) => k);
    for (const k of order) {
      const count = Object.keys(next).length;
      if (total <= CACHE_LIMITS.maxTotalBytes && count <= CACHE_LIMITS.maxEntries) break;
      total -= next[k].size;
      delete next[k];
      try {
        kv.delete(PREFIX + k);
      } catch {
        /* ignore */
      }
    }
    return next;
  }

  private remove(kv: KV, idx: Index, k: string): void {
    const next = { ...idx };
    delete next[k];
    try {
      kv.delete(PREFIX + k);
    } catch {
      /* ignore */
    }
    this.writeIndex(kv, next);
  }

  /** 24.10: aktorning `ts` dan OLDIN saqlangan barcha yozuvlarini o'chirish. @returns o'chirilganlar soni */
  invalidateOlderThan(actor: string, ts: number): number {
    const kv = this.kv();
    if (!kv || !actor || !(ts > 0)) return 0;
    const idx = this.readIndex(kv);
    const next = { ...idx };
    let n = 0;
    Object.entries(idx).forEach(([k, meta]) => {
      if (meta.at >= ts) return;
      const owner = this.ownerOf(kv, k, meta);
      if (owner && owner.a !== actor) return;
      delete next[k];
      n += 1;
      try {
        kv.delete(PREFIX + k);
      } catch {
        /* ignore */
      }
    });
    if (n) this.writeIndex(kv, next);
    return n;
  }

  /** 24.10: aktorning amali serverga yetgan vaqtini qayd qilish (idempotent). */
  markSynced(actor: string, doneAt: number): void {
    const kv = this.kv();
    if (!kv || !actor || !(doneAt > 0)) return;
    const marks = this.readJson<SyncMarks>(kv, SYNC_KEY, {});
    const cur = Array.isArray(marks[actor]) ? marks[actor] : [];
    if (cur.includes(doneAt)) return;
    const minAt = this.now() - CACHE_LIMITS.maxAgeMs;
    const list = [...cur, doneAt].filter(x => x >= minAt).sort((a, b) => a - b).slice(-MAX_SYNC_MARKS);
    try {
      kv.set(SYNC_KEY, JSON.stringify({ ...marks, [actor]: list }));
    } catch {
      /* ignore */
    }
  }

  /**
   * 24.10: shu vaqtdan OLDIN saqlangan yozuv eskirgan — uni tuzatadigan `done` amal outbox'dan
   * tozalangan (yoki tozalanishiga ≤ 1 soat qolgan). 0 — eskirgan yozuv yo'q.
   */
  staleBefore(actor: string): number {
    const kv = this.kv();
    if (!kv || !actor) return 0;
    const list = this.readJson<SyncMarks>(kv, SYNC_KEY, {})[actor];
    if (!Array.isArray(list)) return 0;
    const cutoff = this.now() - (SYNC_MARK_TTL_MS - STALE_SAFETY_MS);
    return list.reduce((m, d) => (d <= cutoff && d > m ? d : m), 0);
  }

  stats(): { entries: number; bytes: number } {
    const kv = this.kv();
    if (!kv) return { entries: 0, bytes: 0 };
    const idx = this.readIndex(kv);
    const vals = Object.values(idx);
    return { entries: vals.length, bytes: vals.reduce((s, e) => s + e.size, 0) };
  }

  clear(): void {
    const kv = this.kv();
    if (!kv) return;
    const idx = this.readIndex(kv);
    Object.keys(idx).forEach(k => {
      try {
        kv.delete(PREFIX + k);
      } catch {
        /* ignore */
      }
    });
    [INDEX_KEY, SYNC_KEY].forEach(k => {
      try {
        kv.delete(k);
      } catch {
        /* ignore */
      }
    });
  }
}
