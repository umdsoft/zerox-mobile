/**
 * RecoverySmsReset — SMS orqali parol tiklash (identifikatsiyadan O'TMAGAN foydalanuvchi).
 *
 * STEP-BY-STEP oqim:
 *  1-QADAM: telefonga SMS kod yuboriladi (POST /user/recovery/send-sms) → foydalanuvchi 5 xonali
 *           kodni kiritadi → kod SERVER'da tekshiriladi (POST /user/recovery/verify-code).
 *           Kod to'g'ri bo'lsagina 2-qadam ochiladi (parol oldindan so'ralmaydi).
 *  2-QADAM: yangi parol + tasdiq → POST /user/recovery/verify-sms (kod qayta tekshiriladi +
 *           parol o'rnatiladi + kod bir martalik tozalanadi) → LoginWithPhone.
 *
 * Kirish: UpdatePasswordWithJshir → check-user code 1 (PINFL yo'q) → bu ekran.
 * Identifikatsiyadan O'TGAN (code 2) foydalanuvchi bu ekranga TUSHMAYDI — u JSHSHIR + MyID orqali.
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
import Svg, { Polyline } from 'react-native-svg';
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

// Backend javob kodini (0-6) foydalanuvchi xabariga aylantiramiz. Backend code 1/2/3 ni HTTP 200,
// code 4 (zaif parol)/6 (to'liq emas) ni HTTP 400 bilan qaytaradi — shuning uchun bu map ikkala
// joyda (200-body va catch response.data.code) ishlatiladi.
const errDesc = (code: any): string => {
  switch (Number(code)) {
    case 0:
      return t('Bu telefon raqami ro‘yxatdan o‘tmagan.');
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

const toastErr = (desc: string) =>
  Toast.show({
    type: 'error2',
    position: 'bottom',
    autoHide: true,
    visibilityTime: 3000,
    props: { title: t('Xatolik'), desc },
  });

// Kichik "check" ikonka — parol checklist uchun (bajarilgan shart yashil ✓).
const Check = ({ color }: { color: string }) => (
  <Svg
    width={rs(12)}
    height={rs(12)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const RecoverySmsReset = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone: string = route.params?.phone || '';

  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // Parol validatsiyasi — UpdatePassword (identifikatsiyadan o'tgan tiklash) bilan bir xil.
  const [validation, setValidation] = useState({
    lower: false,
    upper: false,
    number: false,
    symbol: false,
    minLength: false,
    noSpace: true,
  });
  const [eye, setEye] = useState(true);
  const [eye2, setEye2] = useState(true);
  const [loading, setLoading] = useState(false); // 2-qadam submit (to'liq ekran)
  const [verifying, setVerifying] = useState(false); // 1-qadam tugma spinneri
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

  // Tiklash SMS'ini yuborish (ochilganda + qayta yuborishda). Backend endi SMS haqiqatan
  // ketmasa xato qaytaradi (502) → catch ishlaydi, taймer boshlanmaydi.
  const sendSms = useCallback(async () => {
    try {
      await axios.post(
        URL + '/user/recovery/send-sms',
        { phone: '+998' + phone },
        { headers: { 'Content-Type': 'application/json' } },
      );
      startTimer();
    } catch (e: any) {
      const c = e?.response?.data?.code;
      toastErr(
        Number(c) === 3
          ? errDesc(3)
          : t('SMS yuborilmadi. Birozdan so‘ng qayta urinib ko‘ring.'),
      );
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

  // 1-QADAM: kodni server'da tekshirish. To'g'ri bo'lsa 2-qadamga o'tamiz.
  // theCode — OtpInput.onFilled bergan matn (state hali yangilanmagan bo'lishi mumkin);
  // tugmadan chaqirilganda esa state'dagi `code` ishlatiladi.
  const onVerifyCode = useCallback(async (theCode?: string) => {
    const c = typeof theCode === 'string' ? theCode : code;
    if (c.length !== CODE_LENGTH || verifying) return;
    try {
      setVerifying(true);
      const { data } = await axios.post(
        URL + '/user/recovery/verify-code',
        { phone: '+998' + phone, code: c },
        { headers: { 'Content-Type': 'application/json' } },
      );
      setVerifying(false);
      if (data?.success) {
        Toast.show({
          type: 'omad',
          position: 'bottom',
          autoHide: true,
          visibilityTime: 2000,
          props: { title: t('243'), desc: t('SMS kod tasdiqlandi') },
        });
        setStep(2);
        return;
      }
      setCode('');
      otpRef.current?.clear?.();
      toastErr(errDesc(data?.code));
    } catch (e: any) {
      setVerifying(false);
      const c = e?.response?.data?.code;
      setCode('');
      otpRef.current?.clear?.();
      toastErr(c != null ? errDesc(c) : t('Serverga ulanishda xatolik yuz berdi'));
    }
  }, [code, verifying, phone]);

  // 2-QADAM: parol validatsiyasi (real-time) — UpdatePassword bilan bir xil talablar.
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setValidation(prev => ({
      ...prev,
      lower: /[\p{Ll}]/u.test(text), // kichik harf
      upper: /[\p{Lu}]/u.test(text), // katta harf
      number: /\p{Nd}/u.test(text), // raqam
      symbol: /[^\p{L}\p{Nd}\s]/u.test(text), // belgi
      minLength: text.length >= 8,
      noSpace: !/\s/.test(text),
    }));
  };
  const isFormValid = useMemo(
    () => Object.values(validation).every(Boolean) && password === confirm,
    [validation, password, confirm],
  );

  const onSubmit = useCallback(async () => {
    if (!isFormValid || loading) return;
    try {
      setLoading(true);
      const { data } = await axios.post(
        URL + '/user/recovery/verify-sms',
        { phone: '+998' + phone, code, new_password: password },
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
      // Kod muddati tugagan bo'lsa 1-qadamga qaytaramiz (qayta yuborish uchun).
      if (Number(data?.code) === 2) {
        setStep(1);
        setCode('');
        otpRef.current?.clear?.();
      }
      toastErr(errDesc(data?.code));
    } catch (e: any) {
      setLoading(false);
      const c = e?.response?.data?.code;
      toastErr(c != null ? errDesc(c) : t('Serverga ulanishda xatolik yuz berdi'));
    }
  }, [isFormValid, loading, phone, code, password, navigation]);

  const onBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      return;
    }
    navigation.goBack();
  }, [step, navigation]);

  // Parol talablari checklist (real-time yashil ✓) — UpdatePassword bilan bir xil.
  const renderValidation = useMemo(
    () => (
      <View style={styles.checklist}>
        {[
          { label: t('78'), valid: validation.minLength },
          { label: t('81'), valid: validation.lower },
          { label: t('75'), valid: validation.upper },
          { label: t('84'), valid: validation.number },
          { label: t('87'), valid: validation.symbol },
          { label: t('90'), valid: validation.noSpace },
          {
            label: t('Yangi parollar mos kelmayapti'),
            valid: password.length > 0 && password === confirm,
          },
        ].map(({ label, valid }, index) => (
          <View style={styles.validationItem} key={index}>
            <View style={[styles.checkDot, valid ? styles.checkDotOn : styles.checkDotOff]}>
              <Check color={valid ? rd.color.onPrimary : rd.color.textTertiary} />
            </View>
            <Text
              style={[styles.validationText, { color: valid ? rd.color.success : rd.color.textTertiary }]}
              allowFontScaling={false}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    ),
    [validation, password, confirm],
  );

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
          <TouchableOpacity activeOpacity={0.8} style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>

          {/* Step indikator */}
          <View style={styles.steps}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepBar, step === 2 && styles.stepBarActive]} />
            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
          </View>

          <View style={styles.hero}>
            <GradientIconBadge size={rs(84)}>
              {step === 1 ? (
                <MessageIcon size={rs(34)} color={rd.color.primary} />
              ) : (
                <LockIcon size={rs(34)} color={rd.color.primary} />
              )}
            </GradientIconBadge>
            <Text style={styles.title}>
              {step === 1 ? t('SMS orqali tiklash') : t('Yangi parol')}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? t('Telefon raqamingizga yuborilgan kodni kiriting')
                : t('Hisobingiz uchun yangi parol o‘rnating')}
            </Text>
            {step === 1 ? <Text style={styles.phone}>+998 {phone}</Text> : null}
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.label}>{t('Tasdiqlash kodi')}</Text>
              <OtpInput
                ref={otpRef}
                numberOfDigits={CODE_LENGTH}
                onTextChange={setCode}
                onFilled={text => onVerifyCode(text)}
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
                    <Text style={styles.resendLink}>{t('Kodni qayta yuborish')}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>{secToMin(timer)}</Text>
                )}
              </View>

              <TouchableOpacity
                disabled={code.length !== CODE_LENGTH || verifying}
                activeOpacity={0.85}
                onPress={() => onVerifyCode()}
                style={[
                  styles.submitBtn,
                  (code.length !== CODE_LENGTH || verifying) && styles.submitBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.submitText,
                    (code.length !== CODE_LENGTH || verifying) && { color: rd.color.textTertiary },
                  ]}
                >
                  {verifying ? t('Tekshirilmoqda…') : t('Davom etish')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>{t('Yangi parol')}</Text>
              <View style={[styles.field, focused === 'p' && styles.fieldFocused]}>
                <LockIcon size={rs(20)} color={rd.color.textTertiary} />
                <TextInput
                  secureTextEntry={eye}
                  placeholder={t('69')}
                  placeholderTextColor={rd.color.textTertiary}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={() => setFocused('p')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
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

              <Text style={[styles.label, { marginTop: rs(14) }]}>{t('Parolni tasdiqlang')}</Text>
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

              {renderValidation}

              <TouchableOpacity
                disabled={!isFormValid}
                activeOpacity={0.85}
                onPress={onSubmit}
                style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
              >
                <Text style={[styles.submitText, !isFormValid && { color: rd.color.textTertiary }]}>
                  {t('45')}
                </Text>
              </TouchableOpacity>
            </>
          )}
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

  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: rs(16), gap: rs(6) },
  stepDot: { width: rs(9), height: rs(9), borderRadius: rs(5), backgroundColor: rd.color.border },
  stepDotActive: { backgroundColor: rd.color.primary },
  stepBar: { width: rs(34), height: rs(3), borderRadius: rs(2), backgroundColor: rd.color.border },
  stepBarActive: { backgroundColor: rd.color.primary },

  hero: { alignItems: 'center', marginTop: rs(14), marginBottom: rs(22) },
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

  checklist: { marginTop: rs(18), gap: rs(10) },
  validationItem: { flexDirection: 'row', alignItems: 'center' },
  checkDot: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(10),
  },
  checkDotOn: { backgroundColor: rd.color.success },
  checkDotOff: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
  },
  validationText: { fontFamily: rd.font.medium, fontSize: rs(13), flex: 1 },

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
