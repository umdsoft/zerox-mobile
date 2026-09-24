import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { goHomeSmooth } from "../../../helper/finishAction";
import { style } from '../../../theme/style';

import { useNavigation, useRoute } from '@react-navigation/native';

import Toast from 'react-native-toast-message';
import { toastConfig } from '../../components/ToastConfig';
import { URL } from '../../constants';
import { sortText } from '../../components/StatisticCard';

import CheckBox from '@react-native-community/checkbox';

import axios from 'axios';
import { storage } from '../../../store/api/token/getToken';
import { settingDate } from '../../../helper';

import { useDispatch, useSelector } from 'react-redux';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import TextBold from '../../components/TextBold';

import { onGetContract } from '../../../store/api/home';
import Loading from '../../components/Loading';
import ScreenLayout from '../../components/ScreenLayout';
import { ActivityIndicator } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { titleCase } from '../../../helper/returnName';
import {
  AnimatedIconCircle,
  PartReturnIcon,
} from '../../../images/debtActionIcons';

// Qisman qaytarish — KO'K (DebtTakeSelect bilan mos).
const PART = '#2f6fed';

const DebtTakePart = () => {
  const navigation = useNavigation();
  let { id } = useRoute().params;
  const [sum, setSum] = useState('');
  const dispatch = useDispatch();
  const { contractInfo, contractLoading } = useSelector(
    state => state.HomeReducer,
  );
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const onPress = async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const dd = {
        contract: contractInfo.id,
        creditor: contractInfo.creditor,
        debitor: contractInfo.debitor,
        end_date: contractInfo.end_date,
        inc: Number(sum.replace(/\s/g, '')) + Number(contractInfo.inc),
        reciver: contractInfo.debitor,
        refundable_amount: Number(sum.replace(/\s/g, '')),
        old_amount: Number(contractInfo.residual_amount),
        residual_amount:
          Number(contractInfo.residual_amount) - Number(sum.replace(/\s/g, '')),
        status: 0,
        // type 1 bulgan
        type:
          Number(contractInfo.residual_amount) -
            Number(sum.replace(/\s/g, '')) ===
          0
            ? 2
            : 1,
        ntype: 1,
        sender: contractInfo.creditor,
        res: contractInfo.debitor,
      };

      const { data, status } = await axios.post(URL + '/contract/act', dd, {
        headers: { Authorization: `Bearer ${token}` },
      });


      if (data.msg === 'end' && status === 200) {
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc: t("Ushbu shartnoma bo'yicha qarzdorlik mavjud emas"),
          },
        });
        setLoading(false);
        return;
      }

      if (data.msg === 'ex' && status === 200) {
        Toast.show({
          autoHide: true,
          props: {
            desc: t(
              'Siz ushbu qarz shartnomasi bo‘yicha so‘rov yuborgansiz. Iltimos, so‘rov natijasini kuting!',
            ),
          },
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
        });
        setLoading(false);
        return;
      }
      if (status === 201) {
        // SS6: "Muvaffaqiyatli" (t('243')) sarlavhasi olib tashlandi -> matn bold.
        Toast.show({
          // autoHide: false -> toast goHomeSmooth hide qilgunча turadi (o'qilsin).
          autoHide: false,
          props: {
            desc: t('456'),
          },
          position: 'bottom',
          type: 'omad',
        });
        goHomeSmooth(navigation, t('456'));
      }

      // socketService.sendNotification({
      //   id: item.debitor,
      // });

      // socketService.emit('notification', user?.data?.id);
      // socketService.on('notification', data => {
      //   dispatch(setNotification({notification: data.not}));
      // });
    } catch (err) {
      setLoading(false);
      Toast.show({
        autoHide: true,
        props: {
          desc: t('Xatolik sodir bo‘ldi'),
        },
        text1: '',
        visibilityTime: 2000,
        position: 'bottom',
        type: 'error2',
      });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChangeText = text => {
    if (Number(text.replace(/\s/g, '')) >= 1) {
      if (
        Number(text.replace(/\s/g, '')) <=
        Number(contractInfo.amount - contractInfo.inc)
      ) {
        setSum(text);
      } else {
        setSum('');
      }
    } else {
      setSum('');
    }
  };

  const onValue = text => {
    const arr = [];
    text
      .toString()
      .split('')
      .forEach((item, i) => {
        if (item !== ' ') {
          arr.push(item);
        }
      });

    return arr.join('').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  useEffect(() => {
    getData();
  }, []);
  const getData = async () => {
    try {
      dispatch(onGetContract({ id: id }));
    } catch (error) {
      console.error(error, 'error in debt take part');
    }
  };

  const renderInput = useMemo(() => {
    return (
      <View style={styles.inputWrap}>
        {/* Input tepasidagi "Summani kiriting" label OLIB TASHLANDI — placeholder'da
            allaqachon bor edi (dublikat, so'rov bo'yicha). */}
        <TextInput
          value={onValue(sum)}
          placeholder={t('276')}
          placeholderTextColor={rd.color.textTertiary}
          keyboardType="numeric"
          onChangeText={onChangeText}
          style={styles.amountInput}
          allowFontScaling={false}
        />
      </View>
    );
  }, [onChangeText, sum]);

  if (contractLoading) {
    return <Loading />;
  }
  return (
    <ScreenLayout title={t('450')} scroll>
        <View style={styles.content}>
            {/* Tepada — QISMAN qaytarish ikonasi (ko'k) + yengil puls. */}
            <View style={styles.iconWrap}>
              <AnimatedIconCircle size={rs(92)} bg={PART}>
                <PartReturnIcon width={rs(48)} height={rs(48)} />
              </AnimatedIconCircle>
            </View>
            <View>
              <View style={[styles.card]}>
                <View style={styles.insideMoney}>
                  <Text style={[styles.hisob]} allowFontScaling={false}>
                    <Trans
                      i18nKey={'453'}
                      values={{
                        start: settingDate(contractInfo.created_at),
                        end: contractInfo.number,
                        id: contractInfo.number,
                        // FISH TitleCase (o'g'li/qizi kichik) — server ALL CAPS beradi.
                        name: titleCase(contractInfo?.debitor_name),
                        sum: `${
                          sortText(contractInfo.amount - contractInfo.inc) +
                          ' ' +
                          contractInfo.currency
                        }`,
                      }}
                      components={{
                        // Shrift barcha so'z va raqamda bir xil — faqat shartnoma
                        // raqami (id) bosiladigan ko'k havola.
                        start: <Text allowFontScaling={false} />,
                        id: (
                          <Text
                            onPress={() => {
                              navigation.navigate('DownloadStatistic', {
                                item: contractInfo,
                                id: contractInfo.id,
                              });
                            }}
                            style={styles.link}
                            allowFontScaling={false}
                          />
                        ),
                        end: <Text allowFontScaling={false} />,
                        name: <Text allowFontScaling={false} style={styles.nameBold} />,
                        sum: <Text allowFontScaling={false} style={styles.sumBold} />,
                      }}
                    />
                  </Text>
                </View>
              </View>
            </View>
            <View>
              {renderInput}
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
                  onPress={() => {
                    navigation.navigate('Dalol', {
                      type: 5,
                      data: contractInfo,
                      sum: sum.replace(/\s/g, ''),
                    });
                  }}
                  style={styles.linkText}
                  allowFontScaling={false}
                >
                  {t('372')}
                </Text>
              </View>
            </View>
            {(() => {
              const btnDisabled =
                !checked || Number(sum.replace(/\s/g, '')) <= 0 || loading;
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onPress}
                  disabled={btnDisabled}
                  style={[
                    styles.primaryBtn,
                    btnDisabled && styles.primaryBtnDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={rd.color.onPrimary} size="small" />
                  ) : (
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.primaryBtnText,
                        btnDisabled && styles.primaryBtnTextDisabled,
                      ]}
                    >
                      {t('357')}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })()}
        </View>
      {/* <Toast config={toastConfig} /> */}
    </ScreenLayout>
  );
};

export default DebtTakePart;

const styles = StyleSheet.create({
  mainText: {
    fontFamily: rd.font.bold,
  },
  content: {
    paddingHorizontal: rs(16),
    paddingTop: rs(24),
    paddingBottom: rs(24),
  },
  // Ikona tepada -> matn/input/tugma biroz pastroq (so'rov bo'yicha).
  iconWrap: { alignItems: 'center', marginBottom: rs(28) },
  // Umumiy qarz summasi — bold (so'rov bo'yicha jirniy).
  sumBold: { fontFamily: rd.font.bold, color: rd.color.text },
  nameBold: { fontFamily: rd.font.bold, color: rd.color.text },
  inputWrap: {
    marginTop: rs(20),
  },
  inputLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  amountInput: {
    width: '100%',
    height: rs(56),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(14),
    fontSize: rs(16),
    fontFamily: rd.font.semibold,
    color: rd.color.text,
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
  hisob: {
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
    textAlign: 'center',
    lineHeight: rs(22),
  },
  // Shartnoma raqami havolasi — shrift bir xil, faqat ko'k rang.
  link: { color: rd.color.primary },
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
