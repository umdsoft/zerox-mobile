import React, { useCallback, useEffect, useState } from 'react';
import './src/i18n/index';
import { LogBox, StyleSheet, View, Linking } from 'react-native';
import 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import type { NavigationProp } from '@react-navigation/native';

import Navigation from './src/navigation/Navigation';
import { style } from './src/theme/style';
import { colors } from './src/theme';
import { useNetInfo } from '@react-native-community/netinfo';
import './src/store/api/token/getToken';
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
import WebView from 'react-native-webview';
import { storage } from './src/store/api/token/getToken';
import crashlytics from '@react-native-firebase/crashlytics';
import { logError } from './src/log';
import {
  APP_LOADING_TIMEOUT,
  TABLET_WEBVIEW_URL,
  LOG_BOX_IGNORE_MESSAGES,
  DEEP_LINK_PATHS,
  STORAGE_KEYS,
} from './src/constants';

const isTablet = DeviceInfo.isTablet();
LogBox.ignoreLogs([...LOG_BOX_IGNORE_MESSAGES]);

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

  // Handle initial loading timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, APP_LOADING_TIMEOUT);

    return () => clearTimeout(timer);
  }, [netInfo.isConnected]);

  // Handle internet connectivity changes
  useEffect(() => {
    const isConnected = netInfo.isConnected ?? false;
    dispatch(checkingInternet({ internet: !isConnected }));
  }, [netInfo.isConnected, dispatch]);

  const onChangeIntenet = useCallback(() => {
    const isConnected = netInfo.isConnected ?? false;
    dispatch(checkingInternet({ internet: !isConnected }));
  }, [netInfo.isConnected, dispatch]);

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

  // Show WebView for tablet devices
  if (isTablet) {
    return (
      <WebView
        source={{ uri: TABLET_WEBVIEW_URL }}
        style={{ flex: 1 }}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
      />
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.blue }}
      edges={['top', 'bottom']}>
      <I18nextProvider i18n={i18n}>
        <Navigation />
        <FaceIdModal />
        <ContractModal />
        <NoInternet onChangeIntenet={onChangeIntenet} />
        {/* <UpdateModal /> */}
        <ExpirePassportModal />
      </I18nextProvider>
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
});
