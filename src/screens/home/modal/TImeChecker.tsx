import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import LottieView from 'lottie-react-native';
import {Modal} from 'react-native-paper';

import {useTranslation} from 'react-i18next';
import {rd, rs} from '../../../theme/rd';

const {width, height} = Dimensions.get('window');

const TimeChecker = () => {
  const {t} = useTranslation();

  return (
    <Modal visible={true} dismissable={false}>
      <View style={styles.main}>
        <LottieView
          source={require('../../../images/timeanim.json')}
          autoPlay
          resizeMode="cover"
          style={{width: width / 1.5, height: height / 2.8}}
        />
        <Text allowFontScaling={false} style={styles.text}>
          {t('time')}
        </Text>
      </View>
    </Modal>
  );
};
export default TimeChecker;
const styles = StyleSheet.create({
  main: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.page,
    width,
    height,
  },
  text: {
    fontSize: rs(18),
    color: rd.color.text,
    fontFamily: rd.font.semibold,
    marginTop: rs(20),
    textAlign: 'center',
  },
});
