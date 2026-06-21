import { FlatList, RefreshControl, StyleSheet, View, Text } from 'react-native';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { BackGroundIcon } from '../../helper/homeIcon';
import { style } from '../../theme/style';
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
import OtherHeader from '../components/OtherHeader';
import QarzShartnomasiRejectTime from './notifications/all/QarzShartnomasiRejectTime';
import PulMablagOtkazilganligi from './notifications/all/PulMablagOtkazilganligi';
import PulMablagOtkazilganligiHaqida from './notifications/all/PulMablagOtkazilganligiHaqida';
import { toastMessage } from '../../helper';
import {
  getCreditorDataAndDebitorData,
  getNotificationWithPage,
  HomeApi,
  onGetNews,
} from '../../store/api/home';
import NewUser from './notifications/all/NewUser';
import RecoveryPassword from './notifications/all/RecoveryPassword';
import QarzniMuddatUzaytirishQabul from './notifications/all/QarzniMuddatUzaytirishQabul';
import MalumotniKorishgaRadEtildi from './notifications/all/MalumotniKorishgaRadEtildi';
import MalumotniKorishgaRuxsatBerildi from './notifications/all/MalumotniKorishgaRuxsatBerildi';
import MainText from '../components/MainText';
import { fontSize } from '../../theme/font';

import { t } from 'i18next';
import socketService from '../../helper/socketService';

import Eslatma from './notifications/all/Eslatma';
import Animated, { LinearTransition } from 'react-native-reanimated';
import ExpirePassport from './notifications/all/Expire_Passport';

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

