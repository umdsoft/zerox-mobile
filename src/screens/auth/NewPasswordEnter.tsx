import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {normalize, style} from '../../theme/style';
import NewPasspord from '../../images/NewPassword';
import Check from '../../images/CheckIcon';
import PasswordInput from '../components/PasswordInput';
import OtherHeader from '../components/OtherHeader';
import axios from 'axios';
import {URL} from '../constants';
import {storage} from '../../store/api/token/getToken';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import {toastConfig} from '../components/ToastConfig';
import Loading from '../components/Loading';
import MainText from '../components/MainText';
import {colors} from '../../theme/colors';
import {fontSize} from '../../theme/font';
import {t} from 'i18next';
const NewPasswordEnter = () => {
  const navigation = useNavigation();
  // const {key} = useRoute().params;
  let key = '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lower, setLower] = useState(false);
  const [upper, setUpper] = useState(false);
  const [number, setNumber] = useState(false);
  const [space, setSpace] = useState(true);
  const [symbole, setSymbole] = useState(false);
  const [min, setMin] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const onChangeText = text => {
    setPassword(text);
  };

  const changePasswordHandle = useCallback(async () => {
    try {
      setLoading(true);
      const {data} = await axios.post(
        URL + '/user/edit-password',
        {
          secret: key,
          step: 2,
          password: password,
        },
        {
          headers: {
            Authorization: 'Bearer ' + storage.getString('token'),
          },
        },
      );

      if (data.msg === 'suc-password') {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'omad',
          props: {title: 'Muvaffaqiyatli', desc: t('changepassword')},
        });
        setTimeout(() => {
          navigation.navigate('BottomTabNavigator');
        }, 2000);
      }
    } catch (error) {
      setLoading(false);
    }
  }, [key, navigation, password]);

  const renderValidation = useMemo(() => {
    return (
      <View style={{width: '90%'}}>
        <View style={styles.icon}>
          <Check width={20} height={20} color={min ? 'green' : '#000'} />
          <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
            Kamida 8 belgidan iborat
          </MainText>
        </View>
        <View style={styles.icon}>
          <Check width={20} height={20} color={lower ? 'green' : '#000'} />
          <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
            Kamida bitta kichik harf
          </MainText>
        </View>
        <View style={styles.icon}>
          <Check width={20} height={20} color={upper ? 'green' : '#000'} />
          <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
            Kamida bitta katta harf
          </MainText>
        </View>
        <View style={styles.icon}>
          <Check width={20} height={20} color={number ? 'green' : '#000'} />
          <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
            Kamida bitta raqam
          </MainText>
        </View>
        <View style={styles.icon}>
          <Check width={20} height={20} color={symbole ? 'green' : '#000'} />
          <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
            Kamida bitta belgi
          </MainText>
        </View>
        <View style={styles.icon}>
          <Check width={20} height={20} color={space ? 'green' : '#000'} />
          <MainText mrLeft={4} color={colors.black} size={fontSize[12]}>
            Bo'sh joy bo'lmasligi kerak
          </MainText>
        </View>
      </View>
    );
  }, [lower, min, number, space, symbole, upper]);

  useEffect(() => {
    if (
      lower === true &&
      upper === true &&
      min === true &&
      number === true &&
      symbole === true &&
      space === true &&
      password === confirmPassword
    ) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [confirmPassword, lower, min, number, password, space, symbole, upper]);

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={[styles.container]}>
      <OtherHeader
        title={'Yangi parol kiriting'}
        titleColor="#000"
        iconColor={'#fff'}
        backgroundColor={style.blue}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View
            style={{alignItems: 'center', flex: 0.5, justifyContent: 'center'}}>
            <NewPasspord width={normalize(200)} height={normalize(200)} />
          </View>

          <View style={styles.main}>
            <View style={{width: '90%'}}>
              <PasswordInput
                title={'Parolni kiriting'}
                password={password}
                onChangeText={onChangeText}
                setLower={setLower}
                setMin={setMin}
                setSymbole={setSymbole}
                setUpper={setUpper}
                setNumber={setNumber}
                setSpace={setSpace}
              />
            </View>

            <View style={[styles.TextInputLabelContainer, {marginTop: 15}]}>
              <View style={styles.title}>
                <MainText size={fontSize[12]} color={colors.black}>
                  Parolni takrorlang
                </MainText>
              </View>
              <View style={{flex: 1}}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={text => {
                    setConfirmPassword(text);
                  }}
                  keyboardType="default"
                  style={styles.TextInput}
                  allowFontScaling={false} />
              </View>
            </View>
            {renderValidation}
          </View>
          <View style={styles.enterButtonContainer}>
            <TouchableOpacity
              disabled={disabled}
              activeOpacity={0.8}
              onPress={changePasswordHandle}
              style={[
                styles.enterButton,
                {
                  backgroundColor: disabled
                    ? style.disabledButtonColor
                    : style.blue,
                },
              ]}>
              <MainText color={colors.white} size={fontSize[16]}>
                Tasdiqlash
              </MainText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default NewPasswordEnter;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  icon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  text: type => {
    return {
      color: type ? 'green' : '#000',
      marginLeft: 10,
      fontFamily: style.fontFamilyMedium,
      fontSize: style.fontSize.xx - 2,
    };
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
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
  },
  enterButtonContainer: {
    marginTop: 20,
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
    borderRadius: 10,
    height: style.buttonHeight,
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
    paddingLeft: 15,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
