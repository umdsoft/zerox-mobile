/**
 * smsDeliveryFormat.ts — "Yetkazilmagan SMS" ro'yxati uchun sof (UI'siz) yordamchilar.
 * Web: frontend/components/qarz-daftari/SmsDeliveryAlert.vue bilan bir xil xaritalar.
 */

export type SmsTypeCode = 'registration' | 'auto' | 'manual' | 'qarz_tolandi' | 'payment_link' | 'other';
export type SmsRawDetail = 'expired' | 'rejected' | 'undeliv';
export type SmsFailCode = 'NO_PACKAGE' | 'INVALID_PHONE' | 'PROVIDER_400' | 'NO_TOKEN' | 'other';

export interface UndeliveredSms {
  id: number | string;
  mijoz_id?: number | string | null;
  mijoz_fish?: string | null;
  phone?: string | null;
  qarz_id?: number | string | null;
  sms_type?: string | null;
  created_at?: string | null;
  state?: string | null;
  reason?: string | null;
  raw?: string | null;
}

export type SmsReason =
  | { kind: 'operator'; detail: SmsRawDetail | null }
  | { kind: 'failed'; code: SmsFailCode };

export const SMS_DAYS = 7;
export const SMS_PAGE_SIZE = 20;

const KNOWN_TYPES: SmsTypeCode[] = ['registration', 'auto', 'manual', 'qarz_tolandi', 'payment_link'];
const KNOWN_FAIL: SmsFailCode[] = ['NO_PACKAGE', 'INVALID_PHONE', 'PROVIDER_400', 'NO_TOKEN'];
const RAW_DETAIL: Record<string, SmsRawDetail> = {
  EXPIRED: 'expired',
  REJECTD: 'rejected',
  REJECTED: 'rejected',
  UNDELIV: 'undeliv',
  UNDELIVERABLE: 'undeliv',
  UNDELIVERED: 'undeliv',
};

export const smsTypeCode = (type?: string | null): SmsTypeCode =>
  (KNOWN_TYPES as string[]).includes(String(type)) ? (type as SmsTypeCode) : 'other';

export const smsReason = (r: Pick<UndeliveredSms, 'state' | 'reason' | 'raw'>): SmsReason => {
  if (r.state === 'undelivered') {
    return { kind: 'operator', detail: RAW_DETAIL[String(r.raw || '').toUpperCase()] ?? null };
  }
  const code = (KNOWN_FAIL as string[]).includes(String(r.reason)) ? (r.reason as SmsFailCode) : 'other';
  return { kind: 'failed', code };
};

/** Yangi qatorlarni id bo'yicha takrorsiz qo'shadi (offset sahifalash qatorni ikki marta qaytarishi mumkin). */
export const mergeSmsRows = (existing: UndeliveredSms[], incoming: UndeliveredSms[]): UndeliveredSms[] => {
  const seen = new Set(existing.map(r => String(r.id)));
  return [...existing, ...incoming.filter(r => !seen.has(String(r.id)))];
};

/** Tanlangan do'kon bo'lsagina `faoliyat_id` yuboriladi. */
export const smsParams = (page: number, shopId?: number | null) => ({
  days: SMS_DAYS,
  page,
  limit: SMS_PAGE_SIZE,
  ...(shopId ? { faoliyat_id: shopId } : {}),
});
