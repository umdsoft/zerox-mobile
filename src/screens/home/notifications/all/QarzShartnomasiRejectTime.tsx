import { Text } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/NotifBold';
import { t } from 'i18next';
import TransText from '../../../components/NotifTransText';
import NotificationShell from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';

import { useSelector } from 'react-redux';
// FISH -> TitleCase; otasining ismi qo'shimchasi ("o'g'li"/"qizi") KICHIK harfда qoladi.
const titleCase = (s: string) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w =>
      /^(o.?g.?li|ug.?li|qizi)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(' ');

export const getFullName = (role: string, item: any) => {
  if (role === 'sender') {
    return titleCase(
      item.creditor === item.csender
        ? `${item.d_last_name} ${item.d_first_name} ${item.d_middle_name}`
        : `${item.c_last_name} ${item.c_first_name} ${item.c_middle_name}`,
    );
  } else if (role === 'receiver') {
    return titleCase(
      item.creditor === item.creciver
        ? `${item.d_last_name} ${item.d_first_name} ${item.d_middle_name}`
        : `${item.c_last_name} ${item.c_first_name} ${item.c_middle_name}`,
    );
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
    color: rd.color.primary,
    fontSize: style.fontSize.xx + 1,
  },
};
