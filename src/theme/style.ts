/**
 * style.ts — LEGACY `style` obyekti (142 ekran ishlatadi).
 * Qiymatlar endi tokens.ts'dan keladi (yagona manba). Eski kalitlar o'zgarmagan.
 */
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { normalize, tokens } from './tokens';

export { normalize };

const style = {
  backgroundColorLight: tokens.color.white,
  backgroundColorDark: tokens.color.black,
  textColorLight: tokens.color.white,
  textColorDark: tokens.color.black,
  textColor: tokens.color.onSurface,
  fontFamilyThin: tokens.font.thin,
  fontFamilyBold: tokens.font.bold,
  fontFamilyRegular: tokens.font.regular,
  fontFamilyMedium: tokens.font.medium,
  fontFamilyLight: tokens.font.light,
  fontSize: tokens.fontSize,
  blue: tokens.color.primary,
  width: tokens.size.width,
  height: tokens.size.height,
  textInputHeight: tokens.size.textInputHeight,
  codeButtonSize: tokens.size.codeButtonSize,
  StatusbarColor: tokens.color.primaryDark,
  MoneyColor: tokens.color.money,
  backgroundColor: tokens.color.background,
  buttonHeight: tokens.size.buttonHeight,
  disabledButtonColor: tokens.color.muted,
  placeHolderColor: tokens.color.placeholder,
};

const darkSchema = {
  ...DarkTheme,
  dark: true,
  backgroundColor: style.backgroundColorDark,
  textColor: style.textColorDark,
};
const lightSchema = {
  ...DefaultTheme,
  dark: false,
  backgroundColor: style.backgroundColorLight,
  textColor: style.textColorLight,
};

const titleStle = {
  titlex: {
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx + 2,
    color: tokens.color.white,
  },
};

export { style, darkSchema, titleStle, lightSchema };
