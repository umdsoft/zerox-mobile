import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { style } from '../../../theme/style';
import ResetPassword from '../../../images/RecoveryPassword';
import axios from 'axios';
import OtherHeader from '../../components/OtherHeader';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../components/ToastConfig';
import TextBold from '../../components/TextBold';
import { t } from 'i18next';

const Inforamation = () => {
  const navigation = useNavigation();
  const { jshshir } = useRoute().params;
  const onHandle = useCallback(() => {
    navigation.navigate('MyIdScreen', { jshshir: jshshir });
  }, [navigation, jshshir]);

  return (
    <View style={[styles.container]}>
      <OtherHeader title={t('720')} titleColor={'#000'} iconColor="#fff" backgroundColor={style.blue} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={{ alignSelf: 'center', marginTop: 20, marginBottom: 20 }}>
            <ResetPassword />
          </View>
          <View style={styles.main}>
            <Text style={styles.phoneText} allowFontScaling={false}>
              {t('835')}{' '}
              <TextBold>
                {t('836')}{' '}
              </TextBold>
              {t('837')}{' '}
              <TextBold> {t('838')}</TextBold>
            </Text>
          </View>

          <View style={styles.enterButtonContainer}>
            <TouchableOpacity activeOpacity={0.8} onPress={onHandle} style={[styles.enterButton, { backgroundColor: style.blue, },]}>
              <Text style={[styles.enterText, { color: '#fff' }]} allowFontScaling={false}>
                {t('42')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default Inforamation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    width: '80%',
    alignSelf: 'center',
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
    textAlign: 'center',
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
