/**
 * FinanceReceiptScan.tsx — N2: OFD (soliq.uz) chek QR'ini skanerlab, xarajatni oldindan
 * to'ldirish. Kamera QR'ni o'qiydi → POST /finance/receipt/scan → FinanceExpenseAdd'ga
 * prefill (summa/sana/kategoriya/izoh) bilan qaytadi. Foydalanuvchi tasdiqlab saqlaydi.
 *
 * DIQQAT: chek summasi QR'da YO'Q — u OFD API (server) orqali olinadi.
 */
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import Toast from 'react-native-toast-message';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { rd, rs } from '../../../theme/rd';
import { ChevronLeft, SunSettingsIcon, QrIcon } from '../redesign/icons';
import { financeApi } from './financeApi';

const FinanceReceiptScan = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const device = useCameraDevice('back');
  const lock = React.useRef(false);
  const [flash, setFlash] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  // Dublikat chek — ISHONCHLI ekran-usti xabari (toast EMAS). Sabab: App.tsx navigatsiya
  // 'state' listeneri HAR o'tishда Toast.hide() chaqiradi, shuning uchun "toast + darhol
  // goBack" — dublikat xabarini ko'rinmasдан yopib qo'yardi. Endi navigatsiya qilmaymiz.
  const [dup, setDup] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const showErr = React.useCallback(
    (msg?: string) => {
      Toast.show({ type: 'error2', props: { desc: msg || t('Chekni o‘qib bo‘lmadi') } });
      // Qayta urinishга ruxsat (2s dublikatдан himoya).
      setTimeout(() => {
        lock.current = false;
      }, 1500);
    },
    [t],
  );

  const onRead = React.useCallback(
    async (value?: string) => {
      if (!value) {
        lock.current = false;
        return;
      }
      try {
        setBusy(true);
        const res = await financeApi.scanReceipt(value);
        const d = res.data?.data;
        // So'rov SS7: chek AVTOMATIK saqlanadi (backend yaratadi). Dublikat bo'lsa
        // qayta qo'shilmaydi — "allaqachon kiritilgan" ogohlantirishi.
        if (res.data?.duplicate) {
          // ROOT-CAUSE FIX: navigatsiya QILMAYMIZ — ekran ustida ishonchli overlay.
          // (Aks holda App.tsx 'state' listeneri Toast.hide() bilan xabarni yeb qo'yardi.)
          setDup(true);
          return; // lock.current = true qoladi → kamera qayta o'qimaydi
        }
        if (res.data?.success && d) {
          Toast.show({
            type: 'omad',
            visibilityTime: 3500,
            props: { desc: t('Chek bo‘yicha xarajat qo‘shildi') },
          });
          // Xarajatlar ro'yxatiga o'tamiz — foydalanuvchi qo'shilганини ko'radi.
          navigation.navigate('FinanceExpenseList');
          return;
        }
        showErr(res.data?.message);
      } catch (e: any) {
        showErr(e?.response?.data?.message);
      } finally {
        setBusy(false);
      }
    },
    [navigation, showErr, t],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (lock.current) return;
      lock.current = true;
      onRead(codes[0]?.value);
    },
  });

  if (!hasPermission || !device) {
    return (
      <View style={styles.permContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={styles.permBack}>
          <ChevronLeft size={rs(24)} color={rd.color.text} />
        </TouchableOpacity>
        <View style={styles.permIcon}>
          <QrIcon size={rs(34)} color={rd.color.primary} />
        </View>
        <Text allowFontScaling={false} style={styles.permTitle}>
          {t('Kamera ruxsatini bering — chek QR kodini skanerlash uchun.')}
        </Text>
      </View>
    );
  }

  const FRAME = rs(240);
  const CORNER = rs(34);
  const CW = rs(4);

  return (
    <View style={styles.flex}>
      <Camera
        device={device}
        isActive={!busy}
        codeScanner={codeScanner}
        torch={flash ? 'on' : 'off'}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.dim} />
        <View style={styles.middleRow}>
          <View style={styles.dim} />
          <View style={{ width: FRAME, height: FRAME }}>
            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: CW, borderLeftWidth: CW, borderTopLeftRadius: rd.radius.xl, width: CORNER, height: CORNER }]} />
            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: CW, borderRightWidth: CW, borderTopRightRadius: rd.radius.xl, width: CORNER, height: CORNER }]} />
            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: CW, borderLeftWidth: CW, borderBottomLeftRadius: rd.radius.xl, width: CORNER, height: CORNER }]} />
            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: CW, borderRightWidth: CW, borderBottomRightRadius: rd.radius.xl, width: CORNER, height: CORNER }]} />
          </View>
          <View style={styles.dim} />
        </View>
        <View style={styles.dim} />
      </View>

      <View style={styles.back}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <ChevronLeft size={rs(24)} color={rd.color.onPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.title} pointerEvents="none">
        <Text allowFontScaling={false} style={styles.text}>
          {busy ? t('Chek o‘qilmoqda…') : t('Chek QR kodini ramkaga joylang')}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setFlash(!flash)}
        style={styles.flash}>
        <View style={[styles.flashBtn, flash && styles.flashBtnOn]}>
          <SunSettingsIcon size={rs(22)} color={flash ? rd.color.primary : rd.color.onPrimary} />
        </View>
        <Text allowFontScaling={false} style={styles.flashText}>
          {t('chiroq')}
        </Text>
      </TouchableOpacity>

      {/* So'rov SS6: chek o'qilayotganда MUZLAB qolган kabi ko'rinmasin — aniq
          yuklanish oynasi (spinner) + "Bekor qilish" (uzoq OFD kutuvини to'xtatish). */}
      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color={rd.color.onPrimary} />
          <Text allowFontScaling={false} style={styles.busyText}>
            {t('Chek o‘qilmoqda…')}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            style={styles.busyCancel}>
            <Text allowFontScaling={false} style={styles.busyCancelText}>
              {t('Bekor qilish')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dublikat chek — ISHONCHLI ekran-usti xabari. Navigatsiya qilmaymiz, shuning
          uchun App.tsx Toast.hide() bu xabarни yeb qo'ymaydi. */}
      {dup && (
        <View style={styles.dupOverlay}>
          <View style={styles.dupCard}>
            <View style={styles.dupIcon}>
              <QrIcon size={rs(34)} color={rd.color.warning || '#d97706'} />
            </View>
            <Text allowFontScaling={false} style={styles.dupTitle}>
              {t('Ushbu chek tizimga kiritilgan.')}
            </Text>
            <Text allowFontScaling={false} style={styles.dupSub}>
              {t('Xarajatlar bo‘limi orqali tekshirib ko‘rishingiz mumkin.')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
              style={styles.dupPrimary}>
              <Text allowFontScaling={false} style={styles.dupPrimaryText}>
                {t('Ortga qaytish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setDup(false);
                lock.current = false;
              }}
              style={styles.dupGhost}>
              <Text allowFontScaling={false} style={styles.dupGhostText}>
                {t('Boshqa chekni skanerlash')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default FinanceReceiptScan;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(16),
  },
  busyText: {
    color: rd.color.onPrimary,
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
  },
  busyCancel: {
    marginTop: rs(8),
    paddingHorizontal: rs(28),
    paddingVertical: rs(11),
    borderRadius: rd.radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  busyCancelText: {
    color: rd.color.onPrimary,
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
  },
  dupOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    backgroundColor: 'rgba(0,0,0,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  dupCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    padding: rs(22),
    alignItems: 'center',
  },
  dupIcon: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(32),
    backgroundColor: rd.color.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(14),
  },
  dupTitle: {
    color: rd.color.text,
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    textAlign: 'center',
    lineHeight: rs(23),
  },
  dupSub: {
    color: rd.color.textSecondary,
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    textAlign: 'center',
    lineHeight: rs(19),
    marginTop: rs(8),
  },
  dupPrimary: {
    width: '100%',
    height: rs(48),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(18),
  },
  dupPrimaryText: {
    color: rd.color.onPrimary,
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
  },
  dupGhost: {
    width: '100%',
    height: rs(46),
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(6),
  },
  dupGhostText: {
    color: rd.color.primary,
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
  },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  middleRow: { flexDirection: 'row' },
  corner: { position: 'absolute', borderColor: rd.color.onPrimary },
  back: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? heightPercentageToDP(2) : heightPercentageToDP(2.5),
    left: rs(16),
    zIndex: 2,
  },
  backBtn: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    position: 'absolute',
    zIndex: 2,
    top: Platform.OS === 'ios' ? heightPercentageToDP(12) : heightPercentageToDP(10),
    alignSelf: 'center',
    paddingHorizontal: rs(32),
  },
  text: {
    color: rd.color.onPrimary,
    fontSize: rs(16),
    fontFamily: rd.font.medium,
    textAlign: 'center',
    lineHeight: rs(22),
  },
  flash: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
    bottom: heightPercentageToDP(10),
    alignItems: 'center',
  },
  flashBtn: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnOn: { backgroundColor: rd.color.onPrimary },
  flashText: {
    color: rd.color.onPrimary,
    fontSize: rs(13),
    fontFamily: rd.font.medium,
    marginTop: rs(8),
  },
  permContainer: {
    flex: 1,
    backgroundColor: rd.color.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(32),
  },
  permBack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? heightPercentageToDP(2) : heightPercentageToDP(2.5),
    left: rs(16),
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permIcon: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(20),
  },
  permTitle: {
    color: rd.color.text,
    fontSize: rs(16),
    fontFamily: rd.font.medium,
    textAlign: 'center',
    lineHeight: rs(23),
  },
});
