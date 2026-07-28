import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CheckBox from '@react-native-community/checkbox';
import ScreenLayout from '../components/ScreenLayout';
import { rd, rs } from '../../theme/rd';
import { CoinIcon } from '../home/redesign/icons';

const FullDebtBack = () => {
  const { t } = useTranslation();
  const [check, setCheck] = useState(false);

  return (
    <ScreenLayout title={t(' Qarzni to’liq qaytarishni talab qilish')} scroll>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroCircle}>
            <CoinIcon size={rs(30)} color={rd.color.primary} />
          </View>
          <Text style={styles.heroTitle} allowFontScaling={false}>
            {t('Qarzni to’liq qaytarish')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.hisob} allowFontScaling={false}>
            01.01.2021 yildagi 1-sonli qarz shartnomasi bo‘yicha siz fuqaro
            Abdullayev Abdulladan qarzni to’liq qaytarishini talab qilmoqdasiz.
          </Text>
        </View>

        <View style={styles.checkRow}>
          <CheckBox
            value={check}
            tintColor={rd.color.primary}
            tintColors={{
              true: rd.color.primary,
              false: rd.color.textTertiary,
            }}
            boxType="square"
            style={styles.checkbox}
            onValueChange={() => setCheck(!check)}
          />
          <Text style={styles.checkText} allowFontScaling={false}>
            {t(
              'Ushbu jarayon yuzasidan rasmiylashtirilgan dalolatnoma bilan tanishdim',
            )}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!check}
          style={[
            styles.primaryBtn,
            check ? styles.primaryBtnShadow : styles.primaryBtnDisabled,
          ]}>
          <Text
            style={[
              styles.primaryBtnText,
              !check && styles.primaryBtnTextDisabled,
            ]}
            allowFontScaling={false}>
            {t('Tasdiqlash')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

export default FullDebtBack;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: rs(16),
    paddingTop: rs(12),
    paddingBottom: rs(24),
  },
  hero: {
    alignItems: 'center',
    marginBottom: rs(24),
  },
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(14),
  },
  heroTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
  },
  card: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    padding: rs(16),
  },
  hisob: {
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
    textAlign: 'center',
    lineHeight: rs(22),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(20),
  },
  checkbox: {
    height: rs(20),
    width: rs(20),
    marginRight: rs(10),
  },
  checkText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    lineHeight: rs(19),
  },
  primaryBtn: {
    marginTop: rs(24),
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnShadow: {
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
  primaryBtnText: {
    fontSize: rs(16),
    fontFamily: rd.font.semibold,
    color: rd.color.onPrimary,
  },
  primaryBtnTextDisabled: {
    color: rd.color.textTertiary,
  },
});
