import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isRoundDefaultOpen } from '../gapDetailLogic';
import type { GapDetail } from '../useGapDetail';
import { styles } from '../gapDetailStyles';
import GapRoundItem from './GapRoundItem';

/**
 * Davralar ro'yxati. SS3-1 (2026-09-15): standart holat MAZMUNGA bog'liq — yakunlangan davralar YOPIQ,
 * birinchi yakunlanmagani OCHIQ; foydalanuvchi qo'lda ochsa/yopsa uning tanlovi ustun.
 */
const GapRoundsCard = ({ d }: { d: GapDetail }) => {
  const { t } = useTranslation();
  const { rounds, openRounds } = d;
  if (rounds.length === 0) return null;
  return (
    <View style={styles.card}>
      <Text allowFontScaling={false} style={styles.cardTitle}>{t('Davralar')}</Text>
      {rounds.map((r, i) => {
        const rk = String(r.id ?? i);
        return <GapRoundItem key={rk} d={d} r={r} roundKey={rk} isOpen={openRounds[rk] ?? isRoundDefaultOpen(rounds, i)} />;
      })}
    </View>
  );
};

export default GapRoundsCard;
