import {StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {rd, rs} from '../../theme/rd';

import {useNavigation} from '@react-navigation/native';
import ClickIcon from '../../images/Click.svg';
import RdHeader from '../home/redesign/RdHeader';
import {t} from 'i18next';
import PaymeIcon from '../../images/Payme';
import {ChevronRight} from '../home/redesign/icons';

// Brend ranglari (dizayn tizimidan tashqari — faqat shu to'lov sahifasida literal).
const PAYME = '#0AA5AD'; // Payme — turkuaz
const PAYME_TINT = '#E7F9FA';
const CLICK = '#0E8FD1'; // Click — ko'k
const CLICK_TINT = '#E9F4FC';

const PayScreen = () => {
  const navigation = useNavigation();
  const onPress = type => {
    navigation.navigate('Pay', {
      type: type,
      title: type === 0 ? 'CLICK' : type === 1 ? 'PAYME' : 'PAYNET',
    });
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={t('602')} />
      {/* So'rov bo'yicha: sahifa IKKI TENG YARIMGA bo'lingan — tepada Payme (logo +
          to'ldirish tugmasi), pastda Click (logo + to'ldirish tugmasi). Har yarim
          o'z brend rangida; logo oq "chip" ichida ajralib turadi.
          onPress qiymatlari O'ZGARMAYDI (0=Click, 1=Payme). */}
      <View style={styles.main}>
        {/* ── TEPA YARIM: PAYME ── */}
        <View
          style={[styles.brandCard, {backgroundColor: PAYME_TINT, borderColor: PAYME}]}>
          <View style={styles.logoChip}>
            <PaymeIcon width={rs(158)} height={rs(51)} />
          </View>
          <Text allowFontScaling={false} style={styles.brandNote}>
            {t('Payme ilovasi orqali tez va xavfsiz to‘ldiring')}
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress(1)}
            style={[styles.brandBtn, {backgroundColor: PAYME}]}>
            <Text allowFontScaling={false} style={styles.brandBtnText}>
              {t('To‘ldirish')}
            </Text>
            <ChevronRight size={rs(20)} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── PAST YARIM: CLICK ── */}
        <View
          style={[styles.brandCard, {backgroundColor: CLICK_TINT, borderColor: CLICK}]}>
          <View style={styles.logoChip}>
            <ClickIcon width={rs(150)} height={rs(42)} />
          </View>
          <Text allowFontScaling={false} style={styles.brandNote}>
            {t('Click ilovasi orqali tez va xavfsiz to‘ldiring')}
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress(0)}
            style={[styles.brandBtn, {backgroundColor: CLICK}]}>
            <Text allowFontScaling={false} style={styles.brandBtnText}>
              {t('To‘ldirish')}
            </Text>
            <ChevronRight size={rs(20)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PayScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(10),
    paddingBottom: rs(16),
    gap: rs(14),
  },
  // Har bir brend paneli sahifaning yarmini egallaydi (flex:1).
  brandCard: {
    flex: 1,
    borderRadius: rs(20),
    borderWidth: rs(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(20),
    gap: rs(18),
  },
  // Logo FONSIZ joylashadi (so'rov bo'yicha — orqasida qora/to'q fon YO'Q).
  // Payme o'z teal-pilli bilan, Click esa teal halqa + to'q navy wordmark (Click.svg'da
  // "click" so'zining rangi oqdan to'q navygа o'zgartirildi) light kartada aniq ko'rinadi.
  logoChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(10),
  },
  brandNote: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    textAlign: 'center',
    paddingHorizontal: rs(8),
  },
  brandBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    borderRadius: rs(14),
    paddingVertical: rs(14),
  },
  brandBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: '#fff',
  },
});
