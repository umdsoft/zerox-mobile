import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { CircleIcon } from '../../../../components/ui/CircleIcon';
import { IconProps } from '../../redesign/icons';
import { usdText, uzsText } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

// E) Qarzdorlik summasi kartasi (UZS + USD + holat pill) — bosiladigan.
const DebtSumCard = ({
  accent,
  accentBg,
  Icon,
  label,
  pill,
  pillColor,
  uzs,
  usd,
  onPress,
}: {
  accent: string;
  accentBg: string;
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  pill: string;
  pillColor: string;
  uzs: number;
  usd: number;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.9} style={styles.sumCard} onPress={onPress}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <View style={styles.sumHead}>
      <CircleIcon size={rs(30)} bg={accentBg}>
        <Icon size={rs(16)} color={accent} />
      </CircleIcon>
      <View style={[styles.pill, { backgroundColor: pillColor + '1A' }]}>
        <Text style={[styles.pillText, { color: pillColor }]} numberOfLines={1}>
          {pill}
        </Text>
      </View>
    </View>
    <Text style={styles.sumLabel} numberOfLines={2}>
      {label}
    </Text>
    <Text style={styles.sumUzs} numberOfLines={1} adjustsFontSizeToFit>
      {uzsText(uzs)}
    </Text>
    <Text style={styles.sumUsd}>{usdText(usd)}</Text>
  </TouchableOpacity>
);

export default DebtSumCard;
