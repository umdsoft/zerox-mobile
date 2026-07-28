import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Modal } from 'react-native-paper';
import { rd, rs } from '../../../theme/rd';

import FileViewer from 'react-native-file-viewer';
import { t } from 'i18next';
import TransText from '../../components/TransText';

const DownloadModal = ({ hide, onHide, data, path }) => {
  return (
    <Modal
      visible={hide}
      onDismiss={() => {
        onHide(!hide);
      }}
    >
      <View style={styles.card}>
        <View style={styles.grabber} />

        <Text style={styles.title} allowFontScaling={false}>
          {t('Bildirishnoma')}
        </Text>

        {data?.number && (
          <View style={styles.body}>
            <TransText
              tKey={'noti'}
              components={{
                id: <Text style={styles.text} allowFontScaling={false} />,
              }}
              values={{ id: data.number }}
            />
          </View>
        )}
        {data?.type == 0 ? (
          <View style={styles.body}>
            <Text style={styles.text} allowFontScaling={false}>
              {t("Siz o'zingizni qr kodingizni yuklab oldingiz.")}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => {
              onHide(!hide);
            }}
            activeOpacity={0.85}
            style={[styles.btn, styles.btnSecondary]}
          >
            <Text style={styles.btnSecondaryText} allowFontScaling={false}>
              {t('21')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              FileViewer.open(path)
                .then(response => {
                  onHide(!hide);
                  console.log({ 'FileViewerModal-response': response });
                })
                .catch(error => {
                  console.log({ 'FileViewerModal-error': error });
                });
              // onHide(!hide);
            }}
            activeOpacity={0.85}
            style={[styles.btn, styles.btnPrimary]}
          >
            <Text style={styles.btnPrimaryText} allowFontScaling={false}>
              {t('ochish')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DownloadModal;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: rs(322),
    maxWidth: '92%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(10),
    paddingHorizontal: rs(20),
    paddingBottom: rs(20),
    shadowColor: rd.color.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  grabber: {
    width: rs(40),
    height: rs(4),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.textTertiary,
    alignSelf: 'center',
    marginBottom: rs(14),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
  },
  body: {
    marginTop: rs(10),
  },
  text: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: rs(20),
  },
  btn: {
    flex: 1,
    height: rs(50),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.radius.lg,
  },
  btnSecondary: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginRight: rs(10),
  },
  btnSecondaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
  },
  btnPrimary: {
    backgroundColor: rd.color.primary,
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
});
