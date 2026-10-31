import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ReportRow from './ReportRow';
import { MONTHS } from './kalendarLogic';
import { styles } from './kalendarStyles';

interface CalendarReportProps {
  m: number;
  y: number;
  cur: 'UZS' | 'USD';
  bazaKun: number;
  haftaBosh: number;
  haftaOxir: number;
  kunBer: number;
  kunUnd: number;
  haftaBer: number;
  haftaUnd: number;
  totBer: number;
  totUnd: number;
  openVaraq: (turi: 'kun' | 'hafta') => void;
}
/** Kunlik / haftalik / oylik hisobot (kun va hafta qatorlari bosiladi). */
const CalendarReport = ({ m, y, cur, bazaKun, haftaBosh, haftaOxir, kunBer, kunUnd, haftaBer, haftaUnd, totBer, totUnd, openVaraq }: CalendarReportProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text allowFontScaling={false} style={styles.cardTitle}>
        {t('Hisobot')}
      </Text>
      {/* SS-DEV (2026-09-24): kun/hafta qatorlari BOSILADI → ro'yxat varag'i. */}
      <ReportRow
        label={`${bazaKun}-${t(MONTHS[m - 1])}`}
        ber={kunBer}
        und={kunUnd}
        cur={cur}
        onPress={() => openVaraq('kun')}
      />
      <ReportRow
        label={`${t('Hafta')}: ${haftaBosh}–${haftaOxir}`}
        ber={haftaBer}
        und={haftaUnd}
        cur={cur}
        onPress={() => openVaraq('hafta')}
      />
      <View style={styles.repDivider} />
      <ReportRow label={`${t(MONTHS[m - 1])} ${y}`} ber={totBer} und={totUnd} cur={cur} />
      <Text allowFontScaling={false} style={styles.repHint}>
        {t('Kun yoki hafta qatorini bosing — ro‘yxat ochiladi')}
      </Text>
    </View>
  );
};

export default CalendarReport;
