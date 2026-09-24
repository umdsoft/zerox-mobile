import messaging from '@react-native-firebase/messaging';
import {storage} from '../store/api/token/getToken';

const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
  }
};

const getFcmTokenFromLocalStorage = async () => {
  const fcmtoken = storage.getString('fcmtoken');
  if (!fcmtoken) {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      storage.set('fcmtoken', token);
    } catch (error) {
      console.error(error);
    }
  } else {
  }
};
const getFcmToken = async () => {
  try {
    const newFcmToken = await messaging().getToken();
    return newFcmToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export {getFcmToken, getFcmTokenFromLocalStorage, requestUserPermission};
