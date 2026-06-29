import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import { normalize, style } from '../../theme/style';
import ResetPassword from '../../images/RecoveryPassword';
import Loading from '../components/Loading';

import PhoneInput from '../components/PhoneInput';
import MainText from '../components/MainText';
import { font, fontSize } from '../../theme/font';
import { colors } from '../../theme/colors';
import { t } from 'i18next';
import { URL } from '../constants';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { storage } from '../../store/api/token/getToken';
import { UpdatePasswordWithJshirApi } from '../../store/api/auth';
import { useDispatch } from 'react-redux';
import InputMask from '../components/InputMask';

const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to check if the phone time is within the allowed range
const checkPhoneTime = async () => {
  const currentTime = new Date().getTime();
  const lastCheckedTime =
    storage.getNumber('lastCheckedTime') || new Date().getTime();

  // If the last checked time is more than one hour ago, reset the count
  if (currentTime - lastCheckedTime > oneHour) {
    storage.set('count', 0);
    storage.set('lastCheckedTime', currentTime);
    return true;
  }

  // If the count is less than 3, allow the request
  const count = storage.getNumber('count') || 0;
  return count < 3;
};

const UpdatePasswordWithJshir = () => {
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  //   const route = useRoute();
  //   const {type} = route.params;
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(false);
  const dispatch = useDispatch();

  const { i18n } = useTranslation();

  const PostData = async () => {
    const isAllowed = await checkPhoneTime();

    if (!isAllowed) {
      Toast.show({
        type: 'error2',
        position: 'bottom',
        props: {
          title: 'Xatolik!',
          desc: t(
            "Urinishlar soni cheklanganligi sababli ro'yxatdan o'tish 1 soatga bloklandi. Iltimos, keyinroq urinib ko'ring.",
          ),
        },
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 5 : normalize(50),
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log(phone.replace(/\s/g, ''));
    try {
      ``;
      const response = await dispatch(
        UpdatePasswordWithJshirApi({
          phone: phone.replace(/\s/g, ''),
        }),
      ).unwrap();

      // PAROL TIKLASH — FAQAT MyID/JSHSHIR orqali, SMS YO'Q.
      // code 2 (pinfl bor) va code 1 (pinfl yo'q) → ro'yxatda bor → EnterJsh (JSHSHIR → MyID).
      if (response.code === 2 || response.code === 1) {
        navigation.navigate('EnterJsh', { phone: phone.replace(/\s/g, '') });
      }

      // code 0 → raqam ro'yxatdan o'tmagan → SMS/registratsiya YO'Q, aniq xato beramiz.
      if (response.code === 0) {
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            title: 'Xatolik!',
            desc: t("Bu telefon raqami ro'yxatdan o'tmagan."),
          },
          visibilityTime: 3000,
          autoHide: true,
        });
      }
      if (response.code === 3) {
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            title: 'Xatolik!',
            desc: t('Xatolik!'),
          },
          visibilityTime: 3000,
          autoHide: true,
        });
      }

      setTimeout(() => {
        setLoading(false);
      }, 500);

      console.log('UpdatePasswordWithJshir response:', response);
    } catch (error) {
      setLoading(false);
      console.error('Error updating password:', error);
    }
  };

  useEffect(() => {
    if (phone.replace(/\s/g, '').length === 9) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [phone]);
  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <View
            style={[
              styles.BackButton,
              { marginTop: Platform.OS === 'android' ? 10 : normalize(10) },
            ]}
          >
            <BackButton
              navigation={navigation}
              IconColor="#fff"
              backgroundColor={style.blue}
            />
          </View>
          <View style={{ width: style.width, height: style.height }}>
            <View
              style={{
                alignItems: 'center',
                flex: 0.5,
                justifyContent: 'center',
              }}
            >
              <ResetPassword />
            </View>
            <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
              <MainText size={fontSize[16]} ft={font.bold} color={colors.black}>
                {t('729')}
              </MainText>
              <MainText
                size={fontSize[12]}
                color={colors.disabledButtonColor}
                textAlign="center"
                style={{ marginTop: 6 }}
              >
                {t('42')}
              </MainText>
            </View>
            <View style={styles.main}>
              <View>
                <InputMask
                  onChangeText={(formatted, extracted) => {
                    setPhone(extracted);
                  }}
                  value={phone}
                  icon={true}
                />
              </View>
            </View>
            {/* {error && (
              <View
                style={{
                  alignSelf: 'center',
                  alignItems: 'center',
                  marginTop: 20,
                  width: '90%',
                }}>
                <MainText color={colors.red} size={fontSize[12]}>
                  {t('48')}
                </MainText>
              </View>
            )} */}
            <View style={styles.enterButtonContainer}>
              <TouchableOpacity
                disabled={disabled}
                onPress={() => {
                  PostData();
                }}
                style={[
                  styles.enterButton,
                  {
                    backgroundColor: disabled
                      ? style.disabledButtonColor
                      : style.blue,
                  },
                ]}
              >
                <MainText color={colors.white} size={fontSize[16]}>
                  {t('45')}
                </MainText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default UpdatePasswordWithJshir;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  enterButtonContainer: {
    marginTop: 20,
  },
  phoneNumberText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  retryPassword: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  BackButton: {
    position: 'absolute',
    marginLeft: 15,
    marginTop: Platform.OS === 'android' ? 10 : 0,
    zIndex: 1,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
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
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },

  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
