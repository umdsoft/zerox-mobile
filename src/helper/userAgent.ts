/**
 * userAgent.ts — SS-AUDIT (2026-09-25): qurilmaga xos `User-Agent`.
 *
 * ILDIZ SABAB: backend (controllers/User.js `issueAuthTokens`/`getSessions`)
 * qurilma sessiyalarini `user_agent` bo'yicha ajratadi va "shu qurilmadan"
 * oldingi aktiv sessiyalarni bekor qiladi. Android'da RN/okhttp default UA
 * `okhttp/4.12.0` — BARCHA Android telefonlar bir xil ko'rinadi, natijada bir
 * odamning ikkinchi Android telefoni birinchisini logout qilardi.
 *
 * Satr namunasi:
 *   ZeroX/1.9 (android 14; SM-S911B; 9f1c...)
 *   ZeroX/1.9 (ios 17.5; iPhone 15 Pro; 2A3B...)
 *
 * Backend o'zgarishi shart emas — UA satri qurilma bo'yicha farqlansa yetadi
 * (`writeLoginArchive` /Android|iOS/ regex'lari ham mos keladi).
 */
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

let cached: string | null = null;

/** HTTP header qiymati uchun faqat ASCII (ISO-8859-1) — boshqa belgilar olib tashlanadi. */
const asciiOnly = (s: string): string =>
  String(s || '')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/[();]/g, '')
    .trim();

export const getDeviceUserAgent = (): string => {
  if (cached) return cached;
  let version = '0';
  let model = 'unknown';
  let uid = 'unknown';
  try {
    version = DeviceInfo.getVersion();
  } catch {}
  try {
    model = DeviceInfo.getModel();
  } catch {}
  try {
    // Android: ANDROID_ID, iOS: identifierForVendor — reinstall'da o'zgarishi
    // mumkin, lekin bitta o'rnatish davomida barqaror (sessiya uchun yetarli).
    uid = DeviceInfo.getUniqueIdSync();
  } catch {}
  const os = `${Platform.OS} ${String(Platform.Version)}`;
  cached = `ZeroX/${asciiOnly(version) || '0'} (${asciiOnly(os)}; ${
    asciiOnly(model) || 'unknown'
  }; ${asciiOnly(uid) || 'unknown'})`;
  return cached;
};
