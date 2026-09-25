import {
  Dimensions,
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
import React, { useState } from 'react';
import { style } from '../../theme/style';
import { useNavigation, useRoute } from '@react-navigation/native';
import Loading from '../components/Loading';
import { URL } from '../constants';
import axios from 'axios';
// import TextInputMask from 'react-native-text-input-mask';
import { storage } from '../../store/api/token/getToken';

import DatePicker from 'react-native-date-picker';
import { useDispatch, useSelector } from 'react-redux';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { toastConfig } from '../components/ToastConfig';

import AskPermission from '../../images/AskPermissonIcon';
import AskPermissionNearby from '../../images/AskPermissonNearby';
import EyeIcon from '../../images/Eye';
import MainText from '../components/MainText';
import { fontSize } from '../../theme/font';
import { colors } from '../../theme/colors';
import { settingDate } from '../../helper';
import { t } from 'i18next';
import { checkExpire, setNotification } from '../../store/reducers/HomeReducer';
import { expire_passport_check } from '../../helper/timeChecker';
import { MaskedTextInput } from 'react-native-advanced-input-mask';
import DateModal from '../home/modal/DateModal';
import QuestionMarkIcon from '../../images/questionMark';
import Popover from 'react-native-popover-view';
import { Mode, Placement } from 'react-native-popover-view/dist/Types';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import { rd, rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';
import { SearchIcon, UserIcon, ChevronRight } from '../home/redesign/icons';
import Person from '../../images/home/person';
import Famale from '../../images/Famale';
const { width } = Dimensions.get('window');

const SearchUserScreen = () => {
  // params yo'q holatda ham ishlasin (paramssiz navigatsiya crash bermasin).
  // Default type: 1 (qarz berish tarmog'i).
  const { type = 1 } = (useRoute().params as { type?: number }) || {};
  const theme = useColorScheme();
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector(state => state.HomeReducer.user);
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchForm, setSearchForm] = useState(true);
  const [userID, setUserID] = useState('');
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const dispatch = useDispatch();
  // Foydalanuvchini qidirish

  const SearchUser = async () => {
    try {
      if (expire_passport_check(user.data.expiry_date)) {
        dispatch(checkExpire({ expire: true }));
        return;
      }

      if (user.data.uid === userID.replace('/', '')) {
        Toast.show({
          // "Xatolik" sarlavhasi olib tashlandi -> desc bold (descStrong).
          autoHide: true,
          position: 'bottom',
          visibilityTime: 3000,
          type: 'error2',
          props: {
            desc: t('Foydalanuvchi ma’lumotlari to‘g‘ri kelmadi'),
          },
        });
      } else {
        setLoading(true);
        setError(false);
        const { data, status } = await axios.post(
          URL + '/user/search',
          {
            id: userID.replace('/', ''),
            brithday: formatDate(date),
            type: 1,
          },
          {
            headers: {
              Authorization: `Bearer ${storage.getString('token')}`,
            },
          },
        );

        if (data.success) {
          setError(false);
          setLoading(false);
          setData(data);
          setSearchForm(false);
          return;
        }
        if (data.success === false) {
          // ID tizimда BOR-yo'qligini aniqlaymiz: candidate-search topmasa ->
          // "Ushbu ID raqamli foydalanuvchi mavjud emas"; topsa (lekin qidiruv
          // fail = tug'ilgan sana mos emas) -> "Foydalanuvchi ma'lumotlari to'g'ri
          // kelmadi". Sarlavhasiz -> desc bold (so'rov).
          let exists = false;
          try {
            const cs = await axios.get(
              URL + `/user/candidate-search/${userID.replace('/', '')}`,
              { headers: { Authorization: `Bearer ${storage.getString('token')}` } },
            );
            exists = !!(cs?.data?.success && cs?.data?.data);
          } catch {}
          Toast.show({
            autoHide: true,
            position: 'bottom',
            visibilityTime: 3000,
            type: 'error2',
            props: {
              desc: exists
                ? t('825')
                : t('Ushbu ID raqamli foydalanuvchi mavjud emas'),
            },
          });
          setError(false);
          setLoading(false);
          return;
        }
      }
    } catch {
      Toast.show({
        // "Xatolik" sarlavhasi olib tashlandi -> desc bold.
        autoHide: true,
        position: 'bottom',
        visibilityTime: 3000,
        type: 'error2',
        props: {
          desc: t('825'),
        },
      });
    }
    setLoading(false);
  };
  // Qidiruv formasini korsatish
  if (loading) {
    return <Loading />;
  }

  const disabled = userID.length === 9 ? false : true;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={t('267')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {searchForm == false ? (
          error === false &&
          loading === false &&
          data?.success && (
            <UserInfo user={data?.user} navigation={navigation} type={type} />
          )
        ) : (
          <>
            {/* Hero — qidiruv ikonkasi + kontekst sarlavhasi (bo'sh joyni to'ldiradi) */}
            <View style={styles.hero}>
              <View style={styles.heroBadge}>
                <SearchIcon size={rs(38)} color={rd.color.primary} />
              </View>
              <Text style={styles.heroTitle} allowFontScaling={false}>
                {type === 1 ? t('Qarz berish') : t('Qarz olish')}
              </Text>
            </View>

            <View style={styles.card}>
            {/* Foydalanuvchi ID */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('210')}</Text>
                <Popover
                  placement={Placement.BOTTOM}
                  popoverStyle={styles.tooltip}
                  backgroundStyle={styles.tooltipBackdrop}
                  arrowSize={{ width: rs(16), height: rs(9) }}
                  from={
                    <TouchableOpacity
                      style={{ marginLeft: rs(6) }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <QuestionMarkIcon
                        width={rs(18)}
                        height={rs(18)}
                        color={rd.color.primary}
                      />
                    </TouchableOpacity>
                  }
                >
                  <View style={styles.tooltipInner}>
                    <Text style={styles.tooltipText} allowFontScaling={false}>
                      {t('130')}
                    </Text>
                  </View>
                </Popover>
              </View>

              <View style={styles.inputWrap}>
                <SearchIcon size={rs(18)} color={rd.color.textTertiary} />
                <MaskedTextInput
                  value={userID}
                  placeholder="100000/AA"
                  autoCapitalize="characters"
                  allowFontScaling={false}
                  onChangeText={(formatted, extracted) => {
                    setUserID(extracted.toUpperCase());
                  }}
                  mask="[000000]{/}[AA]"
                  placeholderTextColor={rd.color.textTertiary}
                  keyboardType="default"
                  style={styles.inputField}
                />
              </View>
            </View>

            {/* Tug'ilgan sana */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { marginBottom: rs(8) }]}>
                {t('213')}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(!open)}
                activeOpacity={0.8}
                style={styles.dateInput}
              >
                {settingDate(date) === settingDate(Date.now()) ? (
                  <Text style={styles.datePlaceholder} allowFontScaling={false}>
                    {t('kk.oo.yyyy')}
                  </Text>
                ) : (
                  <Text style={styles.dateValue} allowFontScaling={false}>
                    {settingDate(date)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              disabled={disabled}
              onPress={SearchUser}
              activeOpacity={0.8}
              style={[
                styles.primaryButton,
                disabled && styles.primaryButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  disabled && styles.primaryButtonTextDisabled,
                ]}
              >
                {t('216')}
              </Text>
            </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* {Platform.OS === 'android' && open && (
        <DatePicker
          // date={date}
          value={date}
          display="calendar"
          // textColor="#000"
          style={{
            backgroundColor: theme === 'dark' ? '#000' : '#fff',
            alignSelf: 'center',
            borderRadius: 20,
          }}
          mode="date"
          // cancelText={t('804')}

          // title={t('213')}
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setDate(date!);
            setOpen(false);
          }}
        />
      )} */}

      {/* {Platform.OS === 'ios' && (
        <DateModal
          open={open}
          setOpen={setOpen}
          title={t('213')}
          date={date}
          setDate={setDate}
          // min={minDate}
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
        title={t('213')}
        onConfirm={date => {
          setDate(date);
          setOpen(false);
        }}
        maximumDate={new Date()}
      />

      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

const UserInfo = ({ user, navigation, type }) => {
  const userInfo = useSelector(state => state.HomeReducer);

  const [active, setActive] = useState(false);
  const [first, setFirst] = useState(false);

  const [resolve, setResolve] = useState(false);
  const [reject, setReject] = useState(false);
  const [check, setCheck] = useState(true);
  const dispatch = useDispatch();

  const startTimer = async () => {
    const token = storage.getString('token');
    const obj = {
      creditor: userInfo?.user?.data?.id,
      debitor: userInfo?.user?.data?.id,
      reciver: user?.id,
    };
    setActive(true);
    setFirst(true);
    setCheck(false);
    setReject(false);
    setResolve(false);

    try {
      const { status } = await axios.post(
        URL + '/notification/reqquest',
        obj,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      Toast.show({
        autoHide: true,
        position: 'bottom',
        visibilityTime: 2000,
        type: 'omad',
        // "Muvaffaqiyatli bajarildi" sarlavhasi OLIB TASHLANDI — desc bold chiqadi.
        props: { desc: t('228') },
      });
      if (status === 201) {
        // socketService.sendNotification({
        //   id: user?.id,
        // });
        // socketService.emit('notification', user?.id);
        // socketService.on('notification', data => {
        //   dispatch(setNotification({notification: data.not}));
        // });

        setTimeout(() => {
          navigation.reset({
            routes: [{ name: 'BottomTabNavigator' }],
            index: 0,
          });
        }, 2000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fullName =
    (user?.last_name || '') +
    ' ' +
    (user?.first_name || '') +
    ' ' +
    (user?.middle_name || '');

  const initials = (
    (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')
  ).toUpperCase();

  const requestDisabled = active && first;

  return (
    <View>
      {/* Profil kartasi — ALOHIDA (markazlashgan gender avatar + FISH + ID chip) */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLg}>
          {user?.gender == 2 ? (
            <Famale width={rs(40)} height={rs(40)} color={rd.color.primary} />
          ) : (
            <Person width={rs(40)} height={rs(40)} color={rd.color.primary} />
          )}
        </View>
        <Text style={styles.profileName} numberOfLines={2} allowFontScaling={false}>
          {fullName.trim()}
        </Text>
        <View style={styles.profileChip}>
          <Text style={styles.profileChipLabel} allowFontScaling={false}>
            {t('120')}
          </Text>
          <Text style={styles.profileChipValue} allowFontScaling={false}>
            {user?.uid}
          </Text>
        </View>
      </View>

      {/* Izoh — CARD TASHQARISIDA, yengil qutida (oddiy matn emas) */}
      <View style={styles.noticeBox}>
        <View style={styles.noticeDot} />
        <Text style={styles.noticeText} allowFontScaling={false}>
          {resolve
            ? t('246')
            : reject
            ? t('258')
            : !active
            ? t('219')
            : t('231')}
        </Text>
      </View>

      {/* 1) Ma'lumotlarni ko'rishni so'rash — OCH (light) + primary ikonka */}
      <TouchableOpacity
        disabled={requestDisabled}
        onPress={() => {
          startTimer();
        }}
        activeOpacity={0.85}
        style={[
          styles.actionBtn,
          resolve ? styles.actionBtnSuccess : styles.btnLight,
          requestDisabled && styles.actionBtnDisabled,
        ]}
      >
        {resolve ? (
          <EyeIcon color={rd.color.onPrimary} />
        ) : (
          <AskPermission
            color={requestDisabled ? rd.color.textTertiary : rd.color.primary}
          />
        )}
        <Text
          style={[
            resolve ? styles.actionBtnTextLight : styles.btnTextPrimary,
            requestDisabled && styles.actionBtnTextDisabled,
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {resolve ? t('252') : t('225')}
        </Text>
      </TouchableOpacity>

      {/* 2) Ko'rmasdan qarz berish/olish — KO'K (filled) + oq ikonka */}
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('GiveDebtUser', {
            qarzoluvchi: user,
            type: type,
          });
        }}
        activeOpacity={0.85}
        style={[styles.actionBtn, styles.actionBtnFilled]}
      >
        <AskPermissionNearby color={rd.color.onPrimary} />
        <Text
          style={styles.actionBtnTextLight}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {type === 1 ? t('222') : t('288')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

function formatDate(date) {
  const today = new Date(date);
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  const formattedToday = dd + '.' + mm + '.' + yyyy;

  return formattedToday;
}
export default SearchUserScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    paddingBottom: rs(40),
  },
  // Hero — qidiruv ikonkasi + sarlavha (yuqoridagi bo'sh joyni to'ldiradi)
  hero: {
    alignItems: 'center',
    marginBottom: rs(22),
  },
  heroBadge: {
    width: rs(84),
    height: rs(84),
    borderRadius: rs(42),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(14),
  },
  heroTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
  },
  // Tooltip — sahifani to'liq qoraytirmaydi (yengil backdrop), toza qora kartochka
  tooltip: {
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.text,
    maxWidth: rs(280),
  },
  tooltipBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
  },
  tooltipInner: {
    paddingVertical: rs(10),
    paddingHorizontal: rs(14),
  },
  tooltipText: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.onPrimary,
    lineHeight: rs(18),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  fieldGroup: {
    marginBottom: rs(18),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    height: rs(56),
    paddingHorizontal: rs(16),
  },
  inputField: {
    flex: 1,
    marginLeft: rs(10),
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    textTransform: 'uppercase',
    padding: 0,
  },
  dateInput: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    height: rs(56),
    paddingHorizontal: rs(16),
    justifyContent: 'center',
  },
  datePlaceholder: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.textTertiary,
  },
  dateValue: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  primaryButton: {
    backgroundColor: rd.color.primary,
    height: rs(54),
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
  successButton: {
    backgroundColor: rd.color.success,
  },
  primaryButtonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
    textAlign: 'center',
  },
  primaryButtonTextDisabled: {
    color: rd.color.textTertiary,
  },
  actionButton: {
    marginTop: rs(12),
    paddingHorizontal: rs(12),
  },
  // UserInfo card
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: rs(52),
    height: rs(52),
    borderRadius: rs(26),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(18),
    color: rd.color.primary,
  },
  userMeta: {
    flex: 1,
    marginLeft: rs(14),
  },
  // FISH — kartaga sig'ishi uchun kichikroq (rs16 -> rs14.5)
  userName: {
    fontFamily: rd.font.bold,
    fontSize: rs(14.5),
    color: rd.color.text,
    lineHeight: rs(20),
  },
  // ID — yengil chip ko'rinishida
  uidChip: {
    alignSelf: 'flex-start',
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    marginTop: rs(6),
  },
  uidChipText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.primary,
  },
  // Profil kartasi — ALOHIDA, markazlashgan (avatar + FISH + ID chip)
  profileCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    paddingVertical: rs(22),
    paddingHorizontal: rs(16),
  },
  avatarLg: {
    width: rs(88),
    height: rs(88),
    borderRadius: rs(44),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(14),
    maxWidth: '92%',
    lineHeight: rs(22),
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    marginTop: rs(12),
  },
  profileChipLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  profileChipValue: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.text,
  },
  // Izoh qutisi — card tashqarisida, yengil fon + nuqta
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(8),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    padding: rs(14),
    marginTop: rs(16),
  },
  noticeDot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: rd.color.primary,
    marginTop: rs(6),
  },
  noticeText: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    lineHeight: rs(19),
  },
  btnLight: { backgroundColor: rd.color.primaryTint },
  btnTextPrimary: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.primary,
    textAlign: 'center',
    flexShrink: 1,
  },
  // Amal tugmalari — bir xil shrift, matn sig'adi (rs13.5), ikonka + matn
  actionBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(12),
    gap: rs(8),
    marginTop: rs(12),
  },
  actionBtnFilled: {
    backgroundColor: rd.color.primary,
  },
  actionBtnSuccess: {
    backgroundColor: rd.color.success,
  },
  actionBtnDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
  actionBtnTextLight: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.onPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
  actionBtnTextDisabled: {
    color: rd.color.textTertiary,
  },
});