const TopTab = createMaterialTopTabNavigator();
const Notification = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headers}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('666')} />
      <View style={{ flex: 1 }}>
        <View style={styles.main}>
          <View style={styles.aboutUsContainer}>
            <TopTab.Navigator tabBar={props => <TopTabBar {...props} />}>
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
        contentContainerStyle={{ paddingBottom: 10 }}
        // refreshControl={
        //   <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        // }
        ListEmptyComponent={() => {
          return (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <MainText size={fontSize[12]}> {t('pp1')}</MainText>
            </View>
          );
        }}
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
  const id = useId();
  const { user, pagination } = useSelector(state => state?.HomeReducer);

  const [uzayloadinLoading, setUzayloadinLoading] = useState(false);

  const notificationData = useSelector(
    state => state?.HomeReducer?.notification,
  );

  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const onRefresh = useCallback(() => {
    if (page <= pagination?.totalPage) {
      setLoading(true);
      try {
        dispatch(getNotificationWithPage({ page: 1 }));
        // socketService.on('notification', data => {
        //   dispatch(setNotification({notification: data.not}));
        // });
      } catch (error) {
        setLoading(false);
        navigation.reset({ routes: [{ name: 'LoginWithPhone' }], index: 0 });
      } finally {
        setLoading(false);
      }
    } else {
      console.log('page', page);
    }
  }, [dispatch, navigation, page, pagination?.totalPage]);

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
            props: { title: 'Muvaffaqiyatli', desc: toastMessage(type) },
            type: 'omad',
            visibilityTime: 2000,
          });
        }
      } catch (error) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: { title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi') },
          type: 'error2',
          visibilityTime: 2000,
        });
      }
    },
    [dispatch],
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
        console.log('creditor', obj);
      } else {
        obj.act = item.act;
        obj.contract = item.contract;
        obj.creditor = item.creditor;
        obj.debitor = item.debitor;
        obj.reciver = item.debitor;
        obj.stype = status;
        console.log('debitor', obj);
      }

      try {
        const { data } = await axios.put(
          URL + `/notification/success/${item.id}`,
          obj,
          {
            headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
          },
        );

        if (data.success) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: {
              title: 'Muvaffaqiyatli',
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
            title: 'Xatolik',
            desc: t('294'),
          },
          type: 'error2',
          visibilityTime: 3000,
        });
        console.log('error', JSON.stringify(error, null, 2));
      }
    };

    try {
      await onAsk();
    } catch (error) {
      console.log('error', error);
      Toast.show({
        autoHide: true,
        position: 'bottom',
        props: {
          title: 'Xatolik',
          desc: t('294'),
        },
        type: 'error2',
        visibilityTime: 3000,
      });
    }
  }, []);
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
            headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
          },
        );
        if (data.success) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { title: 'Muvaffaqiyatli', desc: t('261') },
            type: 'omad',
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
          props: { title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi') },
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
          headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
        },
      );
      if (data.success) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: {
            title: 'Muvaffaqiyatli',
            desc: status === 1 ? t('264') : t('261'),
          },
          type: 'omad',
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
        props: { title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi') },
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
          headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
        },
      );

      if (data.success) {
        Toast.show({
          autoHide: true,
          position: 'bottom',
          props: {
            title: 'Muvaffaqiyatli',
            desc: status === 1 ? t('264') : t('261'),
          },
          type: 'omad',
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
        props: { title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi') },
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
          headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
        },
      );

      if (info.data.success) {
        if (status == 1) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { title: 'Muvaffaqiyatli', desc: t('264') },
            type: 'omad',
            visibilityTime: 3000,
          });
        }
        if (status == 2) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: { title: 'Muvaffaqiyatli', desc: t('261') },
            type: 'omad',
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
        props: { title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi') },
        type: 'error2',
        visibilityTime: 3000,
      });
    }
  };

  const renderItems = useCallback((item, index) => {
    switch (item?.type) {
      //buldi bi batafsil qoldi
      case 0:
        return (
          <QarzShartnomasiniRasmiylashtirishTogrisida
            item={item}
            key={id}
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
            key={id}
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
            key={id}
            navigation={navigation}
          />
        );
      case 2:
        return (
          <Qarzqismanqaytarilganli
            item={item}
            key={id}
            okay={okay}
            navigation={navigation}
            onToliqQaytgan={onToliqQaytgan}
          />
        );
      case 3:
        return (
          <Qarzmuddatiniuzaytirishsoralganligitogrisida
            item={item}
            key={id}
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
            key={id}
            okay={okay}
            navigation={navigation}
          />
        );

      //buldi bi
      case 16:
        return (
          <Qarzmuddatiuzaytirilganligitogrisida
            item={item}
            key={id}
            okay={okay}
            navigation={navigation}
          />
        );
      case 12:
        return (
          <Qarzmuddatiuzaytirilganligitogrisida
            item={item}
            key={id}
            okay={okay}
            navigation={navigation}
          />
        );
      case 9:
        return (
          <Qarzniqaytarishqabulqilinmaganligitogrisida
            item={item}
            key={id}
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
            key={id}
          />
        );
      case 10:
        return (
          <QarzniQaytarishQabulQilinganligiTogrisida
            item={item}
            navigation={navigation}
            okay={okay}
            key={id}
          />
        );
      case 7:
        return (
          <QarzShartnomasiningRadQilinganligiTogrisida
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );
      case 8:
        return (
          <QarzShartnomasiningQabulQilinganligiTogrisida
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );
      case 13:
        return (
          <QarzMuddatiniUzaytirishRadEtilganligiTogrisida
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );
      case 11:
        return (
          <QarzniQaytarishQabulQilinganligiTogrisida
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );

      case 22:
        return (
          <QarzniQaytarishRadQilinganligi
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );
      case 21:
        return (
          <QarzShartnomasiRejectTime
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );
      case 24:
        return (
          <PulMablagOtkazilganligi
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );
      case 23:
        return (
          <PulMablagOtkazilganligiHaqida
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );
      case 25:
        return (
          <NewUser item={item} key={id} navigation={navigation} okay={okay} />
        );
      case 26:
        return (
          <RecoveryPassword
            item={item}
            key={id}
            navigation={navigation}
            okay={okay}
          />
        );
      case 27:
        return (
          <QarzniMuddatUzaytirishQabul
            item={item}
            key={id}
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
            key={id}
          />
        );
      case 31:
        return (
          <MalumotniKorishgaRadEtildi
            item={item}
            navigation={navigation}
            okay={okay}
            key={id}
          />
        );
      case 30:
        return (
          <MalumotniKorishgaRuxsatBerildi
            item={item}
            navigation={navigation}
            okay={okay}
            key={id}
          />
        );
      case 32:
        return (
          <Eslatma item={item} navigation={navigation} okay={okay} key={id} />
        );

      case 35:
        return <ExpirePassport item={item} okay={okay} key={id} />;
      default:
        return <Text key={id}>{t('Xatolik sodir bo‘ldi')}</Text>;
    }
  }, []);

  const EmptyListComponent = () => (
    <View style={styles.emptyListContainer}>
      <MainText size={fontSize[12]}>{t('177')}</MainText>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Animated.FlatList
        ref={listRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        // itemLayoutAnimation={LinearTransition}
        keyExtractor={item => item.id?.toString()}
        ListEmptyComponent={EmptyListComponent}
        data={notificationData?.bild}
        onEndReachedThreshold={0.5}
        // renderItem={renderItems}
        renderItem={({ item, index }) => renderItems(item, index)}
      />
    </View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  emptyListContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  pdfView: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
    backgroundColor: '#fff',
    borderRadius: 50,
    marginBottom: 20,
    marginTop: 20,
  },
  userName: {
    fontSize: style.fontSize.x,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    padding: 80,
    alignSelf: 'center',
  },
  download: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: style.StatusbarColor,
    padding: 10,
    width: style.width / 3,
    flexDirection: 'row',
  },
  downloadText: {
    color: style.textColor,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
  },
  main: {
    width: '90%',
    alignSelf: 'center',
    flex: 1,
    paddingBottom: 10,
    marginTop: 20,
  },
  aboutUsContainer: {
    backgroundColor: '#fff',

    borderRadius: 15,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
    zIndex: 1,
  },

  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    alignSelf: 'center',
    textAlign: 'center',
  },
  headers: {
    height: style.height / 3,
    position: 'absolute',
    width: style.width,
  },
});
