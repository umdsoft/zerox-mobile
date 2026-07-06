import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import Uzbekistan from '../../images/uzbekistaan.svg';
import Russia from '../../images/russia.svg';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../theme/rd';
import { storage, prefsStorage } from '../../store/api/token/getToken';
import BrandLockup from '../components/BrandLockup';

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
      }
      i18n.changeLanguage(l);
    }
  }, []);

  const options = [
    { code: 'uz', value: 2, label: 'O‘zbekcha', Flag: Uzbekistan },
    { code: 'kr', value: 1, label: 'Ўзбекча', Flag: Uzbekistan },
    { code: 'ru', value: 0, label: 'Русский', Flag: Russia },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Brend hero */}
        <View style={styles.hero}>
          <BrandLockup badgeSize={rs(80)} />
          <Text style={styles.title}>{t('723')}</Text>
          <Text style={styles.subtitle}>{t('879').slice(0, -1)}</Text>
        </View>

        {/* Til tanlash kartalari */}
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
                  {selected && <CheckIcon size={rs(14)} color={rd.color.onPrimary} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Davom etish */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            // `lang` ni ikkalasiga: prefsStorage (i18n modul-yuklanishda sinxron o'qiydi)
            // + storage (boshqa ekran o'quvchilari uchun moslik).
            prefsStorage.set('lang', i18n.language);
            storage.set('lang', i18n.language);
            navigation.navigate('LoginWithPhone');
          }}
          style={styles.continueBtn}
        >
          <Text style={styles.continueText}>{t('45')}</Text>
        </TouchableOpacity>
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

  hero: { alignItems: 'center', marginBottom: rs(32) },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(23),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(20),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    lineHeight: rs(20),
    paddingHorizontal: rs(16),
  },

  list: { gap: rs(12) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    height: rs(64),
  },
  cardSelected: {
    borderColor: rd.color.primary,
    backgroundColor: rd.color.primaryTint,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  flagBox: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  langLabelSelected: { fontFamily: rd.font.semibold, color: rd.color.text },
  radio: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    borderWidth: 2,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: rd.color.primary,
    backgroundColor: rd.color.primary,
  },

  continueBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(28),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  continueText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
