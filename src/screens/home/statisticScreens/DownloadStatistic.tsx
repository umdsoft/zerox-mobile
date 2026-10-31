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
import { ShareIcon } from '../redesign/icons';
import DownloadIcon from '../../../images/home/download.svg';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import Pdf from 'react-native-pdf';

import Share from 'react-native-share';
import { t } from 'i18next';
import { storage } from '../../../store/api/token/getToken';

import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { PDF_INDEX_URL } from '../../constants';
import { pdfCachePath } from '../../../helper/pdfCache';

const DownloadStatistic = () => {
  // paramssiz ochilsa ham crash bermasin (guard).
  const { item, id } = (useRoute().params as { item?: any; id?: any }) || {};
  const [loading, setLoading] = useState(true);

  const onShare = async () => {
    const lang = storage.getString('lang');
    try {
      // SEC (2026-10-31): PDF ilova keshida (zx_pdf/) — Document papkada emas.
      const path = await pdfCachePath(
        `${item?.number?.split('/')?.join('_')}${setNameByLang(lang!)}`,
      );
      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        overwrite: true,
        appendExt: 'pdf',
        path,
      }).fetch('GET', `${PDF_INDEX_URL}?id=${item?.uid}&download=0&lang=${lang}`);
      await Share.open({
        failOnCancel: false,
        url: Platform.OS === 'android' ? `file://${res.path()}` : res.path(),
      });
    } catch (err) {
      // Ulashish bekor qilindi yoki yuklab bo'lmadi — jim.
    }
  };

  const onDownload = async () => {
    Toast.show({
      autoHide: true,
      visibilityTime: 2000,
      position: 'bottom',
      type: 'omad',
      props: { desc: t('789') + '...' },
    });
    try {
      const lang = storage.getString('lang');
      const fileName = `${item?.number?.split('/').join('_')}${setNameByLang(
        lang!,
      )}`;
      // SEC (2026-10-31): ommaviy Download/MediaStore o'rniga ilova keshi; saqlash/ulashishni
      // foydalanuvchi FileViewer oynasidan o'zi tanlaydi.
      const filePath = await pdfCachePath(fileName);
      const downloadUrl = `${PDF_INDEX_URL}?id=${
        item?.uid
      }&download=0&lang=${storage.getString('lang') || 'uz'}`;

      const resp = await ReactNativeBlobUtil.config({
        appendExt: 'pdf',
        overwrite: true,
        path: filePath,
      }).fetch('GET', downloadUrl);
      await FileViewer.open(resp.path(), { showOpenWithDialog: true });
    } catch (error) {
      console.error('Download or open file error:', error);

      // Show an error notification
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { desc: t('down_error') },
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
            {/* Ko'rinadigan share ikonasi (ilgari oq svg oq tugmada ko'rinmasdi). */}
            <ShareIcon size={rs(18)} color={rd.color.text} />
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
              uri: `${PDF_INDEX_URL}?id=${
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
