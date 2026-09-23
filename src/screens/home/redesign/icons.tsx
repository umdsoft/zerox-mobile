/**
 * icons.tsx — Redizayn ikonkalari (Feather uslubi, react-native-svg).
 * Barcha ikonka bir xil API: { size?, color?, strokeWidth? }. 24px default, stroke 2.
 */
import React from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polyline, Rect } from 'react-native-svg';

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

// Uch tayoqcha BIR XIL uzunlikda (15). O'rtadagisi O'NGGA surilgan — chap uchi
// ichkarida, o'ng uchi qolgan ikkitadan biroz chiqib turadi (so'rov bo'yicha).
// Doira yo'q (header'da menuBtn).
export const MenuIcon = (p: IconProps) => (
  <Base {...p} size={p.size ?? 24} strokeWidth={p.strokeWidth ?? 2.2}>
    <Line x1="3" y1="6" x2="18" y2="6" />
    <Line x1="6" y1="12" x2="21" y2="12" />
    <Line x1="3" y1="18" x2="18" y2="18" />
  </Base>
);

export const BellIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Base>
);

// Tangalar dastasi (coins) — PUL. "Qarzni qaytarish" hero uchun (pulni qaytarish).
export const CoinsIcon = (p: IconProps) => (
  <Base {...p}>
    <Ellipse cx="12" cy="6.5" rx="7" ry="3" />
    <Path d="M5 6.5 v4 c0 1.66 3.13 3 7 3 s7 -1.34 7 -3 v-4" />
    <Path d="M5 10.5 v4 c0 1.66 3.13 3 7 3 s7 -1.34 7 -3 v-4" />
  </Base>
);

// $ tanga — PUL (dollar belgili tanga). "Qarzni qaytarish" hero (pulni qaytarish).
export const MoneyCoinIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="9.5" />
    <Path d="M14.8 9 H10.6 a1.9 1.9 0 0 0 0 3.8 h2.8 a1.9 1.9 0 0 1 0 3.8 H9" />
    <Line x1="12" y1="6.7" x2="12" y2="17.3" />
  </Base>
);

// Pulni EGASIGA QAYTARISH — ochiq kaft (qo'l) pulni (tanga) uzatmoqda.
// "Qarzni qaytarish" hero: tanga EMAS, bank/DB EMAS, $ EMAS — aynan
// "pulni egasiga topshirish/qaytarish" ma'nosi (qo'l + tanga).
export const HandCoinReturnIcon = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 2}>
    {/* Qo'l/bilak — pastdan yuqoriga uzatmoqda (topshirmoqda) */}
    <Path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
    <Path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
    <Path d="m2 16 6 6" />
    {/* Tanga (pul) — uzatilayotgan qiymat */}
    <Circle cx="16" cy="9" r="2.9" />
    <Circle cx="6" cy="5" r="3" />
  </Base>
);

// Do'kon (storefront) — tent/awning + devor + eshik. "Savdo faoliyati" uchun.
export const StorefrontIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M3 9 L4.5 4 H19.5 L21 9 Z" />
    <Path d="M5 9 V20 H19 V9" />
    <Path d="M10 20 V14.5 H14 V14.5 V20" />
    <Line x1="3" y1="9" x2="21" y2="9" />
  </Base>
);

// Ogohlantirish uchburchagi (alert-triangle) — home "Ogohlantirishlar" alertlari.
export const WarningIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Base>
);

// Savat (trash-2) — o'chirish amallari uchun.
export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
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

// YUZ-SKAN — identifikatsiya (Lucide scan-face): skan-ramka burchaklari + yuz
// (ko'zlar + tabassum). "Identifikatsiyadan o'tish" hero uchun (touch-ID EMAS).
export const ScanFaceIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <Line x1="9" y1="9" x2="9.01" y2="9" />
    <Line x1="15" y1="9" x2="15.01" y2="9" />
  </Base>
);

// Mijoz QO'SHISH — odam + plus (Feather user-plus). "Yangi mijoz" hero uchun.
export const UserPlusIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="8.5" cy="7" r="4" />
    <Line x1="20" y1="8" x2="20" y2="14" />
    <Line x1="23" y1="11" x2="17" y2="11" />
  </Base>
);

export const ChevronRight = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 2.4}>
    <Polyline points="9 6 15 12 9 18" />
  </Base>
);

// Saqlangan foydalanuvchilar — ikki odam (Feather "users").
export const UsersIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Base>
);

// Nusxalash (copy) — ikki ustma-ust to'rtburchak.
export const CopyIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="9" y="9" width="11" height="11" rx="2" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Base>
);

// Kalendar (tug'ilgan sana).
export const CalendarIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <Line x1="3" y1="9" x2="21" y2="9" />
    <Line x1="8" y1="2.5" x2="8" y2="6" />
    <Line x1="16" y1="2.5" x2="16" y2="6" />
  </Base>
);

