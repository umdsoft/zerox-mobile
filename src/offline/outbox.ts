/**
 * Outbox — oflayn amallar navbati (doimiy, shifrlangan MMKV'da; testda xotira KV).
 *
 * - Holat bitta JSON kalitida: { v, ops[], idMap{temp->server}, tempSeq }.
 * - Har o'zgarish o'zgarmas (immutable) yangi holat yaratadi, saqlaydi va tinglovchilarni xabardor qiladi.
 * - Temp id'lar MANFIY butun sonlar (mavjud ekranlar `Number(id)` bilan ishlaydi).
 * - Hech qachon faol (pending/failed/blocked) amalni o'zi o'chirmaydi — faqat foydalanuvchi
 *   "Bekor qilish" bilan (24.10: BOSHQA aktorniki ham — vaqt bo'yicha o'chirish olib tashlandi).
 * - 24.10: yangi amal / temp id / id xaritasi AVVAL diskka yoziladi; yozib bo'lmasa xotira o'zgarmaydi
 *   va xato TASHLANADI — ekran "oflayn saqlandi" demasin.
 */
import { customerRef, isTerminalFailure } from './opSpec';
import { ACTIVE_STATUSES, KV, NewOp, OutboxOp, OpStatus } from './types';

export const OUTBOX_KEY = 'outbox:v1';
export const MAX_ACTIVE_OPS = 500;
const DONE_TTL_MS = 24 * 3600 * 1000;
const IDMAP_TTL_MS = 30 * 24 * 3600 * 1000;

const EDITABLE_KINDS: ReadonlySet<OutboxOp['kind']> = new Set([
  'qarz.yopish',
  'mijoz.yopish',
  'qarz.vozKechish',
  'tolov.tolandi',
]);

/**
 * 24.10: summani o'zgartirish (YANGI kalit) xavfsizmi:
 *  - failed: server 4xx bilan RAD ETGAN (kalit bo'shatilgan, hech narsa bajarilmagan). 5xx chegarasi
 *    bilan failed — yo'q: oldingi (javobsiz) urinish bajarilgan bo'lishi mumkin; faqat "Qayta urinish".
 *  - pending: hali HECH QACHON jo'natilmagan (`sentOnce` yo'q).
 */
export function canEditAmount(op: OutboxOp): boolean {
  if (!EDITABLE_KINDS.has(op.kind)) return false;
  if (op.status === 'pending') return !op.sentOnce;
  if (op.status !== 'failed' || isTerminalFailure(op)) return false;
  const st = op.lastError?.status;
  return typeof st === 'number' && st >= 400 && st < 500;
}

/**
 * 24.10: bekor qilish mumkinmi: failed/blocked — ha; pending — faqat hech qachon jo'natilmagan bo'lsa
 * (jo'natilgan, javobi kelmagan amal serverda bajarilgan bo'lishi mumkin — "Yuborilmoqda, kuting").
 */
export function canDiscard(op: OutboxOp): boolean {
  if (op.status === 'failed' || op.status === 'blocked') return true;
  return op.status === 'pending' && !op.sentOnce;
}

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

