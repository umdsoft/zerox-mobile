/**
 * RecoverySmsReset — SMS orqali parol tiklash (identifikatsiyadan O'TMAGAN foydalanuvchi).
 *
 * Oqim: UpdatePasswordWithJshir → check-user code 1 (PINFL yo'q) → bu ekran.
 *  1) Ochilganda telefon raqamiga tiklash SMS'i yuboriladi (POST /user/recovery/send-sms).
 *  2) Foydalanuvchi 5 xonali kodni + yangi parolni kiritadi.
 *  3) Tasdiqlash (POST /user/recovery/verify-sms) — kod tekshiriladi VA yangi parol o'rnatiladi.
 *  4) Muvaffaqiyat → LoginWithPhone (reset).
 *
 * Identifikatsiyadan O'TGAN (PINFL bor, code 2) foydalanuvchi bu ekranga TUSHMAYDI —
 * u JSHSHIR + MyID (EnterJsh → MyIdScreen → UpdatePassword) orqali tiklaydi.
 */
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { OtpInput } from 'react-native-otp-entry';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';

import Loading from '../components/Loading';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
import { URL } from '../constants';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, LockIcon, MessageIcon } from '../home/redesign/icons';
import { GradientIconBadge } from '../components/BrandLockup';

const CODE_LENGTH = 5;
const RESEND_SECONDS = 120;

const secToMin = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// verify-sms javob kodini (0-6) foydalanuvchi xabariga aylantiramiz. Backend code 1/2 ni
// HTTP 200, code 4 (zaif parol)/6 (to'liq emas) ni HTTP 400 bilan qaytaradi — shuning uchun
// bu map ikkala joyda (200-body va catch response.data.code) ishlatiladi.
const verifyErrDesc = (code: any): string => {
  switch (Number(code)) {
    case 0:
      return t("Bu telefon raqami ro‘yxatdan o‘tmagan.");
    case 1:
      return t('Tasdiqlash kodi noto‘g‘ri');
    case 2:
      return t('Kod muddati tugagan');
    case 3:
      return t('Bu raqam MyID orqali tiklanadi');
    case 4:
      return t('Parol kamida 8 ta belgi va bo‘shliqsiz bo‘lishi kerak');
    default:
      return t('Parolni tiklashda xatolik yuz berdi');
  }
};

