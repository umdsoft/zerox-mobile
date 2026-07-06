import {Platform, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {normalize} from '../../theme/style';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
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

  const onSetCode = val => {
    if (password.length <= 3) {
      storage.set('key2', password + val);
      setPassword(password + val);
      const local_password = storage.getString('k2');
      if ((password + val).length === 4) {
        // if (step === 1) {
        //   if (local_password !== password + val) {
        //     setPassword('');
        //     Toast.show({
        //       type: 'error2',
        //       position: 'top',
        //       props: {title: 'Xatolik!', desc: 'PIN-kod noto’g‘ri kiritilgan'},
        //       visibilityTime: 3000,
        //       autoHide: true,
        //       topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        //     });
        //   }
        // }
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
            storage.delete('time');
            Toast.show({
              type: 'omad',
              position: 'top',
              props: {title: 'Muvaffaqiyatli', desc: t('PIN-kod tiklandi')},
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
    if (local_password === undefined) setStep(2);
    else setStep(2);
  }, []);
  console.log('step', step);

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
