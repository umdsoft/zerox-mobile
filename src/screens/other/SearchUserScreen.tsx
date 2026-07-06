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
import socketService from '../../helper/socketService';
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
const { width } = Dimensions.get('window');

const SearchUserScreen = () => {
  // params yo'q holatda ham ishlasin (paramssiz navigatsiya crash bermasin).
  // Default type: 1 (qarz berish tarmog'i).
  const { type = 1 } = (useRoute().params as { type?: number }) || {};
  const theme = useColorScheme();
  const { user } = useSelector(state => state.HomeReducer);
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
          autoHide: true,
          position: 'bottom',
          visibilityTime: 3000,
          type: 'error2',
          props: {
            title: 'Xatolik',
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
        console.log(data, 'data from search user');

        if (data.success) {
          setError(false);
          setLoading(false);
          setData(data);
          setSearchForm(false);
          return;
        }
        if (data.success === false) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            visibilityTime: 3000,
            type: 'error2',
            props: {
              title: 'Xatolik',
              desc: t('825'),
            },
          });
          setError(false);
          setLoading(false);
          return;
        }
      }
    } catch {
      Toast.show({
        autoHide: true,
        position: 'bottom',
        visibilityTime: 3000,
        type: 'error2',
        props: {
          title: 'Xatolik',
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
        contentContainerStyle={styles.scrollContent}
      >
        {searchForm == false ? (
          error === false &&
          loading === false &&
          data?.success && (
            <UserInfo user={data?.user} navigation={navigation} type={type} />
          )
        ) : (
          <View style={styles.card}>
            {/* Foydalanuvchi ID */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('210')}</Text>
                <Popover
                  popoverStyle={{ borderRadius: 10 }}
                  displayArea={{
                    x: 50,
                    y: 150,
                    width: 300,
                    height: 250,
                  }}
                  placement={Placement.BOTTOM}
                  from={
                    <TouchableOpacity style={{ marginLeft: rs(6) }}>
                      <QuestionMarkIcon
                        width={rs(18)}
                        height={rs(18)}
                        color={rd.color.primary}
                      />
                    </TouchableOpacity>
                  }
                >
                  <View style={{ padding: 10, width: 250 }}>
                    <MainText size={fontSize[11]}>{t('130')}</MainText>
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
                  <Text style={styles.datePlaceholder}>dd.mm.yyyy</Text>
                ) : (
                  <Text style={styles.dateValue}>{settingDate(date)}</Text>
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
      const { data, status } = await axios.post(
        URL + '/notification/reqquest',
        obj,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log(data, 'asdasd');

      Toast.show({
        autoHide: true,
        position: 'bottom',
        visibilityTime: 2000,
        type: 'omad',
        props: { title: t('243'), desc: t('228') },
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
      console.log(error);
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
    <View style={styles.card}>
      {/* Foydalanuvchi kartasi */}
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          {initials ? (
            <Text style={styles.avatarText}>{initials}</Text>
          ) : (
            <UserIcon size={rs(24)} color={rd.color.primary} />
          )}
        </View>
        <View style={styles.userMeta}>
          <Text style={styles.userName} numberOfLines={2}>
            {fullName.trim()}
          </Text>
          <Text style={styles.userDetail}>
            {t('120')}: {user?.uid}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.statusText}>
        {resolve
          ? t('246')
          : reject
          ? t('258')
          : !active
          ? t('219')
          : t('231')}
      </Text>

      <TouchableOpacity
        disabled={requestDisabled}
        onPress={() => {
          startTimer();
        }}
        activeOpacity={0.8}
        style={[
          styles.primaryButton,
          styles.actionButton,
          requestDisabled
            ? styles.primaryButtonDisabled
            : resolve
            ? styles.successButton
            : null,
        ]}
      >
        {resolve ? <EyeIcon /> : <AskPermission />}
        <Text
          style={[
            styles.primaryButtonText,
            requestDisabled && styles.primaryButtonTextDisabled,
            { marginLeft: rs(8) },
          ]}
        >
          {resolve ? t('252') : t('225')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          navigation.navigate('GiveDebtUser', {
            qarzoluvchi: user,
            type: type,
          });
        }}
        activeOpacity={0.8}
        style={[styles.primaryButton, styles.actionButton]}
      >
        <AskPermissionNearby />
        <Text
          style={[styles.primaryButtonText, { marginLeft: rs(8) }]}
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
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    paddingBottom: rs(40),
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
  userName: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  userDetail: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginTop: rs(4),
  },
  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(16),
  },
  statusText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(4),
  },
});
