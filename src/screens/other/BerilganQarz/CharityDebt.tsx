import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {style} from '../../../theme/style';
import {useNavigation, useRoute} from '@react-navigation/native';
import {sortText} from '../../components/StatisticCard';

import Loading from '../../components/Loading';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import {toastConfig} from '../../components/ToastConfig';
import CheckBox from '@react-native-community/checkbox';
import TextBold from '../../components/TextBold';
import axios from 'axios';
import {storage} from '../../../store/api/token/getToken';
import {URL} from '../../constants';
import {settingDate} from '../../../helper';
import ScreenLayout from '../../components/ScreenLayout';
import {rd, rs} from '../../../theme/rd';

import {useDispatch, useSelector} from 'react-redux';
import {setNotification} from '../../../store/reducers/HomeReducer';
import {t} from 'i18next';
import {Trans} from 'react-i18next';
import {HomeApi} from '../../../store/api/home';
import socketService from '../../../helper/socketService';

const CharityDebt = () => {
  const {item} = useRoute().params;
  const [check, setCheck] = useState(false);
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.HomeReducer);
  const navigation = useNavigation();
  const [info, setInfo] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const {data, status} = await axios.get(URL + `/contract/by/${item.id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

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
      const {data, status} = await axios.post(
        URL + '/contract/vos-kechish',
        {
          contract: info?.id,
          creditor: info?.creditor,
          end_date: info?.end_date,
          debitor: info?.debitor,
          inc: info?.inc,
          reciver: info?.creditor,
          refundable_amount: 0,
          residual_amount: info?.residual_amount,
          vos_summa: info?.residual_amount,
          sender: info.debitor,
          res: info.debitor,
          old_amount: Number(info.residual_amount),
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      if (status === 200 && data.msg === 'ex') {
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Muvaffaqiyatli',
            desc: t(
              'Ushbu qarz shartnomasi bo‘yicha Sizga so‘rov yuborilgan. Bildirishnomalar bo‘limi orqali so‘rov bilan tanishing.',
            ),
          },
        });
      }
      if (status === 201) {
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'omad',
          props: {
            title: 'Muvaffaqiyatli',
            desc: t('792'),
          },
        });
        dispatch(HomeApi({page: 1}));
        setTimeout(() => {
          navigation.navigate('BottomTabNavigator');
        }, 2000);
      }

      // socketService.sendNotification({id: info?.creditor});

      // socketService.emit('notification', user?.data?.id);
      // socketService.on('notification', data => {
      //   dispatch(setNotification({notification: data.not}));
      // });
    } catch (error) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {title: 'Xatolik', desc: t('Xatolik sodir bo‘ldi')},
      });
    }
  };

  return (
    <ScreenLayout title={t('378')} scroll>
        {loading ? (
          <Loading />
        ) : (
            <View style={styles.content}>
              <View style={styles.card}>
                {/* 375 */}
                {/*   {sortText(info?.residual_amount)} {info?.currency} */}
                <Text allowFontScaling={false} style={styles.hisob}>
                  <Trans
                    t={t}
                    i18nKey="381"
                    values={{
                      sum:
                        sortText(info?.residual_amount) + ' ' + info?.currency,
                      start: settingDate(info.created_at),
                      currancy: info?.currency,
                      id: info?.number,
                      end: settingDate(info?.created_at),
                    }}
                    components={{
                      start: (
                        <TextBold styles={{fontSize: style.fontSize.xx}} />
                      ),
                      currancy: (
                        <TextBold styles={{fontSize: style.fontSize.xx}} />
                      ),
                      sum: <TextBold styles={{fontSize: style.fontSize.xx}} />,
                      id: (
                        <Text
                          allowFontScaling={false}
                          onPress={() => {
                            navigation.navigate('DownloadStatistic', {
                              item: info,
                              id: info.id,
                            });
                          }}
                          style={{
                            color: style.blue,
                          }}
                        />
                      ),
                      end: <TextBold styles={{fontSize: style.fontSize.xx}} />,
                    }}
                  />
                </Text>
              </View>
              <View style={styles.checkRow}>
                <CheckBox
                  value={check}
                  tintColor={rd.color.primary}
                  tintColors={{
                    true: rd.color.primary,
                    false: rd.color.textTertiary,
                  }}
                  boxType="square"
                  style={{width: 20, height: 20}}
                  onValueChange={() => setCheck(!check)}
                />
                <Text
                  allowFontScaling={false}
                  onPress={() => {
                    navigation.navigate('Dalol', {type: 2, data: info});
                  }}
                  style={styles.linkText}>
                  {t('372')}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                disabled={!check}
                style={[styles.primaryBtn, !check && styles.primaryBtnDisabled]}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.primaryBtnText,
                    !check && styles.primaryBtnTextDisabled,
                  ]}>
                  {t('93')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

      {/* <Toast config={toastConfig} /> */}
    </ScreenLayout>
  );
};

export default CharityDebt;

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
  linkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.primary,
    maxWidth: '90%',
    marginLeft: rs(10),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(20),
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
  primaryBtnDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
  primaryBtnText: {
    fontSize: rs(16),
    fontFamily: rd.font.semibold,
    color: rd.color.onPrimary,
  },
  primaryBtnTextDisabled: {
    color: rd.color.textTertiary,
  },
});
