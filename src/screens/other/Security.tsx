import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { normalize, style } from '../../theme/style';

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
      <View style={styles.TouchableOpacity}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {Platform.OS === 'ios' ? (
              <>
                <FaceIdIcon width={30} height={30} color={style.blue} />
                <Text allowFontScaling={false} style={styles.optionTx}>
                  {t('faceid') as string}
                </Text>
              </>
            ) : (
              <>
                <FingerIcon size={30} color={style.blue} />
                <Text allowFontScaling={false} style={styles.optionTx}>
                  {t('813') as string}
                </Text>
              </>
            )}
          </View>
          <View style={{ marginRight: 10 }}>
            <Switch
              value={value}
              onValueChange={setTouch}
              thumbColor={value ? '#fff' : style.blue}
              trackColor={{ true: style.blue }}
            />
          </View>
        </View>
      </View>
    );
  }, [setTouch, value]);

  useFocusEffect(() => {
    onSupportScan();
  });

  return (
    <ScreenLayout title={t('816')}>
      <View style={styles.aboutUsContainer}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('RecoveryPassword', { type: 1 });
          }}
          style={styles.TouchableOpacity}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PasswordIcon size={30} color={style.blue} />
            <Text allowFontScaling={false} style={styles.optionTx}>
              {t('678')}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ChangeLocalPassword');
          }}
          style={styles.TouchableOpacity}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChangePasswordIcon size={30} />
            <Text allowFontScaling={false} style={styles.optionTx}>
              {t('774')}
            </Text>
          </View>
        </TouchableOpacity>
        {support ? renderSwitch : null}
      </View>
      <View style={{ alignSelf: 'center', marginTop: normalize(100) }}>
        <LottieView
          autoPlay
          source={require('../../images/lottie/list/8tdue8bgdH.json')}
          style={{ width: normalize(120), height: normalize(120) }}
        />
      </View>
    </ScreenLayout>
  );
};

export default Security;

const styles = StyleSheet.create({
  TouchableOpacity: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 5,
  },
  optionTx: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 2,
    color: '#000',
    marginLeft: 5,
  },
  aboutUsContainer: {
    backgroundColor: '#EAF2FB',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
    paddingBottom: 10,
  },
});
