import {
  Keyboard,
  Platform,
  StyleSheet,
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
import ScreenLayout from '../components/ScreenLayout';
import Button from '../components/Button';
import MainText from '../components/MainText';
import CheckSms from '../../images/changeNumber';

// Utils
import { normalize, style } from '../../theme/style';
import { secToMin } from '../other/SaveUserDetails';
import { fontSize } from '../../theme/font';

// API
import { SmsCheckCodeApi, UserDataPostApi } from '../../store/api/auth';
import { OtpInput } from 'react-native-otp-entry';
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
        UserDataPostApi(phone.replace(/\s/g, '')),
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
    getHash()
      .then(hash => {
        console.log('hash', hash);
        // use this hash in the message.
      })
      .catch(console.log);

    startOtpListener(message => {
      const otp = message.match(/\b\d{5}\b/);
      console.log('otp', otp);
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
      <View style={styles.timerContainer}>
        <MainText size={fontSize[12]} color={style.blue}>
          {secToMin(timer)}
        </MainText>
      </View>
    ),
    [timer],
  );

  console.log(code, 'code');

  if (loading) {
    return <Loading />;
  }

  return (
    <ScreenLayout
      title={t('36')}
      headerColor={style.blue}
      headerIconColor="#fff"
      headerTitleColor="#000"
      background={false}
      contentStyle={styles.scrollContent}
    >
      <View style={styles.content}>
          <View style={styles.illustrationContainer}>
            <CheckSms />
          </View>

          <View style={styles.mainContent}>
            <View style={styles.instructionContainer}>
              <MainText textAlign="center" size={fontSize[12]}>
                {t('54')}
              </MainText>
            </View>

            <View style={styles.otpContainer}>
              <OtpInput
                textInputProps={{
                  textContentType: 'oneTimeCode',
                  autoComplete: 'sms-otp',
                }}
                onTextChange={text => {
                  setCode(text);
                }}
                // textInputProps={{
                //   onPress: () => {
                //     inputRefs.current?.focus();
                //   },
                // }}
                // autoFocus={autoFocus}
                autoFocus={false}
                ref={inputRefs}
                onFocus={() => {
                  setAutoFocus(true);
                }}
                type="numeric"
                numberOfDigits={5}
                theme={{
                  focusedPinCodeContainerStyle: {
                    borderColor: style.blue,
                    borderRadius: 20,
                  },
                  focusStickStyle: {
                    backgroundColor: style.blue,
                    borderRadius: 20,
                  },

                  pinCodeContainerStyle: {
                    marginHorizontal: 5,
                    width: normalize(45),
                    height: normalize(60),
                    borderRadius: 20,
                  },
                  pinCodeTextStyle: {
                    fontFamily: style.fontFamilyMedium,
                    color: style.textColor,
                  },
                }}
              />
            </View>

            <Button
              title={t('45')}
              onPress={handleSubmitCode}
              disabled={code.length !== CODE_LENGTH}
              style={{ marginTop: 20 }}
            />

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleResendSms}
                disabled={!isRetryEnabled}
              >
                <MainText
                  size={fontSize[12]}
                  color={
                    isRetryEnabled ? style.blue : style.disabledButtonColor
                  }
                >
                  {t('60')}
                </MainText>
              </TouchableOpacity>
              {renderTimer}
            </View>
          </View>
        </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    marginTop: normalize(70),
  },
  illustrationContainer: {
    alignItems: 'center',
  },
  mainContent: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 40,
  },
  instructionContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    alignItems: 'center',
  },
  otpInput: {
    width: normalize(45),
    height: normalize(60),
    fontSize: fontSize[22],
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    borderRadius: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: style.blue,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  timerContainer: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginLeft: 5,
  },
});

export default CheckSmsPassword;
