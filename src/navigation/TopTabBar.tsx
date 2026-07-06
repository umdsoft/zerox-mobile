import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import React from 'react';
import { useSelector } from 'react-redux';
import { rd, rs } from '../theme/rd';

const TopTabBar = ({ state, descriptors, navigation }) => {
  const { notification } = useSelector(reduxState => reduxState.HomeReducer);

  return (
    <View style={styles.wrap}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
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
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const count =
            index === 0
              ? notification?.bild?.length || 0
              : notification?.news?.length || 0;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.85}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.badge, isFocused && styles.badgeActive]}>
                  <Text style={styles.badgeText}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default TopTabBar;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: rs(16), paddingTop: rs(4), paddingBottom: rs(10) },
  container: {
    flexDirection: 'row',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    padding: rs(4),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    height: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.radius.pill,
    gap: rs(6),
  },
  tabActive: {
    backgroundColor: rd.color.surface,
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    color: rd.color.textTertiary,
  },
  labelActive: { fontFamily: rd.font.semibold, color: rd.color.text },
  badge: {
    minWidth: rs(18),
    height: rs(18),
    paddingHorizontal: rs(5),
    borderRadius: rs(9),
    backgroundColor: rd.color.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: { backgroundColor: rd.color.primary },
  badgeText: {
    fontFamily: rd.font.bold,
    fontSize: rs(10),
    color: rd.color.onPrimary,
  },
});
