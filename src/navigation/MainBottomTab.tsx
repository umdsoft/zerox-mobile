import {View, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import React from 'react';
import {normalize, style} from '../theme/style';
import MainText from '../screens/components/MainText';
import {colors} from '../theme/colors';
import {fontSize} from '../theme/font';
import {GiveIcon, HomeIcon, StatisticIcon, TakeIcon} from './Index';
import { heightPercentageToDP } from 'react-native-responsive-screen';

const MainBottomTab = ({state, descriptors, navigation}) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // The `merge: true` option makes sure that the params inside the tab screen are preserved
            navigation.navigate({name: route.name, merge: true});
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.container2(isFocused)}>
            {renderIcon(index, isFocused)}
            <MainText
              mTop={4}
              textAlign={'center'}
              color={isFocused ? colors.blue : colors.placeHolderColor}
              size={style.fontSize.small - 1.5}
              style={styles.lebel(isFocused)}>
              {label}
            </MainText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const renderIcon = (index, isFocused) => {
  switch (index) {
    case 0:
      return <HomeIcon color={isFocused ? style.blue : '#A9ABAD'} />;
    case 1:
      return <TakeIcon color={isFocused ? style.blue : '#A9ABAD'} />;
    case 2:
      return <GiveIcon color={isFocused ? style.blue : '#A9ABAD'} />;
    case 3:
      return <StatisticIcon color={isFocused ? style.blue : '#A9ABAD'} />;
  }
};

export default MainBottomTab;
const styles = StyleSheet.create({
  countContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,

    position: 'absolute',
    alignSelf: 'flex-end',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'center',
    height: Platform.OS === 'ios' ? heightPercentageToDP(8) : normalize(55),
    backgroundColor: '#fff',
  },
  icon: {
    color: '#fff',
    fontSize: style.fontSize.xa,
    fontFamily: style.fontFamilyMedium,
  },
  container2: () => {
    return {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    };
  },
  lebel: isFocused => {
    return {
      fontSize: style.fontSize.xa + 1,
      fontFamily: style.fontFamilyMedium,
      color: isFocused ? style.blue : '#A9ABAD',
      marginTop: 5,
    };
  },
});
