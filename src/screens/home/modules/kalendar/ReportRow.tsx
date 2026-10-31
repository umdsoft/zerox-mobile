import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { fMoney } from '../financeMoney';
import { ChevronRight } from '../../redesign/icons';
import { BER_COLOR, UND_COLOR } from './kalendarLogic';
import { styles } from './kalendarStyles';

const ReportRow = ({
  label,
  ber,
  und,
  cur,
  onPress,
}: {
  label: string;
  ber: number;
  und: number;
  cur: string;
  onPress?: () => void;
}) => {
  const body = (
    <>
      <Text allowFontScaling={false} style={styles.repLabel}>{label}</Text>
      <View style={styles.repVals}>
        {/* SS-DEV (2026-09-24): valyuta TANLANGANIGA mos (ilgari doim UZS yozilardi). */}
        <Text allowFontScaling={false} style={[styles.repVal, { color: BER_COLOR }]} numberOfLines={1}>
          +{fMoney(ber, cur)}
        </Text>
        <Text allowFontScaling={false} style={[styles.repVal, { color: UND_COLOR }]} numberOfLines={1}>
          {fMoney(und, cur)}
        </Text>
      </View>
      {/* SS-DEV (2026-09-24): bosiladigan qator — ro'yxat ochilishini bildiruvchi strelka. */}
      {onPress ? <ChevronRight size={rs(16)} color={rd.color.textTertiary} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.repRow}>{body}</View>;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.repRow}>
      {body}
    </TouchableOpacity>
  );
};

export default ReportRow;
