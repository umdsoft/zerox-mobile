import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { CheckIcon, CloseIcon, StarIcon } from '../../../redesign/icons';
import { DAFTARI_TARIFFS } from './tariffsData';
import { styles } from './tariffsStyles';

interface TariffCardProps {
  tar: (typeof DAFTARI_TARIFFS)[number];
  currentPlan: string;
  busy: string | null;
  onPurchase: (planKey: string, name: string) => void;
}

/** Qarz daftari tarifi kartasi: badge, narx, imkoniyatlar ro'yxati, "Ulanish"/"Joriy tarif" tugmasi. */
const TariffCard = ({ tar, currentPlan, busy, onPurchase }: TariffCardProps) => {
  const { t } = useTranslation();
  return (
      <View
                style={[
          styles.tariffCard,
          tar.highlight && { borderColor: tar.accent, borderWidth: 1.5 },
        ]}>
        <View style={styles.tariffTop}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: tar.tint }]}>
              <Text
                allowFontScaling={false}
                style={[styles.badgeText, { color: tar.accent }]}>
                {tar.badge}
              </Text>
            </View>
            {tar.popular ? (
              <View style={styles.popularPill}>
                <StarIcon size={rs(11)} color="#f5a623" />
                <Text allowFontScaling={false} style={styles.popularText}>
                  {t('Ommabop')}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.priceWrap}>
            <Text allowFontScaling={false} style={styles.tariffPrice}>
              {tar.price}
            </Text>
            <Text allowFontScaling={false} style={styles.tariffUnit}>
              UZS
            </Text>
          </View>
        </View>

        <View style={styles.features}>
          {tar.features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: f.on ? rd.color.successBg : rd.color.surfaceAlt },
                ]}>
                {f.on ? (
                  <CheckIcon size={rs(12)} color={rd.color.success} />
                ) : (
                  <CloseIcon size={rs(12)} color={rd.color.textTertiary} />
                )}
              </View>
              <Text
                allowFontScaling={false}
                style={[
                  styles.featureText,
                  !f.on && { color: rd.color.textTertiary },
                ]}>
                {t(f.label)}
              </Text>
            </View>
          ))}
        </View>

        {currentPlan === tar.key ? (
          <View style={styles.currentBtn}>
            <Text allowFontScaling={false} style={styles.currentText}>
              {t('Joriy tarif')}
            </Text>
          </View>
        ) : tar.key === 'free' ? (
          <View style={styles.currentBtn}>
            <Text allowFontScaling={false} style={styles.currentText}>
              {t('Bepul tarif')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!!busy}
            onPress={() => onPurchase(tar.key, tar.name)}
            style={[
              styles.joinBtn,
              { backgroundColor: tar.accent },
              busy === 'plan-' + tar.key && { opacity: 0.75 },
            ]}>
            {busy === 'plan-' + tar.key ? (
              <ActivityIndicator color={rd.color.onPrimary} size="small" />
            ) : (
              <Text allowFontScaling={false} style={styles.joinText}>
                {t('Ulanish')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
  );
};

export default TariffCard;
