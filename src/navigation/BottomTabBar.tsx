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
          title: t('hisobot'),
        }}
        name="Statistic"
        component={Statistic}
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
