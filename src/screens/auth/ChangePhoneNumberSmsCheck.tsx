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
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Svg, { Path } from 'react-native-svg';

import _BackgroundTimer from 'react-native-background-timer';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import { OtpInput } from 'react-native-otp-entry';
import {
  getHash,
  removeListener,
  startOtpListener,
} from 'react-native-otp-verify';

import Loading from '../components/Loading';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import { HomeApi } from '../../store/api/home';
import { normalize } from '../../theme/style';
import { secToMin } from '../other/SaveUserDetails';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft } from '../home/redesign/icons';

// Hero uchun xabar (SMS) ikonasi — Feather uslubi.
const MessageIcon = ({ size = rs(34), color = rd.color.primary }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const ChangePhoneNumberSmsCheck = () => {
  useKeepAwake();
  const route = useRoute();
  const dispatch = useDispatch();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const { phone } = route.params;
  const navigation = useNavigation();
  const { i18n } = useTranslation();

  const { user } = useSelector(state => state.HomeReducer);
  const [timer, setTimer] = useState(120);
  const [isRetry, setIsRetry] = useState(true);
  const [autoFocus, setAutoFocus] = useState(false);

  let timerRef = useRef<number | null>(null);

  const refI = useRef(null);

  const SendSmsCode = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      Keyboard.dismiss();
      const { data } = await axios.post(
        URL + '/user/rephone',
        {
          phone: phone,
          step: 2,
          code: code,
          lang: i18n.language,
          oldPhone: user?.data?.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(data);

      if (data.success && data.msg === 'success') {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'omad',
          props: {
            title: 'Muvaffaqiyatli',
            desc: t("Sizning telefon raqamingiz o'zgartirildi"),
          },
        });
        dispatch(HomeApi({ page: 1 }));
        setTimeout(() => {
          navigation.navigate('BottomTabNavigator');
        }, 2000);
      }
      if (data.success === true && data.msg === 'no-code') {
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
      if (data.success === false && data.message === 'code-expired') {
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
      }
      setLoading(false);
    } catch (error) {
      setCode('');
      console.log(error);
      setLoading(false);
    }
  }, [code, dispatch, i18n.language, navigation, phone, user?.data?.phone]);

  useEffect(() => {
    if (code.length === 5) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [code]);

  const renderTimerView = useMemo(() => {
    return <Text style={styles.timerText}>{secToMin(timer)}</Text>;
  }, [timer]);

  const startTimer = useCallback(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps

    timerRef.current = _BackgroundTimer.setInterval(() => {
      setTimer(v => {
        if (v === 0) {
          _BackgroundTimer.clearInterval(timerRef.current!);
          _BackgroundTimer.stopBackgroundTimer();
          _BackgroundTimer.stop();

          setIsRetry(false);
          return 120;
        } else {
          return v - 1;
        }
      });
    }, 1000);
  }, []);

  const resendSms = async () => {
    try {
      setIsRetry(true);
      startTimer();
      setAutoFocus(true);
      const token = storage.getString('token');
      const { data } = await axios.post(
        URL + '/user/rephone',
        {
          phone: phone.replace(/\s/g, ''),
          step: 1,
          lang: i18n.language,
          user: user?.data?.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('Resend SMS data:', data);
      if (data.success) {
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
      } else {
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

      // eslint-disable-next-line no-catch-shadow
    } catch (err) {
      setCode('');
      setIsRetry(true);

      throw err;
    }
  };

  useEffect(() => {
    startTimer();
    return () => {
      _BackgroundTimer.clearInterval(timerRef.current!);
      _BackgroundTimer.stopBackgroundTimer();
      _BackgroundTimer.stop();
    };
  }, [startTimer]);

  useEffect(() => {
    getHash()
      .then(hash => {
        console.log('hash', hash);
        // use this hash in the message.
      })
      .catch(console.log);

    startOtpListener(message => {
      const otp = message.match(/\b\d{5}\b/);

      if (otp && otp[0]) {
        setCode(otp[0]);
        refI.current?.setValue(otp[0]);
      }
    });
    return () => removeListener();
  }, []);

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
            <View style={styles.heroCircle}>
              <MessageIcon size={rs(34)} color={rd.color.primary} />
            </View>
            <Text style={styles.title}>{t('702')}</Text>
            <Text style={styles.subtitle}>{t('852')}</Text>
            <Text style={styles.phone}>{phone}</Text>
          </View>

          {/* Kod kiritish */}
          <View style={styles.otpContainer}>
            <OtpInput
              ref={refI}
              onTextChange={text => {
                setCode(text);
              }}
              textInputProps={{
                value: code,
              }}
              onFocus={() => {
                setAutoFocus(true);
              }}
              autoFocus={false}
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
              onPress={() => {
                resendSms();
              }}
              disabled={isRetry}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.resendLink,
                  isRetry && { color: rd.color.textTertiary },
                ]}
              >
                {t('60')}
              </Text>
            </TouchableOpacity>
            {isRetry && renderTimerView}
          </View>

          {/* Tasdiqlash */}
          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.85}
            onPress={() => {
              SendSmsCode();
            }}
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

export default ChangePhoneNumberSmsCheck;

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
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(18),
  },
  title: { fontFamily: rd.font.bold, fontSize: rs(24), color: rd.color.text },
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
