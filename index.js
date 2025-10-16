/**
 * @format
 */

import App from './App';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import { Store } from './src/store/store/Store';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { linking } from './src/navigation/Navigation';
import notifee, { EventType } from '@notifee/react-native';
import { navigate, navigationRef } from './src/navigation/NavigationRef';
import { getNotificationWithPage } from './src/store/api/home';
import { setFbNotificationId } from './src/store/reducers/HomeReducer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Appearance, AppRegistry, LogBox } from 'react-native';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs();
Appearance.setColorScheme('light');
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  Store.dispatch(
    setFbNotificationId({
      fbNotificationId: remoteMessage.data.id,
    }),
  );
  if (remoteMessage) {
    Store.dispatch(getNotificationWithPage({ page: 1 }));
    navigate('Notification');
  }

  // Handle your background message here
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Background event triggered:', type, detail);
  if (type === EventType.PRESS) {
    console.log('Notification clicked:', detail.notification);
    Store.dispatch(getNotificationWithPage({ page: 1 }));
    if (
      detail.notification.data ===
        'Доступна новая версия приложения. Пожалуйста обновите приложение!' ||
      detail.notification.data ===
        'Ilovaning yangi versiyasi mavjud. Iltimos, ilovani yangilang!' ||
      detail.notification.data ===
        'Илованинг янги версияси мавжуд. Илтимос, иловани янгиланг!'
    ) {
      console.log('Update notification clicked');
    } else {
      navigate('Notification');
    }
  }
});

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
