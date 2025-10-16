import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/TextBold';
import axios from 'axios';
import { URL } from '../../../constants';
import { storage } from '../../../../store/api/token/getToken';

import { useDispatch, useSelector } from 'react-redux';

import { t } from 'i18next';
import ReturnName from '../../../../helper/returnName';
import { filter_notification } from '../../../../store/reducers/HomeReducer';

const MalumotniKorishgaRuxsatBerildi = ({ item, navigation, okay }) => {
  const { user } = useSelector(state => state.HomeReducer);
  const dispatch = useDispatch();

  const SeeNotification = async () => {
    const data = await axios.get(URL + `/user/candidate/${item.ctok}`, {
      headers: {
        Authorization: `Bearer ${storage.getString('token')}`,
        Connection: 'close',
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
        { headers: { Authorization: `Bearer ${token}`, Connection: 'close' } },
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
    <View style={styles.container}>
      <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
        <View>
          <TextBold>{t('864') as string}</TextBold>
        </View>
        <View style={{ marginTop: 10 }}>
          <Text allowFontScaling={false} style={styles.notification}>
            <TextBold>
              {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}
              {item.dtypes === 1 ? item.dcompany : null}
            </TextBold>{' '}
            {t('867') as string}
          </Text>
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
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={SeeNotification}
              activeOpacity={0.8}
              style={[
                styles.button,
                { backgroundColor: '#4e91d2', marginRight: 10 },
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.notification,
                  { color: '#fff', fontSize: style.fontSize.xx - 2 },
                ]}
              >
                {t('950')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={RemoveNotification}
              activeOpacity={0.8}
              style={[styles.button, { backgroundColor: '#4e91d2' }]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.notification,
                  { color: '#fff', fontSize: style.fontSize.xx - 2 },
                ]}
              >
                Ok
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default memo(MalumotniKorishgaRuxsatBerildi);

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
