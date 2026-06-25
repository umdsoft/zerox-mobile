import React, { memo } from 'react';

import TextBold from '../../../components/TextBold';
import { useSelector } from 'react-redux';

import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';

const PulMablagOtkazilganligiHaqida = ({ item, okay, navigation }) => {
  const { user } = useSelector(state => state.HomeReducer);
  console.log('item', item);
  const onOkay = async () => {
    okay(item.id);
  };

  if (user?.data?.id !== item.reciver) {
    return null;
  }

  return (
    <NotificationShell
      title={t('627') as string}
      date={item?.created}
      time={item.time}
      onOk={onOkay}
    >
      <TransText
        tKey={630}
        values={{
          name:
            item.ctypes === 2
              ? ReturnName.returnCreditorName(item)
              : item.ctypes === 1
              ? item.ccopmany
              : null,
          sum: item.token
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
          id: item.cuid.slice(0, 6) + item.cuid.slice(-2),
        }}
        components={{
          name: <TextBold />,
          sum: <TextBold />,
          id: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(PulMablagOtkazilganligiHaqida);
