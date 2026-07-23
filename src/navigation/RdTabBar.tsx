/**
 * RdTabBar.tsx — Redizayn pastki tab-bar (barcha tablar uchun umumiy).
 * react-navigation bottom-tabs `tabBar` API'sini amalga oshiradi: tablarni almashtiradi.
 * Dizayn: RD/01 Asosiy pastki pill (Figma).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  BarChartIcon,
  ContractIcon,
  HomeIcon,
  IconProps,
  LedgerIcon,
} from '../screens/home/redesign/icons';
import { rd, rs } from '../theme/rd';

/**
 * Tab tartibi BottomTabNavigator ekranlari bilan POZITSION mos:
 * Home, QarzShartnomasi, QarzDaftari, Statistic — barchasi HAQIQIY TAB
 * (darhol almashadi, slayd yo'q).
 */
const TABS: {
  label: string;
  Icon: (p: IconProps) => JSX.Element;
}[] = [
  // Yorliqda so'z MANTIQIY joyda sinadi ("Qarz" tepada, moduli pastda).
  { label: 'Asosiy', Icon: HomeIcon },
  { label: 'Qarz\nshartnomasi', Icon: ContractIcon },
  { label: 'Qarz\ndaftari', Icon: LedgerIcon },
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
            <Text
              numberOfLines={2}
              style={[styles.label, active && styles.labelActive]}
            >
              {tab.label}
            </Text>
            {/* Doiracha olib tashlandi (so'rov bo'yicha) — faol holat endi FAQAT
                ikona va yorliq rangi bilan bildiriladi. */}
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
    height: rs(70),
    paddingHorizontal: rs(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rs(22),
  },
  item: { flex: 1, alignItems: 'center', gap: rs(3), paddingHorizontal: rs(2) },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(9.5),
    lineHeight: rs(12),
    textAlign: 'center',
    color: rd.color.textTertiary,
  },
  labelActive: { fontFamily: rd.font.semibold, color: rd.color.primary },
  dot: { width: rs(5), height: rs(5), borderRadius: rs(2.5), backgroundColor: 'transparent' },
});
