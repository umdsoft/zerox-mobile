import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {memo, useCallback} from 'react';
import {style} from '../../../../theme/style';
import {settingDate} from '../../../../helper';
import {sortText} from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import {t} from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import {useDispatch} from 'react-redux';
import {filter_notification} from '../../../../store/reducers/HomeReducer';
import {storage} from '../../../../store/api/token/getToken';
import {URL} from '../../../constants';

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
        item: {id: item.contract},
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
      <View style={styles.container}>
        <View style={{marginVertical: 15, marginHorizontal: 15}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          />
          <View>
            <TextBold>{t('522') as string}</TextBold>
          </View>
          <View style={{marginTop: 10}}>
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
                    onPress={() => {
                      navigation.navigate('DownloadStatistic', {
                        item,
                        id: item.contract,
                      });
                    }}
                    style={[styles.notification, {color: style.blue}]}>
                    {item.number}
                  </Text>
                ),
                sum: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}
                {item.dtypes === 1 ? item.dcompany : null}
              </Text>{' '}
              Sizdan{' '}
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {settingDate(item.created_at)}
              </Text>{' '}
              yildagi{' '}
              <Text
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {
                    item,
                    id: item.contract,
                  });
                }}
                style={(styles.notification, {color: style.blue})}>
                {item.number}
              </Text>
              -sonli qarz shartnomasiga asosan berilgan{' '}
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
                {sortText(item.amount)} {item.currency}
              </Text>{' '}
              qarzni qaytarishingizni talab qilmoqda.
              {'\n'}
            </Text> */}
            <View style={{flexDirection: 'row', marginTop: 10}}>
              <Text style={styles.notification}>
                <Text>{item?.created} </Text>
              </Text>
              <Text style={styles.notification}> {item.time.slice(0, 5)}</Text>
            </View>
          </View>
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 5,
              }}>
              <TouchableOpacity
                onPress={onNavigateBack}
                activeOpacity={0.8}
                style={styles.button}>
                <Text
                  style={[
                    styles.notification,
                    {color: '#fff', fontSize: style.fontSize.xx - 2},
                  ]}>
                  {t('438') as string}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onOkay}
                activeOpacity={0.8}
                style={styles.button}>
                <Text
                  style={[
                    styles.notification,
                    {
                      color: '#fff',
                      fontSize: style.fontSize.xx - 2,
                      paddingHorizontal: 10,
                    },
                  ]}>
                  Ok
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
  if (item.debitor === item.reciver) {
    return (
      <View style={styles.container}>
        <View style={{marginVertical: 15, marginHorizontal: 15}}>
          <View>
            <TextBold>{t('522') as string}</TextBold>
          </View>
          <View style={{marginTop: 10}}>
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
                    onPress={() => {
                      navigation.navigate('DownloadStatistic', {
                        item,
                        id: item.contract,
                      });
                    }}
                    style={[styles.notification, {color: style.blue}]}>
                    {item.number}
                  </Text>
                ),
                sum: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {item.ctypes === 2 ? ReturnName.returnCreditorName(item) : null}
                {item.ctypes === 1 ? item.ccopmany : null}
              </Text>{' '}
              Sizdan{' '}
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {settingDate(item.created_at)}
              </Text>{' '}
              yildagi{' '}
              <Text
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {
                    item,
                    id: item.contract,
                  });
                }}
                style={(styles.notification, {color: style.blue})}>
                {item.number}
              </Text>
              -sonli qarz shartnomasiga asosan berilgan{' '}
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
                {sortText(item.amount)} {item.currency}
              </Text>{' '}
              qarzni qaytarishingizni talab qilmoqda.
              {'\n'}
            </Text> */}
            <View style={{marginTop: 10, flexDirection: 'row'}}>
              <Text style={styles.notification}>
                <Text>{item?.created} </Text>
              </Text>
              <Text style={styles.notification}> {item.time.slice(0, 5)}</Text>
            </View>
          </View>
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('DebtTakeSelect', {
                    item: {id: item.contract},
                  });
                }}
                activeOpacity={0.8}
                style={styles.button}>
                <Text style={[styles.notification, {color: '#fff'}]}>
                  Qarzni qaytarish
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onOkay}
                activeOpacity={0.8}
                style={styles.button}>
                <Text
                  style={[
                    styles.notification,
                    {color: '#fff', paddingHorizontal: 20},
                  ]}>
                  Ok
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
};

export default memo(Qarzniqaytarishtalabqilinganligitogrisida);

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
  notificationTitle: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
