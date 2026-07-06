import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { useRoute } from '@react-navigation/native';
import DownloadIcon from '../../images/home/download.svg';
import Toast from 'react-native-toast-message';
import Pdf from 'react-native-pdf';

import ReactNativeBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { t } from 'i18next';
import { useSelector } from 'react-redux';

import { rd, rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';

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
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={title} />

      <View style={styles.main}>
        <TouchableOpacity
          onPress={onDownload}
          activeOpacity={0.85}
          style={styles.download}
        >
          <DownloadIcon width={rs(18)} height={rs(18)} />
          <Text style={styles.downloadText} allowFontScaling={false}>
            {t('126')}
          </Text>
        </TouchableOpacity>

        <View style={styles.pdfCard}>
          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size={'large'} color={rd.color.primary} />
            </View>
          )}
          <Pdf
            trustAllCerts={false}
            enablePaging={true}
            renderActivityIndicator={() => (
              <ActivityIndicator size={'large'} color={rd.color.primary} />
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
  );
};

export default Contract;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  main: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: rs(16),
    paddingBottom: rs(16),
  },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: rs(8),
    height: rs(48),
    width: '100%',
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    marginTop: rs(6),
    marginBottom: rs(14),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  downloadText: {
    color: rd.color.onPrimary,
    fontSize: rs(15),
    fontFamily: rd.font.semibold,
  },
  pdfCard: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    overflow: 'hidden',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: rd.color.surface,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
  },
});
