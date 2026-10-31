import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { rd, rs } from '../../../../theme/rd';
// Rasmiy "ZeroX" wordmark (logotipning matn qismi) — header uchun.
import ZeroXWordmark from '../../../../images/TextAndLogo';
import { BellIcon, MenuIcon, UserIcon } from '../icons';
import { styles } from './homeStyles';

const GradientBg = () => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id="rdGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={rd.color.gradient[0]} />
        <Stop offset="1" stopColor={rd.color.gradient[1]} />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#rdGrad)" />
  </Svg>
);

/**
 * Header — chapda menyu tugmasi, o'ngda AVATAR + qo'ng'iroq.
 *
 * Dizayn talabi bo'yicha o'zgardi:
 *  - "Assalomu alaykum 👋" salomi va qo'l ikonkasi olib tashlandi;
 *  - foydalanuvchi ismi sarlavha qatorida ko'rsatilmaydi;
 *  - "BB" bosh harflari o'rniga odamni bildiruvchi ikonka (UserIcon);
 *  - avatar o'ng tomonga, qo'ng'iroqdan OLDIN ko'chirildi;
 *  - avatar bosilsa Sozlamalar (profil) sahifasi ochiladi.
 * Natijada qator ancha yengil bo'ldi — kichik ekranlarda ism uzun bo'lsa ham
 * siqilib ketmaydi (endi umuman matn yo'q).
 */
const HomeHeader = ({
  badge,
  onMenu,
  onBell,
  onProfile,
}: {
  badge: number;
  onMenu: () => void;
  onBell: () => void;
  onProfile: () => void;
}) => (
  <View style={styles.headerRow}>
    {/* Chapda: menyu + ilova nomi — foydalanuvchi qayerdaligini biladi. */}
    <View style={styles.headerLeft}>
      {/* Menyu tugmasi — DOIRASIZ (so'rov bo'yicha): faqat 3 ta tayoqcha. */}
      <TouchableOpacity activeOpacity={0.7} style={styles.menuBtn} onPress={onMenu}>
        <MenuIcon color={rd.color.text} size={rs(24)} />
      </TouchableOpacity>
      {/* Rasmiy "ZeroX" wordmark (logotip shrifti va rangi). viewBox kengroq +
          balandroq render — pastki qismi kesilmasin (Samsung'da kesilib turgandi). */}
      <ZeroXWordmark
        width={rs(90)}
        height={rs(30)}
        viewBox="0 250 4000 1300"
        fill="#0063B6"
        color="#FF2D2D"
      />
    </View>

    {/* O'ngda: qo'ng'iroq, keyin avatar (eski ilovadagi tartib). */}
    <View style={styles.headerRight}>
      <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn} onPress={onBell}>
        <BellIcon color={rd.color.text} size={rs(24)} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} allowFontScaling={false} numberOfLines={1}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} style={styles.avatar} onPress={onProfile}>
        <GradientBg />
        <UserIcon color={rd.color.onPrimary} size={rs(20)} />
      </TouchableOpacity>
    </View>
  </View>
);

export default HomeHeader;
