/**
 * @format
 */

import App from './App';
import {name as appName} from './app.json';
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

AppRegistry.registerComponent(appName, () => MainApp);
