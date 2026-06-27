import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { normalize, style } from '../../theme/style';

import SetCode from '../../images/SetCode';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CaptureProtection } from 'react-native-capture-protection';

import Toast from 'react-native-toast-message';
import ArrowLeft from '../../images/ArrowLeft';
import { storage } from '../../store/api/token/getToken';
import MainText from '../components/MainText';
import { colors } from '../../theme/colors';
import { font, fontSize } from '../../theme/font';
import { t } from 'i18next';
import BiometricModule from '../../../BiometricModule';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import MarkIcon from '../../images/mark';
import { scale } from '../../helper/scale';
import { heightPercentageToDP } from 'react-native-responsive-screen';

const rnBiometrics = new ReactNativeBiometrics();

const SetLocalPassword = () => {
  const [supportScan, setSupportScan] = useState(false);
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [isLocal] = useState(() => {
    const pass = storage.getString('k2');

    if (pass === undefined) {
      return true;
    } else {
      return false;
    }
  });
  const [count, setCount] = useState(3);

  const navigation = useNavigation();

  // V-012: PIN ekranida screenshot/record himoyasi (faqat shu ekranda — chiqishda
  // qaytariladi, shunda QrCode ViewShot va boshqa ekranlar buzilmaydi).
  useFocusEffect(
    useCallback(() => {
      CaptureProtection.prevent().catch(() => {});
      return () => {
        CaptureProtection.allow().catch(() => {});
      };
    }, []),
  );

  const onFingerScan = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        // result are success, failed, error
        const result = await BiometricModule.authenticate();

        if (result === 'success') {
          storage.set('appLocked', false);
          if (storage.getString('pendingNavigation') !== undefined) {
            navigation.navigate('Notification');
            storage.delete('pendingNavigation');
            return;
          }
          setTimeout(() => {
            navigation.reset({
              routes: [{ name: 'BottomTabNavigator' }],
              index: 0,
            });
          }, 500);
        }
      } else {
        if (Platform.OS === 'ios') {
          const { biometryType } = await rnBiometrics.isSensorAvailable();

          if (biometryType === BiometryTypes.FaceID) {
            const result = await rnBiometrics.simplePrompt({
              promptMessage: 'Confirm fingerprint',
            });

            if (result.success) {
              storage.set('appLocked', false);

              if (storage.getString('pendingNavigation') !== undefined) {
                navigation.navigate('Notification');
                storage.delete('pendingNavigation');
                return;
              }

              setTimeout(() => {
                navigation.reset({
                  routes: [{ name: 'BottomTabNavigator' }],
                  index: 0,
                });
              }, 500);
            } else {
              console.log('biometric failed');
            }
          }
        }
      }
    } catch (error) {
      console.log('Error', error);
    }
  }, [navigation]);

  // Biometrik OPT-IN: PIN o'rnatilgach (ro'yxatdan o'tish) foydalanuvchidan Touch/Face
  // ID ni yoqishni SO'RAYMIZ (avtomatik yoqmaymiz — oldin oferta tasdiqlashda kutilmagan
  // biometrik so'rardi). "Ha" -> touch=true; "Yo'q"/mavjud emas -> touch=false.
  const askForBiometric = useCallback(async (onDone: () => void) => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();
      if (!available) {
        storage.set('touch', false);
        onDone();
        return;
      }
      Alert.alert(
        t('Biometrik kirish'),
        t('Keyingi kirishlarda Touch ID / Face ID dan foydalanasizmi?'),
        [
          {
            text: t("Yo'q"),
            style: 'cancel',
            onPress: () => {
              storage.set('touch', false);
              onDone();
            },
          },
          {
            text: t('Ha'),
            onPress: () => {
              storage.set('touch', true);
              onDone();
            },
          },
        ],
        { cancelable: false },
      );
    } catch {
      storage.set('touch', false);
      onDone();
    }
  }, []);

  const onSetCode = val => {
    if (isLocal) {
      if (step === 1) {
        setPassword(password + val);
        if ((password + val).length === 4) {
          setStep(2);
          storage.set('k1', password + val);
          setPassword('');
          return;
        }
      }

      if (step === 2) {
        setPassword(password + val);

        if ((password + val).length === 4) {
          const k1 = storage.getString('k1');
          if (password + val === k1) {
            const token = storage.getString('token');
            storage.set('k2', password + val);
            storage.delete('isLoginScreen');
            storage.set('appLocked', false);
            const goNext = () => {
              if (storage.getString('pendingNavigation') !== undefined) {
                navigation.navigate('Notification');
                storage.delete('pendingNavigation');
                return;
              }
              navigation.reset({
                routes: [
                  { name: 'BottomTabNavigator', params: { token: token } },
                ],
                index: 0,
              });
            };
            // PIN o'rnatildi -> biometrik OPT-IN so'raymiz, javobdan keyin davom etamiz.
            askForBiometric(goNext);
          } else {
            setStep(1);
            setPassword('');
            storage.delete('k1');
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
    } else {
      setPassword(password + val);
      if ((password + val).length === 4) {
        const k2 = storage.getString('k2');

        if (password + val === k2) {
          // askForBiometric();
          const token = storage.getString('token');
          storage.delete('isLoginScreen');
          storage.set('appLocked', false);
          if (storage.getString('pendingNavigation') !== undefined) {
            navigation.navigate('Notification');
            storage.delete('pendingNavigation');
            return;
          }
          navigation.reset({
            routes: [{ name: 'BottomTabNavigator', params: { token: token } }],
            index: 0,
          });
        } else {
          setPassword('');
          setCount(prevCount => {
            const newCount = prevCount - 1;
            if (newCount === 0) {
              storage.set('time', Date.now());
            }
            return newCount;
          });
          if (count - 1 !== 0) {
            Toast.show({
              type: 'error2',
              position: 'top',
              props: {
                title: 'Xatolik!',
                desc: t('parol', { count: count - 1 }),
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

  // const onSupportScan = async () => {
  //   const local_password = storage.getString('k2');
  //   const {available} = await rnBiometrics.isSensorAvailable();
  //   if (available && local_password !== undefined && touch === true) {
  //     setSupportScan(true);
  //   } else {
  //     setSupportScan(false);
  //   }
  // };

  // const askForBiometric = async () => {
  //   const {available} = await rnBiometrics.isSensorAvailable();
  //   if (available) {
  //     const result = await rnBiometrics.simplePrompt({
  //       promptMessage: 'Confirm fingerprint',
  //     });
  //     if (result.success) {
  //       console.log('biometric success');
  //     } else {
  //       console.log('biometric failed');
  //     }
  //   } else {
  //     console.log('biometric not available');
  //   }
  // };

  useEffect(() => {
    // onSupportScan();
    let a = storage.getBoolean('touch');

    let countt = storage.getNumber('time');

    if (countt !== undefined) {
      let time = Date.now() - parseInt(countt);
      if (time > 1800000) {
        setCount(3);
        storage.delete('time');
      } else {
        setCount(0);
      }
    }

    if (a !== undefined && a && countt === undefined && !isLocal) {
      onFingerScan();
    }
  }, [isLocal, onFingerScan]);

  const renderSeeWhenYouPasswordWrong = useMemo(() => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StatusBar
          backgroundColor={'#fff'}
          barStyle={'dark-content'}
          animated={true}
        />
        <MarkIcon width={100} height={100} color={'#fff'} />

        <MainText size={fontSize[12]} mTop={10} ft={font.bold}>
          {t('Ilovaga kirish 30 daqiqaga cheklandi')}
        </MainText>

        <MainText size={fontSize[12]} mTop={10} ft={font.medium}>
          {t('PIN-kod bir necha bor xato kiritildi')}
        </MainText>
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            position: 'absolute',
            bottom: 30,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              // navigation.navigate('UpdatePasswordWithJshir');
              navigation.navigate('ResetPassCode', {
                isLocal: true,
              });
            }}
            style={[styles.enterButton]}
          >
            <MainText color={colors.white} size={fontSize[14]}>
              {t('PIN-kodni tiklash')}
            </MainText>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Linking.openURL('https://t.me/zeroxuz_bot');
            }}
          >
            <MainText
              ft={font.bold}
              color={colors.blue}
              mTop={15}
              size={fontSize[12]}
            >
              {t('Qo‘llab-quvvatlash xizmati bilan bog‘lanish')}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={style.blue} />
      {count !== 0 ? (
        <View style={{ flex: 1 }}>
          {!isLocal && (
            <View
              style={{ alignItems: 'center', marginLeft: 10, marginTop: 10 }}
            >
              <TouchableOpacity
                onPress={() => {
                  // 0 bulsa parol garakmidi dagani
                  // navigation.navigate('UpdatePasswordWithJshir');
                  navigation.navigate('ResetPassCode', {
                    isLocal: true,
                  });
                }}
                activeOpacity={0.8}
                style={
                  (styles.notSetPasswordButton,
                  {
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                  })
                }
              >
                <MainText color={colors.white} size={fontSize[12]}>
                  {t('PIN-kodni tiklash')}
                </MainText>
                {/* <ArrowRight width={12} height={12} color="#fff" /> */}
              </TouchableOpacity>
            </View>
          )}
          {/* {isLocal && (
        <View style={{alignItems: 'center', marginTop: 10}}>
          <TouchableOpacity
            onPress={() => {
              // 0 bulsa parol garakmidi dagani
              storage.set('isMust', '0');
              navigation.reset({
                routes: [{name: 'BottomTabNavigator'}],
                index: 0,
              });
            }}
            activeOpacity={0.8}
            style={styles.notSetPasswordButton}>
            <MainText color={colors.white} size={fontSize[12]}>
              {t('768')}
            </MainText>
            <ArrowRight width={12} height={12} color="#fff" />
          </TouchableOpacity>
        </View>
      )} */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SetCode
              width={heightPercentageToDP(22)}
              height={heightPercentageToDP(30)}
              style={{ transform: [{ scale: 1.3 }] }}
            />
          </View>
          <View style={{ flex: 1 }}>
            {isLocal ? (
              <View style={styles.setCodeTextContainer}>
                <MainText
                  color={colors.white}
                  size={fontSize[14]}
                  ft={font.bold}
                >
                  {step === 1 ? t('771') : t('PIN-kodni takrorlang')}
                </MainText>
              </View>
            ) : (
              <View style={styles.setCodeTextContainer}>
                <MainText
                  color={colors.white}
                  size={fontSize[14]}
                  ft={font.bold}
                >
                  {t('PIN-kodni kiriting')}
                </MainText>
              </View>
            )}
            <View style={styles.codeContainer}>
              <View style={styles.fourItem}>
                {Array.from({ length: 4 }, (_v, i) => {
                  return (
                    <View
                      key={i}
                      style={[
                        styles.codeItem,
                        // eslint-disable-next-line react-native/no-inline-styles
                        {
                          backgroundColor:
                            i < password.length ? style.blue : '#EEEEEE',
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
                }}
              >
                <View style={styles.codeNumberContainer}>
                  {Array.from({ length: 12 }, (_v, i) => {
                    if (i === 9) {
                      return (
                        <View key={i} style={[styles.codeNumberContainer]}>
                          {supportScan ? (
                            <Pressable
                              android_ripple={{
                                color: style.blue,
                                radius: 50,
                                borderless: true,
                              }}
                              onPress={() => {
                                onFingerScan();
                              }}
                              style={styles.codeButton}
                            >
                              <Image
                                source={require('../../images/auth/fingerprint.png')}
                                style={{ width: 30, height: 30 }}
                                resizeMode="cover"
                              />
                            </Pressable>
                          ) : (
                            <View
                              style={[
                                styles.codeButton,
                                { backgroundColor: '#fff' },
                              ]}
                            />
                          )}
                        </View>
                      );
                    } else {
                      if (i === 10) {
                        return (
                          <View key={i} style={styles.codeNumberContainer}>
                            <Pressable
                              onPress={() => {
                                onSetCode(0);
                              }}
                              android_ripple={{
                                color: style.blue,
                                radius: 50,
                                borderless: true,
                              }}
                              style={styles.codeButton}
                            >
                              <MainText
                                // ft={font.bold}
                                color={colors.black}
                                size={fontSize[21]}
                              >
                                0
                              </MainText>
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
                                color: style.blue,
                                radius: 50,
                                borderless: true,
                              }}
                              style={styles.codeButton}
                            >
                              <ArrowLeft
                                width={12}
                                height={12}
                                color={style.blue}
                              />
                            </Pressable>
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
                              color: style.blue,
                              radius: 50,
                              borderless: true,
                            }}
                            style={styles.codeButton}
                          >
                            <MainText
                              // ft={font.bold}
                              color={colors.black}
                              size={fontSize[21]}
                            >
                              {i + 1}
                            </MainText>
                          </Pressable>
                        </View>
                      );
                    }
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        renderSeeWhenYouPasswordWrong
      )}

      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default SetLocalPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: style.blue,
  },
  enterButton: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: style.buttonHeight - 15,
    alignSelf: 'center',
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
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEEEE',
    margin: scale(10),
  },
  fourItem: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 10,
  },
  codeItem: {
    width: 15,
    height: 15,
    backgroundColor: style.blue,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  codeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
  },
  setCodeTextContainer: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  textCode: {
    fontSize: style.fontSize.m,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  notSetPasswordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 10,
  },
  text: {
    fontSize: style.fontSize.xx,
    color: '#fff',
    fontFamily: style.fontFamilyBold,
  },
  notSetText: {
    color: '#fff',
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
  },
});
