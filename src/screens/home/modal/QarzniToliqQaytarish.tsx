import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';

import {normalize, style} from '../../../theme/style';

import TextBold from '../../components/TextBold';
import {sortText} from '../../components/StatisticCard';
import {settingDate} from '../../../helper';

const QarzniToliqQaytarish = ({data}) => {
  console.log(data);
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
            <TextBold>{data?.number}</TextBold> - sonli qarz shartnomasi
            bo‘yicha qarz mablag‘i qaytarilganligi to‘g‘risida {'\n'}
          </Text>
          {'\n'}Biz quyida imzo qo‘yuvchilar, fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_name}</Text> (pasport:{' '}
          <TextBold>
            {data?.debitor_passport}. {settingDate(data.debitor_issued_date)}
          </TextBold>{' '}
          yilda <TextBold>{data.debitor_issued}</TextBold> tomonidan berilgan)
          bir tomondan va fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> (pasport:{' '}
          <TextBold>
            {data?.creditor_passport}. {settingDate(data.creditor_issued_date)}
          </TextBold>{' '}
          <TextBold>{data.creditor_issued} </TextBold>tomonidan berilgan)
          ikkinchi tomondan, ushbu dalolatnoma quyidagilar haqida tuzildi:
          {'\n'}
          {'\n'} Men <TextBold>{data?.creditor_name}</TextBold> fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_name}</Text> dan{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data.created_at)}</Text>{' '}
          yildagi <TextBold>{data.number}</TextBold>-sonli qarz shartnomasiga
          asosan{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(data.amount)} {data.currency}
          </Text>{' '}
          miqdorida olingan qarz mablag’ining{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(data.residual_amount)} {data.currency}
          </Text>{' '}
          miqdoridagi qismini{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(new Date())}</Text> yilda
          qaytardim.{'\n'}
          {'\n'}
          Men <Text style={styles.mainText} allowFontScaling={false}>
            {data?.debitor_name}
          </Text> fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> dan{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data.created_at)}</Text>{' '}
          yildagi <TextBold>{data.number}</TextBold>-sonli qarz shartnomasiga
          asosan{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {' '}
            {sortText(data.amount)} {data.currency}{' '}
          </Text>{' '}
          miqdorida berilgan qarz mablag’ining{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(data.residual_amount)} {data.currency}
          </Text>{' '}
          miqdoridagi qismini{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(new Date())}</Text> yilda
          qabul qilib oldim.{'\n'}
          {'\n'} Mazkur dalolatnoma QR-kod orqali tasdiqlangan holda elektron
          tarzda tuzildi.{'\n'}Dalolatnoma ikki tomonning{' '}
          <Text style={styles.mainText} allowFontScaling={false}>"Zerox"</Text> dasturidagi shaxsiy
          kabinetida saqlanadi. {'\n'}QR-kod orqali tasdiqlangan Dalolatnomaning
          saqlanishini Jamiyat o‘z zimmasiga oladi.{'\n'}
          {'\n'}
          <TextBold styles={{textAlign: 'center'}}>
            Tomonlarning rekvizitlari{' '}
          </TextBold>
          {'\n'}
          <TextBold styles={{textAlign: 'center'}}>
            {'\n'}Qarz oluvchi: {'\n'}FISH : {data.creditor_name} {'\n'}
            {/* Maxsus elektron imzo: ______{'\n'} */}
            Sana: {settingDate(new Date())} yil {'\n'}
            {'\n'}Qarz beruvchi: {'\n'}FISH : {data.debitor_name} {'\n'}
            {/* Maxsus elektron imzo: ______ {'\n'} */}
            Sana: {settingDate(new Date())} yil
          </TextBold>
        </Text>
      </View>
    </View>
  );
};

export default QarzniToliqQaytarish;

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
  },
});
