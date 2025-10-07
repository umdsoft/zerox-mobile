import {
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Button,
  Linking,
} from 'react-native';
import React, {useEffect, useMemo, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {normalize, style} from '../../theme/style';
import PhoneLoginImage from '../../images/phoneloginimage.svg';

import {useDispatch} from 'react-redux';
import Loading from '../components/Loading';
import {LoginWithPhoneSendPasswordApi} from '../../store/api/auth';

import {storage} from '../../store/api/token/getToken';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
import PhoneInput from '../components/PhoneInput';

import BackButton from '../components/BackButton';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import MainText from '../components/MainText';
import {colors} from '../../theme/colors';
import {fontSize} from '../../theme/font';
import {t} from 'i18next';
import * as yup from 'yup';
import {checkPhoneTime} from '../../helper/timeChecker';
import InputMask from '../components/InputMask';

const schema = yup.object().shape({
  phone: yup.string().required(t('10001')),
  password: yup.string().min(8, t('10001')).required(t('10001')),
});

const LoginWithPhone = () => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
        console.log('response', response);

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
              desc: t('10001', {count: response.attemptsLeft}),
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
                  {name: 'BottomTabNavigator', params: {token: response.token}},
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
            desc: t('10001', {count: e.attemptsLeft || 0}),
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
            desc: t('10001', {count: e.attemptsLeft || 0}),
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
  };

  const disabled = useMemo(() => {
    return phone.length === 9 && password.length >= 8 ? false : true;
  }, [phone, password]);

  if (loading) {
    return <Loading />;
  }
  console.log('phone', phone);

  return (
    <View style={[styles.container]}>
      <StatusBar animated={true} backgroundColor={style.blue} />
      <View
        style={[
          styles.BackButton,
          {marginTop: Platform.OS === 'android' ? 10 : normalize(10)},
        ]}>
        <BackButton
          navigation={navigation}
          IconColor="#fff"
          backgroundColor={style.blue}
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{width: style.width, height: style.height}}>
            <View
              style={{
                alignItems: 'center',
                flex: 0.6,
                justifyContent: 'center',
              }}>
              <PhoneLoginImage width="70%" height="70%" />
            </View>
            {/* <View style={{alignItems: 'center'}}>
              <MainText
                color={colors.black}
                size={fontSize[14]}
                style={[styles.enterText]}>
                Kirish
              </MainText>
            </View> */}
            <View style={styles.main}>
              <View>
                <InputMask
                  onChangeText={(formatted, extracted) => {
                    setPhone(extracted);
                  }}
                  value={phone}
                  icon={true}
                />
                {/* <PhoneInput
                  onChangeText={text => {
                    const digitsOnly = text.replace(/\D/g, '');
                    if (digitsOnly.length <= 9) {
                      setPhone(digitsOnly);
                    }
                  }}
                  max={13}
                  value={phone}
                  icon={true}
                /> */}
              </View>
            </View>
            <View style={styles.main}>
              <View>
                <View style={styles.TextInputLabelContainer}>
                  {/* <View style={styles.inputTitle}>
                  <Text style={styles.phoneText}>Parolni kiriting</Text>
                </View> */}
                  <View
                    style={{
                      flex: 1,
                      // backgroundColor: 'red',
                    }}>
                    <TextInput
                      secureTextEntry={eye}
                      placeholderTextColor={style.placeHolderColor}
                      placeholder={t('69')}
                      value={password}
                      onChangeText={text => {
                        setPassword(text);
                      }}
                      keyboardType="default"
                      style={[styles.TextInput, {paddingLeft: 15}]}
                    />
                    <View style={styles.eye}>
                      <TouchableOpacity
                        onPress={() => {
                          setEye(!eye);
                        }}
                        // style={styles.eye}
                      >
                        {eye ? (
                          <Eye color={style.blue} width={22} height={22} />
                        ) : (
                          <EyeClose color={style.blue} width={22} height={22} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.enterButtonContainer}>
              <TouchableOpacity
                disabled={disabled}
                activeOpacity={0.8}
                onPress={() => {
                  setError(false);
                  SendLogin();
                }}
                style={[
                  styles.enterButton,
                  {
                    backgroundColor: disabled
                      ? style.disabledButtonColor
                      : style.blue,
                  },
                ]}>
                <MainText
                  color={colors.white}
                  size={fontSize[16]}
                  style={[
                    styles.enterText,
                    {color: '#fff', fontFamily: style.fontFamilyMedium},
                  ]}>
                  {t('24')}
                </MainText>
              </TouchableOpacity>
            </View>
            <View style={{marginTop: 20}}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-evenly',
                }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setError(false);
                    navigation.navigate('UpdatePasswordWithJshir');
                    // navigation.navigate('EnterJsh');
                  }}>
                  <MainText
                    color={colors.blue}
                    size={fontSize[13]}
                    style={[styles.forgotPasswordText, {color: style.blue}]}>
                    {t('33')}
                  </MainText>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setError(false);
                    navigation.navigate('RegisterWithPeople', {type: 1});
                  }}
                  style={styles.registerButton}>
                  <MainText
                    color={colors.white}
                    size={fontSize[13]}
                    style={styles.forgotPasswordText}>
                    {t('36')}
                  </MainText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginWithPhone;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    // justifyContent: 'flex-end',
  },
  error: {
    color: 'red',
    fontFamily: style.fontFamilyMedium,
    textAlign: 'center',
    marginTop: 8,
    fontSize: fontSize[12],
  },
  eye: {
    position: 'absolute',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    paddingRight: 10,
  },
  BackButton: {
    position: 'absolute',
    marginLeft: 15,
    zIndex: 1,
    marginTop: Platform.OS === 'android' ? 40 : 0,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
    marginTop: 30,
  },
  registerButton: {
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 10,
    paddingBottom: 10,
    paddingTop: 10,
  },
  enterButtonContainer: {
    marginTop: 20,
  },
  main: {
    alignItems: 'center',
  },
  enterButton: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: style.buttonHeight,
    alignSelf: 'center',
  },
  enterText: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  phoneNumberText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
    marginLeft: 5,
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 5,
    fontSize: fontSize[14],
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
