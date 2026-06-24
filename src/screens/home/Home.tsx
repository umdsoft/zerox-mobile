import {
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { normalize, style } from '../../theme/style';
import BackGroundIcon from '../../images/Background';
import { useNavigation } from '@react-navigation/native';
import Card from '../components/Card';
import BerilganQarzIcon from '../../images/home/QarzOlganIcon.svg';
import MuddatUtganPlus from '../../images/home/MuddatUtgan+.svg';
import MuddatUtganMinus from '../../images/home/MuddatUtgan-.svg';
import OlinganQarz from '../../images/home/OlingaQarz.svg';
import HourGlass from '../../images/HourGlass';

import { useDispatch, useSelector } from 'react-redux';
import {
  HomeApi,
  getNotificationWithPage,
  getNotifications,
  getVersionAction,
} from '../../store/api/home';
import Loading from '../components/Loading';
import { useTranslation } from 'react-i18next';
import { getVersion } from 'react-native-device-info';
import Chart from '../components/Chart';
import {
  checkExpire,
  checkUpdate,
  contractModalShow,
  setNotification,
  showModal,
} from '../../store/reducers/HomeReducer';
import MainText from '../components/MainText';
import { font, fontSize } from '../../theme/font';
import { colors } from '../../theme/colors';
import { storage } from '../../store/api/token/getToken';
import socketService from '../../helper/socketService';
import notifee from '@notifee/react-native';
import { NotificationBadgeModule } from '../../nativemodule/notificationBadge';

const { width } = Dimensions.get('window');
const Home = () => {
  const scrollRef = useRef(null);
  const scrollRef1 = useRef(null);
  // useRef — har render'da yangi Animated.Value yaratilmasin (animatsiya reset bo'lmaydi).
  const scrollX = useRef(new Animated.Value(0)).current;
  const position = useRef(Animated.divide(scrollX, normalize(width))).current;
  const navigation = useNavigation();
  const { loading, error, home, user } = useSelector(
    state => state.HomeReducer,
  );
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const getHome = useCallback(async () => {
    try {
      dispatch(HomeApi({ page: 1 }))
        .then(res => {
          const us = res?.payload?.user;
          storage.set('uid', us.data.uid);
          if (us === undefined) {
            if (Platform.OS === 'ios') {
              notifee.setBadgeCount(0).then(() => {
                console.log('Badge count set successfully');
              });
            } else {
              NotificationBadgeModule.setBadgeOnlyNumber(0);
            }
            navigation.reset({
              routes: [{ name: 'LoginWithPhone' }],
              index: 0,
            });
            return;
          }
          if (us?.data?.is_active === 2) {
            dispatch(showModal({ show: true }));
          } else {
            dispatch(
              getVersionAction({
                type: Platform.OS === 'ios' ? 'ios' : 'android',
              }),
            ).then(ss => {
              const data = ss?.payload?.data?.data;

              storage.set('version', data?.version);

              if (data?.version != getVersion()) {
                dispatch(checkUpdate({ update: true }));
                return;
              }
              if (us?.data?.is_contract === 0 && us?.data?.is_active === 1) {
                dispatch(contractModalShow({ show: true }));
              }

              if (us?.data?.expiry_date) {
                const today = new Date();
                const expireDate = new Date(us?.data?.expiry_date);
                const timeDiff = expireDate.getTime() - today.getTime();
                const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                console.log(dayDiff, 'daydiff');
                if (dayDiff <= 1) {
                  dispatch(checkExpire({ expire: true }));
                }
              }

              // socketService.initSubscribeWithId(us.data.id);
              dispatch(getNotificationWithPage({ page: 1 }));
              // socketService.emit('notification', us.data.id);

              // socketService.on('notification', data => {
              //   dispatch(setNotification({notification: data.not}));
              // });
              if (socketService.connected() === 'Offline') {
                socketService.init(us.data.id);
                socketService.getSocket()?.connect();
              }
              // postDeviceId();
            });
          }
        })
        .catch(() => {
          if (Platform.OS === 'ios') {
            notifee.setBadgeCount(0).then(() => {});
          } else {
            NotificationBadgeModule.setBadgeOnlyNumber(0);
          }
          storage.clearAll();
          navigation.reset({ routes: [{ name: 'LoginWithPhone' }], index: 0 });
        });
    } catch (errorr) {
      if (Platform.OS === 'ios') {
        notifee.setBadgeCount(0).then(() => {});
      } else {
        NotificationBadgeModule.setBadgeOnlyNumber(0);
      }
      storage.clearAll();
      navigation.reset({ routes: [{ name: 'LoginWithPhone' }], index: 0 });
      throw errorr;
    }
  }, [navigation]);

  // const postDeviceId = useCallback(async () => {
  //   const idx = await getUniqueId();
  //   const date = new Date();
  //   const bb = date.toISOString().slice(0, 19).replace('T', ' ');
  //   const obj = new Object();
  //   obj.device_id = idx;
  //   obj.os_type = getBrand();
  //   obj.system_version = getSystemVersion();
  //   obj.ip_address = await getIpAddress();
  //   obj.device_name = getModel();
  //   obj.active = 1;
  //   obj.last_time = bb;
  //   const response = await axios.get('https://ipapi.co/json');
  //   obj.location = `${response.data.region}, ${response.data.country_name}`;
  //   obj.user_id = user?.data?.id;

  //   const firstTime = storage.getBoolean('firsttime');

  //   if (firstTime === undefined) {
  //     // console.log('asdasdsad');
  //     // dispatch(postDeviceIdAction(obj))
  //     //   .then(mmm => {
  //     //     console.log(mmm, 'mmmmmmmm');
  //     //     storage.set('firsttime', false);
  //     //     getDevices();
  //     //   })
  //     //   .catch(er => {
  //     //     console.error(er, 'errrr');
  //     //   });
  //   } else {
  //     getDevices();
  //   }
  // }, []);

  // const getDevices = useCallback(async () => {
  //   try {
  //     const idx = await getUniqueId();
  //     const value = await dispatch(getDevicesAction()).unwrap();

  //     const c = value.data.data.some(devices => devices.device_id === idx);

  //     if (!c) {
  //       console.warn('login back screen');
  //       // navigation.reset({
  //       //   routes: [{name: 'LoginWithPhone'}],
  //       //   index: 0,
  //       // });
  //     }
  //     // eslint-disable-next-line no-catch-shadow
  //   } catch (errorr) {
  //     throw errorr;
  //   }
  // }, []);

  // const getSomeNotification = useCallback(() => {
  //   socketService.on('notification', data => {
  //     console.log('rennnnnder socket');
  //     // dispatch(setNotification({notification: data.not}));
  //     // dispatch(getNotifications({page: 1}));
  //     dispatch(HomeApi({page: 1}));
  //     dispatch(getCreditorDataAndDebitorData());
  //     dispatch(getMe());
  //     // dispatch(setNotification({notification: data.not}));
  //   });
  // }, [dispatch]);

  useEffect(() => {
    getHome();
  }, [getHome]);

  useEffect(() => {
    if (scrollRef.current) {
      // last item
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  // useEffect(() => {
  //   getSomeNotification();
  // }, [getSomeNotification]);

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          backgroundColor: '#fff',
        }}
      >
        <Text style={{ color: 'red' }} allowFontScaling={false}>
          {JSON.stringify(error)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backImage}>
        <BackGroundIcon width="100%" height={normalize(200)} />
      </View>
      <View style={styles.header}>
        <ScrollView
          ref={scrollRef1}
          refreshControl={
            <RefreshControl
              tintColor="#fff"
              refreshing={refreshing}
              onRefresh={async () => {
                // Haqiqiy so'rovni KUTAMIZ (oldin 2s fixed timer edi — so'rov tugamasdan
                // spinner o'chishi yoki ortiqcha kutish mumkin edi).
                setRefreshing(true);
                try {
                  await (dispatch(HomeApi({ page: 1 })) as any).unwrap();
                } catch (e) {
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View>
              <ScrollView
                ref={scrollRef}
                showsHorizontalScrollIndicator={false}
                pagingEnabled={true}
                horizontal
                scrollEventThrottle={16}
                contentOffset={{ x: width }}
                contentContainerStyle={{ paddingRight: 10 }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false },
                )}
              >
                <View style={[styles.appInfoMainContainer, { marginLeft: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <MainText
                      textAlign={'center'}
                      mTop={8}
                      color={colors.blue}
                      size={fontSize[14]}
                      ft={font.bold}
                    >
                      {t('138')}
                    </MainText>
                    <Chart
                      data={home?.debitor?.data?.chart}
                      title="Debitor shartnomalar"
                    />
                  </View>

                  {/* <Slider /> */}
                </View>
                <View style={[styles.appInfoMainContainer, { marginLeft: 5 }]}>
                  <View style={{ flex: 1 }}>
                    <MainText
                      textAlign={'center'}
                      mTop={8}
                      color={colors.blue}
                      size={fontSize[14]}
                      ft={font.bold}
                    >
                      {t('141')}
                    </MainText>
                    <Chart
                      data={home?.creditor?.data?.chart}
                      title="Debitor shartnomalar"
                    />
                  </View>
                </View>
              </ScrollView>
              <View
                style={{
                  position: 'absolute',
                  alignSelf: 'center',
                  bottom: 0,
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                {[1, 2].map((_, i) => {
                  let opacity = position.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      key={i.toString()}
                      style={{
                        opacity,
                        height: 8,
                        width: 8,
                        backgroundColor: style.blue,
                        margin: 5,
                        borderRadius: 20,
                      }}
                    />
                  );
                })}
              </View>
            </View>
            <View style={{ flex: 1, marginTop: 20, paddingHorizontal: 10 }}>
              <View style={[styles.cardViewContainer, { marginTop: 0 }]}>
                <View>
                  <Card
                    data={home?.debitor?.data?.data}
                    width={style.width / 2.3}
                    title={t('153')}
                    Icon={OlinganQarz}
                    type={0}
                    color={style.blue}
                    isHave={true}
                    person="debitor"
                    url={
                      '/contract/return?type=debitor&page=1&limit=500&start=0&end=0'
                    }
                    searchUrl={
                      '/contract/return?type=debitor&page=1&limit=500&search='
                    }
                    iconType={1}
                  />
                </View>
                <View>
                  <Card
                    data={home?.creditor?.data?.data}
                    width={style.width / 2.3}
                    title={t('156')}
                    Icon={BerilganQarzIcon}
                    type={2}
                    isHave={true}
                    person="creditor"
                    searchUrl={
                      '/contract/return?type=creditor&page=1&limit=500&search='
                    }
                    color={style.blue}
                    url={
                      '/contract/return?type=creditor&page=1&limit=500&start=0&end=0'
                    }
                    iconType={1}
                  />
                </View>
              </View>

              <View style={[styles.cardViewContainer, { marginTop: 30 }]}>
                <View>
                  <Card
                    data={home?.debitor?.data?.expired}
                    width={style.width / 2.3}
                    // title={t('153')}
                    title={t('170')}
                    Icon={MuddatUtganPlus}
                    type={0}
                    isHave={true}
                    person="debitor"
                    color={style.blue}
                    url={
                      '/contract/expired?type=debitor&page=1&limit=500&start=0&end=0'
                    }
                    searchUrl={
                      '/contract/expired?type=debitor&page=1&limit=500&search='
                    }
                    iconType={2}
                  />
                </View>
                <View>
                  <Card
                    data={home?.creditor?.data?.expired}
                    width={style.width / 2.3}
                    // title={t('156')}
                    title={t('170')}
                    Icon={MuddatUtganMinus}
                    type={2}
                    isHave={true}
                    person="creditor"
                    color={style.blue}
                    searchUrl={
                      '/contract/expired?type=creditor&page=1&limit=500&search='
                    }
                    url={
                      '/contract/expired?type=creditor&page=1&limit=500&start=0&end=0'
                    }
                    iconType={2}
                  />
                </View>
              </View>
              <View style={[styles.cardViewContainer, { marginTop: 30 }]}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('MuddatOzQolgan', {
                      creditor: home?.creditor,
                      debitor: home?.debitor,
                      type: 'debitor',
                    });
                  }}
                  activeOpacity={0.8}
                  style={styles.btn}
                >
                  <View style={styles.button}>
                    <View style={{ maxWidth: '85%' }}>
                      <Text style={styles.btnText} allowFontScaling={false}>
                        {t('168')}
                      </Text>
                    </View>
                    <View style={{ marginRight: 15 }}>
                      <HourGlass />
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('MuddatOzQolgan', {
                      creditor: home?.creditor,
                      debitor: home?.debitor,
                      type: 'creditor',
                    });
                  }}
                  activeOpacity={0.8}
                  style={styles.btn}
                >
                  <View style={styles.button}>
                    <View style={{ maxWidth: '85%' }}>
                      <Text style={styles.btnText} allowFontScaling={false}>
                        {t('171')}
                      </Text>
                    </View>
                    <View style={{ marginRight: 15 }}>
                      <HourGlass />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  title: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xx + 1,
    color: style.blue,
    marginLeft: 10,
    marginTop: 10,
    alignSelf: 'center',
  },
  btn: {
    backgroundColor: style.blue,
    width: style.width / 2.3,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 20,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backImage: {
    position: 'absolute',
    height: normalize(185),
    width: '100%',
    backgroundColor: 'red',
  },
  btnText: {
    color: '#fff',
    fontSize: style.fontSize.small - 1,
    fontFamily: style.fontFamilyMedium,
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  shundan: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
  },
  drawer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  DrawerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },

  AlarmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 0.35,
  },
  appInfoContainer: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 10,
    justifyContent: 'center',
  },
  ImageButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  appInfoMainContainer: {
    height: normalize(170),
    backgroundColor: '#fff',
    borderRadius: 15,
    flexDirection: 'row',
    marginTop: 10,
    width: width - 20,
  },
  header: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  appInfoText: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  cardViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  allInfoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: style.StatusbarColor,
    padding: 10,
    width: style.width / 3,
    maxWidth: style.width / 3,
  },
  userButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },

  money: {
    color: style.MoneyColor,
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
  },

  moneyTitle: {
    color: style.textColor,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
  },
});
