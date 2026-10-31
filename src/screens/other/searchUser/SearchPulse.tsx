import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { rd, rs } from '../../../theme/rd';
import { SearchIcon } from '../../home/redesign/icons';
import { styles } from './searchUserStyles';

/**
 * SS-DEV (2026-10-05): animatsiyali qidiruv belgisi — markazda odam silueti,
 * atrofida 2 ta pulsli halqa (scale+opacity) va orbita bo'ylab aylanuvchi lupa.
 * Faqat RN `Animated` (native driver) — yangi paket yo'q.
 */
const SearchPulse = ({ color }: { color: string }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const p = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    const r = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    p.start();
    r.start();
    return () => {
      p.stop();
      r.stop();
    };
  }, [pulse, spin]);

  const ring = (delay: number) => {
    const v = Animated.modulo(Animated.add(pulse, delay), 1);
    return {
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
      transform: [
        { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) },
      ],
    };
  };
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const counter = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <View style={styles.pulseBox}>
      <Animated.View style={[styles.pulseRing, ring(0)]} />
      <Animated.View style={[styles.pulseRing, ring(0.5)]} />
      <View style={styles.pulseCore}>
        <Svg width={rs(46)} height={rs(46)} viewBox="0 0 46 46">
          <Circle cx="23" cy="17" r="8" fill={rd.color.onPrimary} />
          <Rect
            x="9"
            y="28"
            width="28"
            height="14"
            rx="7"
            fill={rd.color.onPrimary}
          />
        </Svg>
      </View>
      <Animated.View
        style={[styles.orbit, { transform: [{ rotate }] }]}
        pointerEvents="none"
      >
        <Animated.View
          style={[styles.orbitBadge, { transform: [{ rotate: counter }] }]}
        >
          <SearchIcon size={rs(16)} color={color} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default SearchPulse;
