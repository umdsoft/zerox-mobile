import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { memo } from 'react';
import { style } from '../../../../theme/style';

import { settingDate } from '../../../../helper';
import { sortText } from '../../../components/StatisticCard';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import { fontSize } from '../../../../theme/font';
// 561

const QarzniQaytarishQabulQilinganligiTogrisida = ({
  item,
  okay,
  navigation,
}) => {
  const onPress = async () => {
    okay(item.id, 1);
  };
  if (item.creditor === item.reciver) {
    return (
      <View style={styles.container}>
        <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
          <View>
            <TextBold>{t('558') as string}</TextBold>
          </View>
          <View style={{ marginTop: 10 }}>
            <TransText
              tKey={561}
              values={{
                start: item.created_at,
                id: item.number,
                name:
                  item.dtypes === 2
                    ? ReturnName.returnDebitorName(item)
                    : item.dtypes === 1
                    ? item.dcompany
                    : null,
                sum: sortText(item.residual_amount) + ' ' + item.currency,
              }}
              components={{
                start: <MainText size={style.fontSize.xx - 2} />,
                id: (
                  <Text
                    allowFontScaling={false}
                    onPress={() => {
                      navigation.navigate('DownloadStatistic', {
                        item,
                        id: item.contract,
                      });
                    }}
                    style={{ color: style.blue }}
                  />
                ),
                name: <TextBold />,
                sum: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {settingDate(item.created_at)}
              </Text>{' '}
              yildagi{' '}
              <Text
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {
                    item,
                    id: item.contract,
                  });
                }}
                style={(styles.notification, {color: style.blue})}>
                {item.number}
              </Text>
              -sonli qarz shartnomasi bo‘yicha qarzni qaytarish to‘g‘risidagi
              Sizning so‘rovnomangiz{' '}
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
                {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}{' '}
                {item.dtypes === 1 ? item.dcompany : null}{' '}
              </Text>
              tomonidan qabul qilindi.{'\n'}
              Qoldiq qarz miqdori –{' '}
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {sortText(item.residual_amount)} {item.currency}.
              </Text>
              {'\n'}
            </Text> */}
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
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    onPress={onPress}
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
        </View>
      </View>
    );
  }
  if (item.debitor === item.reciver) {
    return (
      <View style={styles.container}>
        <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
          <View>
            <TextBold>{t('558') as string}</TextBold>
          </View>
          <View style={{ marginTop: 10 }}>
            <TransText
              tKey={561}
              values={{
                start: item.created_at,
                number: item.number,
                name:
                  item.ctypes === 2
                    ? ReturnName.returnCreditorName(item)
                    : item.ctypes === 1
                    ? item.ccompany
                    : null,
                sum: sortText(item.residual_amount) + ' ' + item.currency,
              }}
              components={{
                start: <TextBold />,
                number: (
                  <Text
                    allowFontScaling={false}
                    onPress={() => {
                      navigation.navigate('DownloadStatistic', {
                        item,
                        id: item.contract,
                      });
                    }}
                    style={{ color: style.blue }}
                  />
                ),
                name: <TextBold />,
                sum: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {settingDate(item.created_at)}
              </Text>{' '}
              yildagi{' '}
              <Text
                onPress={() => {
                  navigation.navigate('DownloadStatistic', {
                    item,
                    id: item.contract,
                  });
                }}
                style={(styles.notification, {color: style.blue})}>
                {item.number}
              </Text>
              -sonli qarz shartnomasi bo‘yicha qarzni qaytarish to‘g‘risidagi
              Sizning so‘rovnomangiz{' '}
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {item.ctypes === 2 ? ReturnName.returnCreditorName(item) : null}{' '}
                {item.ctypes === 1 ? item.ccopmany : null}{' '}
              </Text>
              tomonidan qabul qilindi.{'\n'}
              Qoldiq qarz miqdori –{' '}
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
                {sortText(item.residual_amount)} {item.currency}.
              </Text>
              {'\n'}
            </Text> */}
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
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    onPress={onPress}
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
        </View>
      </View>
    );
  }
};

export default memo(QarzniQaytarishQabulQilinganligiTogrisida);

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
