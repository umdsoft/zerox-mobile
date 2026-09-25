import React, { memo } from 'react';

import TextBold from '../../../components/NotifBold';
import { useSelector } from 'react-redux';

import { t } from 'i18next';
import TransText from '../../../components/NotifTransText';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';

const PulMablagOtkazilganligi = ({ item, okay, navigation }) => {
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector(state => state.HomeReducer.user);

  const onOkay = async () => {
    okay(item.id);
  };

  if (user?.data?.id !== item.creditor) {
    return null;
  }

  return (
    <NotificationShell
      title={t('633') as string}
      date={item?.created}
      time={item.time}
      onOk={onOkay}
    >
      <TransText
        tKey={636}
        values={{
          name:
            item.dtypes === 2
              ? ReturnName.returnDebitorName(item)
              : item.dtypes === 1
              ? item.dcompany
              : null,
          sum: item.token
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
          id: item.duid,
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

export default memo(PulMablagOtkazilganligi);
