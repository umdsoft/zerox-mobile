import React from 'react';

/**
 * SS8 (2026-09-18): 5 ta asosiy bo'lim orasida BARMOQ BILAN SURIB o'tish.
 *
 * `createBottomTabNavigator` surishni QO'LLAB-QUVVATLAMAYDI. Shu bois
 * `material-top-tabs` ishlatiladi — u `react-native-pager-view` ustida
 * ishlaydi va surishni beradi; panel esa `tabBarPosition: 'bottom'` bilan
 * PASTDA qoladi va AYNAN o'sha `RdTabBar` chiziladi (ko'rinish o'zgarmaydi).
 *
 * ⚠️ Navigator NOMI (`BottomTabNavigator`) va TAB nomlari o'zgarmadi —
 * `navigate('BottomTabNavigator', { screen })` chaqiruvlari va pastki menyu
 * rezolveri ishlayverdi.
 */
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet } from 'react-native';

import { style } from '../theme/style';
import { Statistic } from './Index';
import MainBottomTab from './MainBottomTab';
import RdTabBar from './RdTabBar';
import HomeRedesign from '../screens/home/redesign/HomeRedesign';
// Qarz shartnomasi / Qarz daftari endi HAQIQIY TAB (avval stack ekrani edi).
// Sabab: pastki paneldan o'tishda SLAYD animatsiyasi ko'rinardi va Asosiyga
// qaytganda sahifa qayta yuklanib summalar sakrardi. Tab bo'lgach — darhol
// almashadi va Home mount holatida qoladi (qayta yuklanmaydi).
import QarzShartnomasi from '../screens/home/modules/QarzShartnomasi';
import QarzDaftari from '../screens/home/modules/QarzDaftari';
// "Statistika" tab -> "Shaxsiy moliya" (so'rov bo'yicha): tab kontenti endi
// shaxsiy moliya dashboard'i (ShaxsiyMoliya). `tab:true` param bilan RdHeader'da
// orqaga tugma yashiriladi (tab — top-level, orqaga tugma kerak emas).
import ShaxsiyMoliya from '../screens/home/modules/ShaxsiyMoliya';
// SS7: "Shaxsiy qarz" endi MUSTAQIL pastki bo'lim (ilgari "Shaxsiy moliya"
// ichidagi karta edi). Tab sifatida ochilganda `tab:true` params orqali
// RdHeader'da orqaga tugmasi yashiriladi (tab — top-level ekran).
import FinanceDebts from '../screens/home/modules/FinanceDebts';
let width = Dimensions.get('window').width;
let indicatorWidth = width / 5;
const BottomTabStack = createMaterialTopTabNavigator();
export const BottomTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <BottomTabStack.Navigator
      /**
       * 🔴 SS4 (2026-09-19): "orqaga" tugmasi XRONOLOGIYA bo'yicha emas,
       * sahifalar KETMA-KETLIGI bo'yicha qaytsin.
       *
       * `history` — foydalanuvchi qaysi tartibda kirgan bo'lsa, o'sha tartibda
       * teskari yuradi: bir necha amaldan keyin "orqaga" bosilsa, ertalabdan
       * beri ochilgan sahifalar birin-ketin qayta chiqaverardi.
       * `order` — pastki menyudagi TARTIBDA bitta oldingi bo'limga qaytadi.
       */
      backBehavior="order"
      // Panel PASTDA (ko'rinish bottom-tabs bilan bir xil).
      tabBarPosition="bottom"
      tabBar={props => <RdTabBar {...props} />}
      screenOptions={{
        // SS8: chapdan-o'ngga surish yoqilgan.
        swipeEnabled: true,
        /**
         * 🔴 SS3 (2026-09-19): animatsiya O'CHIRILDI.
         *
         * `animationEnabled: true` bo'lganda TUGMA bilan o'tishda ham slayd
         * ishlardi: masalan Bosh sahifadan Shaxsiy moliyaga o'tganda oradagi
         * uchta sahifa "videotasma" kabi lip etib ko'rinib ketardi.
         *
         * `false` — dasturiy o'tish (pastki menyu, kartalar) DARHOL bo'ladi,
         * BARMOQ bilan surish esa baribir ishlaydi va tabiiy ergashadi
         * (pager gestiyasi `swipeEnabled` ga bog'liq, animatsiyaga emas).
         */
        animationEnabled: false,
        // lazy:false — barcha tablar ilova ochilishida MOUNT bo'ladi va
        // ma'lumot oldindan yuklanadi. Shunda "Qarz shartnomasi"/"Qarz
        // daftari"ga o'tishda aylanuvchi ZeroX yuklagichi (LottieView)
        // CHIQMAYDI — ekran darhol tayyor. Keyin ular mount holatida qoladi
        // (qayta yuklanmaydi).
        lazy: false,
      }}>
      <BottomTabStack.Screen
        key={'Home'}
        options={{
          title: t('asosiy'),
        }}
        name="Home"
        component={HomeRedesign}
      />
      <BottomTabStack.Screen
        key={'QarzShartnomasi'}
        options={{ title: 'Qarz shartnomasi' }}
        name="QarzShartnomasi"
        component={QarzShartnomasi}
      />
      <BottomTabStack.Screen
        key={'QarzDaftari'}
        options={{ title: 'Qarz daftari' }}
        name="QarzDaftari"
        component={QarzDaftari}
      />
      {/* SS7: 5-bo'lim — "Shaxsiy qarz" (Qarz daftari bilan Shaxsiy moliya orasida). */}
      <BottomTabStack.Screen
        key={'ShaxsiyQarz'}
        options={{ title: 'Shaxsiy qarz' }}
        name="ShaxsiyQarz"
        component={FinanceDebts}
        initialParams={{ tab: true }}
      />
      <BottomTabStack.Screen
        key={'Statistic'}
        options={{
          title: 'Shaxsiy moliya',
        }}
        name="Statistic"
        component={ShaxsiyMoliya}
        initialParams={{ tab: true }}
      />
    </BottomTabStack.Navigator>
  );
};
const styles = StyleSheet.create({
  text: focused => {
    return {
      fontSize: style.fontSize.xa,
      fontFamily: style.fontFamilyMedium,
      color: focused ? style.blue : 'gray',
    };
  },
  indicator: {
    width: indicatorWidth / 2,
    left: indicatorWidth / 4 - 2,
    backgroundColor: style.blue,
    height: 2,
    borderRadius: 50,
  },
});
// function getWidth(index) {
//   switch (index) {
//     case 1:
//       return indicatorWidth;
//     case 2:
//       return indicatorWidth * 2;
//     case 3:
//       return indicatorWidth * 3;
//     default:
//       return 0;
//   }
// }

// function animate(size, animateValue) {
//   return {
//     tabPress: e => {
//       animateValue.value = withTiming(size, {
//         duration: 300,
//         easing: Easing.linear,
//       });
//     },
//     swipeStart: e => {
//       animateValue.value = withTiming(size, {
//         duration: 300,
//         easing: Easing.linear,
//       });
//     },
//     swipeEnd: e => {
//       animateValue.value = withTiming(size, {
//         duration: 300,
//         easing: Easing.linear,
//       });
//     },
//   };
// }
