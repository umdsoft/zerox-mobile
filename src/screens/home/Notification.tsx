import { FlatList, View } from 'react-native';
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import TopTabBar from '../../navigation/TopTabBar';
import NewsNotificationCard from '../components/NewsNotification';
import RdHeader from './redesign/RdHeader';
import { rd, rs } from '../../theme/rd';
import { t } from 'i18next';
import Bildrishnoma from './notification/Bildrishnoma';
import RdEmpty from './notification/RdEmpty';
import { styles } from './notification/notificationStyles';

const TopTab = createMaterialTopTabNavigator();
const Notification = () => {
  return (
    <View style={styles.rdContainer}>
      <RdHeader title={t('666')} />
      <View style={styles.rdBody}>
        <TopTab.Navigator
          tabBar={props => <TopTabBar {...props} />}
          screenOptions={{ sceneStyle: { backgroundColor: rd.color.page } }}
        >
          <TopTab.Screen
            options={{ tabBarLabel: t('666') }}
            name="Bildrishnoma"
            component={Bildrishnoma}
          />
          <TopTab.Screen
            options={{ tabBarLabel: t('669') }}
            name="News"
            component={News}
          />
        </TopTab.Navigator>
      </View>
    </View>
  );
};

const News = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        keyExtractor={({ id }) => id?.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: rs(16), paddingBottom: rs(16) }}
        ListEmptyComponent={<RdEmpty text={t('Yangiliklar mavjud emas')} news />}
        renderItem={({ item, index }) => {
          return <NewsNotificationCard data={item} key={index} />;
        }}
      />
    </View>
  );
};

export default Notification;
