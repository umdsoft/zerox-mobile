import {Platform, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {normalize} from '../../theme/style';
import {rd, rs} from '../../theme/rd';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {storage} from '../../store/api/token/getToken';
import RdHeader from '../home/redesign/RdHeader';
import {ShieldIcon, BackspaceIcon} from '../home/redesign/icons';
import {t} from 'i18next';

import BiometricModule from '../../../BiometricModule';

const ChangeLocalPassword = () => {
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const navigation = useNavigation();

  const onFingerScan = async () => {
    try {
      if (Platform.OS === 'android') {
        await BiometricModule.authenticate();
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: {title: 'Muvaffaqiyatli', desc: t('Shaxsingiz tasdiqlandi')},
          type: 'omad',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        autoHide: true,
        position: 'bottom',
        props: {title: 'Xatolik', desc: t('Shaxsingiz tasdiqlanmadi')},
        type: 'error2',
        visibilityTime: 3000,
      });
    }
  };

  const onSetCode = val => {
    if (password.length <= 3) {
      storage.set('key2', password + val);
      setPassword(password + val);
      const local_password = storage.getString('k2');
      if ((password + val).length === 4) {
        if (step === 1) {
          if (local_password !== password + val) {
            setPassword('');
            Toast.show({
              type: 'error2',
              position: 'top',
              props: {title: 'Xatolik!', desc: t('777')},
              visibilityTime: 3000,
              autoHide: true,
              topOffset: Platform.OS === 'android' ? 5 : normalize(50),
            });
          }
        }
        if (local_password === password + val && step === 1) {
          setPassword('');
          setStep(2);
        }

        if (step === 2) {
          setStep(3);
          setPassword('');
          storage.set('key1', password + val);
        }
        if (step === 3) {
          let a = storage.getString('key1');
          let b = storage.getString('key2');

          if (Number(a) === Number(b)) {
            storage.set('k2', password + val);
            Toast.show({
              type: 'omad',
              position: 'top',
              props: {title: 'Muvaffaqiyatli', desc: t('885')},
              visibilityTime: 3000,
              autoHide: true,
              topOffset: Platform.OS === 'android' ? 5 : normalize(50),
            });
            setTimeout(() => {
              navigation.navigate('Security');
            }, 1500);
          } else {
            setPassword('');
            Toast.show({
              type: 'error2',
              position: 'top',
              props: {
                title: 'Xatolik!',
                desc: t(
                  'Yangi PIN-kodni takrorlashda xatolikka yo‘l qo‘yilgan',
                ),
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
    const local_password = storage.getString('k2');
    if (local_password === undefined) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={t('774')} />
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <ShieldIcon size={rs(38)} color={rd.color.primary} />
        </View>
      </View>
      <View style={styles.textWrap}>{renderText(step)}</View>
      <View style={styles.dotsRow}>
        {Array.from({length: 4}, (_v, i) => {
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < password.length ? rd.color.primary : rd.color.border,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.keypad}>
        {Array.from({length: 12}, (_v, i) => {
          switch (i) {
            case 10:
              return (
                <View key={i} style={styles.keyCell}>
                  <Pressable
                    onPress={() => {
                      onSetCode(0);
                    }}
                    android_ripple={{
                      color: rd.color.border,
                      radius: rs(36),
                      borderless: true,
                    }}
                    style={styles.keyButton}>
                    <Text allowFontScaling={false} style={styles.keyDigit}>0</Text>
                  </Pressable>
                </View>
              );
            case 11:
              return (
                <View key={i} style={styles.keyCell}>
                  <Pressable
                    onPress={() => {
                      onBackSpace();
                    }}
                    android_ripple={{
                      color: rd.color.border,
                      radius: rs(36),
                      borderless: true,
                    }}
                    style={styles.keyButtonPlain}>
                    <BackspaceIcon size={rs(24)} color={rd.color.text} />
                  </Pressable>
                </View>
              );
            case 9:
              return <View key={i} style={styles.keyCell} />;
            default:
              return (
                <View key={i} style={styles.keyCell}>
                  <Pressable
                    onPress={() => {
                      onSetCode(i + 1);
                    }}
                    android_ripple={{
                      color: rd.color.border,
                      radius: rs(36),
                      borderless: true,
                    }}
                    style={styles.keyButton}>
                    <Text allowFontScaling={false} style={styles.keyDigit}>{i + 1}</Text>
                  </Pressable>
                </View>
              );
          }
        })}
      </View>
    </View>
  );
};

const renderText = step => {
  switch (step) {
    case 1:
      return <Text allowFontScaling={false} style={styles.text}>{t('882')}</Text>;
    case 2:
      return <Text allowFontScaling={false} style={styles.text}>{t('850')}</Text>;
    case 3:
      return <Text allowFontScaling={false} style={styles.text}>{t('851')}</Text>;
  }
};

export default ChangeLocalPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  iconWrap: {
    alignItems: 'center',
    marginTop: rs(24),
  },
  iconCircle: {
    width: rs(76),
    height: rs(76),
    borderRadius: rs(38),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    marginTop: rs(20),
    marginBottom: rs(28),
    paddingHorizontal: rs(24),
  },
  text: {
    fontSize: rs(17),
    color: rd.color.text,
    fontFamily: rd.font.semibold,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: rs(36),
  },
  dot: {
    width: rs(14),
    height: rs(14),
    borderRadius: rs(7),
    marginHorizontal: rs(8),
  },
  keypad: {
    width: rs(300),
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  keyCell: {
    width: rs(100),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(16),
  },
  keyButton: {
    width: rs(68),
    height: rs(68),
    borderRadius: rs(34),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
  },
  keyButtonPlain: {
    width: rs(68),
    height: rs(68),
    borderRadius: rs(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigit: {
    fontSize: rs(26),
    fontFamily: rd.font.medium,
    color: rd.color.text,
  },
});