// Joylashuv nuqtasi (manzil).
export const LocationIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M20 10.5c0 5-8 11-8 11s-8-6-8-11a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10.5" r="2.6" />
  </Base>
);

// ID karta (tizimdagi ID raqami).
export const IdCardIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="3" y="5" width="18" height="14" rx="2.5" />
    <Circle cx="8.5" cy="11.5" r="2" />
    <Line x1="13" y1="10" x2="18" y2="10" />
    <Line x1="13" y1="13.5" x2="17" y2="13.5" />
    <Path d="M5.4 16.2c.5-1.4 1.8-2.1 3.1-2.1s2.6.7 3.1 2.1" />
  </Base>
);

// Telefon qilish (dumaloq tugma ichida — call).
export const PhoneCallIcon = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 2}>
    <Path d="M15.5 3.5a5 5 0 0 1 5 5M14.5 6.8a2.3 2.3 0 0 1 1.9 1.9" />
    <Path d="M6.5 4h2l1.2 3.2-1.6 1.1a11 11 0 0 0 4.6 4.6l1.1-1.6L17 12.5v2a1.5 1.5 0 0 1-1.6 1.5A12 12 0 0 1 5 5.6 1.5 1.5 0 0 1 6.5 4Z" />
  </Base>
);

// Biometrik: Face ID ramkasi (burchak qavslar) + ichida barmoq izi (Touch ID).
// Android'da Touch ID, iOS'da Face ID ni bildiruvchi UMUMLASHTIRILGAN ikona.
export const FaceTouchIdIcon = (p: IconProps) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 1.8}>
    {/* Face ID burchak qavslari */}
    <Path d="M5 9V7a2 2 0 0 1 2-2h2" />
    <Path d="M15 5h2a2 2 0 0 1 2 2v2" />
    <Path d="M19 15v2a2 2 0 0 1-2 2h-2" />
    <Path d="M9 19H7a2 2 0 0 1-2-2v-2" />
    {/* Touch ID barmoq izi (markazda) */}
    <Path d="M8.4 11.6a4.3 4.3 0 0 1 7.2 0" />
    <Path d="M9.9 13.2a2.5 2.5 0 0 1 4.2 0" />
    <Path d="M12 12.6v2.4" />
  </Base>
);

// To'ldirilgan yulduz — foydalanuvchi reytingi (sayt: "Reyting ★ 0.00").
export const StarIcon = (p: IconProps) => {
  const c = p.color ?? '#f5a623';
  const s = p.size ?? 24;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l2.9 5.9 6.5 0.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.3l6.5-0.9L12 2.5Z"
        fill={c}
      />
    </Svg>
  );
};

// To'ldirilgan (solid) odam avatari — profil/shaxsiy ma'lumotlar sarlavhasida.
// Jinsdan qat'i nazar bitta neytral ikona (so'rov bo'yicha).
export const AvatarPersonIcon = (p: IconProps) => {
  const c = p.color ?? '#2f6fed';
  const s = p.size ?? 24;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" fill={c} />
      <Path d="M12 13.4c-4.1 0-7.2 2.4-7.2 6V20h14.4v-0.6c0-3.6-3.1-6-7.2-6Z" fill={c} />
    </Svg>
  );
};

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

// Kompyuter/monitor — "Aktiv qurilmalar" (web bilan bir xil shakl).
export const MonitorIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="3" y="4.5" width="18" height="12" rx="2" />
    <Line x1="8.5" y1="20.5" x2="15.5" y2="20.5" />
    <Line x1="12" y1="16.5" x2="12" y2="20.5" />
  </Base>
);

// Smartfon — mobil qurilma sessiyasi (web bilan bir xil shakl).
export const SmartphoneIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="6" y="2" width="12" height="20" rx="2.6" />
    <Line x1="10.4" y1="18.6" x2="13.6" y2="18.6" />
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

// Manzillar kitobi (kontaktlar) — kartochka ichida odam + chapда tikuv chiziqlari.
// "Telefon kontaktlaridan tanlash" tugmasi uchun (QarzDaftariMijozYangi).
export const ContactBookIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="6" y="3" width="14" height="18" rx="2" />
    <Circle cx="13" cy="10" r="2.3" />
    <Path d="M9.6 16.2a3.6 3.6 0 0 1 6.8 0" />
    <Line x1="6" y1="7.5" x2="3.5" y2="7.5" />
    <Line x1="6" y1="12" x2="3.5" y2="12" />
    <Line x1="6" y1="16.5" x2="3.5" y2="16.5" />
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

