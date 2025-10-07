import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
// import QRCodeScanner from 'react-native-qrcode-scanner';
import BackButton from '../components/BackButton';
import {normalize, style} from '../../theme/style';
import {useNavigation, useRoute} from '@react-navigation/native';
import Flash from '../../images/flash';
import Logo from '../../images/TextAndLogo';
import axios from 'axios';
import {URL} from '../constants';
import {useSelector} from 'react-redux';
import {Toast} from 'react-native-toast-message/lib/src/Toast';

import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';

import {useTranslation} from 'react-i18next';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {storage} from '../../store/api/token/getToken';

const QrScan = () => {
  let scannedRef = useRef(false); // lock
  const {t} = useTranslation();
  const [flash, setFlash] = useState(false);
  const {user} = useSelector(state => state.HomeReducer);
  const navigation = useNavigation();
  const {type} = useRoute().params;
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (scannedRef.current) return;
      scannedRef.current = true;

      if (scannedRef.current) {
        setTimeout(() => {
          OnRead(codes[0].value);
        }, 1000);
      }
      return;
    },
  });

  const OnRead = useCallback(
    e => {
      const token = storage.getString('token');
      const id = e.slice(-8);

      if (id) {
        axios
          .get(URL + `/user/candidate-search/${id}`, {
            headers: {
              Connection: 'close',
              Authorization: `Bearer ${token}`,
            },
          })
          .then(res => {
            console.log('responseeeee', res.data);
            if (res.data.success === true) {
              if (res.data.data.uid === user.data.uid) {
                Toast.show({
                  autoHide: true,
                  position: 'bottom',
                  visibilityTime: 3000,
                  type: 'error2',
                  props: {
                    title: 'Xatolik',
                    desc: t('Foydalanuvchi ma’lumotlari to‘g‘ri kelmadi'),
                  },
                });
                scannedRef.current = false;
                return;
              } else {
                navigation.navigate('UserInfo', {
                  user: res.data.data,
                  type: type,
                });
                scannedRef.current = false;
                return;
              }
            } else {
              return;
            }
          })
          .catch(err => {
            console.warn(err);
          });
      }
    },
    [navigation, type, user.data.uid],
  );

  if (!device || !hasPermission) return <View />;
  return (
    <View style={styles.flex}>
      <View style={styles.back}>
        <BackButton
          navigation={navigation}
          backgroundColor={'#fff'}
          IconColor={style.blue}
        />
      </View>

      <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.flash}>
        <Flash color={style.blue} />
        <Text style={styles.flashText}>{t('chiroq')}</Text>
      </TouchableOpacity>
      <View style={styles.logo}>
        <Logo
          width={normalize(80)}
          height={normalize(30)}
          color={'red'}
          fill={style.blue}
        />
      </View>

      <View style={styles.title}>
        <Text style={[styles.text, {fontSize: style.fontSize.xs}]}>
          {t('798')}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View style={styles.border} />
        <View style={{borderRadius: 20, overflow: 'hidden'}}>
          <Camera
            device={device}
            isActive={true}
            codeScanner={codeScanner}
            torch={flash ? 'on' : 'off'}
            style={{
              width: heightPercentageToDP(35),
              height: heightPercentageToDP(35),
              alignSelf: 'center',
              borderRadius: 50,
            }}
          />
        </View>
      </View>

      {/* <QRCodeScanner
        reactivate={true}
        containerStyle={styles.flex}
        onRead={OnRead}
        fadeIn={true}
        cameraStyle={{height}}
        checkAndroid6Permissions={true}
        vibrate={false}
        flashMode={flash ? 'torch' : 'off'}
      /> */}
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default QrScan;

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
    marginTop: 20,
  },
  flex: {flex: 1},
  flashText: {color: style.blue, fontSize: style.fontSize.xs},
  flash: {
    position: 'absolute',
    zIndex: 1,
    alignSelf: 'center',
    marginTop: heightPercentageToDP(75),
    alignItems: 'center',
  },
  text: {
    color: style.blue,
    fontSize: style.fontSize.xs + 15,
    fontFamily: style.fontFamilyMedium,
    textAlign: 'center',
  },
  logo: {
    position: 'absolute',
    alignSelf: 'center',
    marginTop:
      Platform.OS === 'ios'
        ? heightPercentageToDP(20)
        : heightPercentageToDP(25),
    zIndex: 1,
  },
  title: {
    position: 'absolute',
    zIndex: 1,
    marginTop:
      Platform.OS === 'ios'
        ? heightPercentageToDP('70%')
        : heightPercentageToDP('70%'),
    alignSelf: 'center',
  },
  border: {
    position: 'absolute',
    zIndex: 1,
    borderWidth: 2,
    borderColor: style.blue,
    width: heightPercentageToDP(35),
    height: heightPercentageToDP(35),
    marginTop: heightPercentageToDP('70%'),
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  back: {
    marginTop: 10,
    position: 'absolute',
    marginLeft: 15,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBold: {
    fontWeight: '500',
    color: '#fff',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});
