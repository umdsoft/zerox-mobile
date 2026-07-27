import {
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import Pdf from 'react-native-pdf';
import { t } from 'i18next';
import FileViewer from 'react-native-file-viewer';
import Toast from 'react-native-toast-message';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { rd, rs } from '../../../../theme/rd';
import RdHeader from '../../redesign/RdHeader';
import Button from '../../../components/Button';
import DownloadIcon from '../../../../images/home/download.svg';
import { storage } from '../../../../store/api/token/getToken';

const UseTerm = () => {
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const onDownload = async () => {
    try {
      const lang = storage.getString('lang');
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'omad',
        props: { title: 'Muvaffaqiyatli', desc: t('789') + '...' },
      });

      const filePath =
        Platform.OS === 'android'
          ? `${ReactNativeBlobUtil.fs.dirs.DownloadDir}${setNameByLang(lang!)}`
          : `${ReactNativeBlobUtil.fs.dirs.DocumentDir}${setNameByLang(lang!)}`;

      // Check if the file exists
      const fileExists = await ReactNativeBlobUtil.fs.exists(filePath);

      // Delete the existing file if overwrite is true
      if (fileExists) {
        await ReactNativeBlobUtil.fs.unlink(filePath);
        console.log(`Existing file deleted: ${filePath}`);
      }
      setDownloadLoading(true);
      const res = await ReactNativeBlobUtil.config({
        appendExt: 'pdf',
        overwrite: true,
        addAndroidDownloads: {
          notification: true,
          title: setNameByLang(lang!).slice(1),
          mediaScannable: false,
          mime: 'application/pdf',
          useDownloadManager: true,
          path: ReactNativeBlobUtil.fs.dirs.DownloadDir + setNameByLang(lang!),
        },
        path:
          Platform.OS === 'android'
            ? ReactNativeBlobUtil.fs.dirs.DownloadDir + setNameByLang(lang!)
            : ReactNativeBlobUtil.fs.dirs.DocumentDir + setNameByLang(lang!),
      }).fetch('GET', `https://pdf.zerox.uz/yoriqnoma.pdf`);
      if (
        !(await ReactNativeBlobUtil.fs.exists(
          Platform.OS === 'android'
            ? ReactNativeBlobUtil.fs.dirs.DownloadDir
            : ReactNativeBlobUtil.fs.dirs.DocumentDir + setNameByLang(lang!),
        ))
      ) {
        await ReactNativeBlobUtil.fs.cp(
          res.data,
          Platform.OS === 'android'
            ? ReactNativeBlobUtil.fs.dirs.DownloadDir
            : ReactNativeBlobUtil.fs.dirs.DocumentDir + setNameByLang(lang!),
        );
      }
      await FileViewer.open(
        Platform.OS === 'android'
          ? ReactNativeBlobUtil.fs.dirs.DownloadDir
          : ReactNativeBlobUtil.fs.dirs.DocumentDir + setNameByLang(lang!),
      );
      setDownloadLoading(false);
    } catch (e) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc: t('Yuklab olish amalga oshmadi'),
        },
      });
      setDownloadLoading(false);
      console.log(e);
    }
  };

  const setNameByLang = (lang: string) => {
    switch (lang) {
      case 'uz':
        return `/Yo‘riqnoma.pdf`;
      case 'ru':
        return `/Инструкция.pdf`;
      case 'kr':
        return `/Йўриқнома.pdf`;
      default:
        return `/Yo‘riqnoma.pdf`;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('foydalanishyoriqnomasi')} />

      <View style={styles.content}>
        {/* Ixcham (kontent kengligi) — ilgari to'liq kenglik, juda uzun edi. */}
        <Button
          title={t('126')}
          onPress={onDownload}
          loading={downloadLoading}
          disabled={downloadLoading}
          fullWidth={false}
          leftIcon={<DownloadIcon width={rs(18)} height={rs(18)} />}
          style={styles.download}
        />

        <View style={styles.card}>
          {loading && (
            <View style={styles.indicator}>
              <ActivityIndicator size={'large'} color={rd.color.primary} />
            </View>
          )}
          <Pdf
            trustAllCerts={false}
            enablePaging={true}
            renderActivityIndicator={() => (
              <ActivityIndicator size={'small'} color={rd.color.primary} />
            )}
            source={{
              uri: `https://pdf.zerox.uz/yoriqnoma.pdf`,
              method: 'GET',
            }}
            onLoadComplete={() => {
              setLoading(false);
            }}
            onError={error => {
              console.log(error.message);
            }}
            onPressLink={uri => {
              console.log(`Link pressed: ${uri}`);
            }}
            style={styles.pdf}
          />
        </View>
      </View>
    </View>
  );
};

export default UseTerm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  content: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(6),
    paddingBottom: rs(16),
  },
  download: {
    marginTop: rs(6),
    marginBottom: rs(14),
    paddingHorizontal: rs(28),
    height: rs(46),
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  indicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: rd.color.surface,
  },
});
