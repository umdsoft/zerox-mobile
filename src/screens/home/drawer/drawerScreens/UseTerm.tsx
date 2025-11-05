import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Pdf from 'react-native-pdf';
import { BackGroundIcon } from '../../../../helper/homeIcon';
import { style } from '../../../../theme/style';
import { fontSize } from '../../../../theme/font';
import { colors } from '../../../../theme/colors';
import DownloadIcon from '../../../../images/home/download.svg';

import OtherHeader from '../../../components/OtherHeader';
import MainText from '../../../components/MainText';
import { t } from 'i18next';
import FileViewer from 'react-native-file-viewer';

import Toast from 'react-native-toast-message';

// import RNFS from 'react-native-fs';

import ReactNativeBlobUtil from 'react-native-blob-util';

import { storage } from '../../../../store/api/token/getToken';

const UseTerm = () => {
  // const source = require('../../../../theme/yoriqnoma.pdf')
  // const filePath = `${RNFS.ExternalDirectoryPath}/files/yoriqnoma.pdf`;
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
      <View
        style={{
          position: 'absolute',
          height: style.height / 2.6,
          width: '100%',
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('foydalanishyoriqnomasi')} />
      <View style={styles.main}>
        <View style={styles.aboutUsContainer}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            {/* ------------------------   Yuklab olish   ------------------------ */}
            <TouchableOpacity
              onPress={() => onDownload()}
              activeOpacity={0.8}
              disabled={downloadLoading}
              style={styles.download}
            >
              {downloadLoading ? (
                <ActivityIndicator size={'small'} color={'#fff'} />
              ) : (
                <>
                  <DownloadIcon width="20" height="20" />
                  <MainText color={colors.white} size={fontSize[12]}>
                    {t('126')}
                  </MainText>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {loading && (
              <View style={styles.indicator}>
                <ActivityIndicator size={'large'} color={style.blue} />
              </View>
            )}
            <Pdf
              trustAllCerts={false}
              enablePaging={true}
              renderActivityIndicator={() => (
                <ActivityIndicator size={'small'} color={style.blue} />
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
    </View>
  );
};

export default UseTerm;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: style.fontFamilyMedium,
    lineHeight: 25,
  },
  download: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: style.StatusbarColor,
    padding: 10,
    width: style.width / 1.5,
    flexDirection: 'row',
  },
  downloadText: {
    color: '#fff',
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
  },
  main: {
    width: '90%',
    alignSelf: 'center',
    flex: 1,
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    height: style.height / 1.3,
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    paddingHorizontal: 10,
  },

  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    alignSelf: 'center',
  },
});
