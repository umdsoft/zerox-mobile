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
import React, { useCallback, useEffect, useState } from 'react';
import { goHomeSmooth } from "../../helper/finishAction";
import { style } from '../../theme/style';

import { useNavigation, useRoute } from '@react-navigation/native';
import Loading from '../components/Loading';

import { Toast } from 'react-native-toast-message/lib/src/Toast';

import DatePicker from 'react-native-date-picker';
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import TextBold from '../components/TextBold';
import { settingDate } from '../../helper';

import { useDispatch, useSelector } from 'react-redux';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import MainText from '../components/MainText';
import { font } from '../../theme/font';

import DateModal from '../home/modal/DateModal';
import { rd, rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';
import { AnimatedIconCircle, RequestExtendIcon } from '../../images/debtActionIcons';

const DebtDateLengthAsk = () => {
  const { item } = useRoute().params;
  const theme = useColorScheme();
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.HomeReducer);
  const [info, setInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const getData = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data, status } = await axios.get(
        URL + `/contract/by/${item?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
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
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (status === 201) {
        // SS5: "Muvaffaqiyatli" sarlavhasi olib tashlandi -> matn bold (descStrong).
        Toast.show({
          // autoHide: false -> toast goHomeSmooth hide qilgunча turadi (o'qilsin).
          autoHide: false,
          props: {
            desc: t('468'),
          },
          position: 'bottom',
          type: 'omad',
        });
        // Toast o'qilsin -> yo'qolsin -> so'ng HOME (goHomeSmooth, matn uzunligiga
        // qarab o'qish vaqti). Freeze yo'q (navigate).
        setLoading1(false);
        goHomeSmooth(navigation, t('468'));
        return;
      }
      if (data.msg === 'ex') {
        // SS5: oldin so'rov yuborilgan holat — "Muvaffaqiyatli" sarlavhasi (xato edi,
        // bu error toast) olib tashlandi -> matn bold (descStrong).
        Toast.show({
          autoHide: true,
          props: {
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
      console.error(err, 'err');
      setLoading1(false);
      Toast.show({
        autoHide: true,
        props: { desc: t('Xatolik sodir bo‘ldi') },
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

  // console.log(plus_day(date), 'plus_day(info?.end_date)');
  // console.log(formatDate(plus_day(date)), 'checkingDate(date)');

  const isPlaceholder = settingDate(date) === settingDate(Date.now());
  const disabled = checkingDate(date) || loading1;

  // XAVFSIZ sanalar: DatePicker `info` yuklanmasdan ochilsa (foydalanuvchi tez bossa)
  // info.end_date/created_at undefined bo'lib min/max Invalid Date bo'lardi ->
  // "RangeError: Date value out of bounds" CRASH. Endi noto'g'ri sanada default ishlatamiz.
  const safeMin = (() => {
    const m = new Date(minimumDate(info?.end_date));
    return isNaN(m.getTime())
      ? new Date(new Date().getTime() + 86400000)
      : m;
  })();
  const safeMax = (() => {
    const c = new Date(info?.created_at);
    const base = isNaN(c.getTime()) ? new Date() : c;
    return new Date(new Date(base).setFullYear(base.getFullYear() + 2));
  })();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={t('462')} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* SO'RASH ikonasi — konvert + soat (muddat so'rovi) + yengil puls. */}
          <View style={styles.iconWrap}>
            <AnimatedIconCircle size={rs(104)} bg={rd.color.primary}>
              <RequestExtendIcon width={rs(52)} height={rs(52)} />
            </AnimatedIconCircle>
          </View>

          <View style={styles.card}>
            <Text allowFontScaling={false} style={styles.hisob}>
              <Trans
                t={t}
                i18nKey="465"
                values={{
                  start: settingDate(info.created_at),
                  id: info?.number,
                  end: settingDate(info?.end_date),
                }}
                components={{
                  // Shrift barcha so'z va raqamda bir xil — faqat shartnoma raqami
                  // (id) bosiladigan ko'k havola.
                  start: <Text allowFontScaling={false} />,
                  id: (
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
                {/* {date !== new Date()
                  ? settingDate(date)
                  : settingDate(info?.end_date)} */}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            disabled={disabled}
            onPress={onPress}
            activeOpacity={0.8}
            style={[
              styles.registerButton,
              disabled && styles.registerButtonDisabled,
            ]}
          >
            {loading1 ? (
              <ActivityIndicator size={'small'} color={rd.color.onPrimary} />
            ) : (
              <Text
                allowFontScaling={false}
                style={[
                  styles.textButton,
                  disabled && styles.textButtonDisabled,
                ]}
              >
                {t('357')}
              </Text>
            )}
          </TouchableOpacity>
          {/* Kontent yuqoriga — qolgan bo'sh joy pastda. */}
          <View style={styles.spacer} />
        </ScrollView>
      )}

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
          minimumDate={safeMin}
          maximumDate={safeMax} // 2 yil — qarz BERILGAN sanadan (info.created_at), qaytarish sanasidan emas
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
    backgroundColor: rd.color.page,
    flex: 1,
  },
  // Kontent VERTIKAL MARKAZDA (so'rov bo'yicha biroz pastroq/balansli).
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: rs(20),
    paddingVertical: rs(24),
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(28),
  },
  spacer: { flex: 0 },
  // Hozirgi qaytarish muddati (sana) — bold (so'rov bo'yicha jirniy).
  endBold: { fontFamily: rd.font.bold, color: rd.color.text },
  iconCircle: {
    width: rs(96),
    height: rs(96),
    borderRadius: rs(48),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Shartnoma raqami havolasi — shrift bir xil, faqat ko'k rang.
  link: { color: rd.color.primary },
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
