import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { Checkbox } from 'react-native-paper';
import ScreenLayout from '../components/ScreenLayout';
import { rd, rs } from '../../theme/rd';
import { CoinIcon } from '../home/redesign/icons';

const PartDebtBack = () => {
  const [focused, setFocused] = useState(false);

  return (
    <ScreenLayout title={'Qarzni qisman qaytarishni talab qilish'} scroll>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroCircle}>
            <CoinIcon size={rs(30)} color={rd.color.primary} />
          </View>
          <Text style={styles.heroTitle} allowFontScaling={false}>
            Qarzni qisman qaytarish
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.hisob} allowFontScaling={false}>
            01.01.2021 yildagi 1-sonli qarz shartnomasi bo‘yicha siz fuqaro
            Abdullayev Abdulladan qarzni qisman qaytarishini talab qilmoqdasiz.
          </Text>
        </View>

        <Text style={styles.label} allowFontScaling={false}>
          Summani kiriting
        </Text>
        <View style={[styles.amountField, focused && styles.amountFieldFocused]}>
          <TextInput
            value="100 000"
            keyboardType="numeric"
            allowFontScaling={false}
            placeholderTextColor={rd.color.textTertiary}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.amountInput}
          />
          <Text style={styles.suffix} allowFontScaling={false}>
            so'm
          </Text>
        </View>

        <View style={styles.checkRow}>
          <Checkbox color={rd.color.primary} status="checked" />
          <Text style={styles.checkText} allowFontScaling={false}>
            Ushbu jarayon yuzasidan rasmiylashtirilgan dalolatnoma bilan
            tanishdim
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText} allowFontScaling={false}>
            Tasdiqlash
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

export default PartDebtBack;

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
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginTop: rs(22),
    marginBottom: rs(8),
    marginLeft: rs(2),
  },
  amountField: {
    height: rs(56),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
  },
  amountFieldFocused: {
    borderColor: rd.color.primary,
  },
  amountInput: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.text,
    padding: 0,
  },
  suffix: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textTertiary,
    marginLeft: rs(8),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(20),
  },
  checkText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    lineHeight: rs(19),
    marginLeft: rs(4),
  },
  primaryBtn: {
    marginTop: rs(24),
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: rs(16),
    fontFamily: rd.font.semibold,
    color: rd.color.onPrimary,
  },
});
