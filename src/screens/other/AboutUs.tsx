import {StatusBar, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {getVersion} from 'react-native-device-info';
import ScreenLayout from '../components/ScreenLayout';
import {rd, rs} from '../../theme/rd';
import Logo from '../../images/logo.svg';
import {HelpIcon, ShieldIcon} from '../home/redesign/icons';

const AboutUs = () => {
  return (
    <ScreenLayout title={'Biz haqimizda'}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Logo width={rs(52)} height={rs(52)} />
        </View>
        <Text style={styles.appName}>ZeroX</Text>
        <Text style={styles.version}>Versiya {getVersion()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Bizning mobil ilova</Text>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <ShieldIcon size={rs(20)} color={rd.color.primary} />
        </View>
        <Text style={styles.cardText}>
          Biz tashrif buyurmasdan siz va sizning biznesingiz uchun bank
          xizmatlarini to‘liq taqdim etamiz.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <HelpIcon size={rs(20)} color={rd.color.primary} />
        </View>
        <Text style={styles.cardText}>
          Barcha xizmatlarni saytdan, mobil ilovasidan, yoki shunchaki sutkalik
          aloqa markaziga qo‘ng‘iroq qilib olish mumkin. Biz aynan shunday
          konsepsiyani tanladik, chunki u bugungi kunda o‘zini to‘liq oqlay
          oladi. Mamlakat aholisi yanada mobilroq bo‘lib qoldi, raqamli
          texnologiyalardan foydalanishni va ko‘pgina xizmatlarni masofadan va
          dunyoning istalgan nuqtasidan sutka davomida olishni afzal ko‘radi.
          Shaharda bizning odatiy bo‘limlarimiz yo‘q, biz mamlakat bo‘ylab
          millionlab qurilmalarda erishimlimiz. Har bir mijozga nisbatan
          individual yondashuvni saqlab va ma‘lumotlarga ishlov berishda
          xavfsizlikni kafolatlab, har qanday so‘rovga maksimal operativ tarzda
          ishlov berish uchun biz ulkan sa‘y-harakatlar qildik.
        </Text>
      </View>
    </ScreenLayout>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: rs(12),
    marginBottom: rs(20),
  },
  logoWrap: {
    width: rs(88),
    height: rs(88),
    borderRadius: rd.radius.huge,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(14),
  },
  appName: {
    fontFamily: rd.font.bold,
    fontSize: rs(20),
    color: rd.color.text,
  },
  version: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    marginTop: rs(4),
  },
  sectionTitle: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    marginBottom: rs(10),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  iconCircle: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    lineHeight: rs(21),
    color: rd.color.textSecondary,
  },
});
