import notifee from '@notifee/react-native';
import { withExternalActivity } from './externalFlow';

export const handleNotificationPermission = async () => {
  const permission = await withExternalActivity(() => notifee.requestPermission());
  if (permission.authorizationStatus) {
    return true;
  }

  return false;
};
