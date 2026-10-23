/**
 * submitQarzOp — Qarz daftari yozish amallarining YAGONA kirish nuqtasi (ekranlar shuni chaqiradi).
 *
 *  1) Onlayn, navbatda kutayotgan amal yo'q, temp bog'liqlik yo'q -> amal AVVAL saqlanadi ('syncing'),
 *     so'ng darhol yuboriladi (Idempotency-Key = amal id):
 *       - 2xx  -> 'done' => { status: 'synced', data }   (ekran avvalgidek ishlaydi)
 *       - 4xx  -> amal navbatdan olib tashlanadi va xato TASHLANADI (axios xatosi shaklida —
 *                 mavjud ekran catch bloklari o'zgarishsiz: 409 phone-exists, 402, amount-exceeds...)
 *       - javobsiz / 5xx / 401 / in-progress -> navbatda qoladi => { status: 'queued' }
 *  2) Aks holda -> navbatga ('pending') => { status: 'queued' } va fon sinxroni boshlanadi.
 *
 * Shu tartib (avval saqlash) tufayli so'rov paytida ilova yopilsa ham amal yo'qolmaydi va o'sha kalit
 * bilan qayta yuborilganda server ikki marta bajarmaydi.
 */
import { getOutbox, currentActor } from './offlineStore';
import { isOnline } from './netStatus';
import { backoffMs, buildRequest, classify, extractServerId } from './opSpec';
import { requestSync, sendOpRequest, startOfflineSync } from './syncManager';
import { NewOp, OutboxOp } from './types';

/** Server JSON javobi (`{ success, data, ... }`) — ekranlar avvalgidek `data?.data` ni o'qiydi. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServerBody = any;

export type SubmitResult =
  | { status: 'synced'; data: ServerBody; op: OutboxOp }
  | { status: 'queued'; op: OutboxOp };

export class NoSessionError extends Error {
  constructor() {
    super('NO_SESSION');
    this.name = 'NoSessionError';
  }
}

/** Mavjud ekranlar `error.response.status/data` ni o'qiydi — o'sha shakldagi xato. */
const httpError = (status: number, data: unknown): Error & { response: { status: number; data: unknown } } => {
  const e = new Error(`HTTP ${status}`) as Error & { response: { status: number; data: unknown } };
  e.response = { status, data };
  return e;
};

export async function submitQarzOp(rawInput: NewOp): Promise<SubmitResult> {
  startOfflineSync();
  const actor = currentActor();
  if (!actor) throw new NoSessionError();
  const ob = getOutbox();
  // Yaratish amallari doim lokal (manfiy) id oladi — oflayn navbatda ekranlar shu id bilan ochiladi.
  const isCreate = rawInput.kind === 'mijoz.create' || rawInput.kind === 'qarz.create';
  const input = (isCreate && rawInput.tempId === undefined ? { ...rawInput, tempId: ob.nextTempId() } : rawInput) as NewOp;

  const waiting = ob.activeOps(actor.key).some(o => o.status === 'pending' || o.status === 'syncing');
  const unresolvedDep = (input.deps || []).some(d => d < 0 && ob.resolveId(d) === undefined);
  const direct = isOnline() && !waiting && !unresolvedDep;

  if (!direct) {
    const op = ob.enqueue(input, actor.key, 'pending'); // OutboxFullError — chaqiruvchiga
    requestSync();
    return { status: 'queued', op };
  }

  const op = ob.enqueue(input, actor.key, 'syncing');
  const built = buildRequest(op, id => ob.resolveId(id));
  if (!built.ok) {
    ob.update(op.id, { status: 'pending' });
    requestSync();
    return { status: 'queued', op };
  }
  const res = await sendOpRequest(built.request, op.id);
  const outcome = classify(op, res);

  if (outcome.type === 'success') {
    const serverId = outcome.serverId ?? extractServerId(op, res.data);
    if (op.tempId !== undefined && serverId) ob.mapId(op.tempId, serverId);
    const done = ob.update(op.id, { status: 'done', doneAt: Date.now(), serverId }) as OutboxOp;
    return { status: 'synced', data: res.data, op: done };
  }

  // Onlayn yo'lda 409 phone-exists ham (link-existing) — ekran o'z xabarini ko'rsatadi (avvalgi xulq).
  if (outcome.type === 'permanent' || outcome.type === 'link-existing') {
    ob.discard(op.id);
    throw httpError(res.status as number, res.data);
  }

  // transient / auth — navbatda qoladi.
  const attempts = op.attempts + 1;
  const queued = ob.update(op.id, {
    status: 'pending',
    attempts,
    nextAttemptAt: outcome.type === 'transient' ? Date.now() + backoffMs(attempts) : 0,
    lastError: outcome.error,
  }) as OutboxOp;
  requestSync();
  return { status: 'queued', op: queued };
}

/** Ekranlar uchun: temp (oflayn yaratilgan) id'mi va hali server id olmaganmi. */
export function isUnsyncedId(id: unknown): boolean {
  const n = Number(id);
  if (!(n < 0)) return false;
  return getOutbox().resolveId(n) === undefined;
}

/** Temp id -> server id (bo'lsa), aks holda o'zi. */
export function resolveLocalId(id: unknown): number {
  const n = Number(id);
  if (!(n < 0)) return n;
  return getOutbox().resolveId(n) ?? n;
}

/** Yangi temp id (oflayn mijoz/qarz yaratish uchun). */
export function newTempId(): number {
  return getOutbox().nextTempId();
}
