import { FlatList, RefreshControl, StyleSheet, View, Text } from 'react-native';
import { LIST_PERF_PROPS } from '../../helper/listPerf';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import TopTabBar from '../../navigation/TopTabBar';
import NewsNotificationCard from '../components/NewsNotification';
import { useDispatch, useSelector } from 'react-redux';
import Qarzdanvozkechilganligitogrisida from './notifications/all/Qarzdanvozkechilganligitogrisida';
import QarzShartnomasiniRasmiylashtirishTogrisida from './notifications/all/QarzShartnomasiniRasmiylashtirishTogrisida';
import Qarzmuddatiuzaytirilganligitogrisida from './notifications/all/Qarzmuddatiuzaytirilganligitogrisida';
import QarzToliqQaytarilganli from './notifications/all/QarzToliqQaytarilganli';
import Qarzniqaytarishtalabqilinganligitogrisida from './notifications/all/Qarzniqaytarishtalabqilinganligitogrisida';
import Qarzqismanqaytarilganli from './notifications/all/Qarzqismanqaytarilganli';
import Qarzmuddatiniuzaytirishsoralganligitogrisida from './notifications/all/Qarzmuddatiniuzaytirishsoralganligitogrisida';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

import { filter_notification } from '../../store/reducers/HomeReducer';
import Qarzniqaytarishqabulqilinmaganligitogrisida from './notifications/all/Qarzniqaytarishqabulqilinmaganligitogrisida';
import QarzniQaytarishQabulQilinganligiTogrisida from './notifications/all/QarzniQaytarishQabulQilinganligiTogrisida';
import QarzShartnomasiningRadQilinganligiTogrisida from './notifications/all/QarzShartnomasiningRadQilinganligiTogrisida';
import QarzShartnomasiningQabulQilinganligiTogrisida from './notifications/all/QarzShartnomasiningQabulQilinganligiTogrisida';
import QarzMuddatiniUzaytirishRadEtilganligiTogrisida from './notifications/all/QarzMuddatiniUzaytirishRadEtilganligiTogrisida';
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import QarzShartnomasiRuxsatSorash from './notifications/all/QarzShartnomasiRuxsatSorash';
import QarzniQaytarishRadQilinganligi from './notifications/all/QarzniQaytarishRadQilinganligi';
import RdHeader from './redesign/RdHeader';
import { BellIcon, NewsIcon } from './redesign/icons';
import { rd, rs } from '../../theme/rd';
import QarzShartnomasiRejectTime from './notifications/all/QarzShartnomasiRejectTime';
import PulMablagOtkazilganligi from './notifications/all/PulMablagOtkazilganligi';
import PulMablagOtkazilganligiHaqida from './notifications/all/PulMablagOtkazilganligiHaqida';
import { toastMessage } from '../../helper';
import {
  getCreditorDataAndDebitorData,
  getNotificationWithPage,
  HomeApi,
} from '../../store/api/home';
import NewUser from './notifications/all/NewUser';
import RecoveryPassword from './notifications/all/RecoveryPassword';
import QarzniMuddatUzaytirishQabul from './notifications/all/QarzniMuddatUzaytirishQabul';
import MalumotniKorishgaRadEtildi from './notifications/all/MalumotniKorishgaRadEtildi';
import MalumotniKorishgaRuxsatBerildi from './notifications/all/MalumotniKorishgaRuxsatBerildi';

import { t } from 'i18next';
import socketService from '../../helper/socketService';

import Eslatma from './notifications/all/Eslatma';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import ExpirePassport from './notifications/all/Expire_Passport';
// SS8: Gap uchrashuviga taklif (type = 40)
import GapTaklif from './notifications/all/GapTaklif';
// SS20: Shaxsiy moliya faolsizlik eslatmasi (3 kun kiritilmadi).
import MoliyaEslatma from './notifications/all/MoliyaEslatma';

