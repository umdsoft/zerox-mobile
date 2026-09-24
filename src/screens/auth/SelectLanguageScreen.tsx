import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import Uzbekistan from '../../images/uzbekistaan.svg';
import Russia from '../../images/russia.svg';
import { KarakalpakFlag, UkFlag } from '../../images/ExtraFlags';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../theme/rd';
import { storage, prefsStorage } from '../../store/api/token/getToken';
// Eski ilovadagi illyustratsiya — redizaynda tushib qolgandi, qaytarildi.
import PersonIllustration from '../../images/Person';
import {
  AuthBackdrop,
  AuthFloat,
  AuthHero,
  AuthPrimaryButton,
  AuthReveal,
} from './authKit';

const CheckIcon = ({ size = 14, color = rd.color.onPrimary }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

// ExtraFlags `size` propi bilan ishlaydi (Uzbekistan/Russia svg'lari esa 25px
// intrinsik o'lchamda). flagBox (rs(32)) ichida bir xil ko'rinishi uchun yangi
// bayroqlarni ham rs(25) o'lchamda o'raymiz — map'dagi `<Flag />` o'zgarmaydi.
// SS-DEV (2026-09-24): flagBox rs(28) ga kichraytirildi — bayroqlar ham mos.
const KarakalpakFlagIcon = () => <KarakalpakFlag size={rs(22)} />;
const UkFlagIcon = () => <UkFlag size={rs(22)} />;

const SelectLanguageScreen = () => {
  const [lang, setLang] = useState(2);
  const { i18n } = useTranslation();
  const navigation = useNavigation();
  const onChangeLang = (ll: string) => {
    switch (ll) {
      case 'ru':
        setLang(0);
        break;
      case 'kr':
        setLang(1);
        break;
      case 'uz':
        setLang(2);
        break;
      case 'kaa':
        setLang(3);
        break;
      case 'en':
        setLang(4);
        break;
    }

    i18n.changeLanguage(ll);
  };

  useEffect(() => {
    const l = prefsStorage.getString('lang');

    if (l) {
      switch (l) {
        case 'ru':
          setLang(0);
          break;
        case 'kr':
          setLang(1);
          break;
        case 'uz':
          setLang(2);
          break;
        case 'kaa':
          setLang(3);
          break;
        case 'en':
          setLang(4);
          break;
      }
      i18n.changeLanguage(l);
    }
  }, []);

  const options = [
    { code: 'uz', value: 2, label: 'O‘zbekcha', Flag: Uzbekistan },
    { code: 'kr', value: 1, label: 'Ўзбекча', Flag: Uzbekistan },
    { code: 'ru', value: 0, label: 'Русский', Flag: Russia },
    { code: 'kaa', value: 3, label: 'Qaraqalpaqsha', Flag: KarakalpakFlagIcon },
    { code: 'en', value: 4, label: 'English', Flag: UkFlagIcon },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* Fintech atmosfera — butun ekran ortidagi brend gradienti */}
      <AuthBackdrop />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Brend zonasi — "hujjat varag'i" (muhr yog'dusi ichida) */}
        <AuthReveal>
          <AuthHero style={styles.hero}>
            <AuthFloat>
              <PersonIllustration width={rs(150)} height={rs(161)} />
            </AuthFloat>
          </AuthHero>
        </AuthReveal>

        <AuthReveal delay={140}>
          <Text style={styles.title}>{t('723')}</Text>
          <Text style={styles.subtitle}>{t('879').slice(0, -1)}</Text>
        </AuthReveal>

        {/* Til tanlash kartalari */}
        <AuthReveal delay={230}>
        <View style={styles.list}>
          {options.map(option => {
            const selected = lang === option.value;
            const Flag = option.Flag;
            return (
              <TouchableOpacity
                key={option.code}
                activeOpacity={0.85}
                onPress={() => onChangeLang(option.code)}
                style={[styles.card, selected && styles.cardSelected]}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.flagBox}>
                    <Flag />
                  </View>
                  <Text
                    style={[
                      styles.langLabel,
                      selected && styles.langLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                <View
                  style={[styles.radio, selected && styles.radioSelected]}
                >
                  {selected && <CheckIcon size={rs(12)} color={rd.color.onPrimary} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Davom etish */}
        <AuthPrimaryButton
          label={t('45')}
          onPress={() => {
            // `lang` ni ikkalasiga: prefsStorage (i18n modul-yuklanishda sinxron o'qiydi)
            // + storage (boshqa ekran o'quvchilari uchun moslik).
            prefsStorage.set('lang', i18n.language);
            storage.set('lang', i18n.language);
            navigation.navigate('LoginWithPhone');
          }}
          style={styles.continueBtn}
        />
        </AuthReveal>
      </ScrollView>
    </View>
  );
};

export default SelectLanguageScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: rs(24),
    paddingVertical: rs(32),
  },

  // Illyustratsiya qo'shilgani uchun hero'ning pastki bo'shlig'i kamaytirildi.
  hero: { marginBottom: rs(20) },
  // Sarlavha va tagidagi matn KICHRAYTIRILDI (talab bo'yicha) — bu bir vaqtda
  // illyustratsiya uchun vertikal joy ham bo'shatadi.
  // SS-DEV (2026-09-24): "Yangi mobil xatolar" 2-band — sarlavha, tagidagi matn
  // va til kartalaridagi shriftlar yana kichraytirildi (hali ham juda katta edi).
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(14),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(11),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(6),
    // Matn va til kartalari orasida nafas. Busiz kartalar (elevation bilan)
    // matn ustiga chiqib ketardi — emulyatorda aynan shu ko'rindi.
    marginBottom: rs(20),
    lineHeight: rs(16),
    paddingHorizontal: rs(16),
  },

  list: { gap: rs(10) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    height: rs(54),
  },
  cardSelected: {
    borderColor: rd.color.primary,
    backgroundColor: rd.color.primaryTint,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  flagBox: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.text,
  },
  langLabelSelected: { fontFamily: rd.font.semibold, color: rd.color.text },
  radio: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    borderWidth: 2,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: rd.color.primary,
    backgroundColor: rd.color.primary,
  },

  // Tugmaning o'zi AuthPrimaryButton (gradient + rangli soya).
  continueBtn: { marginTop: rs(28) },
});
