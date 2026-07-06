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
import FileViewer from 'react-native-file-viewer';

import { useRoute } from '@react-navigation/native';
import ShareIcon from '../../../images/home/share.svg';
import DownloadIcon from '../../../images/home/download.svg';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import Pdf from 'react-native-pdf';

import Share from 'react-native-share';
import { t } from 'i18next';
import { storage } from '../../../store/api/token/getToken';

import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';

const DownloadStatistic = () => {
  // paramssiz ochilsa ham crash bermasin (guard).
  const { item, id } = (useRoute().params as { item?: any; id?: any }) || {};
  const [loading, setLoading] = useState(true);

  const onShare = async () => {
    const lang = storage.getString('lang');
    ReactNativeBlobUtil.config({
      fileCache: true,
      overwrite: true,
      appendExt: 'pdf',
      path:
        ReactNativeBlobUtil.fs.dirs.DocumentDir +
        `/${item?.number?.split('/')?.join('_')}${setNameByLang(lang!)}`,
    })
      .fetch(
        'GET',
        `https://pdf.zerox.uz/index.php?id=${item?.uid}&download=0&lang=${lang}`,
      )
      .then(async res => {
        ReactNativeBlobUtil.fs.cp(
          res.path(),
          `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${item?.number
            ?.split('/')
            ?.join('_')}${setNameByLang(lang!)}`,
        )
          .then(() => {
            console.log('File copied to cache');
          })
          .catch(err => {
            console.error('Error copying file:', err);
          });

        if (Platform.OS === 'android') {
          await Share.open({
            failOnCancel: false,
            url: `${
              `file://` +
              `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${item?.number
                ?.split('/')
                ?.join('_')}${setNameByLang(lang!)}`
            }`,
          });
        } else {
          await Share.open({ url: res.path() });
        }
      })
      .catch(err => {
        console.warn('Share error:', err);
        // Toast.show({
        //   autoHide: true,
        //   visibilityTime: 3000,
        //   position: 'bottom',
        //   type: 'error2',
        //   props: {title: 'Xatolik', desc: 'Ulashish amalga oshmadi.'},
        // });
      });
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
      const lang = storage.getString('lang');
      const fileName = `${item?.number?.split('/').join('_')}${setNameByLang(
        lang!,
      )}`;
      const filePath =
        Platform.OS === 'android'
          ? `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`
          : `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;
      const downloadUrl = `https://pdf.zerox.uz/index.php?id=${
        item?.uid
      }&download=0&lang=${storage.getString('lang') || 'uz'}`;

      // Check if the file exists
      const fileExists = await ReactNativeBlobUtil.fs.exists(filePath);

      // Delete the existing file if overwrite is true
      if (fileExists) {
        await ReactNativeBlobUtil.fs.unlink(filePath);
        console.log(`Existing file deleted: ${filePath}`);
      }

      // Configure and fetch the file
      ReactNativeBlobUtil.config({
        appendExt: 'pdf',
        overwrite: true,
        addAndroidDownloads: {
          notification: true,
          title: fileName,
          mediaScannable: false,
          mime: 'application/pdf',
          useDownloadManager: true,
          path: filePath,
        },
        path: filePath,
      })
        .fetch('GET', downloadUrl)
        .then(async resp => {
          async function forAndroid() {
            await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
              {
                name: fileName, // name of the file
                parentFolder: 'Zerox/Contracts', // subdirectory in the Media Store, e.g. HawkIntech/Files to create a folder HawkIntech with a subfolder Files and save the image within this folder
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

      console.log('File successfully opened');
    } catch (error) {
      console.error('Download or open file error:', error);

      // Show an error notification
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { title: 'Xatolik', desc: t('down_error') },
      });
    }
  };

  const setNameByLang = (lang: string) => {
    switch (lang) {
      case 'uz':
        return '_sonli_qarz_shartnomasi.pdf';
      case 'ru':
        return '_Договор_займа.pdf';
      case 'kr':
        return '_сонли_қарз_шартномаси.pdf';
      default:
        return '_sonli-qarz-shartnomasi.pdf';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('324')} />

      <View style={styles.main}>
        <View style={styles.actionsRow}>
          {/* ------------------------   Yuklab olish   ------------------------ */}
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

          {/* ------------------------   Ulashish   ------------------------ */}
          <TouchableOpacity
            onPress={onShare}
            activeOpacity={0.85}
            style={styles.share}
          >
            <ShareIcon width={rs(18)} height={rs(18)} />
            <Text style={styles.shareText} allowFontScaling={false}>
              {t('129')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pdfCard}>
          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size={'large'} color={rd.color.primary} />
            </View>
          )}
          <Pdf
            trustAllCerts={false}
            enablePaging={true}
            source={{
              uri: `https://pdf.zerox.uz/index.php?id=${
                item?.uid
              }&download=0&lang=${storage.getString('lang') || 'uz'}`,
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

export default DownloadStatistic;

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
  actionsRow: {
    flexDirection: 'row',
    gap: rs(12),
    marginTop: rs(6),
    marginBottom: rs(14),
  },
  download: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    height: rs(48),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
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
  share: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    height: rs(48),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  shareText: {
    color: rd.color.text,
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
