/**
 * DebtSummaryCard.tsx — qarzdorlik kartasi (chegara rangli, ikonka + nishon +
 * UZS/USD qatorlari).
 *
 * SS-DEV (2026-09-29): ilgari faqat QarzShartnomasi ichidagi lokal `DebtCard`
 * edi. 29.09 hujjat 4-band bo'yicha "Shaxsiy qarz" bosh sahifasi ham AYNAN shu
 * ko'rinishda bo'lishi kerak — ikki joyda nusxa saqlamaslik uchun alohida
 * komponentga chiqarildi (ko'rinish o'zgarmadi).
 *
 * 30.09 (mobil hujjat, 6-band): Qarz shartnomasi kartalari "juda oddiy" — ichidagi
 * ma'lumot va joylashuv O'ZGARMASDAN faqat TASHQI to'rtburchak Qarz daftari kartalari
 * (DebtSumCard) uslubida: neytral ingichka chegara + tepada rangli chiziq + yumshoq soya.
 *
 * 01.10 (mobil hujjat, 3-band): "Shaxsiy qarz" bosh sahifasi ham 'stripe' — ikkala sahifa
 * kartalari AYNAN bir xil ko'rinishda. 'outline' varianti hozircha hech qayerda ishlatilmaydi.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { IconProps } from './icons';

type DebtSummaryCardProps = {
  accent: string;
  Icon: (p: IconProps) => React.ReactElement;
  label: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  lines: string[];
  amountColor: string;
  onPress?: () => void;
  /** 'outline' — rangli chegara (avvalgi); 'stripe' — Qarz daftari uslubi. */
  variant?: 'outline' | 'stripe';
};

const DebtSummaryCard = ({
  accent,
  Icon,
  label,
  badge,
  badgeBg,
  badgeColor,
  lines,
  amountColor,
  onPress,
  variant = 'outline',
}: DebtSummaryCardProps) => (
  // onPress berilmasa disabled — bosilmaydigan karta sifatida ishlaydi.
  <TouchableOpacity
    activeOpacity={0.85}
    disabled={!onPress}
    onPress={onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    style={[
      styles.debtCard,
      variant === 'stripe' ? styles.debtCardStripe : { borderColor: accent },
    ]}>
    {variant === 'stripe' ? <View style={[styles.topStripe, { backgroundColor: accent }]} /> : null}
    <View style={styles.debtHead}>
      <View style={[styles.debtIcon, { backgroundColor: badgeBg }]}>
        <Icon size={rs(18)} color={accent} />
      </View>
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
      </View>
    </View>
    <Text style={styles.debtLabel}>{label}</Text>
    <Text style={[styles.debtAmount, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit>
      {lines[0]}
    </Text>
    {lines[1] ? <Text style={styles.debtAmountUsd}>{lines[1]}</Text> : null}
  </TouchableOpacity>
);

export default DebtSummaryCard;

const styles = StyleSheet.create({
  // 2×2 grid ichida: `width: '47%'` + `flexGrow: 1` (ota konteyner — flexWrap).
  debtCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1.5,
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
  },
  // 30.09: Qarz daftari DebtSumCard uslubi — ichki joylashuv o'zgarmaydi.
  debtCardStripe: {
    borderWidth: 1,
    borderColor: rd.color.border,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  topStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(4) },
  debtHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  debtIcon: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(3) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(9.5) },
  debtLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(12),
  },
  debtAmount: { fontFamily: rd.font.bold, fontSize: rs(13), marginTop: rs(4) },
  debtAmountUsd: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
});
