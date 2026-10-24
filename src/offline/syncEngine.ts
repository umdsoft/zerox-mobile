/**
 * SyncEngine — navbatdagi amallarni TARTIB bilan serverga yuboradi (sof; tarmoq `send` orqali).
 *
 * Qoidalar:
 *  - Faqat joriy aktorning amallari; yaratilish tartibida (FIFO).
 *  - Bir vaqtda bitta yugurish (qayta chaqirilsa o'sha promise qaytadi).
 *  - 24.10: aktor HAR yuborishdan oldin qayta tekshiriladi (xodim rejimiga kirish/chiqish, refresh tokenni
 *    almashtiradi) — boshqa bo'lsa yugurish to'xtaydi ('no-actor'); `send` ham aktorni oladi va token
 *    shu aktorniki ekanini so'rov oldidan tekshiradi.
 *  - Vaqtinchalik xato (tarmoq/5xx/429/in-progress) -> yugurish TO'XTAYDI (tartib saqlansin),
 *    amal backoff bilan (server `Retry-After` so'rasa — kamida shuncha) qayta rejalashtiriladi.
 *    24.10: ketma-ket MAX_SERVER_ERRORS ta 5xx JAVOB -> `failed` (vaqtinchalik, "Qayta urinish"),
 *    navbat mustaqil amallar bilan davom etadi. Tarmoq xatosi (javobsiz) — cheksiz qayta urinish.
 *  - Doimiy xato (4xx) -> `failed`, unga bog'liq amallar va O'SHA MIJOZNING keyingi amallari -> `blocked`;
 *    qolgan mustaqil amallar davom etadi.
 *  - 24.10: 409 IDEMPOTENCY_RESPONSE_UNAVAILABLE (serverda bajarilgan, javobi yo'q): qaytarish/yopish/
 *    voz kechish/bo'lak -> `done`; yaratish (server id noma'lum) -> yakuniy `failed`, bog'liqlar `blocked`.
 *  - 401 -> bir marta `refreshAuth`, so'ng (aktor qayta tekshirilib) shu amal qayta; baribir 401 -> 'auth'.
 *  - Bog'liqlik (temp id) hal bo'lmagan va uni yaratuvchi amal muvaffaqiyatsiz -> `blocked`.
 */
import { Outbox } from './outbox';
import { buildRequest, classify, CODE_RESPONSE_UNAVAILABLE, MAX_SERVER_ERRORS, retryDelayMs } from './opSpec';
import { OpError, OpRequest, OutboxOp, SendResult } from './types';

/** @param actor amal aktori — yuboruvchi token shu aktorniki ekanini tekshiradi (aks holda `actorMismatch`). */
export type Sender = (req: OpRequest, idempotencyKey: string, actor: string) => Promise<SendResult>;

export type StopReason = 'idle' | 'transient' | 'auth' | 'no-actor';

export interface RunSummary {
  synced: number;
  failed: number;
  linked: number;
  /** 24.10: serverda avval bajarilgan (javobi yo'qolgan) — ekranlar serverdan qayta yuklasin. */
  committed: number;
  stoppedBy: StopReason;
  /** Keyingi urinish vaqti (backoff) — bo'lsa sync manager taymer qo'yadi. */
  nextAttemptAt?: number;
}

export interface EngineDeps {
  outbox: Outbox;
  send: Sender;
  getActor: () => string | null;
  now?: () => number;
  random?: () => number;
  /** 401 da tokenni yangilash; true — yangilandi. */
  refreshAuth?: () => Promise<boolean>;
}

export const DEP_ERROR: OpError = { status: null, code: 'DEPENDENCY_FAILED', message: 'Bog‘liq amal sinxronlanmadi' };
/** 24.10: o'sha mijozning oldingi amali muvaffaqiyatsiz — bu amal undan keyin ma'nosini yo'qotishi mumkin. */
export const CUSTOMER_ERROR: OpError = {
  status: null,
  code: 'CUSTOMER_BLOCKED',
  message: 'Shu mijozning oldingi amali yuborilmagan',
};
/** 24.10: bog'liq yaratish serverda bajarilgan, lekin server id'si noma'lum — avtomatik hal bo'lmaydi. */
export const COMMITTED_DEP_ERROR: OpError = {
  status: null,
  code: 'DEPENDENCY_COMMITTED',
  message: 'Bog‘liq amal serverda bajarilgan, id’si noma’lum',
};
const NO_ID_ERROR: OpError = { status: 200, code: 'NO_SERVER_ID', message: 'Server javobida yaratilgan obyekt id’si yo‘q' };

export class SyncEngine {
  private running: Promise<RunSummary> | null = null;

  constructor(private readonly deps: EngineDeps) {}

  isRunning(): boolean {
    return this.running !== null;
  }

