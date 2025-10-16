import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import LottieView from 'lottie-react-native';
import {style} from '../../../theme/style';
import {Modal} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
const NoInternet = ({onChangeIntenet}) => {
  const {t} = useTranslation();
  const {internet} = useSelector(state => state.HomeReducer);
  return (
    <Modal visible={internet} dismissable={false}>
      <View style={styles.main}>
        <LottieView
          source={require('../../../images/noconnection.json')}
          autoPlay
          resizeMode="cover"
          style={{width: style.width / 1.5, height: style.height / 2.8}}
        />
        <Text allowFontScaling={false} style={styles.text}>{t('780')}</Text>
        <TouchableOpacity
          onPress={onChangeIntenet}
          activeOpacity={0.8}
          style={styles.update}>
          <Text allowFontScaling={false} style={styles.textbtn}>{t('783')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
export default NoInternet;
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
