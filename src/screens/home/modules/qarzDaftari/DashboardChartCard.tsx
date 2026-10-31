import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../theme/rd';
import { CircleIcon } from '../../../../components/ui/CircleIcon';
import { sortText } from '../../../components/StatisticCard';
import { IconProps } from '../../redesign/icons';
import RatioBar from './RatioBar';
import { uzsText } from './qarzDaftariLogic';
import { styles } from './qarzDaftariStyles';

// C) Umumiy ko'rinish kartasi (Berilgan / Olingan) — web DashboardChart.
// Jami = (uzs + usd*rate) shartnoma va daftari bo'yicha (nisbat uchun UZS'ga keltiriladi).
// SearchDebitor (Berilgan/Olingan select view) ham shu diagrammani ishlatadi —
// shuning uchun EXPORT qilinadi (bitta manba, bir xil ko'rinish).
const DashboardChartCard = ({
  accent,
  Icon,
  title,
  usdRate,
  shartnomaUzs,
  shartnomaUsd,
  daftariUzs,
  daftariUsd,
  shaxsiyUzs = 0,
  shaxsiyUsd = 0,
}: {
  accent: string;
  Icon: (p: IconProps) => JSX.Element;
  title: string;
  usdRate: number;
  shartnomaUzs: number;
  shartnomaUsd: number;
  daftariUzs: number;
  daftariUsd: number;
  // SS2: uchinchi manba — shaxsiy qarz. Default 0 (eski chaqiruvlar buzilmaydi).
  shaxsiyUzs?: number;
  shaxsiyUsd?: number;
}) => {
  const { t } = useTranslation();
  const rate = usdRate || 0;
  const shartnomaTotalUzs = shartnomaUzs + shartnomaUsd * rate;
  const daftariTotalUzs = daftariUzs + daftariUsd * rate;
  const shaxsiyTotalUzs = shaxsiyUzs + shaxsiyUsd * rate;
  const totalCombined = shartnomaTotalUzs + daftariTotalUzs + shaxsiyTotalUzs;
  const totalUsd = shartnomaUsd + daftariUsd + shaxsiyUsd;

  return (
    <View style={styles.card}>
      <View style={styles.ovHead}>
        <CircleIcon size={rs(36)} bg={accent + '1A'}>
          <Icon size={rs(18)} color={accent} />
        </CircleIcon>
        <View style={{ flex: 1 }}>
          <Text style={styles.ovTitle}>{title}</Text>
          <Text style={styles.ovSubtitle}>{t('Manbalar nisbati')}</Text>
        </View>
      </View>

      <Text style={styles.ovTotalLabel}>{t('Jami')}</Text>
      <Text style={styles.ovTotal} numberOfLines={1} adjustsFontSizeToFit>
        {uzsText(Math.round(totalCombined))}
      </Text>
      {rate > 0 && totalUsd > 0 && (
        <Text style={styles.ovRate}>
          {t('Markaziy bank kursi: 1 USD = {{rate}} UZS', { rate: sortText(rate) || 0 })}
        </Text>
      )}

      <View style={{ marginTop: rs(12) }}>
        <RatioBar
          contract={shartnomaTotalUzs}
          ledger={daftariTotalUzs}
          personal={shaxsiyTotalUzs}
        />
      </View>

      {/* Ilgari bu yerda "Qarz shartnomasi" va "Qarz daftari" subkartalari bor edi —
          so'rov bo'yicha OLIB TASHLANDI (ular pastdagi "Manbalar bo'yicha" navigatsiya
          kartalarini takrorlardi). Diagramma endi faqat umumiy summa + kurs + nisbatni
          ko'rsatadi. */}
    </View>
  );
};

export default DashboardChartCard;
