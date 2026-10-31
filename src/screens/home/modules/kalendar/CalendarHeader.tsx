import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { fMoney } from '../financeMoney';
import { ChevronLeft, ChevronRight } from '../../redesign/icons';
import { BER_COLOR, MONTHS, UND_COLOR } from './kalendarLogic';
import { styles } from './kalendarStyles';

interface CalendarHeaderProps {
  m: number;
  y: number;
  cur: 'UZS' | 'USD';
  setCur: (c: 'UZS' | 'USD') => void;
  changeMonth: (delta: number) => void;
  totBer: number;
  totUnd: number;
}
/** Oy tanlagich, valyuta (UZS va USD QO'SHILMAYDI) va oy jami kartalari. */
const CalendarHeader = ({ m, y, cur, setCur, changeMonth, totBer, totUnd }: CalendarHeaderProps) => {
  const { t } = useTranslation();
  return (
    <>
      {/* Oy tanlagich */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
          <ChevronLeft size={rs(18)} color={rd.color.text} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.monthText}>
          {t(MONTHS[m - 1])} {y}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
          <ChevronRight size={rs(18)} color={rd.color.text} />
        </TouchableOpacity>
      </View>

      {/* Valyuta — UZS va USD QO'SHILMAYDI */}
      <View style={styles.curRow}>
        {(['UZS', 'USD'] as const).map(c => {
          const on = cur === c;
          return (
            <TouchableOpacity
              key={c}
              activeOpacity={0.85}
              onPress={() => setCur(c)}
              style={[styles.curBtn, on && styles.curBtnOn]}>
              <Text allowFontScaling={false} style={[styles.curText, on && styles.curTextOn]}>
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Oy jami */}
      <View style={styles.summaryGrid}>
        <View style={styles.sumCard}>
          <Text allowFontScaling={false} style={styles.sumLabel}>{t('Berilgan qarz')}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.sumValueSm, { color: BER_COLOR }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {fMoney(totBer, cur)}
          </Text>
        </View>
        <View style={styles.sumCard}>
          <Text allowFontScaling={false} style={styles.sumLabel}>{t('Undirilgan qarz')}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.sumValueSm, { color: UND_COLOR }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {fMoney(totUnd, cur)}
          </Text>
        </View>
      </View>
    </>
  );
};

export default CalendarHeader;
