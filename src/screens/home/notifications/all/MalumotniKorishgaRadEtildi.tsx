import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/TextBold';

import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { toastConfig } from '../../../components/ToastConfig';
import { t } from 'i18next';
import ReturnName from '../../../../helper/returnName';

const MalumotniKorishgaRadEtildi = ({ item, navigation, okay }) => {
  const onPress = async () => {
    okay(item.id);
  };

  return (
    <View style={styles.container}>
      <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
        <View>
          <TextBold>{t('870') as string}</TextBold>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text allowFontScaling={false} style={styles.notification}>
            <TextBold>
              {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}
              {item.dtypes === 1 ? item.dcompany : null}
            </TextBold>{' '}
            {t('873') as string}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <View style={{ flexDirection: 'row' }}>
            <Text allowFontScaling={false} style={styles.notificationTitle}>
              <Text allowFontScaling={false}>{item?.created} </Text>
            </Text>
            <Text allowFontScaling={false} style={styles.notificationTitle}>
              {' '}
              {item.time?.slice(0, 5)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.button, { backgroundColor: '#4e91d2' }]}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.notification,
                { color: '#fff', fontSize: style.fontSize.xx - 2 },
              ]}
            >
              Ok
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default memo(MalumotniKorishgaRadEtildi);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    width: '95%',
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    borderRadius: 10,
    elevation: 7,
  },
  button: {
    backgroundColor: style.blue,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notification: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  notificationTitle: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
