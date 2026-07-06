import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
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

      console.log(data, 'data in debt take part');

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
        setLoading(false);
        return;
      }

      if (data.msg === 'ex' && status === 200) {
        Toast.show({
          autoHide: true,
          props: {
            title: 'Xatolik',
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
        Toast.show({
          autoHide: true,
          props: {
            title: t('243'),
            desc: t('456'),
          },
          visibilityTime: 2000,
          position: 'bottom',
          type: 'omad',
        });
        setTimeout(() => {
          setLoading(false);
          navigation.navigate('BottomTabNavigator');
        }, 2000);
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
          title: 'Xatolik',
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
      console.warn(error, 'error in debt take part');
    }
  };

  const renderInput = useMemo(() => {
    return (
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel} allowFontScaling={false}>
          {t('276')}
        </Text>
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
                        name: contractInfo?.debitor_name,
                        sum: `${
                          sortText(contractInfo.amount - contractInfo.inc) +
                          ' ' +
                          contractInfo.currency
                        }`,
                      }}
                      components={{
                        start: (
                          <TextBold styles={{ fontSize: style.fontSize.xx }} />
                        ),
                        id: (
                          <Text
                            onPress={() => {
                              navigation.navigate('DownloadStatistic', {
                                item: contractInfo,
                                id: contractInfo.id,
                              });
                            }}
                            style={{
                              color: style.blue,
                            }}
                            allowFontScaling={false}
                          />
                        ),
                        end: <TextBold />,
                        name: (
                          <TextBold styles={{ fontSize: style.fontSize.xx }} />
                        ),
                        sum: (
                          <TextBold styles={{ fontSize: style.fontSize.xx }} />
                        ),
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
    paddingTop: rs(20),
    paddingBottom: rs(24),
  },
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
