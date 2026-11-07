import type { NotifRepaidProps } from './notificationProps';
import { Text } from 'react-native';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { contractRole } from '../../../../helper/contractActionError';
import { useNavigation } from '@react-navigation/native';

import { style } from '../../../../theme/style';
import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/NotifBold';
import { t } from 'i18next';
import TransText from '../../../components/NotifTransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import { font } from '../../../../theme/font';
import NotificationShell from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';

const Qarzqaytarilganligitogrisida = ({
  item,
  okay,
  onQismanQaytarilgan,
  onToliqQaytgan
}: NotifRepaidProps) => {
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

  return (
    <NotificationShell
      title={t('543') as string}
      date={item?.created}
      time={item.time}
      onOk={canDecide ? undefined : () => okay(item.id, item.type)}
      onAccept={
        canDecide
          ? () =>
              Number(item.residual_amount) === 0
                ? onToliqQaytgan(item, 1)
                : onQismanQaytarilgan(item, 1)
          : undefined
      }
      onReject={canDecide ? () => onQismanQaytarilgan(item, 2) : undefined}
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
              style={{ color: rd.color.primary }}
            />
          ),
          start: <MainText ft={font.medium} size={style.fontSize.xx + 1} />,
          sum: <TextBold />,
          qoldiq: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(Qarzqaytarilganligitogrisida);
