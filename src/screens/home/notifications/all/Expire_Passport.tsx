import { StyleSheet, Text } from 'react-native';
import React from 'react';

import { t } from 'i18next';

import { navigate } from '../../../../navigation/NavigationRef';
import NotificationShell, { NotifButton } from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';
import { style } from '../../../../theme/style';
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
    // Boshqa bildirishnomalar body matni bilan BIR XIL (MainText = medium,
    // style.fontSize.xx+1, color text). Ilgari regular/rs13.5/textSecondary edi.
    fontSize: style.fontSize.xx + 1,
    fontFamily: rd.font.medium,
    color: rd.color.text,
    lineHeight: rs(22),
  },
});
