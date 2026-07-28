/**
 * GlobalBottomBar.tsx — Butun ilova bo'ylab doimiy pastki menyu.
 *
 * Asosiy tablar (Home/TakeDebt/GiveDebt/Statistic) o'zining RdTabBar'iga ega; bu global
 * bar esa DETAL/oqim ekranlarida ko'rsatiladi (qulaylik uchun — har sahifadan asosiy
 * bo'limlarga tez o'tish). App.tsx uni layout SIBLINGI sifatida joylaydi (overlay emas)
 * — shu sabab ekran kontenti ustini yopmaydi.
 *
 * Bosilganda BottomTabNavigator ichidagi tegishli tab'ga o'tadi.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ContractIcon,
  HomeIcon,
  IconProps,
  LedgerIcon,
  WalletIcon,
} from '../screens/home/redesign/icons';
import { rd, rs } from '../theme/rd';
import { navigationRef } from './NavigationRef';

/**
 * `tab` — BottomTabNavigator ichidagi tab nomi.
 * `route` — to'g'ridan-to'g'ri stack ekrani (menyudagi bo'lim).
 */
const TABS: {
  label: string;
  Icon: (p: IconProps) => JSX.Element;
  tab: string;
  route?: string;
}[] = [
  { label: 'Asosiy', Icon: HomeIcon, tab: 'Home' },
  // Pastki panel endi AMALGA emas, BO'LIMGA olib boradi: "Olish"/"Berish"
  // bitta amalni bildirardi, foydalanuvchi esa bu yerdan modulning o'ziga
  // (menyudagi bo'limlarga) o'tishni kutadi. Ikonalar menyudagilar bilan bir xil.
  { label: 'Qarz\nshartnomasi', Icon: ContractIcon, tab: 'QarzShartnomasi' },
  { label: 'Qarz\ndaftari', Icon: LedgerIcon, tab: 'QarzDaftari' },
  // "Statistika" -> "Shaxsiy moliya" (RdTabBar bilan bir xil).
  { label: 'Shaxsiy\nmoliya', Icon: WalletIcon, tab: 'Statistic' },
];

const GlobalBottomBar = ({ activeTab }: { activeTab?: string }) => (
  <View style={styles.wrap}>
    <View style={styles.bar}>
      {TABS.map(item => {
        const active = activeTab === item.tab;
        return (
          <TouchableOpacity
            key={item.tab}
            activeOpacity={0.8}
            style={styles.item}
            onPress={() =>
              item.route
                ? (navigationRef.current as any)?.navigate(item.route)
                : (navigationRef.current as any)?.navigate('BottomTabNavigator', {
                    screen: item.tab,
                  })
            }
          >
            <item.Icon
              size={rs(24)}
              color={active ? rd.color.primary : rd.color.textTertiary}
            />
            <Text
              numberOfLines={2}
              style={[styles.label, active && styles.labelActive]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default GlobalBottomBar;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: rs(12),
    paddingTop: rs(8),
    paddingBottom: rs(8),
    backgroundColor: rd.color.page,
  },
  bar: {
    height: rs(73),
    paddingHorizontal: rs(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rs(22),
  },
  // Ikonalar bir chiziqda (label'ga qat'iy 2-qatorlik balandlik — RdTabBar bilan bir xil).
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: rs(4),
    paddingHorizontal: rs(2),
    paddingTop: rs(10),
  },
  // 2-qatorli yorliq ("Qarz\nshartnomasi" ...) ning 2-qatori KESILMASIN:
  // balandlik 2 qatorga yetadigan qilib oshirildi (rs(28)) va Android'da pastki
  // harflar (descender) kesilmasligi uchun includeFontPadding:false.
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(9.5),
    lineHeight: rs(12),
    height: rs(28),
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'top',
    color: rd.color.textTertiary,
  },
  labelActive: { fontFamily: rd.font.semibold, color: rd.color.primary },
});
