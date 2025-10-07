import {Button, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import {toastConfig} from './components/ToastConfig';
import {OtpInput} from 'react-native-otp-entry';
const TestTextInput = () => {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <OtpInput
        numberOfDigits={5}
        theme={{
          focusedPinCodeContainerStyle: {
            borderColor: 'blue',
          },
          focusStickStyle: {
            backgroundColor: 'blue',
          },
          pinCodeContainerStyle: {
            marginHorizontal: 5,
            width: 60,
            height: 70,
          },
        }}
      />
    </View>
  );
};

export default TestTextInput;

const styles = StyleSheet.create({});
