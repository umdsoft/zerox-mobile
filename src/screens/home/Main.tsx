import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { Portal, Provider } from 'react-native-paper';
import messaging from '@react-native-firebase/messaging';

import notifee, { EventType } from '@notifee/react-native';
// Components
import Header from '../components/Header';
import { BottomTabNavigator } from '../../navigation/BottomTabBar';
import { BackGroundIcon } from '../../helper/homeIcon';

// Styles
import { style } from '../../theme/style';

// Store
import {
  getCreditorAndDebitorData,
  getMe,
  getNotifications,
  getNotificationWithPage,
  onPostDefaultLang,
} from '../../store/api/home';
import { createFmtTokenAction } from '../../store/api/user';
import { storage } from '../../store/api/token/getToken';
import { setUsd } from '../../store/reducers/HomeReducer';

// Helpers

import { handleNotificationPermission } from '../../helper/handlePermission';
import { fetchUSDExchangeRate } from '../../helper/getUsdExchange';
import { NotificationBadgeModule } from '../../nativemodule/notificationBadge';

const Main = () => {
  const { user, notification } = useSelector(state => state.HomeReducer);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const hasUnreadNotifications = useMemo(
    () => notification?.bild?.length > 0,
    [notification?.bild?.length],
  );

  const registerFCMToken = useCallback(async () => {
    try {
      await messaging().registerDeviceForRemoteMessages();

      const token = await messaging().getToken();
      storage.set('fcmtoken', token);
      await dispatch(createFmtTokenAction({ fmt_token: token }));
      dispatch(getMe());
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  }, []);

  const onGetLocalToken = useCallback(async () => {
    const storedToken = storage.getString('fcmtoken');

    if (!storedToken) {
      await registerFCMToken();
    } else {
      try {
        await dispatch(createFmtTokenAction({ fmt_token: storedToken }));
        dispatch(getMe());
      } catch (error) {
        console.error('Failed to use stored FCM token:', error);
        await registerFCMToken(); // Fallback to registering new token
      }
    }
  }, [registerFCMToken]);

  const handleNotificationEvents = useCallback(() => {
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.warn('Notification received in foreground:', remoteMessage);
      dispatch(getNotificationWithPage({ page: 1 }));
      dispatch(getCreditorAndDebitorData());

      // try {
      //   const channelId = await notifee.createChannel({
      //     id: 'default',
      //     name: 'Default Channel',
      //     importance: AndroidImportance.HIGH,
      //   });

      //   await notifee.displayNotification({
      //     title: remoteMessage.notification?.title,
      //     body: remoteMessage.notification?.body,
      //     android: {
      //       channelId,
      //       smallIcon: 'ic_launcher',
      //       pressAction: {
      //         id: 'default',
      //       },
      //     },
      //     ios: {
      //       sound: 'default',
      //       badgeCount: 1,
      //     },
      //   });
      // } catch (error) {
      //   console.error('Error displaying notification:', error);
      // }
    });

    // ✅ Foreground tap handler
    const unsubscribeForeground = notifee.onForegroundEvent(
      ({ type, detail }) => {
        if (type === EventType.PRESS) {
          console.log(
            'User tapped notification in foreground:',
            detail.notification,
          );
          const isLocked = storage.getBoolean('appLocked');

          if (isLocked) {
            // Save target navigation for after unlock
            storage.set(
              'pendingNavigation',
              JSON.stringify({
                screen: 'NotificationScreen',
                data: {},
              }),
            );

            navigation.reset({
              index: 0,
              routes: [{ name: 'SetLocalPassword' }],
            });
          } else {
            // Directly go to notification screen
            navigation.navigate('Notification');
            dispatch(getNotifications({ page: 1 }));
          }
          // navigation.navigate('Notification');
          // dispatch(getNotifications({page: 1}));
        }
      },
    );

    // ✅ App opened from background/killed by tapping notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          const isLocked = storage.getBoolean('appLocked');

          if (isLocked) {
            // Save target navigation for after unlock
            storage.set(
              'pendingNavigation',
              JSON.stringify({
                screen: 'NotificationScreen',
                data: {},
              }),
            );

            navigation.reset({
              index: 0,
              routes: [{ name: 'SetLocalPassword' }],
            });
          } else {
            // Directly go to notification screen
            navigation.navigate('Notification');
            dispatch(getNotifications({ page: 1 }));
          }
          // navigation.navigate('Notification');
          // dispatch(getNotifications({page: 1}));
        }
      });

    // const unsubscribeOpenApp = messaging().onNotificationOpenedApp(
    //   remoteMessage => {
    //     console.warn('App opened from background via FCM:', remoteMessage);
    //     if (remoteMessage) {
    //       const isLocked = storage.getBoolean('appLocked');

    //       if (isLocked) {
    //         // Save target navigation for after unlock
    //         storage.set(
    //           'pendingNavigation',
    //           JSON.stringify({
    //             screen: 'NotificationScreen',
    //             data: {},
    //           }),
    //         );

    //         navigation.reset({
    //           index: 0,
    //           routes: [{name: 'SetLocalPassword'}],
    //         });
    //       } else {
    //         // Directly go to notification screen
    //         navigation.navigate('Notification');
    //         dispatch(getNotifications({page: 1}));
    //       }
    //     }
    //   },
    // );

    const unsubscribeRefToken = messaging().onTokenRefresh(async token => {
      console.warn('FCM token refreshed:', token);
      storage.set('fcmtoken', token);
      dispatch(createFmtTokenAction({ fmt_token: token }));
      dispatch(getMe());
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeForeground();
      // unsubscribeOpenApp();
      unsubscribeRefToken();
    };
  }, [navigation]);

  const initializeApp = useCallback(async () => {
    try {
      await handleNotificationPermission();
      await onGetLocalToken();
      handleNotificationEvents();

      // Biometrik (Touch/Face ID) DEFAULT O'CHIQ — fresh install'da avtomatik
      // yoqilmaydi (oldin oferta tasdiqlashda kutilmagan biometrik so'rardi).
      // Foydalanuvchi o'zi Xavfsizlik bo'limidan yoqadi (opt-in).
      if (storage.getBoolean('touch') === undefined) {
        storage.set('touch', false);
      }

      // Fetch USD exchange rate
      const usdRate = await fetchUSDExchangeRate();
      dispatch(setUsd({ usd: usdRate }));
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }, [handleNotificationEvents, onGetLocalToken]);

  const postDefaultLanguage = useCallback(async () => {
    try {
      const defaultLanguage = storage.getString('lang') || 'uz';
      console.log('Default language:', defaultLanguage);
      console.log('User ID:', user?.data?.id);
      const d = await dispatch(
        onPostDefaultLang({ lang: defaultLanguage, id: user?.data?.id }),
      ).unwrap();
      console.log('Default language set successfully:', d);
    } catch (error) {
      console.error('Error setting default language:', error);
    }
  }, [user?.data?.id]);

  useEffect(() => {
    initializeApp();
    postDefaultLanguage();
  }, [initializeApp, postDefaultLanguage]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      notifee.setBadgeCount(notification.bild?.length || 0).then(() => {
        console.log('Badge count set successfully');
      });
    } else {
      NotificationBadgeModule.setBadgeOnlyNumber(
        notification.bild?.length || 0,
      );
    }
  }, [notification.bild?.length]);

  const renderBotomTabNavigator = useMemo(() => {
    return <BottomTabNavigator />;
  }, []);

  return (
    <View style={styles.container}>
      <Provider>
        <Portal>
          <StatusBar backgroundColor={style.blue} />
          <View style={styles.background}>
            <BackGroundIcon width="100%" height="100%" />
          </View>

          <Header
            user={user?.data}
            data={notification}
            show={hasUnreadNotifications}
            count={notification.bild?.length}
          />
          {renderBotomTabNavigator}
        </Portal>
      </Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    height: style.height / 3,
    width: '100%',
  },
});

export default Main;
