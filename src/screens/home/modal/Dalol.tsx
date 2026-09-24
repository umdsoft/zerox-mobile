import { StyleSheet, View } from 'react-native';
import React from 'react';
import { useRoute } from '@react-navigation/native';
import RdHeader from '../redesign/RdHeader';
import Pdf from 'react-native-pdf';
import { rd, rs } from '../../../theme/rd';
import { useTranslation } from 'react-i18next';
import { PDF_ACT_URL } from '../../constants';

const Dalol = () => {
  const route = useRoute();
  const { type, data, date, sum } = route.params;
  const { t, i18n } = useTranslation();


  return (
    <View style={styles.container}>
      <RdHeader title={t('Dalolatnoma')} />
      <View style={styles.card}>
        <Pdf
          trustAllCerts={false}
          source={{
            uri: returnURL(
              type,
              data,
              i18n.language,
              date?.toString() || '',
              sum,
            ),
          }}
          onError={error => {
            console.error(error, 'error');
          }}
          style={styles.pdf}
        />
      </View>
    </View>
  );
};

const returnURL = (type, data, lang, date, sum) => {
  // mysql2 DATE → TZ-siljishli ISO ("2026-07-14T19:00:00.000Z" = mahalliy 2026-07-15).
  // PDF generatori 'YYYY-MM-DD' kutadi → mahalliy (UTC+5) sanaga keltiramiz.
  const fmt = v => {
    // null/undefined/'' -> BO'SH (ilgari new Date(null)=epoch 0 -> "1970-01-01" chiqardi).
    if (!v) return '';
    const d = new Date(v);
    const tm = d.getTime();
    return isNaN(tm) || tm <= 0
      ? ''
      : new Date(tm + 5 * 3600 * 1000).toISOString().slice(0, 10);
  };
  switch (type) {
    case 2:
      return `${PDF_ACT_URL}?debitor=${data.duid}&creditor=${data.cuid}&act_type=4&vos_summa=${data.residual_amount}&uid=${data.uid}&lang=${lang}`;
    case 3:
      const dd = new Date(date);
      const date2 = dd.toISOString().slice(0, 10);
      return `${PDF_ACT_URL}?debitor=${data.duid}&creditor=${data.cuid}&act_type=6&refundable_amount=0&residual_amount=${data.residual_amount}&end_date=${date2}&uid=${data.uid}&lang=${lang}`;
    case 4:
      return `${PDF_ACT_URL}?debitor=${data.duid}&creditor=${data.cuid}&act_type=2&amount=${data.amount}&residual_amount=0&refundable_amount=${data.residual_amount}&end_date=${fmt(
        data.end_date,
      )}&uid=${data.uid}&lang=${lang}`;
    case 5:
      // Qisman qaytarish: act.php PDF qoldiqni O'ZI `residual_amount - refundable_amount`
      // deb hisoblaydi. Shu bois residual_amount = JORIY umumiy qarz (amount - inc), sum
      // AYIRILMAYDI (aks holda act.php yana sum ayirib IKKI marta ayirar edi -> 0). Bu web
      // (debt-refund) bilan MOS: masalan act.php (40 000) - (20 000) = 20 000. Sana → fmt.
      return `${PDF_ACT_URL}?debitor=${data.duid}&creditor=${data.cuid}&act_type=1&amount=${data.amount}&refundable_amount=${sum}&residual_amount=${
        Number(data.amount) - Number(data.inc || 0)
      }&end_date=${fmt(data.end_date)}&uid=${data.uid}&lang=${lang}`;
    default:
      return '';
  }
};

export default Dalol;

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  card: {
    flex: 1,
    marginHorizontal: rs(16),
    marginTop: rs(6),
    marginBottom: rs(16),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    overflow: 'hidden',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
