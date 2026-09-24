import React, { useCallback, useEffect, useState } from 'react';
import './src/i18n/index';
import { StyleSheet, View, Linking, Keyboard, AppState } from 'react-native';
import 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import type { NavigationProp } from '@react-navigation/native';

import Navigation from './src/navigation/Navigation';
import GlobalBottomBar from './src/navigation/GlobalBottomBar';
import { navigationRef } from './src/navigation/NavigationRef';
import { useNetInfo } from '@react-native-community/netinfo';
import './src/store/api/token/getToken';
import './src/store/api/authInterceptor'; // 401 token-expired -> avto refresh
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n/index';
import FaceIdModal from './src/screens/home/modal/FaceIdModal';
import { useNavigation } from '@react-navigation/native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { toastConfig } from './src/screens/components/ToastConfig';
import ContractModal from './src/screens/home/modal/ContractModal';
import NoInternet from './src/screens/home/modal/NoInternet';
import { checkingInternet } from './src/store/reducers/HomeReducer';
import { getMe } from './src/store/api/home';
import useAppStateListener from './src/hooks/useAppStateListener';
import ExpirePassportModal from './src/screens/home/modal/ExpirePassport';
import DeviceInfo from 'react-native-device-info';
import { storage } from './src/store/api/token/getToken';
import { URL } from './src/screens/constants';
import { logError } from './src/log';
import {
  APP_LOADING_TIMEOUT,
  DEEP_LINK_PATHS,
  STORAGE_KEYS,
} from './src/constants';

const isTablet = DeviceInfo.isTablet();
// SS-AUDIT (2026-09-25): LogBox sozlamasi faqat index.js'da (bu yerda takror edi).

// Global pastki menyu KO'RSATILMAYDIGAN ekranlar:
//  - asosiy tablar (o'zining RdTabBar'i bor) — Home/TakeDebt/GiveDebt/Statistic
//  - auth/onboarding oqimi (login, PIN, ro'yxatdan o'tish, parol tiklash)
//  - kamera/MyID/QR skaner (pastki menyu mos emas)
// Qolgan barcha detal ekranlarda global menyu ko'rinadi (qulaylik uchun).
// SS-DEV (2026-09-24): pastki menyu endi YAGONA — BottomTabNavigator ichidagi
// RdTabBar OLIB TASHLANDI, tab ekranlarida ham shu GlobalBottomBar ko'rinadi.
// Ilgari tab ↔ detal o'tishida ikki xil bar almashinar (state hodisasi
// kechikib), bar ~1 s yo'qolib qayta chiqardi (flicker). Endi bar hech qachon
// almashmaydi — faqat faol bo'lim rangi o'zgaradi.
const HIDE_BOTTOM_BAR = new Set<string>([
  // SS-AUDIT (2026-09-25): 'TakeDebt'/'GiveDebt' — eski 4-tab ekranlari, endi ro'yxatda yo'q.
  'SelectLanguageScreen',
  'LoginWithPhone',
  'SetLocalPassword',
  'CreatePassword',
  'CheckSmsPassword',
  'RegisterWithPeople',
  'RegisterWithJuridic',
  'Agree',
  'CreateSecretWord',
  'NewPasswordEnter',
  'RecoveryPassword',
  'NewRecoveryPassword',
  'UpdatePasswordWithJshir',
  'RecoverySmsReset',
  'ChangePassportData',
  'EnterJsh',
  'MyIdScreen',
  'PayFor',
  'PayScreenForRecovery',
  'InfoForUser',
  'UpdatePassword',
  'Inforamation',
  'ResetPassCode',
  'UpdateLocalPassCode',
  'ChangeLocalPassword',
  'ScanFaceMyId',
  'Indentifikatsiya',
  'FingerScanner',
  'QrScan',
  'QrCode',
]);

/**
 * Checks and updates app version in storage
 */
const checkVersion = (): void => {
  const version = DeviceInfo.getVersion();
  const storedVersion = storage.getString(STORAGE_KEYS.VERSION);
  if (storedVersion !== version) {
    storage.set(STORAGE_KEYS.VERSION, version);
  }
};

