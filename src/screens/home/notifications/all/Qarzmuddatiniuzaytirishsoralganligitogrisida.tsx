import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { memo, useState } from 'react';

import { style } from '../../../../theme/style';
import { settingDate } from '../../../../helper';
import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';
import { font, fontSize } from '../../../../theme/font';

const Qarzmuddatiniuzaytirishsoralganligitogrisida = ({
  item,
  navigation,
  onQarzMuddatUzaytirish,
}) => {
  const [loading, setLoading] = useState(false);
  if (item.creditor === item.reciver) {
    return (
      <View style={styles.container}>
        <View style={{ marginVertical: 15, marginHorizontal: 15 }}>
          <View>
            <TextBold>{t('564') as string}</TextBold>
          </View>
          <View style={{ marginTop: 10 }}>
            <TransText
              tKey={567}
              values={{
                name:
                  item.dtypes === 2
                    ? ReturnName.returnDebitorName(item)
                    : item.dtypes === 1
                    ? item.dcompany
                    : null,
                start: item.created_at,
                id: item.number,
                end: settingDate(item.end_date),
              }}
              components={{
                name: <TextBold />,
                id: (
                  <Text
                    onPress={() => {
                      navigation.navigate('DownloadStatistic', {
                        item,
                        id: item.contract,
                      });
                    }}
                    allowFontScaling={false}
                    style={(styles.notification, { color: style.blue })}
                  >
                    {item.number}
                  </Text>
                ),
                start: (
                  <MainText ft={font.medium} size={style.fontSize.xx - 2} />
                ),
                end: <TextBold />,
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
              Sizdan{' '}
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
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
              -sonli qarz shartnomasining muddatini{' '}
              <Text
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {settingDate(item.end_date)}
              </Text>{' '}
              {''}
              yilgacha uzaytirishingizni so'ramoqda.{'\n'}
            </Text> */}
            <View style={{ marginTop: 10, flexDirection: 'row' }}>
              <Text allowFontScaling={false} style={styles.notificationTitle}>
                <Text allowFontScaling={false}>{settingDate(new Date())} </Text>
              </Text>
              <Text allowFontScaling={false} style={styles.notificationTitle}>
                {' '}
                {item.time.slice(0, 5)}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                disabled={loading}
                onPress={() => {
                  setLoading(true);
                  onQarzMuddatUzaytirish(item, 1).then(() => {
                    setLoading(false);
                  });
                }}
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
                  {t('93') as string}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading}
                activeOpacity={0.8}
                onPress={() => {
                  onQarzMuddatUzaytirish(item, 2).then(() => {
                    setLoading(false);
                  });
                }}
                style={[styles.button, { backgroundColor: 'red' }]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.notification,
                    { color: '#fff', fontSize: style.fontSize.xx - 2 },
                  ]}
                >
                  {t('96') as string}
                </Text>
              </TouchableOpacity>
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
            <TextBold>{t('564') as string}</TextBold>
          </View>
          <View style={{ marginTop: 10 }}>
            <TransText
              tKey={567}
              values={{
                name:
                  item.ctypes === 2
                    ? ReturnName.returnCreditorName(item)
                    : item.ctypes === 1
                    ? item.ccompany
                    : null,
                start: item.created_at,
                id: item.number,
                end: settingDate(item.end_date),
              }}
              components={{
                name: <TextBold />,
                id: (
                  <Text
                    allowFontScaling={false}
                    onPress={() => {
                      navigation.navigate('DownloadStatistic', {
                        item,
                        id: item.contract,
                      });
                    }}
                    style={(styles.notification, { color: style.blue })}
                  >
                    {item.number}
                  </Text>
                ),
                start: (
                  <MainText ft={font.medium} size={style.fontSize.xx - 2} />
                ),
                end: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
                {item.ctypes === 2 ? ReturnName.returnCreditorName(item) : null}
                {item.ctypes === 1 ? item.ccopmany : null}
              </Text>{' '}
              Sizdan{' '}
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
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
              -sonli qarz shartnomasining muddatini{' '}
              <Text
                style={
                  (styles.notification, {fontFamily: style.fontFamilyBold})
                }>
                {settingDate(item.end_date)}
              </Text>{' '}
              {''}
              yilgacha uzaytirishingizni so'ramoqda.{'\n'}
            </Text> */}
            <View style={{ marginTop: 10, flexDirection: 'row' }}>
              <Text allowFontScaling={false} style={styles.notificationTitle}>
                <Text allowFontScaling={false}>{settingDate(new Date())} </Text>
              </Text>
              <Text allowFontScaling={false} style={styles.notificationTitle}>
                {' '}
                {item.time.slice(0, 5)}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                disabled={loading}
                onPress={() => {
                  setLoading(true);
                  onQarzMuddatUzaytirish(item, 1).then(() => {
                    setLoading(false);
                  });
                }}
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
                  {t('93') as string}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading}
                onPress={() => {
                  setLoading(true);
                  onQarzMuddatUzaytirish(item, 2).then(() => {
                    setLoading(false);
                  });
                }}
                activeOpacity={0.8}
                style={[styles.button, { backgroundColor: 'red' }]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.notification,
                    { color: '#fff', fontSize: style.fontSize.xx - 2 },
                  ]}
                >
                  {t('96') as string}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
};

export default memo(Qarzmuddatiniuzaytirishsoralganligitogrisida);

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
