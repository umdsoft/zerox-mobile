/**
 * BrandLockup — ZeroX RASMIY (patentlangan) logotipi.
 *
 * DIQQAT: logotip trademark hisoblanadi — o'zgartirilmaydi, qayta chizilmaydi.
 * Asl `src/images/logo.svg` aynan ko'rsatiladi (orqada rang/badge YO'Q, faqat
 * sahifa fonida). Login va ro'yxatdan o'tish oqimida bir xil brend ko'rinishi uchun.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { rd, rs } from '../../theme/rd';
import Logo from '../../images/logo.svg';

// Asl logo.svg nisbati (viewBox 133 x 97).
const LOGO_RATIO = 97 / 133;

type Props = {
  // Logotip eni. Eski chaqiruvlarga moslik uchun `badgeSize` ham qabul qilinadi.
  width?: number;
  badgeSize?: number;
  showWordmark?: boolean;
  wordSize?: number;
};

const BrandLockup = ({ width, badgeSize }: Props) => {
  // badgeSize (eski) berilsa undan proporsional en, aks holda default.
  const w = width ?? (badgeSize ? Math.round(badgeSize * 1.7) : rs(150));
  const h = Math.round(w * LOGO_RATIO);
  return (
    <View style={styles.wrap}>
      <Logo width={w} height={h} />
    </View>
  );
};

export default BrandLockup;

// GradientIconBadge — qadam ekranlari uchun yumshoq brend badge (BOLD ko'k emas):
// och `primaryTint` fon + primary rangli ikona. Logotip EMAS — funksional aksent.
export const GradientIconBadge = ({
  size = rs(84),
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) => {
  const radius = Math.round(size * 0.29);
  return (
    <View
      style={[
        styles.softBadge,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  softBadge: {
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
