/**
 * submitQarzOp — Qarz daftari yozish amallarining YAGONA kirish nuqtasi (ekranlar shuni chaqiradi).
 *
 *  1) Onlayn, navbatda kutayotgan amal yo'q, temp bog'liqlik yo'q -> amal AVVAL saqlanadi ('syncing'),
 *     so'ng darhol yuboriladi (Idempotency-Key = amal id):
 *       - 2xx  -> 'done' => { status: 'synced', data }   (ekran avvalgidek ishlaydi)
 *       - 4xx  -> amal navbatdan olib tashlanadi (24.10: 'syncing' bo'lsa ham — force) va xato TASHLANADI
 *                 (axios xatosi shaklida — mavjud ekran catch bloklari o'zgarishsiz: 409 phone-exists, 402...)
 *       - 401  -> bir marta refresh (aktor o'zgarmagan bo'lsa) va qayta
 *       - javobsiz / 5xx / 401 / in-progress / sessiya almashgan -> navbatda qoladi => { status: 'queued' }
 *     O'sha mijozning oldingi amali rad etilgan bo'lsa -> 'blocked' (yuborilmaydi).
 *  2) Aks holda -> navbatga ('pending') => { status: 'queued' } va fon sinxroni boshlanadi.
 *
 * Shu tartib (avval saqlash) tufayli so'rov paytida ilova yopilsa ham amal yo'qolmaydi va o'sha kalit
 * bilan qayta yuborilganda server ikki marta bajarmaydi.
 */
import { refreshAccessToken } from '../store/api/authInterceptor';
import { getOutbox, currentActor } from './offlineStore';
import { isOnline } from './netStatus';
import { buildRequest, classify, extractServerId, retryDelayMs } from './opSpec';
import { CUSTOMER_ERROR } from './syncEngine';
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
  // 24.10: nextTempId/enqueue diskka yoza olmasa OutboxPersistError — ekran xato ko'rsatadi.
  const isCreate = rawInput.kind === 'mijoz.create' || rawInput.kind === 'qarz.create';
  const input = (isCreate && rawInput.tempId === undefined ? { ...rawInput, tempId: ob.nextTempId() } : rawInput) as NewOp;

  const waiting = ob.activeOps(actor.key).some(o => o.status === 'pending' || o.status === 'syncing');
  const unresolvedDep = (input.deps || []).some(d => d < 0 && ob.resolveId(d) === undefined);
  const direct = isOnline() && !waiting && !unresolvedDep;

  const op = ob.enqueue(input, actor.key, direct ? 'syncing' : 'pending'); // OutboxFullError — chaqiruvchiga
  // 24.10: o'sha mijozning oldingi amali rad etilgan/kutmoqda — bu amal yuborilmaydi (masalan rad etilgan
  // yangi qarzdan keyingi mijozni yopish eski qarzlarga tushib qolardi). Sinxron sahifasida hal qilinadi.
  if (ob.hasFailedPredecessor(op.id)) {
    const blocked = ob.update(op.id, { status: 'blocked', sentOnce: undefined, lastError: CUSTOMER_ERROR }) as OutboxOp;
    return { status: 'queued', op: blocked };
  }
  if (!direct) {
    requestSync();
    return { status: 'queued', op };
  }

  const built = buildRequest(op, id => ob.resolveId(id));
  if (!built.ok) {
    ob.update(op.id, { status: 'pending', sentOnce: undefined });
    requestSync();
    return { status: 'queued', op };
  }
  let res = await sendOpRequest(built.request, op.id, op.actor);
  let outcome = classify(op, res);
  // 401: bir marta refresh; token o'sha aktorniki bo'lib qolgan bo'lsagina o'sha kalit bilan qayta.
  if (!res.actorMismatch && outcome.type === 'auth') {
    const fresh = await refreshAccessToken().catch(() => null);
    if (fresh && currentActor()?.key === op.actor) {
      res = await sendOpRequest(built.request, op.id, op.actor);
      outcome = classify(op, res);
    }
  }
  if (res.actorMismatch) {
    // Sessiya (xodim rejimi) almashgan — so'rov ketmadi; amal o'z aktori sessiyasida yuboriladi.
    const queued = ob.update(op.id, { status: 'pending', sentOnce: undefined }) as OutboxOp;
    return { status: 'queued', op: queued };
  }

  if (outcome.type === 'success') {
    const serverId = outcome.serverId ?? extractServerId(op, res.data);
    try {
      if (op.tempId !== undefined && serverId) ob.mapId(op.tempId, serverId);
    } catch {
      // Server bajardi, lekin xarita saqlanmadi — amal O'SHA kalit bilan navbatda qoladi (server saqlangan
      // javobni qaytaradi va xarita keyin yoziladi). Ekranga muvaffaqiyat — qayta kiritib dublikat qilmasin.
      ob.update(op.id, { status: 'pending', lastError: { status: null, code: 'PERSIST_FAILED' } });
      requestSync();
      return { status: 'synced', data: res.data, op };
    }
    const done = ob.update(op.id, { status: 'done', doneAt: Date.now(), serverId }) as OutboxOp;
    return { status: 'synced', data: res.data, op: done };
  }

  if (outcome.type === 'committed') {
    // Yangi kalit bilan amalda bo'lmaydi; himoya uchun: serverda bajarilgan — qayta yuborilmaydi.
    if (op.tempId === undefined) {
      const done = ob.update(op.id, { status: 'done', doneAt: Date.now(), note: 'replay-lost' }) as OutboxOp;
      return { status: 'synced', data: { success: true }, op: done };
    }
    ob.update(op.id, { status: 'failed', attempts: op.attempts + 1, lastError: outcome.error });
    throw httpError(res.status as number, res.data);
  }

  // Onlayn yo'lda 409 phone-exists ham (link-existing) — ekran o'z xabarini ko'rsatadi (avvalgi xulq).
  // 24.10: `force` — amal 'syncing' holatida; force'siz discard uni rad etar va "arvoh" amal keyingi
  // ishga tushishda O'SHA kalit bilan qayta yuborilardi (server 4xx da kalitni bo'shatgan — dublikat).
  if (outcome.type === 'permanent' || outcome.type === 'link-existing') {
    ob.discard(op.id, true);
    throw httpError(res.status as number, res.data);
  }

  // transient / auth — navbatda qoladi.
  const attempts = op.attempts + 1;
  const tr = outcome.type === 'transient' ? outcome : null;
  const queued = ob.update(op.id, {
    status: 'pending',
    attempts,
    serverErrors: tr?.serverError ? 1 : 0,
    nextAttemptAt: tr ? Date.now() + retryDelayMs(attempts, tr.retryAfterMs) : 0,
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
