/**
 * SEC (2026-10-31): maxfiy ekranlarda screenshot / ekran yozib olish himoyasi.
 *
 * Ilgari faqat SetLocalPassword va ScanFaceMyId himoyalangan edi. Endi navigatsiya holati
 * ('state' listener) bo'yicha ekran nomiga qarab prevent/allow qilinadi (Navigation.tsx
 * tegilmaydi). Android: kutubxona prevent()'i FLAG_SECURE (screenshot + recent-apps
 * oldindan ko'rinishi). iOS: screenshot/record route bo'yicha; app-switcher xiralashtirish
 * (matnli qoplama) butun ilova uchun doimiy.
 *
 * ISTISNO: `QrCode` himoyalanmaydi — u react-native-view-shot orqali QR rasmini oladi.
 */
import { Platform } from 'react-native';
import { CaptureProtection } from 'react-native-capture-protection';

// Aniq nomlar.
const PROTECTED_EXACT = new Set<string>([
  // PIN / qulf / kirish
  'SetLocalPassword', 'ChangeLocalPassword', 'UpdateLocalPassCode', 'ResetPassCode',
  'CreatePassword', 'ChangePassword', 'ChangePasswordRetry', 'NewPasswordEnter', 'UpdatePassword',
  'UpdatePasswordWithJshir', 'RecoveryPassword', 'RecoverySmsReset', 'Security', 'DeleteAccount',
  // MyID / identifikatsiya
  'MyIdScreen', 'ScanFaceMyId', 'Indentifikatsiya', 'FingerScanner', 'EnterJsh',
  'ChangePassportData',
  // shartnomalar / PDF ko'rinishlar
  'Contract', 'ShowContract', 'QarzShartnomasi', 'Dalol', 'DownloadStatistic',
  // qarz amallari
  'GiveDebtUser', 'CreditorDebitor', 'Debitor', 'HistoryDebt', 'UserInformationOfDebt',
  'FullDebtBack', 'FullDebtSelect', 'PartDebtBack', 'CharityDebt', 'MuddatOzQolgan',
  'UserMoneyResult', 'ShaxsiyQarz', 'ShaxsiyMoliya', 'FinancialHealth',
  // balans / to'lov / o'tkazma
  'Pay', 'PayScreen', 'SendMoney', 'SendMoneyHistory', 'Types',
  // statistika
  'Statistic', 'StatisticCreditor', 'StatisticDebitor',
]);
// Prefikslar: qarz daftari, moliya, qarzdan chiqish rejasi, qarz muddati/olish.
const PROTECTED_PREFIXES = ['QarzDaftari', 'Finance', 'DebtPlan', 'DebtTake', 'DebtLength', 'DebtDate', 'DebtEntry'];

export const isProtectedRoute = (name?: string): boolean => {
  if (!name) return false;
  if (PROTECTED_EXACT.has(name)) return true;
  return PROTECTED_PREFIXES.some(p => name.startsWith(p));
};

let current = false;

const prevent = () =>
  CaptureProtection.prevent({ screenshot: true, record: true }).catch(() => {});
// iOS'da argumentsiz allow() app-switcher himoyasini ham olib tashlaydi — aniq beramiz.
const allow = () => CaptureProtection.allow({ screenshot: true, record: true }).catch(() => {});

/** Joriy ekran nomi bo'yicha himoyani yoqadi/o'chiradi (o'zgarish bo'lsagina). */
export const applyCaptureProtection = (routeName?: string): void => {
  const need = isProtectedRoute(routeName);
  if (need === current) return;
  current = need;
  if (need) prevent();
  else allow();
};

/** navigationRef'ga 'state' listener o'rnatadi. Qaytgan funksiya — listener'ni olib tashlash. */
export const installCaptureGuard = (navRef: { current: any }): (() => void) | undefined => {
  const ref = navRef.current;
  if (!ref?.addListener) return undefined;
  if (Platform.OS === 'ios') {
    // App-switcher: fon'ga o'tganda oynani qoplab turadi (butun ilova).
    CaptureProtection.prevent({
      appSwitcher: { text: 'ZeroX', textColor: '#111111', backgroundColor: '#ffffff' },
    }).catch(() => {});
  }
  const update = () => applyCaptureProtection(ref.getCurrentRoute?.()?.name);
  update();
  const unsub = ref.addListener('state', update);
  return () => {
    unsub?.();
  };
};
