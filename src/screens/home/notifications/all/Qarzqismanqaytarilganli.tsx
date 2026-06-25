import React, { memo } from 'react';
import { Text } from 'react-native';
import { style } from '../../../../theme/style';
import { font } from '../../../../theme/font';

import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import NotificationShell from '../../../components/NotificationShell';

const Qarzqaytarilganligitogrisida = ({ item, navigation, onToliqQaytgan }) => {
  const isCreditor = item.creditor === item.reciver;
  const isDebitor = item.debitor === item.reciver;
  if (!isCreditor && !isDebitor) {
    return null;
  }

  const idComp = (
    <Text
      allowFontScaling={false}
      onPress={() => {
        navigation.navigate('DownloadStatistic', { item, id: item.contract });
      }}
      style={{ color: style.blue }}
    />
  );

  const values = isCreditor
    ? {
        end: item.created_at,
        id: item.number,
        name:
          item.dtypes === 2
            ? ReturnName.returnDebitorName(item)
            : item.dtypes === 1
            ? item.dcompany
            : null,
        sum: sortText(item.inc) + ' ' + item.currency,
        qoldiq: sortText(item.residual_amount) + ' ' + item.currency,
      }
    : {
        start: item.created_at,
        id: item.number,
        name:
          item.ctypes === 2
            ? ReturnName.returnCreditorName(item)
            : item.ctypes === 1
            ? item.ccompany
            : null,
        sum: sortText(item.refundable_amount) + ' ' + item.currency,
        qoldiq: sortText(item.residual_amount) + ' ' + item.currency,
      };

  return (
    <NotificationShell
      title={t('543') as string}
      date={item?.created}
      time={item.time}
      onAccept={() => onToliqQaytgan(item, 1)}
      onReject={() => onToliqQaytgan(item, 2)}
    >
      <TransText
        tKey={546}
        values={values}
        components={{
          end: <MainText ft={font.medium} size={style.fontSize.xx - 2} />,
          start: <MainText ft={font.medium} size={style.fontSize.xx - 2} />,
          name: <TextBold />,
          sum: <TextBold />,
          qoldiq: <TextBold />,
          id: idComp,
        }}
      />
    </NotificationShell>
  );
};

export default memo(Qarzqaytarilganligitogrisida);
