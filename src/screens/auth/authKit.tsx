/**
 * authKit.tsx — auth (kirish/ro'yxatdan o'tish/parol tiklash) ekranlarining
 * umumiy vizual tili.
 *
 * DIZAYN FIKRI. ZeroX norasmiy qarzni YURIDIK KUCHGA EGA HUJJATGA aylantiradi,
 * shiori "ishonch kafolati". Oldingi auth dizayni esa istalgan fintech starter
 * shabloni edi: tekis kulrang fon + oq kartochka + ko'k tugma — mahsulot haqida
 * hech narsa aytmasdi. Shu sababli vizual til HUJJAT dunyosidan olindi:
 *
 *  - MUHR (AuthSeal) — logotip ortidagi radial brend yog'dusi: rasmiy shtamp
 *    siyohi qog'ozga singganday. Bitta ataylab qo'yilgan dog' (tarqoq
 *    "gradient sharlar" emas — ular har qanday sahifada uchraydi).
 *  - YORLIQLAR (authLabel) — KATTA HARF + keng harf oralig'i: rasmiy blankdagi
 *    maydon nomlari tili. Montserrat qat'iy bo'lgani uchun shaxsiyat shrift
 *    tanlashdan emas, shkala/og'irlik/traking kontrastidan keladi.
 *  - MAYDONLAR (authField) — tekis chegara o'rniga qog'ozdek ko'tarilgan yuza;
 *    fokusda brend halqasi bilan "faol maydon" ajralib turadi.
 *  - TUGMA (AuthPrimaryButton) — tekis rang o'rniga brend gradienti va rangli
 *    soya: bosiladigan asosiy amal ekranning eng "og'ir" elementi bo'ladi.
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Rect, Stop } from 'react-native-svg';
import { rd, rs } from '../../theme/rd';

/** Muhr yog'dusi — hero (logotip/illyustratsiya) ORTIGA qo'yiladi. */
export const AuthSeal = ({ size = rs(300), top = rs(-40) }: { size?: number; top?: number }) => (
  <View pointerEvents="none" style={[styles.sealWrap, { height: size, top }]}>
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="authSeal" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={rd.color.primary} stopOpacity="0.18" />
          <Stop offset="0.55" stopColor={rd.color.primary} stopOpacity="0.06" />
          <Stop offset="1" stopColor={rd.color.primary} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={size} height={size} fill="url(#authSeal)" />
    </Svg>
  </View>
);

/**
 * Hero — "hujjat varag'i".
 *
 * Ilgari logotip va illyustratsiya kulrang fonда suzib turardi: kompozitsiya
 * yo'q edi, shuning uchun ekran "shablon" bo'lib ko'rinardi. Endi ular oq
 * varaq ustida turadi, muhr yog'dusi esa varaq ICHIGA singadi — mahsulotning
 * o'zi (qarzni rasmiy hujjatga aylantirish) vizual tilga aylanadi.
 * Oq fon illyustratsiyalarning oq foni bilan ham uyg'unlashadi.
 */
export const AuthHero = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) => (
  <View style={[styles.hero, style]}>
    <AuthSeal size={rs(280)} top={rs(-70)} />
    {children}
  </View>
);

/** Ishonch qatori — "ishonch kafolati" shiorining amaliy ifodasi. */
export const AuthTrustNote = ({ text }: { text: string }) => (
  <View style={styles.trust}>
    <Svg width={rs(13)} height={rs(13)} viewBox="0 0 24 24">
      <Rect
        x="4"
        y="10.5"
        width="16"
        height="10.5"
        rx="2.5"
        fill={rd.color.textTertiary}
      />
      <Rect
        x="8.4"
        y="5"
        width="7.2"
        height="9"
        rx="3.6"
        fill="none"
        stroke={rd.color.textTertiary}
        strokeWidth="2"
      />
    </Svg>
    <Text style={styles.trustText}>{text}</Text>
  </View>
);

/** Asosiy amal tugmasi — brend gradienti + rangli soya. */
export const AuthPrimaryButton = ({
  label,
  onPress,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
}) => {
  const off = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={off}
      onPress={onPress}
      style={[styles.btn, off ? styles.btnOff : styles.btnOn, style]}
    >
      {!off && (
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="authBtn" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={rd.color.gradient[0]} />
              <Stop offset="1" stopColor={rd.color.gradient[1]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#authBtn)" />
        </Svg>
      )}
      {loading ? (
        <ActivityIndicator color={rd.color.onPrimary} />
      ) : (
        <Text style={[styles.btnText, off && styles.btnTextOff]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

/**
 * Umumiy uslub bo'laklari — ekranlar o'z StyleSheet'ida shulardan foydalanadi,
 * shunda barcha auth ekranlari bir xil ko'rinadi.
 */
export const authStyles = StyleSheet.create({
  /** Rasmiy blank yorlig'i: KATTA HARF + keng traking. */
  label: {
    fontFamily: rd.font.bold,
    fontSize: rs(10.5),
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: rd.color.textTertiary,
    marginBottom: rs(8),
  },
  /** Qog'ozdek ko'tarilgan kiritish maydoni. */
  field: {
    height: rs(58),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: '#E6EBF4',
    paddingHorizontal: rs(16),
    shadowColor: '#0E1626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  /** Fokus — brend halqasi va yumshoq brend soyasi. */
  fieldFocused: {
    borderColor: rd.color.primary,
    borderWidth: 1.5,
    shadowColor: rd.color.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  /** Sarlavha — kattaroq va zichroq traking (nufuzli ko'rinish). */
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(24),
    letterSpacing: -0.4,
    color: rd.color.text,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  sealWrap: { position: 'absolute', alignSelf: 'center', alignItems: 'center' },
  // "Hujjat varag'i" — oq yuza, yumshoq soya, muhr yog'dusi ichida.
  hero: {
    alignItems: 'center',
    paddingTop: rs(18),
    paddingBottom: rs(20),
    paddingHorizontal: rs(16),
    borderRadius: rs(28),
    backgroundColor: rd.color.surface,
    overflow: 'hidden',
    shadowColor: '#0E1626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    marginTop: rs(18),
  },
  trustText: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  btn: {
    height: rs(56),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnOn: {
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  btnOff: { backgroundColor: rd.color.surfaceAlt },
  btnText: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    letterSpacing: 0.2,
    color: rd.color.onPrimary,
  },
  btnTextOff: { color: rd.color.textTertiary },
});
