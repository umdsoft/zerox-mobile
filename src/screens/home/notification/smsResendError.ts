import { t } from 'i18next';

/** smsResend natijasi: 'done' — yuborildi (yoki yana yetkazilmadi); 'removed' — xato, karta olindi; 'kept' — xato, karta qoldi. */
export type SmsResendOutcome = 'done' | 'removed' | 'kept';

export interface SmsResendFailure {
  /** Foydalanuvchiga ko'rsatiladigan toast matni (tarjima qilingan). */
  message: string;
  /** true — bildirishnoma serverda o'chgan/ma'nosiz: kartani ro'yxatdan olib tashlaymiz; false — qoladi. */
  remove: boolean;
}

/**
 * POST /notification/sms-undelivered/:id/resend xatosi -> toast matni + karta qoladimi/o'chadimi.
 * Server: {success:false, code, message}. Kod bo'yicha aniq matn, 429 — status bo'yicha, qolganlari — umumiy xato.
 */
export const classifySmsResendError = (err: unknown): SmsResendFailure => {
  const res = (err as any)?.response;
  const status = Number(res?.status) || 0;
  const code = String(res?.data?.code || '');
  if (status === 429) {
    return { message: t('Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.') as string, remove: false };
  }
  switch (code) {
    case 'plan-required':
      return { message: t('Bu amal uchun tarif kerak') as string, remove: false };
    case 'no-sms-package':
      return { message: t('SMS paketi tugadi') as string, remove: false };
    case 'already-resent':
      return { message: t('Bu SMS allaqachon qayta yuborilgan') as string, remove: true };
    case 'debt-gone':
      return { message: t('Qarz mavjud emas') as string, remove: true };
    case 'debt-closed':
      return { message: t('Qarz yopilgan') as string, remove: true };
    case 'sms-not-sent':
      return { message: t('SMS yuborib bo‘lmadi. Keyinroq urinib ko‘ring.') as string, remove: false };
    case 'not-found':
      return { message: t('Xatolik sodir bo‘ldi') as string, remove: true };
    default:
      return { message: t('Xatolik sodir bo‘ldi') as string, remove: false };
  }
};
