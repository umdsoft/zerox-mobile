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
import BrandLockup from '../components/BrandLockup';
// Eski ilovadagi kirish illyustratsiyasi — redizaynda tushib qolgandi, qaytarildi.
import PhoneLoginImage from '../../images/phoneloginimage.svg';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { t } from 'i18next';
import { checkPhoneTime } from '../../helper/timeChecker';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, LockIcon } from '../home/redesign/icons';

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
        if (
          response.message === 'invalid-password' &&
          response.success === false
        ) {
          Toast.show({
            autoHide: true,
            visibilityTime: 4000,
            position: 'bottom',
            type: 'error2',
            props: {
              desc: t('10001', { count: response.attemptsLeft }),
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
      if (e.message === 'error') {
        Toast.show({
          autoHide: true,
          visibilityTime: 4000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc: t('10001', { count: e.attemptsLeft || 0 }),
          },
        });

        setLoading(false);
        return;
      }

      if (e.message === 'user-not-found') {
        Toast.show({
          autoHide: true,
          visibilityTime: 4000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc: t('10001', { count: e.attemptsLeft || 0 }),
          },
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Orqaga */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>

          {/* Brend hero: logotip + illyustratsiya. Logotip 88 -> 60 ga
              kichraytirildi, chunki endi asosiy vizual illyustratsiya. */}
          <View style={styles.hero}>
            <BrandLockup badgeSize={rs(60)} wordSize={rs(26)} />
            <PhoneLoginImage width={rs(210)} height={rs(127)} />
            <Text style={styles.title}>Xush kelibsiz</Text>
            <Text style={styles.subtitle}>
              Hisobingizga kirish uchun ma’lumotlarni kiriting
            </Text>
          </View>

          {/* Telefon */}
          <Text style={styles.label}>Telefon raqam</Text>
          <View
            style={[
              styles.field,
              focused === 'phone' && styles.fieldFocused,
            ]}
          >
            <View style={styles.flagBox}>
              <Uzbekistan />
              <Text style={styles.prefix}>+998</Text>
            </View>
            <View style={styles.divider} />
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
          <Text style={[styles.label, { marginTop: rs(16) }]}>Parol</Text>
          <View
            style={[
              styles.field,
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
          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.85}
            onPress={() => {
              setError(false);
              SendLogin();
            }}
            style={[styles.loginBtn, disabled && styles.loginBtnDisabled]}
          >
            <Text
              style={[
                styles.loginText,
                disabled && { color: rd.color.textTertiary },
              ]}
            >
              {t('24')}
            </Text>
          </TouchableOpacity>

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
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(8),
  },

  // Illyustratsiya qo'shilgani uchun hero bo'shliqlari qisqartirildi
  // (vertikal balans saqlanadi, ekran cho'zilib ketmaydi).
  hero: { alignItems: 'center', marginTop: rs(10), marginBottom: rs(22) },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.text,
    marginTop: rs(10),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    lineHeight: rs(20),
    paddingHorizontal: rs(20),
  },

  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  field: {
    height: rs(56),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  fieldFocused: { borderColor: rd.color.primary },
  flagBox: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  prefix: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  divider: {
    width: 1,
    height: rs(22),
    backgroundColor: rd.color.border,
    marginHorizontal: rs(12),
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

  loginBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(24),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  loginBtnDisabled: {
    backgroundColor: rd.color.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },

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
