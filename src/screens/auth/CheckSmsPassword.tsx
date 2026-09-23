import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigation, useRoute, StackActions } from '@react-navigation/native';
import BackgroundTimer from 'react-native-background-timer';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { useDispatch, useSelector } from 'react-redux';

// Components
import Loading from '../components/Loading';
import { OtpInput } from 'react-native-otp-entry';
import { GradientIconBadge } from '../components/BrandLockup';
import Svg, { Path, Polyline } from 'react-native-svg';

// Utils
import { normalize } from '../../theme/style';
import { secToMin } from '../other/SaveUserDetails';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft } from '../home/redesign/icons';

// TASDIQLASH KODI ikonasi — qalqon + belgi (kod tasdiqlandi/xavfsiz). Suhbat
// pufakchasi o'rniga (so'rov bo'yicha — "tasdiqlash kodini kiritishni" ifodalaydi).
const SmsCheckIcon = ({ size = 46, color = rd.color.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.5 L19.5 5.4 V11 C19.5 15.9 16.2 19.4 12 21.4 C7.8 19.4 4.5 15.9 4.5 11 V5.4 Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="8.6 11.4 10.9 13.8 15.4 9"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// API
import { SmsCheckCodeApi, RegisterResendSmsApi } from '../../store/api/auth';
import {
  getHash,
  removeListener,
  startOtpListener,
} from 'react-native-otp-verify';

const CODE_LENGTH = 5;

// Resend xato xabarini foydalanuvchi tushunadigan matnга aylantiradi (texnik xom
// kodlar — "database-error", "ip-blocked", "network-error" — chiqmasin).
const resendErrMsg = (m?: string): string => {
  if (m === 'ip-blocked')
    return t('Juda ko‘p urinish aniqlandi. Iltimos, biroz vaqtdan so‘ng qayta urinib ko‘ring.');
  if (m === 'user-already-exist')
    return t('Bu telefon raqami allaqachon ro‘yxatdan o‘tgan.');
  // Faqat TAYYOR (chiroyli) jumla — bo'shliqli matn — o'zini ko'rsatamiz (masalan SMS
  // rate-limit "Juda ko'p SMS so'rovi..."). Texnik kod (bo'shliqsiz kebab-case) bo'lsa
  // umumiy xabar: "database-error"/"code-exit" kabilar foydalanuvchiga chiqmaydi.
  if (typeof m === 'string' && /\s/.test(m.trim()))
    return m;
  return t('Kod yuborishda xatolik. Birozdan so‘ng qayta urinib ko‘ring.');
};

const CheckSmsPassword = () => {
  useKeepAwake();

  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { phone } = route.params;

  // OTP input imperative handle (setValue) — SMS avtomatik to'ldirish uchun.
  const inputRefs = useRef<any>(null);

  // State
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(120);
  const [isRetryEnabled, setIsRetryEnabled] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [autoFocus, setAutoFocus] = useState(false);

  // Redux state
  const { loading, error } = useSelector(
    state => state.RegisterWithPeopleCheckSmsCodeReducer,
  );

  // Timer management
  const startTimer = useCallback(() => {
    setIsRetryEnabled(false);
    setTimer(120);

    if (timerRef.current) {
      BackgroundTimer.clearInterval(timerRef.current);
    }

    timerRef.current = BackgroundTimer.setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          BackgroundTimer.clearInterval(timerRef.current!);
          setIsRetryEnabled(true);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      BackgroundTimer.clearInterval(timerRef.current);
      BackgroundTimer.stopBackgroundTimer();
    }
  }, []);

  // Initialize timer on mount
  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [startTimer, stopTimer]);

  // Handle code submission
  const handleSubmitCode = async () => {
    try {
      Keyboard.dismiss();
      const response = await dispatch(
        SmsCheckCodeApi({ phone: phone, code: code }),
      ).unwrap();

      if (response.success) {
        stopTimer();
        // NAV-FIX: `navigate` EMAS, `replace`. SMS kodi ALLAQACHON ISHLATILGAN —
        // CreatePassword'dan orqaga bosilganda shu ekranga qaytish mumkin emas
        // (eski kod bilan qayta tasdiqlab bo'lmaydi, foydalanuvchi tiqilib qoladi).
        navigation.dispatch(StackActions.replace('CreatePassword', { phone: phone, code: code }));
      } else if (response.message === 'code-exit') {
        setCode('');
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            desc: t('738'),
          },
          visibilityTime: 3000,
          autoHide: true,
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
        return;
      } else if (response.message === 'code-expired') {
        setCode('');
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            desc: t('expired'),
          },
          visibilityTime: 3000,
          autoHide: true,
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
        return;
      }
    } catch (err) {
      setCode('');
      Toast.show({
        type: 'error2',
        position: 'bottom',
        props: {
          desc: t('738'),
        },
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 5 : normalize(50),
      });
    }
  };

  // Handle SMS resend — backend `/user/register step:1` kodni qayta generatsiya qilib
  // SMS yuboradi (User.js: is_active==2 && code!=null bo'lsa). Muvaffaqiyat -> yangi
  // kod + timer qayta boshlanadi. Toastlar sarlavhasiz (yagona bold matn).
  const handleResendSms = async () => {
    try {
      const response = await dispatch(
        RegisterResendSmsApi(phone.replace(/\s/g, '')),
      ).unwrap();

      if (response?.success) {
        setCode('');
        startTimer();
        setAutoFocus(true);
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'omad',
          props: {
            desc: t('Tasdiqlash kodi qayta yuborildi'),
          },
        });
      } else {
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            desc: resendErrMsg(response?.message),
          },
          visibilityTime: 3000,
          autoHide: true,
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
      }
    } catch (err: any) {
      console.error('Error resending SMS:', err);
      Toast.show({
        type: 'error2',
        position: 'bottom',
        props: {
          desc: resendErrMsg(err?.message),
        },
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 5 : normalize(50),
      });
    }
  };

  useEffect(() => {
    // SMS Retriever hash (Android auto-read uchun); xato bo'lsa jim o'tamiz.
    getHash().catch(() => {});

    startOtpListener(message => {
      const otp = message.match(/\b\d{5}\b/);
      if (otp && otp[0]) {
        setCode(otp[0]);
        inputRefs.current?.setValue(otp[0]);
      }
    });
    return () => removeListener();
  }, []);

  // Render timer component
  const renderTimer = useMemo(
    () => (
      <Text
        style={styles.timerText}
        numberOfLines={1}
        allowFontScaling={false}>
        {secToMin(timer)}
      </Text>
    ),
    [timer],
  );

  const disabled = code.length !== CODE_LENGTH;

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
            <ChevronLeft size={rs(22)} color={rd.color.onPrimary} />
          </TouchableOpacity>

          {/* Hero — SMS tasdiqlash ikonasi (kattaroq) + faqat ko'rsatma matni.
              "Ro'yxatdan o'tish" sarlavhasi va telefon raqami OLIB TASHLANDI (so'rov bo'yicha). */}
          <View style={styles.hero}>
            <GradientIconBadge size={rs(116)}>
              <SmsCheckIcon size={rs(56)} color={rd.color.primary} />
            </GradientIconBadge>
            <Text style={styles.subtitle}>{t('54')}</Text>
          </View>

          {/* Kod kiritish */}
          <View style={styles.otpContainer}>
            <OtpInput
              textInputProps={{
                textContentType: 'oneTimeCode',
                autoComplete: 'sms-otp',
              }}
              onTextChange={text => {
                setCode(text);
              }}
              autoFocus={false}
              ref={inputRefs}
              onFocus={() => {
                setAutoFocus(true);
              }}
              type="numeric"
              numberOfDigits={5}
              theme={{
                focusedPinCodeContainerStyle: {
                  borderColor: rd.color.primary,
                  backgroundColor: rd.color.surface,
                  borderWidth: 1.5,
                  borderRadius: rd.radius.lg,
                },
                focusStickStyle: {
                  backgroundColor: rd.color.primary,
                  borderRadius: rd.radius.pill,
                },
                pinCodeContainerStyle: {
                  marginHorizontal: rs(5),
                  width: rs(52),
                  height: rs(60),
                  borderRadius: rd.radius.lg,
                  borderWidth: 1.5,
                  borderColor: rd.color.border,
                  backgroundColor: rd.color.surface,
                },
                pinCodeTextStyle: {
                  fontFamily: rd.font.semibold,
                  fontSize: rs(22),
                  color: rd.color.text,
                },
              }}
            />
          </View>

          {/* Timer / qayta yuborish */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResendSms}
              disabled={!isRetryEnabled}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.resendLink,
                  !isRetryEnabled && { color: rd.color.textTertiary },
                ]}
              >
                {t('60')}
              </Text>
            </TouchableOpacity>
            {!isRetryEnabled && renderTimer}
          </View>

          {/* Tasdiqlash */}
          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.85}
            onPress={handleSubmitCode}
            style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
          >
            <Text
              style={[
                styles.submitText,
                disabled && { color: rd.color.textTertiary },
              ]}
            >
              {t('45')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CheckSmsPassword;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
    paddingBottom: rs(28),
  },
  // Orqaga tugma — KO'K (so'rov bo'yicha).
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(8),
  },

  // Ikona kattaroq -> kontent (5 kod card + resend + davom) yanada pastroq.
  hero: { alignItems: 'center', marginTop: rs(56), marginBottom: rs(64) },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(24),
    color: rd.color.text,
    marginTop: rs(18),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(18),
    lineHeight: rs(20),
    paddingHorizontal: rs(16),
  },
  phone: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    marginTop: rs(6),
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rs(4),
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    marginTop: rs(22),
  },
  // Timer QAT'IY kenglikda + teng-enli raqamlar (tabular-nums) + 1 QATOR — raqam
  // o'zgarganda "Kodni qayta yuborish" surilmasin VA timer 2-qatorga tushmasin.
  // Shrift subtitle ("Telefon raqamingizga...") bilan bir xil o'lchamda (rs14) —
  // ilgari rs13.5 kichik ko'rinardi (yoshi kattalar uchun).
  timerText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.primary,
    minWidth: rs(54),
    textAlign: 'left',
    fontVariant: ['tabular-nums'],
  },
  resendLink: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.primary,
  },

  submitBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(28),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: rd.color.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
