import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import TextBold from '../../../components/TextBold';

import { style } from '../../../../theme/style';
import { t } from 'i18next';
const NewUser = ({ item, okay, navigation }) => {
  const onOkay = async () => {
    okay(item?.id);
  };
  return (
    <View style={styles.container}>
      <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
        <View>
          <TextBold>{t('756') as string}</TextBold>
        </View>
        <View style={{ marginTop: 10 }}>
          <Text allowFontScaling={false} style={styles.notification}>
            {t('759')}
          </Text>
        </View>
        <View>
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
                {item?.time?.slice(0, 5)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onOkay}
              activeOpacity={0.8}
              style={styles.button}
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
      </View>
    </View>
  );
};

export default NewUser;

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