type ObjType = {
  act: string;
  contract: string;
  creditor: string;
  debitor: string;
  reciver: string;
  stype: number;
  sender?: string;
  res?: string;
};

// Qo'ng'iroqcha "jiringlaydi" — chapga-o'ngga tebranish (bo'sh bildirishnoma holati).
const RingingBell = () => {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 110 }),
        withTiming(-1, { duration: 220 }),
        withTiming(0.6, { duration: 180 }),
        withTiming(-0.4, { duration: 150 }),
        withTiming(0, { duration: 110 }),
        withDelay(1500, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );
  }, [rot]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 14}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <BellIcon size={rs(34)} color={rd.color.primary} />
    </Animated.View>
  );
};

// Professional bo'sh holat. news=true -> yangiliklar ikonkasi; aks holda jiringlovchi qo'ng'iroq.
const RdEmpty = ({ text, news }: { text: string; news?: boolean }) => (
  <View style={styles.rdEmpty}>
    <View style={styles.rdEmptyCircle}>
      {news ? (
        <NewsIcon size={rs(34)} color={rd.color.primary} />
      ) : (
        <RingingBell />
      )}
    </View>
    <Text allowFontScaling={false} style={styles.rdEmptyText}>
      {text}
    </Text>
  </View>
);

const TopTab = createMaterialTopTabNavigator();
const Notification = () => {
  return (
    <View style={styles.rdContainer}>
      <RdHeader title={t('666')} />
      <View style={styles.rdBody}>
        <TopTab.Navigator
          tabBar={props => <TopTabBar {...props} />}
          screenOptions={{ sceneStyle: { backgroundColor: rd.color.page } }}
        >
          <TopTab.Screen
            options={{ tabBarLabel: t('666') }}
            name="Bildrishnoma"
            component={Bildrishnoma}
          />
          <TopTab.Screen
            options={{ tabBarLabel: t('669') }}
            name="News"
            component={News}
          />
        </TopTab.Navigator>
      </View>
    </View>
  );
};

