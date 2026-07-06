import {StyleSheet, Text} from 'react-native';
import React from 'react';

import {rd, rs} from '../../../theme/rd';
import {useSelector} from 'react-redux';

import {settingDate} from '../../../helper';
import DalolatnomaLayout from '../../components/DalolatnomaLayout';

const QarzMuddatUzaytirish = ({data, date}) => {
  const {user} = useSelector(state => state.HomeReducer);

  return (
    <DalolatnomaLayout>
        <Text style={styles.text} allowFontScaling={false}>
          ( <Text style={styles.mainText} allowFontScaling={false}>{data?.number} </Text>- sonli qarz shartnomasining
          muddati uzaytirilganligi to‘g‘risida ) {'\n'} {'\n'}
          {'   '}Men, <Text style={styles.mainText} allowFontScaling={false}>{data.debitor_name}</Text> (pasport:{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_passport}</Text>.{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data?.debitor_issued_date)}</Text> yilda{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_issued}</Text> tomonidan berilgan) (qarz
          beruvchi) tomonidan ushbu dalolatnoma quyidagilar haqida tuzildi:{' '}
          {'\n'} {'\n'}
          {'   '}Men va fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> (pasport:{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {data.creditor_passport} {settingDate(data.creditor_issued_date)}
          </Text>{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data.creditor_issued}</Text> tomonidan berilgan) (qarz
          oluvchi) o‘rtamizda tuzilgan <Text style={styles.mainText} allowFontScaling={false}>{data.number}</Text>
          -sonli qarz shartnomasining muddati o‘z tashabbusimga ko‘ra{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{date == null ? '' : settingDate(date)}</Text> gacha
          uzaytirildi. <Text style={styles.mainText} allowFontScaling={false}>{data.number}</Text>-sonli qarz
          shartnomasining yangi muddati sifatida{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{date == null ? '' : settingDate(date)}</Text> yil
          belgilandi. Mazkur dalolatnoma QR-kod orqali tasdiqlangan holda
          elektron tarzda tuzildi. {'\n'}
          {'   '} Dalolatnoma qarz beruvchi va qarz oluvchining{' '}
          <Text style={styles.mainText} allowFontScaling={false}>"Zerox"</Text> dasturidagi shaxsiy
          kabinetida saqlanadi. QR-kod orqali tasdiqlangan Dalolatnomaning
          saqlanishini Jamiyat o‘z zimmasiga oladi.{'\n'}
          {'\n'}
          <Text style={[styles.mainText, styles.center]} allowFontScaling={false}>
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
    </DalolatnomaLayout>
  );
};

export default QarzMuddatUzaytirish;

const styles = StyleSheet.create({
  text: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.text,
    lineHeight: rs(20),
  },
  mainText: {
    fontFamily: rd.font.bold,
    color: rd.color.text,
  },
  center: {
    textAlign: 'center',
  },
});
