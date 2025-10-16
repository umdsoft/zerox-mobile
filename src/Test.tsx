import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { toastConfig } from './screens/components/ToastConfig';
import Pdf from 'react-native-pdf';

const Test = () => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pdf
        trustAllCerts={false}
        enablePaging={true}
        renderActivityIndicator={() => (
          <ActivityIndicator size={'small'} color={'#000'} />
        )}
        onError={error => {
          console.log(error);
        }}
        onLoadComplete={(numberOfPages, filePath) => {
          console.log(`Number of pages: ${numberOfPages}`);
        }}
        onPageChanged={(page, numberOfPages) => {
          console.log(`Current page: ${page}`);
        }}
        onPressLink={uri => {
          console.log(`Link pressed: ${uri}`);
        }}
        source={{ uri: 'https://pdfobject.com/pdf/sample.pdf' }}
        style={{ width: 400, height: 700 }}
      />
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default Test;

const styles = StyleSheet.create({});
