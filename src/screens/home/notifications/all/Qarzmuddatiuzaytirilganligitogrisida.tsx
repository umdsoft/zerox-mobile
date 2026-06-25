import { Text } from 'react-native';
import React, { memo } from 'react';
import { style } from '../../../../theme/style';

import { settingDate } from '../../../../helper';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';

const Qarzmuddatiuzaytirilganligitogrisida = ({ item, okay, navigation }) => {
  const onPress = async () => {
    okay(item.id);
  };

  const isCreditor = item.creditor === item.reciver;
  const isDebitor = item.debitor === item.reciver;
  if (!isCreditor && !isDebitor) {
    return null;
  }

  return (
    <NotificationShell
      title={
        isCreditor
          ? (t('528') as string)
          : 'Qarz muddati uzaytirilganligi to‘g‘risida'
      }
      date={item?.created}
      time={item.time}
      onOk={onPress}
    >
      <TransText
        tKey={531}
        values={{
          name: isCreditor
            ? item.dtypes === 2
              ? ReturnName.returnDebitorName(item)
              : item.dtypes === 1
              ? item.dcompany
              : null
            : item.ctypes === 2
            ? ReturnName.returnCreditorName(item)
            : item.ctypes === 1
            ? item.ccompany
            : null,
          start: item.created_at,
          id: item.number,
          end: settingDate(item.end_date),
        }}
        components={{
          name: <TextBold />,
          id: (
            <Text
              onPress={() => {
                navigation.navigate('DownloadStatistic', {
                  item,
                  id: item.contract,
                });
              }}
              allowFontScaling={false}
              style={{ color: style.blue }}
            >
              {item.number}
            </Text>
          ),
          start: <TextBold />,
          end: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(Qarzmuddatiuzaytirilganligitogrisida);
