import { Text } from 'react-native';
import React, { memo } from 'react';
import { style } from '../../../../theme/style';

import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import NotificationShell from '../../../components/NotificationShell';
// 561

const QarzniQaytarishQabulQilinganligiTogrisida = ({
  item,
  okay,
  navigation,
}) => {
  const onPress = async () => {
    okay(item.id, 1);
  };

  const isCreditor = item.creditor === item.reciver;
  const isDebitor = item.debitor === item.reciver;
  if (!isCreditor && !isDebitor) {
    return null;
  }

  const numberComp = (
    <Text
      allowFontScaling={false}
      onPress={() => {
        navigation.navigate('DownloadStatistic', {
          item,
          id: item.contract,
        });
      }}
      style={{ color: style.blue }}
    />
  );

  const values = isCreditor
    ? {
        start: item.created_at,
        id: item.number,
        name:
          item.dtypes === 2
            ? ReturnName.returnDebitorName(item)
            : item.dtypes === 1
            ? item.dcompany
            : null,
        sum: sortText(item.residual_amount) + ' ' + item.currency,
      }
    : {
        start: item.created_at,
        number: item.number,
        name:
          item.ctypes === 2
            ? ReturnName.returnCreditorName(item)
            : item.ctypes === 1
            ? item.ccompany
            : null,
        sum: sortText(item.residual_amount) + ' ' + item.currency,
      };

  const components = isCreditor
    ? {
        start: <MainText size={style.fontSize.xx - 2} />,
        id: numberComp,
        name: <TextBold />,
        sum: <TextBold />,
      }
    : {
        start: <TextBold />,
        number: numberComp,
        name: <TextBold />,
        sum: <TextBold />,
      };

  return (
    <NotificationShell
      title={t('558') as string}
      date={item?.created}
      time={item.time}
      onOk={onPress}
    >
      <TransText tKey={561} values={values} components={components} />
    </NotificationShell>
  );
};

export default memo(QarzniQaytarishQabulQilinganligiTogrisida);
