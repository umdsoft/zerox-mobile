import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useState} from 'react';

import OtherHeader from '../components/OtherHeader';
import {t} from 'i18next';
import {normalize, style} from '../../theme/style';
import {font, fontSize} from '../../theme/font';
import ResetPassword from '../../images/RecoveryPassword';
import MainText from '../components/MainText';
import {colors} from '../../theme/colors';
import {storage} from '../../store/api/token/getToken';
import {LoginWithPhoneSendPasswordApi} from '../../store/api/auth';
import Toast from 'react-native-toast-message';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
import {toastConfig} from '../components/ToastConfig';

const ResetPassCode = () => {
  const {params} = useRoute();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [eye, setEye] = useState(true);
  const navigation = useNavigation();
  const onHandle = useCallback(async () => {
    const phoneNumber = storage.getString('phoneNumber');
    console.log(phoneNumber);
    if (phoneNumber !== undefined) {
      setLoading(true);

      try {
        const response = await dispatch(
          LoginWithPhoneSendPasswordApi({
            phone: phoneNumber,
            password: value,
          }),
        ).unwrap();
        if (response.success) {
          navigation.navigate('UpdateLocalPassCode');
        } else {
          Toast.show({
            type: 'error2',
            position: 'top',
            props: {title: 'Xatolik!', desc: t('resetpas')},
            visibilityTime: 3000,
            autoHide: true,
            topOffset: Platform.OS === 'android' ? 5 : normalize(50),
          });
        }
        setLoading(false);
      } catch (error) {
        Toast.show({
          type: 'error2',
          position: 'top',
          props: {title: 'Xatolik!', desc: t('resetpas')},
          visibilityTime: 3000,
          autoHide: true,
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
        setLoading(false);
      }
    } else {
      Toast.show({
        type: 'error2',
        position: 'top',
        props: {title: 'Xatolik!', desc: "Iltimos, qaytadan urinib ko'ring"},
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 5 : normalize(50),
      });
    }
  }, [dispatch, navigation, value]);
  return (
    <View style={styles.flex}>
      <OtherHeader
        title={t('PIN-kodni tiklash')}
        titleColor={'#000'}
        iconColor="#fff"
        backgroundColor={style.blue}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={{alignSelf: 'center', marginTop: 20, marginBottom: 20}}>
            <ResetPassword />
          </View>

          <View style={styles.TextInputLabelContainer}>
            <View
              style={{
                flex: 1,
              }}>
              <TextInput
                secureTextEntry={eye}
                placeholderTextColor={style.placeHolderColor}
                placeholder={t('69')}
                value={value}
                onChangeText={text => {
                  setValue(text);
                }}
                keyboardType="default"
                style={[styles.TextInput, {paddingLeft: 15}]}
                allowFontScaling={false} />

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

          <View style={styles.enterButtonContainer}>
            <TouchableOpacity
              disabled={value.length >= 6 ? false : true}
              activeOpacity={0.8}
              onPress={onHandle}
              style={[
                styles.enterButton,
                {
                  backgroundColor:
                    value.length >= 6 ? style.blue : style.disabledButtonColor,
                },
              ]}>
              {loading ? (
                <ActivityIndicator color={colors.white} size={'small'} />
              ) : (
                <MainText size={fontSize[16]} color={colors.white}>
                  {t('45')}
                </MainText>
              )}
            </TouchableOpacity>
            <View
              style={{
                alignItems: 'flex-end',
                paddingHorizontal: 15,
                paddingTop: 10,
              }}>
              {params?.isLocal && (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('UpdatePasswordWithJshir');
                    // const phoneNumber = storage.getString('phoneNumber');
                    // navigation.navigate('EnterJsh', {phone: phoneNumber});
                  }}>
                  <MainText color={style.blue} size={fontSize[12]}>
                    {t('33')}
                  </MainText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default ResetPassCode;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },

  eye: {
    position: 'absolute',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    paddingRight: 10,
  },
  image: {
    width: '90%',
    height: normalize(270),
    padding: 10,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalView: {
    width: '90%',
    height: normalize(350),
    backgroundColor: 'white',
    alignSelf: 'center',
    borderRadius: 12,
  },
  jshshir: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.blue,
  },
  bbb: {
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
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
    marginTop: 20,
    alignSelf: 'center',
  },
  registerButton: {
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 6,
    paddingBottom: 10,
    paddingTop: 10,
  },
  BackButton: {
    position: 'absolute',
    marginLeft: 15,
    marginTop: 15,
    zIndex: 1,
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
    height: style.textInputHeight,
    alignSelf: 'center',
  },
  enterText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  phoneNumberText: {
    marginLeft: 5,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 15,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
