import { Text } from 'react-native';
import React, { memo } from 'react';
import { style } from '../../../../theme/style';

import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';

const QarzMuddatiniUzaytirishRadEtilganligiTogrisida = ({
  item,
  okay,
  navigation,
}) => {
  const onPress = async () => {
    okay(item.id);
  };

  const isCreditor = item.creditor === item.reciver;
  const isDebitor = item.debitor === item.reciver;
  if (!isCreditor && !isDebitor) {
    return null;
  }

  const idComp = (
    <Text
      allowFontScaling={false}
      onPress={() => {
        navigation.navigate('DownloadStatistic', {
          item,
          id: item.contract,
        });
      }}
      style={[
        {
          fontSize: style.fontSize.xx - 2,
          fontFamily: style.fontFamilyMedium,
          color: style.textColor,
        },
        { color: style.blue },
      ]}
    >
      {item.number}
    </Text>
  );

  const values = isCreditor
    ? {
        name:
          item.dtypes === 2
            ? ReturnName.returnDebitorName(item)
            : item.dtypes === 1
            ? item.dcompany
            : null,
        start: item.created_at,
        id: item.number,
      }
    : {
        name:
          item.ctypes === 2
            ? ReturnName.returnCreditorName(item)
            : item.ctypes === 1
            ? item.ccompany
            : null,
        start: item.created_at,
        id: item.number,
      };

  return (
    <NotificationShell
      title={t('576') as string}
      date={item?.created}
      time={item.time}
      onOk={onPress}
    >
      <TransText
        tKey={573}
        values={values}
        components={{
          name: <TextBold />,
          id: idComp,
          start: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(QarzMuddatiniUzaytirishRadEtilganligiTogrisida);
