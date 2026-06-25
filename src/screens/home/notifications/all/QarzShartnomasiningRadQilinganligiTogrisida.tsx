import React, { memo } from 'react';

import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';

const QarzShartnomasiningRadQilinganligiTogrisida = ({ item, okay }) => {
  const onOkay = () => okay(item.id);

  const isCreditor = item.creditor === item.reciver;
  const isDebitor = item.debitor === item.reciver;
  if (!isCreditor && !isDebitor) {
    return null;
  }

  return (
    <NotificationShell
      title={t('510') as string}
      date={item?.created}
      time={item.time}
      onOk={onOkay}
    >
      <TransText
        tKey={isCreditor ? 513 : 483}
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
          sum: sortText(item.amount) + ' ' + item.currency,
        }}
        components={{
          name: <TextBold />,
          sum: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(QarzShartnomasiningRadQilinganligiTogrisida);
