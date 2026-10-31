import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import PendingBadge from '../../../../offline/ui/PendingBadge';
import { sortMoneyText } from '../../../components/StatisticCard';
import { CalendarIcon, ChevronRight, ClockIcon } from '../../redesign/icons';
import { fmtDate, isOverdue, RED } from './mijozLogic';
import { styles } from './mijozStyles';

// ---------- Kichik komponentlar ----------
/**
 * 2026-09-28: "Aktiv qarzlar" ro'yxatining bitta qatori.
 * Berilgan sana · summa+valyuta · qoldiq · qaytarish muddati (+ bo'lib to'lash
 * tegi). Bosilganda qarz tafsiloti (QarzDaftariQarz) ochiladi.
 */
type ActiveQarzRowProps = {
  q: any;
  accent: string;
  onPress: () => void;
  t: (k: string, o?: any) => string;
};
const ActiveQarzRow = ({ q, accent, onPress, t }: ActiveQarzRowProps) => {
  const valyuta = q?.valyuta || 'UZS';
  const due = q?.qaytarish_sanasi ? String(q.qaytarish_sanasi) : '';
  const overdue = isOverdue(due);
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.aqRow} onPress={onPress}>
      <View style={[styles.aqBar, { backgroundColor: overdue ? RED : accent }]} />
      <View style={styles.aqBody}>
        <View style={styles.aqTop}>
          <Text style={styles.aqAmount} numberOfLines={1}>
            {`${sortMoneyText(q?.miqdor) || 0} ${valyuta}`}
          </Text>
          {!!q?.bolib_tolash && (
            <View style={styles.aqChip}>
              <Text allowFontScaling={false} style={styles.aqChipText}>
                {t('Muddatli to‘lov')}
              </Text>
            </View>
          )}
        </View>
        <PendingBadge item={q} style={{ marginBottom: rs(4) }} />
        <Text style={styles.aqQoldiq} numberOfLines={1}>
          {`${t('Qoldiq')}: ${sortMoneyText(q?.qoldiq) || 0} ${valyuta}`}
        </Text>
        <View style={styles.aqMetaRow}>
          <CalendarIcon size={rs(13)} color={rd.color.textTertiary} />
          <Text style={styles.aqMeta} numberOfLines={1}>
            {fmtDate(q?.berilgan_sana || q?.created_at) || '—'}
          </Text>
          <ClockIcon size={rs(13)} color={overdue ? RED : rd.color.textTertiary} />
          <Text style={[styles.aqMeta, overdue && styles.aqOverdue]} numberOfLines={1}>
            {fmtDate(due) || '—'}
          </Text>
        </View>
      </View>
      <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
    </TouchableOpacity>
  );
};

export default ActiveQarzRow;
