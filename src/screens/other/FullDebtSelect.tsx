import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';

import Loading from '../components/Loading';
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import { settingDate } from '../../helper';
import { rd, rs } from '../../theme/rd';

import { setNotification } from '../../store/reducers/HomeReducer';
import { useDispatch, useSelector } from 'react-redux';

import { Trans, useTranslation } from 'react-i18next';
import TextBold from '../components/TextBold';
import socketService from '../../helper/socketService';

const FullDebtSelect = () => {
  const { item } = useRoute().params;
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.HomeReducer);

  useEffect(() => {
    getData();
  }, []);
  console.log(info, 'info');

  const getData = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data, status } = await axios.get(
        URL + `/contract/by/${item.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (status === 200) {
        setInfo(data.data);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  }, [item.id]);

  const onPress = async () => {
    const token = storage.getString('token');
    try {
      const { data, status } = await axios.post(
        URL + '/contract/talab',
        {
          act: info?.act,
          contract: info?.id,
          creditor: info?.creditor,
          debitor: info?.debitor,
          reciver: info?.creditor,
          residual_amount: info?.residual_amount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log(info, 'find');
      console.log('data', data);

      if (status === 200 && data.msg === 'ex') {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: 'Ushbu shartnoma bo‘yicha talabnoma yuborilgan.',
          },
        });
      }
      if (status === 201) {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'omad',
          props: { title: 'Muvaffaqiyatli', desc: t('360') },
        });
        // socketService.sendNotification({id: info?.creditor});
        // socketService.emit('notification', user?.data?.id);
        // socketService.on('notification', data => {
        //   dispatch(setNotification({notification: data.not}));
        // });
        setTimeout(() => {
          navigation.navigate('BottomTabNavigator');
        }, 2000);
      }
    } catch (error) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi') },
      });
    }
  };
  return (
    <ScreenLayout title={dotHelper(t('351'))} scroll>
      <View style={{ flex: 1 }}>
        {loading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Loading />
          </View>
        ) : (
          <View style={styles.content}>
              <View style={styles.card}>
                <Text
                  allowFontScaling={false}
                  style={styles.hisob}
                >
                  <Trans
                    t={t}
                    i18nKey="354"
                    values={{
                      start: settingDate(info.created_at),
                      count: info?.number,
                      name: info?.creditor_name,
                    }}
                    components={{
                      start: (
                        <TextBold styles={{ fontSize: rs(16) }} />
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
                      name: (
                        <TextBold styles={{ fontSize: rs(16) }} />
                      ),
                    }}
                  />
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                style={styles.primaryBtn}
              >
                <Text allowFontScaling={false} style={styles.primaryBtnText}>
                  {t('357') as string}
                </Text>
              </TouchableOpacity>
          </View>
        )}
      </View>
      {/* <Toast config={toastConfig} /> */}
    </ScreenLayout>
  );
};

export const dotHelper = text => {
  return text.length > 35 ? text.slice(0, 35) + '...' : text;
};

export default FullDebtSelect;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: rs(16),
    paddingTop: rs(20),
    paddingBottom: rs(24),
  },
  hisob: {
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
    textAlign: 'center',
    lineHeight: rs(22),
  },
  card: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    padding: rs(14),
  },
  primaryBtn: {
    marginTop: rs(20),
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: rs(16),
    fontFamily: rd.font.semibold,
    color: rd.color.onPrimary,
  },
});
