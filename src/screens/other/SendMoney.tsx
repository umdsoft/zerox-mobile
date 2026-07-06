import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useNavigation, useRoute } from '@react-navigation/native';
// import TextInputMask from 'react-native-text-input-mask';
import { URL } from '../constants';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { toastConfig } from '../components/ToastConfig';
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import ScreenLayout from '../components/ScreenLayout';
import { textInputPlace } from '../../helper/index';

import { setNotification } from '../../store/reducers/HomeReducer';
import { useDispatch } from 'react-redux';
import { t } from 'i18next';
import socketService from '../../helper/socketService';
import { MaskedTextInput } from 'react-native-advanced-input-mask';
import { rd, rs } from '../../theme/rd';

const SendMoney = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = route.params || {};
  const [id, setId] = useState('');
  const [sum, setSum] = useState('');
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    id: '',
  });
  const dispatch = useDispatch();

  const _sendMoney = async () => {
    const token = storage.getString('token');
    if (user.uid === id.split('/').join('')) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc: t("Siz o'zingizga pul o'tkaza olmaysiz."),
        },
      });
      return;
    }
    try {
      if (Number(sum.replace(/\s/g, '')) <= 999) {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: t('828'),
          },
        });
      } else {
        setLoading(true);
        if (Number(sum.replace(/\s/g, '')) <= user?.balance) {
          const { data } = await axios.post(
            URL + '/user/transfer',
            {
              user_id: id.split('/').join(''),
              amount: Number(sum.replace(/\s/g, '')),
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (data.success) {
            Toast.show({
              autoHide: true,
              visibilityTime: 3000,
              position: 'bottom',
              type: 'omad',
              props: {
                title: 'Muvaffaqiyatli',
                desc: t('639'),
              },
            });
            // console.log(JSON.stringify(user.data));
            // socketService.sendNotification({
            //   id: client.id,
            // });
            // socketService.emit('notification', user?.id);
            // socketService.on('notification', data => {
            //   dispatch(setNotification({notification: data.not}));
            // });
            setSum('');
            setClient({
              first_name: '',
              last_name: '',
              middle_name: '',
              id: '',
            });
            setLoading(false);
            setTimeout(() => {
              navigation.reset({
                routes: [{ name: 'BottomTabNavigator' }],
                index: 0,
              });
            }, 2000);
          }
        } else {
          setSum('');
          setClient({
            first_name: '',
            last_name: '',
            middle_name: '',
            id: '',
          });
          setLoading(false);
          Toast.show({
            autoHide: true,
            visibilityTime: 3000,
            position: 'bottom',
            type: 'error2',
            props: {
              title: 'Xatolik',
              desc: t('294'),
            },
          });
        }
      }
    } catch (error) {
      setLoading(false);
      console.warn(error.message, 'eror');
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc: t('826'),
        },
      });
    }
  };

  const onGetUser = useCallback(async id => {
    try {
      const { data } = await axios.get(
        URL + `/user/candidate-search/${id.split('/').join('')}`,
        {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
          },
        },
      );

      if (data.success && data.data) {
        setClient({
          first_name: data?.data?.first_name?.slice(0, 1) ?? '',
          last_name: data?.data?.last_name ?? '',
          middle_name: data?.data?.middle_name?.slice(0, 1) ?? '',
          id: data?.data?.id,
        });
      } else {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc: t('826'),
          },
        });
        // setClient(t('825'));
      }
    } catch (error) {
      console.warn(error.message, 'eror');
      setClient({
        first_name: '',
        last_name: '',
        middle_name: '',
        id: '',
      });
    }
  }, []);

  useEffect(() => {
    if (id.length <= 9) {
      setClient({
        first_name: '',
        last_name: '',
        middle_name: '',
        id: '',
      });
    }
  }, [id.length]);

  const renderId = useMemo(() => {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel} allowFontScaling={false}>
          {t('618')}
        </Text>
        <MaskedTextInput
          value={id}
          allowFontScaling={false}
          keyboardType="default"
          placeholderTextColor={rd.color.textTertiary}
          placeholder="100000/AA"
          mask="[000000]{/}[AA]"
          autoCapitalize="characters"
          onChangeText={(formated, text) => {
            setId(text.toUpperCase());

            setTimeout(() => {
              if (text?.length === 9) {
                onGetUser(text.toUpperCase());
              }
            }, 300);
          }}
          style={[styles.input, styles.inputText]}
        />
      </View>
    );
  }, [id, onGetUser]);

  const sortText = text => {
    return text?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || 0;
  };

  const renderSum = useMemo(() => {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel} allowFontScaling={false}>
          {t('276')}
        </Text>
        <TextInput
          value={textInputPlace(sum)}
          onChangeText={text => {
            setSum(text);
          }}
          placeholderTextColor={rd.color.textTertiary}
          placeholder={t('1 000')}
          keyboardType="numeric"
          style={[styles.input, styles.amountText]}
          allowFontScaling={false}
        />
      </View>
    );
  }, [sum]);

  const isDisabled =
    sum.length === 0 ||
    id.length === 0 ||
    client.id.length === 0 ||
    loading
      ? true
      : false;

  return (
    <ScreenLayout title={t('822')} scroll>
      <View>
        <View style={styles.balanceCard}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="smGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={rd.color.gradient[0]} />
                <Stop offset="1" stopColor={rd.color.gradient[1]} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#smGrad)" />
          </Svg>
          <Text style={styles.balanceLabel} allowFontScaling={false}>
            {t('135')}
          </Text>
          <Text
            style={styles.balanceValue}
            allowFontScaling={false}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {`${sortText(user?.balance)}`} {t('som')}
          </Text>
        </View>

        <View style={styles.form}>
          {renderId}
          {client.id ? (
            <Text style={styles.clientText} allowFontScaling={false}>
              {client.first_name +
                '.' +
                client.middle_name +
                '.' +
                client.last_name}
            </Text>
          ) : null}
          {renderSum}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={_sendMoney}
            disabled={isDisabled}
            style={[styles.submitBtn, isDisabled && styles.submitBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={rd.color.onPrimary} />
            ) : (
              <Text
                allowFontScaling={false}
                style={[
                  styles.submitText,
                  isDisabled && styles.submitTextDisabled,
                ]}
              >
                {t('624')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {/* <Toast config={toastConfig} /> */}
    </ScreenLayout>
  );
};

export default SendMoney;

const styles = StyleSheet.create({
  balanceCard: {
    marginTop: rs(6),
    borderRadius: rd.radius.huge,
    padding: rs(20),
    overflow: 'hidden',
  },
  balanceLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.onPrimaryStrong,
  },
  balanceValue: {
    marginTop: rs(8),
    fontFamily: rd.font.bold,
    fontSize: rs(28),
    color: rd.color.onPrimary,
  },
  form: {
    marginTop: rs(20),
  },
  fieldGroup: {
    marginTop: rs(16),
  },
  fieldLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  input: {
    height: rs(56),
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingHorizontal: rs(16),
    color: rd.color.text,
  },
  inputText: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
  },
  amountText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(18),
  },
  clientText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
    marginTop: rs(10),
  },
  submitBtn: {
    marginTop: rs(24),
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: rd.color.surfaceAlt,
  },
  submitText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
  submitTextDisabled: {
    color: rd.color.textTertiary,
  },
});