// HARAKATLANUVCHI pul o'tkazish ikonkasi — ikkita strelka QARAMA-QARSHI
// yo'nalishда siljib turadi (yuqori strelka o'ngga, pastki chapga) — "hisobdan
// hisobga pul oqishi"ni jonli ko'rsatadi (so'rov: strelkalar harakatlansin).
export const AnimatedTransferIcon = ({
  size = 40,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => {
  const drive = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drive, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(drive, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drive]);

  const shift = size * 0.14;
  const rowH = size * 0.46;
  // Yuqori strelka (o'ngga qaragan) o'ngга-chapga; pastki (chapga qaragan) teskari.
  const topX = drive.interpolate({ inputRange: [0, 1], outputRange: [-shift, shift] });
  const botX = drive.interpolate({ inputRange: [0, 1], outputRange: [shift, -shift] });
  const sw = Math.max(2, size * 0.055);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', gap: size * 0.08 }}>
      <Animated.View style={{ transform: [{ translateX: topX }] }}>
        <Svg
          width={size}
          height={rowH}
          viewBox="0 0 24 11"
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round">
          <Line x1="2" y1="5.5" x2="18" y2="5.5" />
          <Polyline points="14 1.5 18.5 5.5 14 9.5" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: botX }] }}>
        <Svg
          width={size}
          height={rowH}
          viewBox="0 0 24 11"
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round">
          <Line x1="22" y1="5.5" x2="6" y2="5.5" />
          <Polyline points="10 1.5 5.5 5.5 10 9.5" />
        </Svg>
      </Animated.View>
    </View>
  );
};

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

// QR-kodni SKANER qilish — skaner ramkasi (4 burchak qavs / viewfinder) + ichida
// QR bo'laklari. Oddiy QR emas, aynan "skanerlash"ni ifodalaydi.
export const QrScanIcon = (p: IconProps) => {
  const c = p.color ?? '#2f6fed';
  const sw = p.strokeWidth ?? 2;
  const s = p.size ?? 24;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {/* Skaner ramkasi — 4 burchak qavs (viewfinder) */}
      <Path d="M3 8.5 V6 A3 3 0 0 1 6 3 H8.5" fill="none" />
      <Path d="M15.5 3 H18 A3 3 0 0 1 21 6 V8.5" fill="none" />
      <Path d="M21 15.5 V18 A3 3 0 0 1 18 21 H15.5" fill="none" />
      <Path d="M8.5 21 H6 A3 3 0 0 1 3 18 V15.5" fill="none" />
      {/* Ichida QR bo'laklari */}
      <Rect x="7.4" y="7.4" width="3.6" height="3.6" rx="0.7" />
      <Rect x="13" y="7.4" width="3.6" height="3.6" rx="0.7" fill={c} />
      <Rect x="7.4" y="13" width="3.6" height="3.6" rx="0.7" fill={c} />
      <Rect x="13" y="13" width="3.6" height="3.6" rx="0.7" />
    </Svg>
  );
};

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

// Belgi DOIRA ichida — "hammasi joyida / bo'sh" holat uchun (checkmark + doira).
export const CheckCircleIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="9" />
    <Polyline points="8.3 12 11 14.7 15.7 9.4" />
  </Base>
);

// Yangiliklar — gazeta (rasm bloki + matn qatorlari).
export const NewsIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M4 4 H17 A1 1 0 0 1 18 5 V18 A2 2 0 0 0 20 20 H6 A2 2 0 0 1 4 18 Z" />
    <Path d="M18 8 H20 A1 1 0 0 1 21 9 V18 A2 2 0 0 1 19 20" />
    <Rect x="6.5" y="7" width="4.5" height="4" rx="0.6" />
    <Line x1="13" y1="7.6" x2="15.5" y2="7.6" />
    <Line x1="13" y1="10.4" x2="15.5" y2="10.4" />
    <Line x1="6.5" y1="14" x2="15.5" y2="14" />
    <Line x1="6.5" y1="16.5" x2="12.5" y2="16.5" />
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

// Lampochka (ma'lumot/izoh) — bo'lim nima ekanligini tushuntirish uchun.
export const BulbIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M9 18h6" />
    <Path d="M10 22h4" />
    <Path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
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

// Qalam (tahrirlash) ikonkasi — "Tahrir" yorlig'i o'rniga (so'rov moliya-batch).
export const PencilIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 20h9" />
    <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </Base>
);

// Parolni tiklash ikonkasi — qulf + aylanma (refresh) strelka (so'rov SS19).
export const LockResetIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="4" y="12" width="16" height="9" rx="2.5" />
    <Line x1="12" y1="15.4" x2="12" y2="17.6" />
    <Path d="M7.5 12V8.5a4.5 4.5 0 0 1 8.2-2.6" />
    <Polyline points="16 3 16 6 13 6" />
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
