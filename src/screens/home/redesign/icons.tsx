/**
 * icons.tsx — Redizayn ikonkalari (Feather uslubi, react-native-svg).
 * Barcha ikonka bir xil API: { size?, color?, strokeWidth? }. 24px default, stroke 2.
 */
import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const Base = ({
  size = 24,
  color = '#131a2a',
  strokeWidth = 2,
  children,
}: IconProps & { children: React.ReactNode }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Svg>
);

// Uch tayoqcha: tepa va past TO'LIQ, o'rtadagisi biroz O'NGGA surilgan
// (chapdan qisqaroq) — so'rov bo'yicha. Doira yo'q (header'da menuBtn).
export const MenuIcon = (p: IconProps) => (
  <Base {...p} size={p.size ?? 24} strokeWidth={p.strokeWidth ?? 2.2}>
    <Line x1="3" y1="6" x2="21" y2="6" />
    <Line x1="8" y1="12" x2="21" y2="12" />
    <Line x1="3" y1="18" x2="21" y2="18" />
  </Base>
);

export const BellIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Base>
);

export const ArrowUpRight = (p: IconProps) => (
  <Base {...p}>
    <Line x1="7" y1="17" x2="17" y2="7" />
    <Polyline points="7 7 17 7 17 17" />
  </Base>
);

export const ArrowDownLeft = (p: IconProps) => (
  <Base {...p}>
    <Line x1="17" y1="7" x2="7" y2="17" />
    <Polyline points="17 17 7 17 7 7" />
  </Base>
);

export const PlusIcon = (p: IconProps) => (
  <Base {...p}>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Base>
);

export const GridIcon = (p: IconProps) => {
  const c = p.color ?? '#2f6fed';
  return (
    <Svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="8" height="8" rx="2" stroke={c} strokeWidth={p.strokeWidth ?? 2} />
      <Rect x="13" y="3" width="8" height="8" rx="2" stroke={c} strokeWidth={p.strokeWidth ?? 2} />
      <Rect x="3" y="13" width="8" height="8" rx="2" stroke={c} strokeWidth={p.strokeWidth ?? 2} />
      <Rect x="13" y="13" width="8" height="8" rx="2" fill={c} />
    </Svg>
  );
};

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="9" />
    <Polyline points="12 7 12 12 15.5 14" />
  </Base>
);

export const ChevronRight = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 2.4}>
    <Polyline points="9 6 15 12 9 18" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Base>
);

export const ArrowDown = (p: IconProps) => (
  <Base {...p}>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Polyline points="19 12 12 19 5 12" />
  </Base>
);

export const ArrowUp = (p: IconProps) => (
  <Base {...p}>
    <Line x1="12" y1="19" x2="12" y2="5" />
    <Polyline points="5 12 12 5 19 12" />
  </Base>
);

export const BarChartIcon = (p: IconProps) => (
  <Base {...p}>
    <Line x1="6" y1="20" x2="6" y2="14" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="18" y1="20" x2="18" y2="10" />
  </Base>
);

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20z" />
    <Polyline points="9 21.5 9 13 15 13 15 21.5" />
  </Base>
);

export const ShieldIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Polyline points="9 11.5 11 13.5 15 9.5" />
  </Base>
);

export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Base>
);

export const TransferIcon = (p: IconProps) => (
  <Base {...p}>
    <Line x1="4" y1="9" x2="18" y2="9" />
    <Polyline points="15 6 18 9 15 12" />
    <Line x1="20" y1="15" x2="6" y2="15" />
    <Polyline points="9 12 6 15 9 18" />
  </Base>
);

// Shartnoma — burchagi bukilgan hujjat + matn qatorlari (rasmiy varaq).
export const ContractIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <Polyline points="14 3 14 9 20 9" />
    <Line x1="8" y1="13" x2="15" y2="13" />
    <Line x1="8" y1="17" x2="12" y2="17" />
  </Base>
);

// Daftar — muqovali daftar (chap tomonda tikuv chizig'i + varaq qatorlari).
export const LedgerIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M6 3h13a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <Line x1="8" y1="3" x2="8" y2="21" />
    <Line x1="11" y1="8" x2="17" y2="8" />
    <Line x1="11" y1="12" x2="17" y2="12" />
  </Base>
);

