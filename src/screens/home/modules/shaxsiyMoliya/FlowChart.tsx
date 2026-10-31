import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { num } from '../financeMoney';
import { GREEN, RED } from './shaxsiyMoliyaLogic';
import { styles } from './shaxsiyMoliyaStyles';

// SS4: Pul oqimi — "Joriy oy" (kunlik) / "Oylar kesimida" (12 oy) tab + bosiladigan
// legend (Daromad/Xarajat filtr — birini yashirsa faqat ikkinchisi grafigi qoladi).
const FlowChart = ({ daily, monthly }: { daily: any[]; monthly: any[] }) => {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<'day' | 'month'>('day');
  const [showInc, setShowInc] = React.useState(true);
  const [showExp, setShowExp] = React.useState(true);
  const rows = (mode === 'day' ? daily : monthly) || [];
  const max = Math.max(
    1,
    ...rows.map((d: any) =>
      Math.max(showInc ? num(d?.income) : 0, showExp ? num(d?.expense) : 0),
    ),
  );
  const H = rs(96);
  return (
    <View style={styles.card}>
      <View style={styles.chartHead}>
        <Text allowFontScaling={false} style={styles.cardTitle}>
          {t('Pul oqimi')}
        </Text>
        <View style={styles.flowTabs}>
          {([['day', 'Joriy oy'], ['month', 'Oylar kesimida']] as const).map(([m, lbl]) => {
            const on = mode === m;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={0.85}
                onPress={() => setMode(m)}
                style={[styles.flowTab, on && styles.flowTabOn]}>
                <Text allowFontScaling={false} style={[styles.flowTabText, on && styles.flowTabTextOn]}>
                  {t(lbl)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bosiladigan legend */}
      <View style={styles.legendRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowInc(v => !v)}
          disabled={showInc && !showExp}
          style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: showInc ? GREEN : '#cbd5e1' }]} />
          <Text
            allowFontScaling={false}
            style={[styles.legendText, !showInc && { textDecorationLine: 'line-through' }]}>
            {t('Daromad')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowExp(v => !v)}
          disabled={showExp && !showInc}
          style={[styles.legendItem, { marginLeft: rs(12) }]}>
          <View style={[styles.legendDot, { backgroundColor: showExp ? RED : '#cbd5e1' }]} />
          <Text
            allowFontScaling={false}
            style={[styles.legendText, !showExp && { textDecorationLine: 'line-through' }]}>
            {t('Xarajat')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.chartBody, { height: H }]}>
        {rows.map((d: any, i: number) => (
          <View key={i} style={styles.chartCol}>
            {showInc && (
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(2, (num(d?.income) / max) * H), backgroundColor: GREEN },
                ]}
              />
            )}
            {showExp && (
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(2, (num(d?.expense) / max) * H), backgroundColor: RED },
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.chartAxis}>
        <Text allowFontScaling={false} style={styles.axisText}>
          {mode === 'day' ? '1' : rows[0]?.label || ''}
        </Text>
        <Text allowFontScaling={false} style={styles.axisText}>
          {mode === 'day' ? rows.length || 0 : rows[rows.length - 1]?.label || ''}
        </Text>
      </View>
    </View>
  );
};

export default FlowChart;
