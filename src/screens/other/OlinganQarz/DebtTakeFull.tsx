import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { goHomeSmooth } from "../../../helper/finishAction";
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
import { titleCase } from '../../../helper/returnName';

import { setNotification } from '../../../store/reducers/HomeReducer';
import { useDispatch, useSelector } from 'react-redux';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import {
  AnimatedIconCircle,
  FullReturnIcon,
} from '../../../images/debtActionIcons';

// To'liq qaytarish — YASHIL (DebtTakeSelect bilan mos).
const FULL = '#16a34a';

const DebtTakeFull = () => {
  const navigation = useNavigation();
  const { item } = useRoute().params;
  const dispatch = useDispatch();
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector(state => state.HomeReducer.user);
  const [checked, setChecked] = useState(false);
  // Yuklanish holati — "Tasdiqlash" bosilганда darhol spinner (ilgari hech qanday
  // vizual javob yo'q edi -> tugma "muzlaган"дек ko'rinardi, sekin his qilinardi).
  const [loading, setLoading] = useState(false);

  const onPress = async () => {
    if (loading) return;
    const token = storage.getString('token');
    try {
      setLoading(true);
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


      if (data.msg === 'end' && status === 200) {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc: t("Ushbu shartnoma bo'yicha qarzdorlik mavjud emas"),
          },
        });
      }

      if (data.msg === 'ex' && status === 200) {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc: t(
              'Siz ushbu qarz shartnomasi bo‘yicha so‘rov yuborgansiz. Iltimos, so‘rov natijasini kuting!',
            ),
          },
        });
      }
      if (status === 201) {
        // SS6: "Muvaffaqiyatli" (t('243')) sarlavhasi olib tashlandi -> matn bold.
        Toast.show({
          // autoHide: false -> toast goHomeSmooth hide qilgunча turadi (o'qilsin).
          autoHide: false,
          props: {
            desc: t('447'),
          },
          position: 'bottom',
          type: 'omad',
        });
        goHomeSmooth(navigation, t('447'));
      }

      // socketService.sendNotification({id: item.debitor});

      // socketService.emit('notification', user?.data?.id);
      // socketService.on('notification', data => {
      //   dispatch(setNotification({notification: data.not}));
      // });
    } catch (error) {
      setLoading(false);
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          desc: t('Xatolik sodir bo‘ldi'),
        },
      });
    }
  };

  return (
    <ScreenLayout title={t('441')} scroll={false}>
        <View style={styles.content}>
            {/* Tepada — TO'LIQ qaytarish ikonasi (yashil) + yengil puls. */}
            <View style={styles.iconWrap}>
              <AnimatedIconCircle size={rs(92)} bg={FULL}>
                <FullReturnIcon width={rs(48)} height={rs(48)} />
              </AnimatedIconCircle>
            </View>
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
                        // FISH TitleCase (o'g'li/qizi kichik) — server ALL CAPS beradi.
                        name: titleCase(item?.debitor_name),
                        // sum: `${sortText(item.residual_amount - item.inc) + ' ' + item.currency}`,
                      }}
                      components={{
                        // Shrift barcha so'zда bir xil; shartnoma raqami (id) ko'k havola,
                        // umumiy qarz summasi (sum) BOLD (so'rov bo'yicha jirniy).
                        start: <Text allowFontScaling={false} />,
                        id: (
                          <Text
                            allowFontScaling={false}
                            onPress={() => {
                              navigation.navigate('DownloadStatistic', {
                                item: item,
                                id: item.id,
                              });
                            }}
                            style={styles.link}
                          />
                        ),
                        sum: <Text allowFontScaling={false} style={styles.sumBold} />,
                        end: <Text allowFontScaling={false} />,
                        name: <Text allowFontScaling={false} style={styles.nameBold} />,
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
              disabled={!checked || loading}
              onPress={onPress}
              style={[styles.primaryBtn, !checked && styles.primaryBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={rd.color.onPrimary} />
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.primaryBtnText,
                    !checked && styles.primaryBtnTextDisabled,
                  ]}
                >
                  {t('357')}
                </Text>
              )}
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
  // Kontent VERTIKAL MARKAZDA — ikona tepada, matn/checkbox/tugma pastroqда (balansli).
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: rs(16),
    paddingBottom: rs(24),
  },
  iconWrap: { alignItems: 'center', marginBottom: rs(28) },
  hisob: {
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
    textAlign: 'center',
    lineHeight: rs(22),
  },
  // Umumiy qarz summasi — bold (so'rov bo'yicha jirniy).
  sumBold: { fontFamily: rd.font.bold, color: rd.color.text },
  nameBold: { fontFamily: rd.font.bold, color: rd.color.text },
  // Shartnoma raqami havolasi — shrift bir xil, faqat ko'k rang.
  link: { color: rd.color.primary },
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
    backgroundColor: FULL,
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
