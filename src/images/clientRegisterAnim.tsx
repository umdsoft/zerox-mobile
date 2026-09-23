/**
 * clientRegisterAnim.tsx — SS17/SS18 (2026-09-15).
 *
 * "Mijoz qo'shish" / "Mijozni tahrirlash" ekranlaridagi doiraning o'rniga
 * MAQSADLI animatsiya: markazda mijoz ikonasi, atrofida ro'yxatdan o'tishni
 * bildiruvchi kengayuvchi halqalar, o'ng pastda esa amalni bildiruvchi nishon
 * (qo'shishda "+", tahrirlashda qalam) — u yengil "pop" bilan chiqadi.
 *
 * NEGA GIF/Lottie EMAS: loyihada "mijoz qo'shish" mavzusidagi tayyor animatsiya
 * fayli yo'q, qo'lda Lottie JSON yasash esa katta va mo'rt bo'lardi. Bu variant
 * `Animated` ustiga qurilgan — qo'shimcha bayt yuklamaydi, oflayn ishlaydi va
 * rangi ekran aksentiga moslashadi.
 *
 * ⚠️ `useNativeDriver: true` — animatsiya UI oqimida ishlaydi, JS oqimi band
 *    bo'lsa ham silliq qoladi.
 */
import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { PencilIcon, PlusIcon, UserIcon } from '../screens/home/redesign/icons';

type Props = {
  /** Umumiy o'lcham (px). Halqalar shu o'lchamdan tashqariga chiqmaydi. */
  size?: number;
  /** Aksent rang — ekranning "berish/olish" rangi bilan mos keladi. */
  color?: string;
  /** Nishon turi: yangi mijoz uchun 'add', tahrirlash uchun 'edit'. */
  mode?: 'add' | 'edit';
};

/** Bitta kengayuvchi halqa (ro'yxatdan o'tish "to'lqini"). */
const Ripple = ({ size, color, delay }: { size: number; color: string; delay: number }) => {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        // Qayta boshlashdan oldin ko'rinmas holatga qaytadi.
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.35, 0] }),
          transform: [
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.35] }) },
          ],
        },
      ]}
    />
  );
};

const ClientRegisterAnimation = ({ size = 104, color = '#2f6fed', mode = 'add' }: Props) => {
  const core = React.useRef(new Animated.Value(1)).current;
  const badge = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Markaz — sekin "nafas olish".
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(core, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(core, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    // Nishon — bir marta "pop" bilan paydo bo'ladi (amal bajarilayotganini bildiradi).
    const pop = Animated.spring(badge, {
      toValue: 1,
      friction: 5,
      tension: 90,
      delay: 260,
      useNativeDriver: true,
    });
    breathe.start();
    pop.start();
    return () => {
      breathe.stop();
      badge.stopAnimation();
    };
  }, [core, badge]);

  const badgeSize = Math.round(size * 0.34);
  const Badge = mode === 'edit' ? PencilIcon : PlusIcon;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ripple size={size} color={color} delay={0} />
      <Ripple size={size} color={color} delay={900} />

      <Animated.View
        style={{
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: (size * 0.72) / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: core }],
        }}>
        <UserIcon size={Math.round(size * 0.36)} color="#fff" />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          right: Math.round(size * 0.04),
          bottom: Math.round(size * 0.06),
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: badge,
          transform: [{ scale: badge }],
        }}>
        <Badge size={Math.round(badgeSize * 0.56)} color={color} />
      </Animated.View>
    </View>
  );
};

export default ClientRegisterAnimation;
