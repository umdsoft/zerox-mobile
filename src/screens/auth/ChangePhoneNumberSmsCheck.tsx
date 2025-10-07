import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {normalize, style} from '../../theme/style';
import CheckSms from '../../images/changeNumber';
import Loading from '../components/Loading';
import OtherHeader from '../components/OtherHeader';
import {storage} from '../../store/api/token/getToken';
import axios from 'axios';
import {URL} from '../constants';
import Toast from 'react-native-toast-message';

import {useDispatch, useSelector} from 'react-redux';
import {HomeApi} from '../../store/api/home';
import {t} from 'i18next';
import {useTranslation} from 'react-i18next';
import {fontSize} from '../../theme';

import _BackgroundTimer from 'react-native-background-timer';
import {useKeepAwake} from '@sayem314/react-native-keep-awake';

import MainText from '../components/MainText';
import {secToMin} from '../other/SaveUserDetails';
import {OtpInput} from 'react-native-otp-entry';
import {
  getHash,
  removeListener,
  startOtpListener,
} from 'react-native-otp-verify';

const ChangePhoneNumberSmsCheck = () => {
  useKeepAwake();
  const route = useRoute();
  const dispatch = useDispatch();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const {phone} = route.params;
  const navigation = useNavigation();
  const {i18n} = useTranslation();

  const {user} = useSelector(state => state.HomeReducer);
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
      const {data} = await axios.post(
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
            Connection: 'close',
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
        dispatch(HomeApi({page: 1}));
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
    return (
      <View style={styles.timeContainer}>
        <MainText size={fontSize[12]} color={style.blue}>
          {secToMin(timer)}
        </MainText>
      </View>
    );
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
      const {data} = await axios.post(
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
            Connection: 'close',
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
      <OtherHeader
        title={t('702')}
        backgroundColor={style.blue}
        iconColor="#fff"
        titleColor="#000"
      />
      <View style={{flex: 1}}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{marginTop: normalize(90)}}>
            <View style={{alignItems: 'center'}}>
              <CheckSms />
            </View>

            <View style={styles.main}>
              <View>
                <View
                  style={[styles.TextInputLabelContainer, {marginBottom: 25}]}>
                  <View style={styles.retryPassword}>
                    <Text style={styles.phoneText}>{t('852')}</Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      width: '90%',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 50,
                    }}>
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
                      //  autoFocus={autoFocus}
                      autoFocus={false}
                      numberOfDigits={5}
                      theme={{
                        focusedPinCodeContainerStyle: {
                          borderColor: style.blue,
                          borderRadius: 20,
                        },
                        focusStickStyle: {
                          backgroundColor: style.blue,
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
                    {/* {renderInput} */}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.enterButtonContainer}>
              <TouchableOpacity
                disabled={disabled}
                activeOpacity={0.8}
                onPress={() => {
                  SendSmsCode();
                }}
                style={[
                  styles.enterButton,
                  {
                    backgroundColor: disabled
                      ? style.disabledButtonColor
                      : style.blue,
                  },
                ]}>
                <Text style={[styles.enterText, {color: '#fff'}]}>
                  {t('45')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footerContainer}>
              <View style={styles.footerInside}>
                <TouchableOpacity
                  onPress={() => {
                    resendSms();
                  }}
                  disabled={isRetry}
                  activeOpacity={0.8}
                  style={[]}>
                  <MainText
                    size={fontSize[12]}
                    color={isRetry ? style.disabledButtonColor : style.blue}>
                    {t('60')}
                  </MainText>
                </TouchableOpacity>
                {renderTimerView}
              </View>
            </View>
            {/* <View style={styles.footerContainer}>
              <View style={styles.footerInside}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.retryPasswordSend}
                >
                  <Text style={styles.retryPasswordText}>
                    Kodni qayta {'\n'} yuborish
                  </Text>
                </TouchableOpacity>
                <View style={styles.timeContainer}>
                  <Text style={styles.time}>02 : 00</Text>
                </View>
              </View>
            </View> */}
          </View>
        </ScrollView>
      </View>
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default ChangePhoneNumberSmsCheck;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  error: {
    color: 'red',
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
  },
  time: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  TextInput: {
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
  timeContainer: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  retryPasswordText: {
    fontSize: style.fontSize.small - 1,
    color: '#fff',
    fontFamily: style.fontFamilyMedium,
    textAlign: 'center',
  },
  retryPasswordSend: {
    borderRadius: 6,
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    padding: 10,
    marginRight: 20,
  },
  footerInside: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterButtonContainer: {
    marginTop: 5,
  },
  footerContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
  },
  phoneNumberText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
    textAlign: 'center',
  },
  retryPassword: {
    // position: 'absolute',
    // marginLeft: 15,
    // flex: 1,
    // zIndex: 1,
    // top: -10,
    // backgroundColor: '#fff',
    // paddingLeft: 5,
    // paddingRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    // position: 'absolute',
  },

  TextInputLabelContainer: {
    // borderColor: style.textColor,
    // borderWidth: 0.5,
    // borderRadius: 6,
    width: '100%',
    // flexDirection: 'row',
  },

  main: {
    alignItems: 'center',
    marginTop: 20,
  },
  enterButton: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    height: style.textInputHeight,
    alignSelf: 'center',
  },
  enterText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
  },
});
