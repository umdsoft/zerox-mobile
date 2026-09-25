import {Platform, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {normalize} from '../../theme/style';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
// SS-SEC (2026-09-25): PIN hash (pin.ts); terilayotgan raqamlar MMKV'ga yozilmaydi.
import {setPin, verifyPin} from '../../store/api/token/pin';
import {storage} from '../../store/api/token/getToken';
import {t} from 'i18next';

import {heightPercentageToDP} from 'react-native-responsive-screen';
import {scale} from '../../helper/scale';
import {rd, rs} from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';
import {BackspaceIcon, LockIcon} from '../home/redesign/icons';

const UpdateLocalPassCode = () => {
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(2);
  const navigation = useNavigation();
  // Yangi PIN (2-qadam) — faqat xotirada (ilgari MMKV'ga `key1/key2` ochiq yozilardi).
  const newPinRef = useRef('');

  const onSetCode = val => {
    if (password.length <= 3) {
      setPassword(password + val);
      if ((password + val).length === 4) {
        // if (step === 1) {
        //   if (local_password !== password + val) {
        //     setPassword('');
        //     Toast.show({
        //       type: 'error2',
        //       position: 'top',
        //       props: {desc: 'PIN-kod noto’g‘ri kiritilgan'},
        //       visibilityTime: 3000,
        //       autoHide: true,
        //       topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        //     });
        //   }
        // }
        if (step === 1 && verifyPin(password + val)) {
          setPassword('');
          setStep(2);
        }

        if (step === 2) {
          setStep(3);
          setPassword('');
          newPinRef.current = password + val;
        }
        if (step === 3) {
          if (newPinRef.current === password + val) {
            setPin(password + val);
            newPinRef.current = '';
            storage.delete('time');
            Toast.show({
              type: 'omad',
              position: 'top',
              // So'rov bo'yicha: "Muvaffaqiyatli" sarlavhasi olib tashlandi —
              // matnning o'zi (jirniy) qoladi.
              props: {desc: t('PIN-kod tiklandi.')},
              visibilityTime: 3000,
              autoHide: true,
              topOffset: Platform.OS === 'android' ? 5 : normalize(50),
            });
            setTimeout(() => {
              navigation.reset({
                routes: [{name: 'BottomTabNavigator'}],
                index: 0,
              });
            }, 1500);
          } else {
            setPassword('');
            Toast.show({
              type: 'error2',
              position: 'top',
              // So'rov bo'yicha: "Xatolik!" sarlavhasi olib tashlandi — matn (jirniy) qoladi.
              props: {
                desc: t('PIN-kodni takrorlashda xatolikka yo‘l qo‘yilgan.'),
              },
              visibilityTime: 3000,
              autoHide: true,
              topOffset: Platform.OS === 'android' ? 5 : normalize(50),
            });
          }
        }
      }
    }
  };
  const onBackSpace = () => {
    setPassword(password.slice(0, -1));
  };
  useEffect(() => {
    // Tiklash oqimi: joriy PIN so'ralmaydi (SMS/parol orqali tasdiqlangan) — 2-qadam.
    setStep(2);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('PIN-kodni tiklash')} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroCircle}>
          <LockIcon size={rs(34)} color={rd.color.primary} />
        </View>
      </View>

      <View style={{flex: 1}}>
        <View style={styles.setCodeTextContainer}>{renderText(step)}</View>

        <View style={styles.codeContainer}>
          <View style={styles.fourItem}>
            {Array.from({length: 4}, (_v, i) => {
              return (
                <View
                  key={i}
                  style={[
                    styles.codeItem,
                    {
                      backgroundColor:
                        i < password.length
                          ? rd.color.primary
                          : rd.color.border,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View
            style={{
              flex: 1,
              alignSelf: 'center',
              width: heightPercentageToDP(33),
              // Raqam padini BIROZ PASTROQQA tushiramiz (so'rov bo'yicha) — barmoq
              // raqamlarga qulay yetadi. Ekran balandligiga moslashuvchan (%).
              paddingTop: heightPercentageToDP(7),
            }}>
            <View style={styles.codeNumberContainer}>
              {Array.from({length: 12}, (_v, i) => {
                if (i === 10) {
                  return (
                    <View key={i} style={styles.codeNumberContainer}>
                      <Pressable
                        onPress={() => {
                          onSetCode(0);
                        }}
                        android_ripple={{
                          color: rd.color.primaryTint,
                          radius: 50,
                          borderless: true,
                        }}
                        style={styles.codeButton}>
                        <Text style={styles.textCode} allowFontScaling={false}>
                          0
                        </Text>
                      </Pressable>
                    </View>
                  );
                }
                if (i === 11) {
                  return (
                    <View key={i} style={styles.codeNumberContainer}>
                      <Pressable
                        onPress={() => {
                          onBackSpace();
                        }}
                        android_ripple={{
                          color: rd.color.primaryTint,
                          radius: 50,
                          borderless: true,
                        }}
                        style={styles.codeButton}>
                        <BackspaceIcon
                          size={rs(24)}
                          color={rd.color.textSecondary}
                        />
                      </Pressable>
                    </View>
                  );
                }
                if (i === 9) {
                  return (
                    <View key={i} style={styles.codeNumberContainer}>
                      <View
                        style={[
                          styles.codeButton,
                          {backgroundColor: 'transparent'},
                        ]}
                      />
                    </View>
                  );
                }

                return (
                  <View key={i} style={styles.codeNumberContainer}>
                    <Pressable
                      onPress={() => {
                        onSetCode(i + 1);
                      }}
                      android_ripple={{
                        color: rd.color.primaryTint,
                        radius: 50,
                        borderless: true,
                      }}
                      style={styles.codeButton}>
                      <Text style={styles.textCode} allowFontScaling={false}>
                        {i + 1}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const renderText = step => {
  switch (step) {
    case 2:
      return (
        <Text style={styles.text} allowFontScaling={false}>
          {t('850')}
        </Text>
      );
    case 3:
      return (
        <Text style={styles.text} allowFontScaling={false}>
          {t('851')}
        </Text>
      );
  }
};

export default UpdateLocalPassCode;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(24),
    marginBottom: rs(8),
  },
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeNumberContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeButton: {
    width: heightPercentageToDP(7.5),
    height: heightPercentageToDP(7.5),
    borderRadius: rd.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
    margin: scale(10),
    overflow: 'hidden',
  },
  fourItem: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: rs(10),
  },
  codeItem: {
    width: rs(15),
    height: rs(15),
    borderRadius: rd.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    margin: rs(6),
  },
  codeContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  setCodeTextContainer: {
    alignSelf: 'center',
    marginTop: rs(16),
    marginBottom: rs(16),
    alignItems: 'center',
  },
  textCode: {
    fontSize: rs(22),
    fontFamily: rd.font.medium,
    color: rd.color.text,
  },
  text: {
    fontSize: rs(16),
    color: rd.color.text,
    fontFamily: rd.font.bold,
  },
});
