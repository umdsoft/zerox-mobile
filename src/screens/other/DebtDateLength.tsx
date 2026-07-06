import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { toastConfig } from '../components/ToastConfig';
import Loading from '../components/Loading';
import CheckBox from '@react-native-community/checkbox';
import { formatDate } from './DebtDateLengthAsk';
import DatePicker from 'react-native-date-picker';
import TextBold from '../components/TextBold';
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import { settingDate } from '../../helper';
import { useDispatch, useSelector } from 'react-redux';

import { setNotification } from '../../store/reducers/HomeReducer';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import MainText from '../components/MainText';
import socketService from '../../helper/socketService';
import { getCreditorDataAndDebitorData } from '../../store/api/home';
import DateModal from '../home/modal/DateModal';
import { rd, rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';

const DebtDateLength = () => {
  const { item } = useRoute().params;
  const theme = useColorScheme();
  const [check, setCheck] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.HomeReducer);
  const navigation = useNavigation();
  const [info, setInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [loading1, setLoading1] = useState(false);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    const token = storage.getString('token');

    try {
      setLoading(true);
      const { data, status } = await axios.get(
        URL + `/contract/by/${item.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log('datadata', data);
      if (status === 200) {
        setInfo(data.data);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const onPress = async () => {
    const token = storage.getString('token');

    try {
      setLoading1(true);

      const { data, status } = await axios.post(
        URL + '/contract/deb-uzay',
        {
          contract: info.id,
          creditor: info.creditor,
          debitor: info.debitor,
          end_date: formatDate(date),
          inc: info.inc,
          old_amount: info.residual_amount,
          reciver: info.creditor,
          refundable_amount: info.refundable_amount,
          residual_amount: info.residual_amount,
          sender: info.debitor,
          res: info.debitor,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (status === 200 && data.msg === 'ex') {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: t(
              'Ushbu qarz shartnomasi bo‘yicha Sizga so‘rov yuborilgan. Bildirishnomalar bo‘limi orqali so‘rov bilan tanishing.',
            ),
          },
        });
        setLoading1(false);
        return;
      }

      if (status === 201 || data.success) {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'omad',
          props: { title: t('237'), desc: t('375') },
        });
        dispatch(getCreditorDataAndDebitorData());
        setTimeout(() => {
          navigation.navigate('BottomTabNavigator');
          setLoading1(false);
        }, 2000);
        // socketService.sendNotification({id: info.creditor});
        // socketService.emit('notification', user?.data?.id);
        // socketService.on('notification', data => {
        //   dispatch(setNotification({notification: data.not}));
        // });
        return;
      }

      // Yuqoridagi shartlarga tushmagan holat (masalan status=200, msg='end') — jim
      // qolmasdan loading'ni to'xtatib, xato ko'rsatamiz (oldin ekran qotib qolardi).
      setLoading1(false);
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { title: 'Xatolik', desc: t('Xatolik!') },
      });
    } catch (error) {
      console.warn(error);
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi') },
      });
    }
  };

  const isPlaceholder = settingDate(date) === settingDate(Date.now());
  const canSubmit = check === true && loading1 === false;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={t('363')} />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <Text
              allowFontScaling={false}
              style={styles.hisob}
            >
              <Trans
                t={t}
                i18nKey="366"
                values={{
                  start: settingDate(info.created_at),
                  count: info?.number,
                  end: settingDate(info?.end_date),
                }}
                components={{
                  start: (
                    <MainText size={rs(16)} ft={rd.font.bold} />
                  ),
                  count: (
                    <Text
                      allowFontScaling={false}
                      onPress={() => {
                        navigation.navigate('DownloadStatistic', {
                          item: info,
                          id: info.id,
                        });
                      }}
                      style={{
                        color: rd.color.primary,
                      }}
                    />
                  ),
                  end: (
                    <TextBold styles={{ fontSize: rs(16) }} />
                  ),
                }}
              />
            </Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>{t('369')}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setOpen(!open)}
              style={styles.field}
            >
              <Text
                style={[
                  styles.fieldValue,
                  isPlaceholder && styles.fieldPlaceholder,
                ]}
              >
                {isPlaceholder ? t('369') : settingDate(date)}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCheck(!check)}
            style={styles.checkRow}
          >
            <CheckBox
              value={check}
              tintColor={rd.color.primary}
              tintColors={{
                true: rd.color.primary,
                false: rd.color.textTertiary,
              }}
              boxType="square"
              style={styles.checkbox}
              onValueChange={() => setCheck(!check)}
            />
            <Text
              onPress={() => {
                navigation.navigate('Dalol', {
                  type: 3,
                  data: info,
                  date: date,
                });
              }}
              style={styles.checkText}
            >
              {t('372')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canSubmit}
            activeOpacity={0.8}
            onPress={onPress}
            style={[
              styles.registerButton,
              !canSubmit && styles.registerButtonDisabled,
            ]}
          >
            {loading1 ? (
              <ActivityIndicator size={'small'} color={rd.color.onPrimary} />
            ) : (
              <Text
                style={[
                  styles.textButton,
                  !canSubmit && styles.textButtonDisabled,
                ]}
              >
                {t('93')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
          minimumDate={new Date(plus_day(item?.end_date))}
        />
      )}

      {Platform.OS === 'ios' && (
        <DateModal
          open={open}
          setOpen={setOpen}
          title={t('801')}
          date={date}
          setDate={setDate}
          min={new Date(plus_day(item?.end_date))}
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
        onCancel={() => {
          setOpen(false);
        }}
        title={t('801')}
        maximumDate={
          new Date(
            new Date(info?.created_at).setFullYear(
              new Date(info?.created_at).getFullYear() + 2,
            ),
          )
        } // 2 yil — qarz BERILGAN sanadan (created_at), qaytarish sanasidan emas
        onConfirm={date => {
          setDate(date);
          setOpen(false);
        }}
        minimumDate={new Date(plus_day(info?.end_date))}
      />

      {/* <DateModal
        open={open}
        setOpen={setOpen}
        date={date}
        setDate={setDate}
        title={`Yangi muddatni \nkiriting`}
      /> */}
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

const plus_day = date => {
  let leta = date?.split('.').join('-');
  // i have to check to here leta is bigger than today i need to get that otherwise i will take today
  let today = new Date(leta);
  if (today < new Date()) {
    today = new Date();
  }
  let tommorrow = today.setDate(today.getDate() + 1);
  return tommorrow;
};
export const checkingDate = text => {
  const leta = text?.split('.')?.join('-');

  const today = new Date(leta);

  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};

export default DebtDateLength;

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(24),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
  },
  hisob: {
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
    textAlign: 'center',
    lineHeight: rs(22),
  },
  fieldBlock: {
    marginTop: rs(24),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  field: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    height: rs(56),
    paddingHorizontal: rs(16),
    justifyContent: 'center',
  },
  fieldValue: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  fieldPlaceholder: {
    color: rd.color.textTertiary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(20),
  },
  checkbox: {
    width: rs(20),
    height: rs(20),
  },
  checkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.primary,
    maxWidth: '90%',
    marginLeft: rs(10),
  },
  textButton: {
    fontSize: rs(16),
    fontFamily: rd.font.semibold,
    color: rd.color.onPrimary,
  },
  textButtonDisabled: {
    color: rd.color.textTertiary,
  },
  registerButton: {
    width: '100%',
    height: rs(54),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(24),
  },
  registerButtonDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
});
