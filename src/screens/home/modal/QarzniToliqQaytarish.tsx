import {StyleSheet, Text} from 'react-native';
import React from 'react';

import {rd, rs} from '../../../theme/rd';

import {sortText} from '../../components/StatisticCard';
import {settingDate} from '../../../helper';
import DalolatnomaLayout from '../../components/DalolatnomaLayout';

const QarzniToliqQaytarish = ({data}) => {
  console.log(data);
  return (
    <DalolatnomaLayout>
        <Text style={styles.text} allowFontScaling={false}>
          <Text style={{textAlign: 'center'}} allowFontScaling={false}>
            <Text style={styles.mainText} allowFontScaling={false}>{data?.number}</Text> - sonli qarz shartnomasi
            bo‘yicha qarz mablag‘i qaytarilganligi to‘g‘risida {'\n'}
          </Text>
          {'\n'}Biz quyida imzo qo‘yuvchilar, fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_name}</Text> (pasport:{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {data?.debitor_passport}. {settingDate(data.debitor_issued_date)}
          </Text>{' '}
          yilda <Text style={styles.mainText} allowFontScaling={false}>{data.debitor_issued}</Text> tomonidan berilgan)
          bir tomondan va fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> (pasport:{' '}
          <Text style={styles.mainText} allowFontScaling={false}>
            {data?.creditor_passport}. {settingDate(data.creditor_issued_date)}
          </Text>{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data.creditor_issued} </Text>tomonidan berilgan)
          ikkinchi tomondan, ushbu dalolatnoma quyidagilar haqida tuzildi:
          {'\n'}
          {'\n'} Men <Text style={styles.mainText} allowFontScaling={false}>{data?.creditor_name}</Text> fuqaro{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{data?.debitor_name}</Text> dan{' '}
          <Text style={styles.mainText} allowFontScaling={false}>{settingDate(data.created_at)}</Text>{' '}
          yildagi <Text style={styles.mainText} allowFontScaling={false}>{data.number}</Text>-sonli qarz shartnomasiga
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
          yildagi <Text style={styles.mainText} allowFontScaling={false}>{data.number}</Text>-sonli qarz shartnomasiga
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
          <Text style={[styles.mainText, {textAlign: 'center'}]} allowFontScaling={false}>
            Tomonlarning rekvizitlari{' '}
          </Text>
          {'\n'}
          <Text style={[styles.mainText, {textAlign: 'center'}]} allowFontScaling={false}>
            {'\n'}Qarz oluvchi: {'\n'}FISH : {data.creditor_name} {'\n'}
            {/* Maxsus elektron imzo: ______{'\n'} */}
            Sana: {settingDate(new Date())} yil {'\n'}
            {'\n'}Qarz beruvchi: {'\n'}FISH : {data.debitor_name} {'\n'}
            {/* Maxsus elektron imzo: ______ {'\n'} */}
            Sana: {settingDate(new Date())} yil
          </Text>
        </Text>
    </DalolatnomaLayout>
  );
};

export default QarzniToliqQaytarish;

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
