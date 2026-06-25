import { Text } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/TextBold';

import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { toastConfig } from '../../../components/ToastConfig';
import { t } from 'i18next';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';

const MalumotniKorishgaRadEtildi = ({ item, navigation, okay }) => {
  const onPress = async () => {
    okay(item.id);
  };

  return (
    <NotificationShell
      title={t('870') as string}
      date={item?.created}
      time={item.time}
      onOk={onPress}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: style.fontSize.xx - 2,
          fontFamily: style.fontFamilyMedium,
          color: style.textColor,
        }}
      >
        <TextBold>
          {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}
          {item.dtypes === 1 ? item.dcompany : null}
        </TextBold>{' '}
        {t('873') as string}
      </Text>
    </NotificationShell>
  );
};

export default memo(MalumotniKorishgaRadEtildi);
