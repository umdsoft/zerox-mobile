import {StyleSheet, View} from 'react-native';
import React from 'react';
import {style} from '../../theme/style';

import {ScrollView} from 'react-native-gesture-handler';
import ScreenLayout from '../components/ScreenLayout';
import MainText from '../components/MainText';
import {font, fontSize} from '../../theme/font';
const AboutUs = () => {
  return (
    <ScreenLayout title={'Biz haqimizda'} scroll={false}>
      <View>
          <View style={styles.aboutUsContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{borderRadius: 15}}
              nestedScrollEnabled>
              <View style={styles.aboutUs}>
                <View style={{alignSelf: 'center'}}>
                  <MainText size={fontSize[16]} ft={font.bold}>
                    Bizning mobil ilova
                  </MainText>
                </View>
                <MainText lineH={20} size={fontSize[12]}>
                  Biz tashrif buyurmasdan siz va sizning biznesingiz uchun bank
                  xizmatlarini to‘liq taqdim etamiz.
                </MainText>

                <MainText lineH={20} size={fontSize[12]}>
                  Barcha xizmatlarni saytdan, mobil ilovasidan, yoki shunchaki
                  sutkalik aloqa markaziga qo‘ng‘iroq qilib olish mumkin. Biz
                  aynan shunday konsepsiyani tanladik, chunki u bugungi kunda
                  o‘zini to‘liq oqlay oladi. Mamlakat aholisi yanada mobilroq
                  bo‘lib qoldi, raqamli texnologiyalardan foydalanishni va
                  ko‘pgina xizmatlarni masofadan va dunyoning istalgan
                  nuqtasidan sutka davomida olishni afzal ko‘radi. Shaharda
                  bizning odatiy bo‘limlarimiz yo‘q, biz mamlakat bo‘ylab
                  millionlab qurilmalarda erishimlimiz. Har bir mijozga nisbatan
                  individual yondashuvni saqlab va ma‘lumotlarga ishlov berishda
                  xavfsizlikni kafolatlab, har qanday so‘rovga maksimal operativ
                  tarzda ishlov berish uchun biz ulkan sa‘y-harakatlar qildik.
                  Barcha xizmatlarni saytdan, mobil ilovasidan, yoki shunchaki
                  sutkalik aloqa markaziga qo‘ng‘iroq qilib olish mumkin. Biz
                  aynan shunday konsepsiyani tanladik, chunki u bugungi kunda
                  o‘zini to‘liq oqlay oladi. Mamlakat aholisi yanada mobilroq
                  bo‘lib qoldi, raqamli texnologiyalardan foydalanishni va
                  ko‘pgina xizmatlarni masofadan va dunyoning istalgan
                  nuqtasidan sutka davomida olishni afzal ko‘radi. Shaharda
                  bizning odatiy bo‘limlarimiz yo‘q, biz mamlakat bo‘ylab
                  millionlab qurilmalarda erishimlimiz. Har bir mijozga nisbatan
                  individual yondashuvni saqlab va ma‘lumotlarga ishlov berishda
                  xavfsizlikni kafolatlab, har qanday so‘rovga maksimal operativ
                  tarzda ishlov berish uchun biz ulkan sa‘y-harakatlar qildik.
                  Barcha xizmatlarni saytdan, mobil ilovasidan, yoki shunchaki
                  sutkalik aloqa markaziga qo‘ng‘iroq qilib olish mumkin. Biz
                  aynan shunday konsepsiyani tanladik, chunki u bugungi kunda
                  o‘zini to‘liq oqlay oladi. Mamlakat aholisi yanada mobilroq
                  bo‘lib qoldi, raqamli texnologiyalardan foydalanishni va
                  ko‘pgina xizmatlarni masofadan va dunyoning istalgan
                  nuqtasidan sutka davomida olishni afzal ko‘radi. Shaharda
                  bizning odatiy bo‘limlarimiz yo‘q, biz mamlakat bo‘ylab
                  millionlab qurilmalarda erishimlimiz. Har bir mijozga nisbatan
                  individual yondashuvni saqlab va ma‘lumotlarga ishlov berishda
                  xavfsizlikni kafolatlab, har qanday so‘rovga maksimal operativ
                  tarzda ishlov berish uchun biz ulkan sa‘y-harakatlar qildik.
                  Barcha xizmatlarni saytdan, mobil ilovasidan, yoki shunchaki
                  sutkalik aloqa markaziga qo‘ng‘iroq qilib olish mumkin. Biz
                  aynan shunday konsepsiyani tanladik, chunki u bugungi kunda
                  o‘zini to‘liq oqlay oladi. Mamlakat aholisi yanada mobilroq
                  bo‘lib qoldi, raqamli texnologiyalardan foydalanishni va
                  ko‘pgina xizmatlarni masofadan va dunyoning istalgan
                  nuqtasidan sutka davomida olishni afzal ko‘radi. Shaharda
                  bizning odatiy bo‘limlarimiz yo‘q, biz mamlakat bo‘ylab
                  millionlab qurilmalarda erishimlimiz. Har bir mijozga nisbatan
                  individual yondashuvni saqlab va ma‘lumotlarga ishlov berishda
                  xavfsizlikni kafolatlab, har qanday so‘rovga maksimal operativ
                  tarzda ishlov berish uchun biz ulkan sa‘y-harakatlar qildik.
                </MainText>
              </View>
            </ScrollView>
          </View>
        </View>
    </ScreenLayout>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  paginationButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationNumber: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,

    height: style.height / 1.3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  aboutUsText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
    lineHeight: 25,
    marginTop: 5,
  },
  aboutUs: {
    marginHorizontal: 15,
    marginVertical: 20,
    flex: 1,
  },
  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    alignSelf: 'center',
  },
});
