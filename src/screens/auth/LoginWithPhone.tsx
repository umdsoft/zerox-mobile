import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { MaskedTextInput } from 'react-native-advanced-input-mask';

import { useDispatch } from 'react-redux';
import Loading from '../components/Loading';
import { LoginWithPhoneSendPasswordApi } from '../../store/api/auth';
import { storage } from '../../store/api/token/getToken';
import Uzbekistan from '../../images/Uzbekistan';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
// Eski ilovadagi kirish illyustratsiyasi — redizaynda tushib qolgandi, qaytarildi.
import PhoneLoginImage from '../../images/phoneloginimage.svg';
import {
  AuthBackdrop,
  AuthFloat,
  AuthHero,
  AuthPrimaryButton,
  AuthTopBar,
  AuthReveal,
  authStyles,
} from './authKit';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { t } from 'i18next';
import { checkPhoneTime } from '../../helper/timeChecker';
import { rd, rs } from '../../theme/rd';
import { LockIcon } from '../home/redesign/icons';

const LoginWithPhone = () => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<'phone' | 'password' | null>(null);
  const navigation = useNavigation();

  const [eye, setEye] = useState(true);
  const SendLogin = async () => {
    try {
      setLoading(true);
      if (await checkPhoneTime()) {
        const response = await dispatch(
          LoginWithPhoneSendPasswordApi({
            phone: phone.replace(/\s/g, ''),
            password: password,
          }),
        ).unwrap();

        if (response.message === 'user-nft' && response.success === false) {
          Toast.show({
            autoHide: true,
            visibilityTime: 4000,
            position: 'bottom',
            type: 'error2',
            props: {
              desc: t(
                "Ro'yxatdan o'tish oxirigacha amalga oshirilmagan. Iltimos, ro'yxatdan o'tish jarayonini yakunlang.",
              ),
            },
          });
          setLoading(false);
          return;
        }
        if (
          response.message === 'user-not-found' &&
          response.success === false
        ) {
          Toast.show({
            autoHide: true,
            visibilityTime: 4000,
            position: 'bottom',
            type: 'error2',
            props: {
              desc: t('10002'),
            },
          });
          setLoading(false);
          return;
        }
        // Xato telefon/parol — backend {success:false, message:'invalid-credentials',
        // attemptsLeft: N} (HTTP 200) qaytaradi. Ilgari 'invalid-password' tekshirilardi
        // (mos kelmasdi) => notification umuman chiqmasdi. Endi to'g'ri xabar +
        // qolgan urinishlar soni; urinishlar tugasa 30 daqiqalik blok xabari.
        if (
          (response.message === 'invalid-credentials' ||
            response.message === 'invalid-password') &&
          response.success === false
        ) {
          Toast.show({
            autoHide: true,
            visibilityTime: 4000,
            position: 'bottom',
            type: 'error2',
            props: {
              desc:
                response.attemptsLeft > 0
                  ? t('10001', { count: response.attemptsLeft })
                  : t('10003'),
            },
          });

          setLoading(false);
          return;
        }

        if (
          response.message === 'account-blocked' &&
          response.success === false
        ) {
          Toast.show({
            autoHide: true,
            visibilityTime: 4000,
            position: 'bottom',
            type: 'error2',
            props: {
              desc: t('10003'),
            },
          });

          setLoading(false);
          return;
        }

        if (response.success) {
          storage.set('token', response.token);
          // 7-kunlik refreshToken'ни saqlaymiz — token eskirganda avto-yangilash uchun.
          if (response.refreshToken) {
            storage.set('refreshToken', response.refreshToken);
          }
          storage.set('phoneNumber', phone.replace(/\s/g, ''));
          storage.set('user_id', response.sad);
          if (storage.getString('token').length > 0) {
            const is = storage.getString('isMust');
            if (is === undefined) {
              setError(false);
              navigation.navigate('SetLocalPassword');
            } else {
              setError(false);
              navigation.reset({
                routes: [
                  {
                    name: 'BottomTabNavigator',
                    params: { token: response.token },
                  },
                ],
                index: 0,
              });
            }
          }
          setTimeout(() => {
            setLoading(false);
          }, 500);
        }
      }
    } catch (e) {
      // Xato telefon/parol (agar kelajakda non-200 bo'lib throw qilinsa ham) —
      // qolgan urinishlar soni; urinishlar tugasa 30 daqiqalik blok xabari.
      if (
        e?.message === 'error' ||
        e?.message === 'user-not-found' ||
        e?.message === 'invalid-credentials' ||
        e?.message === 'invalid-password'
      ) {
        Toast.show({
          autoHide: true,
          visibilityTime: 4000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc:
              (e?.attemptsLeft ?? 0) > 0
                ? t('10001', { count: e.attemptsLeft })
                : t('10003'),
          },
        });
        setLoading(false);
        return;
      }

      if (e?.message === 'account-blocked') {
        Toast.show({
          autoHide: true,
          visibilityTime: 4000,
          position: 'bottom',
          type: 'error2',
          props: { desc: t('10003') },
        });
        setLoading(false);
        return;
      }

      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'top',
        type: 'error2',
        props: {
          desc: t('Serverga ulanishda xatolik yuz berdi'),
        },
      });
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const disabled = useMemo(() => {
    return phone.length === 9 && password.length >= 8 ? false : true;
  }, [phone, password]);

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* Fintech atmosfera — butun ekran ortidagi brend gradienti */}
      <AuthBackdrop />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <AuthTopBar onBack={() => navigation.goBack()} />

          {/*
            YARIM-YARIM kompozitsiya. Illyustratsiya ekranning TEPA yarmida
            (markazda), forma esa PASTKI yarmida — ular bir-biriga yopishmasin.
            Ilgari hamma narsa yuqoriga to'planib, cardlar ikonkaga tiqilib
            qolardi. Ilova nomi/maqsadi ma'lum bo'lgani uchun logotip, sarlavha
            va tavsif yo'q — yagona vizual markaz illyustratsiya.
          */}
          <View style={styles.topHalf}>
            <AuthReveal>
              <AuthHero style={styles.hero}>
                <AuthFloat>
                  <PhoneLoginImage width={rs(272)} height={rs(165)} />
                </AuthFloat>
              </AuthHero>
            </AuthReveal>
          </View>

          <View style={styles.bottomHalf}>
          {/* Forma — hero va sarlavhadan keyin paydo bo'ladi */}
          <AuthReveal delay={230}>
          {/* Telefon — yorliqsiz: bayroq + "+998" maydonning o'zi nima
              so'ralayotganini aytadi, ortiqcha sarlavha shovqin. */}
          <View
            style={[
              styles.field,
              focused === 'phone' && styles.fieldFocused,
            ]}
          >
            <View style={styles.flagBox}>
              <Uzbekistan />
              {/* allowFontScaling={false} — ILDIZ SABAB: usiz "+998" qurilma
                  shrift kattalashtirilganda (Samsung "katta shrift") kattalashib,
                  raqam (u allowFontScaling={false}) o'z holida qolib, ikkisi
                  turli o'lchamda chiqardi. Endi ikkisi ham qat'iy bir xil. */}
              <Text style={styles.prefix} allowFontScaling={false}>
                +998
              </Text>
            </View>
            <MaskedTextInput
              allowFontScaling={false}
              value={phone}
              mask="[00] [000] [00] [00]"
              placeholder="__ ___ __ __"
              placeholderTextColor={rd.color.textTertiary}
              onChangeText={(formatted, extracted) => setPhone(extracted)}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              keyboardType="number-pad"
              style={styles.phoneInput}
            />
          </View>

          {/* Parol */}
          {/* Parol — yorliqsiz: qulf ikonasi va placeholder yetarli. */}
          <View
            style={[
              styles.field,
              styles.fieldGap,
              focused === 'password' && styles.fieldFocused,
            ]}
          >
            <View style={styles.leadIcon}>
              <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            </View>
            <TextInput
              secureTextEntry={eye}
              placeholderTextColor={rd.color.textTertiary}
              placeholder={t('69')}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              keyboardType="default"
              style={styles.passwordInput}
              allowFontScaling={false}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setEye(!eye)}
              style={styles.eyeBtn}
            >
              {eye ? (
                <Eye color={rd.color.textSecondary} width={rs(22)} height={rs(22)} />
              ) : (
                <EyeClose
                  color={rd.color.textSecondary}
                  width={rs(22)}
                  height={rs(22)}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Parolni unutdingizmi */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.forgot}
            onPress={() => {
              setError(false);
              navigation.navigate('UpdatePasswordWithJshir');
            }}
          >
            <Text style={styles.forgotText}>{t('33')}</Text>
          </TouchableOpacity>

          {/* Kirish */}
          <AuthPrimaryButton
            label={t('24')}
            disabled={disabled}
            onPress={() => {
              setError(false);
              SendLogin();
            }}
            style={styles.loginBtn}
          />
          </AuthReveal>

          {/* Pastki qism — oxirgi qadam */}
          <AuthReveal delay={340}>
          {/* Ro'yxatdan o'tish */}
          <View style={styles.registerRow}>
            <Text style={styles.registerHint}>Hisobingiz yo‘qmi?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setError(false);
                navigation.navigate('RegisterWithPeople', { type: 1 });
              }}
            >
              <Text style={styles.registerLink}>{t('36')}</Text>
            </TouchableOpacity>
          </View>
          {/* "Ma'lumotlaringiz shifrlangan..." qatori olib tashlandi (so'rov bo'yicha). */}
          </AuthReveal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginWithPhone;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
    paddingBottom: rs(28),
  },

  // Ekranni ikkiga bo'lish: illyustratsiya tepa yarmda (markazda), forma
  // pastki yarmda. Shu bilan cardlar ikonkaga tiqilib qolmaydi.
  topHalf: { flex: 1, justifyContent: 'center' },
  bottomHalf: { flex: 1 },

  // Panelning o'zi AuthHero'da — bu yerda faqat joylashuv.
  hero: { marginTop: rs(10), marginBottom: rs(18) },

  // Rasmiy blank tili: KATTA HARF + keng traking (authKit'dan).
  field: authStyles.field,
  fieldFocused: authStyles.fieldFocused,
  // Yorliqlar olib tashlangani uchun maydonlar orasidagi ritm shu yerda.
  fieldGap: { marginTop: rs(14) },
  // Bayroq + "+998" va raqam bitta butun bo'lib o'qilishi kerak: ular
  // orasidagi ochiq joy kichik, ajratuvchi ustun esa YO'Q (u ikkalasini
  // sun'iy ravishda ikki alohida qiymatga bo'lib ko'rsatardi).
  flagBox: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginRight: rs(8) },
  prefix: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  leadIcon: { marginRight: rs(10) },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  eyeBtn: { paddingLeft: rs(8), height: '100%', justifyContent: 'center' },

  forgot: { alignSelf: 'flex-end', marginTop: rs(12) },
  forgotText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.primary,
  },

  // Tugmaning o'zi AuthPrimaryButton (gradient + rangli soya) — bu yerda
  // faqat joylashuv qoladi.
  loginBtn: { marginTop: rs(24) },

  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    marginTop: rs(22),
  },
  registerHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
  },
  registerLink: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.primary,
  },
});
