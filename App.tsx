import React, { useCallback, useEffect, useState } from 'react';
import './src/i18n/index';
import { LogBox, StyleSheet, View, Linking } from 'react-native';
import 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import type { NavigationProp } from '@react-navigation/native';

import Navigation from './src/navigation/Navigation';
import GlobalBottomBar from './src/navigation/GlobalBottomBar';
import { navigationRef } from './src/navigation/NavigationRef';
import { style } from './src/theme/style';
import { colors } from './src/theme';
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
import UpdateModal from './src/screens/home/modal/UpdateModal';
import { getMe } from './src/store/api/home';
import useAppStateListener from './src/hooks/useAppStateListener';
import ExpirePassportModal from './src/screens/home/modal/ExpirePassport';
import DeviceInfo from 'react-native-device-info';
import { storage } from './src/store/api/token/getToken';
import { URL } from './src/screens/constants';
import crashlytics from '@react-native-firebase/crashlytics';
import { logError } from './src/log';
import {
  APP_LOADING_TIMEOUT,
  LOG_BOX_IGNORE_MESSAGES,
  DEEP_LINK_PATHS,
  STORAGE_KEYS,
} from './src/constants';

const isTablet = DeviceInfo.isTablet();
LogBox.ignoreLogs([...LOG_BOX_IGNORE_MESSAGES]);

// Global pastki menyu KO'RSATILMAYDIGAN ekranlar:
//  - asosiy tablar (o'zining RdTabBar'i bor) — Home/TakeDebt/GiveDebt/Statistic
//  - auth/onboarding oqimi (login, PIN, ro'yxatdan o'tish, parol tiklash)
//  - kamera/MyID/QR skaner (pastki menyu mos emas)
// Qolgan barcha detal ekranlarda global menyu ko'rinadi (qulaylik uchun).
const HIDE_BOTTOM_BAR = new Set<string>([
  'Home',
  'TakeDebt',
  'GiveDebt',
  'Statistic',
  // QarzShartnomasi/QarzDaftari endi BottomTabNavigator ICHIDAGI tab —
  // ular o'zining RdTabBar'ini ko'rsatadi. Global bar ham chiqsa IKKI pastki
  // menyu bo'lib qolardi (ustma-ust). Shu sabab bu yerda ham yashiriladi.
  'QarzShartnomasi',
  'QarzDaftari',
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

const defaultHandler = ErrorUtils.getGlobalHandler();

/**
 * Global error handler for crash reporting
 */
ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
  crashlytics().recordError(error);
  crashlytics().log(`JS Error: ${error.message}`);

  if (isFatal) {
    crashlytics().crash();
  }

  // Call the default handler
  if (defaultHandler) {
    defaultHandler(error, isFatal);
  }
});

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

  // Joriy ekran nomini kuzatamiz (global pastki menyu ko'rinishini boshqarish uchun).
  useEffect(() => {
    const ref: any = navigationRef.current;
    if (!ref?.addListener) return;
    const update = () => setRouteName(ref.getCurrentRoute?.()?.name);
    update();
    const unsub = ref.addListener('state', update);
    return unsub;
  }, [isLoading]);

  const showBottomBar = !!routeName && !HIDE_BOTTOM_BAR.has(routeName);

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
      <Toast config={toastConfig} />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: insets.bottom,
          backgroundColor: '#fff',
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
  ImageBackground: {
    width: style.width,
    height: style.height,
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
