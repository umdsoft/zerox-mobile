/**
 * FinanceAddButton.tsx — Shaxsiy moliya ekranlari uchun umumiy "+ Yangi qo'shish" tugmasi.
 *
 * Sarlavha ostida to'liq kenglikda, ekranning o'z aksent rangida (Kutilayotgan daromadlar —
 * yashil, Maqsadlar — binafsha, Gap — teal). Ilgari har ekranda alohida inline uslub
 * (yoki sarlavhadagi dumaloq "+") edi — endi bitta manba.
 */
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { PlusIcon } from '../redesign/icons';

type Props = {
  label: string;
  color: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const FinanceAddButton = ({ label, color, onPress, style }: Props) => (
  <TouchableOpacity
    style={[styles.btn, { backgroundColor: color }, style]}
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}>
    <PlusIcon size={rs(18)} color={rd.color.onPrimary} />
    <Text allowFontScaling={false} style={styles.text}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default FinanceAddButton;

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    height: rs(48),
    borderRadius: rd.radius.md,
    marginBottom: rs(14),
  },
  text: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.onPrimary },
});
