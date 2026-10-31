import notifee, { AndroidVisibility } from '@notifee/react-native';
import { Store } from '../../store/store/Store';
import { setNotification } from '../../store/reducers/HomeReducer';
import { buildNotificationBody } from './notificationBody';

/** Bildirishnoma matnidan olib tashlanadigan ichki teglar. */
const BODY_TAGS = [
  '<name>', '</name>', '<id>', '</id>', '<start>', '</start>', '<end>', '</end>', '<sum>', '</sum>',
  '<sum1>', '</sum1>', '<qoldiq>', '</qoldiq>', '<name2>', '</name2>', '<date>', '</date>',
];

/** Bir vaqtda faqat bitta bildirishnoma ko'rsatiladi. */
export interface DisplayGuard {
  busy: boolean;
}

const bell = (list: any) => Store.dispatch(setNotification({ notification: list }));

/** Lokal (notifee) bildirishnomani ko'rsatadi. */
async function displayLocal(first: any): Promise<void> {
  const body = await buildNotificationBody(first);
  const body1 = BODY_TAGS.reduce((acc, tag) => acc!.replace(new RegExp(tag, 'g'), ''), body);
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    visibility: AndroidVisibility.PRIVATE,
  });
  await notifee.displayNotification({
    title: 'ZeroX',
    body: body1 ?? 'Yangi bildirishnoma',
    android: {
      channelId,
      // SEC (2026-10-31): qulflangan ekranda summa/ism ko'rinmasin; kanal ilgari yaratilgan bo'lsa uning
      // sozlamasi o'zgarmaydi, shuning uchun bildirishnomaning o'zida ham beriladi.
      visibility: AndroidVisibility.PRIVATE,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default', launchActivity: 'default' },
    },
    ios: { sound: 'default', critical: true },
  });
}

/** `recive_notification` hodisasi ishlovchisi (eski xulq saqlangan). */
export const createReciveHandler = (guard: DisplayGuard) => async (data: any) => {
  if (guard.busy) return;
  guard.busy = true;
  try {
    const home = () => Store.getState().HomeReducer;
    if (home().appState !== 'active') {
      // Fon rejimida (yoki iOS 'inactive') — lokal bildirishnoma YO'Q (FCM bajaradi), lekin ro'yxat yangilanadi.
      bell(data.notification);
      return;
    }
    if (home().notification.bild.length >= data.notification.length) {
      bell(data.notification);
      return;
    }
    try {
      const fresh = data.notification.filter(
        (item: any) => !home().notification.bild.some((old: any) => item.id === old.id),
      );
      if (fresh.length > 0 && fresh[0].id != home().fbNotificationId) {
        await displayLocal(fresh[0]);
      }
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
    bell(data.notification);
  } catch (error) {
    console.error('Error in reciveNotification:', error);
  } finally {
    guard.busy = false;
  }
};
