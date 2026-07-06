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
import { useNavigation, useRoute } from '@react-navigation/native';
import BackgroundTimer from 'react-native-background-timer';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { useDispatch, useSelector } from 'react-redux';

// Components
import Loading from '../components/Loading';
import { OtpInput } from 'react-native-otp-entry';
import { GradientIconBadge } from '../components/BrandLockup';

// Utils
import { normalize } from '../../theme/style';
import { secToMin } from '../other/SaveUserDetails';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, MessageIcon } from '../home/redesign/icons';

// API
import { SmsCheckCodeApi, RegisterResendSmsApi } from '../../store/api/auth';
import {
  getHash,
  removeListener,
  startOtpListener,
} from 'react-native-otp-verify';

const CODE_LENGTH = 5;

const CheckSmsPassword = () => {
  useKeepAwake();

  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { phone } = route.params;

  // Refs for OTP input fields
  const inputRefs = useRef<null[]>([]);

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
        navigation.navigate('CreatePassword', { phone: phone, code: code });
      } else if (response.message === 'code-exit') {
        setCode('');
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            title: 'Xatolik!',
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
            title: 'Xatolik!',
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
          title: 'Xatolik!',
          desc: t('738'),
        },
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 5 : normalize(50),
      });
    }
  };

  // Handle SMS resend
  const handleResendSms = async () => {
    try {
      const response = await dispatch(
        RegisterResendSmsApi(phone.replace(/\s/g, '')),
      ).unwrap();

      if (response.success) {
        setIsRetryEnabled(true);
        startTimer();
        setAutoFocus(true);
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'omad',
          props: {
            title: 'Muvaffaqiyatli',
            desc: t('Tasdiqlash kodi qayta yuborildi'),
          },
        });
      }

      if (!response.success) {
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            desc: t('Xatolik!'),
          },
          visibilityTime: 3000,
          autoHide: true,
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
      }
    } catch (err) {
      console.error('Error resending SMS:', err);
      setCode('');
      Toast.show({
        type: 'error2',
        position: 'bottom',
        props: {
          desc: t('Xatolik!'),
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
    () => <Text style={styles.timerText}>{secToMin(timer)}</Text>,
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
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <GradientIconBadge size={rs(84)}>
              <MessageIcon size={rs(34)} color={rd.color.primary} />
            </GradientIconBadge>
            <Text style={styles.title}>{t('36')}</Text>
            <Text style={styles.subtitle}>{t('54')}</Text>
            <Text style={styles.phone}>{phone}</Text>
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

  hero: { alignItems: 'center', marginTop: rs(24), marginBottom: rs(32) },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(24),
    color: rd.color.text,
    marginTop: rs(18),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
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
  timerText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.primary,
  },
  resendLink: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
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
