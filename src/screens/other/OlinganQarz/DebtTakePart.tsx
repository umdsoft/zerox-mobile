import {
  StyleSheet,
  Text,
  TextInput,
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
import Button from '../../components/Button';

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
      <View style={styles.TextInputLabelContainer}>
        <View style={{ flex: 1 }}>
          <TextInput
            value={onValue(sum)}
            placeholder={t('276')}
            placeholderTextColor={style.placeHolderColor}
            keyboardType="numeric"
            onChangeText={onChangeText}
            style={styles.TextInput}
            allowFontScaling={false}
          />
        </View>
      </View>
    );
  }, [onChangeText, sum]);

  if (contractLoading) {
    return <Loading />;
  }
  return (
    <ScreenLayout title={t('450')} scroll>
        <View style={styles.aboutUsContainer}>
          <View
            style={{
              width: '90%',
              alignSelf: 'center',
              marginVertical: 20,
            }}
          >
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 20,
                }}
              >
                <CheckBox
                  value={checked}
                  tintColor={style.blue}
                  tintColors={{
                    true: style.blue,
                    false: style.disabledButtonColor,
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
                  style={[
                    styles.phoneText,
                    { color: style.blue, maxWidth: '90%', marginLeft: 5 },
                  ]}
                  allowFontScaling={false}
                >
                  {t('372')}
                </Text>
              </View>
            </View>
            <View>
              <Button
                title={t('357')}
                onPress={onPress}
                loading={loading}
                disabled={!checked && sum.length < 0 && !loading}
                style={{ marginTop: 20 }}
              />
            </View>
          </View>
        </View>
      {/* <Toast config={toastConfig} /> */}
    </ScreenLayout>
  );
};

export default DebtTakePart;

const styles = StyleSheet.create({
  mainText: {
    fontFamily: style.fontFamilyBold,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '100%',
    flexDirection: 'row',
    marginTop: 30,
    alignSelf: 'center',
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx - 2.5,
    color: style.textColor,
  },
  hisob: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    textAlign: 'center',
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },
  registerButton: {
    width: '100%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insideMoney: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    width: '100%',
    elevation: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  item: {
    flex: 1,
  },
  info: {
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    textAlign: 'left',
  },
  header: {
    backgroundColor: '#fff',
    height: style.height / 15,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});
