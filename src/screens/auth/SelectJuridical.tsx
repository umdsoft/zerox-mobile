import {
  AppState,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect} from 'react';
import {normalize, style} from '../../theme/style';
import {useNavigation} from '@react-navigation/native';
import BackButton from '../components/BackButton';
import WomenAndPc from '../../images/womenandpc.svg';
import MainText from '../components/MainText';
import {colors} from '../../theme/colors';
import {font, fontSize} from '../../theme/font';
const SelectJuridical = () => {
  const navigation = useNavigation();

  return (
    <View style={[styles.container]}>
      <View
        style={[
          styles.BackButton,
          {marginTop: Platform.OS === 'android' ? 10 : normalize(35)},
        ]}>
        <BackButton
          navigation={navigation}
          IconColor="#fff"
          backgroundColor={style.blue}
        />
      </View>
      <View style={styles.imageContainer}>
        <WomenAndPc width="50%" height="50%" />
      </View>
      <View style={styles.main}>
        <MainText color={colors.black} size={fontSize[16]} ft={font.bold}>
          Avtorizatsiya
        </MainText>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('RegisterWithJuridic');
          }}
          activeOpacity={0.8}
          style={[styles.registerButton, {marginBottom: 10}]}>
          <MainText color={colors.white} size={fontSize[14]}>
            Yuridik shaxs sifatida{' '}
          </MainText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('LoginWithPhone');
          }}
          activeOpacity={0.8}
          style={styles.registerButton}>
          <MainText color={colors.white} size={fontSize[14]}>
            Jismoniy shaxs sifatida{' '}
          </MainText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SelectJuridical;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerButton: {
    width: '85%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyBold,
    color: style.textColor,
  },
  main: {
    alignSelf: 'center',
  },
  BackButton: {
    position: 'absolute',
    marginLeft: 15,
    zIndex: 1,
    marginTop: Platform.OS === 'android' ? 40 : 0,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
