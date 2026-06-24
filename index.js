/**
 * @format
 */

// CSPRNG polyfill — eng birinchi (shifrlash kaliti uchun crypto.getRandomValues).
import 'react-native-get-random-values';
import React, {useEffect, useState} from 'react';
import App from './App';
import {name as appName} from './app.json';
import {initSecureStorage} from './src/store/api/token/getToken';
import {Provider} from 'react-redux';
import {Store} from './src/store/store/Store';
import messaging from '@react-native-firebase/messaging';
import {NavigationContainer} from '@react-navigation/native';
import {linking} from './src/navigation/Navigation';
import notifee, {EventType} from '@notifee/react-native';
import {navigate, navigationRef} from './src/navigation/NavigationRef';
import {getNotificationWithPage} from './src/store/api/home';
import {setFbNotificationId} from './src/store/reducers/HomeReducer';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Appearance, AppRegistry, LogBox} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import {logDebug, logError} from './src/log';
import {
  LOG_BOX_IGNORE_MESSAGES,
  UPDATE_NOTIFICATION_MESSAGES,
  isUpdateNotification,
  SCREENS,
} from './src/constants';

LogBox.ignoreLogs([...LOG_BOX_IGNORE_MESSAGES]);
LogBox.ignoreAllLogs();
Appearance.setColorScheme('light');

crashlytics().log('App mounted successfully');

/**
 * Global error handler for logging errors to Crashlytics
 */
ErrorUtils.setGlobalHandler((error, isFatal) => {
  crashlytics().recordError(error);
  logError('Global error', error);

  if (isFatal) {
    // Optional: show custom crash screen or restart app
  }
});

/**
 * Background message handler for Firebase Cloud Messaging
 */
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Shifrlangan storage tayyor bo'lsin (handler token'ni storage'dan o'qiydi).
  await initSecureStorage();
  logDebug('Message handled in the background', remoteMessage);
  
  if (remoteMessage?.data?.id) {
    Store.dispatch(
      setFbNotificationId({
        fbNotificationId: remoteMessage.data.id,
      }),
    );
  }
  
  if (remoteMessage) {
    Store.dispatch(getNotificationWithPage({page: 1}));
    navigate(SCREENS.NOTIFICATION);
  }
});

/**
 * Background event handler for Notifee notifications
 */
notifee.onBackgroundEvent(async ({type, detail}) => {
  // Shifrlangan storage tayyor bo'lsin (handler token'ni storage'dan o'qiydi).
  await initSecureStorage();
  logDebug('Background event triggered', {type, detail});
  
  if (type === EventType.PRESS && detail?.notification) {
    logDebug('Notification clicked', detail.notification);
    Store.dispatch(getNotificationWithPage({page: 1}));
    
    const notificationData = detail.notification.data;
    if (isUpdateNotification(notificationData)) {
      logDebug('Update notification clicked');
    } else {
      navigate(SCREENS.NOTIFICATION);
    }
  }
});

/**
 * Main application wrapper with providers
 */
const MainApp = () => {
  // Maxfiy storage (shifrlangan MMKV) tayyor bo'lguncha render'ni kutamiz — App ichidagi
  // token/PIN o'qishlari shifrlangan storage'dan ishlashi uchun. registerComponent SINXRON
  // (pastda) — shu sabab "ZeroX has not been registered" xatosi bo'lmaydi.
  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    initSecureStorage().finally(() => setStorageReady(true));
  }, []);

  if (!storageReady) {
    return null; // storage init tez (keychain) — qisqa vaqt native splash ko'rinadi
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <SafeAreaProvider>
        <Provider store={Store}>
          <App />
        </Provider>
      </SafeAreaProvider>
    </NavigationContainer>
  );
};

// registerComponent SINXRON — native runApplication("ZeroX")'dan OLDIN ro'yxatdan o'tadi.
AppRegistry.registerComponent(appName, () => MainApp);
