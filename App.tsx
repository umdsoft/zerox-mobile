import React, { useCallback, useEffect, useState } from 'react';
import './src/i18n/index';
import { Linking, LogBox, StatusBar, StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';

import Navigation from './src/navigation/Navigation';

import { style } from './src/theme/style';
import { useNetInfo } from '@react-native-community/netinfo';

import './src/store/api/token/getToken';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
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
import { colors } from './src/theme';
import ExpirePassportModal from './src/screens/home/modal/ExpirePassport';
import DeviceInfo from 'react-native-device-info';
import WebView from 'react-native-webview';
import { storage } from './src/store/api/token/getToken';
import crashlytics from '@react-native-firebase/crashlytics';

const isTablet = DeviceInfo.isTablet();
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

const defaultHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error, isFatal) => {
  crashlytics().recordError(error);
  crashlytics().log(`JS Error: ${error.message}`);

  if (isFatal) {
    crashlytics().crash(); // optional - simulate fatal crash
  }

  // Call the default handler too
  defaultHandler(error, isFatal);
});

const checkVersion = () => {
  const version = DeviceInfo.getVersion();
  const vv = storage.getString('version');
  if (vv !== version) {
    storage.set('version', version);
  }
};

const App = () => {
  useAppStateListener();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch();

  const netInfo = useNetInfo();
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  }, [netInfo.isConnected]);

  useEffect(() => {
    if (netInfo.isConnected) {
      dispatch(checkingInternet({ internet: false }));
    } else {
      dispatch(checkingInternet({ internet: true }));
    }
  }, [netInfo, dispatch]);
  const onChangeIntenet = useCallback(() => {
    if (netInfo.isConnected) {
      dispatch(checkingInternet({ internet: false }));
    } else {
      dispatch(checkingInternet({ internet: true }));
    }
  }, [netInfo, dispatch]);

  // const handleAppStateChange = useCallback(
  //   (nextAppState: AppStateStatus) => {
  //     console.log('AppState changed to');
  //     if (nextAppState === 'active') {
  //       console.log('App has come to the foreground!');
  //       dispatch(setAppState({appState: 'active'}));
  //       dispatch(getMe());
  //     } else if (AppState.currentState === 'background') {
  //       dispatch(setAppState({appState: 'background'}));
  //       console.log('App has gone to the background!');
  //     }
  //   },
  //   [dispatch],
  // );

  useEffect(() => {
    const handleDeepLink = event => {
      const url = event.url;
      console.log('Deep link URL:', url);
      if (url.includes('UserMoneyResult')) {
        dispatch(getMe());
        navigation.navigate('UserMoneyResult');
      }
    };

    // Listen for deep links
    Linking.addEventListener('url', handleDeepLink);

    // Handle deep links if the app was opened via a link
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      Linking.removeAllListeners('url');
    };
  }, [dispatch, navigation]);
  // useEffect(() => {
  //   return notifee.onForegroundEvent(({type, detail}) => {
  //     if (type === EventType.PRESS && detail.notification) {
  //       console.log('User pressed notification', detail.notification);
  //       navigation.navigate('Notification');
  //     }
  //   });
  // }, [navigation]);
  // useEffect(() => {
  //   const subs = AppState.addEventListener('change', handleAppStateChange);
  //   return () => {
  //     subs.remove();
  //   };
  // }, [handleAppStateChange]);
  useEffect(() => {
    checkVersion();
    // CaptureProtection.prevent();
  }, []);

  // eslint-disable-next-line react/no-unstable-nested-components
  const ToasWrapper = React.memo(() => <Toast config={toastConfig} />);

  if (isLoading) {
    return <Enter />;
  }

  return isTablet ? (
    <WebView
      source={{ uri: 'https://zerox.uz' }}
      style={{ flex: 1 }}
      startInLoadingState={true}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  ) : (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.blue }}
      edges={['top', 'bottom']}
    >
      <I18nextProvider i18n={i18n}>
        <Navigation />
        <FaceIdModal />
        <ContractModal />
        <NoInternet onChangeIntenet={onChangeIntenet} />
        {/* <UpdateModal /> */}
        <ExpirePassportModal />
      </I18nextProvider>
      <ToasWrapper />
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

const Enter = () => {
  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar
        backgroundColor={'#fff'}
        barStyle="dark-content"
        animated={true}
      />
      {/* <ImageBackground
        style={styles.ImageBackground}
        resizeMode="cover"
        source={require('./src/images/bac')}>
        <View style={styles.logoContainer}>
          <Logo width={normalize(120)} height={normalize(120)} />
        </View>
      </ImageBackground> */}
    </SafeAreaView>
  );
};

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
  logoContainer: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ishonch: {
    fontSize: style.fontSize.xs + 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
