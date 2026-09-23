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
import { StackActions } from '@react-navigation/native';
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
  // "Asosiy" -> "Bosh\nsahifa" (so'rov bo'yicha) — 2 qatorli, qolgan tablar bilan bir xil.
  { label: 'Bosh\nsahifa', Icon: HomeIcon, tab: 'Home' },
  // Pastki panel endi AMALGA emas, BO'LIMGA olib boradi: "Olish"/"Berish"
  // bitta amalni bildirardi, foydalanuvchi esa bu yerdan modulning o'ziga
  // (menyudagi bo'limlarga) o'tishni kutadi. Ikonalar menyudagilar bilan bir xil.
  { label: 'Qarz\nshartnomasi', Icon: ContractIcon, tab: 'QarzShartnomasi' },
  { label: 'Qarz\ndaftari', Icon: LedgerIcon, tab: 'QarzDaftari' },
  // SS7: yangi 5-bo'lim — "Shaxsiy qarz" (RdTabBar bilan bir xil tartib).
  { label: 'Shaxsiy\nqarz', Icon: CoinIcon, tab: 'ShaxsiyQarz' },
  // "Statistika" -> "Shaxsiy moliya" (RdTabBar bilan bir xil).
  { label: 'Shaxsiy\nmoliya', Icon: WalletIcon, tab: 'Statistic' },
];

/**
 * SS3-3 ROOT-CAUSE (2026-09-14) — detal ekranlarda HECH BIR tab ko'k bo'lmasdi.
 *
 * App.tsx global barga `activeTab={routeName}` — ya'ni JORIY STACK EKRANI nomini
 * ("QarzDaftariKarta", "FinanceDebtDetail", ...) uzatadi. Quyidagi TABS ro'yxatida
 * esa faqat 5 ta TAB nomi bor (Home/QarzShartnomasi/QarzDaftari/ShaxsiyQarz/
 * Statistic). Detal ekran nomi ular bilan HECH QACHON mos kelmagani uchun
 * `active` doim `false` bo'lib qolardi va butun panel kulrang ko'rinardi.
 *
 * Tuzatish — ekranni uning BO'LIMIGA moslashtiramiz:
 *   1) Modul ekranlari uchun aniq qoida (drawer orqali kirilsa ham to'g'ri);
 *   2) Qolgani uchun navigatsiya holatidagi AKTIV TABdan aniqlaymiz —
 *      BottomTabNavigator detal ekranlar OSTIDA mount bo'lib turadi, shuning
 *      uchun uning aktiv marshruti "foydalanuvchi qaysi menyudan kirgan"ni
 *      aniq bildiradi va yangi ekran qo'shilganda ro'yxatni yangilash shart emas.
 */
const SHAXSIY_QARZ_SCREENS = new Set([
  'FinanceDebts',
  'FinanceDebtAdd',
  'FinanceDebtDetail',
  'FinanceDebtors',
  'FinanceDebtGroup',
  'FinancePayoutCard',
]);

const TAB_NAMES = new Set(['Home', 'QarzShartnomasi', 'QarzDaftari', 'ShaxsiyQarz', 'Statistic']);

/**
 * Navigatsiya daraxtidan BottomTabNavigator'ni topib, uning AKTIV tabini qaytaradi.
 *
 * 🔴 SS14 ILDIZ SABAB (2026-09-15): oldingi variant faqat AKTIV yo'l bo'ylab
 * (`state.routes[state.index]`) pastga tushardi. Ammo detal ekran PUSH qilinganda
 * stack'ning aktiv marshruti o'sha detal ekran bo'ladi, `BottomTabNavigator` esa
 * uning OSTIDA (index'dan oldinroq) qoladi — ya'ni aktiv yo'lda EMAS. Natijada
 * rezolver uni hech qachon topmasdi va prefiks-qoidasi yo'q ekranlarda (masalan
 * "Qarz shartnomasi" bo'limining ro'yxat ekranlari) pastki menyu butunlay
 * kulrang qolaverardi.
 *
 * Endi BARCHA tugunlar bo'ylab qidiramiz (aktiv bo'lishi shart emas).
 */
