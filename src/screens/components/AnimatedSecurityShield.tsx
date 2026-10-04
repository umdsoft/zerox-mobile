/**
 * AnimatedSecurityShield — Xavfsizlik bo'limi uchun animatsiyali qalqon ikonkasi.
 *
 * SS-DEV (2026-10-04): 04.10 hujjat (image5) — ilgari hujjat+qalqon lottie'si
 * (xavfsizlikni aniq ifodalamasdi). Yangi paket qo'shilmadi: RN `Animated` +
 * react-native-svg. Animatsiya: tashqi to'lqin halqalari (pulse), qalqon yengil
 * "nafas oladi" (scale), ichidagi qulf/belgi davriy ravishda paydo bo'ladi.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { rd } from '../../theme/rd';

type Props = { size?: number; color?: string };

const AnimatedSecurityShield = ({ size = 150, color = rd.color.primary }: Props) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const checkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(check, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.back(1.8)),
          useNativeDriver: true,
        }),
        Animated.delay(2600),
        Animated.timing(check, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(250),
      ]),
    );
    pulseLoop.start();
    breatheLoop.start();
    checkLoop.start();
    return () => {
      pulseLoop.stop();
      breatheLoop.stop();
      checkLoop.stop();
    };
  }, [pulse, breathe, check]);

  const shield = size * 0.62;
  const ring = (offset: number) => {
    // Ikkinchi halqa birinchisidan yarim davr keyin.
    const v = Animated.modulo(Animated.add(pulse, offset), 1);
    return {
      opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.35, 0] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }],
    };
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 0.5].map(o => (
        <Animated.View
          key={o}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: size / 2, backgroundColor: color },
            ring(o),
          ]}
        />
      ))}
      <View
        style={[
          styles.disc,
          {
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: size * 0.39,
            backgroundColor: rd.color.primaryTint,
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [
            { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) },
          ],
        }}
      >
        <Svg width={shield} height={shield} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id="secShieldG" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#4f8bff" />
              <Stop offset="1" stopColor={color} />
            </LinearGradient>
          </Defs>
          <Path
            d="M12 2.2 4.2 5.1v6.1c0 4.9 3.3 9.2 7.8 10.6 4.5-1.4 7.8-5.7 7.8-10.6V5.1L12 2.2z"
            fill="url(#secShieldG)"
          />
          {/* qulf korpusi */}
          <Rect x="8.6" y="10.6" width="6.8" height="5.4" rx="1.1" fill="#fff" />
          <Path
            d="M10 10.6V9.1a2 2 0 0 1 4 0v1.5"
            stroke="#fff"
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
          <Rect x="11.4" y="12.4" width="1.2" height="2" rx="0.6" fill={color} />
        </Svg>
        {/* Tasdiq belgisi — davriy "pop" */}
        <Animated.View
          style={[
            styles.badge,
            {
              width: shield * 0.36,
              height: shield * 0.36,
              borderRadius: shield * 0.18,
              opacity: check,
              transform: [
                { scale: check.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
              ],
            },
          ]}
        >
          <Svg width={shield * 0.22} height={shield * 0.22} viewBox="0 0 24 24">
            <Path
              d="M5 12.5l4.2 4.2L19 7"
              stroke="#fff"
              strokeWidth={3.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default AnimatedSecurityShield;

const styles = StyleSheet.create({
  disc: { position: 'absolute' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    backgroundColor: rd.color.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
