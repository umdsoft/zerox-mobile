import { StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import { normalize, style } from '../../../theme/style';

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
import Button from '../../components/Button';

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
        <View style={styles.aboutUsContainer}>
          <View
            style={{ width: '90%', alignSelf: 'center', marginVertical: 20 }}
          >
            <View>
              <View style={[styles.card]}>
                <View style={styles.insideMoney}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.hisob, { fontSize: style.fontSize.xx }]}
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
                  allowFontScaling={false}
                  onPress={() => {
                    navigation.navigate('Dalol', { type: 4, data: item });
                  }}
                  style={[
                    styles.phoneText,
                    { color: style.blue, maxWidth: '90%', marginLeft: 5 },
                  ]}
                >
                  {t('372')}
                </Text>
              </View>
            </View>
            <View>
              <Button
                title={t('357')}
                onPress={onPress}
                disabled={!checked}
                style={{ marginTop: 20 }}
              />
            </View>
          </View>
        </View>

      {/* <Toast config={toastConfig} /> */}
    </ScreenLayout>
  );
};

export default DebtTakeFull;

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
    fontSize: style.fontSize.xs,
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
