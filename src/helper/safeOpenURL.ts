// SS-SEC (2026-09-25): tashqi havolalarni faqat xavfsiz sxemalar bilan ochamiz.
// Server/foydalanuvchi ma'lumotidan kelgan URL (masalan gap "location", karta
// havolasi) `file:`, `javascript:`, `intent:` yoki `content:` bo'lib qolmasin.
import { Linking } from 'react-native';

const ALLOWED_SCHEMES = /^(https:|tel:|sms:|mailto:|tg:)/i;

export const isSafeUrl = (url: unknown): url is string =>
  typeof url === 'string' && ALLOWED_SCHEMES.test(url.trim());

/** Ruxsat etilgan sxema bo'lsa ochadi; aks holda jim rad etadi (false). */
export const safeOpenURL = (url: unknown): Promise<boolean> => {
  if (!isSafeUrl(url)) return Promise.resolve(false);
  return Linking.openURL(url.trim())
    .then(() => true)
    .catch(() => false);
};
