import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { AMBER } from './mijozLogic';
import { styles } from './mijozStyles';

interface SumCardsProps {
  turi: 'berish' | 'olish';
  accent: string;
  sum: { uzsLeft: string; uzsRight: string; usdLeft: string; usdRight: string };
  sumValueSize: number;
  sumSubSize: number;
}

/**
 * SS8-3 / SS8-4: "Qoldiq qarz" va "Undirilgan qarz" (olingan qarzda — "Qaytarilgan qarz"). SS-B2: shrift IKKALA kartaga
 * BIR XIL (eng uzun satrga qarab bir marta hisoblanadi).
 */
const SumCards = ({ turi, accent, sum, sumValueSize, sumSubSize }: SumCardsProps) => {
  const { t } = useTranslation();
  return (
  <View style={styles.sumGrid}>
    <View style={styles.sumCard}>
      <View style={[styles.metricAccent, { backgroundColor: AMBER }]} />
      <Text style={styles.sumLabel} numberOfLines={1}>{t('Qoldiq qarz')}</Text>
      {/* SS1a: milliarddan oshsa "1,0 B" — aks holda to'liq summa.
          SS-B2: o'lcham IKKALA kartaga bir xil (yuqoridagi izohga qarang). */}
      <Text
        style={[styles.sumValue, { fontSize: rs(sumValueSize) }]}
        numberOfLines={1}>
        {sum.uzsLeft}
      </Text>
      <Text
        style={[styles.sumValueSub, { fontSize: rs(sumSubSize) }]}
        numberOfLines={1}>
        {sum.usdLeft}
      </Text>
    </View>
    <View style={styles.sumCard}>
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <Text style={styles.sumLabel} numberOfLines={1}>
        {turi === 'olish' ? t('Qaytarilgan qarz') : t('Undirilgan qarz')}
      </Text>
      <Text
        style={[styles.sumValue, { fontSize: rs(sumValueSize) }]}
        numberOfLines={1}>
        {sum.uzsRight}
      </Text>
      <Text
        style={[styles.sumValueSub, { fontSize: rs(sumSubSize) }]}
        numberOfLines={1}>
        {sum.usdRight}
      </Text>
    </View>
  </View>
  );
};

export default SumCards;
