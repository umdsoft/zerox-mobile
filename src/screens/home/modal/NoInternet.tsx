import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../theme/rd';
import { WifiOffIcon } from '../redesign/icons';

const NoInternet = ({ onChangeIntenet }) => {
  const { t } = useTranslation();
  const { internet } = useSelector(state => state.HomeReducer);

  // To'liq ekran overlay (react-native-paper Modal o'rniga — u kontentni markazlab
  // kichkina ko'rsatib, ikonkani kesib qo'yardi). internet=true bo'lganda ko'rinadi.
  if (!internet) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.iconCircle}>
        <WifiOffIcon size={rs(48)} color={rd.color.error} strokeWidth={1.8} />
      </View>

      <Text allowFontScaling={false} style={styles.title}>
        {t('780')}
      </Text>
      <Text allowFontScaling={false} style={styles.subtitle}>
        {t('Ulanishni tekshirib, qayta urinib ko‘ring')}
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
});
