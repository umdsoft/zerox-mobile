import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';

import {useNavigation} from '@react-navigation/native';

import LottieView from 'lottie-react-native';
import {normalize, style} from '../theme/style';
import {androidFace, iosFace} from '../nativemodule/android.event';
import OtherHeader from './components/OtherHeader';
import {storage} from '../store/api/token/getToken';
import axios from 'axios';

import {useDispatch} from 'react-redux';
import {HomeApi, getMe} from '../store/api/home';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import {contractModalShow} from '../store/reducers/HomeReducer';
import {useTranslation} from 'react-i18next';
import Loading from './components/Loading';
import {t} from 'i18next';
import {URL} from './constants';

const returnMessage = response => {
  switch (response.data.code) {
    case 0:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('Foydalanuvchi topilmadi.'),
        },
      });
      break;
    case 1:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t("Siz muqaddam identifikatsiyadan o'tgansiz."),
        },
      });
      break;
    case 2:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t("Siz identifikatsiyadan o'tgansiz."),
        },
      });
      break;
    case 3:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('Rasm yuklashda xatolik.'),
        },
      });
      break;
    case 4:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('Bildirishnoma yaratishda xatolik.'),
        },
      });
      break;

    case 5:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t("Foydalanuvchini ma'lumotlarini o'zgartirishda xatolik."),
        },
      });
      break;

    case 6:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('MyId bilan xatolik yuz berdi.'),
        },
      });
      break;
    case 7:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('MyId bilan token olishda xatolik yuz berdi.'),
        },
      });
      break;
    default:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('Xatolik!'),
        },
      });
      break;
  }
};

const ChangePassportData = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {i18n} = useTranslation();
  const [loading, setLoading] = useState(false);
  const Indentificator = useCallback(async () => {
    const nativeEvent = new NativeEventEmitter(NativeModules.MyIdModule);

    const postData = async data => {
      let token = storage.getString('token');
      try {
        const form = new FormData();
        form.append('code', data.code);
        form.append('image', data.image);

        const response = await axios.put(
          URL + '/user/change-passport-data',
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (response.data.success) {
          setLoading(true);
          dispatch(getMe()).then(val => {
            navigation.navigate('BottomTabNavigator');
            setTimeout(() => {
              setLoading(false);
            }, 300);
          });
        } else {
          Toast.show({
            autoHide: true,
            visibilityTime: 3000,
            position: 'bottom',
            type: 'error2',
            props: {
              // title: 'Xatolik',
              desc: t('Xatolik!'),
            },
          });
        }
      } catch (err) {
        returnMessage(err.response);
      }
    };
    if (Platform.OS === 'android') {
      DeviceEventEmitter.addListener('onSuccess', async data => {
        console.log('success');
        postData(data);
      });
      DeviceEventEmitter.addListener('onError', data => {
        console.log(data, 'error face');
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            // title: 'Xatolik',
            desc: t('Xatolik!'),
          },
        });
      });
    }
    if (Platform.OS === 'ios') {
      nativeEvent.addListener('onSuccess', data => {
        console.log(data, 'data');
        postData(data);
      });
      nativeEvent.addListener('onError', data => {
        console.log(data, 'errorr');
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            // title: 'Xatolik',
            desc: t(data.message),
          },
        });
      });
      nativeEvent.addListener('onUserExited', data => {
        console.log(data, 'user find');
      });
    }
  }, [dispatch, navigation]);

  useEffect(() => {
    Indentificator();

    return () => {
      DeviceEventEmitter.removeAllListeners('onSuccess');
      DeviceEventEmitter.removeAllListeners('onError');
      DeviceEventEmitter.removeAllListeners('onUserExited');
    };
  }, [Indentificator]);
  if (loading) {
    return <Loading />;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
      }}>
      <OtherHeader
        title={t('otish')}
        backgroundColor={style.blue}
        iconColor="#fff"
        titleColor={style.backgroundColorDark}
      />
      <View style={styles.container}>
        <LottieView
          source={require('../images/scan.json')}
          autoPlay={true}
          renderMode="AUTOMATIC"
          resizeMode="cover"
          style={{
            width: normalize(150),
            height: normalize(150),
            marginBottom: normalize(50),
          }}
        />

        <Text allowFontScaling={false} style={styles.text}>{t('753')}</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          Platform.OS === 'android'
            ? androidFace(
                i18n.language.toString() === 'uz' ||
                  i18n.language.toString() === 'kril'
                  ? 'uz'
                  : 'ru',
              )
            : iosFace();
        }}
        style={[styles.enterButton]}>
        <Text
          allowFontScaling={false}
          style={[
            styles.enterText,
            {color: '#fff', fontFamily: style.fontFamilyMedium},
          ]}>
          {t('45')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChangePassportData;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalize(20),
    paddingHorizontal: 15,
  },
  text: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
  enterButton: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: style.buttonHeight,
    alignSelf: 'center',
    marginTop: normalize(20),
  },
  enterText: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },
});
