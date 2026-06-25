import { Text } from 'react-native';
import React, { memo } from 'react';
import { style } from '../../../../theme/style';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import NotificationShell from '../../../components/NotificationShell';

//// bu bumadi hali

const QarzniQaytarishRadQilinganligi = ({ item, okay, navigation }) => {
  const isCreditor = item.creditor === item.reciver;
  const isDebitor = item.debitor === item.reciver;
  if (!isCreditor && !isDebitor) {
    return null;
  }

  const idComp = (
    <Text
      allowFontScaling={false}
      onPress={() => {
        navigation.navigate('DownloadStatistic', {
          item,
          id: item.contract,
        });
      }}
      style={[styles_notification, { color: style.blue }]}
    >
      {item.number}
    </Text>
  );

  return (
    <NotificationShell
      title={t('549') as string}
      date={item?.created}
      time={item.time}
      onOk={() => {
        okay(item.id);
      }}
    >
      <TransText
        tKey={isCreditor ? 'rejectdebt1' : 'rejectdebt'}
        values={{
          start: item.created_at,
          id: item.number,
          sum:
            item.refundable_amount
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
            ' ' +
            item.currency,
          end: item.created,
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
        }}
        components={{
          name: <TextBold />,
          start: isCreditor ? (
            <TextBold />
          ) : (
            <MainText size={style.fontSize.xx - 2} />
          ),
          id: idComp,
          sum: <TextBold />,
          end: <TextBold />,
        }}
      />
    </NotificationShell>
  );
};

export default memo(QarzniQaytarishRadQilinganligi);

const styles_notification = {
  fontSize: style.fontSize.xx - 2,
  fontFamily: style.fontFamilyMedium,
  color: style.textColor,
};
