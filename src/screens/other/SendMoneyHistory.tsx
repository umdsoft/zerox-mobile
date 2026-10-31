import { StatusBar, View } from 'react-native';
import React, { useCallback, useRef } from 'react';
import RdHeader from '../home/redesign/RdHeader';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import TopTabBarSendMoney from '../../navigation/TopTabBarSendMoney';
import { t } from 'i18next';
import Enter from './sendMoney/Enter';
import Exit from './sendMoney/Exit';
import ShowDetailsModal from './sendMoney/ShowDetailsModal';
import { styles } from './sendMoney/sendMoneyStyles';

const TopTab = createMaterialTopTabNavigator();

const SendMoneyHistory = () => {
  let modalRef = useRef(null);

  //type 2 kirim 1 bulsa chiqim

  const openModal = useCallback((item: any, type: any) => {
    modalRef?.open(true, item, type);
  }, []);
  const closeModal = useCallback(() => {
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <RdHeader title={t('582')} />

      <View style={styles.topbar}>
        <TopTab.Navigator tabBar={props => <TopTabBarSendMoney {...props} />}>
          <TopTab.Screen
            name="Enter"
            component={() => (
              <Enter openModal={openModal} closeModal={closeModal} />
            )}
            options={{ title: t('585') }}
          />
          <TopTab.Screen
            name="Exit"
            component={() => (
              <Exit openModal={openModal} closeModal={closeModal} />
            )}
            options={{ title: t('588') }}
          />
        </TopTab.Navigator>
      </View>
      <ShowDetailsModal
        getRef={(props: React.MutableRefObject<null>) => (modalRef = props)}
      />
    </View>
  );
};

export default SendMoneyHistory;
