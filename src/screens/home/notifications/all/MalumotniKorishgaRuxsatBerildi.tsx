import { StyleSheet, Text } from 'react-native';
import React, { memo } from 'react';

import TextBold from '../../../components/TextBold';
import axios from 'axios';
import { URL } from '../../../constants';
import { storage } from '../../../../store/api/token/getToken';

import { useDispatch, useSelector } from 'react-redux';

import { t } from 'i18next';
import ReturnName from '../../../../helper/returnName';
import { filter_notification } from '../../../../store/reducers/HomeReducer';
import NotificationShell, {
  NotifButton,
} from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';

const MalumotniKorishgaRuxsatBerildi = ({ item, navigation, okay }) => {
  const { user } = useSelector(state => state.HomeReducer);
  const dispatch = useDispatch();

  const SeeNotification = async () => {
    const data = await axios.get(URL + `/user/candidate/${item.ctok}`, {
      headers: {
        Authorization: `Bearer ${storage.getString('token')}`,
      },
    });

    const datas = data.data.data;
    navigation.navigate('UserInformationOfDebt', {
      user: datas,
      type: user.data.type,
      ctok: item.ctok,
      dtok: item.dtok,
      item: item,
    });
    RemoveNotification();
  };

  const RemoveNotification = async () => {
    const token = storage.getString('token');
    try {
      dispatch(filter_notification(item.id));
      const info = await axios.put(
        URL + `/notification/ok/${item.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (info?.status === 200) {
        // socketService.emit('notification', user?.data?.id);
        // socketService.on('notification', data => {
        //   console.log('socket in notifcation', data);
        //   dispatch(setNotification({notification: data.not}));
        //   // dispatch(getNotifications({page: 1}));
        // });
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <NotificationShell
      title={t('864') as string}
      date={item?.created}
      time={item?.time}
      actions={
        <>
          <NotifButton label={t('950') as string} onPress={SeeNotification} />
          <NotifButton label="Ok" variant="ghost" onPress={RemoveNotification} />
        </>
      }
    >
      <Text allowFontScaling={false} style={styles.notification}>
        <TextBold>
          {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}
          {item.dtypes === 1 ? item.dcompany : null}
        </TextBold>{' '}
        {t('867') as string}
      </Text>
    </NotificationShell>
  );
};

export default memo(MalumotniKorishgaRuxsatBerildi);

const styles = StyleSheet.create({
  notification: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    lineHeight: rs(20),
  },
});
