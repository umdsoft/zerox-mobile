import React from 'react';
import { View } from 'react-native';

/** Doira shaklidagi rangli fon ichida ikonka (markazlangan). */
export const CircleIcon = ({
  size,
  bg,
  children,
}: {
  size: number;
  bg: string;
  children: React.ReactNode;
}) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </View>
);

export default CircleIcon;