const News = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // const onRefresh = useCallback(() => {
  //   setLoading(true);
  //   dispatch(onGetNews())
  //     .then(res => {
  //       setData(res?.payload?.news || []);
  //       setLoading(false);
  //     })
  //     .catch(_err => {
  //       setLoading(false);
  //       navigation.reset({routes: [{name: 'LoginWithPhone'}], index: 0});
  //     });
  // }, [dispatch, navigation]);

  // useEffect(() => {
  //   setLoading(true);
  //   dispatch(onGetNews())
  //     .then(res => {
  //       setData(res?.payload?.news || []);
  //       setLoading(false);
  //     })
  //     .catch(_err => {
  //       setLoading(false);
  //       navigation.reset({routes: [{name: 'LoginWithPhone'}], index: 0});
  //     });
  // }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        keyExtractor={({ id }) => id?.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: rs(16), paddingBottom: rs(16) }}
        ListEmptyComponent={<RdEmpty text={t('Yangiliklar mavjud emas')} news />}
        renderItem={({ item, index }) => {
          return <NewsNotificationCard data={item} key={index} />;
        }}
      />
    </View>
  );
};
const Bildrishnoma = () => {
  const listRef = useRef(null);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch<any>();
  const { user, pagination } = useSelector(state => state?.HomeReducer);

  const [uzayloadinLoading, setUzayloadinLoading] = useState(false);

  const notificationData = useSelector(
    state => state?.HomeReducer?.notification,
  );

  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const onRefresh = useCallback(() => {
    // Oldin `page <= pagination?.totalPage` gate'i bor edi; backend /me javobida
    // pagination yo'q → totalPage 0 → `1 <= 0` false → refresh HECH QACHON ishlamasdi.
    // Gate olib tashlandi; async thunk reject'ini to'g'ri ushlash uchun .unwrap().
    setLoading(true);
    dispatch(getNotificationWithPage({ page: 1 }))
      .unwrap()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  // Spinner KO'RSATMAY yangilash — real-time push kelganda ro'yxatni jimgina
  // yangilaydi (pull-to-refresh aylanasi chaqnamaydi).
  const silentRefresh = useCallback(() => {
    dispatch(getNotificationWithPage({ page: 1 }))
      .unwrap()
      .catch(() => {});
  }, [dispatch]);

  // ITEM 9 — REAL-TIME bildirishnomalar (web ↔ mobil, refresh-siz).
  // Global socketService handler'i (`reciveNotification`) Redux'ni yangilaydi va
  // `Bildrishnoma` useSelector orqali unga ulangan, lekin ba'zi holatlarda
  // (appState poygasi, uzun-turgan ekran, socket qayta-ulanishi) UI kechikardi.
  // Bu ekran-darajali listener `recive_notification` kelishi bilan serverdan eng
  // so'nggi ro'yxatni KAFOLATLI tortib oladi — foydalanuvchi hech nima bosmasdan
  // yangi bildirishnomani darhol ko'radi. Ekrandan chiqilganda tozalanadi.
  useEffect(() => {
    // Ekran ochilishida bir marta yangilaymiz (Redux eskirgan bo'lishi mumkin).
    silentRefresh();

    const onLive = () => silentRefresh();
    socketService.on('recive_notification', onLive);

    // Ekran ochiq — realtime shart. Socket uzilgan bo'lsa qayta ulanamiz.
    const s = socketService.getSocket();
    if (s && !s.connected) {
      s.connect();
    }

    return () => {
      socketService.off('recive_notification', onLive);
    };
  }, [silentRefresh]);

  // Notoficationni o'chirish
  const okay = useCallback(
    async (idx, type) => {
      const token = storage.getString('token');
      try {
        dispatch(filter_notification(idx));
        const info = await axios.put(
          URL + `/notification/ok/${idx}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (info?.status === 200) {
          socketService.emit('notification', { userId: user?.data?.id });
          // socketService.on('notification', data => {
          //   console.log('socket in notifcation', data);
          //   dispatch(setNotification({notification: data.not}));
          //   // dispatch(getNotifications({page: 1}));
          // });

          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { desc: toastMessage(type) },
            type: 'omad',
            visibilityTime: 2000,
          });
        }
      } catch (error) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: { desc: t('Xatolik sodir bo‘ldi') },
          type: 'error2',
          visibilityTime: 2000,
        });
      }
    },
    // C-020: `user` qo'shildi — oldin `[dispatch]` edi, lekin user?.data?.id o'qiladi.
    // user yangilansa (login/meee) stale qiymat socketga yuborilardi.
    [user, dispatch],
  );
  const onSuccess = useCallback(async (item, status, type) => {
    const token = storage.getString('token');

    const onAsk = async () => {
      const obj: ObjType = {
        act: '',
        contract: '',
        creditor: '',
        debitor: '',
        reciver: '',
        stype: 0,
      };

      if (type === 'creditor') {
        obj.act = item.act;
        obj.contract = item.contract;
        obj.creditor = item.creditor;
        obj.debitor = item.debitor;
        obj.reciver = item.creditor;
        obj.stype = status;
        obj.sender =
          user?.data?.id === item.debitor ? item.creditor : item.debitor;
        obj.res = user?.data?.id;
      } else {
        obj.act = item.act;
        obj.contract = item.contract;
        obj.creditor = item.creditor;
        obj.debitor = item.debitor;
        obj.reciver = item.debitor;
        obj.stype = status;
      }

      try {
        const { data } = await axios.put(
          URL + `/notification/success/${item.id}`,
          obj,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (data.success) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: {
              desc: t('264'),
            },
            type: 'omad',
            visibilityTime: 3000,
          });

          // socketService.sendNotification({
          //   id: type === 'debitor' ? item.debitor : item.creditor,
          // });
          // socketService.on('notification', data => {
          //   dispatch(setNotification({notification: data.not}));
          //   dispatch(getMe());
          // });

          dispatch(getCreditorDataAndDebitorData());
          dispatch(filter_notification(item.id));
        }
      } catch (error) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: {
            desc: t('294'),
          },
          type: 'error2',
          visibilityTime: 3000,
        });
        // SS-AUDIT (2026-09-25): to'liq axios xatosi (config.headers.Authorization —
        // token!) logga yozilmasin, faqat xabar.
        console.error('notification ask error:', error?.message);
      }
    };

    try {
      await onAsk();
    } catch (error) {
      console.error('notification ask error:', (error as any)?.message);
      Toast.show({
        autoHide: true,
        position: 'bottom',
        props: {
          desc: t('294'),
        },
        type: 'error2',
        visibilityTime: 3000,
      });
    }
    // C-020: `user` qo'shildi — oldin `[]` edi, lekin onAsk ichida user?.data?.id
    // `sender`/`res` (moliyaviy) uchun o'qiladi. Stale user → noto'g'ri qarz amali.
  }, [user, dispatch]);
  const onReject = useCallback(
    async (item, status, type) => {
      const token = storage.getString('token');
      dispatch(filter_notification(item.id));
      let obj;
      if (type === 1) {
        obj = {
          debitor: item.debitor,
          creditor: item.creditor,
          act: item.act,
          contract: item.contract,
          stype: status,
          reciver: item.creditor,
          sender: user.data.id == item.debitor ? item.creditor : item.debitor,
          res: user.data.id,
        };
      }
      if (type === 2) {
        obj = {
          debitor: item.debitor,
          creditor: item.creditor,
          act: item.act,
          contract: item.contract,
          stype: status,
          reciver: item.debitor,
        };
      }

      try {
        const { data } = await axios.put(
          URL + `/notification/success/${item.id}`,
          obj,
          // {
          //   // act: item.act,
          //   // contract: item.contract,
          //   // creditor: item.creditor,
          //   // debitor: item.debitor,
          //   // // reciver: type === 'creditor' ? item.creditor : item.debitor,
          //   // reciver: item.creditor,
          //   // stype: status,
          //   // sender:
          //   //   user?.data?.id === item.debitor ? item.creditor : item.debitor,
          //   // res: user?.data?.id,
          // },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (data.success) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { desc: t('261') },
            type: 'error2',
            visibilityTime: 3000,
          });
        }
        // socketService.emit('notification', {userId: user?.data?.id});
        // socketService.sendNotification({
        //   id: type === 'creditor' ? item.creditor : item.debitor,
        // });
      } catch (error) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: { desc: t('Xatolik sodir bo‘ldi') },
          type: 'error2',
          visibilityTime: 3000,
        });
      }
    },
    [user, dispatch],
  );
  const onQismanQaytarilgan = async (item, status) => {
    const token = storage.getString('token');

    try {
      const { data } = await axios.post(
        URL + `/notification/qisman-qaytarish/${item.id}`,
        {
          act: item.act,
          contract: item.contract,
          creditor: item.creditor,
          debitor: item.debitor,
          reciver: item.reciver === item.debitor ? item.creditor : item.debitor,
          stype: status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: {
            desc: status === 1 ? t('264') : t('261'),
          },
          type: status === 1 ? 'omad' : 'error2',
          visibilityTime: 3000,
        });
        dispatch(filter_notification(item.id));
      }
      // socketService.sendNotification({
      //   id: item.reciver === item.debitor ? item.creditor : item.debitor,
      // });
    } catch (error) {
      Toast.show({
        autoHide: true,
        position: 'bottom',
        props: { desc: t('Xatolik sodir bo‘ldi') },
        type: 'error2',
        visibilityTime: 3000,
      });
    }
  };
  const onToliqQaytgan = async (item, status) => {
    const token = storage.getString('token');

    try {
      const { data } = await axios.post(
        URL + `/notification/toliq-qaytarish/${item.id}`,
        {
          act: item.act,
          contract: item.contract,
          creditor: item.creditor,
          debitor: item.debitor,
          reciver: item.reciver === item.debitor ? item.creditor : item.debitor,
          stype: status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (data.success) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: {
            desc: status === 1 ? t('264') : t('261'),
          },
          type: status === 1 ? 'omad' : 'error2',
          visibilityTime: 3000,
        });
        dispatch(filter_notification(item.id));
        dispatch(HomeApi({ page: 1 }));
      }
      // socketService.sendNotification({
      //   id: item.reciver === item.debitor ? item.creditor : item.debitor,
      // });
    } catch (error) {
      Toast.show({
        autoHide: true,
        position: 'bottom',
        props: { desc: t('Xatolik sodir bo‘ldi') },
        type: 'error2',
        visibilityTime: 3000,
      });
    }
  };
  const onQarzMuddatUzaytirish = async (item, status) => {
    const token = storage.getString('token');

    try {
      const info = await axios.post(
        URL + `/notification/time/${item.id}`,
        {
          debitor: item.debitor,
          creditor: item.creditor,
          contract: item.contract,
          stype: status,
          act: item.act,
          reciver: item.reciver !== item.debitor ? item.debitor : item.creditor,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (info.data.success) {
        if (status == 1) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { desc: t('264') },
            type: 'omad',
            visibilityTime: 3000,
          });
        }
        if (status == 2) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { desc: t('261') },
            type: 'error2',
            visibilityTime: 3000,
          });
        }

        dispatch(filter_notification(item.id));
        dispatch(getCreditorDataAndDebitorData());

        // socketService.sendNotification({
        //   id: item.reciver !== item.debitor ? item.debitor : item.creditor,
        // });
        // socketService.emit('notification', user?.data?.id);
        // socketService.on('notification', data => {
        //   dispatch(setNotification({notification: data.not}));
        // });
      }
    } catch (error) {
      Toast.show({
        autoHide: true,
        position: 'bottom',
        props: { desc: t('Xatolik sodir bo‘ldi') },
        type: 'error2',
        visibilityTime: 3000,
      });
    }
  };

  // C-020: avval useCallback([]) edi — render-1 dagi okay/onSuccess/onReject/user ni
  // ushlab qolardi (stale). Inline chaqiriladi (memoized prop emas), shuning uchun plain
  // funksiya: har render'da yangi (to'g'ri) handler/user bilan ishlaydi.
  const renderItems = (item, index) => {
    switch (item?.type) {
      //buldi bi batafsil qoldi
      case 0:
        return (
          <QarzShartnomasiniRasmiylashtirishTogrisida
            item={item}
            okay={okay}
            navigation={navigation}
            onSuccess={onSuccess}
            onReject={onReject}
          />
        );
      case 1:
        return (
          <QarzToliqQaytarilganli
            item={item}
            okay={okay}
            navigation={navigation}
            onToliqQaytgan={onToliqQaytgan}
            onQismanQaytarilgan={onQismanQaytarilgan}
          />
        );
      case 4:
        return (
          <Qarzdanvozkechilganligitogrisida
            item={item}
            okay={okay}
            navigation={navigation}
          />
        );
      case 2:
        return (
          <Qarzqismanqaytarilganli
            item={item}
            okay={okay}
            navigation={navigation}
            onToliqQaytgan={onToliqQaytgan}
          />
        );
      case 3:
        return (
          <Qarzmuddatiniuzaytirishsoralganligitogrisida
            item={item}
            okay={okay}
            navigation={navigation}
            onQarzMuddatUzaytirish={onQarzMuddatUzaytirish}
            reject={onReject}
          />
        );
      case 17:
        return (
          <Qarzniqaytarishtalabqilinganligitogrisida
            item={item}
            okay={okay}
            navigation={navigation}
          />
        );

      //buldi bi
      case 16:
        return (
          <Qarzmuddatiuzaytirilganligitogrisida
            item={item}
            okay={okay}
            navigation={navigation}
          />
        );
      case 12:
        return (
          <Qarzmuddatiuzaytirilganligitogrisida
            item={item}
            okay={okay}
            navigation={navigation}
          />
        );
      case 9:
        return (
          <Qarzniqaytarishqabulqilinmaganligitogrisida
            item={item}
            okay={okay}
            navigation={navigation}
          />
        );
      case 15:
        return (
          <Qarzniqaytarishqabulqilinmaganligitogrisida
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 10:
        return (
          <QarzniQaytarishQabulQilinganligiTogrisida
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 7:
        return (
          <QarzShartnomasiningRadQilinganligiTogrisida
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 8:
        return (
          <QarzShartnomasiningQabulQilinganligiTogrisida
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 13:
        return (
          <QarzMuddatiniUzaytirishRadEtilganligiTogrisida
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 11:
        return (
          <QarzniQaytarishQabulQilinganligiTogrisida
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );

      case 22:
        return (
          <QarzniQaytarishRadQilinganligi
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 21:
        return (
          <QarzShartnomasiRejectTime
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 24:
        return (
          <PulMablagOtkazilganligi
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 23:
        return (
          <PulMablagOtkazilganligiHaqida
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 25:
        return (
          <NewUser item={item} navigation={navigation} okay={okay} />
        );
      case 26:
        return (
          <RecoveryPassword
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 27:
        return (
          <QarzniMuddatUzaytirishQabul
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );

      case 19:
        return (
          <QarzShartnomasiRuxsatSorash
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 31:
        return (
          <MalumotniKorishgaRadEtildi
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 30:
        return (
          <MalumotniKorishgaRuxsatBerildi
            item={item}
            navigation={navigation}
            okay={okay}
          />
        );
      case 32:
        return (
          <Eslatma item={item} navigation={navigation} okay={okay} />
        );

      case 35:
        return <ExpirePassport item={item} okay={okay} />;
      // SS8: Gap uchrashuviga taklif — lokatsiya, borish/bormaslik, karta, summa.
      case 40:
        return <GapTaklif item={item} okay={okay} navigation={navigation} />;
      // SS20: Shaxsiy moliya — 3 kun daromad/xarajat kiritilmadi.
      case 41:
        return <MoliyaEslatma item={item} okay={okay} navigation={navigation} />;
      default:
        return <Text>{t('Xatolik sodir bo‘ldi')}</Text>;
    }
  };

  const EmptyListComponent = () => (
    <RdEmpty text={t('Bildirishnomalar mavjud emas')} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: rd.color.page }}>
      <Animated.FlatList
        ref={listRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: rs(16), paddingBottom: rs(16) }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={rd.color.primary} />
        }
        // itemLayoutAnimation={LinearTransition}
        keyExtractor={item => item.id?.toString()}
        ListEmptyComponent={EmptyListComponent}
        data={notificationData?.bild}
        onEndReachedThreshold={0.5}
        // SS-PERF (2026-09-25): 500 tagacha bildirishnoma — virtualizatsiya oynasi
        // cheklandi (ilgari default: 21 ekran oynasi, 50 ta boshlang'ich).
        {...LIST_PERF_PROPS}
        initialNumToRender={8}
        // renderItem={renderItems}
        renderItem={({ item, index }) => renderItems(item, index)}
      />
    </View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  rdContainer: { flex: 1, backgroundColor: rd.color.page },
  rdBody: { flex: 1, paddingTop: rs(8) },
  rdEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: rs(60), gap: rs(14) },
  rdEmptyCircle: {
    width: rs(84),
    height: rs(84),
    borderRadius: rs(42),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rdEmptyText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textTertiary, textAlign: 'center' },
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },

});
