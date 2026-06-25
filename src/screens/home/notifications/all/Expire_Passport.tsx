import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

import { style } from '../../../../theme/style';
import { t } from 'i18next';

import { navigate } from '../../../../navigation/NavigationRef';
import NotificationShell from '../../../components/NotificationShell';
const ExpirePassport = ({ item, okay }) => {
  const onOkay = async () => {
    okay(item?.id);
  };
  return (
    <NotificationShell
      title={t('title_expire') as string}
      date={item?.created}
      time={item?.time}
      actions={
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => {
              // i need to call api to get creditor and debitor
              // /contract/near-notification?type=creditor&page=${this.page + 1}&limit=${this.limit}
              navigate('ScanFaceMyId');
            }}
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
              {t('747') as string}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOkay}
            activeOpacity={0.8}
            style={[styles.button, { marginLeft: 10 }]}
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
      }
    >
      <Text allowFontScaling={false} style={styles.notification}>
        {t('id_expire') as string}
      </Text>
    </NotificationShell>
  );
};

export default ExpirePassport;

const styles = StyleSheet.create({
  actionsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
});
