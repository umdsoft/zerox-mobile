import {AppState, AppStateStatus} from 'react-native';
import {useEffect, useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {DrawerActions, useNavigation} from '@react-navigation/native';

import {setAppState} from '../store/reducers/HomeReducer';
import {storage} from '../store/api/token/getToken';

const LOCK_TIMEOUT = 30_000; // 30s

export default function useAppStateListener() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground!');
        dispatch(setAppState({appState: 'active'}));

        const lastTime = storage.getNumber('lastBackgroundTime');
        const token = storage.getString('token');

        if (lastTime && token) {
          const diff = Date.now() - lastTime;
          if (diff >= LOCK_TIMEOUT) {
            console.log('More than 30 seconds in background, lock the app');
            storage.set('appLocked', true);

            // J (so'rov): qulflashdan OLDIN joriy navigatsiya holatini saqlaymiz —
            // PIN/Touch ID/Face ID dan keyin foydalanuvchi BOSH SAHIFA emas, AYNAN
            // qaysi ekranda bo'lsa o'sha ekranga qaytadi. (SetLocalPassword'нинг
            // o'zида qulflansa saqlamaymiz — takror-qulflanish loop bo'lmasin.)
            try {
              const navState: any = navigation.getState();
              const curRoute = navState?.routes?.[navState.index]?.name;
              if (navState && curRoute !== 'SetLocalPassword') {
                storage.set('preLockNavState', JSON.stringify(navState));
              }
            } catch (e) {}

            // Menyuni PIN ekranidan OLDIN yopamiz. `reset` faqat Stack'ga
            // ta'sir qiladi, ota Drawer esa ochiq qolaveradi — natijada menyu
            // qulf ekrani ustida osilib qolardi (kontent o'ngga surilardi va
            // PIN kiritmasdan menyu bandlariga o'tish mumkin edi).
            navigation.dispatch(DrawerActions.closeDrawer());

            navigation.reset({
              index: 0,
              routes: [{name: 'SetLocalPassword'}],
            });
          }
        }
      } else if (nextAppState === 'inactive' || nextAppState === 'background') {
        console.log('App has gone to the background!');
        dispatch(setAppState({appState: 'background'}));
        storage.set('lastBackgroundTime', Date.now());
      }
    },
    [dispatch, navigation],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [handleAppStateChange]);
}
