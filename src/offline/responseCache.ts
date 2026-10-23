/**
 * ResponseCache — Qarz daftari GET javoblarining DOIMIY keshi (oflayn o'qish uchun).
 *
 * - Asosiy SHIFRLANGAN `storage` da (logout'dagi `clearAll()` bilan o'chadi — PII qolmaydi).
 * - Kalit aktor bo'yicha: boshqa sessiya (xodim/ega, boshqa foydalanuvchi) keshi hech qachon o'qilmaydi.
 * - Cheklovlar: yozuv ≤ 512 KB, jami ≤ 6 MB, ≤ 250 yozuv (LRU — eng eski ishlatilgan o'chiriladi),
 *   30 kundan eski yozuv qaytarilmaydi.
 * - Indeks bitta kalitda (url-hash -> {size, at}); yozuvlar alohida kalitlarda (katta JSON'ni
 *   har o'qishda butunlay parse qilmaslik uchun).
 */
import { KV } from './types';

const PREFIX = 'qdc:v1:';
const INDEX_KEY = `${PREFIX}index`;
export const CACHE_LIMITS = {
  maxEntryBytes: 512 * 1024,
  maxTotalBytes: 6 * 1024 * 1024,
  maxEntries: 250,
  maxAgeMs: 30 * 24 * 3600 * 1000,
};

interface IndexEntry {
  size: number;
  at: number; // saqlangan vaqt
  used: number; // oxirgi foydalanish (LRU)
}
type Index = Record<string, IndexEntry>;

export interface CacheHit<T = unknown> {
  data: T;
  savedAt: number;
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

  private readIndex(kv: KV): Index {
    try {
      const raw = kv.getString(INDEX_KEY);
      return raw ? (JSON.parse(raw) as Index) : {};
    } catch {
      return {};
    }
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

  get<T = unknown>(actor: string, url: string): CacheHit<T> | null {
    const kv = this.kv();
    if (!kv || !actor) return null;
    const k = this.keyOf(actor, url);
    const idx = this.readIndex(kv);
    const meta = idx[k];
    if (!meta) return null;
    if (this.now() - meta.at > CACHE_LIMITS.maxAgeMs) {
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
      this.writeIndex(kv, { ...idx, [k]: { ...meta, used: this.now() } });
      return { data: parsed.d, savedAt: meta.at };
    } catch {
      this.remove(kv, idx, k);
      return null;
    }
  }

  set(actor: string, url: string, data: unknown): void {
    const kv = this.kv();
    if (!kv || !actor || data === undefined) return;
    let raw: string;
    try {
      raw = JSON.stringify({ a: actor, u: normalizeUrl(url), d: data });
    } catch {
      return;
    }
    if (raw.length > CACHE_LIMITS.maxEntryBytes) return; // juda katta javob keshlanmaydi
    const k = this.keyOf(actor, url);
    const t = this.now();
    let idx: Index = { ...this.readIndex(kv), [k]: { size: raw.length, at: t, used: t } };
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
    try {
      kv.delete(INDEX_KEY);
    } catch {
      /* ignore */
    }
  }
}
