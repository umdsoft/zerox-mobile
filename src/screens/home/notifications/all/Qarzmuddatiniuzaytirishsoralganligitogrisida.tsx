import type { NotifExtendAskProps } from './notificationProps';
import { Text } from 'react-native';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { contractRole } from '../../../../helper/contractActionError';
import { useNavigation } from '@react-navigation/native';

import { style } from '../../../../theme/style';
import { rd } from '../../../../theme/rd';
import { settingDate } from '../../../../helper';
import TextBold from '../../../components/NotifBold';
import { t } from 'i18next';
import TransText from '../../../components/NotifTransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import { font } from '../../../../theme/font';
import NotificationShell from '../../../components/NotificationShell';

const Qarzmuddatiniuzaytirishsoralganligitogrisida = ({
  item,
  okay,
  onQarzMuddatUzaytirish
}: NotifExtendAskProps) => {
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
      title={t('564') as string}
      date={settingDate(new Date())}
      time={item.time}
      onOk={canDecide ? undefined : () => okay(item.id, item.type)}
      onAccept={canDecide ? () => onQarzMuddatUzaytirish(item, 1) : undefined}
      onReject={canDecide ? () => onQarzMuddatUzaytirish(item, 2) : undefined}
    >
      <TransText
        tKey={567}
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
              style={{ color: rd.color.primary }}
            >
              {item.number}
            </Text>
          ),
          start: <MainText ft={font.medium} size={style.fontSize.xx + 1} />,
          end: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(Qarzmuddatiniuzaytirishsoralganligitogrisida);
