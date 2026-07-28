import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { rd, rs } from '../theme/rd';
import { FingerprintIcon, ShieldIcon } from './home/redesign/icons';
import { useTranslation } from 'react-i18next';
// import TouchID from 'react-native-touch-id';

const FingerScanner = () => {
  const { t } = useTranslation();
  // React.useEffect(() => {
  //   TouchID.isSupported()
  //     .then(() => {
  //       TouchID.authenticate('token', {unifiedErrors: false})
  //         .then(success => {
  //           console.log(success);
  //         })
  //         .catch(error => {
  //           console.log(error);
  //         });
  //     })
  //     .catch(err => {
  //       console.log(err, 'err');
  //     });
  // }, []);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      <View style={styles.body}>
        {/* Hero */}
        <View style={styles.heroOuter}>
          <View style={styles.heroCircle}>
            <FingerprintIcon size={rs(56)} color={rd.color.primary} />
          </View>
        </View>

        <Text allowFontScaling={false} style={styles.title}>
          {t('Barmoq izi bilan kirish')}
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          {t('Hisobingizga tez va xavfsiz kirish uchun barmoq izini skanerlang')}
        </Text>

        <View style={styles.hintRow}>
          <ShieldIcon size={rs(16)} color={rd.color.textTertiary} />
          <Text allowFontScaling={false} style={styles.hintText}>
            {t('Ma’lumotlaringiz himoyalangan')}
          </Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.85} style={styles.scanBtn}>
        <FingerprintIcon size={rs(22)} color={rd.color.onPrimary} />
        <Text allowFontScaling={false} style={styles.scanText}>
          {t('Barmoq izi bilan kirish')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FingerScanner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(24),
    paddingBottom: rs(28),
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOuter: {
    width: rs(132),
    height: rs(132),
    borderRadius: rs(66),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(28),
  },
  heroCircle: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(10),
    lineHeight: rs(20),
    paddingHorizontal: rs(16),
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(20),
  },
  hintText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
  },
  scanBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(10),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  scanText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
