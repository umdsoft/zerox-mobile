import { Text } from 'react-native';
import React from 'react';

import { style } from '../../../../theme/style';
import { t } from 'i18next';
import NotificationShell from '../../../components/NotificationShell';
const NewUser = ({ item, okay, navigation }) => {
  const onOkay = async () => {
    okay(item?.id);
  };
  return (
    <NotificationShell
      title={t('756') as string}
      date={item?.created}
      time={item?.time}
      onOk={onOkay}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: style.fontSize.xx - 2,
          fontFamily: style.fontFamilyMedium,
          color: style.textColor,
        }}
      >
        {t('759')}
      </Text>
    </NotificationShell>
  );
};

export default NewUser;
