import { Text } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import NotificationShell from '../../../components/NotificationShell';

import { useSelector } from 'react-redux';
export const getFullName = (role: string, item: any) => {
  if (role === 'sender') {
    return item.creditor === item.csender
      ? `${item.d_last_name} ${item.d_first_name} ${item.d_middle_name}`
      : `${item.c_last_name} ${item.c_first_name} ${item.c_middle_name}`;
  } else if (role === 'receiver') {
    return item.creditor === item.creciver
      ? `${item.d_last_name} ${item.d_first_name} ${item.d_middle_name}`
      : `${item.c_last_name} ${item.c_first_name} ${item.c_middle_name}`;
  }
  return '';
};

const QarzShartnomasiRejectTime = ({ item, okay, navigation }) => {
  const { user } = useSelector(state => state.HomeReducer);

  const onOkay = async () => {
    okay(item.id);
  };

  const onPress = () => {
    navigation.navigate('DownloadStatistic', { item: item, id: item.id });
  };

  const isReceiver = item.creciver === user.data.id;
  const isSender = item.csender === user.data.id;
  if (!isReceiver && !isSender) {
    return null;
  }

  return (
    <NotificationShell
      title={t('498') as string}
      date={item?.created}
      time={item.time}
      onOk={onOkay}
    >
      <TransText
        tKey={isReceiver ? 501 : 495}
        values={{
          name: isReceiver
            ? item.dtypes === 2
              ? getFullName('receiver', item)
              : item.dtypes === 1
              ? item.dcompany
              : null
            : item.ctypes === 2
            ? getFullName('sender', item)
            : item.ctypes === 1
            ? item.ccompany
            : null,
          id: item.number,
          start: item.created,
        }}
        components={{
          name: <TextBold />,
          id: (
            <Text
              allowFontScaling={false}
              onPress={onPress}
              style={styles.number}
            />
          ),
          start: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(QarzShartnomasiRejectTime);

const styles = {
  number: {
    fontFamily: style.fontFamilyMedium,
    color: style.blue,
    fontSize: style.fontSize.xx - 2,
  },
};
