import { Text } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';
import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import { useSelector } from 'react-redux';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';

const QarzShartnomasiningQabulQilinganligiTogrisida = ({
  item,
  okay,
  navigation,
}) => {
  const { user, usd: usds } = useSelector(state => state.HomeReducer);

  const onOkay = () => okay(item.id);

  const checkingSum = sum => {
    let usd = usds;
    let cur_amount;
    if (item.currency === 'USD') {
      let dd = item.amount * usd;
      if (dd > 100000000) {
        cur_amount = String(100000).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return cur_amount;
      } else {
        if (dd <= 1000000) {
          cur_amount = String(1000).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return cur_amount;
        } else {
          cur_amount = String(
            Math.floor(item.amount * usd * (0.1 / 100)),
          ).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return cur_amount;
        }
      }
    } else {
      if (item.amount > 100000000) {
        cur_amount = String(100000).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return cur_amount;
      } else {
        if (item.amount <= 1000000) {
          cur_amount = String(1000).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return cur_amount;
        } else {
          cur_amount = String(Math.floor(item.amount * (0.1 / 100)))
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return cur_amount;
        }
      }
    }
  };

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
          id: item.id,
        });
      }}
      style={[
        {
          fontSize: style.fontSize.xx - 2,
          fontFamily: style.fontFamilyMedium,
          color: style.textColor,
        },
        { color: style.blue },
      ]}
    />
  );

  const tKey = isCreditor ? (item.token !== null ? 519 : 520) : 523;

  const values = isCreditor
    ? {
        name:
          item.dtypes === 2
            ? ReturnName.returnDebitorName(item)
            : item.dtypes === 1
            ? item.dcompany
            : null,
        id: item.number,
        sum: sortText(item.amount) + ' ' + item.currency,
        sum1: checkingSum(item?.token) + ' ' + 'UZS',
      }
    : {
        name:
          item.dtypes === 2
            ? ReturnName.returnCreditorName(item)
            : item.dtypes === 1
            ? item.dcompany
            : null,
        name2:
          item.ctypes === 2
            ? ReturnName.returnCreditorName(item)
            : item.ctypes === 1
            ? item.ccopmany
            : null,
        id: item.number,
        sum: sortText(item.amount) + ' ' + item.currency,
        sum1: checkingSum(item?.amount) + ' ' + item.currency,
      };

  const components = isCreditor
    ? {
        name: <TextBold />,
        id: idComp,
        sum: <TextBold />,
        sum1: <TextBold />,
      }
    : {
        name: <TextBold />,
        id: idComp,
        name2: <TextBold />,
        sum: <TextBold />,
        sum1: <TextBold />,
      };

  return (
    <NotificationShell
      title={t('516') as string}
      date={item?.created}
      time={item.time}
      onOk={onOkay}
    >
      <TransText tKey={tKey} values={values} components={components} />
    </NotificationShell>
  );
};

export default memo(QarzShartnomasiningQabulQilinganligiTogrisida);
