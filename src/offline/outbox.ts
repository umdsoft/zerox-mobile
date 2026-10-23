/**
 * Outbox — oflayn amallar navbati (doimiy, shifrlangan MMKV'da; testda xotira KV).
 *
 * - Holat bitta JSON kalitida: { v, ops[], idMap{temp->server}, tempSeq }.
 * - Har o'zgarish o'zgarmas (immutable) yangi holat yaratadi, saqlaydi va tinglovchilarni xabardor qiladi.
 * - Temp id'lar MANFIY butun sonlar (mavjud ekranlar `Number(id)` bilan ishlaydi).
 * - Hech qachon faol (pending/failed/blocked) amalni o'zi o'chirmaydi — faqat foydalanuvchi
 *   "Bekor qilish" bilan, yoki BOSHQA aktorniki 30 kundan eskirganda.
 */
import { ACTIVE_STATUSES, KV, NewOp, OutboxOp, OpStatus } from './types';

export const OUTBOX_KEY = 'outbox:v1';
export const MAX_ACTIVE_OPS = 500;
const DONE_TTL_MS = 24 * 3600 * 1000;
const IDMAP_TTL_MS = 30 * 24 * 3600 * 1000;
const FOREIGN_TTL_MS = 30 * 24 * 3600 * 1000;

export interface IdMapEntry {
  id: number;
  at: number;
}

export interface OutboxState {
  v: 1;
  ops: OutboxOp[];
  idMap: Record<string, IdMapEntry>;
  tempSeq: number;
}

const emptyState = (): OutboxState => ({ v: 1, ops: [], idMap: {}, tempSeq: 0 });

export class OutboxFullError extends Error {
  constructor() {
    super('OUTBOX_FULL');
    this.name = 'OutboxFullError';
  }
}

type Listener = (s: OutboxState) => void;

export interface OutboxDeps {
  kv: KV;
  now?: () => number;
  uuid: () => string;
}

export class Outbox {
  private state: OutboxState;
  private readonly kv: KV;
  private readonly now: () => number;
  private readonly uuid: () => string;
  private readonly listeners = new Set<Listener>();

  constructor({ kv, now, uuid }: OutboxDeps) {
    this.kv = kv;
    this.now = now || (() => Date.now());
    this.uuid = uuid;
    this.state = this.load();
  }

  // ---------- saqlash ----------
  /** O'qib bo'lmagan navbatni o'chirmasdan zaxiraga ko'chiradi (qo'lda tiklash mumkin bo'lsin). */
  private backupCorrupt(raw: string): void {
    try {
      this.kv.set(`${OUTBOX_KEY}:corrupt:${this.now()}`, raw);
    } catch {
      /* zaxira ham bo'lmasa — hech bo'lmaganda ilova ishlasin */
    }
  }

