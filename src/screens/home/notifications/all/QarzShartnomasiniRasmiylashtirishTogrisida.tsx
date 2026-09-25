import { StyleSheet, Text } from 'react-native';
import React, { memo } from 'react';
import { style } from '../../../../theme/style';
import TextBold from '../../../components/NotifBold';
import { settingDate } from '../../../../helper';
import { sortText } from '../../../components/StatisticCard';
import { useDispatch, useSelector } from 'react-redux';
import ReturnName from '../../../../helper/returnName';
import { t } from 'i18next';
import Toast from 'react-native-toast-message';
import TransText from '../../../components/NotifTransText';
import MainText from '../../../components/MainText';
import { expire_passport_check } from '../../../../helper/timeChecker';
import { checkExpire } from '../../../../store/reducers/HomeReducer';
import NotificationShell from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';

const QarzShartnomasiniRasmiylashtirishTogrisida = React.memo(
  ({ item, okay, navigation, onSuccess, onReject }) => {
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.HomeReducer.user); // SS-PERF (2026-09-25): aniq selektor
    const usds = useSelector((state: any) => state.HomeReducer.usd);
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
          cur_amount = String(100000)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

    if (item.debitor === item.reciver) {
      // firebase ga api orqali creditorga notification getadi
      return (
        <NotificationShell
          title={t('474') as string}
          date={item?.created}
          time={item.time}
          onAccept={() => {
            if (expire_passport_check(user.data.expiry_date)) {
              dispatch(checkExpire({ expire: true }));
              return;
            }
            return onSuccess(item, 1, 'creditor');
          }}
          onReject={() => {
            if (expire_passport_check(user.data.expiry_date)) {
              dispatch(checkExpire({ expire: true }));
              return;
            }
            return onReject(item, 2, 1);
          }}
        >
          <TransText
            tKey={'contract2'}
            values={{
              name:
                item.dtypes === 2
                  ? ReturnName.returnCreditorName(item)
                  : item.dtypes === 1
                    ? item.dcompany
                    : null,
              sum: sortText(item.amount) + ' ' + item.currency,
              id: item.number,
              date: item.created,
            }}
            components={{
              name: <TextBold />,
              sum: <TextBold />,
              id: (
                <Text
                  allowFontScaling={false}
                  onPress={() => {
                    navigation.navigate('DownloadStatistic', {
                      item,
                      id: item.id,
                    });
                  }}
                  style={[styles.notification, { color: rd.color.primary }]}
                >
                  {item.number}
                </Text>
              ),
              date: <TextBold />,
            }}
          />
        </NotificationShell>
      );
    }
    if (item.creditor === item.reciver) {
      // firebase ga api orqali debitorga notification getadi

      return (
        <NotificationShell
          title={t('504') as string}
          date={item?.created}
          time={item.time}
          onAccept={() => {
            if (expire_passport_check(user.data.expiry_date)) {
              dispatch(checkExpire({ expire: true }));
              return;
            }
            return onSuccess(item, 1, 'debitor');
          }}
          onReject={() => {
            if (expire_passport_check(user.data.expiry_date)) {
              dispatch(checkExpire({ expire: true }));
              return;
            }
            return onReject(item, 2, 2);
          }}
        >
          <TransText
            tKey={user.data.cnt === 0 ? 'contract10' : 'contract1'}
            values={{
              name:
                item.ctypes === 2
                  ? ReturnName.returnDebitorName(item)
                  : item.ctypes === 1
                    ? item.ccompany
                    : null,
              sum: sortText(item.amount) + ' ' + item.currency,
              id: item.number,
              date: item.created,
              summ: checkingSum(item?.amount),
            }}
            components={{
              name: <TextBold />,
              sum: <TextBold />,
              id: (
                <Text
                  onPress={() => {
                    navigation.navigate('DownloadStatistic', {
                      item,
                      id: item.id,
                    });
                  }}
                  style={[styles.notification, { color: rd.color.primary }]}
                  allowFontScaling={false}
                >
                  {item.number}
                </Text>
              ),
              date: <TextBold />,
              summ: <TextBold />,
            }}
          />
        </NotificationShell>
      );
    }
  },
);

export default memo(QarzShartnomasiniRasmiylashtirishTogrisida);

const styles = StyleSheet.create({
  notification: {
    fontSize: style.fontSize.xx + 1,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
