import {NativeModules} from 'react-native';
import {storage} from '../store/api/token/getToken';

const NotificationBadge = NativeModules?.NotificationBadgeModule;

export const NotificationBadgeModule = {
  setBadgeCount: (count: number) => {
    if (NotificationBadge) {
      const lang = storage.getString('lang') || 'uz';
      if (lang === 'ru') {
        NotificationBadge.setNumber(
          count,
          'Уведомление',
          'У вас есть %count% уведомлений.',
        );
      } else if (lang === 'kr') {
        NotificationBadge.setNumber(
          count,
          'Билдиришномалар',
          'Сизда %count% та билдиришнома мавжуд.',
        );
      } else {
        NotificationBadge.setNumber(
          count,
          'Bildirishnomalar',
          'Sizda %count% ta bildirishnoma mavjud.',
        );
      }
    } else {
      console.warn('NotificationBadgeModule is not available');
    }
  },
  configure: (title: string, text: string) => {
    if (NotificationBadge) {
      NotificationBadge.configure(title, text);
    } else {
      console.warn('NotificationBadgeModule is not available');
    }
  },
  setBadgeOnlyNumber: (count: number) => {
    if (NotificationBadge) {
      NotificationBadge.setBadgeNumber(count);
    } else {
      console.warn('NotificationBadgeModule is not available');
    }
  },
};
