import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';

import {style} from '../../../../theme/style';
import {t} from 'i18next';
import {useSelector} from 'react-redux';
import NotificationShell from '../../../components/NotificationShell';
const Eslatma = ({item, okay, navigation}) => {
  const {home} = useSelector(state => state.HomeReducer);
  const onOkay = async () => {
    okay(item?.id);
  };
  return (
    <NotificationShell
      title={t('eslatma') as string}
      date={item?.created}
      time={item?.time}
      actions={
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => {
              // i need to call api to get creditor and debitor
              // /contract/near-notification?type=creditor&page=${this.page + 1}&limit=${this.limit}
              navigation.navigate('MuddatOzQolgan', {
                creditor: home?.creditor,
                debitor: home?.debitor,
                type: 'creditor',
              });
            }}
            activeOpacity={0.8}
            style={styles.button}>
            <Text
              style={[
                styles.notification,
                {color: '#fff', fontSize: style.fontSize.xx - 2},
              ]}
              allowFontScaling={false}>
              {t('22')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOkay}
            activeOpacity={0.8}
            style={[styles.button, {marginLeft: 10}]}>
            <Text
              style={[
                styles.notification,
                {color: '#fff', fontSize: style.fontSize.xx - 2},
              ]}
              allowFontScaling={false}>
              Ok
            </Text>
          </TouchableOpacity>
        </View>
      }>
      <Text style={styles.notification} allowFontScaling={false}>
        {t('eslatma1')}
      </Text>
    </NotificationShell>
  );
};

export default Eslatma;

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
