import {StyleSheet, Text} from 'react-native';
import React from 'react';

import {t} from 'i18next';
import {useSelector} from 'react-redux';
import NotificationShell, {NotifButton} from '../../../components/NotificationShell';
import {rd, rs} from '../../../../theme/rd';
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
        <>
          <NotifButton
            label={t('22') as string}
            onPress={() => {
              navigation.navigate('MuddatOzQolgan', {
                creditor: home?.creditor,
                debitor: home?.debitor,
                type: 'creditor',
              });
            }}
          />
          <NotifButton label="Ok" variant="ghost" onPress={onOkay} />
        </>
      }>
      <Text style={styles.notification} allowFontScaling={false}>
        {t('eslatma1')}
      </Text>
    </NotificationShell>
  );
};

export default Eslatma;

const styles = StyleSheet.create({
  notification: {
    fontSize: rs(13.5),
    fontFamily: rd.font.regular,
    color: rd.color.textSecondary,
    lineHeight: rs(20),
  },
});
