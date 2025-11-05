import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { BackGroundIcon } from '../../../helper/homeIcon';
import { style } from '../../../theme/style';
import FileViewer from 'react-native-file-viewer';

import { useRoute } from '@react-navigation/native';
import ShareIcon from '../../../images/home/share.svg';
import DownloadIcon from '../../../images/home/download.svg';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import Pdf from 'react-native-pdf';

import Share from 'react-native-share';
import OtherHeader from '../../components/OtherHeader';
// import RNFS from 'react-native-fs';
import MainText from '../../components/MainText';
import { fontSize } from '../../../theme/font';
import { colors } from '../../../theme/colors';
import { t } from 'i18next';
import { storage } from '../../../store/api/token/getToken';

const DownloadStatistic = () => {
  const { item, id } = useRoute().params;
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
  // console.log(path, 'padth');

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

  // const requestPermission = async () => {
  //   const granted = await PermissionsAndroid.request(
  //     PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  //     {
  //       title: 'Ruxsat berish',
  //       message: 'Fayllarni yuklab olish uchun ruxsat bering',
  //       buttonNeutral: "Keyinroq so'rash",
  //       buttonNegative: 'Bekor qilish',
  //       buttonPositive: 'Ruxsat berish',
  //     },
  //   );
  //   if (granted === PermissionsAndroid.RESULTS.GRANTED) {
  //     console.log('You can use the camera');
  //   } else {
  //     console.log('Camera permission denied');
  //   }
  // };

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
      <OtherHeader title={t('324')} />
      <View style={styles.main}>
        <View style={styles.aboutUsContainer}>
          {/* <View
            style={{
              marginTop: 20,
              maxWidth: '80%',
              alignItems: 'center',
              alignSelf: 'center',
              justifyContent: 'center',
            }}>
            <TransText
              tKey={'399'}
              values={{
                id: item.number,
              }}
              components={{
                id: <MainText size={fontSize[12]} textAlign={'center'} />,
              }}
            />
           
          </View> */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            {/* ------------------------   Yuklab olish   ------------------------ */}
            <TouchableOpacity
              onPress={onDownload}
              activeOpacity={0.8}
              style={styles.download}
            >
              <DownloadIcon width="20" height="20" />
              <MainText color={colors.white} size={fontSize[12]}>
                {t('126')}
              </MainText>
            </TouchableOpacity>
            {/* ------------------------   Ulashish   ------------------------ */}
            <TouchableOpacity
              onPress={onShare}
              activeOpacity={0.8}
              style={styles.download}
            >
              <ShareIcon width="20" height="20" />
              <MainText color={colors.white} size={fontSize[12]}>
                {t('129')}
              </MainText>
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
              // renderActivityIndicator={() => (
              //   <ActivityIndicator size={'small'} color={style.blue} />
              // )}
              // source={{ uri: `https://pdf.zerox.uz/index.php?id=${item.uid}&download=0&lang=uz`, method: 'GET' }}
              source={{
                uri: `https://pdf.zerox.uz/index.php?id=${
                  item.uid
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
      {/* <DownloadModal hide={hide} onHide={setHide} data={item} path={path} /> */}
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default DownloadStatistic;

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
