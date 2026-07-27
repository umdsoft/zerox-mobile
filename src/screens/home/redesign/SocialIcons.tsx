/**
 * SocialIcons.tsx — ijtimoiy tarmoq ikonalari.
 *
 * So'rov bo'yicha OLDINGI ko'rinishga qaytarildi: barcha ikonalar BIR XIL tekis
 * KO'K DOIRA (#4e91d2) + oq glif. Brend-rangli squircle variant bekor qilindi.
 */
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Props = { size?: number };

// Tekis ko'k doira asos + oq glif (barcha platformalar uchun bir xil).
const BLUE = '#4e91d2';
const Frame = ({
  size = 40,
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="12" fill={BLUE} />
    {children}
  </Svg>
);

export const FacebookIcon = ({ size }: Props) => (
  <Frame size={size}>
    <Path
      fill="#fff"
      d="M14.6 13.9l.42-2.73h-2.62V9.4c0-.75.37-1.48 1.55-1.48h1.19V5.6s-1.08-.18-2.11-.18c-2.15 0-3.56 1.3-3.56 3.66v2.09H7.06v2.73h2.4v6.6h2.94v-6.6z"
    />
  </Frame>
);

export const InstagramIcon = ({ size }: Props) => (
  <Frame size={size}>
    <Rect
      x="6.6"
      y="6.6"
      width="10.8"
      height="10.8"
      rx="3.3"
      fill="none"
      stroke="#fff"
      strokeWidth="1.7"
    />
    <Circle cx="12" cy="12" r="2.8" fill="none" stroke="#fff" strokeWidth="1.7" />
    <Circle cx="15.5" cy="8.5" r="1" fill="#fff" />
  </Frame>
);

export const TelegramIcon = ({ size }: Props) => (
  <Frame size={size}>
    <Path
      fill="#fff"
      d="M17.9 7.4 6.3 11.9c-.68.27-.67.65-.12.82l2.97.93 1.15 3.6c.14.38.25.53.51.53.26 0 .38-.12.53-.32l1.43-1.39 2.97 2.2c.55.3.94.14 1.08-.51l1.94-9.16c.2-.8-.3-1.16-.87-.9zm-2.2 2.02-5.4 4.88-.21 2.24-1.1-3.45 6.03-3.8c.28-.18.53.02.29.24z"
    />
  </Frame>
);

export const XIcon = ({ size }: Props) => (
  <Frame size={size}>
    <Path
      fill="#fff"
      d="M15.9 6.7h1.9l-4.15 4.74L18.5 17.7h-3.83l-3-3.92-3.43 3.92H6.34l4.44-5.07L6.3 6.7h3.93l2.71 3.58zm-.67 9.86h1.05L9.02 7.77H7.9z"
    />
  </Frame>
);

export const YoutubeIcon = ({ size }: Props) => (
  <Frame size={size}>
    <Path
      fill="#fff"
      d="M18.7 8.9a1.9 1.9 0 0 0-1.34-1.35C16.18 7.23 12 7.23 12 7.23s-4.18 0-5.36.32A1.9 1.9 0 0 0 5.3 8.9C5 10.1 5 12 5 12s0 1.9.3 3.1a1.9 1.9 0 0 0 1.34 1.35c1.18.32 5.36.32 5.36.32s4.18 0 5.36-.32a1.9 1.9 0 0 0 1.34-1.35c.3-1.2.3-3.1.3-3.1s0-1.9-.3-3.1zM10.7 14.3V9.7l3.9 2.3z"
    />
  </Frame>
);
