import { Text } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';
import { settingDate } from '../../../../helper';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import { font } from '../../../../theme/font';
import NotificationShell from '../../../components/NotificationShell';

const Qarzmuddatiniuzaytirishsoralganligitogrisida = ({
  item,
  navigation,
  onQarzMuddatUzaytirish,
}) => {
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
      onAccept={() => onQarzMuddatUzaytirish(item, 1)}
      onReject={() => onQarzMuddatUzaytirish(item, 2)}
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
              style={{ color: style.blue }}
            >
              {item.number}
            </Text>
          ),
          start: <MainText ft={font.medium} size={style.fontSize.xx - 2} />,
          end: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(Qarzmuddatiniuzaytirishsoralganligitogrisida);
