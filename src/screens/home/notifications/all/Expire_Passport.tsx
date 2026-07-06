import { StyleSheet, Text } from 'react-native';
import React from 'react';

import { t } from 'i18next';

import { navigate } from '../../../../navigation/NavigationRef';
import NotificationShell, { NotifButton } from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';
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
        <>
          <NotifButton
            label={t('747') as string}
            onPress={() => navigate('ScanFaceMyId')}
          />
          <NotifButton label="Ok" variant="ghost" onPress={onOkay} />
        </>
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
  notification: {
    fontSize: rs(13.5),
    fontFamily: rd.font.regular,
    color: rd.color.textSecondary,
    lineHeight: rs(20),
  },
});
