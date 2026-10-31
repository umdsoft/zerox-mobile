import React from 'react';
import { Text, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { CircleIcon } from '../../../../components/ui/CircleIcon';
import { BarChartIcon } from '../../redesign/icons';
import { catLabel, fCompact, num } from '../financeMoney';
import { CAT_COLORS } from './shaxsiyMoliyaLogic';
import { styles } from './shaxsiyMoliyaStyles';

// Kategoriya ro'yxati (ro'yxat + foiz bar) — pie o'rniga (mobil sodda naqsh).
const CategoryList = ({ items, empty }: { items: any[]; empty: string }) => {
  const total = (items || []).reduce((s, c) => s + num(c?.total), 0);
  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <CircleIcon size={rs(40)} bg={rd.color.surfaceAlt}>
          <BarChartIcon size={rs(22)} color={rd.color.textTertiary} />
        </CircleIcon>
        <Text allowFontScaling={false} style={styles.emptyText}>
          {empty}
        </Text>
      </View>
    );
  }
  return (
    <>
      {items.map((c, i) => {
        const color = c?.color || CAT_COLORS[i % CAT_COLORS.length];
        const val = num(c?.total);
        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
        return (
          <View key={i} style={styles.catRow}>
            <View style={styles.catTop}>
              <View style={[styles.catDot, { backgroundColor: color }]} />
              <Text allowFontScaling={false} style={styles.catName} numberOfLines={1}>
                {c?.icon ? `${c.icon} ` : ''}
                {catLabel(c?.name)}
              </Text>
              <Text allowFontScaling={false} style={styles.catAmount} numberOfLines={1}>
                {fCompact(val, c?.currency || 'UZS')}
              </Text>
            </View>
            <View style={styles.catBarTrack}>
              <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </>
  );
};

export default CategoryList;
