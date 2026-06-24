import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { BackGroundIcon } from '../../helper/homeIcon';
import { style } from '../../theme/style';
import { useNavigation, useRoute } from '@react-navigation/native';
import Loading from '../components/Loading';
import { URL } from '../constants';
import axios from 'axios';
// import TextInputMask from 'react-native-text-input-mask';
import { storage } from '../../store/api/token/getToken';

import OtherHeader from '../components/OtherHeader';
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
const { width } = Dimensions.get('window');

const SearchUserScreen = () => {
  const { type } = useRoute().params;
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

  return (
    <View style={styles.container}>
      <View
        style={{
          width: style.width,
          position: 'absolute',
          height: style.height / 3,
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('267')} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          {searchForm == false ? (
            error === false &&
            loading === false &&
            data?.success && (
              <UserInfo user={data?.user} navigation={navigation} type={type} />
            )
          ) : (
            <View style={styles.main}>
              <View style={styles.aboutUsContainer}>
                <View
                  style={{
                    width: '100%',
                    alignSelf: 'center',
                    marginVertical: 20,
                  }}
                >
                  <View style={{ alignSelf: 'center' }}>
                    <View style={styles.TextInputLabelContainer}>
                      <View
                        style={[styles.inputTitle, { flexDirection: 'row' }]}
                      >
                        <MainText size={fontSize[12]}>{t('210')}</MainText>
                        <Popover
                          popoverStyle={{ borderRadius: 10 }}
                          displayArea={{
                            x: 50,
                            y: 150,
                            width: 300,
                            height: 250,
                          }}
                          placement={Placement.BOTTOM}
                          // placement={Placement.BOTTOM}
                          from={
                            <TouchableOpacity style={{ marginLeft: 5 }}>
                              <QuestionMarkIcon
                                width={20}
                                height={20}
                                color={style.blue}
                              />
                            </TouchableOpacity>
                          }
                        >
                          <View style={{ padding: 10, width: 250 }}>
                            <MainText size={fontSize[11]}>{t('130')}</MainText>
                          </View>
                        </Popover>
                      </View>

                      <View style={{ flex: 1 }}>
                        <MaskedTextInput
                          value={userID}
                          placeholder="100000/AA"
                          autoCapitalize="characters"
                          allowFontScaling={false}
                          onChangeText={(formatted, extracted) => {
                            setUserID(extracted.toUpperCase());
                          }}
                          mask="[000000]{/}[AA]"
                          placeholderTextColor={style.placeHolderColor}
                          keyboardType="default"
                          style={[styles.TextInput, { paddingLeft: 15 }]}
                        />
                      </View>
                    </View>
                    <View style={styles.TextInputLabelContainer}>
                      <View style={styles.inputTitle}>
                        <MainText size={fontSize[12]}>{t('213')}</MainText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity
                          onPress={() => setOpen(!open)}
                          style={styles.button}
                        >
                          <MainText size={fontSize[14]}>
                            {settingDate(date) === settingDate(Date.now()) ? (
                              <MainText
                                color={colors.placeHolderColor}
                                size={fontSize[14]}
                                style={{ opacity: 0.5 }}
                              >
                                {' '}
                                dd.mm.yyyy{' '}
                              </MainText>
                            ) : (
                              settingDate(date)
                            )}
                          </MainText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 20,
                    }}
                  >
                    <TouchableOpacity
                      disabled={userID.length === 9 ? false : true}
                      onPress={SearchUser}
                      activeOpacity={0.8}
                      style={[
                        styles.registerButton,
                        {
                          backgroundColor: (userID.length === 9 ? false : true)
                            ? style.disabledButtonColor
                            : style.blue,
                        },
                      ]}
                    >
                      <MainText color={colors.white} size={fontSize[14]}>
                        {t('216')}
                      </MainText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
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

  return (
    <View style={{ flex: 1, paddingBottom: 10 }}>
      <View style={styles.main}>
        <View style={styles.aboutUsContainer}>
          <View
            style={{ width: '90%', alignSelf: 'center', marginVertical: 20 }}
          >
            <View>
              <View style={[styles.TextInputLabelContainer, { width: '100%' }]}>
                <View style={styles.inputTitle}>
                  <MainText size={fontSize[12]}>{t('fish')}</MainText>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={
                      user?.last_name +
                      ' ' +
                      user.first_name +
                      ' ' +
                      user.middle_name
                    }
                    multiline={true}
                    placeholderTextColor={style.placeHolderColor}
                    editable={false}
                    allowFontScaling={false}
                    keyboardType="default"
                    style={[
                      styles.TextInput,
                      {
                        paddingLeft: 15,
                        paddingTop: 18,
                        paddingBottom: 18,
                        fontSize: fontSize[12],
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={[styles.TextInputLabelContainer, { width: '100%' }]}>
                <View style={styles.inputTitle}>
                  <MainText size={fontSize[12]}>{t('120')}</MainText>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    placeholderTextColor={style.placeHolderColor}
                    value={user?.uid}
                    multiline={true}
                    editable={false}
                    allowFontScaling={false}
                    keyboardType="default"
                    style={[
                      styles.TextInput,
                      {
                        paddingLeft: 15,
                        width: '100%',
                        paddingTop: 18,
                        paddingBottom: 18,
                        fontSize: fontSize[12],
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View>
              <MainText mTop={10} size={fontSize[12]}>
                {resolve
                  ? t('246')
                  : reject
                  ? t('258')
                  : !active
                  ? t('219')
                  : t('231')}
              </MainText>
              <TouchableOpacity
                disabled={active && first}
                onPress={() => {
                  startTimer();
                }}
                activeOpacity={0.8}
                style={[
                  styles.getUserInfoButton,
                  {
                    backgroundColor:
                      active && first
                        ? style.disabledButtonColor
                        : resolve
                        ? '#48BB78'
                        : style.blue,
                    flexDirection: 'row',
                  },
                ]}
              >
                {resolve ? <EyeIcon /> : <AskPermission />}
                <MainText color={colors.white} mrLeft={8} size={fontSize[12]}>
                  {resolve ? t('252') : t('225')}
                </MainText>
              </TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('GiveDebtUser', {
                    qarzoluvchi: user,
                    type: type,
                  });
                }}
                activeOpacity={0.8}
                style={[styles.getUserInfoButton, { flexDirection: 'row' }]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '85%',
                    paddingHorizontal: 10,
                    alignSelf: 'center',
                  }}
                >
                  <AskPermissionNearby />
                  <View style={{ marginLeft: 4 }}>
                    <Text
                      style={[
                        styles.textButton,
                        {
                          fontSize: fontSize[12],
                          flexWrap: 'wrap',
                          textAlign: 'center',
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      {type === 1 ? t('222') : t('288')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      {/* <Toast config={toastConfig} /> */}
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
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  dateText: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
    textAlign: 'center',
  },
  registerButton: {
    width: '90%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tix: {
    fontSize: style.fontSize.xa + 1,
    fontFamily: style.fontFamilyMedium,
    marginTop: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 23,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  TextInput: {
    paddingVertical: 18,
    width: '90%',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
    fontSize: fontSize[14],
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    textTransform: 'uppercase',
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
  getUserInfoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginTop: 10,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
    marginTop: 20,
  },
  title: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyBold,
    color: style.textColor,
  },

  main: {
    flex: 1,
    marginBottom: 300,
    width: '90%',
    alignSelf: 'center',
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
    marginBottom: 10,
  },
});
