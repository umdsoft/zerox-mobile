/**
 * DebtPlanHomeRow.tsx — bosh sahifadagi "Shaxsiy qarz" kartasi ostidagi bir qatorli satr:
 * "Qarzdan chiqish: 63% · 2027-yil sentabr". Manba: /home/analytics → `debtPlan`
 * ({ progressPct, finishYm }) — faqat reja sozlangan bo'lsa keladi; yo'q bo'lsa ko'rinmaydi.
 */
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { ChevronRight } from '../../redesign/icons';
import { DP } from './debtPlanUi';
import { fmtYm } from './debtPlanText';

type HomeDebtPlan = { progressPct?: number | null; finishYm?: string | null } | null | undefined;

const DebtPlanHomeRow = ({
  data,
  onPress,
  style,
}: {
  data: HomeDebtPlan;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const { t } = useTranslation();
  if (!data || (data.progressPct == null && !data.finishYm)) return null;
  const pct = Math.max(0, Math.min(100, Math.round(Number(data.progressPct) || 0)));
  const parts = [`${pct}%`, data.finishYm ? fmtYm(data.finishYm) : null].filter(Boolean).join(' · ');
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.row, style]}
      accessibilityRole="button"
      accessibilityLabel={`${t('Qarzdan chiqish')}: ${parts}`}>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={styles.text} numberOfLines={2}>
          <Text style={styles.title}>{t('Qarzdan chiqish')}: </Text>
          {parts}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(2, pct)}%` }]} />
        </View>
      </View>
      <ChevronRight size={rs(16)} color={DP.accent} />
    </TouchableOpacity>
  );
};

export default DebtPlanHomeRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: DP.tint,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: DP.accent + '33',
    paddingHorizontal: rs(14),
    paddingVertical: rs(10),
  },
  text: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  title: { fontFamily: rd.font.bold, color: DP.accentStrong },
  track: { height: rs(4), borderRadius: rs(2), backgroundColor: 'rgba(5,150,105,0.15)', marginTop: rs(6), overflow: 'hidden' },
  fill: { height: '100%', borderRadius: rs(2), backgroundColor: DP.accent },
});
