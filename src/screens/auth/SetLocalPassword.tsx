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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SUPPORT_TG_URL } from '../constants';
import { normalize, style } from '../../theme/style';

import {
  DrawerActions,
  StackActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import Toast from 'react-native-toast-message';
import { storage } from '../../store/api/token/getToken';
import { warmHome } from '../../helper/homeCache';
// SS-SEC (2026-09-25): PIN ochiq matnda emas — salt+SHA-256 (pin.ts).
import { hasPin, setPin, verifyPin } from '../../store/api/token/pin';
import {
  attemptPin,
  formatRemaining,
  getLockState,
} from '../../store/api/token/pinLockout';
import { forceLogout } from '../../helper/forceLogout';
import {
  disableBiometricUnlock,
  enrollBiometricUnlock,
  isBiometricEnrolled,
  unlockWithBiometrics,
} from '../../helper/biometricUnlock';
import MainText from '../components/MainText';
import { fontSize } from '../../theme/font';
import { t } from 'i18next';
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
  // SS-SEC (2026-09-25): PIN bor-yo'qligi hash (yoki eski ochiq k2) orqali.
  const [isLocal] = useState(() => !hasPin());
  // Birinchi qadamda terilgan PIN — faqat xotirada (ilgari MMKV'ga `k1` ochiq yozilardi).
  const firstPinRef = useRef('');
  // SEC (2026-10-31): urinishlar/qulf shifrlangan MMKV'da (pinLockout.ts) — qayta
  // ishga tushirish hisobni nollamaydi. Qolgan qulf vaqti (ms), 0 = qulf yo'q.
  const [lockRemaining, setLockRemaining] = useState(() => getLockState().remainingMs);
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
      // SEC (2026-10-31): screenshot/yozib olish himoyasi endi markaziy
      // (helper/captureGuard.ts, navigatsiya holati bo'yicha) — bu yerda alohida emas.

      // QULF EKRANIDA MENYU OCHIQ QOLMASIN.
      // Drawer BUTUN ilovani o'raydi (DrawerNavigator > StackNavigator), shuning
      // uchun menyu ochiq holatda ilova qulflansa, u PIN ekrani USTIDA osilib
      // qolardi: kontent o'ngga surilib ko'rinardi va — muhimi — PIN kiritmasdan
      // menyu bandlariga (Qarz daftari, Tariflar, Chiqish...) o'tish mumkin edi.
      // Fokusda majburan yopamiz.
      navigation.dispatch(DrawerActions.closeDrawer());

    }, [navigation]),
  );

  // J (so'rov): qulfdan chiqqach — foydalanuvchi qulf OLDIDA turgan ekranga qaytadi
  // (bosh sahifa emas). useAppStateListener qulflashdan oldin nav-holatni saqlaydi;
  // shuni tiklaymiz. Saqlangan holat bo'lmasa — bosh sahifa (BottomTabNavigator).
  const restoreAfterUnlock = useCallback(() => {
    const saved = storage.getString('preLockNavState');
    if (saved) {
      try {
        const st = JSON.parse(saved);
        storage.delete('preLockNavState');
        navigation.reset(st);
        return;
      } catch (e) {
        storage.delete('preLockNavState');
      }
    }
    navigation.reset({ routes: [{ name: 'BottomTabNavigator' }], index: 0 });
  }, [navigation]);

  const finishUnlock = useCallback(() => {
    storage.set('appLocked', false);
    if (storage.getString('pendingNavigation') !== undefined) {
      // NAV-FIX: qulf OCHILDI (appLocked=false) — `replace` bilan qulf ekrani
      // stekdan chiqadi. Aks holda bildirishnomadan orqaga bosilganda yana
      // PIN so'rash ekrani chiqib qolardi (ilova ochiq bo'lsa ham).
      navigation.dispatch(StackActions.replace('Notification'));
      storage.delete('pendingNavigation');
      return;
    }
    setTimeout(() => {
      restoreAfterUnlock();
    }, 500);
  }, [navigation, restoreAfterUnlock]);

  const bioPrompt = useCallback(
    () => ({
      title: t('Face ID / Touch ID bilan tasdiqlang') as string,
      cancel: t('Bekor qilish') as string,
    }),
    [],
  );

  // SEC (2026-10-31): biometrik qulf ochish — Keychain/Keystore'dagi, faqat haqiqiy
  // biometrik tasdiqdan keyin chiqadigan sir orqali (helper/biometricUnlock.ts).
  const onFingerScan = useCallback(async () => {
    try {
      if (getLockState().locked) return;
      const result = await unlockWithBiometrics(bioPrompt());
      if (result === 'ok') {
        finishUnlock();
      } else if (result === 'invalid') {
        // Yangi barmoq izi/yuz qo'shilgan (yoki sir yo'qolgan): PIN bilan kiring, qayta yoqing.
        storage.set('touch', false);
        setSupportScan(false);
        Toast.show({
          type: 'error2',
          position: 'top',
          props: {
            desc: t(
              'Biometrik kirish yangilanishi kerak. Xavfsizlik bo‘limida uni qayta yoqing.',
            ),
          },
          visibilityTime: 4000,
          autoHide: true,
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
      }
    } catch {
      // Biometrik muvaffaqiyatsiz — PIN bilan davom etiladi.
    }
  }, [bioPrompt, finishUnlock]);

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
      const done = bioModal.onDone;
      setBioModal({ visible: false, onDone: () => {} });
      if (!yes) {
        storage.set('touch', false);
        done();
        return;
      }
      // Sirni biometrik-bog'langan holda yaratamiz; muvaffaqiyatsiz bo'lsa — o'chiq.
      enrollBiometricUnlock(bioPrompt())
        .then(ok => storage.set('touch', ok))
        .catch(() => storage.set('touch', false))
        .finally(done);
    },
    [bioModal, bioPrompt],
  );

  const onSetCode = val => {
    if (isLocal) {
      if (step === 1) {
        setPassword(password + val);
        if ((password + val).length === 4) {
          setStep(2);
          firstPinRef.current = password + val;
          setPassword('');
          return;
        }
      }

      if (step === 2) {
        setPassword(password + val);

        if ((password + val).length === 4) {
          const k1 = firstPinRef.current;
          if (password + val === k1) {
            const token = storage.getString('token');
            setPin(password + val);
            firstPinRef.current = '';
            storage.delete('isLoginScreen');
            storage.set('appLocked', false);
            const goNext = () => {
              if (storage.getString('pendingNavigation') !== undefined) {
                // NAV-FIX: qulf OCHILDI (appLocked=false) — `replace` bilan qulf ekrani
            // stekdan chiqadi. Aks holda bildirishnomadan orqaga bosilganda yana
            // PIN so'rash ekrani chiqib qolardi (ilova ochiq bo'lsa ham).
            navigation.dispatch(StackActions.replace('Notification'));
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
            firstPinRef.current = '';
            Toast.show({
              type: 'error2',
              position: 'top',
              props: {
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
        // SEC (2026-10-31): urinish tekshiruvdan OLDIN shifrlangan MMKV'ga yoziladi;
        // ketma-ket xatolarda o'sib boruvchi qulf, 10-xatoda sessiya o'chiriladi.
        const attempt = attemptPin(verifyPin, password + val);
        if (attempt.result === 'ok') {
          storage.delete('isLoginScreen');
          storage.set('appLocked', false);
          // Biometrik sir hali yaratilmagan (eski foydalanuvchi, touch=true): PIN muvaffaqiyatidan
          // keyin bir marta ro'yxatdan o'tkazamiz; bekor qilinsa o'chiriladi (takror so'ramaymiz).
          if (storage.getBoolean('touch') === true && !isBiometricEnrolled()) {
            enrollBiometricUnlock(bioPrompt())
              .then(ok => {
                if (!ok) storage.set('touch', false);
              })
              .catch(() => storage.set('touch', false));
          }
          if (storage.getString('pendingNavigation') !== undefined) {
            navigation.dispatch(StackActions.replace('Notification'));
            storage.delete('pendingNavigation');
            return;
          }
          // J: qulf oldidagi ekranga qaytamiz (bosh sahifa emas).
          restoreAfterUnlock();
        } else if (attempt.result === 'wipe') {
          setPassword('');
          disableBiometricUnlock();
          forceLogout('pin-lockout');
        } else if (attempt.result === 'locked') {
          setPassword('');
          setLockRemaining(attempt.remainingMs);
        } else {
          setPassword('');
          if (attempt.lockMs > 0) {
            setLockRemaining(getLockState().remainingMs);
          } else {
            Toast.show({
              type: 'error2',
              position: 'top',
              props: {
                desc: t('parol', { count: attempt.attemptsLeft }),
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
  //   const local_password = hasPin();
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

  // SS-DEV (2026-10-05): PIN kiritilayotgan paytda bosh sahifa ma'lumotlarini
  // OLDINDAN yuklaymiz (keshdan darhol + fonda tarmoq). PIN tasdiqlangach bosh
  // sahifa spinner'siz, tayyor ma'lumot bilan ochiladi. Sessiya ichidagi qulfda
  // (redux'da ma'lumot bor) qayta yuklanmaydi.
  useEffect(() => {
    try {
      const { Store } = require('../../store/store/Store');
      const hasUser = !!Store.getState()?.HomeReducer?.user?.data;
      if (!hasUser) warmHome();
    } catch {}
  }, []);

  // Qulf taymeri: har soniya qolgan vaqtni yangilaydi, tugagach PIN kiritish ochiladi.
  useEffect(() => {
    if (lockRemaining <= 0) return;
    const id = setInterval(() => {
      const st = getLockState();
      setLockRemaining(st.locked ? st.remainingMs : 0);
    }, 1000);
    return () => clearInterval(id);
  }, [lockRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // BIOMETRIK: PIN o'rnatilgan (!isLocal), bloklanmagan, foydalanuvchi YOQQAN
    // (touch === true) va sir ro'yxatdan o'tgan bo'lsa — app ochilishi bilan so'raymiz.
    // Sir yo'q eski foydalanuvchilar PIN kiritadi; ro'yxatdan o'tish PIN'dan keyin (onSetCode).
    const touch = storage.getBoolean('touch');
    if (!isLocal && !getLockState().locked && touch === true && isBiometricEnrolled()) {
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
          {t('Ilovaga kirish vaqtincha cheklandi')}
        </MainText>

        <MainText size={fontSize[12]} mTop={10} ft={rd.font.medium}>
          {t('Qolgan vaqt: {{time}}', { time: formatRemaining(lockRemaining) })}
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
              // 10.10: qo'llab-quvvatlash — @zeroxuz_bot (funksiyalar boti @ZeroXuzbot emas).
              Linking.openURL(SUPPORT_TG_URL);
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
  }, [navigation, lockRemaining]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {lockRemaining <= 0 ? (
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
                      // DOIM ko'rinadi: ham PIN O'RNATISH (isLocal), ham PIN KIRITISH
                      // (unlock, !isLocal) rejimida FaceTouchIdIcon tugmasi turadi
                      // (bo'sh joy qoldirilmaydi — panel simmetrik bo'lsin).
                      // BIROQ biometrik FAQAT unlock (!isLocal) rejimida ishga tushadi:
                      // bosilganda Android'da barmoq izi, iOS'da Face ID ochiladi.
                      // PIN O'RNATISHDA (isLocal) tugma NO-OP — bu vaqtda PIN hali
                      // mavjud emas, shuning uchun biometrik autentifikatsiya
                      // bo'lishi mumkin emas: bosilsa hech narsa qilmaydi.
                      return (
                        <View key={i} style={[styles.codeNumberContainer]}>
                          <Pressable
                            android_ripple={{
                              color: rd.color.primary,
                              radius: 50,
                              borderless: true,
                            }}
                            onPress={() => {
                              if (!isLocal) {
                                onFingerScan();
                              }
                            }}
                            style={styles.codeButton}
                          >
                            <FaceTouchIdIcon
                              size={rs(30)}
                              color={rd.color.primary}
                            />
                          </Pressable>
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
