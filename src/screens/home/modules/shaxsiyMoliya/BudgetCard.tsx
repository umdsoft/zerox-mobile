import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fCompact, num } from '../financeMoney';
import { GREEN, RED } from './shaxsiyMoliyaLogic';
import { styles } from './shaxsiyMoliyaStyles';

interface BudgetCardProps {
  budget: any;
  go: (route: string) => void;
}

const BudgetCard = ({ budget, go }: BudgetCardProps) => {
  const { t } = useTranslation();
  return (
<TouchableOpacity
  activeOpacity={0.9}
  onPress={() => go('FinanceBudget')}
  style={styles.card}>
  <View style={styles.budgetHead}>
    {/* SS1: "Batafsil" sarlavha yonidan OLINDI — endi "Qolgan" ostida (mantiqan mos). */}
    <Text allowFontScaling={false} style={styles.cardTitle}>
      {t('Oylik limit')}
    </Text>
    <Text
      allowFontScaling={false}
      style={[
        styles.budgetPct,
        {
          color:
            num(budget?.percentage) >= 100
              ? RED
              : num(budget?.percentage) >= 90
              ? '#f59e0b'
              : GREEN,
        },
      ]}>
      {num(budget?.percentage)}%
    </Text>
  </View>
  <View style={styles.barTrack}>
    <View
      style={[
        styles.barFill,
        {
          width: `${Math.min(100, num(budget?.percentage))}%`,
          backgroundColor:
            num(budget?.percentage) >= 100
              ? RED
              : num(budget?.percentage) >= 90
              ? '#f59e0b'
              : GREEN,
        },
      ]}
    />
  </View>
  <View style={styles.budgetRow}>
    <View>
      <Text allowFontScaling={false} style={styles.budgetSmallLabel}>
        {t('Sarflandi')}
      </Text>
      <Text allowFontScaling={false} style={styles.budgetSmallValue}>
        {fCompact(budget?.spent)}
      </Text>
    </View>
    <View style={{ alignItems: 'center' }}>
      <Text allowFontScaling={false} style={styles.budgetSmallLabel}>
        {t('Reja')}
      </Text>
      <Text allowFontScaling={false} style={styles.budgetSmallValue}>
        {fCompact(budget?.planned)}
      </Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text allowFontScaling={false} style={styles.budgetSmallLabel}>
        {t('Qolgan')}
      </Text>
      <Text
        allowFontScaling={false}
        style={[
          styles.budgetSmallValue,
          { color: num(budget?.remaining) < 0 ? RED : GREEN },
        ]}>
        {fCompact(budget?.remaining)}
      </Text>
      {/* SS1: "Batafsil ›" — aynan "Qolgan" ostida. */}
      <Text allowFontScaling={false} style={styles.budgetMore}>
        {t('Batafsil')} ›
      </Text>
    </View>
  </View>
</TouchableOpacity>
  );
};

export default BudgetCard;
