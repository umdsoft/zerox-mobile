import type { NotifPartialProps } from './notificationProps';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { contractRole } from '../../../../helper/contractActionError';
import { useNavigation } from '@react-navigation/native';
import { Text } from 'react-native';
import { style } from '../../../../theme/style';
import { rd } from '../../../../theme/rd';
import { font } from '../../../../theme/font';

import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/NotifBold';
import { t } from 'i18next';
import TransText from '../../../components/NotifTransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import NotificationShell from '../../../components/NotificationShell';

const Qarzqaytarilganligitogrisida = ({ item, okay, onToliqQaytgan }: NotifPartialProps) => {
  const navigation = useNavigation<any>();
  // 07.11: qaytarish/muddat so'rovini FAQAT qarz beruvchi (debitor) tasdiqlaydi/rad etadi (server 403 only-lender).
  // Joriy foydalanuvchi qarz oluvchi bo'lsa — tasdiq tugmalari o'rniga "Ok" (bildirishnomani yopish).
  const userId = useSelector((state: any) => state?.HomeReducer?.user?.data?.id);
  const role = contractRole(userId, item);
  const canDecide = role === undefined || role === 'lender';
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
      style={{ color: rd.color.primary }}
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
      onOk={canDecide ? undefined : () => okay(item.id, item.type)}
      onAccept={canDecide ? () => onToliqQaytgan(item, 1) : undefined}
      onReject={canDecide ? () => onToliqQaytgan(item, 2) : undefined}
    >
      <TransText
        tKey={546}
        values={values}
        components={{
          end: <MainText ft={font.medium} size={style.fontSize.xx + 1} />,
          start: <MainText ft={font.medium} size={style.fontSize.xx + 1} />,
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
