import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd } from '../../../../theme/rd';
import { ArrowDownLeft, ArrowUpRight, ClockIcon } from '../../redesign/icons';
import DebtSummaryCard from '../../redesign/DebtSummaryCard';
import type { DebtRole, DebtTab } from '../../redesign/debtNav';
import { money } from './shartnomaLogic';
import { styles } from './shartnomaStyles';

// ---------- Qarzdorlik kartasi (chegara rangli) ----------
// SS-DEV (2026-09-29): umumiy komponentga chiqarildi (Shaxsiy qarz ham ishlatadi).
// 30.09 (6-band): tashqi ko'rinish Qarz daftari kartalari uslubida (ichki ma'lumot o'zgarmagan).
const DebtCard = (p: React.ComponentProps<typeof DebtSummaryCard>) => (
  <DebtSummaryCard {...p} variant="stripe" />
);

export interface DebtSums {
  debGivenUzs: number;
  debGivenUsd: number;
  debExpUzs: number;
  debExpUsd: number;
  credTakenUzs: number;
  credTakenUsd: number;
  credExpUzs: number;
  credExpUsd: number;
}

interface DebtCardsGridProps {
  sums: DebtSums;
  goList: (role: DebtRole, tab: DebtTab, title: string) => void;
}

/**
 * Yuqori qator: Berilgan qarz | Olingan qarz (yonma-yon). Past qator: Muddati o'tgan (ber.) | Muddati o'tgan (ol.) —
 * har biri o'z turi TAGIDA.
 */
const DebtCardsGrid = ({ sums, goList }: DebtCardsGridProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.debtGrid}>
      <DebtCard
        accent={rd.color.primary}
        Icon={ArrowUpRight}
        label={t('Berilgan qarz')}
        badge={t('Olish kerak')}
        badgeBg={rd.color.primaryTint}
        badgeColor={rd.color.primary}
        amountColor={rd.color.text}
        lines={money(sums.debGivenUzs, sums.debGivenUsd)}
        onPress={() => goList('debitor', 'all', t('Berilgan qarz'))}
      />
      <DebtCard
        accent={rd.color.success}
        Icon={ArrowDownLeft}
        label={t('Olingan qarz')}
        badge={t('Berish kerak')}
        badgeBg={rd.color.successBg}
        badgeColor={rd.color.success}
        amountColor={rd.color.text}
        lines={money(sums.credTakenUzs, sums.credTakenUsd)}
        onPress={() => goList('creditor', 'all', t('Olingan qarz'))}
      />
      <DebtCard
        accent={rd.color.error}
        Icon={ClockIcon}
        label={t('Berilgan qarz')}
        badge={t('Muddati o‘tgan')}
        badgeBg={rd.color.errorBg}
        badgeColor={rd.color.error}
        amountColor={rd.color.error}
        lines={money(sums.debExpUzs, sums.debExpUsd)}
        onPress={() => goList('debitor', 'overdue', t('Muddati o‘tgan (debitor)'))}
      />
      <DebtCard
        accent={rd.color.error}
        Icon={ClockIcon}
        label={t('Olingan qarz')}
        badge={t('Muddati o‘tgan')}
        badgeBg={rd.color.errorBg}
        badgeColor={rd.color.error}
        amountColor={rd.color.error}
        lines={money(sums.credExpUzs, sums.credExpUsd)}
        onPress={() => goList('creditor', 'overdue', t('Muddati o‘tgan (kreditor)'))}
      />
    </View>
  );
};

export default DebtCardsGrid;
