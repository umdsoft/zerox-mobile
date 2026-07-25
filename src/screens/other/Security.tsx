import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import ChangePasswordIcon from '../../images/ChangePassword';
import PasswordIcon from '../../images/Password';
import FingerIcon from '../../images/Finger';
import { Switch } from 'react-native-paper';
import { storage } from '../../store/api/token/getToken';
import ReactNativeBiometrics from 'react-native-biometrics';
import LottieView from 'lottie-react-native';
import { t } from 'i18next';
import FaceIdIcon from '../../images/faceid';
import ScreenLayout from '../components/ScreenLayout';
import { normalize } from '../../theme/style';
import { rd, rs } from '../../theme/rd';
import { ChevronRight } from '../home/redesign/icons';

const rnBiometrics = new ReactNativeBiometrics();

const Security = () => {
  const navigation = useNavigation();
  const [support, setSupport] = useState(false);
  const [value, setValue] = useState(() => {
    let a = storage.getBoolean('touch');
    if (a === undefined || a) {
      return true;
    } else {
      return false;
    }
  });

  const setTouch = useCallback(() => {
    let a = storage.getBoolean('touch');
    if (a) {
      storage.set('touch', false);
      setValue(false);
    } else {
      storage.set('touch', true);
      setValue(true);
    }
  }, []);

  const onSupportScan = async () => {
    const { available } = await rnBiometrics.isSensorAvailable();
    setSupport(available ? true : false);
  };

  const renderSwitch = useMemo(() => {
    return (
      <View style={[styles.row, styles.rowDivider]}>
        <View style={styles.rowLeft}>
          <View style={styles.iconCircle}>
            {Platform.OS === 'ios' ? (
              <FaceIdIcon width={rs(20)} height={rs(20)} color={rd.color.primary} />
            ) : (
              <FingerIcon size={rs(20)} color={rd.color.primary} />
            )}
          </View>
          <Text allowFontScaling={false} style={styles.optionTx}>
            {Platform.OS === 'ios'
              ? (t('faceid') as string)
              : (t('813') as string)}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={setTouch}
          thumbColor={'#fff'}
          trackColor={{ true: rd.color.primary, false: rd.color.border }}
        />
      </View>
    );
  }, [setTouch, value]);

  useFocusEffect(() => {
    onSupportScan();
  });

  return (
    <ScreenLayout title={t('816')} scroll={false} contentStyle={styles.content}>
      {/* Ikona TEPADA (deyarli yarim sahifa), bandlar PASTKI yarmda —
          bir qo'lda qulay boshqarish uchun. */}
      <View style={styles.top}>
        <LottieView
          autoPlay
          source={require('../../images/lottie/list/8tdue8bgdH.json')}
          style={styles.lottie}
        />
      </View>
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('RecoveryPassword', { type: 1 });
          }}
          style={styles.row}
        >
          <View style={styles.rowLeft}>
            <View style={styles.iconCircle}>
              <PasswordIcon size={rs(20)} color={rd.color.primary} />
            </View>
            <Text allowFontScaling={false} style={styles.optionTx}>
              {t('678')}
            </Text>
          </View>
          <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('ChangeLocalPassword');
          }}
          style={[styles.row, styles.rowDivider]}
        >
          <View style={styles.rowLeft}>
            <View style={styles.iconCircle}>
              <ChangePasswordIcon size={rs(20)} color={rd.color.primary} />
            </View>
            <Text allowFontScaling={false} style={styles.optionTx}>
              {t('774')}
            </Text>
          </View>
          <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
        </TouchableOpacity>
        {support ? renderSwitch : null}
      </View>
    </ScreenLayout>
  );
};

export default Security;

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: rs(16), paddingBottom: rs(20) },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lottie: { width: rs(150), height: rs(150) },
  card: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  optionTx: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    flexShrink: 1,
  },
});
