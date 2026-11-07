import { t } from 'i18next';

/**
 * 07.11 (backend imzolash xavfsizligi): qarz shartnomasi amallari (/contract/act, deb-uzay, vos-kechish, talab,
 * /notification/success, toliq-qaytarish, qisman-qaytarish, time) ROLGA qarab tekshiriladi va mijoz yuborgan
 * sender/reciver/status/type ga ishonilmaydi. Xato javoblari `msg` YOKI `message` kalitida keladi.
 * Bu modul axios xatosini foydalanuvchiga tushunarli (tarjima qilingan) toast matniga aylantiradi.
 */
export interface ContractActionFailure {
  /** Toast matni; null — xato boshqa joyda ko'rsatilgan (oferta oynasi / o'chirilgan hisob), toast kerak emas. */
  message: string | null;
  /** true — bildirishnoma eskirgan/allaqachon ko'rib chiqilgan: kartani olib tashlab, ro'yxatni yangilash kerak. */
  stale: boolean;
  /** Server kodi (`msg` | `message` | `code`), yoki ''. */
  code: string;
}

/** Server xato kodi: `msg` (contract endpointlari) yoki `message` (notification endpointlari), so'ng `code`. */
export const contractActionErrorCode = (err: unknown): string => {
  const d = (err as any)?.response?.data;
  if (/^SIGN_/.test(String(d?.code || ''))) return String(d.code);
  return String(d?.msg || d?.message || d?.code || '');
};

const STALE_CODES = new Set([
  'already-processed',
  'notification-type-mismatch',
  'notification-act-mismatch',
  'act-type-mismatch',
  'act-mismatch',
]);

/**
 * @param fallbackKey — aniq sabab topilmasa (tarmoq xatosi, noma'lum javob) ko'rsatiladigan i18n kalit
 *   (ekranning avvalgi umumiy xato matni saqlanadi).
 */
export const classifyContractActionError = (
  err: unknown,
  fallbackKey = 'Xatolik sodir bo‘ldi',
): ContractActionFailure => {
  const e = err as any;
  const code = contractActionErrorCode(err);
  // Interceptor allaqachon ishlov bergan: oferta oynasi ochildi / hisob o'chirilgan (majburiy chiqish).
  if (e?.ofertaRequired || e?.accountDeleted) {
    return { message: null, stale: false, code };
  }
  const status = Number(e?.response?.status) || 0;
  const stale = STALE_CODES.has(code) || status === 409;
  switch (code) {
    case 'only-lender':
      return { message: (t('Bu amalni faqat qarz beruvchi bajara oladi') as string), stale, code };
    case 'only-borrower':
      return { message: (t('Bu amalni faqat qarz oluvchi bajara oladi') as string), stale, code };
    case 'invalid-end-date':
      return { message: (t('Muddat kelajakdagi sana bo‘lishi kerak') as string), stale, code };
    case 'already-processed':
      return { message: (t('Bu so‘rov allaqachon ko‘rib chiqilgan') as string), stale, code };
    case 'creator-cannot-approve':
      return { message: (t('O‘zingiz yaratgan shartnomani tasdiqlay olmaysiz') as string), stale, code };
    case 'notification-type-mismatch':
    case 'notification-act-mismatch':
    case 'act-type-mismatch':
    case 'act-mismatch':
      return { message: (t('Bu bildirishnoma ushbu amal uchun yaroqsiz') as string), stale, code };
    case 'invalid-act-type':
    case 'invalid-stype':
    case 'act-required':
      return { message: (t('So‘rov noto‘g‘ri yuborildi. Ilovani yangilang.') as string), stale, code };
    // 07.11: elektron imzo (odatda SignSheet o'zi ko'rsatadi; bu yerga faqat oynadan tashqari yo'l tushadi).
    case 'SIGN_REQUIRED':
      return { message: (t('Bu amal elektron imzo talab qiladi') as string), stale, code };
    case 'SIGN_INVALID':
      return { message: (t('Kod noto‘g‘ri') as string), stale, code };
    case 'SIGN_EXPIRED':
      return { message: (t('Kod muddati o‘tdi, qaytadan oling') as string), stale, code };
    case 'SIGN_LOCKED':
      return { message: (t('Urinishlar tugadi, keyinroq urinib ko‘ring') as string), stale, code };
    case 'SIGN_DOC_CHANGED':
      return { message: (t('Hujjat o‘zgargan, qaytadan oching') as string), stale, code };
    case 'contract-not-found':
      return { message: (t('Shartnoma topilmadi.') as string), stale, code };
    default:
      break;
  }
  if (status === 409) return { message: (t('Bu so‘rov allaqachon ko‘rib chiqilgan') as string), stale, code };
  if (status === 403) return { message: (t('Ruxsat yo‘q') as string), stale, code };
  if (status === 429) {
    return { message: (t('Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.') as string), stale, code };
  }
  if (status >= 500) {
    return { message: (t('Server xatosi. Birozdan so‘ng qayta urinib ko‘ring.') as string), stale, code };
  }
  return { message: (t(fallbackKey) as string), stale, code };
};

/** Toast parametrlari (ekranlardagi mavjud `error2` uslubi). message null bo'lsa — null (toast ko'rsatilmaydi). */
export const contractActionErrorToast = (failure: ContractActionFailure, visibilityTime = 3500) =>
  failure.message
    ? {
        autoHide: true,
        visibilityTime,
        position: 'bottom' as const,
        type: 'error2',
        props: { desc: failure.message },
      }
    : null;

/**
 * Rol tekshiruvi (UI): joriy foydalanuvchi shartnomada qarz beruvchi (`debitor`) / qarz oluvchi (`creditor`)mi.
 * Ma'lumot yetishmasa (id yoki tomon yo'q) — `undefined` (noma'lum): UI eski xulqni saqlaydi, server baribir tekshiradi.
 */
export const contractRole = (
  userId: unknown,
  contract: { debitor?: unknown; creditor?: unknown } | null | undefined,
): 'lender' | 'borrower' | 'none' | undefined => {
  if (userId == null || userId === '' || !contract) return undefined;
  const d = contract.debitor;
  const c = contract.creditor;
  if (d == null && c == null) return undefined;
  const me = String(userId);
  if (d != null && String(d) === me) return 'lender';
  if (c != null && String(c) === me) return 'borrower';
  return 'none';
};
