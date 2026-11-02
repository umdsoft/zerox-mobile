/**
 * smsStatsCache.ts — 02.11: "SMS xabarlar tarixi" sahifasi DARHOL to'liq ochilishi uchun
 * oxirgi ma'lum ma'lumotlar (obuna SMS, sms-stats, yetkazilmagan soni) MMKV'da saqlanadi.
 * Sahifa keshdan sinxron chiziladi, yangilash orqa fonda (spinner yo'q). Kesh FOYDALANUVCHI
 * bo'yicha (user_id) — boshqa akkaunt raqamlari ko'rinmasin; user_id yo'q bo'lsa kesh ishlatilmaydi.
 */
import { storage } from '../../../../store/api/token/getToken';

const PREFIX = 'smsStatsCache:v1:';

/** Kesh shu vaqtdan eski bo'lsa ishlatilmaydi. */
export const SMS_CACHE_MAX_AGE_MS = 24 * 60 * 60_000;

export type SmsStatsSnapshot = {
  /** Kesh to'liq (obuna + stats) yangilangan vaqt (ms). Qisman yangilashda O'ZGARMAYDI. */
  cachedAt: number;
  /** /finance/subscription javobi (`data`) */
  subscription: any | null;
  /** /finance/subscription/sms-stats javobi (`data`) */
  stats: any | null;
  undelivered: number | null;
};

export const smsStatsCacheKey = (): string | null => {
  try {
    // Xodim rejimi: token EGASINING user_id si bilan almashadi — egasi ma'lumoti xodimga
    // ko'rinmasin, shuning uchun xodim sessiyasida kesh ISHLATILMAYDI (xodimSession.ts bayrog'i).
    if (storage.getString('xodim_session') === '1') return null;
    const uid = storage.getString('user_id') ?? storage.getNumber('user_id');
    return uid == null || uid === '' ? null : PREFIX + String(uid);
  } catch {
    return null;
  }
};

export const readSmsStatsCache = (): SmsStatsSnapshot | null => {
  try {
    const key = smsStatsCacheKey();
    const raw = key ? storage.getString(key) : undefined;
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object' || !v.subscription) return null;
    if (typeof v.cachedAt !== 'number') return null;
    const age = Date.now() - v.cachedAt;
    if (age < 0 || age > SMS_CACHE_MAX_AGE_MS) return null;
    return {
      cachedAt: v.cachedAt,
      subscription: v.subscription,
      stats: v.stats ?? null,
      undelivered: typeof v.undelivered === 'number' ? v.undelivered : null,
    };
  } catch {
    return null;
  }
};

export const writeSmsStatsCache = (snap: SmsStatsSnapshot): void => {
  try {
    const key = smsStatsCacheKey();
    if (key && snap.subscription) storage.set(key, JSON.stringify(snap));
  } catch {
    // kesh yozilmasa — sahifa baribir ishlaydi.
  }
};
