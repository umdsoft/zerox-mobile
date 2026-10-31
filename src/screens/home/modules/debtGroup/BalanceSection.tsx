import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd } from '../../../../theme/rd';
import { fMoney } from '../financeMoney';
import { BLUE, GREEN, RED, Side } from './debtGroupLogic';
import { styles } from './debtGroupStyles';

interface BalanceSectionProps {
  side: Side;
  sideTotals: { currency: string; paid: number; left: number; total: number }[];
  balance: [string, { lent: number; borrowed: number }][];
}

/** 2. BALANS — 02.10: bo'lim ma'lum bo'lsa sayt kartalari (Jami | Undirilgan | Qoldiq), aks holda valyuta bo'yicha balans. */
const BalanceSection = ({ side, sideTotals, balance }: BalanceSectionProps) => {
  const { t } = useTranslation();
  return side ? (
      <View style={styles.tiles}>
        {[
          { label: t('Jami qarz'), key: 'total' as const, color: rd.color.text },
          {
            label: side === 'lent' ? t('Undirilgan qarz') : t('Qaytarilgan qarz'),
            key: 'paid' as const,
            color: GREEN,
          },
          { label: t('Qoldiq qarz'), key: 'left' as const, color: side === 'lent' ? BLUE : RED },
        ].map(tile => (
          <View key={tile.key} style={styles.tile}>
            <Text allowFontScaling={false} style={styles.tileLabel} numberOfLines={1}>
              {tile.label}
            </Text>
            {sideTotals.map(c => (
              <Text
                key={c.currency}
                allowFontScaling={false}
                style={[styles.tileVal, { color: tile.color }]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {fMoney(c[tile.key], c.currency)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    ) : (
      <View style={styles.balCard}>
        <Text allowFontScaling={false} style={styles.balTitle}>{t('Balans')}</Text>
        {balance.map(([cur, v]) => {
          const net = v.lent - v.borrowed;
          return (
            <View key={cur} style={styles.balBlock}>
              <View style={styles.balRow}>
                <Text allowFontScaling={false} style={styles.balLabel}>{t('Berilgan')}</Text>
                <Text allowFontScaling={false} style={[styles.balVal, { color: GREEN }]}>
                  {v.lent > 0 ? '+' : ''}{fMoney(v.lent, cur)}
                </Text>
              </View>
              <View style={styles.balRow}>
                <Text allowFontScaling={false} style={styles.balLabel}>{t('Olingan')}</Text>
                <Text allowFontScaling={false} style={[styles.balVal, { color: RED }]}>
                  {v.borrowed > 0 ? '−' : ''}{fMoney(v.borrowed, cur)}
                </Text>
              </View>
              <View style={styles.balDivider} />
              <View style={styles.balRow}>
                <Text allowFontScaling={false} style={styles.balNetLabel}>{t('Sof balans')}</Text>
                <Text allowFontScaling={false} style={[styles.balNet, { color: net < 0 ? RED : GREEN }]}>
                  {net < 0 ? '−' : '+'}{fMoney(Math.abs(net), cur)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
  );
};

export default BalanceSection;
