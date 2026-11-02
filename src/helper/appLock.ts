/**
 * appLock.ts — SEC (2026-11-02): ilovadan chiqib QAYTGANDA qulf (PIN / Touch ID / Face ID).
 *
 * Qaror — SOF funksiya (storage'siz, testlanadi). Vaqt `setTimeout` bilan EMAS, MMKV'dagi
 * `Date.now()` belgisi bilan o'lchanadi (fon/suspend paytida JS taymerlar ishlamaydi).
 */

/** Fonda shundan kam tursa — qulflanmaydi (bildirishnoma pardasi, tizim ruxsat oynasi). */
export const LOCK_GRACE_MS = 15_000;

/** MMKV kaliti: ilova 'background'ga o'tgan vaqt (ms). 'active'da o'chiriladi. */
export const LAST_BACKGROUND_KEY = 'lastBackgroundTime';

export type LockDecisionInput = {
  /** 'background'ga o'tgan vaqt (undefined = fonga o'tish ko'rilmagan, masalan iOS 'inactive' xolos). */
  lastBackgroundAt?: number | null;
  now: number;
  /** Ilovaning o'zi ochgan tashqi oyna (picker, MyID, to'lov brauzeri...) natijasi kutilmoqda. */
  suppressed: boolean;
  /** Kirgan sessiya bor (token). */
  hasSession: boolean;
  /** PIN o'rnatilgan (PIN yo'q bo'lsa ochish vositasi ham yo'q — PIN o'rnatish oqimi buzilmasin). */
  hasPin?: boolean;
  /** Foydalanuvchi allaqachon qulf ekranida — qayta reset qilinmasin (biometrik so'rov sikli). */
  onLockScreen?: boolean;
  graceMs?: number;
};

/** Fondan qaytganda ilovani qulflash kerakmi. */
export function shouldLockOnReturn(i: LockDecisionInput): boolean {
  if (!i.hasSession) return false;
  if (i.hasPin === false) return false;
  if (i.onLockScreen) return false;
  if (i.lastBackgroundAt == null) return false;
  const diff = i.now - i.lastBackgroundAt;
  // Soat orqaga surilgan (diff < 0): ishonib bo'lmaydi — XAVFSIZ tomonga (qulflaymiz), hatto
  // tashqi-oqim bayrog'i bo'lsa ham. Qoldiq xavf: soat oldinga surilsa grace yengillashadi
  // (JS'da suspend'dan o'tuvchi monotonik soat yo'q; native modul yozilmadi).
  if (diff < 0) return true;
  if (i.suppressed) return false;
  return diff >= (i.graceMs ?? LOCK_GRACE_MS);
}

/**
 * Qulf / kirish / tiklash ekranlari: shu yerda turgan foydalanuvchini qayta "qulflab" (reset)
 * bo'lmaydi, qulf holati esa baribir yoqiladi (captureGuard / NoInternet ro'yxatlari bilan mos).
 */
export const LOCK_SCREEN_ROUTES: ReadonlySet<string> = new Set([
  'SetLocalPassword', 'ResetPassCode', 'UpdateLocalPassCode', 'ChangeLocalPassword',
  'SelectLanguageScreen', 'LoginWithPhone', 'RecoveryPassword', 'NewPasswordEnter',
  'NewRecoveryPassword', 'RecoverySmsReset', 'RegisterWithJuridic', 'RegisterWithPeople',
  'CheckSmsPassword', 'Agree', 'CreateSecretWord', 'CreatePassword', 'SelectJuridical',
  'UpdatePasswordWithJshir', 'PrivacyConsentNote', 'Indentifikatsiya',
]);
