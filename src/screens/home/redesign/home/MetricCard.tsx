import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { CircleIcon } from '../../../../components/ui/CircleIcon';
import type { IconProps } from '../icons';
import Shimmer from './Shimmer';
import { styles } from './homeStyles';

// Asosiy ko'rsatkich kartasi — tepa aksent chizig'i, ikona, label, UZS + USD.
const MetricCard = ({
  accent,
  accentBg,
  Icon,
  label,
  uzs,
  usd,
  value,
  comingSoon,
  loading,
  onPress,
  total,
}: {
  accent: string;
  accentBg: string;
  Icon: (p: IconProps) => React.ReactElement;
  label: string;
  uzs?: string;
  usd?: string;
  value?: string;
  comingSoon?: boolean;
  loading?: boolean;
  onPress?: () => void;
  /** 21.10: barcha modullar JAMI kartasi — to'liq gradient fon + oq matn + "Jami" belgisi. */
  total?: { id: string; colors: readonly string[] };
}) => {
  const { t } = useTranslation();
  if (total && !comingSoon) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.metricCard, styles.totalCard]}>
        <View style={styles.metricHead}>
          <CircleIcon size={rs(32)} bg={rd.color.surface}>
            <Icon size={rs(17)} color={rd.color.primary} />
          </CircleIcon>
          <View style={styles.totalTitleCol}>
            {/* 25.10: so'z o'rtasida uzilmasin va "…" bilan kesilmasin — kichrayadi. */}
            <Text style={[styles.totalLabel]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
              {t(label)}
            </Text>
          </View>
        </View>
        {loading ? (
          <>
            <Shimmer width="68%" height={rs(18)} style={styles.metricSkeleton} />
            <Shimmer width="40%" height={rs(14)} style={styles.metricSkeleton} />
          </>
        ) : (
          <>
            <Text style={[styles.metricUzs, styles.totalUzs]} numberOfLines={1} adjustsFontSizeToFit>
              {uzs}
            </Text>
            {usd ? <Text style={[styles.metricUsd, styles.totalUsd]}>{usd}</Text> : null}
          </>
        )}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      activeOpacity={comingSoon ? 1 : 0.85}
      disabled={comingSoon}
      onPress={onPress}
      style={[
        styles.metricCard,
        // SS1-2 (2026-09-21): bu ikki karta modul kartalaridan AJRALIB
        // tursin — o'z rangidan juda yengil fon va chegara oladi.
        !comingSoon && { backgroundColor: accent + '0D', borderColor: accent + '33' },
        comingSoon && styles.metricCardSoon,
      ]}
    >
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <View style={styles.metricHead}>
        <CircleIcon size={rs(32)} bg={accentBg}>
          <Icon size={rs(17)} color={accent} />
        </CircleIcon>
        {/* SS1-1: yorliq ikonka TAGIDA emas, O'NG TOMONIDA. */}
        {!comingSoon ? (
          <Text style={styles.metricLabelInline} numberOfLines={2}>
            {t(label)}
          </Text>
        ) : null}
        {comingSoon ? (
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>{t('Tez kunda')}</Text>
          </View>
        ) : null}
      </View>
      {comingSoon ? (
        <>
          <Text style={styles.metricValueBig}>{value}</Text>
          <Text style={styles.metricLabel}>{t(label)}</Text>
        </>
      ) : (
        <>
          {/* SS1-1: yorliq endi yuqorida, ikonka yonida chiziladi. */}
          {loading ? (
            // Dashboard (shartnoma+daftar birlashgan summa) hali kelmagan —
            // qisman/xato raqam KO'RSATILMAYDI (aks holda keyin sakraydi).
            // O'rniga skeleton; summa TAYYOR bo'lganda bir marta paydo bo'ladi.
            <>
              <Shimmer width="68%" height={rs(18)} style={styles.metricSkeleton} />
              <Shimmer width="40%" height={rs(14)} style={styles.metricSkeleton} />
            </>
          ) : (
            <>
              <Text style={styles.metricUzs} numberOfLines={1} adjustsFontSizeToFit>
                {uzs}
              </Text>
              {usd ? <Text style={styles.metricUsd}>{usd}</Text> : null}
            </>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default MetricCard;
