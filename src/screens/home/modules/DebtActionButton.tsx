/**
 * DebtActionButton.tsx — shaxsiy qarz amal tugmasi (02.10).
 *
 * Sayt `group/_key.vue` / `_id.vue` dagi pastel tugmalar (Tailwind 50 fon / 700 matn):
 * ikonka + matn, ixtiyoriy oxirgi belgi (masalan tarif qulfi). O'chiq holat kulrang,
 * lekin BOSILADI — chaqiruvchi sababini (toast) ko'rsatadi (saytdagi `title` izohi o'rniga).
 * Ishlatiladi: FinanceDebtGroup ("Qarz oldi-berdi") va FinanceDebtDetail ("Qarz tafsiloti").
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { rd, rs } from '../../../theme/rd';

export const PASTEL = {
  blue: { bg: '#EFF6FF', fg: '#1D4ED8' },
  green: { bg: '#F0FDF4', fg: '#15803D' },
  yellow: { bg: '#FEFCE8', fg: '#854D0E' },
  red: { bg: '#FEF2F2', fg: '#B91C1C' },
  off: { bg: '#F3F4F6', fg: '#9CA3AF' },
} as const;

export type PastelTone = Exclude<keyof typeof PASTEL, 'off'>;

/** Ikonka rangi — o'chiq bo'lsa kulrang. */
export const pastelFg = (tone: PastelTone, disabled?: boolean): string =>
  disabled ? PASTEL.off.fg : PASTEL[tone].fg;

type Props = {
  label: string;
  tone: PastelTone;
  icon: React.ReactNode;
  disabled?: boolean;
  trailing?: React.ReactNode;
  onPress: () => void;
};

const DebtActionButton = ({ label, tone, icon, disabled, trailing, onPress }: Props) => {
  const c = disabled ? PASTEL.off : PASTEL[tone];
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.btn, { backgroundColor: c.bg }]}>
      {icon}
      <Text allowFontScaling={false} style={[styles.text, { color: c.fg }]} numberOfLines={1}>
        {label}
      </Text>
      {trailing}
    </TouchableOpacity>
  );
};

export default DebtActionButton;

const styles = StyleSheet.create({
  btn: {
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    height: rs(42),
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(10),
  },
  text: { flexShrink: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5) },
});