  /** @param force backoff vaqtini kutmasdan (foydalanuvchi "Hozir sinxronlash" bosdi). */
  run(force = false): Promise<RunSummary> {
    // Majburiy ("Hozir sinxronlash") so'rov oddiy yugurish paytida kelsa — u tugagach yana bir marta.
    if (this.running) return force ? this.running.then(() => this.run(true)) : this.running;
    this.running = this.runInner(force).finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private now(): number {
    return this.deps.now ? this.deps.now() : Date.now();
  }

  /**
   * Muvaffaqiyatsiz amaldan keyingilar: temp id bo'yicha bog'liqlar (`depError`) va o'sha mijozning
   * keyingi amallari (`custError`) — faqat hali yuborilmagan (pending) lari.
   */
  private blockFollowers(opId: string, depError: OpError = DEP_ERROR, custError: OpError = CUSTOMER_ERROR): void {
    const { outbox } = this.deps;
    const deps = outbox.dependentsOf(opId);
    const block = (id: string, error: OpError) => {
      const d = outbox.get(id);
      if (d && d.status === 'pending') outbox.update(id, { status: 'blocked', lastError: error });
    };
    deps.forEach(id => block(id, depError));
    outbox.sameCustomerFollowers(opId).forEach(id => {
      if (!deps.includes(id)) block(id, custError);
    });
  }

  /**
   * Temp id'ni yaratuvchi amal muvaffaqiyatsizmi, yo'qmi yoki BOSHQA sessiyaniki (bu sessiyada hech
   * qachon yuborilmaydi — navbat boshini abadiy to'smasin)? Bloklash sababi yoki null.
   */
  private creatorUnavailable(tempId: number, actor: string): OpError | null {
    const creator = this.deps.outbox.list().find(o => o.tempId === tempId);
    if (creator && creator.status === 'failed' && creator.lastError?.code === CODE_RESPONSE_UNAVAILABLE) {
      return COMMITTED_DEP_ERROR;
    }
    const bad = !creator || creator.actor !== actor || creator.status === 'failed' || creator.status === 'blocked';
    return bad ? DEP_ERROR : null;
  }

  /** Server id'ni saqlab bo'lmadi (disk) — O'SHA kalit bilan keyinroq: server saqlangan javobni qaytaradi. */
  private persistFailed(op: OutboxOp, summary: RunSummary): RunSummary {
    const attempts = op.attempts + 1;
    const at = this.now() + retryDelayMs(attempts, undefined, this.deps.random);
    this.deps.outbox.update(op.id, {
      status: 'pending',
      attempts,
      nextAttemptAt: at,
      lastError: { status: null, code: 'PERSIST_FAILED' },
    });
    return { ...summary, stoppedBy: 'transient', nextAttemptAt: at };
  }

  private async runInner(force: boolean): Promise<RunSummary> {
    const { outbox, send } = this.deps;
    const actor = this.deps.getActor();
    const summary: RunSummary = { synced: 0, failed: 0, linked: 0, committed: 0, stoppedBy: 'idle' };
    if (!actor) return { ...summary, stoppedBy: 'no-actor' };

    let refreshedOnce = false;
    // Har iteratsiyada navbatni yangidan o'qiymiz (yugurish paytida yangi amal qo'shilishi mumkin).
    for (;;) {
      // 24.10: token yugurish davomida almashgan bo'lsa (xodim rejimi / refresh) — boshqa aktor nomidan
      // yubormaymiz; yangi aktor o'z yugurishini boshlaydi.
      if (this.deps.getActor() !== actor) return { ...summary, stoppedBy: 'no-actor' };
      const next = outbox.list(actor).find(o => o.status === 'pending');
      if (!next) return summary;

      if (!force && next.nextAttemptAt > this.now()) {
        return { ...summary, stoppedBy: 'transient', nextAttemptAt: next.nextAttemptAt };
      }

      const built = buildRequest(next, id => outbox.resolveId(id));
      if (!built.ok) {
        const why = this.creatorUnavailable(built.unresolved, actor);
        if (why) {
          outbox.update(next.id, { status: 'blocked', lastError: why });
          continue;
        }
        // Yaratuvchi hali navbatda (oldinroq turibdi) — FIFO buzilgan holat; keyinroq.
        const at = this.now() + retryDelayMs(next.attempts + 1, undefined, this.deps.random);
        outbox.update(next.id, { attempts: next.attempts + 1, nextAttemptAt: at });
        return { ...summary, stoppedBy: 'transient', nextAttemptAt: at };
      }

      // 24.10: o'sha mijozning oldingi amali muvaffaqiyatsiz — bu amal yuborilmaydi (masalan yangi qarz
      // rad etilgan, mijozni yopish esa eski qarzlarga tushib qolardi).
      if (outbox.hasFailedPredecessor(next.id)) {
        outbox.update(next.id, { status: 'blocked', lastError: CUSTOMER_ERROR });
        continue;
      }

      outbox.update(next.id, { status: 'syncing', sentOnce: true });
      let res: SendResult;
      try {
        res = await send(built.request, next.id, actor);
      } catch {
        res = { status: null };
      }
      if (res.actorMismatch) {
        // So'rov yuborilmadi — amal o'zgarishsiz navbatga qaytadi.
        outbox.update(next.id, { status: 'pending', sentOnce: next.sentOnce });
        return { ...summary, stoppedBy: 'no-actor' };
      }
      const outcome = classify(next, res);

      switch (outcome.type) {
        case 'success': {
          // Yaratish muvaffaqiyatli, lekin javobda id yo'q — bog'liq amallar hech qachon hal bo'lmasdi
          // (navbat to'xtab qolardi). Jim "done" emas — foydalanuvchiga ko'rsatiladi.
          if (next.tempId !== undefined && !outcome.serverId) {
            outbox.update(next.id, { status: 'failed', lastError: NO_ID_ERROR });
            this.blockFollowers(next.id);
            summary.failed += 1;
            break;
          }
          try {
            if (next.tempId !== undefined && outcome.serverId) outbox.mapId(next.tempId, outcome.serverId);
          } catch {
            return this.persistFailed(next, summary);
          }
          outbox.update(next.id, {
            status: 'done',
            doneAt: this.now(),
            serverId: outcome.serverId,
            serverErrors: 0,
            lastError: undefined,
          });
          summary.synced += 1;
          break;
        }
        case 'link-existing': {
          try {
            if (next.tempId !== undefined) outbox.mapId(next.tempId, outcome.serverId);
          } catch {
            return this.persistFailed(next, summary);
          }
          outbox.update(next.id, {
            status: 'done',
            doneAt: this.now(),
            serverId: outcome.serverId,
            note: 'linked-existing',
            lastError: undefined,
          });
          summary.linked += 1;
          break;
        }
        case 'committed': {
          if (next.tempId === undefined) {
            // Qaytarish/yopish/voz kechish/bo'lak — serverda BAJARILGAN: qayta yuborish ham, yangi kalit ham
            // dublikat bo'lardi. Ekranlar serverdan qayta yuklaydi.
            outbox.update(next.id, { status: 'done', doneAt: this.now(), note: 'replay-lost', lastError: undefined });
            summary.committed += 1;
            break;
          }
          // Yaratish: obyekt serverda bor, lekin id'si noma'lum — bog'liqlar avtomatik hal bo'lmaydi.
          outbox.update(next.id, { status: 'failed', attempts: next.attempts + 1, lastError: outcome.error });
          this.blockFollowers(next.id, COMMITTED_DEP_ERROR, COMMITTED_DEP_ERROR);
          summary.committed += 1;
          break;
        }
        case 'transient': {
          const attempts = next.attempts + 1;
          // Javobsiz (tarmoq) urinish hisobni buzmaydi; boshqa javob (429/in-progress) — nollaydi.
          const prev = next.serverErrors || 0;
          const serverErrors = outcome.serverError ? prev + 1 : outcome.error.status === null ? prev : 0;
          if (serverErrors >= MAX_SERVER_ERRORS) {
            // Bir amal navbatni abadiy to'smasin — vaqtinchalik `failed` ("Qayta urinish" bilan qaytadi).
            outbox.update(next.id, { status: 'failed', attempts, serverErrors, lastError: outcome.error });
            this.blockFollowers(next.id);
            summary.failed += 1;
            break;
          }
          const at = this.now() + retryDelayMs(attempts, outcome.retryAfterMs, this.deps.random);
          outbox.update(next.id, { status: 'pending', attempts, serverErrors, nextAttemptAt: at, lastError: outcome.error });
          return { ...summary, stoppedBy: 'transient', nextAttemptAt: at };
        }
        case 'auth': {
          if (!refreshedOnce && this.deps.refreshAuth) {
            refreshedOnce = true;
            let ok = false;
            try {
              ok = await this.deps.refreshAuth();
            } catch {
              ok = false;
            }
            outbox.update(next.id, { status: 'pending' });
            if (ok) continue; // o'sha amal yangi token bilan qayta (sikl boshida aktor qayta tekshiriladi)
          } else {
            outbox.update(next.id, { status: 'pending', lastError: outcome.error });
          }
          return { ...summary, stoppedBy: 'auth' };
        }
        case 'permanent': {
          outbox.update(next.id, { status: 'failed', attempts: next.attempts + 1, lastError: outcome.error });
          this.blockFollowers(next.id);
          summary.failed += 1;
          break;
        }
      }
    }
  }
}
