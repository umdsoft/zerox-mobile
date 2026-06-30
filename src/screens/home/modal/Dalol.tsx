import { StyleSheet, View } from 'react-native';
import React from 'react';
import { BackGroundIcon } from '../../../helper/homeIcon';
import { style } from '../../../theme/style';

import { useRoute } from '@react-navigation/native';

import OtherHeader from '../../components/OtherHeader';
import Pdf from 'react-native-pdf';
import { useTranslation } from 'react-i18next';
const Dalol = () => {
  const route = useRoute();
  const { type, data, date, sum } = route.params;
  const { t, i18n } = useTranslation();

  console.log(route.params, 'route.params');

  return (
    <View style={styles.container}>
      <View
        style={{
          position: 'absolute',
          height: style.height / 3,
          width: '100%',
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('Dalolatnoma')} />
      <View
        style={{
          marginTop: 20,
          backgroundColor: '#fff',
          flex: 1,
          marginBottom: 20,
          borderRadius: 12,
        }}
      >
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
          style={{ flex: 1, width: '100%', height: '100%' }}
        />
        {/* <ScrollView>
          <CheckingType
            type={type}
            data={data}
            date={date}
            sum={route?.params?.sum || 0}
          />
        </ScrollView> */}
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

// const CheckingType = ({type, data, date, sum}) => {
//   switch (type) {
//     case 1:
//       return <MuddatUzaytirish data={data} />;
//     case 2:
//       //https://pdf.zerox.uz/act.php?debitor=100008AA&creditor=100024AA&act_type=4&vos_summa=200000&uid=b8bbb9f822197aa234f4c4651994801ca30fd8b2fc72841656d9cb5b1d1c7e84&lang=uz
//       return <QarzdanVozKechish data={data} />;
//     case 3:
//       // 'https://pdf.zerox.uz/act.php?debitor=100008AA&creditor=100024AA&act_type=6&refundable_amount=0&residual_amount=200000&end_date=null&uid=b8bbb9f822197aa234f4c4651994801ca30fd8b2fc72841656d9cb5b1d1c7e84&lang=uz';
//       return <QarzMuddatUzaytirish data={data} date={date} />;
//     case 4:
//       //https://pdf.zerox.uz/act.php?debitor=100024AA&creditor=100008AA&act_type=2&amount=100000&residual_amount=0&refundable_amount=100000&end_date=undefined&uid=076a633645cf1d5ad08aa27670465c1c40218e634ef5c6a64ed358441617ce35&lang=uz
//       return <QarzniToliqQaytarish data={data} />;
//     case 5:
//       //https://pdf.zerox.uz/act.php?debitor=100024AA&creditor=100008AA&act_type=1&amount=100000&refundable_amount=0&residual_amount=100000&end_date=undefined&uid=076a633645cf1d5ad08aa27670465c1c40218e634ef5c6a64ed358441617ce35&lang=uz
//       return <QismanQaytarish data={data} sum={sum} />;
//   }
// };
export default Dalol;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  buttonInsideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  item: {
    flex: 1,
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },
  registerButton: {
    width: '85%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
  },
  info: {
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small - 1,
    textAlign: 'left',
  },
  header: {
    backgroundColor: '#fff',
    height: style.height / 15,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    width: '90%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    overflow: 'hidden',
  },
});
