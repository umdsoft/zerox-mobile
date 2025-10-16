import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';

import { useSelector } from 'react-redux';
export const getFullName = (role: string, item: any) => {
  if (role === 'sender') {
    return item.creditor === item.csender
      ? `${item.d_last_name} ${item.d_first_name} ${item.d_middle_name}`
      : `${item.c_last_name} ${item.c_first_name} ${item.c_middle_name}`;
  } else if (role === 'receiver') {
    return item.creditor === item.creciver
      ? `${item.d_last_name} ${item.d_first_name} ${item.d_middle_name}`
      : `${item.c_last_name} ${item.c_first_name} ${item.c_middle_name}`;
  }
  return '';
};

const QarzShartnomasiRejectTime = ({ item, okay, navigation }) => {
  const { user } = useSelector(state => state.HomeReducer);

  const onOkay = async () => {
    okay(item.id);
  };

  const onPress = () => {
    navigation.navigate('DownloadStatistic', { item: item, id: item.id });
  };

  if (item.creciver === user.data.id) {
    return (
      <View style={styles.container}>
        <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
          <View>
            <TextBold>{t('498') as string}</TextBold>
          </View>
          <View style={{ marginTop: 10 }}>
            <TransText
              tKey={501}
              values={{
                name:
                  item.dtypes === 2
                    ? getFullName('receiver', item)
                    : item.dtypes === 1
                    ? item.dcompany
                    : null,
                id: item.number,
                start: item.created,
              }}
              components={{
                name: <TextBold />,
                id: (
                  <Text
                    allowFontScaling={false}
                    onPress={onPress}
                    style={styles.number}
                  />
                ),
                start: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}
                {item.dtypes === 1 ? item.dcompany : null}
              </Text>{' '}
              tomonidan <TextBold>{settingDate(item.created)}</TextBold> yilda{' '}
              <Text onPress={onPress} style={styles.number}>
                {item.number}
              </Text>{' '}
              - sonli qarz shartnomasini rasmiylashtirish uchun Sizga so‘rovnoma
              yuborilgan. Ushbu qarz shartnomasi {settingDate(item.created)} yil
              soat 23:59 ga qadar Siz tomoningizdan qabul qilinmaganligi sababli
              tizim tomonidan rad qilindi.
            </Text> */}
          </View>
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <View style={{ flexDirection: 'row' }}>
                <Text allowFontScaling={false} style={styles.notificationTitle}>
                  <Text allowFontScaling={false}>{item?.created} </Text>
                </Text>
                <Text allowFontScaling={false} style={styles.notificationTitle}>
                  {' '}
                  {item.time.slice(0, 5)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onOkay}
                activeOpacity={0.8}
                style={styles.button}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.notification,
                    { color: '#fff', fontSize: style.fontSize.xx - 2 },
                  ]}
                >
                  Ok
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
  if (item.csender === user.data.id) {
    // 495 adi avval kalit sozi uni o'zgartiraman
    return (
      <View style={styles.container}>
        <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
          <View>
            <TextBold>
              <TextBold>{t('498') as string}</TextBold>
            </TextBold>
          </View>

          <View style={{ marginTop: 10 }}>
            <TransText
              tKey={495}
              values={{
                name:
                  item.ctypes === 2
                    ? getFullName('sender', item)
                    : item.ctypes === 1
                    ? item.ccompany
                    : null,
                id: item.number,
                start: item.created,
              }}
              components={{
                name: <TextBold />,
                id: (
                  <Text
                    allowFontScaling={false}
                    onPress={onPress}
                    style={styles.number}
                  />
                ),
                start: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {item.ctypes === 2 ? ReturnName.returnCreditorName(item) : null}
                {item.ctypes === 1 ? item.ccopmany : null}
              </Text>
              ga <TextBold>{settingDate(item.created)}</TextBold> yilda{' '}
              <Text onPress={onPress} style={styles.number}>
                {item.number}
              </Text>{' '}
              - sonli qarz shartnomasini rasmiylashtirish uchun so‘rovnoma
              yuborgansiz. Ushbu qarz shartnomasi {settingDate(item.created)}{' '}
              yil soat 23:59 ga qadar <TextBold>{ReturnName.returnCreditorName(item)}</TextBold>{' '}
              tomonidan qabul qilinmaganligi sababli tizim tomonidan rad
              qilindi.
            </Text> */}
          </View>
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <View style={{ flexDirection: 'row' }}>
                <Text allowFontScaling={false} style={styles.notificationTitle}>
                  <Text allowFontScaling={false}>{item?.created} </Text>
                </Text>
                <Text allowFontScaling={false} style={styles.notificationTitle}>
                  {' '}
                  {item.time.slice(0, 5)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onOkay}
                activeOpacity={0.8}
                style={styles.button}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.notification,
                    { color: '#fff', fontSize: style.fontSize.xx - 2 },
                  ]}
                >
                  Ok
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
};

export default memo(QarzShartnomasiRejectTime);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    width: '95%',
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    borderRadius: 10,
    elevation: 7,
  },
  number: {
    fontFamily: style.fontFamilyMedium,
    color: style.blue,
    fontSize: style.fontSize.xx - 2,
  },
  button: {
    backgroundColor: style.blue,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notification: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  notificationTitle: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
