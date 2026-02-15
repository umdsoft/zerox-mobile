import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { BackGroundIcon } from '../../helper/homeIcon';
import { style } from '../../theme/style';

import { useNavigation, useRoute } from '@react-navigation/native';
import Loading from '../components/Loading';

import { Toast } from 'react-native-toast-message/lib/src/Toast';

import DatePicker from 'react-native-date-picker';
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import TextBold from '../components/TextBold';
import OtherHeader from '../components/OtherHeader';
import { settingDate } from '../../helper';

import { useDispatch, useSelector } from 'react-redux';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import MainText from '../components/MainText';
import { font } from '../../theme/font';

import DateModal from '../home/modal/DateModal';

const DebtDateLengthAsk = () => {
  const { item } = useRoute().params;
  const theme = useColorScheme();
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.HomeReducer);
  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const getData = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data, status } = await axios.get(
        URL + `/contract/by/${item?.id}`,
        {
          headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
        },
      );
      if (
        status === 200 &&
        data.success === false &&
        data.msg === 'contract-not-found'
      ) {
        Toast.show({
          autoHide: true,
          props: {
            title: 'Xatolik',
            desc: t('Shartnoma allaqachon tugallangan'),
          },
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
        });
        navigation.navigate('BottomTabNavigator');
        setTimeout(() => {
          setLoading(false);
        }, 500);
        return;
      }
      if (status === 200 && data.success === false && data.msg === 'status') {
        Toast.show({
          autoHide: true,
          props: {
            title: 'Xatolik',
            desc: t('Shartnoma allaqachon tugallangan'),
          },
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
        });
        navigation.navigate('BottomTabNavigator');
        setTimeout(() => {
          setLoading(false);
        }, 500);
        return;
      }
      if (status === 200) {
        setInfo(data.data);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  }, [item?.id]);

  const onPress = async () => {
    const token = storage.getString('token');

    try {
      setLoading1(true);
      const { data, status } = await axios.post(
        URL + '/contract/act',
        {
          contract: info.id,
          creditor: info.creditor,
          debitor: info.debitor,
          end_date: formatDate(plus_day(date)),
          inc: info.inc,
          ntype: 3,
          reciver: info.debitor,
          old_amount: Number(info.residual_amount),
          refundable_amount: info.refundable_amount,
          residual_amount: info.residual_amount,
          status: 0,
          type: 3,
          sender: info.creditor,
          res: info.debitor,
        },
        {
          headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
        },
      );

      if (status === 201) {
        Toast.show({
          autoHide: true,
          props: {
            title: 'Muvaffaqiyatli',
            desc: t('468'),
          },
          visibilityTime: 3000,
          position: 'bottom',
          type: 'omad',
        });
        // socketService.sendNotification({
        //   id: info.debitor,
        // });
        // socketService.emit('notification', user?.data?.id);
        // socketService.on('notification', data => {
        //   dispatch(setNotification({notification: data.not}));
        // });
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'BottomTabNavigator' as never }],
          });
          setLoading1(false);
        }, 2000);
        return;
      }
      if (data.msg === 'ex') {
        Toast.show({
          autoHide: true,
          props: {
            title: 'Muvaffaqiyatli',
            desc: t(
              'Siz ushbu qarz shartnomasi bo‘yicha so‘rov yuborgansiz. Iltimos, so‘rov natijasini kuting!',
            ),
          },
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
        });
        setLoading1(false);
        return;
      }
    } catch (err) {
      console.log(err, 'err');
      setLoading1(false);
      Toast.show({
        autoHide: true,
        props: { title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi') },
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
      });
    }
  };

  useEffect(() => {
    getData();
  }, [getData]);
  // console.log('redddd');

  console.log(info, 'info.created_at');
  console.log(date, 'date');
  // console.log(plus_day(date), 'plus_day(info?.end_date)');
  // console.log(formatDate(plus_day(date)), 'checkingDate(date)');

  return (
    <View style={styles.container}>
      <View
        style={{
          position: 'absolute',
          height: style.height / 3,
          width: '100%',
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('462')} />
      <View style={[styles.main]}>
        <View style={styles.aboutUsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Loading />
            </View>
          ) : (
            <View
              style={{ width: '90%', alignSelf: 'center', marginVertical: 20 }}
            >
              <View>
                <View style={[styles.card]}>
                  <View style={styles.insideMoney}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.hisob, { fontSize: style.fontSize.xx }]}
                    >
                      <Trans
                        t={t}
                        i18nKey="465"
                        values={{
                          start: settingDate(info.created_at),
                          id: info?.number,
                          end: settingDate(info?.end_date),
                        }}
                        components={{
                          start: (
                            <MainText size={style.fontSize.xx} ft={font.bold} />
                          ),
                          id: (
                            <Text
                              allowFontScaling={false}
                              onPress={() => {
                                navigation.navigate('DownloadStatistic', {
                                  item: info,
                                  id: info.id,
                                });
                              }}
                              style={{
                                color: style.blue,
                              }}
                            />
                          ),
                          end: (
                            <TextBold
                              styles={{ fontSize: style.fontSize.xx }}
                            />
                          ),
                        }}
                      />
                    </Text>
                  </View>
                </View>
              </View>
              <View>
                <View style={styles.TextInputLabelContainer}>
                  <View style={styles.inputTitle}>
                    {/* <Text style={styles.phoneText}>
                      Yangi muddatni kiriting
                    </Text> */}
                  </View>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      onPress={() => setOpen(!open)}
                      style={styles.TextInput}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.dateText,
                          {
                            color:
                              settingDate(date) === settingDate(Date.now())
                                ? '#a9a9a9'
                                : '#000',
                          },
                        ]}
                      >
                        {settingDate(date) === settingDate(Date.now())
                          ? t('369')
                          : settingDate(date)}
                        {/* {date !== new Date()
                          ? settingDate(date)
                          : settingDate(info?.end_date)} */}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View>
                <TouchableOpacity
                  disabled={checkingDate(date) || loading1}
                  onPress={onPress}
                  activeOpacity={0.8}
                  style={[
                    styles.registerButton,
                    {
                      marginTop: 20,
                      backgroundColor: checkingDate(date)
                        ? style.disabledButtonColor
                        : style.blue,
                    },
                  ]}
                >
                  {loading1 ? (
                    <ActivityIndicator size={'small'} />
                  ) : (
                    <Text allowFontScaling={false} style={[styles.textButton]}>
                      {t('357')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {open && (
        <DatePicker
          open={open}
          date={date}
          style={{
            backgroundColor: '#fff',
            alignSelf: 'center',
          }}
          mode="date"
          confirmText={t('OK')}
          cancelText={t('804')}
          theme="light"
          modal={true}
          // add one day to info.end_date
          // i have to check to here leta is bigger than today i need to get that otherwise i will take today
          minimumDate={new Date(minimumDate(info?.end_date))}
          maximumDate={
            new Date(
              new Date(plus_day(item?.end_date)).setFullYear(
                new Date(plus_day(item?.end_date)).getFullYear() + 2,
              ),
            )
          }
          onCancel={() => {
            setOpen(false);
          }}
          title={t('801')}
          onConfirm={date => {
            setDate(date);
            setOpen(false);
          }}
        />
      )}

      {/* {Platform.OS === 'android' && open && (
        <DatePicker
          value={date}
          display="calendar"
          style={{
            backgroundColor: theme === 'dark' ? '#000' : '#fff',
            alignSelf: 'center',
            borderRadius: 20,
          }}
          mode="date"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setDate(date!);
            setOpen(false);
          }}
          minimumDate={new Date(minimumDate(info?.end_date))}
        />
      )} */}

      {/* {Platform.OS === 'ios' && (
        <DateModal
          open={open}
          setOpen={setOpen}
          title={t('801')}
          date={date}
          setDate={setDate}
          min={new Date(minimumDate(info?.end_date))}
          // max={maxDate}
        />
      )} */}

      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default DebtDateLengthAsk;

const minimumDate = date => {
  let today = new Date(date);
  if (today < new Date()) {
    today = new Date();
  }
  return today.getTime() + 86400000;
};

const plus_day = date => {
  // i have to check to here leta is bigger than today i need to get that otherwise i will take today
  let today = new Date(date);
  if (today < new Date()) {
    today = new Date();
  }
  return today;
};
export function formatDate(date) {
  const today = new Date(date);
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  const formattedToday = yyyy + '-' + mm + '-' + dd;
  console.log(formattedToday, 'formattedToday');
  return formattedToday;
}
export function checkingDate(date) {
  let now = new Date();
  let then = new Date(date);
  if (now.getTime() <= then.getTime()) {
    return false;
  } else {
    return true;
  }
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  mainText: {
    fontFamily: style.fontFamilyBold,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  buttontime: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '100%',
    flexDirection: 'row',
    marginTop: 30,
    alignSelf: 'center',
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  hisob: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    textAlign: 'center',
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },
  registerButton: {
    width: '100%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insideMoney: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    width: '100%',
    elevation: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  item: {
    flex: 1,
  },
  info: {
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    textAlign: 'left',
  },
  header: {
    backgroundColor: '#fff',
    height: style.height / 15,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});
