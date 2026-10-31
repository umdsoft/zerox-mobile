/**
 * accountDeletion.ts — akkauntni o'chirish (Google Play / App Store talabi) API qatlami.
 *
 * Dizayn: docs/ACCOUNT_DELETION_DESIGN.md (4-5-6 bo'limlar). Backend endpointlari (backend 01.11):
 *   GET  /user/account/deletion-check -> { success, data:{ canDelete, blockers:{ activeContracts, pendingContracts,
 *                                          qarzDaftariOpen, pendingPayments, gapOrganizer, gapObligations }, balance, balanceWarning,
 *                                          requiresPassword } }
 *   POST /user/account/delete/send-otp { lang? } -> { success, data:{ ttl, cooldown } }
 *        | 429 OTP_COOLDOWN|TOO_MANY_ATTEMPTS|SMS_RATE_LIMIT (+retryAfter) | 502 SMS_FAILED | 403 FORBIDDEN
 *   POST /user/account/delete { password?, otp } -> { success, data:{ deleted:true } }
 *        | 400 OTP_REQUIRED|PASSWORD_REQUIRED|INVALID_OTP|OTP_EXPIRED | 403 INVALID_PASSWORD|FORBIDDEN
 *        | 409 HAS_BLOCKERS | 429 TOO_MANY_ATTEMPTS|RATE_LIMIT_EXCEEDED
 *
 * Maydon nomlari o'zgarsa — FAQAT shu fayl (normalizeDeletionCheck / mapDeletionError) tahrirlanadi.
 */
import apiClient from './apiClient';

export const OTP_LENGTH = 5; // recovery SMS bilan bir xil (smsRecovery pattern)
export const RESEND_COOLDOWN_SEC = 60;

export interface DeletionCheck {
  canDelete: boolean;
  activeContracts: number;
  pendingContracts: number;
  qarzDaftariOpen: number;
  pendingPayments: number;
  gapOrganizer: number;
  gapObligations: number;
  balance: number;
  hasPassword: boolean;
}

export type DeletionErrorCode =
  | 'invalid_password'
  | 'invalid_otp'
  | 'blocked'
  | 'xodim_forbidden'
  | 'admin_forbidden'
  | 'not_ready'
  | 'rate_limited'
  | 'network'
  | 'unknown';

/** Xato kodi -> i18n kaliti (string-as-key: kalit = o'zbekcha matn). */
export const DELETION_ERROR_KEYS: Record<DeletionErrorCode, string> = {
  invalid_password: 'Parol noto‘g‘ri',
  invalid_otp: 'SMS kod noto‘g‘ri yoki muddati tugagan',
  blocked: 'Hisobni hozir o‘chirib bo‘lmaydi. Shartnoma va qarzlaringizni tekshiring.',
  xodim_forbidden: 'Xodim rejimida hisobni o‘chirib bo‘lmaydi',
  admin_forbidden: 'Admin hisobini ilova orqali o‘chirib bo‘lmaydi',
  not_ready: 'Bu imkoniyat hozircha ishga tushmagan. Keyinroq urinib ko‘ring.',
  rate_limited: 'Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.',
  network: 'Serverga ulanishda xatolik yuz berdi',
  unknown: 'Xatolik yuz berdi. Qayta urinib ko‘ring.',
};

/** Backend xato kodi (UPPER_CASE) -> ekran kodi. */
const SERVER_CODES: Readonly<Record<string, DeletionErrorCode>> = {
  INVALID_PASSWORD: 'invalid_password',
  PASSWORD_REQUIRED: 'invalid_password',
  INVALID_OTP: 'invalid_otp',
  OTP_EXPIRED: 'invalid_otp',
  OTP_REQUIRED: 'invalid_otp',
  HAS_BLOCKERS: 'blocked',
  FORBIDDEN: 'xodim_forbidden',
  ADMIN_FORBIDDEN: 'admin_forbidden',
  NOT_READY: 'not_ready',
  OTP_COOLDOWN: 'rate_limited',
  TOO_MANY_ATTEMPTS: 'rate_limited',
  SMS_RATE_LIMIT: 'rate_limited',
  RATE_LIMIT_EXCEEDED: 'rate_limited',
};

const toCount = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** Javobni (data.data yoki data) xavfsiz ko'rinishga keltiradi; yetishmagan maydonlar uchun default. */
export function normalizeDeletionCheck(raw: any): DeletionCheck {
  const d = raw?.data && typeof raw.data === 'object' ? raw.data : raw || {};
  const b = d.blockers && typeof d.blockers === 'object' ? d.blockers : d;
  const activeContracts = toCount(b.activeContracts);
  const pendingContracts = toCount(b.pendingContracts);
  const qarzDaftariOpen = toCount(b.qarzDaftariOpen);
  const pendingPayments = toCount(b.pendingPayments);
  const gapOrganizer = toCount(b.gapOrganizer);
  const gapObligations = toCount(b.gapObligations);
  const noBlockers =
    activeContracts + pendingContracts + qarzDaftariOpen + pendingPayments + gapOrganizer + gapObligations === 0;
  const balance = Number(d.balance);
  return {
    // canDelete kelmasa — hisoblarga qarab; server baribir qayta tekshiradi.
    canDelete: typeof d.canDelete === 'boolean' ? d.canDelete : noBlockers,
    activeContracts,
    pendingContracts,
    qarzDaftariOpen,
    pendingPayments,
    gapOrganizer,
    gapObligations,
    balance: Number.isFinite(balance) ? balance : 0,
    // Kelmasa parol so'raymiz (xavfsiz default).
    hasPassword: typeof d.requiresPassword === 'boolean' ? d.requiresPassword
      : typeof d.hasPassword === 'boolean' ? d.hasPassword : true,
  };
}

/** Axios xatosi -> DeletionErrorCode. */
export function mapDeletionErrorCode(err: unknown): DeletionErrorCode {
  const e: any = err;
  if (!e?.response) return 'network';
  const status = Number(e.response.status);
  const code = e.response.data?.code;
  if (typeof code === 'string' && SERVER_CODES[code]) return SERVER_CODES[code];
  if (status === 429) return 'rate_limited';
  if (status === 403) return 'xodim_forbidden';
  return 'unknown';
}

/** Axios xatosi -> i18n kaliti (ekran `t(key)` bilan ko'rsatadi). */
export const mapDeletionErrorKey = (err: unknown): string =>
  DELETION_ERROR_KEYS[mapDeletionErrorCode(err)];

/** Cooldown: deadline (ms) va hozirgi vaqt (ms) bo'yicha qolgan soniya (>=0). Keep-awake kerak emas. */
export const secondsLeft = (deadlineMs: number, nowMs: number): number =>
  Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));

export async function fetchDeletionCheck(): Promise<DeletionCheck> {
  const res = await apiClient.get('/user/account/deletion-check');
  return normalizeDeletionCheck(res?.data);
}

/** SMS matni tili: backend uz|ru|kr ni qo'llaydi (kaa/en -> uz). */
export async function sendDeletionOtp(lang?: string): Promise<void> {
  const l = lang === 'ru' || lang === 'kr' ? lang : 'uz';
  await apiClient.post('/user/account/delete/send-otp', { lang: l });
}

export async function deleteAccount(params: { password?: string; otp: string }): Promise<void> {
  const body: { otp: string; password?: string } = { otp: params.otp };
  if (params.password) body.password = params.password;
  await apiClient.post('/user/account/delete', body);
}
