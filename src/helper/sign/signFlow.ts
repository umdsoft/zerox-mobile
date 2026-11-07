/**
 * 07.11 — elektron imzo (bir martalik kod) oqimi (sign-spec §1, §2, §4).
 *
 * Yuridik oqibatli amal (shartnoma yaratish/tasdiqlash, qaytarish/muddat tasdig'i, akt, uzaytirish, voz kechish)
 * endi "bitta tugma" emas: ekran `signAndSend({...})` ni chaqiradi -> global <SignSheet/> ochiladi (shartlar +
 * majburiy rozilik belgisi + "Kod olish") -> POST /sign/challenge -> 6 xonali kod -> asosiy endpoint
 * `sign: { challenge_id, code }` bilan chaqiriladi (`send`). Rad etish (stype 2) va talab — kodsiz.
 *
 * Natija:
 *   - `send` javobi (muvaffaqiyat yoki 200 + success:false — ekran avvalgidek ishlaydi);
 *   - `null` — foydalanuvchi bekor qildi yoki imzo yakuniy rad etildi (SIGN_LOCKED / SIGN_DOC_CHANGED — toast shu yerda);
 *   - throw — imzoga aloqasiz xato (rol 403, tarmoq ...): ekranning mavjud catch'i (contractActionError) ko'rsatadi.
 */
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../../screens/constants';
import { fmtDmyTk } from '../date';

export type SignPurpose =
  | 'contract_create'
  | 'contract_approve'
  | 'repayment_confirm'
  | 'time_confirm'
  | 'act_create'
  | 'debt_extend'
  | 'debt_forgive';

export interface SignPayload {
  challenge_id: string;
  code: string;
}

/** POST /sign/challenge tanasi (purpose'dan tashqari). */
export interface SignChallengeTarget {
  contract?: unknown;
  act?: unknown;
  notification?: unknown;
  payload?: Record<string, unknown>;
}

/** Imzo oynasidagi asosiy shartlar (tayyor, tarjima qilingan matnlar). */
export interface SignSummary {
  /** Hujjat turi (masalan "Qarz shartnomasi"). */
  docType: string;
  lender?: string;
  borrower?: string;
  amount?: string;
  currency?: string;
  dueDate?: string;
  number?: string;
}

export interface SignChallenge {
  challenge_id: string;
  channel: 'telegram' | 'sms' | string;
  destination_masked: string;
  expires_in: number;
  doc_hash?: string;
}

export interface SignRequest<T> {
  purpose: SignPurpose;
  target: SignChallengeTarget;
  summary: SignSummary;
  send: (sign: SignPayload) => Promise<T>;
}

/** POST /sign/challenge — kod yuborish. Xato (rol 403, 429 rate-limit ...) chaqiruvchiga otiladi. */
export const requestSignChallenge = async (
  purpose: SignPurpose,
  target: SignChallengeTarget,
): Promise<SignChallenge> => {
  const token = storage.getString('token');
  const { data } = await axios.post(
    URL + '/sign/challenge',
    { purpose, ...target },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!data?.challenge_id) {
    const err: any = new Error('sign-challenge-failed');
    err.response = { status: 200, data };
    throw err;
  }
  return {
    challenge_id: String(data.challenge_id),
    channel: data.channel,
    destination_masked: String(data.destination_masked || ''),
    expires_in: Number(data.expires_in) > 0 ? Number(data.expires_in) : 300,
    doc_hash: data.doc_hash,
  };
};

/** Imzo oynasi uchun summa: "1 500 000" / "655,77" (yengil — i18n/money modullarini yuklamaydi). Yaroqsiz -> undefined. */
export const signMoney = (v: unknown): string | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  const cents = Math.round(Math.abs(n) * 100) % 100;
  const int = Math.floor(Math.round(Math.abs(n) * 100) / 100);
  const head = `${n < 0 ? '-' : ''}${String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
  return cents ? `${head},${String(cents).padStart(2, '0')}` : head;
};

/** Imzo oynasi uchun sana "DD.MM.YYYY" (Toshkent kuni). Yaroqsiz -> undefined. */
export const signDate = (v: unknown): string | undefined => {
  if (v == null || v === '') return undefined;
  const d = fmtDmyTk(v);
  return /NaN/.test(d) ? undefined : d;
};

export type SignErrorKind = 'invalid' | 'expired' | 'locked' | 'doc_changed' | 'required';

/** Imzo xatosi (asosiy endpoint yoki challenge javobi): `code` bo'yicha; imzoga aloqasiz bo'lsa null. */
export const classifySignError = (err: unknown): { kind: SignErrorKind; attemptsLeft?: number } | null => {
  const res = (err as any)?.response;
  const d = res?.data;
  const code = String(d?.code || d?.msg || d?.message || '');
  switch (code) {
    case 'SIGN_INVALID': {
      const n = Number(d?.attempts_left);
      return { kind: 'invalid', attemptsLeft: Number.isFinite(n) ? n : undefined };
    }
    case 'SIGN_EXPIRED':
      return { kind: 'expired' };
    case 'SIGN_LOCKED':
      return { kind: 'locked' };
    case 'SIGN_DOC_CHANGED':
      return { kind: 'doc_changed' };
    case 'SIGN_REQUIRED':
      return { kind: 'required' };
    default:
      return Number(res?.status) === 428 ? { kind: 'required' } : null;
  }
};

/* ---------- global oyna holati (SignSheet host obuna bo'ladi) ---------- */

export interface ActiveSignRequest {
  id: number;
  request: SignRequest<any>;
  resolve: (v: any) => void;
  reject: (e: unknown) => void;
}

type Listener = (r: ActiveSignRequest | null) => void;
let active: ActiveSignRequest | null = null;
let seq = 0;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach(l => l(active));

export const subscribeSign = (l: Listener): (() => void) => {
  listeners.add(l);
  l(active);
  return () => {
    listeners.delete(l);
  };
};

export const getActiveSign = () => active;

/** Oyna natijasini yakunlaydi (host chaqiradi). */
export const finishSign = (id: number, outcome: { value?: any; error?: unknown }) => {
  if (!active || active.id !== id) return;
  const cur = active;
  active = null;
  emit();
  if ('error' in outcome && outcome.error !== undefined) cur.reject(outcome.error);
  else cur.resolve(outcome.value ?? null);
};

/**
 * Imzo oynasini ochadi va kod bilan `send` ni bajaradi. Oyna ochiq bo'lsa (ikkinchi amal) — avvalgisi bekor
 * qilinadi. Host o'rnatilmagan bo'lsa (kutilmagan) — xato otiladi (amal kodsiz yuborilmaydi).
 */
export function signAndSend<T>(request: SignRequest<T>): Promise<T | null> {
  if (!listeners.size) {
    return Promise.reject(new Error('sign-sheet-not-mounted'));
  }
  if (active) finishSign(active.id, { value: null });
  return new Promise<T | null>((resolve, reject) => {
    seq += 1;
    active = { id: seq, request, resolve, reject };
    emit();
  });
}
