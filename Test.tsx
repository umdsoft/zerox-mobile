import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Pdf from 'react-native-pdf';
const Test = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Pdf
        source={{ uri: 'https://pdfobject.com/pdf/sample.pdf' }}
        style={{ width: 400, height: 700 }}
      />
    </View>
  );
};

export default Test;

const styles = StyleSheet.create({});
