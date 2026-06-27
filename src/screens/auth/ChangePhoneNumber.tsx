import {StyleSheet, View} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {normalize, style} from '../../theme/style';
import {fontSize} from '../../theme/font';
import ChangeNumber from '../../images/changeNumber';
import ScreenLayout from '../components/ScreenLayout';
import Button from '../components/Button';
import axios from 'axios';
import {URL} from '../constants';
import Loading from '../components/Loading';
import {storage} from '../../store/api/token/getToken';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import {t} from 'i18next';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import InputMask from '../components/InputMask';

const ChangePhoneNumber = () => {
  const [phone, setPhone] = useState('');
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const {i18n} = useTranslation();

  const {user} = useSelector(state => state.HomeReducer);

  const onPress = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const {data} = await axios.post(
        URL + '/user/rephone',
        {
          phone: '+998' + phone.replace(/\s/g, ''),
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
      console.log(data, 'response');

      if (data.success) {
        setLoading(false);
        navigation.navigate('ChangePhoneNumberSmsCheck', {
          phone: '+998' + phone.replace(/\s/g, ''),
        });
      } else {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: t('708'),
          },
        });
      }
    } catch (error) {
      setLoading(false);
    }
  }, [i18n.language, navigation, phone, user?.data?.phone]);

  const renderPhone = useMemo(() => {
    return (
      // <View
      //   style={{
      //     flex: 1,
      //     flexDirection: 'row',
      //     alignItems: 'center',
      //   }}>
      //   <MainText size={fontSize[14]} mrLeft={10}>
      //     +998
      //   </MainText>
      // </View>
      <InputMask
        onChangeText={(formatted, extracted) => {
          setPhone(extracted);
        }}
        value={phone}
        icon={true}
      />
    );
  }, [phone]);

  const renderButton = useMemo(() => {
    return (
      <Button
        title={t('45')}
        onPress={onPress}
        disabled={phone.replace(/\s/g, '').length !== 9}
      />
    );
  }, [onPress, phone]);

  if (loading) {
    return <Loading />;
  }

  return (
    <ScreenLayout
      title={t('702')}
      headerColor={style.blue}
      headerIconColor="#fff"
      headerTitleColor="#000"
    >
      <View style={{marginTop: normalize(90)}}>
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <ChangeNumber />
        </View>
        <View style={styles.main}>
          <View style={{alignItems: 'center'}}>
            {/* <View
                  style={[styles.TextInputLabelContainer, {marginBottom: 25}]}>
                  <View style={styles.retryPassword}>
                    <MainText size={fontSize[12]}>{t('705')}</MainText>
                  </View> */}
            <View>{renderPhone}</View>
            {/* </View> */}
          </View>
          <View style={styles.enterButtonContainer}>{renderButton}</View>
        </View>
      </View>
      {/* <Toast config={toastConfig} /> */}
    </ScreenLayout>
  );
};

export default ChangePhoneNumber;

const checkingPhone = value => {
  let val = '';
  val = value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})/);
  val = !val[2]
    ? val[1]
    : ' ' +
      val[1] +
      ' ' +
      val[2] +
      (val[3] ? ' ' + val[3] : '') +
      (val[4] ? ' ' + val[4] : '');
  return val;
};

const styles = StyleSheet.create({
  time: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  timeContainer: {
    borderWidth: 1,
    borderColor: style.blue,
    borderRadius: 5,
    height: 60,
    paddingLeft: 20,
    paddingRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryPasswordText: {
    fontSize: style.fontSize.xx,
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
    marginTop: 15,
    width: '100%',
  },
  footerContainer: {
    flex: 0.2,
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  phoneNumberText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
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
    marginTop: 15,
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
  enterText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx + 1,
    color: style.textColor,
  },

  TextInput: {
    width: '100%',
    paddingVertical: 18,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 5,
    fontSize: fontSize[14],
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  country: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    marginLeft: 10,
  },
});