/**
 * Main application component
 */
const App: React.FC = () => {
  useAppStateListener();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<any>>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const dispatch = useDispatch();
  const netInfo = useNetInfo();
  const [routeName, setRouteName] = useState<string | undefined>(undefined);
  // SS-DEV (2026-09-24): `inTabs` holati OLIB TASHLANDI — tab ichidagi alohida
  // RdTabBar yo'q, shu bois "ikki menyu" xavfi ham, almashinuv flicker'i ham yo'q.
  // Klaviatura ochilganda global pastki menyu (absolyut sibling) OS tomonidan
  // klaviatura ustiga suriladi va "suzib" ko'rinardi. Klaviatura ochiq bo'lsa yashiramiz.
  const [kbVisible, setKbVisible] = useState<boolean>(false);

  // Joriy ekran nomini kuzatamiz (global pastki menyu ko'rinishini boshqarish uchun).
  useEffect(() => {
    const ref: any = navigationRef.current;
    if (!ref?.addListener) return;
    const update = () => {
      // OSILIB QOLGAN TOAST — GLOBAL, ISHONCHLI TUZATISH. Amal-ekranlar (qarzni
      // qaytarish/talab/uzaytirish/voz kechish/olish) muvaffaqiyat toast'ini
      // ko'rsatib Home'ga qaytaradi. Toast ILDIZda (navigator ustida) render
      // bo'lgani uchun navigatsiyadan omon qolib, bosh sahifada ~1s osilib qolardi.
      // Fokus-effekt (Home useFocusEffect) fokus-semantikasiga bog'liq bo'lib
      // ba'zan ishlamasdi. Bu 'state' listener HAR navigatsiyada o'q uziladi —
      // shu yerda toast'ni yopamiz: qaysi ekrandan qaysi ekranga o'tsa ham,
      // navigatsiya boshlanishi bilan toast darhol yo'qoladi (osilish yo'q).
      Toast.hide();
      setRouteName(ref.getCurrentRoute?.()?.name);
    };
    update();
    const unsub = ref.addListener('state', update);
    // SS11: ilova FON'DAN qaytganda holatni QAYTA sinxronlaymiz. 'state' hodisasi
    // fon/faol almashinuvida o'q uzmaydi — shu sabab eskirgan qiymat qolib ketardi.
    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') update();
    });
    return () => {
      unsub?.();
      appSub.remove();
    };
  }, [isLoading]);

  // Klaviatura ochilish/yopilishini kuzatamiz (Android: did-show/did-hide ishonchli).
  useEffect(() => {
    const showEvt = 'keyboardDidShow';
    const hideEvt = 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, () => setKbVisible(true));
    const h = Keyboard.addListener(hideEvt, () => setKbVisible(false));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const showBottomBar =
    !!routeName && !HIDE_BOTTOM_BAR.has(routeName) && !kbVisible;

  // Handle initial loading timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, APP_LOADING_TIMEOUT);

    return () => clearTimeout(timer);
  }, [netInfo.isConnected]);

  // Ulanishni MUSTAHKAM tekshirish: NetInfo iOS simulyatorda (va real qurilmada
  // aniqlangunicha) isConnected/isInternetReachable'ni noto'g'ri `false` qaytarishi
  // mumkin -> soxta "Internetga ulanishda xatolik" ekrani. Shu sabab NetInfo "uzilgan"
  // desa ham, backend'ga HAQIQIY so'rov yuborib tasdiqlaymiz: server istalgan javob
  // bersa (hatto xato status) -> ulanish BOR -> ONLAYN. Faqat so'rov umuman o'tmasa
  // (tarmoq xatosi) -> OFLAYN.
  const verifyConnectivity = useCallback(async () => {
    // NetInfo aniq "ulangan" (yoki noaniq) desa — onlayn, tekshiruvsiz.
    if (netInfo.isConnected !== false) {
      dispatch(checkingInternet({ internet: false }));
      return;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      // Istalgan javob = server bilan aloqa bor. Auth kerak emas (get-time ochiq).
      await fetch(URL + '/dashboard/get-time', { signal: controller.signal });
      clearTimeout(timer);
      dispatch(checkingInternet({ internet: false })); // onlayn
    } catch {
      dispatch(checkingInternet({ internet: true })); // haqiqatan oflayn
    }
  }, [netInfo.isConnected, dispatch]);

  // Handle internet connectivity changes
  useEffect(() => {
    verifyConnectivity();
  }, [verifyConnectivity]);

  const onChangeIntenet = useCallback(() => {
    verifyConnectivity();
  }, [verifyConnectivity]);

  // Handle deep linking
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      if (url.includes(DEEP_LINK_PATHS.USER_MONEY_RESULT)) {
        dispatch(getMe());
        navigation.navigate(DEEP_LINK_PATHS.USER_MONEY_RESULT);
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep links if the app was opened via a link
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          handleDeepLink({ url });
        }
      })
      .catch(logError);

    return () => {
      subscription?.remove();
    };
  }, [dispatch, navigation]);

  // Check version on mount
  useEffect(() => {
    checkVersion();
  }, []);

  if (isLoading) {
    return <Enter />;
  }

  // PLANSHET: ilgari bu yerda `if (isTablet) return <WebView uri="zerox.uz" />`
  // turgan edi — ya'ni planshetda butun native ilova chetlab o'tilib, veb-sayt
  // ochilardi. Endi planshetda ham AYNAN shu native ilova ishlaydi.
  //
  // Layout moslashuvi: `rs()` masshtabi 1.15 da qisiladi, shuning uchun keng
  // ekranda kontent cho'zilib, elementlar kichkina ko'rinardi. Yechim —
  // kontentni telefon kengligiga cheklab, markazga joylash (`tabletFrame`).
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#f5f7fb' }}
      edges={['top', 'bottom']}>
      <View style={isTablet ? styles.tabletFrame : styles.phoneFrame}>
      <I18nextProvider i18n={i18n}>
        {/* Navigation flex:1 — global menyu ko'ringanda kontent ustini yopmasdan
            joy ajratadi (overlay emas, layout siblingi). */}
        <View style={{ flex: 1 }}>
          <Navigation />
        </View>
        {showBottomBar && <GlobalBottomBar activeTab={routeName} />}
        <FaceIdModal />
        <ContractModal />
        <NoInternet onChangeIntenet={onChangeIntenet} />
        {/* <UpdateModal /> */}
        <ExpirePassportModal />
      </I18nextProvider>
      </View>
      {/* SS-DEV (2026-09-24): toast iPhone'da Dynamic Island / status bar OSTIDA
          qolib ketardi (standart topOffset=40 < insets.top). Endi xavfsiz
          maydon + 8 — iOS/Android ikkalasida status bar ostida ko'rinadi. */}
      <Toast config={toastConfig} topOffset={insets.top + 8} />
      {/* SS-DEV (2026-09-24): pastki xavfsiz maydon (home indicator) chizig'i
          ilgari OQ edi — sahifa fonи (#f5f7fb) bilan tab bar ostida OQ
          "bo'shliq" bo'lib ko'rinardi. Endi sahifa rangida. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: insets.bottom,
          backgroundColor: '#f5f7fb',
        }}
      />
    </SafeAreaView>
  );
};

/**
 * Loading screen component shown during app initialization
 */
function Enter() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Loading screen content can be added here */}
    </SafeAreaView>
  );
}

export default App;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Telefonda hech narsa o'zgarmaydi — butun kenglik.
  phoneFrame: { flex: 1 },
  // Planshetda kontent telefon kengligiga cheklanadi va markazga joylashadi.
  // Aks holda kartalar butun kenglikka cho'zilib, matn satrlari juda uzun
  // bo'lib ketardi (aynan shu "veb-sahifa" taassurotini berardi).
  tabletFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
});
