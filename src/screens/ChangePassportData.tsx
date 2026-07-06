import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';

import {useNavigation} from '@react-navigation/native';

import LottieView from 'lottie-react-native';
import {androidFace, iosFace} from '../nativemodule/android.event';
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
import ScreenLayout from './components/ScreenLayout';
import Button from './components/Button';
import {rd, rs} from '../theme/rd';
import {FingerprintIcon} from './home/redesign/icons';

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
    <ScreenLayout title={t('otish')} scroll contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <FingerprintIcon size={rs(30)} color={rd.color.primary} />
        </View>

        <View style={styles.scanCard}>
          <LottieView
            source={require('../images/scan.json')}
            autoPlay={true}
            renderMode="AUTOMATIC"
            resizeMode="cover"
            style={styles.lottie}
          />
        </View>

        <Text allowFontScaling={false} style={styles.text}>
          {t('753')}
        </Text>
      </View>

      <Button
        title={t('45')}
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
        style={styles.buttonSpacing}
      />
    </ScreenLayout>
  );
};

export default ChangePassportData;

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: rs(24),
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(32),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(28),
  },
  scanCard: {
    width: rs(220),
    height: rs(220),
    borderRadius: rd.radius.huge,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(28),
  },
  lottie: {
    width: rs(150),
    height: rs(150),
  },
  text: {
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.textSecondary,
    textAlign: 'center',
    lineHeight: rs(22),
    paddingHorizontal: rs(12),
  },
  buttonSpacing: {
    marginTop: rs(24),
  },
});
