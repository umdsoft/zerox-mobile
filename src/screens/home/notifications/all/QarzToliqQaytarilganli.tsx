import { Text } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';
import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import { font } from '../../../../theme/font';
import NotificationShell from '../../../components/NotificationShell';

const Qarzqaytarilganligitogrisida = ({
  item,
  onQismanQaytarilgan,
  navigation,
  onToliqQaytgan,
}) => {
  const isCreditor = item.creditor === item.reciver;
  const isDebitor = item.debitor === item.reciver;
  if (!isCreditor && !isDebitor) {
    return null;
  }

  return (
    <NotificationShell
      title={t('543') as string}
      date={item?.created}
      time={item.time}
      onAccept={() =>
        item.residual_amount === 0
          ? onToliqQaytgan(item, 1)
          : onQismanQaytarilgan(item, 1)
      }
      onReject={() => onQismanQaytarilgan(item, 2)}
    >
      <TransText
        tKey={546}
        values={{
          name: isCreditor
            ? ReturnName.returnDebitorName(item)
            : ReturnName.returnCreditorName(item),
          id: item.number,
          start: item.created_at,
          sum: sortText(item.refundable_amount) + ' ' + item.currency,
          qoldiq: sortText(item.residual_amount) + ' ' + item.currency,
        }}
        components={{
          name: <TextBold />,
          id: (
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
          ),
          start: <MainText ft={font.medium} size={style.fontSize.xx - 2} />,
          sum: <TextBold />,
          qoldiq: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(Qarzqaytarilganligitogrisida);
