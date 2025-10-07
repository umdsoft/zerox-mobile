import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo} from 'react';
import {style} from '../../../../theme/style';
import TextBold from '../../../components/TextBold';
import {settingDate} from '../../../../helper';
import {sortText} from '../../../components/StatisticCard';
import {useDispatch, useSelector} from 'react-redux';
import ReturnName from '../../../../helper/returnName';
import {t} from 'i18next';
import Toast from 'react-native-toast-message';
import TransText from '../../../components/TransText';
import MainText from '../../../components/MainText';
import {expire_passport_check} from '../../../../helper/timeChecker';
import {checkExpire} from '../../../../store/reducers/HomeReducer';

const QarzShartnomasiniRasmiylashtirishTogrisida = React.memo(
  ({item, okay, navigation, onSuccess, onReject}) => {
    const [loading, setLoading] = React.useState(false);
    const [rejectLoading, setRejectLoading] = React.useState(false);
    const dispatch = useDispatch();
    const {user, usd: usds} = useSelector(state => state.HomeReducer);
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
      console.log(
        JSON.stringify(item, null, 2),
        'creditorga ketadigan notification',
      );
      // firebase ga api orqali creditorga notification getadi
      return (
        <View style={styles.container}>
          <View style={{marginVertical: 15, marginHorizontal: 15}}>
            <View>
              <TextBold>{t('504')}</TextBold>
            </View>
            <View style={{marginTop: 10}}>
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
                      onPress={() => {
                        navigation.navigate('DownloadStatistic', {
                          item,
                          id: item.id,
                        });
                      }}
                      style={[styles.notification, {color: style.blue}]}>
                      {item.number}
                    </Text>
                  ),
                  date: <TextBold />,
                }}
              />
              {/* <Text style={styles.notification}>
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
                {item.dtypes === 2 ? ReturnName.returnCreditorName(item) : null}
                {item.dtypes === 1 ? item.dcompany : null}
              </Text>{' '}
              Sizdan{' '}
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {sortText(item.amount)} {item.currency}
              </Text>{' '}
              miqdorida qarz berishingizni so‘ramoqda. Agar “Tasdiqlash”ni
              tanlasangiz,{' '}
              <Text
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {item, id: item.id});
                }}
                style={(styles.notification, {color: style.blue})}>
                {item.number}
              </Text>
              -sonli qarz shartnomasi rasmiylashtiriladi.
              {'\n'}
            </Text> */}
              <View style={{marginTop: 10, flexDirection: 'row'}}>
                <Text style={styles.notificationTitle}>
                  <Text>{item?.created} </Text>
                </Text>
                <Text style={styles.notificationTitle}>
                  {item?.time.slice(0, 5)}
                </Text>
              </View>
            </View>
            <View style={{marginTop: 10}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 5,
                }}>
                {/* <TouchableOpacity
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {item, id: item.id});
                }}
                activeOpacity={0.8}
                style={styles.button}>
                <Text
                  style={[
                    styles.notification,
                    {
                      color: '#fff',
                      fontSize: style.fontSize.xx - 2,
                    },
                  ]}>
                  {t('471')}
                </Text>
              </TouchableOpacity> */}
                <TouchableOpacity
                  onPress={() => {
                    if (expire_passport_check(user.data.expiry_date)) {
                      dispatch(checkExpire({expire: true}));
                      return;
                    }
                    setLoading(true);
                    onSuccess(item, 1, 'creditor')
                      .then(() => {
                        setLoading(false);
                      })
                      .catch(() => {
                        setLoading(false);
                      });
                  }}
                  activeOpacity={0.8}
                  disabled={loading}
                  style={[
                    styles.button,
                    {
                      backgroundColor: loading
                        ? style.disabledButtonColor
                        : style.blue,
                    },
                  ]}>
                  {!loading ? (
                    <Text
                      style={[
                        styles.notification,
                        {color: '#fff', fontSize: style.fontSize.xx - 2},
                      ]}>
                      {t('93')}
                    </Text>
                  ) : (
                    <ActivityIndicator size={'small'} color={'#fff'} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (expire_passport_check(user.data.expiry_date)) {
                      dispatch(checkExpire({expire: true}));
                      return;
                    }
                    onReject(item, 2, 1);
                  }}
                  activeOpacity={0.8}
                  style={[styles.button, {backgroundColor: 'red'}]}>
                  <Text
                    style={[
                      styles.notification,
                      {color: '#fff', fontSize: style.fontSize.xx - 2},
                    ]}>
                    {t('96')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }
    if (item.creditor === item.reciver) {
      console.log(
        JSON.stringify(item, null, 2),
        'debitorga ketadigan notification',
      );
      // firebase ga api orqali debitorga notification getadi

      return (
        <View style={styles.container}>
          <View style={{marginVertical: 15, marginHorizontal: 15}}>
            <View>
              <TextBold>{t('504')}</TextBold>
            </View>
            <View style={{marginTop: 10}}>
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
                      style={[styles.notification, {color: style.blue}]}>
                      {item.number}
                    </Text>
                  ),
                  date: <TextBold />,
                  summ: <TextBold />,
                }}
              />
              {/* {user.data.cnt == 0 && (
              <TransText
                tKey={'con2'}
                values={{
                  summ: checkingSum(item?.amount),
                }}
                components={{
                  summ: <TextBold />,
                }}
              />
            )} */}

              <View style={{marginTop: 10, flexDirection: 'row'}}>
                <Text style={styles.notification}>
                  <Text>{item?.created} </Text>
                </Text>
                <Text style={styles.notification}>
                  {item?.time.slice(0, 5)}
                </Text>
              </View>
            </View>
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 10,
                }}>
                {/* <TouchableOpacity
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {item, id: item.id});
                }}
                activeOpacity={0.8}
                style={styles.button}>
                <Text
                  style={[
                    styles.notification,
                    {color: '#fff', fontSize: style.fontSize.xx - 3},
                  ]}>
                  {t('471')}
                </Text>
              </TouchableOpacity> */}
                <TouchableOpacity
                  disabled={loading}
                  onPress={() => {
                    if (expire_passport_check(user.data.expiry_date)) {
                      dispatch(checkExpire({expire: true}));
                      return;
                    }
                    setLoading(true);
                    onSuccess(item, 1, 'debitor')
                      .then(() => {
                        setLoading(false);
                      })
                      .catch(() => {
                        setLoading(false);
                      });
                  }}
                  activeOpacity={0.8}
                  style={styles.button}>
                  <Text
                    style={[
                      styles.notification,
                      {color: '#fff', fontSize: style.fontSize.xx - 3},
                    ]}>
                    {t('93')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={rejectLoading}
                  onPress={() => {
                    if (expire_passport_check(user.data.expiry_date)) {
                      dispatch(checkExpire({expire: true}));
                      return;
                    }
                    setRejectLoading(true);
                    onReject(item, 2, 2)
                      .then(() => {
                        setRejectLoading(false);
                      })
                      .catch(() => {
                        setRejectLoading(false);
                      });
                  }}
                  activeOpacity={0.8}
                  style={[styles.button, {backgroundColor: 'red'}]}>
                  <Text
                    style={[
                      styles.notification,
                      {color: '#fff', fontSize: style.fontSize.xx - 3},
                    ]}>
                    {t('96')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }
  },
);

export default memo(QarzShartnomasiniRasmiylashtirishTogrisida);

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
