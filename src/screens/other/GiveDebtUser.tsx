import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
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
import RadioIconFill from '../../images/radioButtonFill';
import MeetInfoGiveDebtModal from '../../modal/MeetInfoGiveDebtModal';

import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Loading from '../components/Loading';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
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
import { rd, rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';
import { UserIcon } from '../home/redesign/icons';

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
      <View style={styles.currencyRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setActive(true);
          }}
          style={[styles.currencyOption, active && styles.currencyOptionActive]}
        >
          <Text
            allowFontScaling={false}
            style={[
              styles.currencyText,
              active && styles.currencyTextActive,
            ]}
          >
            {t('uzs')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setActive(false);
          }}
          style={[styles.currencyOption, !active && styles.currencyOptionActive]}
        >
          <Text
            allowFontScaling={false}
            style={[
              styles.currencyText,
              !active && styles.currencyTextActive,
            ]}
          >
            {t('usd')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [active]);
  const renderInput = useMemo(() => {
    return (
      <View style={{ flex: 1 }}>
        <TextInput
          allowFontScaling={false}
          value={onValue(amount)}
          placeholder={active ? 'UZS' : 'USD'}
          placeholderTextColor={rd.color.textTertiary}
          keyboardType="numeric"
          onChangeText={text => {
            let a = Number(text.replace(/[^0-9]/g, ''));
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
  const isDisabled =
    disabled || settingDate(date) === settingDate(Date.now());
  const dateIsPlaceholder = settingDate(date) === settingDate(Date.now());
  const debtorName =
    type !== 1
      ? user?.data?.last_name +
        ' ' +
        user?.data?.first_name +
        ' ' +
        user?.data?.middle_name
      : qarzoluvchi.last_name +
        ' ' +
        qarzoluvchi.first_name +
        ' ' +
        qarzoluvchi.middle_name;
  const creditorName =
    type === 0
      ? qarzoluvchi.last_name +
        ' ' +
        qarzoluvchi.first_name +
        ' ' +
        qarzoluvchi.middle_name
      : user?.data?.last_name +
        ' ' +
        user?.data?.first_name +
        ' ' +
        user?.data?.middle_name;

  return (
    <View style={styles.container}>
      <Provider>
        <StatusBar barStyle="dark-content" />
        <RdHeader title={type === 1 ? t('147') : t('150')} />
        <ScrollView
          contentContainerStyle={{ paddingBottom: rs(32) }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.main}>
            {/* Ishtirokchilar kartasi */}
            <View style={styles.partyCard}>
              {/* Qarz oluvchi */}
              <View style={styles.partyRow}>
                <View style={styles.avatar}>
                  {type !== 1 ? (
                    user?.data?.type === 2 ? (
                      user?.data?.gender == '1' ? (
                        <Person width={rs(28)} height={rs(28)} color={rd.color.primary} />
                      ) : (
                        <Famale width={rs(28)} height={rs(28)} color={rd.color.primary} />
                      )
                    ) : (
                      <Juridic width={rs(28)} height={rs(28)} color={rd.color.primary} />
                    )
                  ) : qarzoluvchi.type === 2 ? (
                    qarzoluvchi.gender == '1' ? (
                      <Person width={rs(28)} height={rs(28)} color={rd.color.primary} />
                    ) : (
                      <Famale width={rs(28)} height={rs(28)} color={rd.color.primary} />
                    )
                  ) : (
                    <Juridic width={rs(28)} height={rs(28)} color={rd.color.primary} />
                  )}
                </View>
                <View style={styles.partyInfo}>
                  <Text allowFontScaling={false} style={styles.partyRole}>
                    {t('270')}
                  </Text>
                  <Text allowFontScaling={false} style={styles.partyName}>
                    {debtorName}
                  </Text>
                </View>
              </View>

              <View style={styles.partyDivider} />

              {/* Qarz beruvchi */}
              <View style={styles.partyRow}>
                <View style={styles.avatar}>
                  {type !== 1 ? (
                    qarzoluvchi.type === 2 ? (
                      qarzoluvchi.gender == '1' ? (
                        <Person width={rs(28)} height={rs(28)} color={rd.color.primary} />
                      ) : (
                        <Famale width={rs(28)} height={rs(28)} color={rd.color.primary} />
                      )
                    ) : (
                      <Juridic width={rs(28)} height={rs(28)} color={rd.color.primary} />
                    )
                  ) : user?.data?.type === 2 ? (
                    user?.data?.gender == '1' ? (
                      <Person width={rs(28)} height={rs(28)} color={rd.color.primary} />
                    ) : (
                      <Famale width={rs(28)} height={rs(28)} color={rd.color.primary} />
                    )
                  ) : (
                    <Juridic width={rs(28)} height={rs(28)} color={rd.color.primary} />
                  )}
                </View>
                <View style={styles.partyInfo}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.partyRole, styles.partyRoleCreditor]}
                  >
                    {t('273')}
                  </Text>
                  <Text allowFontScaling={false} style={styles.partyName}>
                    {creditorName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Valyuta tanlash */}
            {renderRadioButtons}

            {/* Summa */}
            <View style={styles.field}>
              <Text allowFontScaling={false} style={styles.label}>
                {t('276')}
              </Text>
              <View style={styles.inputWrap}>{renderInput}</View>
            </View>

            {/* Sana */}
            <View style={styles.field}>
              <Text allowFontScaling={false} style={styles.label}>
                {t('279')}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpen(!open)}
                style={styles.inputWrap}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.inputText,
                    dateIsPlaceholder && styles.inputPlaceholder,
                  ]}
                >
                  {dateIsPlaceholder ? 'dd.mm.yyyy' : settingDate(date)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Shartnoma bilan tanishish */}
            <View style={styles.agreeRow}>
              <CheckBox
                value={checked}
                tintColor={'#DBDBDB'}
                onTintColor={rd.color.primary}
                tintColors={{
                  true: rd.color.primary,
                  false: rd.color.border,
                }}
                style={{ height: 20, width: 20 }}
                boxType="square"
                onValueChange={() => setChecked(!checked)}
              />
              <Text
                allowFontScaling={false}
                onPress={toggleModal}
                style={styles.agreeText}
              >
                {t('282') as string}
              </Text>
            </View>

            {type === 0 ? (
              user?.data?.cnt === 0 ? null : (
                <View style={styles.cntRow}>
                  <Text
                    allowFontScaling={false}
                    style={styles.cntText}
                  >
                    <Trans
                      i18nKey={'717'}
                      values={{
                        nx: user?.data?.cnt,
                      }}
                      components={{
                        nx: <Text style={{ fontFamily: rd.font.semibold }} />,
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

            <TouchableOpacity
              disabled={isDisabled}
              activeOpacity={0.85}
              onPress={fetchData}
              style={[
                styles.button,
                isDisabled ? styles.buttonDisabled : styles.buttonActive,
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.buttonText,
                  isDisabled && styles.buttonTextDisabled,
                ]}
              >
                {t('93')}
              </Text>
            </TouchableOpacity>
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
          maximumDate={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)} // maximum date should be 2 years
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
    backgroundColor: rd.color.page,
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
  },

  // Ishtirokchilar kartasi
  partyCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyDivider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(14),
  },
  avatar: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyInfo: {
    flex: 1,
    marginLeft: rs(12),
  },
  partyRole: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.error,
    marginBottom: rs(2),
  },
  partyRoleCreditor: {
    color: rd.color.success,
  },
  partyName: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.text,
  },

  // Valyuta segment
  currencyRow: {
    flexDirection: 'row',
    marginTop: rs(20),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.lg,
    padding: rs(4),
  },
  currencyOption: {
    flex: 1,
    height: rs(44),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyOptionActive: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  currencyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textSecondary,
  },
  currencyTextActive: {
    fontFamily: rd.font.semibold,
    color: rd.color.primary,
  },

  // Maydonlar
  field: {
    marginTop: rs(20),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  inputWrap: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    height: rs(56),
    paddingHorizontal: rs(16),
    justifyContent: 'center',
  },
  inputText: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  inputPlaceholder: {
    color: rd.color.textTertiary,
  },
  TextInput: {
    width: '100%',
    height: '100%',
    padding: 0,
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },

  // Shartnoma bilan tanishish
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(20),
  },
  agreeText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.primary,
    marginLeft: rs(12),
  },
  cntRow: {
    marginTop: rs(12),
  },
  cntText: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.text,
  },

  // Tugma
  button: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(24),
  },
  buttonActive: {
    backgroundColor: rd.color.primary,
  },
  buttonDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
  buttonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
  buttonTextDisabled: {
    color: rd.color.textTertiary,
  },
});