/** 24.10: navbatni diskka yozib bo'lmadi (xotira to'lgan / MMKV xatosi) — amal SAQLANMADI. */
export class OutboxPersistError extends Error {
  constructor() {
    super('OUTBOX_PERSIST_FAILED');
    this.name = 'OutboxPersistError';
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

  /**
   * @param strict true — AVVAL yoziladi; yozilmasa xotira o'zgarmaydi va OutboxPersistError (yangi amal,
   *   temp id, id xaritasi: yo'qolsa dublikat yoki "saqlandi" yolg'oni). false — holat yangilanishlari
   *   (status/xato): xotira oldinga ketadi, keyingi commit qayta yozadi.
   */
  private commit(next: OutboxState, strict = false): void {
    try {
      this.kv.set(OUTBOX_KEY, JSON.stringify(next));
    } catch {
      if (strict) throw new OutboxPersistError();
    }
    this.state = next;
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
    this.commit({ ...this.state, tempSeq: seq }, true);
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
      sentOnce: initialStatus === 'syncing' ? true : undefined,
      attempts: 0,
      nextAttemptAt: 0,
    } as OutboxOp;
    this.commit({ ...this.state, ops: [...this.state.ops, op] }, true);
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
    this.commit(
      {
        ...this.state,
        idMap: { ...this.state.idMap, [String(tempId)]: { id: serverId, at: this.now() } },
      },
      true,
    );
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

  /** Mijoz id'si (temp bo'lsa — xaritalangan server id'si) — bir mijozni solishtirish uchun. */
  private customerKey(op: OutboxOp): number | undefined {
    const raw = customerRef(op);
    if (raw === undefined) return undefined;
    return raw < 0 ? this.resolveId(raw) ?? raw : raw;
  }

  /** 24.10: shu amaldan KEYIN navbatga qo'yilgan, o'sha aktor va O'SHA mijozning amallari. */
  sameCustomerFollowers(opId: string): string[] {
    const idx = this.state.ops.findIndex(o => o.id === opId);
    if (idx < 0) return [];
    const root = this.state.ops[idx];
    const key = this.customerKey(root);
    if (key === undefined) return [];
    return this.state.ops
      .slice(idx + 1)
      .filter(o => o.actor === root.actor && this.customerKey(o) === key)
      .map(o => o.id);
  }

  /** 24.10: shu amaldan OLDIN turgan, o'sha mijozning muvaffaqiyatsiz (failed/blocked) amali bormi. */
  hasFailedPredecessor(opId: string): boolean {
    const idx = this.state.ops.findIndex(o => o.id === opId);
    if (idx < 0) return false;
    const op = this.state.ops[idx];
    const key = this.customerKey(op);
    if (key === undefined) return false;
    return this.state.ops
      .slice(0, idx)
      .some(
        o => o.actor === op.actor && (o.status === 'failed' || o.status === 'blocked') && this.customerKey(o) === key,
      );
  }

  /**
   * Muvaffaqiyatsiz amalni qayta navbatga; unga bog'liq va o'sha mijozning keyingi "blocked" amallari ham
   * qaytadi (hali to'sqin bo'lsa — dvigatel yuborishdan oldin yana bloklaydi).
   * Yakuniy xato (serverda bajarilgan / kalit buzilgan) qayta yuborilmaydi.
   */
  retry(opId: string): void {
    const op = this.get(opId);
    if (!op || isTerminalFailure(op)) return;
    const deps = new Set([...this.dependentsOf(opId), ...this.sameCustomerFollowers(opId)]);
    const ops = this.state.ops.map(o => {
      if ((o.id === opId && o.status !== 'done') || (deps.has(o.id) && o.status === 'blocked')) {
        return { ...o, status: 'pending', attempts: 0, serverErrors: 0, nextAttemptAt: 0, lastError: undefined } as OutboxOp;
      }
      return o;
    });
    this.commit({ ...this.state, ops });
  }

  /**
   * 24.10: telefon band, ism boshqa (`lastError.existingId`) — foydalanuvchi "Shu mijozga bog'lash" ni
   * tanladi: temp mijoz mavjud mijozga xaritalanadi, bog'liq amallar navbatga qaytadi.
   */
  linkExisting(opId: string): boolean {
    const op = this.get(opId);
    const existing = op?.lastError?.existingId;
    if (!op || op.kind !== 'mijoz.create' || op.status !== 'failed' || op.tempId === undefined || !existing) return false;
    this.mapId(op.tempId, existing);
    this.update(op.id, {
      status: 'done',
      doneAt: this.now(),
      serverId: existing,
      note: 'linked-existing',
      lastError: undefined,
    });
    this.retry(op.id); // done amalning o'zi o'zgarmaydi — faqat bloklangan bog'liqlar qaytadi
    return true;
  }

  /**
   * Amalni (va unga bog'liqlarini) butunlay bekor qilish. Qaytaradi: o'chirilganlar soni.
   * @param force onlayn yuborishni SERVER RAD ETGANIDAN keyin (javob keldi, so'rov tugagan) — 'syncing'
   *   holatidagi amalni ham o'chiradi; aks holda u keyingi ishga tushishda O'SHA kalit bilan qayta
   *   yuborilardi (server 4xx da kalitni bo'shatgan — foydalanuvchi qayta kiritgan bo'lsa dublikat).
   */
  discard(opId: string, force = false): number {
    // Yuborilayotgan / jo'natilib javobi kelmagan amalni bekor qilib bo'lmaydi (server uni bajargan
    // bo'lishi mumkin). Bog'liqlar ham o'chadi — ular hali hech qachon jo'natilmagan (temp id hal bo'lmagan).
    const op = this.get(opId);
    if (!op) return 0;
    if (!force && !canDiscard(op)) return 0;
    const remove = new Set([opId, ...this.dependentsOf(opId)]);
    // 24.10: shu mijozning keyingi (CUSTOMER_BLOCKED) amallari — sababi endi yo'q; ular o'z-o'zidan
    // yuborilmaydi (pul amali — foydalanuvchi qaror qiladi), lekin xabar "Qayta urinish"ni ko'rsatadi.
    const freed = new Set(this.sameCustomerFollowers(opId).filter(id => !remove.has(id)));
    const ops = this.state.ops
      .filter(o => !remove.has(o.id))
      .map(o =>
        freed.has(o.id) && o.lastError?.code === 'CUSTOMER_BLOCKED'
          ? { ...o, lastError: { ...o.lastError, code: 'CUSTOMER_PARENT_DISCARDED' } }
          : o,
      );
    const n = this.state.ops.length - ops.length;
    if (n) this.commit({ ...this.state, ops });
    return n;
  }

  /**
   * Summani tahrirlash (qaytarish / voz kechish / bo'lak to'lovi): body o'zgaradi -> YANGI kalit
   * (serverdagi eski kalit boshqa body bilan 409 bermasin), holat pending. Shartlar — `canEditAmount`.
   */
  editAmount(opId: string, summa: number): OutboxOp | undefined {
    const op = this.get(opId);
    // Jo'natilgan (javobsiz) yoki yuborilayotgan amalning kaliti almashsa, server bajargan nusxa
    // yo'qolar va amal yangi kalit bilan IKKINCHI marta bajarilardi. Yakuniy xato ham — xuddi shunday.
    if (!op || !canEditAmount(op) || !(summa > 0)) return undefined;
    if (op.kind !== 'qarz.yopish' && op.kind !== 'mijoz.yopish' && op.kind !== 'qarz.vozKechish' && op.kind !== 'tolov.tolandi') {
      return undefined;
    }
    const next = {
      ...op,
      id: this.uuid(),
      payload: { ...op.payload, summa },
      meta: { ...op.meta, summa },
      status: 'pending',
      sentOnce: undefined,
      attempts: 0,
      serverErrors: 0,
      nextAttemptAt: 0,
      lastError: undefined,
    } as OutboxOp;
    this.commit({ ...this.state, ops: this.state.ops.map(o => (o.id === opId ? next : o)) }, true);
    return next;
  }

  /**
   * Tozalash: eskirgan `done` amallar va ishlatilmayotgan eski xarita yozuvlari.
   * 24.10: FAOL amallar (har qanday aktorniki) hech qachon vaqt bo'yicha o'chirilmaydi — sinxronlanmagan
   * qarz/to'lov jim yo'qolmasin (faqat foydalanuvchi "Bekor qilish" bilan).
   */
  prune(): void {
    const t = this.now();
    const ops = this.state.ops.filter(o => o.status !== 'done' || t - (o.doneAt || o.createdAt) < DONE_TTL_MS);
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

  /** 24.10: foydalanuvchi o'zi chiqdi — shu aktorning yuborilgan (`done`) amallari tarixi o'chiriladi. */
  dropDone(actor: string): number {
    const ops = this.state.ops.filter(o => !(o.actor === actor && o.status === 'done'));
    const n = this.state.ops.length - ops.length;
    if (n) this.commit({ ...this.state, ops });
    return n;
  }
}
