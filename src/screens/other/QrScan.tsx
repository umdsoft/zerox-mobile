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
import {rd, rs} from '../../theme/rd';
import {ChevronLeft, SunSettingsIcon, WifiOffIcon} from '../home/redesign/icons';

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

  if (!hasPermission || !device) {
    return (
      <View style={styles.permContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={styles.permBack}>
          <ChevronLeft size={rs(24)} color={rd.color.text} />
        </TouchableOpacity>
        <View style={styles.permIcon}>
          <WifiOffIcon size={rs(30)} color={rd.color.primary} />
        </View>
        <Text allowFontScaling={false} style={styles.permTitle}>
          {t('798')}
        </Text>
      </View>
    );
  }

  const FRAME = rs(240);
  const CORNER = rs(34);
  const CORNER_W = rs(4);

  return (
    <View style={styles.flex}>
      <Camera
        device={device}
        isActive={true}
        codeScanner={codeScanner}
        torch={flash ? 'on' : 'off'}
        style={StyleSheet.absoluteFill}
      />

      {/* Dark translucent surround with a transparent centered frame */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.dim} />
        <View style={styles.middleRow}>
          <View style={styles.dim} />
          <View style={{width: FRAME, height: FRAME}}>
            <View
              style={[
                styles.corner,
                {
                  top: 0,
                  left: 0,
                  borderTopWidth: CORNER_W,
                  borderLeftWidth: CORNER_W,
                  borderTopLeftRadius: rd.radius.xl,
                  width: CORNER,
                  height: CORNER,
                },
              ]}
            />
            <View
              style={[
                styles.corner,
                {
                  top: 0,
                  right: 0,
                  borderTopWidth: CORNER_W,
                  borderRightWidth: CORNER_W,
                  borderTopRightRadius: rd.radius.xl,
                  width: CORNER,
                  height: CORNER,
                },
              ]}
            />
            <View
              style={[
                styles.corner,
                {
                  bottom: 0,
                  left: 0,
                  borderBottomWidth: CORNER_W,
                  borderLeftWidth: CORNER_W,
                  borderBottomLeftRadius: rd.radius.xl,
                  width: CORNER,
                  height: CORNER,
                },
              ]}
            />
            <View
              style={[
                styles.corner,
                {
                  bottom: 0,
                  right: 0,
                  borderBottomWidth: CORNER_W,
                  borderRightWidth: CORNER_W,
                  borderBottomRightRadius: rd.radius.xl,
                  width: CORNER,
                  height: CORNER,
                },
              ]}
            />
          </View>
          <View style={styles.dim} />
        </View>
        <View style={styles.dim} />
      </View>

      {/* Top-left back button */}
      <View style={styles.back}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <ChevronLeft size={rs(24)} color={rd.color.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Instruction text */}
      <View style={styles.title} pointerEvents="none">
        <Text allowFontScaling={false} style={styles.text}>
          {t('798')}
        </Text>
      </View>

      {/* Flash toggle */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setFlash(!flash)}
        style={styles.flash}>
        <View style={[styles.flashBtn, flash && styles.flashBtnOn]}>
          <SunSettingsIcon
            size={rs(22)}
            color={flash ? rd.color.primary : rd.color.onPrimary}
          />
        </View>
        <Text allowFontScaling={false} style={styles.flashText}>
          {t('chiroq')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default QrScan;

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: '#000'},

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  dim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  middleRow: {
    flexDirection: 'row',
  },
  corner: {
    position: 'absolute',
    borderColor: rd.color.onPrimary,
  },

  // Back button (top-left)
  back: {
    position: 'absolute',
    top:
      Platform.OS === 'ios'
        ? heightPercentageToDP(2)
        : heightPercentageToDP(2.5),
    left: rs(16),
    zIndex: 2,
  },
  backBtn: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Instruction text (top)
  title: {
    position: 'absolute',
    zIndex: 2,
    top:
      Platform.OS === 'ios'
        ? heightPercentageToDP(12)
        : heightPercentageToDP(10),
    alignSelf: 'center',
    paddingHorizontal: rs(32),
  },
  text: {
    color: rd.color.onPrimary,
    fontSize: rs(16),
    fontFamily: rd.font.medium,
    textAlign: 'center',
    lineHeight: rs(22),
  },

  // Flash toggle (bottom)
  flash: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
    bottom: heightPercentageToDP(10),
    alignItems: 'center',
  },
  flashBtn: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnOn: {
    backgroundColor: rd.color.onPrimary,
  },
  flashText: {
    color: rd.color.onPrimary,
    fontSize: rs(13),
    fontFamily: rd.font.medium,
    marginTop: rs(8),
  },

  // Permission-denied state
  permContainer: {
    flex: 1,
    backgroundColor: rd.color.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(32),
  },
  permBack: {
    position: 'absolute',
    top:
      Platform.OS === 'ios'
        ? heightPercentageToDP(2)
        : heightPercentageToDP(2.5),
    left: rs(16),
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permIcon: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(20),
  },
  permTitle: {
    color: rd.color.text,
    fontSize: rs(16),
    fontFamily: rd.font.medium,
    textAlign: 'center',
    lineHeight: rs(23),
  },
});
