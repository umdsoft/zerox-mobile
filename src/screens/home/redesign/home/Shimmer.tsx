import React from 'react';
import { Animated } from 'react-native';
import { rs } from '../../../../theme/rd';
import { styles } from './homeStyles';

/**
 * SS-DEV (2026-10-05): Shimmer — birinchi yuklashda (kesh yo'q) 0 o'rniga
 * kulrang miltillovchi blok. Faqat native-driver opacity animatsiyasi.
 */
const Shimmer = ({
  width,
  height,
  radius = rs(6),
  onDark = false,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  onDark?: boolean;
  style?: any;
}) => {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  return (
    <Animated.View
      style={[
        onDark ? styles.shimmerDark : styles.shimmerLight,
        { width, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
};

export default Shimmer;