  private load(): OutboxState {
    let raw: string | undefined;
    try {
      raw = this.kv.getString(OUTBOX_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as Partial<OutboxState>;
      if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.ops)) {
        this.backupCorrupt(raw);
        return emptyState();
      }
      // Ilova "syncing" paytida yopilgan/qulagan bo'lsa — qayta navbatga (kalit o'sha: server takrorlamaydi).
      const ops = parsed.ops.map(op =>
        op.status === 'syncing' ? ({ ...op, status: 'pending' as OpStatus } as OutboxOp) : op,
      );
      return {
        v: 1,
        ops,
        idMap: parsed.idMap && typeof parsed.idMap === 'object' ? parsed.idMap : {},
        tempSeq: Number(parsed.tempSeq) || 0,
      };
    } catch {
      // Buzilgan JSON (amalda bo'lmaydi; MMKV atomik yozadi) — zaxiraga, so'ng yangidan.
      if (raw) this.backupCorrupt(raw);
      return emptyState();
    }
  }

  private commit(next: OutboxState): void {
    this.state = next;
    try {
      this.kv.set(OUTBOX_KEY, JSON.stringify(next));
    } catch {
      // Saqlash xatosi xotiradagi holatni buzmasin; keyingi commit qayta urinadi.
    }
    this.listeners.forEach(fn => {
      try {
        fn(next);
      } catch {
        /* tinglovchi xatosi navbatga ta'sir qilmaydi */
      }
    });
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  getState(): OutboxState {
    return this.state;
  }

  /** Disk'dagi holatni qayta o'qish (masalan boshqa instansiya yozgan bo'lsa). */
  reload(): void {
    this.commit(this.load());
  }

  // ---------- o'qish ----------
  list(actor?: string): OutboxOp[] {
    return actor ? this.state.ops.filter(o => o.actor === actor) : this.state.ops.slice();
  }

  get(id: string): OutboxOp | undefined {
    return this.state.ops.find(o => o.id === id);
  }

  activeOps(actor: string): OutboxOp[] {
    return this.state.ops.filter(o => o.actor === actor && ACTIVE_STATUSES.has(o.status));
  }

  /** Temp id -> server id (bo'lmasa undefined). Musbat id o'zgarishsiz qaytadi. */
  resolveId(id: number): number | undefined {
    if (!(id < 0)) return id;
    const hit = this.state.idMap[String(id)];
    return hit ? hit.id : undefined;
  }

  /** Server id -> temp id (ekran temp id bilan ochilgan bo'lsa, xaritalangandan keyin ham topish uchun). */
  tempIdFor(serverId: number): number | undefined {
    const e = Object.entries(this.state.idMap).find(([, v]) => v.id === serverId);
    return e ? Number(e[0]) : undefined;
  }

  // ---------- yozish ----------
  nextTempId(): number {
    const seq = this.state.tempSeq + 1;
    this.commit({ ...this.state, tempSeq: seq });
    return -seq;
  }

  /**
   * @param initialStatus 'syncing' — onlayn to'g'ridan-to'g'ri yuborishda: amal AVVAL saqlanadi
   *   (so'rov paytida ilova yopilsa, keyingi ishga tushishda o'sha kalit bilan qayta yuboriladi),
   *   lekin fon sinxroni uni ikkinchi marta yubormaydi.
   */
  enqueue(input: NewOp, actor: string, initialStatus: 'pending' | 'syncing' = 'pending'): OutboxOp {
    const active = this.state.ops.filter(o => ACTIVE_STATUSES.has(o.status)).length;
    if (active >= MAX_ACTIVE_OPS) throw new OutboxFullError();
    const op = {
      ...input,
      id: this.uuid(),
      actor,
      createdAt: this.now(),
      deps: (input.deps || []).filter(d => d < 0),
      status: initialStatus,
      attempts: 0,
      nextAttemptAt: 0,
    } as OutboxOp;
    this.commit({ ...this.state, ops: [...this.state.ops, op] });
    return op;
  }

  update(id: string, patch: Partial<OutboxOp>): OutboxOp | undefined {
    let updated: OutboxOp | undefined;
    const ops = this.state.ops.map(o => {
      if (o.id !== id) return o;
      updated = { ...o, ...patch } as OutboxOp;
      return updated;
    });
    if (updated) this.commit({ ...this.state, ops });
    return updated;
  }

  mapId(tempId: number, serverId: number): void {
    if (!(tempId < 0) || !(serverId > 0)) return;
    this.commit({
      ...this.state,
      idMap: { ...this.state.idMap, [String(tempId)]: { id: serverId, at: this.now() } },
    });
  }

  /** Shu amalga (uning temp id'siga) tranzitiv bog'liq amallar id'lari. */
  dependentsOf(opId: string): string[] {
    const root = this.get(opId);
    if (!root || root.tempId === undefined) return [];
    const seen = new Set<string>();
    const queue: number[] = [root.tempId];
    while (queue.length) {
      const t = queue.shift() as number;
      for (const o of this.state.ops) {
        if (seen.has(o.id) || o.id === opId) continue;
        if (o.deps.includes(t)) {
          seen.add(o.id);
          if (o.tempId !== undefined) queue.push(o.tempId);
        }
      }
    }
    return Array.from(seen);
  }

  /** Muvaffaqiyatsiz amalni qayta navbatga; unga bog'liq "blocked" amallar ham qaytadi. */
  retry(opId: string): void {
    const deps = new Set(this.dependentsOf(opId));
    const ops = this.state.ops.map(o => {
      if (o.id === opId || (deps.has(o.id) && o.status === 'blocked')) {
        return { ...o, status: 'pending', attempts: 0, nextAttemptAt: 0, lastError: undefined } as OutboxOp;
      }
      return o;
    });
    this.commit({ ...this.state, ops });
  }

  /** Amalni (va unga bog'liqlarini) butunlay bekor qilish. Qaytaradi: o'chirilganlar soni. */
  discard(opId: string): number {
    // Hozir yuborilayotgan amalni bekor qilib bo'lmaydi (server uni baribir bajarishi mumkin).
    if (this.get(opId)?.status === 'syncing') return 0;
    const remove = new Set([opId, ...this.dependentsOf(opId)]);
    const ops = this.state.ops.filter(o => !remove.has(o.id));
    const n = this.state.ops.length - ops.length;
    if (n) this.commit({ ...this.state, ops });
    return n;
  }

  /**
   * Summani tahrirlash (qaytarish / voz kechish / bo'lak to'lovi): body o'zgaradi -> YANGI kalit
   * (serverdagi eski kalit boshqa body bilan 409 bermasin), holat pending.
   */
  editAmount(opId: string, summa: number): OutboxOp | undefined {
    const op = this.get(opId);
    // Faqat server RAD ETGAN amal: pending/syncing amalning kaliti almashsa, yuborilayotgan nusxa
    // natijasi yo'qolar va amal yangi kalit bilan IKKINCHI marta bajarilardi.
    if (!op || op.status !== 'failed' || !(summa > 0)) return undefined;
    if (op.kind !== 'qarz.yopish' && op.kind !== 'mijoz.yopish' && op.kind !== 'qarz.vozKechish' && op.kind !== 'tolov.tolandi') {
      return undefined;
    }
    const next = {
      ...op,
      id: this.uuid(),
      payload: { ...op.payload, summa },
      meta: { ...op.meta, summa },
      status: 'pending',
      attempts: 0,
      nextAttemptAt: 0,
      lastError: undefined,
    } as OutboxOp;
    this.commit({ ...this.state, ops: this.state.ops.map(o => (o.id === opId ? next : o)) });
    return next;
  }

  /**
   * Tozalash: eskirgan `done` amallar, ishlatilmayotgan eski xarita yozuvlari, BOSHQA aktorning
   * 30 kundan eski amallari. Joriy aktorning faol amallariga tegilmaydi.
   */
  prune(currentActor: string | null): void {
    const t = this.now();
    const ops = this.state.ops.filter(o => {
      if (o.status === 'done') return t - (o.doneAt || o.createdAt) < DONE_TTL_MS;
      if (currentActor && o.actor !== currentActor) return t - o.createdAt < FOREIGN_TTL_MS;
      return true;
    });
    const referenced = new Set<string>();
    ops.forEach(o => o.deps.forEach(d => referenced.add(String(d))));
    const idMap: Record<string, IdMapEntry> = {};
    Object.entries(this.state.idMap).forEach(([k, v]) => {
      if (referenced.has(k) || t - v.at < IDMAP_TTL_MS) idMap[k] = v;
    });
    const changed =
      ops.length !== this.state.ops.length || Object.keys(idMap).length !== Object.keys(this.state.idMap).length;
    if (changed) this.commit({ ...this.state, ops, idMap });
  }
}
