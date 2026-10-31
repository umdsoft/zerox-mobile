import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { rd, rs } from '../../../theme/rd';
import { BellIcon } from '../redesign/icons';

// Qo'ng'iroqcha "jiringlaydi" — chapga-o'ngga tebranish (bo'sh bildirishnoma holati).
const RingingBell = () => {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 110 }),
        withTiming(-1, { duration: 220 }),
        withTiming(0.6, { duration: 180 }),
        withTiming(-0.4, { duration: 150 }),
        withTiming(0, { duration: 110 }),
        withDelay(1500, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );
  }, [rot]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 14}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <BellIcon size={rs(34)} color={rd.color.primary} />
    </Animated.View>
  );
};

export default RingingBell;
