// SS-SEC (2026-09-25): tashqi havolalarni faqat xavfsiz sxemalar bilan ochamiz.
// Server/foydalanuvchi ma'lumotidan kelgan URL (masalan gap "location", karta
// havolasi) `file:`, `javascript:`, `intent:` yoki `content:` bo'lib qolmasin.
import { Linking } from 'react-native';

const ALLOWED_SCHEMES = /^(https:|tel:|sms:|mailto:|tg:)/i;

export const isSafeUrl = (url: unknown): url is string =>
  typeof url === 'string' && ALLOWED_SCHEMES.test(url.trim());

const HTTPS_HOST_RE = /^https:\/\/([a-z0-9.-]+)(?::\d+)?(?:[/?#]|$)/i;

/** https URL hosti `hosts` ro'yxatidan biriga (yoki uning subdomeniga) tegishlimi? */
export const isAllowedHost = (url: string, hosts: readonly string[]): boolean => {
  const m = HTTPS_HOST_RE.exec(url.trim());
  if (!m) return false;
  const host = m[1].toLowerCase();
  return hosts.some(h => host === h || host.endsWith(`.${h}`));
};

/** Telefon raqamini faqat raqam va yetakchi '+' ga keltiradi (tel:/sms: injection'siz). */
export const sanitizePhone = (phone: unknown): string => {
  const raw = String(phone ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  return (raw.startsWith('+') ? '+' : '') + digits;
};

/**
 * Ruxsat etilgan sxema bo'lsa ochadi; aks holda jim rad etadi (false).
 * `allowedHosts` berilsa, https havolalar faqat shu hostlarga (tel:/sms:/mailto: o'zgarishsiz).
 */
export const safeOpenURL = (url: unknown, allowedHosts?: readonly string[]): Promise<boolean> => {
  if (!isSafeUrl(url)) return Promise.resolve(false);
  if (allowedHosts && /^https:/i.test(url.trim()) && !isAllowedHost(url, allowedHosts)) {
    return Promise.resolve(false);
  }
  return Linking.openURL(url.trim())
    .then(() => true)
    .catch(() => false);
};
