import {Button, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {t} from 'i18next';
import {Trans} from 'react-i18next';
import Toast from 'react-native-toast-message';
import {toastConfig} from './screens/components/ToastConfig';

const Test = () => {
  const [otp, setOtp] = useState('');

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>asdasd</Text>
      <Button
        title="onn"
        onPress={() => {
          Toast.show({
            autoHide: true,
            visibilityTime: 3000,
            position: 'top',
            type: 'omad',
            props: {title: t('243'), desc: t('Parol tiklandi')},
          });
        }}
      />
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default Test;

const styles = StyleSheet.create({});
