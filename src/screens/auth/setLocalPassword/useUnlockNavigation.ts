import { useCallback } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { storage } from '../../../store/api/token/getToken';

/** Qulf ochilgach 500ms dan keyin navigatsiya (biometrik yo'l). */
export const UNLOCK_NAV_DELAY_MS = 500;

/** Qulf ochilgach qayerga o'tish: bildirishnoma / qulf oldidagi ekran / bosh sahifa. */
export function useUnlockNavigation() {
  const navigation = useNavigation<any>();

  // J (so'rov): qulfdan chiqqach — foydalanuvchi qulf OLDIDA turgan ekranga qaytadi. useAppStateListener
  // qulflashdan oldin nav-holatni saqlaydi; shuni tiklaymiz. Saqlangan holat bo'lmasa — BottomTabNavigator.
  const restoreAfterUnlock = useCallback(() => {
    const saved = storage.getString('preLockNavState');
    if (saved) {
      try {
        const st = JSON.parse(saved);
        storage.delete('preLockNavState');
        navigation.reset(st);
        return;
      } catch (e) {
        storage.delete('preLockNavState');
      }
    }
    navigation.reset({ routes: [{ name: 'BottomTabNavigator' }], index: 0 });
  }, [navigation]);

  /** Bildirishnomadan ochilgan bo'lsa true (va `replace` qiladi). */
  const openPendingNotification = useCallback((): boolean => {
    if (storage.getString('pendingNavigation') === undefined) return false;
    // NAV-FIX: qulf OCHILDI (appLocked=false) — `replace` bilan qulf ekrani stekdan chiqadi, aks holda
    // bildirishnomadan orqaga bosilganda yana PIN so'rash ekrani chiqib qolardi.
    navigation.dispatch(StackActions.replace('Notification'));
    storage.delete('pendingNavigation');
    return true;
  }, [navigation]);

  const finishUnlock = useCallback(() => {
    storage.set('appLocked', false);
    if (openPendingNotification()) return;
    setTimeout(() => {
      restoreAfterUnlock();
    }, UNLOCK_NAV_DELAY_MS);
  }, [openPendingNotification, restoreAfterUnlock]);

  return { navigation, restoreAfterUnlock, openPendingNotification, finishUnlock };
}
