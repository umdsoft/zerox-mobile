/**
 * RdTabBar.tsx — Redizayn pastki tab-bar (barcha tablar uchun umumiy).
 * react-navigation bottom-tabs `tabBar` API'sini amalga oshiradi: tablarni almashtiradi.
 * Dizayn: RD/01 Asosiy pastki pill (Figma).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  CoinIcon,
  ContractIcon,
  HomeIcon,
  IconProps,
  LedgerIcon,
  WalletIcon,
} from '../screens/home/redesign/icons';
import { rd, rs } from '../theme/rd';

/**
 * Tab tartibi BottomTabNavigator ekranlari bilan POZITSION mos:
 * Home, QarzShartnomasi, QarzDaftari, ShaxsiyQarz, Statistic — barchasi
 * HAQIQIY TAB (darhol almashadi, slayd yo'q).
 */
const TABS: {
  label: string;
  Icon: (p: IconProps) => JSX.Element;
}[] = [
  // Yorliqda so'z MANTIQIY joyda sinadi ("Qarz" tepada, moduli pastda).
  // "Asosiy" -> "Bosh\nsahifa" (so'rov bo'yicha) — endi u ham 2 qatorli, qolgan
  // tablar (Qarz shartnomasi/daftari, Shaxsiy moliya) bilan bir xil joylashadi.
  { label: 'Bosh\nsahifa', Icon: HomeIcon },
  { label: 'Qarz\nshartnomasi', Icon: ContractIcon },
  { label: 'Qarz\ndaftari', Icon: LedgerIcon },
  // SS7: yangi 5-bo'lim — "Shaxsiy qarz" (ilgari Shaxsiy moliya ichida edi).
  { label: 'Shaxsiy\nqarz', Icon: CoinIcon },
  // "Statistika" -> "Shaxsiy moliya" (so'rov bo'yicha) — moliya/hamyon ikonasi.
  { label: 'Shaxsiy\nmoliya', Icon: WalletIcon },
];

const RdTabBar = ({ state, navigation }: any) => {
  const { t } = useTranslation();
  return (
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
            <tab.Icon size={rs(22)} color={active ? rd.color.primary : rd.color.textTertiary} />
            <Text
              numberOfLines={2}
              style={[styles.label, active && styles.labelActive]}
            >
              {t(tab.label)}
            </Text>
            {/* Doiracha olib tashlandi (so'rov bo'yicha) — faol holat endi FAQAT
                ikona va yorliq rangi bilan bildiriladi. */}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
  );
};

export default RdTabBar;

const styles = StyleSheet.create({
  // Root SafeAreaView allaqachon pastki inset qo'llaydi — bu yerda takrorlanmaydi.
  wrap: { paddingHorizontal: rs(12), paddingTop: rs(8), paddingBottom: rs(8), backgroundColor: rd.color.page },
  bar: {
    height: rs(80),
    paddingHorizontal: rs(8),
    flexDirection: 'row',
    // Yorliqlar TEPADAN boshlanadi (flex-start) — barning ortiqcha balandligi
    // PASTGA tushadi, shu bois 2-qatorli so'z bilan pastki chiziq orasida aniq
    // bo'shliq qoladi (ilgari markazlashgan edi, so'z chiziqqa yaqin turardi).
    alignItems: 'flex-start',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rs(22),
  },
  // justifyContent:flex-start + labelга QAT'IY 2-qatorlik balandlik — 1-qatorli
  // ("Asosiy"/"Shaxsiy moliya") va 2-qatorli yorliqlar bir xil joy egallaydi,
  // shu bois BARCHA ikonalar bir chiziqda turadi (siljimaydi).
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: rs(4),
    // SS7: endi 5 ta bo'lim — har bir element ~20% torroq.
    paddingHorizontal: rs(1),
    paddingTop: rs(10),
  },
  // 2-qatorli yorliq ("Qarz\nshartnomasi" ...) ning 2-qator 'y' descenderi KESILMASIN.
  // YAKUNIY SABAB (batch-9): oldingi `height:rs(34)` + `textAlignVertical:'center'`
  // 2-qator descenderini label QUTISI ichida kesardi (real qurilmalarda shrift metrikasi
  // balandroq → 34px yetmasdi). Fixed height va textAlignVertical OLIB TASHLANDI —
  // label endi tabiiy o'lchamda (includeFontPadding default=true descenderni to'liq
  // saqlaydi), bar (rs(80)) ichida yetarli bo'sh joy bor, hech narsa kesilmaydi.
  label: {
    fontFamily: rd.font.medium,
    // SS7: 5 bo'limda "shartnomasi" sig'ishi uchun 9.5 -> 8.8.
    fontSize: rs(8.8),
    lineHeight: rs(13),
    textAlign: 'center',
    color: rd.color.textTertiary,
  },
  labelActive: { fontFamily: rd.font.semibold, color: rd.color.primary },
  dot: { width: rs(5), height: rs(5), borderRadius: rs(2.5), backgroundColor: 'transparent' },
});
