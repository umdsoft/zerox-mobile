import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { style } from '../../../theme/style';

import { useNavigation, useRoute } from '@react-navigation/native';

import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { URL } from '../../constants';
import { toastConfig } from '../../components/ToastConfig';

import { sortText } from '../../components/StatisticCard';
import CheckBox from '@react-native-community/checkbox';
import TextBold from '../../components/TextBold';
import axios from 'axios';
import { storage } from '../../../store/api/token/getToken';
import { settingDate } from '../../../helper';
import ScreenLayout from '../../components/ScreenLayout';
import { rd, rs } from '../../../theme/rd';

import { setNotification } from '../../../store/reducers/HomeReducer';
import { useDispatch, useSelector } from 'react-redux';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import socketService from '../../../helper/socketService';

const DebtTakeFull = () => {
  const navigation = useNavigation();
  const { item } = useRoute().params;
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.HomeReducer);
  const [checked, setChecked] = useState(false);

  const onPress = async () => {
    const token = storage.getString('token');
    try {
      const { data, status } = await axios.post(
        URL + '/contract/act',
        {
          contract: item.id,
          creditor: item.creditor,
          debitor: item.debitor,
          reciver: item.debitor,
          end_date: item.end_date,
          old_amount: Number(item.residual_amount),
          inc: Number(item.residual_amount) + Number(item.inc),
          ntype: 2,
          refundable_amount: item.residual_amount,
          residual_amount: 0,
          status: 0,
          type: 2,
          sender: item.creditor,
          res: item.debitor,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log(
        {
          contract: item.id,
          creditor: item.creditor,
          debitor: item.debitor,
          reciver: item.debitor,
          end_date: item.end_date,
          old_amount: Number(item.residual_amount),
          inc: Number(item.residual_amount) + Number(item.inc),
          ntype: 2,
          refundable_amount: item.residual_amount,
          residual_amount: 0,
          status: 0,
          type: 2,
          sender: item.creditor,
          res: item.debitor,
        },
        'bodyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      );

      if (data.msg === 'end' && status === 200) {
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: t("Ushbu shartnoma bo'yicha qarzdorlik mavjud emas"),
          },
        });
      }

      if (data.msg === 'ex' && status === 200) {
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: t(
              'Siz ushbu qarz shartnomasi bo‘yicha so‘rov yuborgansiz. Iltimos, so‘rov natijasini kuting!',
            ),
          },
        });
      }
      if (status === 201) {
        Toast.show({
          autoHide: true,
          props: {
            title: t('243'),
            desc: t('447'),
          },
          visibilityTime: 2000,
          position: 'bottom',
          type: 'omad',
        });
        setTimeout(() => {
          navigation.navigate('BottomTabNavigator');
        }, 2000);
      }

      // socketService.sendNotification({id: item.debitor});

      // socketService.emit('notification', user?.data?.id);
      // socketService.on('notification', data => {
      //   dispatch(setNotification({notification: data.not}));
      // });
    } catch (error) {
      console.log(error, 'error');
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc: t('Xatolik sodir bo‘ldi'),
        },
      });
    }
  };

  console.log(item, 'item');
  return (
    <ScreenLayout title={t('441')} scroll>
        <View style={styles.content}>
            <View>
              <View style={[styles.card]}>
                <View style={styles.insideMoney}>
                  <Text
                    allowFontScaling={false}
                    style={styles.hisob}
                  >
                    <Trans
                      i18nKey={'444'}
                      values={{
                        start: settingDate(item.created_at),
                        end: item.number,
                        sum: `${
                          sortText(item.amount - item.inc) + ' ' + item.currency
                        }`,
                        id: item.number,
                        name: item?.debitor_name,
                        // sum: `${sortText(item.residual_amount - item.inc) + ' ' + item.currency}`,
                      }}
                      components={{
                        start: (
                          <TextBold styles={{ fontSize: style.fontSize.xx }} />
                        ),
                        id: (
                          <Text
                            allowFontScaling={false}
                            onPress={() => {
                              navigation.navigate('DownloadStatistic', {
                                item: item,
                                id: item.id,
                              });
                            }}
                            style={{
                              color: style.blue,
                            }}
                          />
                        ),
                        sum: (
                          <TextBold styles={{ fontSize: style.fontSize.xx }} />
                        ),
                        end: <TextBold />,
                        name: (
                          <TextBold styles={{ fontSize: style.fontSize.xx }} />
                        ),
                      }}
                    />
                  </Text>
                </View>
              </View>
            </View>
            <View>
              <View style={styles.checkRow}>
                <CheckBox
                  value={checked}
                  tintColor={rd.color.primary}
                  tintColors={{
                    true: rd.color.primary,
                    false: rd.color.textTertiary,
                  }}
                  boxType="square"
                  style={{ height: 20, width: 20, marginRight: 10 }}
                  onValueChange={() => setChecked(!checked)}
                />
                <Text
                  allowFontScaling={false}
                  onPress={() => {
                    navigation.navigate('Dalol', { type: 4, data: item });
                  }}
                  style={styles.linkText}
                >
                  {t('372')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!checked}
              onPress={onPress}
              style={[styles.primaryBtn, !checked && styles.primaryBtnDisabled]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.primaryBtnText,
                  !checked && styles.primaryBtnTextDisabled,
                ]}
              >
                {t('357')}
              </Text>
            </TouchableOpacity>
        </View>

      {/* <Toast config={toastConfig} /> */}
    </ScreenLayout>
  );
};

export default DebtTakeFull;

const styles = StyleSheet.create({
  mainText: {
    fontFamily: rd.font.bold,
  },
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
    marginLeft: rs(5),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(20),
  },
  insideMoney: {
    alignItems: 'center',
    justifyContent: 'center',
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
