import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';

import {normalize, style} from '../../../theme/style';
import {useSelector} from 'react-redux';

import TextBold from '../../components/TextBold';
import {settingDate} from '../../../helper';
import {cyrillicToLatin} from 'lotin-kirill';
const QarzMuddatUzaytirish = ({data, date}) => {
  const {user} = useSelector(state => state.HomeReducer);
  console.log(data, 'daadadad');
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: normalize(10),
        alignSelf: 'center',
        width: '100%',
        height: style.height,
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
      <View style={{marginTop: 10, marginBottom: 10, paddingHorizontal: 10}}>
        <Text style={styles.text}>
          ( <TextBold>{data?.number} </TextBold>- sonli qarz shartnomasining
          muddati uzaytirilganligi to‘g‘risida ) {'\n'} {'\n'}
          {'   '}Men, <TextBold>{data.debitor_name}</TextBold> (pasport:{' '}
          <Text style={styles.mainText}>{data?.debitor_passport}</Text>.{' '}
          <TextBold>{settingDate(data?.debitor_issued_date)}</TextBold> yilda{' '}
          <TextBold>{data?.debitor_issued}</TextBold> tomonidan berilgan) (qarz
          beruvchi) tomonidan ushbu dalolatnoma quyidagilar haqida tuzildi:{' '}
          {'\n'} {'\n'}
          {'   '}Men va fuqaro{' '}
          <Text style={styles.mainText}>{data?.creditor_name}</Text> (pasport:{' '}
          <TextBold>
            {data.creditor_passport} {settingDate(data.creditor_issued_date)}
          </TextBold>{' '}
          <TextBold>{data.creditor_issued}</TextBold> tomonidan berilgan) (qarz
          oluvchi) o‘rtamizda tuzilgan <TextBold>{data.number}</TextBold>
          -sonli qarz shartnomasining muddati o‘z tashabbusimga ko‘ra{' '}
          <TextBold>{date == null ? '' : settingDate(date)}</TextBold> gacha
          uzaytirildi. <TextBold>{data.number}</TextBold>-sonli qarz
          shartnomasining yangi muddati sifatida{' '}
          <TextBold>{date == null ? '' : settingDate(date)}</TextBold> yil
          belgilandi. Mazkur dalolatnoma QR-kod orqali tasdiqlangan holda
          elektron tarzda tuzildi. {'\n'}
          {'   '} Dalolatnoma qarz beruvchi va qarz oluvchining{' '}
          <Text style={styles.mainText}>"Zerox"</Text> dasturidagi shaxsiy
          kabinetida saqlanadi. QR-kod orqali tasdiqlangan Dalolatnomaning
          saqlanishini Jamiyat o‘z zimmasiga oladi.{'\n'}
          {'\n'}
          <TextBold styles={{textAlign: 'center'}}>
            Qarz beruvchi:
            {'\n'}FISH :{' '}
            <Text style={styles.mainText}>
              {user.data.first_name +
                ' ' +
                user.data.last_name +
                ' ' +
                user.data.middle_name}{' '}
            </Text>{' '}
            {'\n'}
            {/* Maxsus elektron imzo: _______ {'\n'} */}
            Sana: {settingDate(new Date())} yil
          </TextBold>
        </Text>
      </View>
    </View>
  );
};

export default QarzMuddatUzaytirish;

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
