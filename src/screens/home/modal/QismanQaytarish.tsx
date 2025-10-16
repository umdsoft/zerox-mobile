import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';

import {normalize, style} from '../../../theme/style';

import {sortText} from '../../components/StatisticCard';
import {settingDate} from '../../../helper';

const QismanQaytarish = ({hide, onHide, data, sum}) => {
  useEffect(() => {
    console.log('QismanQaytarish', data);
  }, []);
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: normalize(10),
        alignSelf: 'center',
        width: '100%',
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'center',
          marginTop: 10,
        }}>
        <Text
          style={{
            fontFamily: style.fontFamilyBold,
            color: '#000',
            fontSize: style.fontSize.xs,
          }}
          allowFontScaling={false}>
          D А L O L А T N O M А
        </Text>
      </View>
      <View style={{marginTop: 10, marginBottom: 10, paddingHorizontal: 10}}>
        <Text style={styles.text} allowFontScaling={false}>
          <Text style={{textAlign: 'center'}} allowFontScaling={false}>
            (<Text style={styles.mainText} allowFontScaling={false}>{data?.number}</Text> - sonli qarz
            shartnomasi bo‘yicha qarz mablag‘i qisman qaytarilganligi
            to‘g‘risida){'\n'}
          </Text>
          {'\n'}Biz quyida imzo qo‘yuvchilar, fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_name}</Text> (pasport:{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {' '}
            {data?.debitor_passport}. {settingDate(data.debitor_issued_date)}
          </Text>{' '}
          yilda <Text style={styles.mainText} allowFontScaling={false}>{data.debitor_issued}</Text>{' '}
          tomonidan berilgan)(qarz beruvchi) bir tomondan va fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> (pasport:{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {data.creditor_passport}. {settingDate(data.creditor_issued_date)}
          </Text>
          . <Text style={styles.mainText} allowFontScaling={false}>{data.creditor_issued}</Text>{' '}
          tomonidan berilgan) (qarz oluvchi) ikkinchi tomondan, ushbu
          dalolatnoma quyidagilar haqida tuzdilar:
          {'\n'}
          {'\n'}Men <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text>{' '}
          fuqaro <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_name}</Text> dan{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data.created_at)}</Text>{' '}
          yildagi <Text style={styles.mainText} allowFontScaling={false}>{data.number}</Text>-sonli qarz
          shartnomasiga asosan{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(data.amount)} {data.currency}
          </Text>{' '}
          miqdorida olingan qarz mablag'ining{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(sum)} {data?.currency}
          </Text>{' '}
          miqdoridagi qismini{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(new Date())}</Text> yilda
          qaytardim.{'\n'}
          {'\n'}Men <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_name}</Text>{' '}
          fuqaro <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> ga{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data.created_at)}</Text>{' '}
          yildagi <Text style={styles.mainText} allowFontScaling={false}>{data.number}</Text>-sonli qarz
          shartnomasiga asosan{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {/* {sortText(data.residual_amount)} {data.currency} */}
            {sortText(data.amount)} {data.currency}
          </Text>{' '}
          miqdorida berilgan qarz mablag‘ining{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(sum)} {data?.currency}{' '}
          </Text>
          miqdoridagi qismini{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(new Date())}</Text> yilda
          qabul qilib oldim.{'\n'}
          {'\n'}
          Qarzning qaytarilmagan qismi{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(data?.residual_amount - sum)} {data.currency}
          </Text>{' '}
          ni tashkil qiladi. {'\n'}Qarz mablag‘ining qolgan qismi, ya’ni{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(data?.residual_amount - sum)} {data.currency}
          </Text>{' '}
          ni qaytarish muddati{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data.end_date)}</Text> yil
          qilib belgilandi.{'\n'}
          {'\n'} Mazkur dalolatnoma QR-kod orqali tasdiqlangan holda elektron
          tarzda tuzildi.{'\n'}Dalolatnoma ikki tomonning{' '}
          <Text style={styles.mainText} allowFontScaling={false}>"Zerox"</Text> dasturidagi shaxsiy
          kabinetida saqlanadi. {'\n'}QR-kod orqali tasdiqlangan Dalolatnomaning
          saqlanishini Jamiyat o‘z zimmasiga oladi.{'\n'}
          {'\n'}
          <Text style={[styles.mainText, {textAlign: 'center'}]} allowFontScaling={false}>
            Tomonlarning rekvizitlari{' '}
          </Text>
          {'\n'}
          <Text style={[styles.mainText, {textAlign: 'center'}]} allowFontScaling={false}>
            {'\n'}Qarz oluvchi: {'\n'}FISH : {data.creditor_name} {'\n'}
            Sana: {settingDate(new Date())} yil {'\n'}
            {'\n'}Qarz beruvchi: {'\n'}FISH : {data.debitor_name} {'\n'}
            Sana: {settingDate(new Date())} yil
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default QismanQaytarish;

const styles = StyleSheet.create({
  enterButton: {
    backgroundColor: style.blue,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: 100,
  },
  text: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: 'black',
    lineHeight: 17,
  },
  mainText: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xx,
  },
});
