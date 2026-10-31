import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { CoinIcon } from '../../../redesign/icons';
import { SMS_PACKETS } from './tariffsData';
import { styles } from './tariffsStyles';

interface SmsPacketsProps {
  busy: string | null;
  onBuy: (pkg: { name: string; sms: string; amount: number }) => void;
}

/** Qo'shimcha SMS paketlar bo'limi (sarlavha + 3 ta paket). */
const SmsPackets = ({ busy, onBuy }: SmsPacketsProps) => {
  const { t } = useTranslation();
  return (
    <>
    <View style={styles.sectionHead}>
      <View style={styles.headIcon}>
        <CoinIcon size={rs(20)} color={rd.color.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          {t('Qo‘shimcha SMS paketlar')}
        </Text>
        <Text allowFontScaling={false} style={styles.cardSub}>
          {t('SMS tugasa, tarifni o‘zgartirmasdan qo‘shimcha oling')}
        </Text>
      </View>
    </View>

    <View style={styles.packetRow}>
      {SMS_PACKETS.map(p => (
        <View key={p.sms} style={styles.packet}>
          <Text allowFontScaling={false} style={styles.packetSms}>
            {p.sms}
          </Text>
          <Text allowFontScaling={false} style={styles.packetSmsLabel}>
            SMS
          </Text>
          <Text allowFontScaling={false} style={styles.packetPrice}>
            {p.price}
          </Text>
          <Text allowFontScaling={false} style={styles.packetUnit}>
            UZS
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!!busy}
            onPress={() => onBuy(p)}
            style={[
              styles.packetBtn,
              busy === 'sms-' + p.name && { opacity: 0.75 },
            ]}>
            {busy === 'sms-' + p.name ? (
              <ActivityIndicator color={rd.color.primary} size="small" />
            ) : (
              <Text allowFontScaling={false} style={styles.packetBtnText}>
                {t('Sotib olish')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
    </>
  );
};

export default SmsPackets;
