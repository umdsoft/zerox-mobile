import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { ChevronRight, MessageIcon, StarIcon } from '../../../redesign/icons';
import { styles } from './tariffsStyles';

interface SmsBalanceCardProps {
  smsUsed: number;
  smsRemaining: number;
  smsTotal: number;
  smsBarPct: number;
  onHistory: () => void;
}

/** SMS balans (ENG TEPADA — saytdagidek): qoldiq / jami, progress, SMS tarixi havolasi. */
const SmsBalanceCard = ({ smsUsed, smsRemaining, smsTotal, smsBarPct, onHistory }: SmsBalanceCardProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.smsCard}>
      <View style={styles.smsTop}>
        <View style={styles.smsStar}>
          <StarIcon size={rs(16)} color="#f5a623" />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.smsLabel}>
            {t('SMS balansingiz')}
          </Text>
          <Text allowFontScaling={false} style={styles.smsPlan}>
            {/* Balans bilan izchil: sarflangan = jami - qoldiq (paketdan yechilgan).
                sms_history soni (sent) ba'zan kamroq bo'ladi (eski loglanmagan
                yozuvlar) — shu bois "sarflangan" ko'rsatkichi ishlatiladi. */}
            {t('Jami {{n}} ta SMS yuborilgan', { n: smsUsed })}
          </Text>
        </View>
        <View style={styles.smsCountWrap}>
          <Text allowFontScaling={false} style={styles.smsCount}>
            {`${smsRemaining} / ${smsTotal}`}
          </Text>
          <Text allowFontScaling={false} style={styles.smsCountLabel}>
            {t('SMS qoldi')}
          </Text>
        </View>
      </View>
      <View style={styles.smsBarTrack}>
        <View style={[styles.smsBarFill, { width: `${smsBarPct}%` }]} />
      </View>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={onHistory}
        accessibilityRole="button"
        accessibilityLabel={t('SMS xabarlar tarixi')}
        style={styles.smsHistoryBtn}>
        <View style={styles.smsHistoryLeft}>
          <MessageIcon size={rs(16)} color={rd.color.primary} />
          <Text allowFontScaling={false} style={styles.smsHistoryText}>
            {t('SMS xabarlar tarixi')}
          </Text>
        </View>
        <ChevronRight size={rs(18)} color={rd.color.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default SmsBalanceCard;
