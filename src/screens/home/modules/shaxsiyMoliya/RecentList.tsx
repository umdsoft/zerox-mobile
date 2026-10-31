import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { CircleIcon } from '../../../../components/ui/CircleIcon';
import AnimatedEmpty from '../../../components/AnimatedEmpty';
import { ArrowDownLeft, ArrowUpRight } from '../../redesign/icons';
import { catLabel, fCompact, fDate } from '../financeMoney';
import { GREEN, RED } from './shaxsiyMoliyaLogic';
import { styles } from './shaxsiyMoliyaStyles';

/** So'nggi amaliyotlar kartasi (daromad +yashil / xarajat −qizil). */
const RecentList = ({ recent }: { recent: any[] }) => {
  const { t } = useTranslation();
  return (
  <View style={styles.card}>
    {recent.length === 0 ? (
      <View style={styles.emptyBox}>
        {/* 02.10: bo'sh holat — harakatli ikonka */}
        <AnimatedEmpty variant="list" compact />
        <Text allowFontScaling={false} style={styles.emptyText}>
          {t('Amaliyotlar mavjud emas.')}
        </Text>
      </View>
    ) : (
      recent.map((r, i) => {
        const isIncome = r._kind === 'income';
        const c = isIncome ? GREEN : RED;
        return (
          <View key={i} style={[styles.txRow, i === 0 && { borderTopWidth: 0 }]}>
            <CircleIcon size={rs(34)} bg={isIncome ? rd.color.successBg : rd.color.errorBg}>
              {isIncome ? (
                <ArrowUpRight size={rs(15)} color={c} />
              ) : (
                <ArrowDownLeft size={rs(15)} color={c} />
              )}
            </CircleIcon>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.txTitle} numberOfLines={1}>
                {r?.description || catLabel(r?.category?.name)}
              </Text>
              <Text allowFontScaling={false} style={styles.txMeta} numberOfLines={1}>
                {catLabel(r?.category?.name)} · {fDate(r?._date)}
              </Text>
            </View>
            <Text allowFontScaling={false} style={[styles.txAmount, { color: c }]} numberOfLines={1}>
              {isIncome ? '+' : '−'}
              {fCompact(r?.amount, r?.currency || 'UZS')}
            </Text>
          </View>
        );
      })
    )}
  </View>
  );
};

export default RecentList;
