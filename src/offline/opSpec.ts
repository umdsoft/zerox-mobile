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
  | { type: 'transient'; error: OpError; retryAfterMs?: number; serverError: boolean }
  | { type: 'committed'; error: OpError }
  | { type: 'auth'; error: OpError }
  | { type: 'permanent'; error: OpError };

const errOf = (res: SendResult): OpError => ({
  status: res.status,
  code: typeof res.data?.code === 'string' ? res.data.code : undefined,
  message: typeof res.data?.message === 'string' ? res.data.message.slice(0, 300) : undefined,
});

/** 24.10: serverda BAJARILGAN, lekin saqlangan javobi yo'qolgan — qayta yuborish/yangi kalit = dublikat. */
export const CODE_RESPONSE_UNAVAILABLE = 'IDEMPOTENCY_RESPONSE_UNAVAILABLE';
/** 24.10: kalit boshqa body bilan ishlatilgan — klient xatosi; yangi kalit bilan yuborish xavfli. */
export const CODE_KEY_REUSED = 'IDEMPOTENCY_KEY_REUSED';
/** 24.10: telefon band, lekin ism boshqa — avtomatik bog'lanmaydi. */
export const CODE_PHONE_OTHER = 'phone-exists';

/**
 * Yakuniy xato: "Qayta urinish" ham, "Summani o'zgartirish" (yangi kalit) ham amalni IKKINCHI marta
 * bajarishi mumkin — faqat ko'rsatiladi / bekor qilinadi.
 */
export function isTerminalFailure(op: OutboxOp): boolean {
  if (op.status !== 'failed') return false;
  const c = op.lastError?.code;
  return c === CODE_RESPONSE_UNAVAILABLE || c === CODE_KEY_REUSED;
}

/** FISH taqqoslash uchun: registr, bo'shliq va apostrof turlari e'tiborsiz. */
export function normFish(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[\s'`´ʻʼ‘’"]/g, '');
}

/** `Retry-After` sarlavhasi (soniya yoki HTTP sana) -> ms; noto'g'ri bo'lsa undefined. 1 soatdan oshmaydi. */
export function parseRetryAfter(raw: unknown, now: number = Date.now()): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const sec = Number(raw);
  let ms: number;
  if (Number.isFinite(sec)) ms = sec * 1000;
  else {
    const at = Date.parse(String(raw));
    if (!Number.isFinite(at)) return undefined;
    ms = at - now;
  }
  if (!(ms > 0)) return undefined;
  return Math.min(ms, 3600 * 1000);
}

/**
 * Natija tasnifi:
 *  - 2xx                                  -> success
 *  - 409 phone-exists (mijoz.create) + FISH mos -> link-existing (temp mijoz mavjudiga bog'lanadi);
 *    FISH boshqa (yoki noma'lum)          -> permanent (foydalanuvchi o'zi tanlaydi; existingId saqlanadi)
 *  - javobsiz / 5xx / 408 / 425 / 429 / 409 IDEMPOTENCY_IN_PROGRESS -> transient (backoff, Retry-After)
 *  - 409 IDEMPOTENCY_RESPONSE_UNAVAILABLE -> committed (serverda bajarilgan, javobi yo'q)
 *  - 401                                  -> auth (refresh / qayta login)
 *  - boshqa 4xx (shu jumladan 409 IDEMPOTENCY_KEY_REUSED) -> permanent (foydalanuvchi hal qiladi)
 */
export function classify(op: OutboxOp, res: SendResult): Outcome {
  const s = res.status;
  if (s !== null && s >= 200 && s < 300) return { type: 'success', serverId: extractServerId(op, res.data) };
  if (s === null || s >= 500 || s === 408 || s === 425 || s === 429) {
    return { type: 'transient', error: errOf(res), retryAfterMs: res.retryAfterMs, serverError: s !== null && s >= 500 };
  }
  if (s === 401) return { type: 'auth', error: errOf(res) };
  if (s === 409) {
    const code = res.data?.code;
    if (code === 'IDEMPOTENCY_IN_PROGRESS') {
      return { type: 'transient', error: errOf(res), retryAfterMs: res.retryAfterMs, serverError: false };
    }
    if (code === CODE_RESPONSE_UNAVAILABLE) return { type: 'committed', error: errOf(res) };
    if (op.kind === 'mijoz.create' && code === CODE_PHONE_OTHER) {
      const existing = Number(res.data?.existing_id ?? res.data?.existing_mijoz?.id);
      if (Number.isFinite(existing) && existing > 0) {
        const existingFish = res.data?.existing_mijoz?.fish;
        // Faqat ISM ham mos bo'lsa — aks holda boshqa odamning daftariga qarzlar jim yozilardi.
        if (normFish(existingFish) && normFish(existingFish) === normFish(op.payload.fish)) {
          return { type: 'link-existing', serverId: existing };
        }
        return {
          type: 'permanent',
          error: {
            ...errOf(res),
            existingId: existing,
            existingFish: typeof existingFish === 'string' ? existingFish.slice(0, 120) : undefined,
          },
        };
      }
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

/** 24.10: backoff, lekin server `Retry-After` so'ragan bo'lsa — kamida shuncha. */
export function retryDelayMs(attempts: number, retryAfterMs?: number, random: () => number = Math.random): number {
  return Math.max(backoffMs(attempts, random), retryAfterMs || 0);
}

/** 24.10: shuncha ketma-ket 5xx javobdan keyin amal `failed` (vaqtinchalik) — navbat abadiy to'xtamasin. */
export const MAX_SERVER_ERRORS = 8;

/**
 * 24.10: amal QAYSI mijozga tegishli (xom id: temp yoki server). Bir mijozning oldingi amali
 * muvaffaqiyatsiz bo'lsa, keyingilari yuborilmaydi (masalan yangi qarz 402 bilan rad etilgan,
 * mijozni yopish esa eski qarzlarga tushib qolardi).
 */
export function customerRef(op: OutboxOp): number | undefined {
  let id: unknown;
  switch (op.kind) {
    case 'mijoz.create':
      id = op.tempId;
      break;
    case 'qarz.create':
      id = op.payload.body.mijoz_id;
      break;
    case 'mijoz.yopish':
      id = op.payload.mijozId;
      break;
    default:
      id = op.meta.mijozId;
  }
  const n = Number(id);
  return Number.isFinite(n) && n !== 0 ? n : undefined;
}
