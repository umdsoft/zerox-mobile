import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet } from 'react-native';

import { style } from '../theme/style';
import { GiveDebt, Home, Statistic, TakeDebt } from './Index';
import MainBottomTab from './MainBottomTab';
let width = Dimensions.get('window').width;
let indicatorWidth = width / 4;
const BottomTabStack = createBottomTabNavigator();
export const BottomTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <BottomTabStack.Navigator
      tabBar={props => <MainBottomTab {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <BottomTabStack.Screen
        key={'Home'}
        options={{
          title: t('asosiy'),
        }}
        name="Home"
        component={Home}
      />
      <BottomTabStack.Screen
        key={'TakeDebt'}
        options={{
          title: t('qarzberish'),
        }}
        name="TakeDebt"
        component={TakeDebt}
      />
      <BottomTabStack.Screen
        key={'GiveDebt'}
        options={{
          title: t('qarzolish'),
        }}
        name="GiveDebt"
        component={GiveDebt}
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