// Hamyon — mobil hisob balansi uchun.
export const WalletIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
    <Path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
    <Path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </Base>
);

// Ulashish.
export const ShareIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="18" cy="5" r="3" />
    <Circle cx="6" cy="12" r="3" />
    <Circle cx="18" cy="19" r="3" />
    <Line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    <Line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
  </Base>
);

// QR-kod.
export const QrIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
    <Line x1="14" y1="14" x2="14" y2="17.5" />
    <Line x1="14" y1="21" x2="17.5" y2="21" />
    <Line x1="21" y1="14" x2="21" y2="21" />
    <Line x1="17.5" y1="17.5" x2="21" y2="17.5" />
  </Base>
);

// Erkak avatar — bosh + yelka (neytral odam siluети).
export const ManIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="8" r="3.6" />
    <Path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </Base>
);

// Ayol avatar — bosh + ko'ylak (uchburchak siluети) bilan ajraladi.
export const WomanIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="7.5" r="3.4" />
    <Path d="M12 11 L7.5 20 h9 Z" />
  </Base>
);

// Belgi (checkmark) — tasdiqlangan holat uchun.
export const CheckIcon = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 3}>
    <Polyline points="20 6 9 17 4 12" />
  </Base>
);

// Ilova haqida — ma'lumot.
export const InfoIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="9" />
    <Line x1="12" y1="11" x2="12" y2="16" />
    <Line x1="12" y1="7.6" x2="12" y2="7.7" />
  </Base>
);

export const SunSettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="4.5" />
    <Line x1="12" y1="2.5" x2="12" y2="5" />
    <Line x1="12" y1="19" x2="12" y2="21.5" />
    <Line x1="2.5" y1="12" x2="5" y2="12" />
    <Line x1="19" y1="12" x2="21.5" y2="12" />
    <Line x1="5.6" y1="5.6" x2="7.3" y2="7.3" />
    <Line x1="16.7" y1="16.7" x2="18.4" y2="18.4" />
    <Line x1="18.4" y1="5.6" x2="16.7" y2="7.3" />
    <Line x1="7.3" y1="16.7" x2="5.6" y2="18.4" />
  </Base>
);

export const HelpIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.1 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Base>
);

export const LogOutIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Base>
);

export const CoinIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="9" />
    <Circle cx="12" cy="12" r="3.2" />
  </Base>
);

export const BackspaceIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <Line x1="18" y1="9" x2="12" y2="15" />
    <Line x1="12" y1="9" x2="18" y2="15" />
  </Base>
);

export const WifiOffIcon = (p: IconProps) => (
  <Base {...p}>
    <Line x1="2" y1="2" x2="22" y2="22" />
    <Path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <Path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
    <Path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
    <Path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
    <Path d="M5 13a10 10 0 0 1 5.24-2.76" />
    <Line x1="12" y1="20" x2="12.01" y2="20" />
  </Base>
);

export const LockIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="3.5" y="11" width="17" height="10" rx="2.5" />
    <Path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
  </Base>
);

export const PhoneIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </Base>
);

export const ChevronLeft = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 2.4}>
    <Polyline points="15 6 9 12 15 18" />
  </Base>
);

export const MessageIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Base>
);

export const BuildingIcon = (p: IconProps) => (
  // Lucide "building" — deraza nuqtalari h.01 (ishonchli render; nol uzunlik EMAS).
  <Base {...p}>
    <Rect x="4" y="2" width="16" height="20" rx="2" />
    <Path d="M9 22v-4h6v4" />
    <Path d="M8 6h.01" />
    <Path d="M16 6h.01" />
    <Path d="M12 6h.01" />
    <Path d="M12 10h.01" />
    <Path d="M12 14h.01" />
    <Path d="M16 10h.01" />
    <Path d="M16 14h.01" />
    <Path d="M8 10h.01" />
    <Path d="M8 14h.01" />
  </Base>
);

export const FingerprintIcon = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 1.8}>
    <Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <Path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <Path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
    <Path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
    <Path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <Path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
    <Path d="M2 16h.01" />
    <Path d="M21.8 16c.2-2 .131-5.354 0-6" />
  </Base>
);
