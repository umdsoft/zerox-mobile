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
  scope: 'period', // 30.10: amaldagi tarif/paket davri bo'yicha (backend meta.scope='period')
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

/** SMS yetkazilmagan deb belgilanadimi (undelivered=true, failure_reason, delivery_status undelivered/rejected yoki status failed). */
export const isSmsUndelivered = (
  it:
    | {
        undelivered?: boolean | null;
        failure_reason?: string | null;
        delivery_status?: string | null;
        status?: string | null;
      }
    | null
    | undefined,
): boolean => {
  if (!it) return false;
  if (it.undelivered === true || !!it.failure_reason) return true;
  const d = String(it.delivery_status || '').toLowerCase();
  return d === 'undelivered' || d === 'rejected' || String(it.status || '').toLowerCase() === 'failed';
};

type Tr = (k: string, o?: Record<string, unknown>) => string;

const OPERATOR_CODES = ['subscriber_inactive', 'blocked', 'not_delivered'];

/** Backend `failure_reason` kodi -> to'liq jumla ("Operator tomonidan xabar yetkazilmadi. Abonent raqami faol emas."). */
export const smsFailureText = (t: Tr, code?: string | null): string => {
  const op = t('Operator tomonidan xabar yetkazilmadi.');
  switch (code) {
    case 'subscriber_inactive':
      return `${op} ${t('Abonent raqami faol emas.')}`;
    case 'blocked':
      return `${op} ${t('Raqam bloklangan.')}`;
    case 'invalid_number':
      return t('Telefon raqami noto‘g‘ri.');
    case 'provider_rejected':
      return t('SMS xizmati matnni rad etdi.');
    case 'no_package':
      return t('SMS paketi tugagan.');
    case 'plan_required':
    case 'send_error':
      return t('Texnik xato.');
    default:
      return op;
  }
};

/** "SMS nima uchun yetkazilmadi" oynasi: qizil sarlavha + tushuntirish (sayt dizayni). */
export const smsFailureModalText = (
  t: Tr,
  code?: string | null,
): { headline: string; description: string } => {
  const isOperator = !code || OPERATOR_CODES.includes(code);
  const headline = isOperator
    ? t('Yetkazilmagan: operator xabarni yetkazmadi')
    : t('Yetkazilmagan: xabar yuborilmadi');
  const description =
    !code || code === 'not_delivered'
      ? t('Xabar yuborildi, lekin mobil operator uni abonentga yetkaza olmadi. Keyinroq qayta urinib ko‘rishingiz mumkin.')
      : smsFailureText(t, code);
  return { headline, description };
};
