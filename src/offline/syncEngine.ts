/**
 * SyncEngine — navbatdagi amallarni TARTIB bilan serverga yuboradi (sof; tarmoq `send` orqali).
 *
 * Qoidalar:
 *  - Faqat joriy aktorning amallari; yaratilish tartibida (FIFO).
 *  - Bir vaqtda bitta yugurish (qayta chaqirilsa o'sha promise qaytadi).
 *  - Vaqtinchalik xato (tarmoq/5xx/429/in-progress) -> yugurish TO'XTAYDI (tartib saqlansin),
 *    amal backoff bilan qayta rejalashtiriladi.
 *  - Doimiy xato (4xx) -> `failed`, unga bog'liq amallar -> `blocked`; qolgan mustaqil amallar davom etadi.
 *  - 401 -> bir marta `refreshAuth`, so'ng shu amal qayta; baribir 401 -> yugurish to'xtaydi ('auth').
 *  - Bog'liqlik (temp id) hal bo'lmagan va uni yaratuvchi amal muvaffaqiyatsiz -> `blocked`.
 */
import { Outbox } from './outbox';
import { backoffMs, buildRequest, classify } from './opSpec';
import { OpError, OpRequest, OutboxOp, SendResult } from './types';

export type Sender = (req: OpRequest, idempotencyKey: string) => Promise<SendResult>;

export type StopReason = 'idle' | 'transient' | 'auth' | 'no-actor';

export interface RunSummary {
  synced: number;
  failed: number;
  linked: number;
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

const DEP_ERROR: OpError = { status: null, code: 'DEPENDENCY_FAILED', message: 'Bog‘liq amal sinxronlanmadi' };
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

  private blockDependents(op: OutboxOp): void {
    const { outbox } = this.deps;
    outbox.dependentsOf(op.id).forEach(id => {
      const d = outbox.get(id);
      if (d && (d.status === 'pending' || d.status === 'syncing')) {
        outbox.update(id, { status: 'blocked', lastError: DEP_ERROR });
      }
    });
  }

  /**
   * Temp id'ni yaratuvchi amal muvaffaqiyatsizmi, yo'qmi yoki BOSHQA sessiyaniki (bu sessiyada hech
   * qachon yuborilmaydi — navbat boshini abadiy to'smasin)?
   */
  private creatorUnavailable(tempId: number, actor: string): boolean {
    const creator = this.deps.outbox.list().find(o => o.tempId === tempId);
    return !creator || creator.actor !== actor || creator.status === 'failed' || creator.status === 'blocked';
  }

  private async runInner(force: boolean): Promise<RunSummary> {
    const { outbox, send } = this.deps;
    const actor = this.deps.getActor();
    const summary: RunSummary = { synced: 0, failed: 0, linked: 0, stoppedBy: 'idle' };
    if (!actor) return { ...summary, stoppedBy: 'no-actor' };

    let refreshedOnce = false;
    // Har iteratsiyada navbatni yangidan o'qiymiz (yugurish paytida yangi amal qo'shilishi mumkin).
    for (;;) {
      const next = outbox.list(actor).find(o => o.status === 'pending');
      if (!next) return summary;

      if (!force && next.nextAttemptAt > this.now()) {
        return { ...summary, stoppedBy: 'transient', nextAttemptAt: next.nextAttemptAt };
      }

      const built = buildRequest(next, id => outbox.resolveId(id));
      if (!built.ok) {
        if (this.creatorUnavailable(built.unresolved, actor)) {
          outbox.update(next.id, { status: 'blocked', lastError: DEP_ERROR });
          continue;
        }
        // Yaratuvchi hali navbatda (oldinroq turibdi) — FIFO buzilgan holat; keyinroq.
        const at = this.now() + backoffMs(next.attempts + 1, this.deps.random);
        outbox.update(next.id, { attempts: next.attempts + 1, nextAttemptAt: at });
        return { ...summary, stoppedBy: 'transient', nextAttemptAt: at };
      }

      outbox.update(next.id, { status: 'syncing' });
      let res: SendResult;
      try {
        res = await send(built.request, next.id);
      } catch {
        res = { status: null };
      }
      const outcome = classify(next, res);

      switch (outcome.type) {
        case 'success': {
          // Yaratish muvaffaqiyatli, lekin javobda id yo'q — bog'liq amallar hech qachon hal bo'lmasdi
          // (navbat to'xtab qolardi). Jim "done" emas — foydalanuvchiga ko'rsatiladi.
          if (next.tempId !== undefined && !outcome.serverId) {
            outbox.update(next.id, { status: 'failed', lastError: NO_ID_ERROR });
            const f = outbox.get(next.id);
            if (f) this.blockDependents(f);
            summary.failed += 1;
            break;
          }
          if (next.tempId !== undefined && outcome.serverId) outbox.mapId(next.tempId, outcome.serverId);
          outbox.update(next.id, {
            status: 'done',
            doneAt: this.now(),
            serverId: outcome.serverId,
            lastError: undefined,
          });
          summary.synced += 1;
          break;
        }
        case 'link-existing': {
          if (next.tempId !== undefined) outbox.mapId(next.tempId, outcome.serverId);
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
        case 'transient': {
          const attempts = next.attempts + 1;
          const at = this.now() + backoffMs(attempts, this.deps.random);
          outbox.update(next.id, { status: 'pending', attempts, nextAttemptAt: at, lastError: outcome.error });
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
            if (ok) continue; // o'sha amal yangi token bilan qayta
          } else {
            outbox.update(next.id, { status: 'pending', lastError: outcome.error });
          }
          return { ...summary, stoppedBy: 'auth' };
        }
        case 'permanent': {
          outbox.update(next.id, { status: 'failed', attempts: next.attempts + 1, lastError: outcome.error });
          const failed = outbox.get(next.id);
          if (failed) this.blockDependents(failed);
          summary.failed += 1;
          break;
        }
      }
    }
  }
}
