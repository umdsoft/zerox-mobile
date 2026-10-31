import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { Grad } from '../../../../components/ui/Grad';
import { GRAD } from './homeLogic';
import Shimmer from './Shimmer';
import { styles } from './homeStyles';

// Hero banner — ko'k gradient, salom + moliyaviy sog'liq ball + holat.
const HeroBanner = ({
  name,
  score,
  status,
  loading,
  onHealthPress,
}: {
  name: string;
  score: number | null;
  status: string;
  loading?: boolean;
  onHealthPress?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.hero}>
      <Grad id="heroGrad" colors={GRAD.brand} />
      {/* allowFontScaling={false} — ILDIZ SABAB (SS4): usiz Samsung "katta shrift"
          sozlamasi hero matnlarini kattalashtirib, chip label 2-qatori hero'ning
          overflow:hidden kesilgan pastki chetiga tushib, kartalar ustiga "oq blur"
          bo'lib ko'rinardi. Endi matn dizayn o'lchamida qat'iy — hech narsa kesilmaydi. */}
      <Text style={styles.heroTitle} numberOfLines={2} allowFontScaling={false}>
        {name ? t('Xush kelibsiz, {{name}}!', { name }) : t('Xush kelibsiz!')}
      </Text>
      <Text style={styles.heroSub} numberOfLines={2} allowFontScaling={false}>
        {/* SS-DEV (2026-10-04): 04.10 hujjat, 3-band — yangi shior (5 tilda). */}
        {t('Qarz munosabatlari va shaxsiy moliyani ZeroX bilan boshqaring.')}
      </Text>
      {/* 21.10: ball/holat bosilsa — "Moliyaviy sog'liq" sahifasi (ball nima uchun shunday). */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.heroChips}
        onPress={onHealthPress}
        disabled={!onHealthPress}
        accessibilityRole="button"
        accessibilityLabel={t('Moliyaviy holat')}>
        <View style={styles.heroChip}>
          {loading ? (
            <Shimmer width={rs(44)} height={rs(20)} onDark style={styles.heroChipSkel} />
          ) : (
            <Text style={styles.heroChipValue} numberOfLines={1} allowFontScaling={false}>
              {score == null ? '—' : score}
            </Text>
          )}
          <Text style={styles.heroChipLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={false}>
            {t('Moliyaviy holat')}
          </Text>
        </View>
        <View style={styles.heroChip}>
          {loading ? (
            <Shimmer width={rs(56)} height={rs(20)} onDark style={styles.heroChipSkel} />
          ) : (
            <Text style={styles.heroChipValue} numberOfLines={1} allowFontScaling={false}>
              {t(status)}
            </Text>
          )}
          <Text style={styles.heroChipLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={false}>
            {t('Status')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HeroBanner;
