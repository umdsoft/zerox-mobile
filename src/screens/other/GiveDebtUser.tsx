import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackGroundIcon } from '../../helper/homeIcon';
import { style } from '../../theme/style';

import { useNavigation, useRoute } from '@react-navigation/native';
import RadioIconFill from '.././../images/radioButtonFill';
import MeetInfoGiveDebtModal from '../../modal/MeetInfoGiveDebtModal';

import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Loading from '../components/Loading';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../../screens/constants';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
import CheckBox from '@react-native-community/checkbox';
import DatePicker from 'react-native-date-picker';
// import DatePicker, {
//   DateTimePickerEvent,
// } from '@react-native-community/datetimepicker';
import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';
import Famale from '../../images/Famale';
import RadioButtonIcon from '../../images/radioButton';
import OtherHeader from '../components/OtherHeader';
import { Provider } from 'react-native-paper';
import { settingDate } from '../../helper';
import MainText from '../components/MainText';
import { font, fontSize } from '../../theme/font';
import { colors } from '../../theme/colors';

import { t } from 'i18next';
import { Trans } from 'react-i18next';
import TransText from '../components/TransText';

import { getMe } from '../../store/api/home';
import DateModal from '../home/modal/DateModal';

const GiveDebtUser = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useColorScheme();
  const { qarzoluvchi, type } = useRoute().params;
  const { user } = useSelector(state => state.HomeReducer);
  const [checked, setChecked] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(true);
  const [amount, setAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [usdd, setUsdd] = useState('');
  //type 0 bulsa qarz olmoq
  //type 1 bulsa qarz bermoq
  console.log(qarzoluvchi, type, 'setData');
  useEffect(() => {
    if (amount.replace(/\s/g, '').length > 0 && checked) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [amount, checked, date]);

  const getUsd = useCallback(async () => {
    try {
      const { data } = await axios.get(
        'https://cbu.uz/oz/arkhiv-kursov-valyut/json/',
        {
          headers: {
            Connection: 'close',
          },
        },
      );

      if (data) {
        setUsdd(data[0].Rate);
      }
      // eslint-disable-next-line no-catch-shadow
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    const lang = storage.getString('lang');
    console.log(
      `https://pdf.zerox.uz/free_contract.php?debitor=${
        type === 0 ? qarzoluvchi?.uid : user?.data?.uid
      }&creditor=${
        type !== 1 ? user?.data?.uid : qarzoluvchi?.uid
      }&download=0&amount=${Number(amount.replace(/\s/g, ''))}&currency=${
        active ? 'UZS' : 'USD'
      }&day=${formatDateMinus(date)}&lang=${lang}`,
    );
    getUsd();
  }, []);

  // const toggleModal = useCallback(() => {
  //   navigation.navigate('Contract', {
  //     url: `https://pdf.zerox.uz/free_contract.php?debitor=${type === 0 ? qarzoluvchi?.uid : user?.data?.uid}&creditor=${type !== 1 ? user?.data?.uid : qarzoluvchi?.uid}&download=0&amount=${Number(amount.replace(/\s/g, ''))}&currency=UZS&day=${formatDateMinus(date)}`,
  //     title: t('300'),
  //   });
  // }, [navigation]);
  const toggleModal = () => {
    const lang = storage.getString('lang');
    navigation.navigate('Contract', {
      url: `https://pdf.zerox.uz/free_contract.php?debitor=${
        type === 0 ? qarzoluvchi?.uid : user?.data?.uid
      }&creditor=${
        type !== 1 ? user?.data?.uid : qarzoluvchi?.uid
      }&download=0&amount=${Number(amount.replace(/\s/g, ''))}&currency=${
        active ? 'UZS' : 'USD'
      }&day=${formatDateMinus(date)}&lang=${lang}`,
      title: t('306'),
    });
  };

  // console.log(user);
  const fetchData = async () => {
    let a;
    if (active) {
      if (Number(amount.replace(/\s/g, '')) >= 100000000) {
        a = 100000;
      } else {
        if (Number(amount.replace(/\s/g, '')) <= 1000000) {
          a = 1000;
        } else {
          a = Number(Number(amount.replace(/\s/g, '')) * 0.001).toFixed(0);
        }
      }
    } else {
      a = Number(Number(amount.replace(/\s/g, '')) * usdd * 0.001).toFixed(0);
    }

    try {
      if (
        active
          ? Number(amount.replace(/\s/g, '')) < 10000
          : Number(amount.replace(/\s/g, '')) < 1
      ) {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            // title: 'Xatolik',
            desc: active ? t('minsum') : t('minusd'),
          },
        });
        return;
      }

      if (type === 0) {
        //qarz olish
        if (user.data.cnt === 0) {
          if (a >= user.data.balance) {
            Toast.show({
              autoHide: true,
              visibilityTime: 3000,
              position: 'bottom',
              type: 'error2',
              props: {
                title: 'Xatolik',
                desc: t('294'),
              },
            });
            return;
          }
        }

        //tekshirib gurish garak yenam sender ikki api properties qushildi
        setLoading(true);
        const { data } = await axios.post(
          URL + '/contract/create',
          {
            amount: Number(amount.replace(/\s/g, '')),
            creditor: user?.data?.id,
            debitor: qarzoluvchi?.id,
            currency: active ? 'UZS' : 'USD',
            end_date: formatDateMinus(date),
            reciver: qarzoluvchi?.id,
            con: 1,
            type: user.data.type === 1 && qarzoluvchi.id === 1 ? 1 : 0,
            sender: Number(user.data.id),
            res: Number(qarzoluvchi.id),
          },
          {
            headers: {
              Authorization: 'Bearer ' + storage.getString('token'),
              Connection: 'close',
            },
          },
        );

        if (data.success) {
          setLoading(false);
          Toast.show({
            autoHide: true,
            visibilityTime: 2000,
            position: 'bottom',
            type: 'omad',
            props: { title: 'Muvaffaqiyatli', desc: t('285') },
          });
          // socketService.sendNotification({id: qarzoluvchi.id});
          // socketService.emit('notification', user?.data?.id);
          // socketService.on('notification', data => {
          //   dispatch(setNotification({notification: data.not}));
          // });
          dispatch(getMe());
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'BottomTabNavigator' }],
            });
          }, 2000);
        } else {
          setError(true);
          setLoading(false);
          Alert.alert('Error', JSON.stringify(data));
        }
      }
      if (type === 1) {
        //qarz berish
        setLoading(true);
        const { data } = await axios.post(
          URL + '/contract/create',
          {
            amount: Number(amount.replace(/\s/g, '')),
            creditor: qarzoluvchi?.id,
            debitor: user?.data?.id,
            currency: active ? 'UZS' : 'USD',
            end_date: formatDateMinus(date),
            reciver: qarzoluvchi?.id,
            type: user.data.type === 1 && qarzoluvchi.id === 1 ? 1 : 0,
            sender: user?.data.id,
            res: qarzoluvchi?.id,
            // con: 1,
          },
          {
            headers: {
              Authorization: 'Bearer ' + storage.getString('token'),
              Connection: 'close',
            },
          },
        );

        console.log(data, 'data');

        if (data.msg === 'deb_expiry_date' && data.success === false) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            visibilityTime: 2000,
            type: 'error2',
            props: {
              title: 'Xatolik',
              desc: t('expire_passport'),
            },
          });
          return;
        }

        if (data.success) {
          setLoading(false);
          // socketService.sendNotification({id: qarzoluvchi.id});
          // socketService.emit('notification', user?.data?.id);
          // socketService.on('notification', data => {
          //   dispatch(setNotification({notification: data.not}));
          // });
          dispatch(getMe());
          Toast.show({
            autoHide: true,
            visibilityTime: 3000,
            position: 'bottom',
            type: 'omad',
            props: { title: 'Muvaffaqiyatli', desc: t('285') },
          });
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'BottomTabNavigator' }],
            });
          }, 2000);
        } else {
          setError(true);
          setLoading(false);
        }
      }
    } catch (error) {
      setError(true);
      setLoading(false);
    }
  };
  const onValue = text => {
    const arr = [];
    text
      .toString()
      .split('')
      .forEach((item, i) => {
        if (item !== ' ') {
          arr.push(item);
        }
      });
    return arr.join('').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  const pay = useCallback(
    sum => {
      let a = Number(sum.replace(/\s/g, ''));
      if (active) {
        if (a >= 100000000) {
          return 100000;
        } else {
          if (a <= 1000000) {
            return 1000;
          } else {
            return Number(a * 0.001).toFixed(0);
          }
        }
      } else {
        if (a * usdd <= 1000000) {
          return Number(1000);
        } else {
          if (a * usdd >= 100000000) {
            return Number(100000);
          } else {
            return Number(a * usdd * 0.001).toFixed(0);
          }
        }
      }
    },
    [active, usdd],
  );
  const renderRadioButtons = useMemo(() => {
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginTop: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setActive(true);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {active ? (
            <RadioIconFill width={20} height={20} color={style.blue} />
          ) : (
            <RadioButtonIcon width={20} height={20} color={style.blue} />
          )}
          <MainText mrLeft={5} size={fontSize[12]}>
            {t('uzs')}
          </MainText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setActive(false);
          }}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {active ? (
            <RadioButtonIcon width={20} height={20} color={style.blue} />
          ) : (
            <RadioIconFill width={20} height={20} color={style.blue} />
          )}

          <MainText mrLeft={5} size={fontSize[12]}>
            {t('usd')}
          </MainText>
        </TouchableOpacity>
      </View>
    );
  }, [active]);
  const renderInput = useMemo(() => {
    return (
      <View style={{ flex: 1 }}>
        <TextInput
          value={onValue(amount)}
          placeholder={active ? 'UZS' : 'USD'}
          placeholderTextColor={style.placeHolderColor}
          keyboardType="numeric"
          onChangeText={text => {
            let a = Number(text.replace(/[^0-9]/g, ''));
            console.log(a, 'asdsad');
            if (a > 0) {
              setAmount(a.toString());
            } else {
              setAmount('');
            }
          }}
          style={styles.TextInput}
        />
      </View>
    );
  }, [active, amount]);
  const renderSum = useMemo(() => {
    return (
      <View
        style={{
          alignItems: 'center',
          marginVertical: 10,
          width: '80%',
          alignSelf: 'center',
        }}
      >
        <TransText
          textAlign="center"
          tKey={291}
          values={{
            amount: onValue(pay(amount)),
          }}
          components={{
            amount: (
              <MainText size={style.fontSize.xx - 2} color={colors.red} />
            ),
          }}
        />
        {/* <MainText textAlign={'center'} size={fontSize[13]}>
          Xizmat haqi sifatida hisobingizdan{' '}
          <MainText size={fontSize[13]} color={colors.red}>
            {onValue(pay(amount))}
          </MainText>{' '}
          so’m yechiladi.
        </MainText> */}
      </View>
    );
  }, [pay, amount]);

  if (loading) {
    return <Loading />;
  }
  return (
    <View style={styles.container}>
      <Provider>
        <View
          style={{
            width: style.width,
            position: 'absolute',
            height: style.height / 3,
          }}
        >
          <BackGroundIcon width="100%" height="100%" />
        </View>
        <OtherHeader title={type === 1 ? t('147') : t('150')} />
        <ScrollView>
          <View style={[styles.main]}>
            <View style={styles.aboutUsContainer}>
              <View>
                {/* Qarz oluvchi */}
                <View
                  style={{
                    flexDirection: 'row',
                    marginLeft: 15,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: '#fff',
                      padding: 10,
                      borderRadius: 50,
                    }}
                  >
                    {type !== 1 ? (
                      user?.data?.type === 2 ? (
                        user?.data?.gender == '1' ? (
                          <Person width={40} height={40} color={style.blue} />
                        ) : (
                          <Famale width={40} height={40} color={style.blue} />
                        )
                      ) : (
                        <Juridic width={40} height={40} color={style.blue} />
                      )
                    ) : qarzoluvchi.type === 2 ? (
                      qarzoluvchi.gender == '1' ? (
                        <Person width={40} height={40} color={style.blue} />
                      ) : (
                        <Famale width={40} height={40} color={style.blue} />
                      )
                    ) : (
                      <Juridic width={40} height={40} color={style.blue} />
                    )}
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <MainText color={colors.red} size={fontSize[12]}>
                      {t('270')}:
                    </MainText>
                    <MainText size={fontSize[12]} style={styles.username}>
                      {type !== 1
                        ? user?.data?.last_name +
                          ' ' +
                          user?.data?.first_name +
                          ' ' +
                          user?.data?.middle_name
                        : qarzoluvchi.last_name +
                          ' ' +
                          qarzoluvchi.first_name +
                          ' ' +
                          qarzoluvchi.middle_name}
                    </MainText>
                  </View>
                </View>

                {/* Qarz beruvchi */}
                <View
                  style={{
                    flexDirection: 'row',
                    marginLeft: 15,
                    marginTop: 15,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: '#fff',
                      padding: 10,
                      borderRadius: 50,
                    }}
                  >
                    {type !== 1 ? (
                      qarzoluvchi.type === 2 ? (
                        qarzoluvchi.gender == '1' ? (
                          <Person width={40} height={40} color={style.blue} />
                        ) : (
                          <Famale width={40} height={40} color={style.blue} />
                        )
                      ) : (
                        <Juridic width={50} height={50} color={style.blue} />
                      )
                    ) : user?.data?.type === 2 ? (
                      user?.data?.gender == '1' ? (
                        <Person width={40} height={40} color={style.blue} />
                      ) : (
                        <Famale width={40} height={40} color={style.blue} />
                      )
                    ) : (
                      <Juridic width={50} height={50} color={style.blue} />
                    )}
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <MainText color={colors.green} size={fontSize[12]}>
                      {t('273')}:
                    </MainText>
                    <MainText size={fontSize[12]} style={styles.username}>
                      {type === 0
                        ? qarzoluvchi.last_name +
                          ' ' +
                          qarzoluvchi.first_name +
                          ' ' +
                          qarzoluvchi.middle_name
                        : user?.data?.last_name +
                          ' ' +
                          user?.data?.first_name +
                          ' ' +
                          user?.data?.middle_name}
                    </MainText>
                  </View>
                </View>
              </View>
              <View>
                <View>{renderRadioButtons}</View>
                <View style={styles.TextInputLabelContainer}>
                  <View style={styles.inputTitle}>
                    <MainText size={fontSize[12]}>{t('276')}</MainText>
                  </View>
                  {renderInput}
                </View>
                <View style={styles.TextInputLabelContainer}>
                  <View style={styles.inputTitle}>
                    <MainText size={fontSize[12]}>{t('279')}</MainText>
                  </View>

                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      onPress={() => setOpen(!open)}
                      style={styles.TextInput}
                    >
                      <MainText size={fontSize[14]}>
                        {settingDate(date) === settingDate(Date.now()) ? (
                          <MainText
                            size={fontSize[14]}
                            color={
                              settingDate(date) === settingDate(Date.now())
                                ? style.placeHolderColor
                                : '#000'
                            }
                          >
                            dd.mm.yyyy
                          </MainText>
                        ) : (
                          settingDate(date)
                        )}
                      </MainText>
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 10,
                    marginBottom: 10,
                  }}
                >
                  <CheckBox
                    value={checked}
                    tintColor={'#DBDBDB'}
                    onTintColor={style.blue}
                    tintColors={{
                      true: style.blue,
                      false: style.disabledButtonColor,
                    }}
                    style={{ height: 20, width: 20 }}
                    boxType="square"
                    onValueChange={() => setChecked(!checked)}
                  />
                  {/* //276 */}
                  {/* <Text
                    style={{
                      fontSize: fontSize[12],
                      fontFamily: font.medium,
                      left: 4,
                    }}>
                    <Trans
                      i18nKey={'282'}
                      values={{
                        start: user?.data?.cnt,
                      }}
                      components={{
                        start: (
                          <Text
                            style={{
                              fontFamily: font.medium,
                              fontSize: fontSize[12],
                              color: style.blue,
                            }}
                            onPress={toggleModal}
                          />
                        ),
                      }}
                    />
                  </Text> */}
                  <Text onPress={toggleModal} style={styles.text}>
                    {t('282') as string}
                  </Text>
                  {/* <MainText size={fontSize[12]}>bilan tanishdim</MainText> */}
                </View>
                {type === 0 ? (
                  user?.data?.cnt === 0 ? null : (
                    <View style={{ alignSelf: 'center', marginBottom: 8 }}>
                      <Text style={{ color: 'black', fontFamily: font.medium }}>
                        <Trans
                          i18nKey={'717'}
                          values={{
                            nx: user?.data?.cnt,
                          }}
                          components={{
                            nx: <Text style={{ fontFamily: font.medium }} />,
                          }}
                        />
                      </Text>
                    </View>
                  )
                ) : null}
                {checked && amount.length > 0
                  ? type === 0
                    ? user.data.cnt === 0
                      ? renderSum
                      : null
                    : null
                  : null}
                <View>
                  <TouchableOpacity
                    disabled={
                      disabled || settingDate(date) === settingDate(Date.now())
                    }
                    onPress={fetchData}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          disabled ||
                          settingDate(date) === settingDate(Date.now())
                            ? style.disabledButtonColor
                            : style.blue,
                      },
                    ]}
                  >
                    <MainText color={colors.white}>{t('93')}</MainText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <MeetInfoGiveDebtModal toggleModal={toggleModal} visible={visible} />
        {/* {Platform.OS === 'android' && ( */}
        {/* <DatePicker
            date={date}
            modal
            open={open}
            onConfirm={date => {
              setDate(date);
              setOpen(false);
            }}
            onCancel={() => {
              setOpen(false);
            }}
            cancelText=''

            // style={{
            //   backgroundColor: theme === 'dark' ? '#000' : '#fff',
            //   alignSelf: 'center',
            //   borderRadius: 20,
            // }}
            mode="date"
            minimumDate={new Date()}
          /> */}
        {/* )} */}

        {/* {Platform.OS === 'ios' && (
          <DateModal
            open={open}
            setOpen={setOpen}
            title={t('801')}
            date={date}
            setDate={setDate}
            min={new Date()}
            // max={maxDate}
          />
        )} */}

        <DatePicker
          open={open}
          date={date}
          style={{
            backgroundColor: '#fff',
            alignSelf: 'center',
            
          }}
          
          mode="date"
          confirmText="OK"
          cancelText={t('804')}
          theme="light"
          modal={true}
          minimumDate={new Date()}
          onCancel={() => {
            setOpen(false);
          }}
          title={t('801')}
          onConfirm={date => {
            setDate(date);
            setOpen(false);
          }}
        />

        {/* <DateModal
        date={date}
        setDate={setDate}
        open={open}
        setOpen={setOpen}
        title={`Qarzni qaytarish \nvaqtini belgilang `}
      /> */}

        {/* <Toast config={toastConfig} /> */}
      </Provider>
    </View>
  );
};

export default GiveDebtUser;

export function formatDateMinus(date) {
  const tt = new Date(date);

  return tt.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },

  text: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.blue,
    marginLeft: 10,
  },
  count: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
  },
  vim: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-evenly',
    marginTop: 20,
    width: '100%',
  },
  dateText: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
  },
  button: {
    width: '85%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    height: style.textInputHeight,
    alignSelf: 'center',
  },
  username: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    maxWidth: '90%',
  },
  titleGiveDebt: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: 'red',
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  cardViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  userImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  userImage: {
    width: style.width / 6,
    height: style.width / 6,
    borderRadius: style.width / 6,
  },
  time: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },

  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#EAF2FB',
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
    marginBottom: 10,
    paddingVertical: 20,
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
    fontFamily: style.fontFamilyMedium,
    fontSize: fontSize[14],
    color: style.textColor,
  },
  buttontime: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
    marginTop: 30,
    alignSelf: 'center',
    backgroundColor: '#EAF2FB',
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#EAF2FB',
    paddingLeft: 5,
    paddingRight: 5,
  },
  containerrr: {
    flex: 1,
    width: style.width / 2.4,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
  },
  sum: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.MoneyColor,
  },
  title: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyBold,
    color: style.textColor,
  },
});
