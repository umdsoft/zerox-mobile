import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import {Dimensions, PixelRatio, Platform} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
const {width, height} = Dimensions.get('window');

const scale = width / 310;
export const normalize = size => {
  let newSize = size * scale;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) + 2;
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
};

const style = {
  backgroundColorLight: '#fff',
  backgroundColorDark: '#000',
  textColorLight: '#fff',
  textColorDark: '#000',
  textColor: '#000',
  fontFamilyThin: 'Montserrat-Thin',
  fontFamilyBold: 'Montserrat-Bold',
  fontFamilyRegular: 'Montserrat-Regular',
  fontFamilyMedium: 'Montserrat-Medium',
  fontFamilyLight: 'Montserrat-Light',
  fontSize: {
    xa: hp('1.2%') + 2,
    small: hp('1.4%') + 2,
    xx: hp('1.6%') + 2,
    xs: hp('2%') + 2,
    s: normalize(16),
    m: normalize(17),
    l: normalize(18),
  },
  // fontSize: {
  //   xa: normalize(9),
  //   small: normalize(11) - 1,
  //   xx: normalize(13) - 2,
  //   xs: normalize(14) - 1,
  //   s: normalize(16),
  //   m: normalize(17),
  //   l: normalize(18),
  // },
  blue: '#4e91d2',
  width: width,
  height: height,
  textInputHeight: normalize(45),
  codeButtonSize: normalize(45),
  StatusbarColor: '#4F92D1',
  MoneyColor: '#48BB78',
  backgroundColor: '#F7FAFC',
  buttonHeight: height / 13,
  disabledButtonColor: '#8692A6',
  placeHolderColor: '#A9ABAD',
};
const darkSchema = {
  dark: true,
  ...DarkTheme,
  backgroundColor: style.backgroundColorDark,
  textColor: style.textColorDark,
};
const lightSchema = {
  dark: false,
  ...DefaultTheme,
  backgroundColor: style.backgroundColorLight,
  textColor: style.textColorLight,
};

const titleStle = {
  titlex: {
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx + 2,
    color: '#fff',
  },
};

export {style, darkSchema, titleStle, lightSchema};
