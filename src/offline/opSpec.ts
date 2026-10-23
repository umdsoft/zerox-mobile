/**
 * Har amal turi uchun: qaysi endpointga qanday so'rov, javobdan server id, natija tasnifi.
 * Sof funksiyalar (testlanadi). Endpointlar backend `router/router/qarzDaftari.router.js` bilan bir xil.
 */
import { OpError, OpRequest, OutboxOp, SendResult } from './types';

export type Resolve = (id: number) => number | undefined;

export type BuildResult = { ok: true; request: OpRequest } | { ok: false; unresolved: number };

const need = (id: number, resolve: Resolve): number | null => {
  const r = resolve(id);
  return r === undefined ? null : r;
};

export function buildRequest(op: OutboxOp, resolve: Resolve): BuildResult {
  switch (op.kind) {
    case 'mijoz.create':
      return {
        ok: true,
        request: {
          method: 'POST',
          path: `/qarz-daftari/savdo-faoliyat/${op.payload.faoliyatId}/mijozlar`,
          body: { fish: op.payload.fish, telefon: op.payload.telefon },
        },
      };
    case 'qarz.create': {
      const mijozId = need(op.payload.body.mijoz_id, resolve);
      if (mijozId === null) return { ok: false, unresolved: op.payload.body.mijoz_id };
      return {
        ok: true,
        request: { method: 'POST', path: '/qarz-daftari/qarz', body: { ...op.payload.body, mijoz_id: mijozId } },
      };
    }
    case 'qarz.yopish': {
      const qarzId = need(op.payload.qarzId, resolve);
      if (qarzId === null) return { ok: false, unresolved: op.payload.qarzId };
      return {
        ok: true,
        request: {
          method: 'POST',
          path: `/qarz-daftari/qarz/${qarzId}/yopish`,
          body: { summa: op.payload.summa, valyuta: op.payload.valyuta },
        },
      };
    }
    case 'qarz.vozKechish': {
      const qarzId = need(op.payload.qarzId, resolve);
      if (qarzId === null) return { ok: false, unresolved: op.payload.qarzId };
      const body: Record<string, unknown> = { summa: op.payload.summa, valyuta: op.payload.valyuta };
      if (op.payload.izoh) body.izoh = op.payload.izoh;
      return { ok: true, request: { method: 'POST', path: `/qarz-daftari/qarz/${qarzId}/voz-kechish`, body } };
    }
    case 'mijoz.yopish': {
      const mijozId = need(op.payload.mijozId, resolve);
      if (mijozId === null) return { ok: false, unresolved: op.payload.mijozId };
      const body: Record<string, unknown> = {
        summa: op.payload.summa,
        valyuta: op.payload.valyuta,
        turi: op.payload.turi,
      };
      if (op.payload.faoliyatId) body.savdo_faoliyat_id = op.payload.faoliyatId;
      return { ok: true, request: { method: 'POST', path: `/qarz-daftari/mijozlar/${mijozId}/yopish`, body } };
    }
    case 'tolov.tolandi': {
      const body: Record<string, unknown> = {};
      if (op.payload.summa !== null && op.payload.summa !== undefined) body.summa = op.payload.summa;
      return { ok: true, request: { method: 'PUT', path: `/qarz-daftari/tolov/${op.payload.tolovId}/tolandi`, body } };
    }
    default:
      return { ok: false, unresolved: 0 };
  }
}

/** Yaratish amallari javobidagi server id (mijoz / qarz). */
export function extractServerId(op: OutboxOp, data: any): number | undefined {
  if (op.kind !== 'mijoz.create' && op.kind !== 'qarz.create') return undefined;
  const id = Number(data?.data?.id);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

export type Outcome =
  | { type: 'success'; serverId?: number }
  | { type: 'link-existing'; serverId: number }
  | { type: 'transient'; error: OpError }
  | { type: 'auth'; error: OpError }
  | { type: 'permanent'; error: OpError };

const errOf = (res: SendResult): OpError => ({
  status: res.status,
  code: typeof res.data?.code === 'string' ? res.data.code : undefined,
  message: typeof res.data?.message === 'string' ? res.data.message.slice(0, 300) : undefined,
});

/**
 * Natija tasnifi:
 *  - 2xx                                  -> success
 *  - 409 phone-exists (mijoz.create)      -> link-existing (temp mijoz mavjudiga bog'lanadi)
 *  - javobsiz / 5xx / 408 / 425 / 429 / 409 IDEMPOTENCY_IN_PROGRESS -> transient (backoff)
 *  - 401                                  -> auth (refresh / qayta login)
 *  - boshqa 4xx                           -> permanent (foydalanuvchi hal qiladi)
 */
export function classify(op: OutboxOp, res: SendResult): Outcome {
  const s = res.status;
  if (s !== null && s >= 200 && s < 300) return { type: 'success', serverId: extractServerId(op, res.data) };
  if (s === null || s >= 500 || s === 408 || s === 425 || s === 429) return { type: 'transient', error: errOf(res) };
  if (s === 401) return { type: 'auth', error: errOf(res) };
  if (s === 409) {
    const code = res.data?.code;
    if (code === 'IDEMPOTENCY_IN_PROGRESS') return { type: 'transient', error: errOf(res) };
    if (op.kind === 'mijoz.create' && code === 'phone-exists') {
      const existing = Number(res.data?.existing_id ?? res.data?.existing_mijoz?.id);
      if (Number.isFinite(existing) && existing > 0) return { type: 'link-existing', serverId: existing };
    }
  }
  return { type: 'permanent', error: errOf(res) };
}

/** Eksponensial backoff: 2s, 4s, 8s ... maks 5 daqiqa, ±20% jitter. */
export function backoffMs(attempts: number, random: () => number = Math.random): number {
  const base = Math.min(2000 * Math.pow(2, Math.max(attempts - 1, 0)), 5 * 60 * 1000);
  const jitter = 0.8 + random() * 0.4;
  return Math.round(base * jitter);
}
