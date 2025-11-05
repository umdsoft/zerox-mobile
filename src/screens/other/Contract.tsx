import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { BackGroundIcon } from '../../helper/homeIcon/index';
import { style } from '../../theme/style';

import { useNavigation, useRoute } from '@react-navigation/native';
import DownloadIcon from '../../images/home/download.svg';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
import Pdf from 'react-native-pdf';

import OtherHeader from '../components/OtherHeader';
import ReactNativeBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
// import RNFS from 'react-native-fs';
import { t } from 'i18next';
import { useSelector } from 'react-redux';

const Contract = () => {
  const [loading, setLoading] = useState(true);
  const { url, title } = useRoute().params;
  const user = useSelector(state => state.HomeReducer.user);

  const downloadProgress = res => {
    const progress = (res.bytesWritten / res.contentLength) * 100;
    console.log(`Progress: ${progress.toFixed(2)}%`);
  };

  const onDownload = async () => {
    Toast.show({
      autoHide: true,
      visibilityTime: 2000,
      position: 'bottom',
      type: 'omad',
      props: { title: 'Muvaffaqiyatli', desc: t('789') + '...' },
    });

    try {
      const path =
        Platform.OS === 'android'
          ? ReactNativeBlobUtil.fs.dirs.DownloadDir +
            `/${user.data.last_name}_${user.data.first_name}_${user.data.middle_name}-oferta.pdf`
          : ReactNativeBlobUtil.fs.dirs.DocumentDir +
            `/${user.data.last_name}_${user.data.first_name}_${user.data.middle_name}-oferta.pdf`;

      ReactNativeBlobUtil.config({
        appendExt: 'pdf',
        overwrite: true,
        addAndroidDownloads: {
          notification: true,
          title: `${user?.data?.last_name}_${user?.data?.first_name}_${user?.data?.middle_name}-oferta.pdf`,
          mediaScannable: false,
          mime: 'application/pdf',
          useDownloadManager: true,
          path: path,
        },
        path: path,
      })
        .fetch('GET', url)
        .then(async resp => {
          async function forAndroid() {
            await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
              {
                name: `${user?.data?.last_name}_${user?.data?.first_name}_${user?.data?.middle_name}-oferta.pdf`, // name of the file
                parentFolder: 'Zerox/Oferta', // subdirectory in the Media Store, e.g. HawkIntech/Files to create a folder HawkIntech with a subfolder Files and save the image within this folder
                mimeType: 'application/pdf',
              },
              'Download',
              resp.path(),
            );
            await FileViewer.open(resp.path(), { showOpenWithDialog: true });
          }

          Platform.OS === 'ios'
            ? await FileViewer.open(resp.path(), { showOpenWithDialog: true })
            : await forAndroid();
        });
    } catch (error) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { title: 'Xatolik', desc: t('Yuklab olish amalga oshmadi') },
      });
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          position: 'absolute',
          height: style.height / 3,
          width: '100%',
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={title} />
      <View style={styles.main}>
        <View style={styles.aboutUsContainer}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <TouchableOpacity
              onPress={onDownload}
              activeOpacity={0.8}
              style={styles.download}
            >
              <DownloadIcon width="20" height="20" />
              <Text style={styles.downloadText} allowFontScaling={false}>
                {' '}
                {t('126')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {loading && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size={'large'} color={style.blue} />
              </View>
            )}
            <Pdf
              trustAllCerts={false}
              enablePaging={true}
              renderActivityIndicator={() => (
                <ActivityIndicator size={'large'} color={style.blue} />
              )}
              source={{
                uri: url,
                method: 'GET',
              }}
              onLoadComplete={() => {
                setLoading(false);
              }}
              style={styles.pdf}
            />
          </View>
        </View>
      </View>
      {/* <DownloadModal hide={hide} onHide={setHide} data={item} path={path} /> */}
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default Contract;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  pdfView: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
    backgroundColor: '#fff',
    borderRadius: 50,
    marginBottom: 20,
    marginTop: 20,
  },
  userName: {
    fontSize: style.fontSize.small,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    padding: 80,
    alignSelf: 'center',
  },
  download: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: style.StatusbarColor,
    padding: 10,
    width: style.width / 3,
    flexDirection: 'row',
  },
  downloadText: {
    color: '#fff',
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 15,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
  },

  title: {
    fontSize: style.fontSize.xx,
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    alignSelf: 'center',
    textAlign: 'center',
  },
});
