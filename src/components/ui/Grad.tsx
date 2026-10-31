import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Diagonal (0,0 -> 1,1) ikki rangli gradient fon; ota View ichida absolute to'ldiradi. `id` — sahifada noyob. */
export const Grad = ({ id, colors }: { id: string; colors: readonly string[] }) => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={colors[0]} />
        <Stop offset="1" stopColor={colors[1]} />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
  </Svg>
);

export default Grad;
