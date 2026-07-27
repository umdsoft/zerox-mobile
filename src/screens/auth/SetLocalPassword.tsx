import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { normalize, style } from '../../theme/style';

import SetCode from '../../images/SetCode';
import {
  DrawerActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { CaptureProtection } from 'react-native-capture-protection';

import Toast from 'react-native-toast-message';
import { storage } from '../../store/api/token/getToken';
import MainText from '../components/MainText';
import { fontSize } from '../../theme/font';
import { t } from 'i18next';
import BiometricModule from '../../../BiometricModule';
import ReactNativeBiometrics from 'react-native-biometrics';
import MarkIcon from '../../images/mark';
import { scale } from '../../helper/scale';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { rd, rs } from '../../theme/rd';
import {
  BackspaceIcon,
  FaceTouchIdIcon,
  FingerprintIcon,
  ShieldIcon,
} from '../home/redesign/icons';
import { GradientIconBadge } from '../components/BrandLockup';

const rnBiometrics = new ReactNativeBiometrics();

// PIN paneli o'lchamlari.
// MUAMMO: panel kengligi `heightPercentageToDP(33)` edi — ya'ni GORIZONTAL o'lcham
// ekran BALANDLIGIga bog'langan, tugma cheti esa `scale()` orqali KENGLIKka. Ikki xil
// manba aralashgani uchun planshetda 3 ta tugma sig'may, panel 2 ustunga tushib qolardi
// (415.8dp kerak edi, 422.4dp bor — yaxlitlash bilan yetmay qolgan).
// YECHIM: panel kengligi TUGMA o'lchamidan hisoblanadi -> har qanday ekranda aynan 3 ustun.
// Tugmalar KATTAROQ (7.5 -> 8.4): ekran o'rtasida kichkina bo'lmasin.
// DIQQAT: `flexWrap` da grid kengligi 3 tugmaga AYNAN teng bo'lsa, sub-piksel
// yaxlitlash oxirgi tugmani pastga o'raydi (2 ustun bo'lib qoladi — 8.6% da
// aynan shu bo'lgan). Shuning uchun grid kengligiga BUFER (+14dp) qo'shamiz:
// 3 ustun har doim sig'adi, lekin ekran enidan oshmaydi.
const PIN_BTN_SIZE = heightPercentageToDP(8.4);
const PIN_BTN_MARGIN = scale(10);
const PIN_GRID_WIDTH = (PIN_BTN_SIZE + PIN_BTN_MARGIN * 2) * 3 + 14;

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
  // Biometrik OPT-IN — native Alert o'rniga CHIROYLI maxsus modal.
  const [bioModal, setBioModal] = useState<{
    visible: boolean;
    onDone: () => void;
  }>({ visible: false, onDone: () => {} });

  const navigation = useNavigation();

  // V-012: PIN ekranida screenshot/record himoyasi (faqat shu ekranda — chiqishda
  // qaytariladi, shunda QrCode ViewShot va boshqa ekranlar buzilmaydi).
  useFocusEffect(
    useCallback(() => {
      CaptureProtection.prevent().catch(() => {});

      // QULF EKRANIDA MENYU OCHIQ QOLMASIN.
      // Drawer BUTUN ilovani o'raydi (DrawerNavigator > StackNavigator), shuning
      // uchun menyu ochiq holatda ilova qulflansa, u PIN ekrani USTIDA osilib
      // qolardi: kontent o'ngga surilib ko'rinardi va — muhimi — PIN kiritmasdan
      // menyu bandlariga (Qarz daftari, Tariflar, Chiqish...) o'tish mumkin edi.
      // Fokusda majburan yopamiz.
      navigation.dispatch(DrawerActions.closeDrawer());

      return () => {
        CaptureProtection.allow().catch(() => {});
      };
    }, [navigation]),
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
        // iOS: Face ID YOKI Touch ID — IKKALASI ham. Oldin faqat FaceID tekshirilardi,
        // shuning uchun Touch ID li iPhone/iPad'да biometrik umuman ishlamasdi.
        const { available } = await rnBiometrics.isSensorAvailable();
        if (available) {
          const result = await rnBiometrics.simplePrompt({
            promptMessage: t('Face ID / Touch ID bilan tasdiqlang'),
            cancelButtonText: t('Bekor qilish'),
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
      // Native Alert emas — maxsus, brendlangan modal (pastda render qilinadi).
      setBioModal({ visible: true, onDone });
    } catch {
      storage.set('touch', false);
      onDone();
    }
  }, []);

  // Modal tugmalari: tanlovni saqlab, davom etadi.
  const onBioChoose = useCallback(
    (yes: boolean) => {
      storage.set('touch', yes);
      const done = bioModal.onDone;
      setBioModal({ visible: false, onDone: () => {} });
      done();
    },
    [bioModal],
  );

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
    const lockTime = storage.getNumber('time');
    if (lockTime !== undefined) {
      // 30 daqiqalik bloklash tugadimi?
      if (Date.now() - lockTime > 1800000) {
        setCount(3);
        storage.delete('time');
      } else {
        setCount(0);
      }
    }

    // BIOMETRIK: PIN o'rnatilgan (!isLocal), bloklanmagan, va foydalanuvchi ochiq
    // O'CHIRMAGAN (touch !== false — default YOQILGAN) bo'lsa — mavjudligini tekshirib,
    // app ochilishi bilan DARHOL so'raymiz. Muvaffaqiyatli bo'lsa PIN kiritish shart emas.
    // Mavjud bo'lsa tugma ham ko'rsatiladi (auto-so'rov bekor qilinsa qayta urinish uchun).
    const touch = storage.getBoolean('touch');
    if (!isLocal && lockTime === undefined && touch !== false) {
      rnBiometrics
        .isSensorAvailable()
        .then(({ available }) => {
          setSupportScan(available);
          if (available) {
            onFingerScan();
          }
        })
        .catch(() => {});
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

        <MainText size={fontSize[12]} mTop={10} ft={rd.font.bold}>
          {t('Ilovaga kirish 30 daqiqaga cheklandi')}
        </MainText>

        <MainText size={fontSize[12]} mTop={10} ft={rd.font.medium}>
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
            <MainText color={rd.color.onPrimary} size={fontSize[14]}>
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
              ft={rd.font.bold}
              color={rd.color.primary}
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
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {count !== 0 ? (
        <View style={{ flex: 1 }}>
          {!isLocal && (
            // "PIN-kodni tiklash" — burchakka tiqilib qolmasin: MARKAZDA,
            // ko'rinadigan pill (tint fon) ko'rinishida.
            <View style={{ alignItems: 'center', marginTop: rs(16) }}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ResetPassCode', { isLocal: true });
                }}
                activeOpacity={0.8}
                style={styles.resetPill}
              >
                <MainText color={rd.color.primary} size={fontSize[13]} ft={rd.font.semibold}>
                  {t('PIN-kodni tiklash')}
                </MainText>
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
            <MainText color={rd.color.onPrimary} size={fontSize[12]}>
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
              marginTop: rs(48),
              marginBottom: rs(20),
            }}
          >
            <GradientIconBadge size={rs(84)}>
              <ShieldIcon size={rs(34)} color={rd.color.primary} />
            </GradientIconBadge>
          </View>
          <View style={{ flex: 1 }}>
            {isLocal ? (
              <View style={styles.setCodeTextContainer}>
                <MainText
                  color={rd.color.text}
                  size={fontSize[16]}
                  ft={rd.font.bold}
                >
                  {step === 1 ? t('771') : t('PIN-kodni takrorlang')}
                </MainText>
              </View>
            ) : (
              <View style={styles.setCodeTextContainer}>
                <MainText
                  color={rd.color.text}
                  size={fontSize[16]}
                  ft={rd.font.bold}
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
                            i < password.length ? rd.color.primary : rd.color.border,
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
                  width: PIN_GRID_WIDTH,
                  // Raqamlar panelini PASTGA suramiz — telefonni bir qo'lda
                  // ushlaganda bosh barmoq bilan yetish oson bo'lsin.
                  justifyContent: 'flex-end',
                  paddingBottom: rs(40),
                }}
              >
                <View style={styles.codeNumberContainer}>
                  {Array.from({ length: 12 }, (_v, i) => {
                    if (i === 9) {
                      // 0 ning CHAP tomonidagi tugma — biometrik (Face ID / Touch ID).
                      // PIN KIRITISH (unlock, !isLocal) rejimida DOIM ko'rinadi:
                      // bosilganda Android'da barmoq izi, iOS'da Face ID ishga tushadi
                      // (onFingerScan platformani o'zi aniqlaydi). PIN O'RNATISHDA
                      // (isLocal) biometrik tegishli emas -> bo'sh joy.
                      return (
                        <View key={i} style={[styles.codeNumberContainer]}>
                          {!isLocal ? (
                            <Pressable
                              android_ripple={{
                                color: rd.color.primary,
                                radius: 50,
                                borderless: true,
                              }}
                              onPress={() => {
                                onFingerScan();
                              }}
                              style={styles.codeButton}
                            >
                              <FaceTouchIdIcon
                                size={rs(30)}
                                color={rd.color.primary}
                              />
                            </Pressable>
                          ) : (
                            <View
                              style={[
                                styles.codeButton,
                                { backgroundColor: 'transparent' },
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
                                color: rd.color.primary,
                                radius: 50,
                                borderless: true,
                              }}
                              style={styles.codeButton}
                            >
                              <MainText
                                ft={rd.font.medium}
                                color={rd.color.text}
                                size={fontSize[23]}
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
                                color: rd.color.primary,
                                radius: 50,
                                borderless: true,
                              }}
                              style={styles.codeButton}
                            >
                              <BackspaceIcon
                                size={rs(24)}
                                color={rd.color.textSecondary}
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
                              color: rd.color.primary,
                              radius: 50,
                              borderless: true,
                            }}
                            style={styles.codeButton}
                          >
                            <MainText
                              ft={rd.font.medium}
                              color={rd.color.text}
                              size={fontSize[23]}
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

      {/* Biometrik kirish — brendlangan modal (native Alert o'rniga). */}
      <Modal
        transparent
        visible={bioModal.visible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => onBioChoose(false)}
      >
        <View style={styles.bioOverlay}>
          <View style={styles.bioCard}>
            <View style={styles.bioIcon}>
              <FingerprintIcon size={rs(38)} color={rd.color.primary} />
            </View>
            <Text style={styles.bioTitle} allowFontScaling={false}>
              {t('Biometrik kirish')}
            </Text>
            <Text style={styles.bioDesc} allowFontScaling={false}>
              {t('Keyingi kirishlarda Touch ID / Face ID dan foydalanasizmi?')}
            </Text>
            <View style={styles.bioBtns}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.bioBtn, styles.bioBtnGhost]}
                onPress={() => onBioChoose(false)}
              >
                <Text style={styles.bioBtnGhostText} allowFontScaling={false}>
                  {t("Yo'q")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.bioBtn, styles.bioBtnPrimary]}
                onPress={() => onBioChoose(true)}
              >
                <Text style={styles.bioBtnPrimaryText} allowFontScaling={false}>
                  {t('Ha')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SetLocalPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  enterButton: {
    width: '90%',
    backgroundColor: rd.color.primary,
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
  // KONTRAST: och-kulrang page fonida oq tugma + chegara + yengil soya bilan
  // aniq ajralib turadi (ilgari surfaceAlt fon bilan deyarli qo'shilib ketgandi).
  codeButton: {
    width: PIN_BTN_SIZE,
    height: PIN_BTN_SIZE,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    margin: PIN_BTN_MARGIN,
    overflow: 'hidden',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  fourItem: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 10,
  },
  codeItem: {
    width: 18,
    height: 18,
    backgroundColor: rd.color.primary,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
  },
  codeContainer: {
    flex: 1,
    backgroundColor: 'transparent',
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
  resetPill: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(9),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
  },

  // Biometrik modal
  bioOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,18,32,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  bioCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingHorizontal: rs(22),
    paddingTop: rs(26),
    paddingBottom: rs(18),
    alignItems: 'center',
  },
  bioIcon: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(16),
  },
  bioTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
  },
  bioDesc: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    lineHeight: rs(20),
    marginTop: rs(8),
    paddingHorizontal: rs(6),
  },
  bioBtns: {
    flexDirection: 'row',
    gap: rs(12),
    marginTop: rs(22),
    width: '100%',
  },
  bioBtn: {
    flex: 1,
    height: rs(50),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioBtnGhost: {
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  bioBtnGhostText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
  },
  bioBtnPrimary: { backgroundColor: rd.color.primary },
  bioBtnPrimaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
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
