import * as React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

type Props = { size?: number };

// Buyuk Britaniya bayrog'i (ingliz tili) — dumaloq, soddalashtirilgan Union Jack.
export const UkFlag = ({ size = 20, ...rest }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 25 25" {...rest}>
    <Defs>
      <ClipPath id="uk_clip">
        <Circle cx="12.5" cy="12.5" r="12.5" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#uk_clip)">
      <Rect width="25" height="25" fill="#012169" />
      <Path d="M0 0 L25 25 M25 0 L0 25" stroke="#fff" strokeWidth="5" />
      <Path d="M0 0 L25 25 M25 0 L0 25" stroke="#C8102E" strokeWidth="2" />
      <Rect x="10" y="0" width="5" height="25" fill="#fff" />
      <Rect x="0" y="10" width="25" height="5" fill="#fff" />
      <Rect x="11" y="0" width="3" height="25" fill="#C8102E" />
      <Rect x="0" y="11" width="25" height="3" fill="#C8102E" />
    </G>
  </Svg>
);

// Qoraqalpog'iston bayrog'i — dumaloq (ko'k/sariq/yashil, qizil chiziqlar + oy-yulduz).
export const KarakalpakFlag = ({ size = 20, ...rest }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 25 25" {...rest}>
    <Defs>
      <ClipPath id="kk_clip">
        <Circle cx="12.5" cy="12.5" r="12.5" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#kk_clip)">
      <Rect x="0" y="0" width="25" height="9" fill="#00A3DD" />
      <Rect x="0" y="9" width="25" height="1" fill="#E30A17" />
      <Rect x="0" y="10" width="25" height="5.5" fill="#FDD116" />
      <Rect x="0" y="15.5" width="25" height="1" fill="#E30A17" />
      <Rect x="0" y="16.5" width="25" height="8.5" fill="#12AD54" />
      {/* Oy + yulduz (oq) ko'k chiziqda */}
      <Circle cx="6" cy="4.5" r="2.4" fill="#fff" />
      <Circle cx="7" cy="4.5" r="2" fill="#00A3DD" />
      <Path
        d="M11 3l.5 1.1 1.2.1-.9.8.3 1.2-1.1-.6-1.1.6.3-1.2-.9-.8 1.2-.1z"
        fill="#fff"
      />
    </G>
  </Svg>
);
