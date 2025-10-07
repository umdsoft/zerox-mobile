import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';

import {normalize, style} from '../../../theme/style';
import {useSelector} from 'react-redux';

import TextBold from '../../components/TextBold';
import {sortText} from '../../components/StatisticCard';
import {settingDate} from '../../../helper';

const QarzdanVozKechish = ({data}) => {
  const {user} = useSelector(state => state.HomeReducer);

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: normalize(10),
        alignSelf: 'center',
        paddingHorizontal: 10,
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
          }}>
          D А L O L А T N O M А
        </Text>
      </View>
      <View style={{marginTop: 10, marginBottom: 10}}>
        <Text style={styles.text}>
          ( <TextBold>{data?.number}</TextBold> -sonli qarz shartnomasi bo‘yicha
          qarzdan voz kechish to‘g‘risida) {'\n'}
          {'\n'}
          Men, <TextBold>{data.debitor_name}</TextBold> (pasport:{' '}
          <Text style={styles.mainText}>{data?.debitor_passport}.</Text>{' '}
          <TextBold>{settingDate(data?.debitor_issued_date)} </TextBold>yilda{' '}
          <TextBold>{data?.debitor_issued}</TextBold> tomonidan berilgan) (qarz
          beruvchi) tomonimdan ushbu dalolatnoma quyidagilar haqida tuzildi:
          {'\n'}
          {'\n'}Men va fuqaro{' '}
          <Text style={styles.mainText}>{data?.creditor_name}</Text> (pasport:{' '}
          <TextBold>{data.creditor_passport}</TextBold>{' '}
          <TextBold>{settingDate(data.creditor_issued_date)}</TextBold> yilda{' '}
          <TextBold>{data.creditor_issued}</TextBold> tomonidan berilgan) (qarz
          oluvchi) o‘rtamizda tuzilgan <TextBold>{data.number}</TextBold>
          -sonli qarz shartnomasi bo‘yicha barcha huquq va majburiyatlar o‘z
          tashabbusimga ko‘ra bir tomonlama bekor qilindi.
          {'\n'}
          {'\n'}
          Shunga ko‘ra fuqaro{' '}
          <Text style={styles.mainText}>{data?.creditor_name}</Text>{' '}
          <TextBold>{data?.number}</TextBold>-sonli qarz shartnomasi bo‘yicha
          o‘z majburiyatlarini bajarishdan ozod qilindi. {'\n'}
          {'\n'}Voz kechilgan qarz mablagʼining umumiy miqdori{' '}
          <TextBold>
            {sortText(data?.amount)} {data?.currency}
          </TextBold>
          .{'\n'}Mazkur dalolatnoma QR-kod orqali tasdiqlangan holda elektron
          tarzda tuzildi.{'\n'}
          Dalolatnoma ikki tomonning{' '}
          <Text style={styles.mainText}>"Zerox"</Text> dasturidagi shaxsiy
          kabinetida saqlanadi. {'\n'}QR-kod orqali tasdiqlangan Dalolatnomaning
          saqlanishini Jamiyat o‘z zimmasiga oladi.{'\n'}
          {'\n'}
          <Text style={{alignSelf: 'center'}}>
            <TextBold styles={{textAlign: 'center'}}>
              Qarz beruvchi (debitor):{' '}
              <Text style={styles.mainText}>
                {user.data.first_name +
                  ' ' +
                  user.data.last_name +
                  ' ' +
                  user.data.middle_name}{' '}
              </Text>{' '}
              {'\n'}
              {/* Maxsus elektron imzo:_____ {'\n'} */}
              Sana: {settingDate(new Date())} yil
            </TextBold>
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default QarzdanVozKechish;

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
