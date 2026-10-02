/**
 * AnimatedEmpty — ma'lumot yo'q holati uchun HARAKATLI ikonka + matn (02.10 mobil hujjati, 12-band).
 *
 * Bo'sh ro'yxatlar oddiy kulrang matn emas, mavzuga mos Lottie animatsiyasi bilan chiqadi —
 * bo'sh oynalar e'tiborni tortadi. Mavjud lottie fayllardan (src/images/lottie) foydalanadi;
 * yangi og'ir asset qo'shilmaydi.
 *
 *   <AnimatedEmpty variant="loan" text={t('Qarzlar yo‘q')} />
 *   <AnimatedEmpty variant="list" text={...} compact />   // karta ichida (kichikroq)
 */
import React, { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import { rd, rs } from '../../theme/rd';

export type AnimatedEmptyVariant =
  | 'loan' // qarz / shartnoma ro'yxatlari
  | 'list' // umumiy ro'yxat (tarix, amaliyotlar)
  | 'check' // tugallangan / yopilgan
  | 'chart' // hisobot / statistika
  | 'safe' // xavfsizlik / qurilmalar
  | 'given' // berilgan qarz
  | 'taken' // olingan qarz
  | 'time'; // muddat / kalendar

const SOURCES: Record<AnimatedEmptyVariant, any> = {
  loan: require('../../images/lottie/list/zyDdwfLniz.json'),
  list: require('../../images/lottie/list/aCUgxlGWKw.json'),
  check: require('../../images/lottie/list/a05QqYIpIG.json'),
  chart: require('../../images/lottie/list/vQHqXEUIEF.json'),
  safe: require('../../images/lottie/list/8tdue8bgdH.json'),
  given: require('../../images/lottie/qarzberish/dXMUc2yhYi.json'),
  taken: require('../../images/lottie/qarzolish/Rp4eDvBQu4.json'),
  time: require('../../images/timeanim.json'),
};

type Props = {
  variant?: AnimatedEmptyVariant;
  text?: string;
  hint?: string;
  compact?: boolean;
  style?: ViewStyle;
};

const AnimatedEmpty = ({ variant = 'list', text, hint, compact = false, style }: Props) => {
  const size = compact ? rs(84) : rs(150);
  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null, style]}>
      <LottieView autoPlay loop source={SOURCES[variant]} style={{ width: size, height: size }} />
      {!!text && (
        <Text allowFontScaling={false} style={[styles.text, compact ? styles.textCompact : null]}>
          {text}
        </Text>
      )}
      {!!hint && (
        <Text allowFontScaling={false} style={styles.hint}>
          {hint}
        </Text>
      )}
    </View>
  );
};

export default memo(AnimatedEmpty);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(24),
    paddingHorizontal: rs(16),
  },
  wrapCompact: {
    paddingVertical: rs(8),
  },
  text: {
    marginTop: rs(6),
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    textAlign: 'center',
  },
  textCompact: {
    marginTop: rs(2),
    fontSize: rs(13),
  },
  hint: {
    marginTop: rs(4),
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
});
