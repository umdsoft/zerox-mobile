import notifee from '@notifee/react-native';

export const handleNotificationPermission = async () => {
  const permission = await notifee.requestPermission();
  if (permission.authorizationStatus) {
    return true;
  }

  return false;
};
