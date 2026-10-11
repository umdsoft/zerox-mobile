/**
 * UseTerm.tsx — "Foydalanish yo'riqnomasi" (menyu).
 *
 * 11.10 ("Yangi mobil xatolar 11.10", 4-rasm): menyudan kirilganda yo'riqnoma OCHILMASDI — spinner abadiy.
 * ILDIZ: PDF'ni react-native-pdf o'zi tarmoqdan yuklardi (pdf.zerox.uz/yoriqnoma.pdf, 3.6 MB, timeout yo'q);
 * yuklash yiqilsa `onError` faqat console'ga yozardi, `loading` hech qachon false bo'lmasdi.
 * Endi: (1) YANGI yo'riqnoma (qarz shartnomasi, qarz daftari, shaxsiy qarz, shaxsiy moliya va boshqalar) —
 * GUIDE_PDF_URL; (2) PDF'ni o'zimiz yuklaymiz (helper/ofertaPdf: timeout + holat/tur tekshiruvi + qayta
 * urinish) va lokal fayldan ko'rsatamiz; (3) xato bo'lsa — tushunarli xabar va "Qayta urinish".
 * "Yuklab olish" — PDF'ni telefon xotirasiga (Download) saqlab, ochadi.
 */
import { StatusBar, StyleSheet, View, ActivityIndicator, Platform, Text } from 'react-native';
import React from 'react';
import Pdf from 'react-native-pdf';
import { t } from 'i18next';
import FileViewer from 'react-native-file-viewer';
import Toast from 'react-native-toast-message';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { rd, rs } from '../../../../theme/rd';
import RdHeader from '../../redesign/RdHeader';
import Button from '../../../components/Button';
import DownloadIcon from '../../../../images/home/download.svg';
import { downloadOfertaPdf, removeOfertaFile } from '../../../../helper/ofertaPdf';
import { GUIDE_PDF_URL } from '../../../constants';
import { WarningIcon } from '../../redesign/icons';

const GUIDE_FILE_NAME = 'ZeroX-yoriqnoma.pdf';

type DocState = { kind: 'loading' } | { kind: 'ready'; path: string } | { kind: 'error' };

const UseTerm = () => {
  const [doc, setDoc] = React.useState<DocState>({ kind: 'loading' });
  const [downloading, setDownloading] = React.useState(false);
  const pathRef = React.useRef<string | null>(null);
  const cancelledRef = React.useRef(false);

  const load = React.useCallback(async () => {
    setDoc({ kind: 'loading' });
    const path = await downloadOfertaPdf(GUIDE_PDF_URL, () => cancelledRef.current);
    if (cancelledRef.current) {
      removeOfertaFile(path);
      return;
    }
    if (!path) {
      setDoc({ kind: 'error' });
      return;
    }
    removeOfertaFile(pathRef.current);
    pathRef.current = path;
    setDoc({ kind: 'ready', path });
  }, []);

  React.useEffect(() => {
    cancelledRef.current = false;
    load();
    return () => {
      cancelledRef.current = true;
      removeOfertaFile(pathRef.current);
    };
  }, [load]);

  /**
   * Yo'riqnomani telefon xotirasiga saqlash va ochish (allaqachon yuklangan nusxadan).
   * Android 10+ — MediaStore orqali Download/Zerox (csvExport bilan bir xil naqsh); boshqa holatda —
   * ilova papkasidagi nusxa PDF ko'ruvchida ochiladi (u yerdan ulashish/saqlash mumkin).
   */
  const onDownload = async () => {
    if (doc.kind !== 'ready') return;
    setDownloading(true);
    try {
      let saved = false;
      if (Platform.OS === 'android' && Number(Platform.Version) >= 29) {
        try {
          await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
            { name: GUIDE_FILE_NAME, parentFolder: 'Zerox', mimeType: 'application/pdf' },
            'Download',
            doc.path,
          );
          saved = true;
        } catch {
          // keshdagi nusxa baribir ochiladi
        }
      }
      const target = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${GUIDE_FILE_NAME}`;
      if (await ReactNativeBlobUtil.fs.exists(target)) await ReactNativeBlobUtil.fs.unlink(target);
      await ReactNativeBlobUtil.fs.cp(doc.path, target);
      if (saved) {
        Toast.show({
          type: 'omad',
          position: 'bottom',
          visibilityTime: 2500,
          props: { title: t('Yuklab olindi'), desc: t('Download/Zerox papkasiga saqlandi') },
        });
      }
      await FileViewer.open(target, { showOpenWithDialog: true }).catch(() => {});
    } catch (e) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { desc: t('Yuklab olish amalga oshmadi') },
      });
    } finally {
      setDownloading(false);
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
          loading={downloading}
          disabled={downloading || doc.kind !== 'ready'}
          fullWidth={false}
          leftIcon={<DownloadIcon width={rs(18)} height={rs(18)} />}
          style={styles.download}
        />

        <View style={styles.card}>
          {doc.kind === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator size={'large'} color={rd.color.primary} />
            </View>
          )}
          {doc.kind === 'error' && (
            <View style={styles.center}>
              <WarningIcon size={rs(28)} color={rd.color.warning} />
              <Text style={styles.errorText}>
                {t('Yo‘riqnomani yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.')}
              </Text>
              <Button title={t('Qayta urinish')} onPress={load} fullWidth={false} style={styles.retry} />
            </View>
          )}
          {doc.kind === 'ready' && (
            <Pdf
              enablePaging={false}
              source={{ uri: Platform.OS === 'android' ? `file://${doc.path}` : doc.path }}
              renderActivityIndicator={() => <ActivityIndicator size={'small'} color={rd.color.primary} />}
              onError={() => setDoc({ kind: 'error' })}
              style={styles.pdf}
            />
          )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: rs(12),
    paddingHorizontal: rs(24),
  },
  errorText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    lineHeight: rs(19),
    color: rd.color.textSecondary,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: rs(24),
    height: rs(42),
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: rd.color.surface,
  },
});