const activeTabFromState = (state: any): string | undefined => {
  if (!state?.routes?.length) return undefined;
  // 1) Shu darajada BottomTabNavigator bormi?
  //
  // 🔴 SS-A ILDIZ SABAB (2026-09-16, DALIL bilan): global menyudan bo'lim
  // almashtirilganda `navigate('BottomTabNavigator', ...)` ustiga ekran push
  // qilingan bo'lsa, React Navigation mavjud nusxaga QAYTMAYDI — stekka
  // IKKINCHI nusxasini PUSH qiladi. Natijada stek shunday ko'rinadi:
  //
  //   StackNavigator( BottomTab(*QarzDaftari), QarzDaftariMijozlar,
  //                   BottomTab(*QarzShartnomasi), *SearchDebitor )
  //
  // Ikki nusxaning AKTIV TABI HAR XIL. Oldingi kod BIRINCHISINI olardi —
  // ya'ni ESKISINI — va pastki menyuda noto'g'ri bo'lim yonardi.
  //
  // To'g'ri javob — aktiv marshrutdan oldingi ENG OXIRGI nusxa: stekdagi
  // tartib xronologik, demak oxirgisi foydalanuvchi hozir turgan bo'lim.
  const upto = Math.min(
    state.index ?? state.routes.length - 1,
    state.routes.length - 1,
  );
  for (let i = upto; i >= 0; i--) {
    const r = state.routes[i];
    if (r?.name === 'BottomTabNavigator' && r.state?.routes?.length) {
      return r.state.routes[r.state.index ?? 0]?.name;
    }
  }
  // 2) Yo'q bo'lsa — ichma-ich navigatorlarga tushamiz (avval AKTIV yo'l,
  //    keyin qolganlari: aktiv yo'l odatda to'g'ri javobni tezroq beradi).
  const active = state.routes[state.index ?? 0];
  const found = activeTabFromState(active?.state);
  if (found) return found;
  // Qolganlarini ham ORQADAN oldinga: yuqoridagi bilan bir xil sabab —
  // stekda kechroq turgan tugun foydalanuvchining hozirgi holatiga yaqinroq.
  for (let i = state.routes.length - 1; i >= 0; i--) {
    const r = state.routes[i];
    if (r === active) continue;
    const f = activeTabFromState(r?.state);
    if (f) return f;
  }
  return undefined;
};

/** Ekran nomi -> pastki menyudagi bo'lim nomi. */
const sectionOf = (routeName?: string): string | undefined => {
  if (routeName && TAB_NAMES.has(routeName)) return routeName;
  if (routeName) {
    if (routeName.startsWith('QarzDaftari')) return 'QarzDaftari';
    if (SHAXSIY_QARZ_SCREENS.has(routeName)) return 'ShaxsiyQarz';
    if (routeName === 'ShaxsiyMoliya' || routeName.startsWith('Finance')) return 'Statistic';
  }
  try {
    return activeTabFromState((navigationRef.current as any)?.getRootState?.());
  } catch (_) {
    return undefined;
  }
};

/**
 * 🔴 SS10 ILDIZ SABAB (2026-09-18): "orqaga" tugmasi ertalabdan beri
 * ochilgan SAHIFALARNI QAYTA ko'rsatib chiqardi.
 *
 * Sabab — shu paneldagi `navigate('BottomTabNavigator', ...)`. Ustiga ekran
 * PUSH qilingan bo'lsa, React Navigation mavjud nusxaga QAYTMAYDI: stekka
 * BottomTabNavigator'ning YANGI nusxasini qo'shadi. Har bo'lim almashtirilganda
 * stek uzayib boradi:
 *
 *   Stack( BottomTab, EkranA, BottomTab, EkranB, BottomTab, ... )
 *
 * Natijada "orqaga" butun shu tarixni qayta aylanib chiqardi. (Aynan shu
 * dublikat 09-16 da pastki menyu NOTO'G'RI tabni yoritishiga ham sabab edi.)
 *
 * Yechim: `StackActions.popTo` — stekda MAVJUD ekranga QAYTADI (yo'q bo'lsa
 * qo'shadi). Shunda stekda BottomTabNavigator DOIM bitta bo'lib qoladi va
 * "orqaga" bitta oldingi sahifaga oladi.
 */
const goTab = (item: { tab: string; route?: string }) => {
  const ref: any = navigationRef.current;
  if (!ref) return;
  if (item.route) {
    ref.dispatch(StackActions.popTo(item.route));
    return;
  }
  ref.dispatch(StackActions.popTo('BottomTabNavigator', { screen: item.tab }));
};

const GlobalBottomBar = ({ activeTab }: { activeTab?: string }) => {
  const { t } = useTranslation();
  // `activeTab` har navigatsiyada o'zgaradi -> qayta render -> bu qiymat yangi.
  const section = sectionOf(activeTab);
  return (
  <View style={styles.wrap}>
    <View style={styles.bar}>
      {TABS.map(item => {
        const active = section === item.tab;
        return (
          <TouchableOpacity
            key={item.tab}
            activeOpacity={0.8}
            style={styles.item}
            onPress={() => goTab(item)}
          >
            <item.Icon
              size={rs(22)}
              color={active ? rd.color.primary : rd.color.textTertiary}
            />
            <Text
              numberOfLines={2}
              style={[styles.label, active && styles.labelActive]}
            >
              {t(item.label)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
  );
};

export default GlobalBottomBar;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: rs(12),
    paddingTop: rs(8),
    paddingBottom: rs(8),
    backgroundColor: rd.color.page,
  },
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
  // Ikonalar bir chiziqda (label'ga qat'iy 2-qatorlik balandlik — RdTabBar bilan bir xil).
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
});
