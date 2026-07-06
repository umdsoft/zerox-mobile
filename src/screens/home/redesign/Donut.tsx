/**
 * Donut.tsx — Shartnomalar holati halqasimon diagrammasi (react-native-svg).
 * Har segment qiymatga proporsional yoy; markazда umumiy son + label.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { rd } from '../../../theme/rd';

export type DonutSegment = { value: number; color: string };

type Props = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerValue: string;
  centerLabel: string;
};

const Donut = ({
  segments,
  size = 96,
  strokeWidth = 11,
  centerValue,
  centerLabel,
}: Props) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const gap = 2; // segmentlar orasidagi kichik bo'shliq (px, yoy bo'ylab)

  let offset = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* -90° — yuqoridan boshlanadi */}
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          {segments.map((seg, i) => {
            const len = (seg.value / total) * circumference;
            const dash = Math.max(len - gap, 0);
            const circle = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return circle;
          })}
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.value}>{centerValue}</Text>
        <Text style={styles.label}>{centerLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: rd.font.bold, fontSize: 24, color: rd.color.text },
  label: { fontFamily: rd.font.medium, fontSize: 10, color: rd.color.textTertiary, marginTop: -2 },
});

export default Donut;
