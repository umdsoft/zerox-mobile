import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo, useCallback, useState } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/TextBold';
import axios from 'axios';
import { URL } from '../../../constants';
import { storage } from '../../../../store/api/token/getToken';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

import { useDispatch, useSelector } from 'react-redux';
import { filter_notification } from '../../../../store/reducers/HomeReducer';

import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';

const QarzShartnomasiRuxsatSorash = ({ item, navigation, okay }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const { user } = useSelector(state => state.HomeReducer);

  const resoleShow = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const body = {
        status: 1,
        debitor: user.data.id,
        creditor: item.creditor,
        reciver: user.data.id === item.debitor ? item.creditor : item.debitor,
      };
      const { data, status } = await axios.post(
        URL + `/notification/eby/${item.id}`,
        body,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (status === 200) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: { title: 'Muvaffaqiyatli', desc: t('249') },
          type: 'omad',
          visibilityTime: 3000,
        });
        console.log('item', item);
        dispatch(filter_notification(item?.id));
        // socketService.sendNotification({
        //   id: user.data.id === item.debitor ? item.creditor : item.debitor,
        // });
        // socketService.on('notification', data => {
        //   dispatch(setNotification({notification: data.not}));
        // });
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  }, [dispatch, item, user.data.id]);
  //237
  const rejectShow = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setRejectLoading(true);
      const body = {
        status: 2,
        debitor: user.data.id,
        creditor: item.creditor,
        reciver: user.data.id === item.debitor ? item.creditor : item.debitor,
      };
      const { data, status } = await axios.post(
        URL + `/notification/eby/${item.id}`,
        body,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (status === 200) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: { title: 'Muvaffaqiyatli', desc: t('261') },
          type: 'omad',
          visibilityTime: 3000,
        });
        dispatch(filter_notification(item?.id));
        // socketService.sendNotification({
        //   id: user.data.id === item.debitor ? item.creditor : item.debitor,
        // });
        // socketService.on('notification', data => {
        //   dispatch(setNotification({notification: data.not}));
        // });
        setRejectLoading(false);
      }
    } catch (error) {
      setRejectLoading(false);
      console.error(error);
    }
  }, [dispatch, item.creditor, item.debitor, item.id, user.data.id]);
  return (
    <View style={styles.container}>
      <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
        <View>
          <TextBold>{t('861') as string}</TextBold>
        </View>
        <View style={{ marginTop: 10 }}>
          <TransText
            tKey={237}
            values={{
              name:
                item.dtypes === 2
                  ? ReturnName.returnDebitorName(item)
                  : item.dtypes === 1
                  ? item.dcompany
                  : null,
            }}
            components={{ name: <TextBold /> }}
          />
          {/* <Text style={styles.notification}>
            <TextBold>
              {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}{' '}
              {item.dtypes === 1 ? item.dcompany : null}
            </TextBold>{' '}
            qarz shartnomalaringiz bo‘yicha ma‘lumotni ko‘rishga ruxsat
            so‘ramoqda.
          </Text>
          */}
          <View style={{ marginTop: 10, flexDirection: 'row' }}>
            <Text allowFontScaling={false} style={styles.notificationTitle}>
              <Text allowFontScaling={false}>{item?.created} </Text>
            </Text>
            <Text allowFontScaling={false} style={styles.notificationTitle}>
              {' '}
              {item.time?.slice(0, 5)}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              disabled={loading}
              onPress={resoleShow}
              activeOpacity={0.8}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator size={'small'} color={'#fff'} />
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.notification,
                    { color: '#fff', fontSize: style.fontSize.xx - 2 },
                  ]}
                >
                  {t('240') as string}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={rejectLoading}
              onPress={rejectShow}
              activeOpacity={0.8}
              style={[styles.button, { backgroundColor: 'red' }]}
            >
              {rejectLoading ? (
                <ActivityIndicator size={'small'} color={'#fff'} />
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.notification,
                    { color: '#fff', fontSize: style.fontSize.xx - 2 },
                  ]}
                >
                  {t('96') as string}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default memo(QarzShartnomasiRuxsatSorash);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    width: '95%',
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    borderRadius: 10,
    elevation: 7,
  },
  button: {
    backgroundColor: style.blue,
    paddingLeft: 20,
    paddingRight: 20,
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
  notificationTitle: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
