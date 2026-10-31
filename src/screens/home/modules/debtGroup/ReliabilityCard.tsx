import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { CheckCircleIcon, InfoIcon, WarningIcon } from '../../redesign/icons';
import { Reliability, REL_TEXT } from './debtGroupLogic';
import { styles } from './debtGroupStyles';

/** 2a. TAVSIYA (SS-DEV 2026-09-24) — do'kon sahifasida ko'rsatilmaydi. */
const ReliabilityCard = ({ reliability }: { reliability: Reliability }) => {
  const { t } = useTranslation();
  const rt = REL_TEXT[reliability.level] || REL_TEXT.none;
  const RelIcon =
    reliability.level === 'reliable' ? CheckCircleIcon : reliability.level === 'none' ? InfoIcon : WarningIcon;
  return (
    <View style={styles.relCard}>
      <Text allowFontScaling={false} style={styles.relTitle}>{t('Tavsiya')}</Text>
      <View style={[styles.relBox, { backgroundColor: rt.bg }]}>
        <View style={[styles.relIcon, { backgroundColor: rt.color + '1A' }]}>
          <RelIcon size={rs(18)} color={rt.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={[styles.relLevel, { color: rt.color }]}>
            {t(rt.title)}
          </Text>
          <Text allowFontScaling={false} style={styles.relDesc}>
            {t(rt.desc)}
            {reliability.total > 0 ? ` (${reliability.on_time}/${reliability.total} ${t('o‘z vaqtida')})` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ReliabilityCard;
