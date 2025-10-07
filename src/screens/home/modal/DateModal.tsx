import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import DatePicker from '@react-native-community/datetimepicker';
import {Modal} from 'react-native-paper';
import {normalize, style} from '../../../theme/style';
import {useTranslation} from 'react-i18next';
const DateModal = ({open, setOpen, title = '', date, setDate, min}) => {
  const {t} = useTranslation();
  return (
    <Modal visible={open} dismissable={true} onDismiss={() => setOpen(!open)}>
      {/* <View
        style={{
          backgroundColor: 'white',
          alignSelf: 'center',
          borderRadius: 10,
        }}> */}
      {/* <Text
          style={{
            fontFamily: style.fontFamilyMedium,
            fontSize: style.fontSize.xx + 2,
            color: '#000',
            marginLeft: 10,
            marginTop: 10,
            marginBottom: 10,
          }}>
          {title}
        </Text> */}
      <DatePicker
        open={date}
        date={date}
        style={{backgroundColor: '#fff', alignSelf: 'center'}}
        mode="date"
        confirmText="OKAY"
        cancelText={t('804')}
        theme="light"
        onCancel={() => {
          console.log('blue');
        }}
        title="asdsad"
        onConfirm={date => {
          console.log('red');
        }}
        onDateChange={date => {
          setDate(date);
        }}
        minimumDate={min}
      />
      {/* <View
          style={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            borderTopColor: style.blue,
            borderTopWidth: 0.3,
          }}>
          <TouchableOpacity
            onPress={() => {
              setDate(new Date());
              setOpen(!open);
            }}
            style={styles.buttonDate}>
            <Text
              style={{
                fontFamily: style.fontFamilyMedium,
                fontSize: style.fontSize.xx,
                color: '#000',
              }}>
              Bekor qilish
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setOpen(!open);
            }}
            style={[
              styles.buttonDate,
              {borderLeftColor: style.blue, borderLeftWidth: 0.3},
            ]}>
            <Text
              style={{
                fontFamily: style.fontFamilyMedium,
                fontSize: style.fontSize.xx,
                color: '#000',
              }}>
              OK
            </Text>
          </TouchableOpacity>
        </View> */}
      {/* </View> */}
    </Modal>
  );
};

export default DateModal;

const styles = StyleSheet.create({
  buttonDate: {
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',

    width: normalize(250) / 2,
  },
});
