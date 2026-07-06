/**
 * RdTabBar.tsx — Redizayn pastki tab-bar (barcha tablar uchun umumiy).
 * react-navigation bottom-tabs `tabBar` API'sini amalga oshiradi: tablarni almashtiradi.
 * Dizayn: RD/01 Asosiy pastki pill (Figma).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  BarChartIcon,
  HomeIcon,
  IconProps,
} from '../screens/home/redesign/icons';
import { rd, rs } from '../theme/rd';

// Tab tartibi BottomTabNavigator ekranlari bilan bir xil: Home, TakeDebt, GiveDebt, Statistic.
const TABS: { label: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { label: 'Asosiy', Icon: HomeIcon },
  { label: 'Olish', Icon: ArrowDown },
  { label: 'Berish', Icon: ArrowUp },
  { label: 'Statistika', Icon: BarChartIcon },
];

const RdTabBar = ({ state, navigation }: any) => (
  <View style={styles.wrap}>
    <View style={styles.bar}>
      {state.routes.map((route: any, index: number) => {
        const active = state.index === index;
        const tab = TABS[index] ?? TABS[0];
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!active && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };
        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            style={styles.item}
            onPress={onPress}
          >
            <tab.Icon size={rs(24)} color={active ? rd.color.primary : rd.color.textTertiary} />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            <View style={[styles.dot, active && { backgroundColor: rd.color.primary }]} />
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default RdTabBar;

const styles = StyleSheet.create({
  // Root SafeAreaView allaqachon pastki inset qo'llaydi — bu yerda takrorlanmaydi.
  wrap: { paddingHorizontal: rs(12), paddingTop: rs(8), paddingBottom: rs(8), backgroundColor: rd.color.page },
  bar: {
    height: rs(64),
    paddingHorizontal: rs(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rs(22),
  },
  item: { flex: 1, alignItems: 'center', gap: rs(4), paddingBottom: rs(2) },
  label: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
  labelActive: { fontFamily: rd.font.semibold, color: rd.color.primary },
  dot: { width: rs(5), height: rs(5), borderRadius: rs(2.5), backgroundColor: 'transparent' },
});
