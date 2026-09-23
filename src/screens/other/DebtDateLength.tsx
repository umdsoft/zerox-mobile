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
import { goHomeSmooth } from "../../helper/finishAction";

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
import { AnimatedIconCircle, ExtendTermIcon } from '../../images/debtActionIcons';

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
            desc: t(
              'Ushbu qarz shartnomasi bo‘yicha Sizga so‘rov yuborilgan. Bildirishnomalar bo‘limi orqali so‘rov bilan tanishing.',
            ),
          },
        });
        setLoading1(false);
        return;
      }

      if (status === 201 || data.success) {
        // SS3: oldin `title: t('237')` ISHLATILGAN edi — t('237') = "<name>{{name}}
        // </name> ...ruxsat so‘ramoqda" (BUTUNLAY BOSHQA kalit; t() `<name>` markupни
        // parse qilmaydi -> toastда literal "<name>{{name}}</name>..." chiqardi). To'g'ri
        // xabar: FAQAT desc t('375') = "Qarz muddati uzaytirildi." (sarlavhasiz -> bold).
        Toast.show({
          // autoHide: false -> toast goHomeSmooth hide qilgunча turadi (o'qilsin).
          autoHide: false,
          position: 'bottom',
          type: 'omad',
          props: { desc: t('375') },
        });
        dispatch(getCreditorDataAndDebitorData());
        goHomeSmooth(navigation, t('375'));
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
        props: { desc: t('Xatolik!') },
      });
    } catch (error) {
      console.warn(error);
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { desc: t('Xatolik sodir bo‘ldi') },
      });
    }
  };

  const isPlaceholder = settingDate(date) === settingDate(Date.now());
  const canSubmit = check === true && loading1 === false;

  // XAVFSIZ sanalar: DatePicker HAR DOIM mount bo'ladi (open=false bo'lsa ham). `info`
  // dastlab {} bo'lgani uchun info.created_at/end_date undefined -> `new Date(undefined)`
  // Invalid Date -> DatePicker "RangeError: Date value out of bounds" bilan CRASH berardi.
  // Endi noto'g'ri sanalarda mantiqiy default (bugun / bugun+2yil) ishlatamiz.
  const safeMax = (() => {
    const c = new Date(info?.created_at);
    const base = isNaN(c.getTime()) ? new Date() : c;
    return new Date(new Date(base).setFullYear(base.getFullYear() + 2));
  })();
  const safeMin = (() => {
    const m = new Date(plus_day(info?.end_date));
    return isNaN(m.getTime()) ? new Date() : m;
  })();

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
          {/* UZAYTIRISH ikonasi — soat + oldinga yoy strelka + yengil puls. */}
          <View style={styles.iconWrap}>
            <AnimatedIconCircle size={rs(108)} bg={rd.color.primary}>
              <ExtendTermIcon width={rs(56)} height={rs(56)} />
            </AnimatedIconCircle>
          </View>

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
                  // Shrift BARCHA so'z va raqamda bir xil — faqat shartnoma raqami
                  // (count) bosiladigan ko'k havola (rang farqi, shrift emas).
                  start: <Text allowFontScaling={false} />,
                  count: (
                    <Text
                      allowFontScaling={false}
                      onPress={() => {
                        navigation.navigate('DownloadStatistic', {
                          item: info,
                          id: info.id,
                        });
                      }}
                      style={styles.link}
                    />
                  ),
                  end: <Text allowFontScaling={false} style={styles.endBold} />,
                }}
              />
            </Text>
          </View>

          {/* "Yangi muddatni kiriting" LABEL olib tashlandi — maydon placeholder'ida
              allaqachon shu matn bor edi (dublikat). */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setOpen(!open)}
              style={styles.field}
            >
              <Text
                allowFontScaling={false}
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
              allowFontScaling={false}
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
                allowFontScaling={false}
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
        maximumDate={safeMax} // 2 yil — qarz BERILGAN sanadan (created_at), qaytarish sanasidan emas
        onConfirm={date => {
          setDate(date);
          setOpen(false);
        }}
        minimumDate={safeMin}
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
  // Amal ikonasi — matn ustida, biroz pastroqда (so'rov bo'yicha).
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(52),
    marginBottom: rs(28),
  },
  iconCircle: {
    width: rs(104),
    height: rs(104),
    borderRadius: rs(52),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Shartnoma raqami havolasi — shrift bir xil, faqat ko'k rang.
  link: { color: rd.color.primary },
  // Hozirgi qaytarish muddati (sana) — BOLD (so'rov bo'yicha jirniy). Ilgari bu stil
  // ta'riflanmagan edi -> styles.endBold undefined -> bold qo'llanmasdan qolgan edi.
  endBold: { fontFamily: rd.font.bold, color: rd.color.text },
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
  // Shrift tepadagi matn (hisob) bilan uyg'un — biroz kichikroq/bir xil (so'rov bo'yicha).
  fieldValue: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
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
  // Yuqoridagi matn (hisob) bilan bir xil o'lchamга yaqin (so'rov bo'yicha).
  checkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.primary,
    maxWidth: '90%',
    marginLeft: rs(10),
  },
  textButton: {
    fontSize: rs(14),
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
