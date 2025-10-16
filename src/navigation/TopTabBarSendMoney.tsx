import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import React from 'react';
import {style} from '../theme/style';
import {useSelector} from 'react-redux';
import MainText from '../screens/components/MainText';
const TopTabBarSendMoney = ({state, descriptors, navigation}) => {
  const {notification} = useSelector(reduxState => reduxState.HomeReducer);
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
            accessibilityRole="button"
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.container2(isFocused)}>
            <Text allowFontScaling={false} style={styles.lebel(isFocused)}>{label}</Text>
            {notification?.news?.length > 0 && (
              <View style={styles.countContainer}>
                <MainText size={'x'} style={styles.icon}>
                  {notification?.news.length}
                </MainText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TopTabBarSendMoney;
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
    width: '90%',
    alignSelf: 'center',
    borderRadius: 30,
    height: 50,
    padding: 8,
    backgroundColor: '#F0F2F5',
    marginBottom: 5,
  },
  icon: {
    color: '#fff',
    fontSize: style.fontSize.xa,
    fontFamily: style.fontFamilyMedium,
  },
  container2: isFocused => {
    return {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isFocused ? '#fff' : '#F0F2F5',
      borderRadius: isFocused ? 30 : 0,
    };
  },
  lebel: isFocused => {
    return {
      fontSize: style.fontSize.xx - 2,
      fontFamily: style.fontFamilyMedium,
      color: isFocused ? style.textColor : '#A9ABAD',
    };
  },
});
