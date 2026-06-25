/**
 * tokens.ts — YAGONA dizayn manbai (single source of truth).
 *
 * Barcha ranglar, shriftlar, o'lchamlar, masofalar SHU YERDA 1 marta belgilanadi.
 * style.ts / colors.ts / font.ts shu fayldan oladi (backward-compatible).
 *
 * Yangi UI uchun: `tokens.color.primary`, `tokens.spacing.md`, `tokens.radius.lg` ishlating —
 * literal hex/raqam yozmang. Brend rangini o'zgartirish = shu faylda 1 qator.
 */
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');

// --- Responsive scaling (310px bazaviy enlik) ---
const scale = width / 310;
export const normalize = (size: number): number => {
  const newSize = size * scale;
  return Platform.OS === 'ios'
    ? Math.round(PixelRatio.roundToNearestPixel(newSize)) + 2
    : Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// --- RAW palitra: har bir hex FAQAT shu yerda (dublikat yo'q) ---
// Yangi UI ranglarini o'zgartirmoqchi bo'lsangiz — faqat shu yerni tahrirlang.
const palette = {
  blue: '#4e91d2', // brend / primary
  blueDark: '#4F92D1', // statusbar / primary-dark
  green: '#48BB78', // money / success
  red: 'red', // danger (legacy — keyin to'g'ri hex'ga o'tkaziladi)
  white: '#fff',
  black: '#000',
  grey: '#8692A6', // disabled / muted
  greyLight: '#A9ABAD', // placeholder / border
  bg: '#F7FAFC', // ekran foni
  surfaceAlt: '#f0f3f7', // ikkilamchi yuza (karta toggle va h.k.)
  surfaceTint: '#EAF2FB', // ko'k tusli karta foni (settings va h.k.)
};

// --- SEMANTIK tokenlar (yangi komponentlar SHULARNI ishlatsin) ---
export const tokens = {
  color: {
    primary: palette.blue,
    primaryDark: palette.blueDark,
    success: palette.green,
    money: palette.green,
    danger: palette.red,
    surface: palette.white,
    surfaceAlt: palette.surfaceAlt,
    surfaceTint: palette.surfaceTint,
    background: palette.bg,
    onSurface: palette.black,
    onPrimary: palette.white,
    border: palette.greyLight,
    muted: palette.grey,
    placeholder: palette.greyLight,
    // raw (legacy moslik uchun)
    white: palette.white,
    black: palette.black,
    red: palette.red,
  },
  font: {
    thin: 'Montserrat-Thin',
    light: 'Montserrat-Light',
    regular: 'Montserrat-Regular',
    medium: 'Montserrat-Medium',
    bold: 'Montserrat-Bold',
  },
  // Mavjud (legacy) fontSize shkalasi — o'zgarmagan, vizual buzilmasligi uchun.
  fontSize: {
    xa: hp('1.2%') + 2,
    small: hp('1.4%') + 2,
    xx: hp('1.6%') + 2,
    xs: hp('2%') + 2,
    s: normalize(16),
    m: normalize(17),
    l: normalize(18),
  },
  // YANGI: masofa shkalasi (avval umuman yo'q edi — har joyda raw raqam edi)
  spacing: {
    xs: normalize(4),
    sm: normalize(8),
    md: normalize(16),
    lg: normalize(24),
    xl: normalize(32),
  },
  // YANGI: burchak radiusi shkalasi
  radius: {
    sm: normalize(6),
    md: normalize(10),
    lg: normalize(16),
    pill: 999,
  },
  size: {
    width,
    height,
    textInputHeight: normalize(45),
    codeButtonSize: normalize(45),
    buttonHeight: height / 13,
  },
  // YANGI: karta soyasi (ilgari ~50 ekranda copy-paste edi)
  shadow: {
    card: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
  },
};

export type Tokens = typeof tokens;
