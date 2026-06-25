import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React, { memo, useCallback } from 'react';
import { style } from '../../../../theme/style';
import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import { useDispatch } from 'react-redux';
import { filter_notification } from '../../../../store/reducers/HomeReducer';
import { storage } from '../../../../store/api/token/getToken';
import { URL } from '../../../constants';
import NotificationShell from '../../../components/NotificationShell';

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
      const info = await fetch(URL + `/notification/ok/${item.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
            <TouchableOpacity
              onPress={onNavigateBack}
              activeOpacity={0.8}
              style={styles.button}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.notification,
                  { color: '#fff', fontSize: style.fontSize.xx - 2 },
                ]}
              >
                {t('438') as string}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onOkay}
              activeOpacity={0.8}
              style={styles.button}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.notification,
                  {
                    color: '#fff',
                    fontSize: style.fontSize.xx - 2,
                    paddingHorizontal: 10,
                  },
                ]}
              >
                Ok
              </Text>
            </TouchableOpacity>
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
                style={[styles.notification, { color: style.blue }]}
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
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('DebtTakeSelect', {
                  item: { id: item.contract },
                });
              }}
              activeOpacity={0.8}
              style={styles.button}
            >
              <Text
                allowFontScaling={false}
                style={[styles.notification, { color: '#fff' }]}
              >
                Qarzni qaytarish
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onOkay}
              activeOpacity={0.8}
              style={styles.button}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.notification,
                  { color: '#fff', paddingHorizontal: 20 },
                ]}
              >
                Ok
              </Text>
            </TouchableOpacity>
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
                style={[styles.notification, { color: style.blue }]}
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
  button: {
    backgroundColor: style.blue,
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notification: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
