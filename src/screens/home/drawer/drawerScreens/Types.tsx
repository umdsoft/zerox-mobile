import { StatusBar, StyleSheet, View } from 'react-native';
import React from 'react';
import Pdf from 'react-native-pdf';
import { t } from 'i18next';

import { rd, rs } from '../../../../theme/rd';
import RdHeader from '../../redesign/RdHeader';
import { storage } from '../../../../store/api/token/getToken';

const Types = () => {
  const returnURL = () => {
    switch (storage.getString('lang')) {
      case 'uz':
        return 'https://pdf.zerox.uz/tarif.pdf';
      default:
        return `https://pdf.zerox.uz/tarif_${
          storage.getString('lang') || 'uz'
        }.pdf`;
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('117')} />

      <View style={styles.content}>
        <View style={styles.card}>
          <Pdf
            trustAllCerts={false}
            enablePaging={true}
            source={{
              uri: returnURL(),
              method: 'GET',
              cache: false,
            }}
            style={styles.pdf}
          />
        </View>
      </View>
    </View>
  );
};

export default Types;

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
  card: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: rd.color.surface,
  },
});
