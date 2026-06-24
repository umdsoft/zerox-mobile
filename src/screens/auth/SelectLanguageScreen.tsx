import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Person from '../../images/Person';
import { style } from '../../theme/style';
import Uzbekistan from '../../images/uzbekistaan.svg';
import Russia from '../../images/russia.svg';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import MainText from '../components/MainText';
import { colors } from '../../theme/colors';
import { font } from '../../theme/font';
import RadioIcon from '../../images/auth/Radio';
import RadioFillIcon from '../../images/auth/RadioFill';
import { storage, prefsStorage } from '../../store/api/token/getToken';

import { heightPercentageToDP } from 'react-native-responsive-screen';

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

  return (
    <View style={[styles.container]}>
      <View style={styles.logoContainer}>
        <Person
          width={heightPercentageToDP(22)}
          height={heightPercentageToDP(38)}
        />
      </View>
      <View style={styles.languageContainer}>
        <MainText
          color={colors.black}
          ft={font.bold}
          size={style.fontSize.small + 2}
          style={styles.selectLanguageText}
        >
          {t('723')}
        </MainText>
        <MainText
          color={colors.black}
          ft={font.medium}
          mTop={8}
          textAlign={'center'}
          size={style.fontSize.small + 0.5}
          style={styles.selectLanguageText}
        >
          {t('879').slice(0, -1)}
        </MainText>
        <View style={styles.languageButtonContainer}>
          <TouchableOpacity
            onPress={() => {
              onChangeLang('uz');
            }}
            activeOpacity={0.8}
            style={styles.languageButton}
          >
            <View style={styles.Flag}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Uzbekistan />
                <MainText
                  size={style.fontSize.small}
                  color={colors.black}
                  pdLeft={8}
                >
                  {t('O‘zbekcha')}
                </MainText>
              </View>
              {lang === 2 ? (
                <RadioIcon width={20} height={20} color={colors.blue} />
              ) : (
                <RadioFillIcon width={20} height={20} color={colors.blue} />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              onChangeLang('kr');
            }}
            activeOpacity={0.8}
            style={styles.languageButton}
          >
            <View style={styles.Flag}>
              <View style={{ flexDirection: 'row' }}>
                <Uzbekistan />
                <MainText
                  pdLeft={8}
                  size={style.fontSize.small}
                  color={colors.black}
                >
                  Ўзбекча
                </MainText>
              </View>
              {lang === 1 ? (
                <RadioIcon width={20} height={20} color={colors.blue} />
              ) : (
                <RadioFillIcon width={20} height={20} color={colors.blue} />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              onChangeLang('ru');
            }}
            activeOpacity={0.8}
            style={styles.languageButton}
          >
            <View style={styles.Flag}>
              <View style={{ flexDirection: 'row' }}>
                <Russia />
                <MainText
                  pdLeft={8}
                  size={style.fontSize.small}
                  color={colors.black}
                >
                  Русский
                </MainText>
              </View>
              {lang === 0 ? (
                <RadioIcon width={20} height={20} color={colors.blue} />
              ) : (
                <RadioFillIcon width={20} height={20} color={colors.blue} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // `lang` ni ikkalasiga: prefsStorage (i18n modul-yuklanishda sinxron o'qiydi)
              // + storage (boshqa ekran o'quvchilari uchun moslik).
              prefsStorage.set('lang', i18n.language);
              storage.set('lang', i18n.language);
              navigation.navigate('LoginWithPhone');
            }}
            activeOpacity={0.8}
            style={[
              styles.languageButton,
              {
                marginTop: heightPercentageToDP(2.6),
                backgroundColor: style.blue,
                padding: heightPercentageToDP(2.2),
              },
            ]}
          >
            <View
              style={[
                styles.Flag,
                { alignItems: 'center', justifyContent: 'center' },
              ]}
            >
              <MainText
                size={style.fontSize.small}
                color={colors.white}
                pdLeft={8}
              >
                {t('45')}
              </MainText>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SelectLanguageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  btn: {
    height: heightPercentageToDP(3),
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'gray',
    borderRadius: 12,
  },
  languageText: {
    fontSize: style.fontSize.small + 1,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
    marginLeft: 3,
  },
  Flag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
  },
  languageButtonContainer: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',

    marginHorizontal: 20,
    width: '90%',
  },
  languageButton: {
    // alignItems: 'center',
    // justifyContent: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    padding: heightPercentageToDP(1.6),
    width: '80%',
    marginTop: heightPercentageToDP(1.4),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageContainer: {
    // flex: 1,
    alignItems: 'center',
    // justifyContent: 'center',
  },
  BackButton: {
    position: 'absolute',
    marginLeft: 15,
    marginTop: 15,
  },
  selectLanguageText: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyBold,
    color: style.textColor,
    maxWidth: '80%',
  },
});