const RecoverySmsReset = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone: string = route.params?.phone || '';

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [eye, setEye] = useState(true);
  const [eye2, setEye2] = useState(true);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [focused, setFocused] = useState<'p' | 'c' | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRef = useRef<any>(null);

  const startTimer = useCallback(() => {
    setCanResend(false);
    setTimer(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Tiklash SMS'ini yuborish (ochilganda + qayta yuborishda).
  const sendSms = useCallback(async () => {
    try {
      await axios.post(
        URL + '/user/recovery/send-sms',
        { phone: '+998' + phone },
        { headers: { 'Content-Type': 'application/json' } },
      );
      startTimer();
    } catch (e) {
      Toast.show({
        type: 'error2',
        position: 'bottom',
        autoHide: true,
        visibilityTime: 3000,
        props: { title: t('Xatolik'), desc: t('SMS yuborishda xatolik. Qayta urinib ko‘ring.') },
      });
    }
  }, [phone, startTimer]);

  useEffect(() => {
    sendSms();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onResend = useCallback(() => {
    if (!canResend) return;
    setCode('');
    otpRef.current?.clear?.();
    sendSms();
  }, [canResend, sendSms]);

  const disabled = useMemo(
    () => code.length !== CODE_LENGTH || password.length < 8 || password !== confirm,
    [code, password, confirm],
  );

  const onSubmit = useCallback(async () => {
    if (disabled) return;
    try {
      setLoading(true);
      const { data } = await axios.post(
        URL + '/user/recovery/verify-sms',
        {
          phone: '+998' + phone,
          code,
          new_password: password,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (data?.success) {
        Toast.show({
          type: 'omad',
          position: 'bottom',
          autoHide: true,
          visibilityTime: 3000,
          props: { title: t('243'), desc: t('Parol tiklandi') },
        });
        setLoading(false);
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'LoginWithPhone' }] });
        }, 1500);
        return;
      }

      setLoading(false);
      setCode('');
      otpRef.current?.clear?.();
      Toast.show({
        type: 'error2',
        position: 'bottom',
        autoHide: true,
        visibilityTime: 3000,
        props: { title: t('Xatolik'), desc: verifyErrDesc(data?.code) },
      });
    } catch (e: any) {
      setLoading(false);
      // Backend weak-password (code 4) va missing-fields (code 6) ni HTTP 400 bilan qaytaradi
      // (axios throw qiladi) — shuning uchun response.data.code'ni o'qib ANIQ xabar beramiz;
      // aks holda hammasi "server xatosi" bo'lib chalg'itardi.
      const c = e?.response?.data?.code;
      Toast.show({
        type: 'error2',
        position: 'bottom',
        autoHide: true,
        visibilityTime: 3000,
        props: {
          title: t('Xatolik'),
          desc:
            c != null
              ? verifyErrDesc(c)
              : t('Serverga ulanishda xatolik yuz berdi'),
        },
      });
    }
  }, [disabled, phone, code, password, navigation]);

  if (loading) return <Loading />;

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
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>

          <View style={styles.hero}>
            <GradientIconBadge size={rs(84)}>
              <MessageIcon size={rs(34)} color={rd.color.primary} />
            </GradientIconBadge>
            <Text style={styles.title}>SMS orqali tiklash</Text>
            <Text style={styles.subtitle}>
              Telefon raqamingizga yuborilgan kodni kiriting va yangi parol o‘rnating
            </Text>
            <Text style={styles.phone}>+998 {phone}</Text>
          </View>

          {/* Kod */}
          <Text style={styles.label}>Tasdiqlash kodi</Text>
          <OtpInput
            ref={otpRef}
            numberOfDigits={CODE_LENGTH}
            onTextChange={setCode}
            focusColor={rd.color.primary}
            theme={{
              containerStyle: styles.otpContainer,
              pinCodeContainerStyle: styles.otpBox,
              pinCodeTextStyle: styles.otpText,
            }}
          />

          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity activeOpacity={0.7} onPress={onResend}>
                <Text style={styles.resendLink}>Kodni qayta yuborish</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>{secToMin(timer)}</Text>
            )}
          </View>

          {/* Yangi parol */}
          <Text style={[styles.label, { marginTop: rs(18) }]}>Yangi parol</Text>
          <View style={[styles.field, focused === 'p' && styles.fieldFocused]}>
            <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            <TextInput
              secureTextEntry={eye}
              placeholder={t('69')}
              placeholderTextColor={rd.color.textTertiary}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('p')}
              onBlur={() => setFocused(null)}
              style={styles.input}
              allowFontScaling={false}
            />
            <TouchableOpacity activeOpacity={0.7} onPress={() => setEye(!eye)}>
              {eye ? (
                <Eye color={rd.color.textSecondary} width={rs(22)} height={rs(22)} />
              ) : (
                <EyeClose color={rd.color.textSecondary} width={rs(22)} height={rs(22)} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: rs(14) }]}>Parolni tasdiqlang</Text>
          <View style={[styles.field, focused === 'c' && styles.fieldFocused]}>
            <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            <TextInput
              secureTextEntry={eye2}
              placeholder={t('72')}
              placeholderTextColor={rd.color.textTertiary}
              value={confirm}
              onChangeText={setConfirm}
              onFocus={() => setFocused('c')}
              onBlur={() => setFocused(null)}
              style={styles.input}
              allowFontScaling={false}
            />
            <TouchableOpacity activeOpacity={0.7} onPress={() => setEye2(!eye2)}>
              {eye2 ? (
                <Eye color={rd.color.textSecondary} width={rs(22)} height={rs(22)} />
              ) : (
                <EyeClose color={rd.color.textSecondary} width={rs(22)} height={rs(22)} />
              )}
            </TouchableOpacity>
          </View>

          {confirm.length > 0 && password !== confirm ? (
            <Text style={styles.errText}>Parollar bir xil bo‘lishi kerak</Text>
          ) : null}

          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.85}
            onPress={onSubmit}
            style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
          >
            <Text style={[styles.submitText, disabled && { color: rd.color.textTertiary }]}>
              {t('45')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RecoverySmsReset;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { flexGrow: 1, paddingHorizontal: rs(24), paddingBottom: rs(28) },
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
  hero: { alignItems: 'center', marginTop: rs(16), marginBottom: rs(22) },
  title: { fontFamily: rd.font.bold, fontSize: rs(22), color: rd.color.text, marginTop: rs(18) },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    lineHeight: rs(20),
    paddingHorizontal: rs(10),
  },
  phone: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text, marginTop: rs(10) },

  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  otpContainer: { marginTop: rs(2) },
  otpBox: {
    width: rs(54),
    height: rs(56),
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
  },
  otpText: { fontFamily: rd.font.bold, fontSize: rs(20), color: rd.color.text },

  resendRow: { alignItems: 'center', marginTop: rs(14) },
  resendLink: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.primary },
  timerText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.textTertiary },

  field: {
    height: rs(56),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  fieldFocused: { borderColor: rd.color.primary },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  errText: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.error,
    marginTop: rs(8),
    marginLeft: rs(4),
  },

  submitBtn: {
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
  submitBtnDisabled: { backgroundColor: rd.color.surfaceAlt, shadowOpacity: 0, elevation: 0 },
  submitText: { fontFamily: rd.font.semibold, fontSize: rs(16), color: rd.color.onPrimary },
});
