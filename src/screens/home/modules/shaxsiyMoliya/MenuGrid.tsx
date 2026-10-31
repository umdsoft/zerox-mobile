import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import type { MenuItem } from './shaxsiyMoliyaLogic';
import { styles } from './shaxsiyMoliyaStyles';

interface MenuGridProps {
  items: MenuItem[];
  go: (route: string) => void;
}

const MenuGrid = ({ items, go }: MenuGridProps) => (
  <View style={styles.menuGrid}>
    {items.map(m => {
      const Icon = m.Icon;
      return (
        <TouchableOpacity
          key={m.key}
          style={[styles.mCard, { backgroundColor: m.tint, borderColor: m.accent + '22' }]}
          activeOpacity={0.85}
          onPress={() => go(m.route)}>
          <View style={styles.mIcon}>
            <Icon size={rs(20)} color={m.accent} />
          </View>
          <Text allowFontScaling={false} style={styles.mTitle} numberOfLines={2}>
            {m.title}
          </Text>
          <Text allowFontScaling={false} style={[styles.mSub, { color: m.accent }]} numberOfLines={1}>
            {m.sub}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default MenuGrid;
