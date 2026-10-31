import React from 'react';
import { Text, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { CheckCircleIcon, PlusIcon } from '../../redesign/icons';
import { BanIcon } from '../FinanceDebtActionModal';
import { fDate, fMoney } from '../financeMoney';
import { AMBER, GREEN, RED, ROSE } from './debtDetailLogic';
import { styles } from './debtDetailStyles';
import type { DebtDetailState } from './useDebtDetail';

/** AMALIYOTLAR TARIXI — eng yangisi tepada; rang PUL OQIMI bo'yicha (SS11). */
const DebtHistory = ({ s }: { s: DebtDetailState }) => {
  const { t, d } = s;
  const { borrowed, ops } = s.view!;
  return (
    <View style={styles.histCard}>
      <Text allowFontScaling={false} style={styles.histTitle}>{t('Amaliyotlar tarixi')}</Text>
      {ops.map(op => {
        const isPay = op.kind === 'payment';
        const flowOut = borrowed ? isPay : !isPay; // pul bizdan CHIQDIMI?
        const opColor =
          op.kind === 'forgive' ? ROSE : op.kind === 'increase' ? AMBER : flowOut ? RED : GREEN;
        const opSign = isPay || op.kind === 'forgive' ? '−' : '+';
        const opLabel =
          op.kind === 'original'
            ? borrowed
              ? t('Qarz olindi')
              : t('Qarz berildi')
            : op.kind === 'increase'
            ? t('Qo‘shimcha qarz')
            : op.kind === 'forgive'
            ? t('Voz kechildi')
            : t('Qaytarildi');
        const sub = [fDate(op.date), op.note].filter(Boolean).join(' · ');
        return (
          <View key={op.id ?? `${op.kind}-${op._idx}`} style={styles.histRow}>
            <View style={styles.histLeft}>
              <View style={[styles.histDot, { backgroundColor: opColor + '18' }]}>
                {op.kind === 'forgive' ? (
                  <BanIcon size={rs(14)} color={opColor} strokeWidth={2.4} />
                ) : op.kind === 'payment' ? (
                  <CheckCircleIcon size={rs(15)} color={opColor} />
                ) : (
                  <PlusIcon size={rs(14)} color={opColor} strokeWidth={2.6} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={styles.histType}>{opLabel}</Text>
                <Text allowFontScaling={false} style={styles.histDate}>{sub}</Text>
                {!!op.by && (
                  <Text allowFontScaling={false} style={styles.histBy} numberOfLines={1}>{op.by}</Text>
                )}
              </View>
            </View>
            <Text allowFontScaling={false} style={[styles.histAmt, { color: opColor }]}>
              {opSign}{fMoney(op.amount, d.currency)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default DebtHistory;
