import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../theme/rd';
import { LedgerIcon, WifiOffIcon } from '../redesign/icons';
import { navigationRef } from '../../../navigation/NavigationRef';
import { storage } from '../../../store/api/token/getToken';
import { startOfflineSync } from '../../../offline/syncManager';

/**
 * 23.10 (oflayn rejim): Qarz daftari ekranlari internetsiz ishlaydi — ularda bu to'liq ekran
 * overlay KO'RSATILMAYDI (ekran tepasida OfflineBanner bor). Boshqa ekranlarda overlay'da
 * "Qarz daftari — oflayn rejim" tugmasi: do'kon internet/svet o'chganda ham savdoni davom ettiradi.
 */
/**
 * 24.10: ANIQ ro'yxat (ilgari `startsWith('QarzDaftari')` — onlayn-only ekranlar ham, masalan
 * do'kon yaratish/tahrirlash, rekvizitlar, karta, xodimlar, eslatma, ochiq qolib, so'rovlari jim
 * yiqilardi). Faqat oflayn rejimni qo'llab-quvvatlaydigan (kesh / navbat) ekranlar.
 * Onlayn-only qarz-daftari ekranlarida overlay ko'rinadi — undagi "Qarz daftari — oflayn rejim"
 * tugmasi daftar bosh sahifasiga qaytaradi.
 * PIN qulfi lokal tekshiriladi (verifyPin) — internetsiz ham ochiladi, overlay uni yopmasin.
 */
export const OFFLINE_CAPABLE_ROUTES = new Set([
  'QarzDaftari', // dashboard (TAB)
  'QarzDaftariKiritish',
  'QarzDaftariQarzlar',
  'QarzDaftariMijozlar',
  'QarzDaftariMijozYangi', // yaratish — navbat; tahrirlash oflaynda o'zi rad etadi
  'QarzDaftariMijoz',
  'QarzDaftariYangi',
  'QarzDaftariYopish',
  'QarzDaftariVozKechish',
  'QarzDaftariKvitansiya',
  'QarzDaftariAmaliyotlar',
  'QarzDaftariAmaliyot',
  'QarzDaftariSinxron',
  'SetLocalPassword',
]);
const isOfflineCapableRoute = (name?: string) => !!name && OFFLINE_CAPABLE_ROUTES.has(name);

/**
 * 23.10 XAVFSIZLIK: oflayn tugma PIN qulfini chetlab o'tmasin. Qulf/kirish/ro'yxat ekranlarida
 * (yoki ilova fonga ketib qulflangan bo'lsa) tugma ko'rsatilmaydi — avval PIN kiritiladi.
 */
const PRE_AUTH_ROUTES = new Set([
  'SelectLanguageScreen', 'SetLocalPassword', 'LoginWithPhone', 'RecoveryPassword', 'NewPasswordEnter',
  'NewRecoveryPassword', 'RecoverySmsReset', 'RegisterWithJuridic', 'RegisterWithPeople', 'CheckSmsPassword',
  'Agree', 'CreateSecretWord', 'CreatePassword', 'SelectJuridical', 'UpdatePasswordWithJshir', 'ResetPassCode',
  'PrivacyConsentNote', 'Indentifikatsiya',
]);
const isUnlockedRoute = (name?: string): boolean => {
  if (!name || PRE_AUTH_ROUTES.has(name)) return false;
  try {
    return !storage?.getBoolean('appLocked');
  } catch {
    return false;
  }
};

const useCurrentRouteName = (): string | undefined => {
  const [name, setName] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    const ref: any = navigationRef.current;
    if (!ref?.addListener) return;
    const update = () => setName(ref.getCurrentRoute?.()?.name);
    update();
    return ref.addListener('state', update);
  }, []);
  return name;
};

const NoInternet = ({ onChangeIntenet }) => {
  const { t } = useTranslation();
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const internet = useSelector(state => state.HomeReducer.internet);
  const routeName = useCurrentRouteName();

  // To'liq ekran overlay (react-native-paper Modal o'rniga — u kontentni markazlab
  // kichkina ko'rsatib, ikonkani kesib qo'yardi). internet=true bo'lganda ko'rinadi.
  if (!internet) return null;
  if (isOfflineCapableRoute(routeName)) return null;

  let loggedIn = false;
  try {
    loggedIn = !!storage?.getString('token') && isUnlockedRoute(routeName);
  } catch {
    loggedIn = false;
  }
  const openOfflineLedger = () => {
    startOfflineSync();
    const ref: any = navigationRef.current;
    ref?.navigate?.('BottomTabNavigator', { screen: 'QarzDaftari' });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.iconCircle}>
        <WifiOffIcon size={rs(48)} color={rd.color.error} strokeWidth={1.8} />
      </View>

      <Text allowFontScaling={false} style={styles.title}>
        {t('780')}
      </Text>
      <Text allowFontScaling={false} style={styles.subtitle}>
        {t('Ulanishni tekshirib, qayta urinib ko‘ring.')}
      </Text>

      <TouchableOpacity
        onPress={onChangeIntenet}
        activeOpacity={0.85}
        style={styles.update}
      >
        <Text allowFontScaling={false} style={styles.textbtn}>
          {t('783')}
        </Text>
      </TouchableOpacity>

      {loggedIn ? (
        <TouchableOpacity
          onPress={openOfflineLedger}
          activeOpacity={0.85}
          style={styles.offlineBtn}
          accessibilityRole="button"
        >
          <LedgerIcon size={rs(18)} color={rd.color.primary} />
          <Text allowFontScaling={false} style={styles.offlineBtnText}>
            {t('Qarz daftari — oflayn rejim')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default NoInternet;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: rd.color.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(32),
  },
  iconCircle: {
    width: rs(120),
    height: rs(120),
    borderRadius: rs(60),
    backgroundColor: rd.color.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(28),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(20),
    color: rd.color.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    lineHeight: rs(21),
  },
  update: {
    marginTop: rs(28),
    height: rs(52),
    minWidth: rs(200),
    paddingHorizontal: rs(32),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  textbtn: {
    fontSize: rs(16),
    color: rd.color.onPrimary,
    fontFamily: rd.font.semibold,
  },
  offlineBtn: {
    marginTop: rs(14),
    height: rs(48),
    minWidth: rs(200),
    paddingHorizontal: rs(24),
    flexDirection: 'row',
    gap: rs(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.lg,
  },
  offlineBtnText: {
    fontSize: rs(15),
    color: rd.color.primary,
    fontFamily: rd.font.semibold,
  },
});
