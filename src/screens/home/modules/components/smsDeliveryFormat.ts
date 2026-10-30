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

/** Ekran nomi — banner shu ekranni ochadi (Navigation.tsx da ro'yxatga olingan). */
export const SMS_SCREEN = 'QarzDaftariYetkazilmagan';

/** qarz_id -> { id } (yo'q bo'lsa null). 30.10: "Qarzni ochish" endi openCreationAmaliyot orqali. */
export const debtRouteParams = (qarzId?: number | string | null): { id: number | string } | null =>
  qarzId ? { id: qarzId } : null;

/** Banner -> ekran parametrlari (shopId yo'q/0 bo'lsa null = barcha do'konlar). */
export const smsScreenParams = (shopId?: number | null): { shopId: number | null } => ({ shopId: shopId || null });

/** Tanlangan do'kon bo'lsagina `faoliyat_id` yuboriladi. */
export const smsParams = (page: number, shopId?: number | null) => ({
  days: SMS_DAYS,
  page,
  limit: SMS_PAGE_SIZE,
  ...(shopId ? { faoliyat_id: shopId } : {}),
});

/**
 * "Yana ko'rsatish" ko'rinsinmi: sahifa to'liq (limit) bo'lmasa — oxirgi sahifa, to'xtaymiz
 * (count backendda tozalangan qatorlardan ko'p bo'lib qolishi mumkin).
 */
export const hasMorePages = (pageRows: number, count: number, loadedTotal: number = pageRows): boolean =>
  pageRows >= SMS_PAGE_SIZE && loadedTotal < count;

/** SMS yetkazilmagan deb belgilanadimi (delivery_status undelivered/rejected yoki status failed). */
export const isSmsUndelivered = (
  it: { delivery_status?: string | null; status?: string | null } | null | undefined,
): boolean => {
  const d = String(it?.delivery_status || '').toLowerCase();
  return d === 'undelivered' || d === 'rejected' || String(it?.status || '').toLowerCase() === 'failed';
};

/** Backend `failure_reason` kodi -> foydalanuvchiga tushunarli sabab (mavjud i18n matnlari qayta ishlatiladi). */
export const smsFailureText = (
  t: (k: string, o?: Record<string, unknown>) => string,
  code?: string | null,
): string => {
  switch (code) {
    case 'subscriber_inactive':
      return `${t('Operator yetkazmadi')} — ${t('abonent raqami faol emas')}`;
    case 'blocked':
      return `${t('Operator yetkazmadi')} — ${t('raqam bloklangan')}`;
    case 'invalid_number':
      return t('Yuborilmadi: {{reason}}', { reason: t('telefon raqami noto‘g‘ri') });
    case 'provider_rejected':
      return t('Yuborilmadi: {{reason}}', { reason: t('SMS xizmati matnni rad etdi') });
    case 'no_package':
      return t('Yuborilmadi: {{reason}}', { reason: t('SMS paketi tugagan') });
    case 'plan_required':
      return t('Yuborilmadi: {{reason}}', { reason: t('texnik xato') });
    case 'send_error':
      return t('Yuborilmadi: {{reason}}', { reason: t('texnik xato') });
    default:
      return t('Operator yetkazmadi');
  }
};
