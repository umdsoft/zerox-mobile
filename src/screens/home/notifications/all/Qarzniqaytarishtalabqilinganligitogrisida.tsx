import { StyleSheet, Text } from 'react-native';
import React, { memo, useCallback } from 'react';
import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { filter_notification } from '../../../../store/reducers/HomeReducer';
import { storage } from '../../../../store/api/token/getToken';
import { URL } from '../../../constants';
import NotificationShell, {
  NotifButton,
} from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';

const Qarzniqaytarishtalabqilinganligitogrisida = ({
  item,
  okay,
  navigation,
}) => {
  const onOkay = async () => {
    okay(item.id);
  };

  const onNavigateBack = useCallback(async () => {
    const token = storage.getString('token');
    try {
      dispatch(filter_notification(item.id));
      // axios (fetch emas) — token eskirsa authInterceptor avto-refresh qiladi.
      const info = await axios.put(
        URL + `/notification/ok/${item.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      navigation.navigate('DebtTakeSelect', {
        item: { id: item.contract },
      });
      if (info?.status === 200) {
        // socketService.emit('notification', {userId: user?.data?.id});
        // socketService.on('notification', data => {
        //   console.log('socket in notifcation', data);
        //   dispatch(setNotification({notification: data.not}));
        //   // dispatch(getNotifications({page: 1}));
        // });
      }
    } catch (error) {
      console.log('Error in notification ok:', error);
    }
  }, []);

  const dispatch = useDispatch();

  if (item.creditor === item.reciver) {
    console.log('item', item);
    return (
      <NotificationShell
        title={t('522') as string}
        date={item?.created}
        time={item.time}
        actions={
          <>
            <NotifButton label={t('438') as string} onPress={onNavigateBack} />
            <NotifButton label="Ok" variant="ghost" onPress={onOkay} />
          </>
        }
      >
        <TransText
          tKey={525}
          values={{
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            start: item.created_at,
            id: item.number,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          }}
          components={{
            name: <TextBold />,
            start: <TextBold />,
            id: (
              <Text
                allowFontScaling={false}
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {
                    item,
                    id: item.contract,
                  });
                }}
                style={[styles.notification, { color: rd.color.primary }]}
              >
                {item.number}
              </Text>
            ),
            sum: <TextBold />,
          }}
        />
      </NotificationShell>
    );
  }
  if (item.debitor === item.reciver) {
    return (
      <NotificationShell
        title={t('522') as string}
        date={item?.created}
        time={item.time}
        actions={
          <>
            <NotifButton
              label="Qarzni qaytarish"
              onPress={() => {
                navigation.navigate('DebtTakeSelect', {
                  item: { id: item.contract },
                });
              }}
            />
            <NotifButton label="Ok" variant="ghost" onPress={onOkay} />
          </>
        }
      >
        <TransText
          tKey={525}
          values={{
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            start: item.created_at,
            id: item.number,
            sum: sortText(item.amount) + ' ' + item.currency,
          }}
          components={{
            name: <TextBold />,
            start: <TextBold />,
            id: (
              <Text
                allowFontScaling={false}
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {
                    item,
                    id: item.contract,
                  });
                }}
                style={[styles.notification, { color: rd.color.primary }]}
              >
                {item.number}
              </Text>
            ),
            sum: <TextBold />,
          }}
        />
      </NotificationShell>
    );
  }
};

export default memo(Qarzniqaytarishtalabqilinganligitogrisida);

const styles = StyleSheet.create({
  notification: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    lineHeight: rs(20),
  },
});
