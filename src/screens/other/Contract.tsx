import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useRoute } from '@react-navigation/native';
import DownloadIcon from '../../images/home/download.svg';
import Toast from 'react-native-toast-message';
import Pdf from 'react-native-pdf';

import ReactNativeBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { t } from 'i18next';
import { useSelector } from 'react-redux';

import { rd, rs } from '../../theme/rd';
import { downloadOfertaPdf, removeOfertaFile } from '../../helper/ofertaPdf';
import RdHeader from '../home/redesign/RdHeader';

const Contract = () => {
  const [loading, setLoading] = useState(true);
  /**
   * 09.10 (2-band): PDF endi O'ZIMIZ yuklaymiz (timeout + HTTP holati/turi
   * tekshiruvi + qayta urinish) — ilgari react-native-pdf URL'ni o'zi ochardi,
   * `onError` yo'q edi va xato javobda (masalan uid=0 -> HTTP 400) spinner
   * ABADIY aylanardi.
   */
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const pathRef = useRef<string | null>(null);
  const cancelRef = useRef(false);
  const { url: rawUrl, title } = useRoute().params;
  const user = useSelector(state => state.HomeReducer.user);
  /**
   * 08.10 (5-band): tasdiqlangan oferta PDF'iga server (pdf.zerox.uz) endi QR ostiga
   * "Ommaviy oferta FISH tomonidan … da tasdiqlangan." muhrini qo'shadi. Oraliq
   * (HTTP/ OS) keshdagi ESKI nusxa (muhrsiz) ko'rinmasligi uchun har ochilishda
   * keshni chetlab o'tuvchi parametr qo'shiladi (server uni e'tiborsiz qoldiradi).
   */
  const [url] = useState(() =>
    rawUrl
      ? `${rawUrl}${String(rawUrl).includes('?') ? '&' : '?'}_ts=${Date.now()}`
      : rawUrl,
  );

  const load = useCallback(async () => {
    cancelRef.current = false;
    setLoadErr(false);
    setLoading(true);
    const path = url ? await downloadOfertaPdf(url, () => cancelRef.current) : null;
    if (cancelRef.current) {
      removeOfertaFile(path);
      return;
    }
    if (!path) {
      setLoading(false);
      setLoadErr(true);
      return;
    }
    removeOfertaFile(pathRef.current);
    pathRef.current = path;
    setPdfPath(path);
  }, [url]);

  useEffect(() => {
    load();
    return () => {
      cancelRef.current = true;
      removeOfertaFile(pathRef.current);
      pathRef.current = null;
    };
  }, [load]);

  // SS-AUDIT (2026-09-25): progress faqat console'ga yozilardi — endi no-op.
  const downloadProgress = () => {};

  const onDownload = async () => {
    Toast.show({
      autoHide: true,
      visibilityTime: 2000,
      position: 'bottom',
      type: 'omad',
      props: { desc: t('789') + '...' },
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
        props: { desc: t('Yuklab olish amalga oshmadi') },
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
          {loading && !loadErr && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size={'large'} color={rd.color.primary} />
            </View>
          )}
          {loadErr ? (
            // 09.10: xato — abadiy spinner o'rniga tushunarli xabar va qayta urinish.
            <View style={styles.errorBox}>
              <Text style={styles.errorText} allowFontScaling={false}>
                {t('Oferta hujjatini yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.')}
              </Text>
              <TouchableOpacity
                onPress={load}
                activeOpacity={0.85}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText} allowFontScaling={false}>
                  {t('Qayta urinish')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : pdfPath ? (
            <Pdf
              trustAllCerts={false}
              enablePaging={true}
              renderActivityIndicator={() => (
                <ActivityIndicator size={'large'} color={rd.color.primary} />
              )}
              // Fayl allaqachon tekshirilib yuklangan (keshda) — tarmoq yo'q.
              source={{ uri: `file://${pdfPath}`, cache: false }}
              onLoadComplete={() => {
                setLoading(false);
              }}
              onError={() => {
                setLoading(false);
                setLoadErr(true);
              }}
              style={styles.pdf}
            />
          ) : null}
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
  // Tugma kontent kengligida (ilgari '100%' — juda uzun edi).
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: rs(8),
    height: rs(46),
    paddingHorizontal: rs(30),
    borderRadius: rd.radius.pill,
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
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
    gap: rs(14),
  },
  errorText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    lineHeight: rs(19),
    color: rd.color.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    height: rs(44),
    paddingHorizontal: rs(26),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: rd.color.onPrimary,
    fontSize: rs(14),
    fontFamily: rd.font.semibold,
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
