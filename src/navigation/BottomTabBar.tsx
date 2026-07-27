import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
let width = Dimensions.get('window').width;
let indicatorWidth = width / 4;
const BottomTabStack = createBottomTabNavigator();
export const BottomTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <BottomTabStack.Navigator
      backBehavior="history"
      tabBar={props => <RdTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Tab o'tishida SLAYD/animatsiya yo'q (darhol).
        animation: 'none',
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
