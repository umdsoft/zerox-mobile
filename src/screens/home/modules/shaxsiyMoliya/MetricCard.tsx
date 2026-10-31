import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { CircleIcon } from '../../../../components/ui/CircleIcon';
import { IconProps } from '../../redesign/icons';
import { styles } from './shaxsiyMoliyaStyles';

// Ko'rsatkich kartasi — per-currency ko'p qatorli qiymat bilan.
const MetricCard = ({
  accent,
  accentBg,
  Icon,
  label,
  lines,
  sub,
  onPress,
}: {
  accent: string;
  accentBg: string;
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  lines: string[]; // per-currency (yoki 1 element)
  sub?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity activeOpacity={onPress ? 0.9 : 1} onPress={onPress} style={styles.metric}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <View style={styles.metricHead}>
      <CircleIcon size={rs(30)} bg={accentBg}>
        <Icon size={rs(16)} color={accent} />
      </CircleIcon>
    </View>
    <Text allowFontScaling={false} style={styles.metricLabel} numberOfLines={2}>
      {label}
    </Text>
    {(lines.length ? lines : ['0 UZS']).map((ln, i) => (
      <Text
        key={i}
        allowFontScaling={false}
        style={[styles.metricValue, i > 0 && styles.metricValueSm]}
        numberOfLines={1}
        adjustsFontSizeToFit={i === 0}>
        {ln}
      </Text>
    ))}
    {!!sub && (
      <Text allowFontScaling={false} style={styles.metricSub}>
        {sub}
      </Text>
    )}
  </TouchableOpacity>
);

export default MetricCard;
