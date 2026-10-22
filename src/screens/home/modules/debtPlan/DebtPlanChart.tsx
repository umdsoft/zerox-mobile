/**
 * DebtPlanChart.tsx — umumiy qoldiq grafigi (schedule[].totalRemaining, asosiy stsenariy).
 * Ixtiyoriy `compare` seriyasi (masalan "Agar" kalkulyatorida joriy reja) — punktir chiziq.
 * react-native-svg; kenglik onLayout bilan o'lchanadi.
 */
import React from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop, Circle } from 'react-native-svg';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import { fShort } from '../financeMoney';
import { DP } from './debtPlanUi';
import { fmtYmShort } from './debtPlanText';
import { addMonths, PlanResult } from './debtPlanApi';

export type ChartPoint = { ym: string; value: number };

/** Reja natijasidan grafik nuqtalari: boshlang'ich jami qarz + har oy oxiridagi qoldiq. */
export const chartPointsOf = (r: PlanResult | null): ChartPoint[] => {
  if (!r || r.schedule.length === 0) return [];
  const start = r.startYm || r.schedule[0].ym;
  return [
    { ym: addMonths(start, -1), value: r.totals.totalDebt },
    ...r.schedule.map(m => ({ ym: m.ym, value: m.totalRemaining })),
  ];
};

const H = 150;
const PAD_TOP = 12;
const PAD_BOTTOM = 6;

const buildPath = (pts: ChartPoint[], w: number, max: number, len: number) => {
  if (pts.length === 0 || w <= 0) return { line: '', area: '' };
  const x = (i: number) => (len <= 1 ? 0 : (i / (len - 1)) * w);
  const y = (v: number) => PAD_TOP + (1 - (max > 0 ? v / max : 0)) * (H - PAD_TOP - PAD_BOTTOM);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const lastX = x(pts.length - 1).toFixed(1);
  const area = `${line} L${lastX},${H} L0,${H} Z`;
  return { line, area };
};

const DebtPlanChart = ({
  points,
  compare,
  color = DP.accent,
}: {
  points: ChartPoint[];
  compare?: ChartPoint[] | null;
  color?: string;
}) => {
  const [w, setW] = React.useState(0);
  const len = Math.max(points.length, compare?.length || 0);
  const max = Math.max(1, ...points.map(p => p.value), ...(compare || []).map(p => p.value));
  const main = buildPath(points, w, max, len);
  const cmp = compare && compare.length ? buildPath(compare, w, max, len) : null;
  const longest = (compare?.length || 0) > points.length ? compare! : points;
  const mid = longest[Math.floor((longest.length - 1) / 2)];
  const last = longest[longest.length - 1];
  const finishX = len <= 1 ? 0 : ((points.length - 1) / (len - 1)) * w;

  return (
    <View>
      <View style={styles.axisTop}>
        <Text allowFontScaling={false} style={styles.axisText}>
          {fShort(max)}
        </Text>
      </View>
      <View
        style={{ height: H }}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={t('Qoldiq grafigi')}>
        {w > 0 && points.length > 0 ? (
          <Svg width={w} height={H}>
            <Defs>
              <LinearGradient id="dpArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.28} />
                <Stop offset="1" stopColor={color} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>
            {[0.25, 0.5, 0.75].map(f => (
              <Line
                key={f}
                x1={0}
                x2={w}
                y1={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
                y2={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
                stroke={rd.color.border}
                strokeWidth={1}
              />
            ))}
            {cmp ? (
              <Path d={cmp.line} stroke={rd.color.textTertiary} strokeWidth={2} strokeDasharray="5 5" fill="none" />
            ) : null}
            <Path d={main.area} fill="url(#dpArea)" />
            <Path d={main.line} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
            <Circle cx={finishX} cy={H - PAD_BOTTOM} r={4.5} fill={rd.color.surface} stroke={color} strokeWidth={2.5} />
          </Svg>
        ) : null}
      </View>
      <View style={styles.axisRow}>
        <Text allowFontScaling={false} style={styles.axisText}>
          {t('Hozir')}
        </Text>
        <Text allowFontScaling={false} style={styles.axisText}>
          {mid ? fmtYmShort(mid.ym) : ''}
        </Text>
        <Text allowFontScaling={false} style={styles.axisText}>
          {last ? fmtYmShort(last.ym) : ''}
        </Text>
      </View>
    </View>
  );
};

export default DebtPlanChart;

const styles = StyleSheet.create({
  axisTop: { marginBottom: rs(2) },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rs(6) },
  axisText: { fontFamily: rd.font.medium, fontSize: rs(10.5), color: rd.color.textTertiary },
});
