import {AppState, AppStateStatus} from 'react-native';
import {useEffect, useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {DrawerActions, useNavigation} from '@react-navigation/native';

import {setAppState} from '../store/reducers/HomeReducer';
import {storage} from '../store/api/token/getToken';
import {hasPin} from '../store/api/token/pin';
import {endExternalFlow, isExternalFlowActive} from '../helper/externalFlow';
import {LAST_BACKGROUND_KEY, LOCK_SCREEN_ROUTES, shouldLockOnReturn} from '../helper/appLock';
import {navigationRef} from '../navigation/NavigationRef';

const LOCK_ROUTE = 'SetLocalPassword';

/** Hozirgi (eng chuqur) ekran nomi. App darajasidagi useNavigation() ildiz Drawer holatini beradi. */
const currentRouteName = (): string | undefined => {
  try {
    return (navigationRef.current as any)?.getCurrentRoute?.()?.name;
  } catch {
    return undefined;
  }
};

export default function useAppStateListener() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const lockApp = useCallback(() => {
    // Allaqachon qulfda bo'lsa (qulf ekrani / tiklash oqimi) oldingi saqlangan holat ustiga YOZILMAYDI.
    const alreadyLocked = storage.getBoolean('appLocked') === true;
    storage.set('appLocked', true);

    // J (so'rov): qulflashdan OLDIN joriy navigatsiya holatini saqlaymiz — PIN/Touch ID/Face ID
    // dan keyin foydalanuvchi AYNAN o'sha ekranga qaytadi.
    try {
      // Qulf-oqim ekranining o'zi (masalan ochiq ChangeLocalPassword) "qaytish joyi" bo'lmaydi.
      const route = currentRouteName();
      if (!alreadyLocked && !(route && LOCK_SCREEN_ROUTES.has(route))) {
        const rootState = (navigationRef.current as any)?.getRootState?.() ?? navigation.getState();
        if (rootState) storage.set('preLockNavState', JSON.stringify(rootState));
      }
    } catch (e) {}

    // Menyuni PIN ekranidan OLDIN yopamiz (reset faqat Stack'ga ta'sir qiladi).
    navigation.dispatch(DrawerActions.closeDrawer());
    navigation.reset({index: 0, routes: [{name: LOCK_ROUTE as never}]});
  }, [navigation]);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        dispatch(setAppState({appState: 'active'}));

        const lastBackgroundAt = storage.getNumber(LAST_BACKGROUND_KEY);
        // Belgi HAR 'active'da o'chadi (eskirgan qiymat keyingi qaytishda yolg'on qulf bermasin).
        storage.delete(LAST_BACKGROUND_KEY);

        // iOS 'inactive' -> 'active' (Face ID oynasi, boshqaruv markazi): haqiqiy fonga o'tish
        // bo'lmagan — qulf ham yo'q, tashqi-oqim bayrog'i ham iste'mol qilinmaydi.
        if (lastBackgroundAt == null) return;

        // Tashqi oqimdan (MyID, to'lov brauzeri, picker...) qaytish — bir martalik, TTL bilan.
        const suppressed = isExternalFlowActive();
        if (suppressed) endExternalFlow();

        const lock = shouldLockOnReturn({
          lastBackgroundAt,
          now: Date.now(),
          suppressed,
          hasSession: !!storage.getString('token'),
          hasPin: hasPin(),
        });
        if (!lock) return;
        // FAQAT haqiqiy qulf/tiklash oqimida (appLocked ALLAQACHON true) qulf ekranida turgan
        // foydalanuvchi qayta reset qilinmaydi (biometrik so'rov sikli, preLockNavState buzilishi).
        // Ochiq holatda ochilgan SetLocalPassword (PIN o'rnatilgach biometrik opt-in),
        // ChangeLocalPassword, RecoveryPassword ostida kontent turadi — ular RESET qilinadi.
        const route = currentRouteName();
        const alreadyLocked = storage.getBoolean('appLocked') === true;
        if (alreadyLocked && route && LOCK_SCREEN_ROUTES.has(route)) storage.set('appLocked', true);
        else lockApp();
      } else if (nextAppState === 'background') {
        dispatch(setAppState({appState: 'background'}));
        // Faqat HAQIQIY 'background' (iOS 'inactive' emas). Birinchi belgi saqlanadi.
        if (storage.getNumber(LAST_BACKGROUND_KEY) == null) {
          storage.set(LAST_BACKGROUND_KEY, Date.now());
        }
      } else if (nextAppState === 'inactive') {
        dispatch(setAppState({appState: 'background'}));
      }
    },
    [dispatch, lockApp],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [handleAppStateChange]);
}
