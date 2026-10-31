import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import AnimatedEmpty from '../../../components/AnimatedEmpty';
import { dueLabel, getDueMeta, sortText } from '../../../components/StatisticCard';
import { ChevronRight } from '../../redesign/icons';
import { isCur, num, Row } from './shartnomaLogic';
import { styles } from './shartnomaStyles';

// ---------- Muddati oz qolgan (segment-toggle + jadval) ----------
const NearCard = ({
  title,
  five,
  onPress,
  onRow,
}: {
  title: string;
  five?: Row[];
  onPress?: () => void;
  onRow?: (uid: any, type: number) => void;
}) => {
  const { t } = useTranslation();
  const [cur, setCur] = useState<'UZS' | 'USD'>('UZS');
  const rows = useMemo(
    () => (five || []).filter(r => isCur(r, cur)),
    [five, cur],
  );
  return (
    // Butun karta bosiladigan. Ichkaridagi UZS/USD tugmalari o'z bosishini
    // o'zlari ushlaydi (RN'da ichki touchable ustun) -> valyuta almashtirish
    // navigatsiyani ishga tushirmaydi.
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={!onPress}
      onPress={onPress}
      style={styles.nearCard}
    >
      <View style={styles.nearHead}>
        <Text style={styles.nearTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.segment}>
          {(['UZS', 'USD'] as const).map(c => {
            const active = cur === c;
            return (
              <TouchableOpacity
                key={c}
                activeOpacity={0.8}
                onPress={() => setCur(c)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {rows.length === 0 ? (
        // 02.10: bo'sh holat — animatsiyali (umumiy AnimatedEmpty).
        <AnimatedEmpty
          variant="time"
          compact
          text={t('Hozircha sizda muddati oz qolgan qarzdorliklar mavjud emas.')}
        />
      ) : (
        <View>
          <View style={styles.tableHead}>
            <Text style={styles.tableHeadCol}>{t('Qolgan vaqt')}</Text>
            <Text style={[styles.tableHeadCol, styles.tableRight]}>{t('Qarz miqdori')}</Text>
          </View>
          {rows.map((r, i) => {
            const due = getDueMeta(r.end_date);
            // So'rov SS1: qator bosilса AYNAN shu qarz (kontragent) ochiladi.
            // Kartaning o'zi (yoki "Barchasini ko'rish") esa BARCHASINI ochadi.
            const tappable = !!(onRow && r.counter_uid);
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={tappable ? 0.6 : 1}
                disabled={!tappable}
                onPress={() => tappable && onRow!(r.counter_uid, Number(r.counter_type) || 0)}
                style={styles.tableRow}>
                <View style={[styles.dueBadge, { backgroundColor: due.bg }]}>
                  <Text style={[styles.dueBadgeText, { color: due.color }]}>{dueLabel(due)}</Text>
                </View>
                <Text style={[styles.tableAmount, styles.tableRight]} numberOfLines={1}>
                  {sortText(num(r.residual_amount))} {r.currency || 'UZS'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Bosiladigan ekanini bildiruvchi pastki qator */}
      {onPress ? (
        <View style={styles.nearMore}>
          <Text style={styles.nearMoreText}>{t('Barchasini ko‘rish')}</Text>
          <ChevronRight size={rs(15)} color={rd.color.primary} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export default NearCard;
