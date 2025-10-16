import {SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';

import {normalize, style} from '../../../theme/style';
import {useSelector} from 'react-redux';
import {settingDate} from '../../../helper';

const MuddatUzaytirish = ({data}) => {
  const {user} = useSelector(state => state.HomeReducer);

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
        <Text  allowFontScaling={false} 
          style={{
            fontFamily: style.fontFamilyBold,
            color: '#000',
            fontSize: style.fontSize.xs,
          }}>
          D А L O L А T N O M А
        </Text>
      </View>
      <View style={{marginTop: 10, marginBottom: 10, paddingHorizontal: 10}}>
        <Text style={styles.text} allowFontScaling={false}>
          ({' '}
          <Text
            style={(styles.text, {fontFamily: style.fontFamilyBold})}
            allowFontScaling={false}>
            {data?.number}
          </Text>{' '}
          - sonli qarz shartnomasining muddati uzaytirilganligi to‘g‘risida ){' '}
          {'\n'} {'\n'}
          {'   '}Men,{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {user.data.first_name +
              ' ' +
              user.data.last_name +
              ' ' +
              user.data.middle_name}{' '}
          </Text>
          (pasport: <Text style={styles.mainText} allowFontScaling={false}>{user?.data?.passport}</Text>.{' '}
          {user?.data?.created_At} yilda {user?.data?.issued_by} tomonidan
          berilgan) (qarz beruvchi) tomonidan ushbu dalolatnoma quyidagilar
          haqida tuzildi: {'\n'} {'\n'}
          {'   '}Men va fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> (pasport:
          AA2141008 12.07.2013 ХАЗАРАСПСКИЙ РОВД ХОРЕЗМСКОЙ ОБЛАСТИ tomonidan
          berilgan) (qarz oluvchi) o‘rtamizda tuzilgan 1/9/2022-1-sonli qarz
          shartnomasining muddati o‘z tashabbusimga ko‘ra gacha uzaytirildi.
          1/9/2022-1-sonli qarz shartnomasining yangi muddati sifatida yil
          belgilandi. Mazkur dalolatnoma QR-kod orqali tasdiqlangan holda
          elektron tarzda tuzildi.{'\n'}
          {'   '} Dalolatnoma qarz beruvchi va qarz oluvchining{' '}
          <Text style={styles.mainText} allowFontScaling={false}>"Zerox"</Text> dasturidagi shaxsiy
          kabinetida saqlanadi. QR-kod orqali tasdiqlangan Dalolatnomaning
          saqlanishini Jamiyat o‘z zimmasiga oladi.
          {'\n'}
          {'\n'}
          <Text style={{textAlign: 'center'}} allowFontScaling={false}>
            Qarz beruvchi:
            {'\n'}FISH :{' '}
            <Text style={styles.mainText} allowFontScaling={false}>
              {user.data.first_name +
                ' ' +
                user.data.last_name +
                ' ' +
                user.data.middle_name}{' '}
            </Text>{' '}
            {'\n'}
            {/* Maxsus elektron imzo: _______ {'\n'} */}
            Sana: {settingDate(new Date())} yil
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default MuddatUzaytirish;

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
