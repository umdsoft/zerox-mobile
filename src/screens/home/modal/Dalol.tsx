import { StyleSheet, View } from 'react-native';
import React from 'react';
import { useRoute } from '@react-navigation/native';
import RdHeader from '../redesign/RdHeader';
import Pdf from 'react-native-pdf';
import { rd, rs } from '../../../theme/rd';
import { useTranslation } from 'react-i18next';

const Dalol = () => {
  const route = useRoute();
  const { type, data, date, sum } = route.params;
  const { t, i18n } = useTranslation();

  console.log(route.params, 'route.params');

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
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`number of pages: ${numberOfPages}`);
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`current page: ${page}`);
          }}
          onError={error => {
            console.log(error, 'error');
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
    const d = new Date(v);
    return isNaN(d.getTime())
      ? ''
      : new Date(d.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
  };
  switch (type) {
    case 2:
      return `https://pdf.zerox.uz/act.php?debitor=${data.duid}&creditor=${data.cuid}&act_type=4&vos_summa=${data.residual_amount}&uid=${data.uid}&lang=${lang}`;
    case 3:
      const dd = new Date(date);
      const date2 = dd.toISOString().slice(0, 10);
      return `https://pdf.zerox.uz/act.php?debitor=${data.duid}&creditor=${data.cuid}&act_type=6&refundable_amount=0&residual_amount=${data.residual_amount}&end_date=${date2}&uid=${data.uid}&lang=${lang}`;
    case 4:
      return `https://pdf.zerox.uz/act.php?debitor=${data.duid}&creditor=${data.cuid}&act_type=2&amount=${data.amount}&residual_amount=0&refundable_amount=${data.residual_amount}&end_date=${fmt(
        data.end_date,
      )}&uid=${data.uid}&lang=${lang}`;
    case 5:
      // Qisman qaytarish: qolgan qoldiq = joriy residual - to'langan summa (sum). Sana → fmt.
      return `https://pdf.zerox.uz/act.php?debitor=${data.duid}&creditor=${data.cuid}&act_type=1&amount=${data.amount}&refundable_amount=${sum}&residual_amount=${
        Number(data.residual_amount) - Number(sum)
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
