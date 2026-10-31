import React from 'react';
import { Text, View } from 'react-native';
import { rd, rs } from '../../../../theme/rd';
import { styles } from './amaliyotStyles';

// Bitta "yorliq — qiymat" qatori.
export const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

// Sarlavhali bo'lim kartasi.
export const Section = ({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: (p: any) => React.JSX.Element;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHead}>
      <Icon size={rs(16)} color={rd.color.textTertiary} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);
