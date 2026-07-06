import {StyleSheet, Text} from 'react-native';
import React from 'react';

import {rd, rs} from '../../../theme/rd';
import {useSelector} from 'react-redux';

import {sortText} from '../../components/StatisticCard';
import {settingDate} from '../../../helper';
import DalolatnomaLayout from '../../components/DalolatnomaLayout';

const QarzdanVozKechish = ({data}) => {
  const {user} = useSelector(state => state.HomeReducer);

  return (
    <DalolatnomaLayout>
        <Text style={styles.text} allowFontScaling={false}>
          ( <Text style={styles.mainText} allowFontScaling={false}>{data?.number}</Text> -sonli qarz shartnomasi bo‘yicha
          qarzdan voz kechish to‘g‘risida) {'\n'}
          {'\n'}
          Men, <Text style={styles.mainText} allowFontScaling={false}>{data.debitor_name}</Text> (pasport:{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_passport}.</Text>{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data?.debitor_issued_date)} </Text>yilda{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_issued}</Text> tomonidan berilgan) (qarz
          beruvchi) tomonimdan ushbu dalolatnoma quyidagilar haqida tuzildi:
          {'\n'}
          {'\n'}Men va fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> (pasport:{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data.creditor_passport}</Text>{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data.creditor_issued_date)}</Text> yilda{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data.creditor_issued}</Text> tomonidan berilgan) (qarz
          oluvchi) o‘rtamizda tuzilgan <Text style={styles.mainText} allowFontScaling={false}>{data.number}</Text>
          -sonli qarz shartnomasi bo‘yicha barcha huquq va majburiyatlar o‘z
          tashabbusimga ko‘ra bir tomonlama bekor qilindi.
          {'\n'}
          {'\n'}
          Shunga ko‘ra fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text>{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.number}</Text>-sonli qarz shartnomasi bo‘yicha
          o‘z majburiyatlarini bajarishdan ozod qilindi. {'\n'}
          {'\n'}Voz kechilgan qarz mablagʼining umumiy miqdori{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {sortText(data?.amount)} {data?.currency}
          </Text>
          .{'\n'}Mazkur dalolatnoma QR-kod orqali tasdiqlangan holda elektron
          tarzda tuzildi.{'\n'}
          Dalolatnoma ikki tomonning{' '}
          <Text style={styles.mainText} allowFontScaling={false}>"Zerox"</Text> dasturidagi shaxsiy
          kabinetida saqlanadi. {'\n'}QR-kod orqali tasdiqlangan Dalolatnomaning
          saqlanishini Jamiyat o‘z zimmasiga oladi.{'\n'}
          {'\n'}
          <Text style={{alignSelf: 'center'}} allowFontScaling={false}>
            <Text style={[styles.mainText, {textAlign: 'center'}]} allowFontScaling={false}>
              Qarz beruvchi (debitor):{' '}
              <Text style={styles.mainText} allowFontScaling={false}>
                {user.data.first_name +
                  ' ' +
                  user.data.last_name +
                  ' ' +
                  user.data.middle_name}{' '}
              </Text>{' '}
              {'\n'}
              {/* Maxsus elektron imzo:_____ {'\n'} */}
              Sana: {settingDate(new Date())} yil
            </Text>
          </Text>
        </Text>
    </DalolatnomaLayout>
  );
};

export default QarzdanVozKechish;

const styles = StyleSheet.create({
  text: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.text,
    lineHeight: rs(22),
  },
  mainText: {
    fontFamily: rd.font.bold,
    color: rd.color.text,
  },
});
