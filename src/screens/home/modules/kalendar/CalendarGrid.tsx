import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { BER_COLOR, BER_RGB, Kun, UND_COLOR, WEEKDAYS } from './kalendarLogic';
import { styles } from './kalendarStyles';

interface CalendarGridProps {
  offlineErr: boolean;
  cells: (number | null)[];
  byDay: Record<number, Kun>;
  maxBer: number;
  selDay: number | null;
  setSelDay: (d: number | null) => void;
}
/** Kunlar gridi (berilgan qarz intensivligi + undirilgan nuqtasi) va legend. */
const CalendarGrid = ({ offlineErr, cells, byDay, maxBer, selDay, setSelDay }: CalendarGridProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      {offlineErr && (
        <Text allowFontScaling={false} style={styles.offlineNote}>
          {t('Oflayn — kalendar mavjud emas')}
        </Text>
      )}
      <View style={styles.weekRow}>
        {WEEKDAYS.map(w => (
          <Text key={w} allowFontScaling={false} style={styles.weekCell}>{t(w)}</Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((day, i) => {
          if (day == null) return <View key={i} style={styles.calCell} />;
          const ber = byDay[day]?.berilgan || 0;
          const und = byDay[day]?.undirilgan || 0;
          const intensity = ber > 0 ? 0.12 + 0.5 * (ber / maxBer) : 0;
          const on = selDay === day;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              onPress={() => setSelDay(on ? null : day)}
              style={[
                styles.calCell,
                styles.calDay,
                ber > 0 && { backgroundColor: `rgba(${BER_RGB},${intensity})` },
                on && styles.calDayOn,
              ]}>
              <Text
                allowFontScaling={false}
                style={[styles.calNum, (on || intensity > 0.4) && { color: '#fff' }]}>
                {day}
              </Text>
              {und > 0 && (
                <View style={[styles.calDot, { backgroundColor: on ? '#fff' : UND_COLOR }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: BER_COLOR }]} />
        <Text allowFontScaling={false} style={styles.legendText}>{t('Berilgan')}</Text>
        <View style={[styles.legendDot, { backgroundColor: UND_COLOR, marginLeft: rs(14) }]} />
        <Text allowFontScaling={false} style={styles.legendText}>{t('Undirilgan')}</Text>
      </View>
    </View>
  );
};

export default CalendarGrid;
