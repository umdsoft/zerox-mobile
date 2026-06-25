import { StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { style } from '../../theme/style';

import { useNavigation, useRoute } from '@react-navigation/native';

import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';

import Loading from '../components/Loading';
import axios from 'axios';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import ScreenLayout from '../components/ScreenLayout';
import Button from '../components/Button';
import { settingDate } from '../../helper';

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
    <ScreenLayout title={dotHelper(t('351'))} scroll={false}>
      <View style={{ flex: 1 }}>
        {loading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Loading />
          </View>
        ) : (
          <View style={styles.aboutUsContainer}>
            <View
              style={{ width: '90%', alignSelf: 'center', marginVertical: 20 }}
            >
              <View style={{ marginTop: 10 }}>
                <Text
                  allowFontScaling={false}
                  style={[styles.hisob, { fontSize: style.fontSize.xx }]}
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
                        <TextBold styles={{ fontSize: style.fontSize.xx }} />
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
                            color: style.blue,
                          }}
                        />
                      ),
                      name: (
                        <TextBold styles={{ fontSize: style.fontSize.xx }} />
                      ),
                    }}
                  />
                </Text>
              </View>
              <View>
                <Button
                  title={t('357') as string}
                  onPress={onPress}
                  style={{ marginTop: 20 }}
                />
              </View>
            </View>
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
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  hisob: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    textAlign: 'center',
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
