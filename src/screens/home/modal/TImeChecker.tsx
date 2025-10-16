import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LottieView from 'lottie-react-native';
import {style} from '../../../theme/style';
import {Modal} from 'react-native-paper';

import {useTranslation} from 'react-i18next';
const TimeChecker = () => {
  const {t} = useTranslation();

  return (
    <Modal visible={true} dismissable={false}>
      <View style={styles.main}>
        <LottieView
          source={require('../../../images/timeanim.json')}
          autoPlay
          resizeMode="cover"
          style={{width: style.width / 1.5, height: style.height / 2.8}}
        />
        <Text allowFontScaling={false} style={styles.text}>{t('time')}</Text>
      </View>
    </Modal>
  );
};
export default TimeChecker;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: style.fontSize.xx,
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    marginTop: 20,
    textAlign: 'center',
  },
  textbtn: {
    fontSize: style.fontSize.xs,
    color: '#fff',
    fontFamily: style.fontFamilyMedium,
  },
  ImageBackground: {
    width: style.width,
    height: style.height,
  },
  logoContainer: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ishonch: {
    fontSize: style.fontSize.xs + 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  main: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: style.width,
    height: style.height,
  },
  update: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: style.blue,
    borderRadius: 10,
    marginTop: 20,
  },
});
