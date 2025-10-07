import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {memo} from 'react';
import {style} from '../../../../theme/style';
import {settingDate} from '../../../../helper';
import TextBold from '../../../components/TextBold';
import {t} from 'i18next';
import TransText from '../../../components/TransText';
import ReturnName from '../../../../helper/returnName';
import MainText from '../../../components/MainText';

//// bu bumadi hali

const QarzniQaytarishRadQilinganligi = ({item, okay, navigation}) => {
  const onPress = () => {
    navigation.navigate('DownloadStatistic', {item: item, id: item.id});
  };
  if (item.creditor === item.reciver) {
    return (
      <View style={styles.container}>
        <View style={{marginVertical: 15, marginHorizontal: 15}}>
          <View>
            <TextBold>{t('549') as string}</TextBold>
          </View>
          <View style={{marginTop: 10}}>
            <TransText
              tKey={'rejectdebt1'}
              values={{
                start: item.created_at,
                id: item.number,
                sum:
                  item.refundable_amount
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
                  ' ' +
                  item.currency,
                end: item.created,
                name:
                  item.dtypes === 2
                    ? ReturnName.returnDebitorName(item)
                    : item.dtypes === 1
                    ? item.dcompany
                    : null,
              }}
              components={{
                name: <TextBold />,
                start: <TextBold />,
                id: (
                  <Text
                    onPress={() => {
                      navigation.navigate('DownloadStatistic', {
                        item,
                        id: item.contract,
                      });
                    }}
                    style={[styles.notification, {color: style.blue}]}>
                    {item.number}
                  </Text>
                ),
                sum: <TextBold />,
                end: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <TextBold
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {settingDate(item?.created_at)}
              </TextBold>{' '}
              yildagi{' '}
              <Text onPress={onPress} style={styles.number}>
                {item?.number}
              </Text>
              -sonli qarz shartnomasi bo‘yicha{' '}
              <TextBold>
                {item.refundable_amount
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}{' '}
                {item?.currency}
              </TextBold>{' '}
              qaytarilganligi yuzasidan yuborgan so‘rovnomangiz{' '}
              <TextBold>
                {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}
                {item.dtypes === 1 ? item.dcompany : null}
              </TextBold>{' '}
              tomonidan {settingDate(item.created)} yil soat 23:59 ga qadar
              qabul qilinmaganligi sababli tizim tomonidan bekor qilindi. Qayta
              so’rov yuborishingiz mumkin.
            </Text> */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 10,
              }}>
              <View style={{flexDirection: 'row'}}>
                <Text style={styles.notificationTitle}>
                  <Text>{item?.created} </Text>
                </Text>
                <Text style={styles.notificationTitle}>
                  {' '}
                  {item.time.slice(0, 5)}
                </Text>
              </View>
              <View style={{}}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() => {
                      okay(item.id);
                    }}
                    activeOpacity={0.8}
                    style={styles.button}>
                    <Text
                      style={[
                        styles.notification,
                        {color: '#fff', fontSize: style.fontSize.xx - 2},
                      ]}>
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
        <View style={{marginVertical: 15, marginHorizontal: 15}}>
          <View>
            <TextBold>{t('549')}</TextBold>
          </View>
          <View style={{marginTop: 10}}>
            <TransText
              tKey={'rejectdebt'}
              values={{
                start: item.created_at,
                id: item.number,
                sum:
                  item.refundable_amount
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
                  ' ' +
                  item.currency,
                end: item.created,
                name:
                  item.ctypes === 2
                    ? ReturnName.returnCreditorName(item)
                    : item.ctypes === 1
                    ? item.ccompany
                    : null,
              }}
              components={{
                name: <TextBold />,
                start: <MainText size={style.fontSize.xx - 2} />,
                id: (
                  <Text
                    onPress={() => {
                      navigation.navigate('DownloadStatistic', {
                        item,
                        id: item.contract,
                      });
                    }}
                    style={[styles.notification, {color: style.blue}]}>
                    {item.number}
                  </Text>
                ),
                sum: <TextBold />,
                end: <TextBold />,
              }}
            />
            {/* <Text style={styles.notification}>
              <TextBold
                style={[
                  styles.notification,
                  {fontFamily: style.fontFamilyBold},
                ]}>
                {item.ctypes === 2 ? ReturnName.returnCreditorName(item) : null}
                {item.ctypes === 1 ? item.ccopmany : null}
              </TextBold>{' '}
              tomonidan <TextBold>{settingDate(item.created_at)}</TextBold>{' '}
              yildagi{' '}
              <Text onPress={onPress} style={styles.number}>
                {item.number}
              </Text>
              -sonli qarz shartnomasi bo‘yicha{' '}
              <TextBold>
                {item.refundable_amount
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}{' '}
                {item.currency}
              </TextBold>{' '}
              qarz mablag’i qaytarilganligi yuzasidan Sizga so‘rovnoma
              yuborilgan. Ushbu so‘rovnoma {settingDate(item.created)} yil soat
              23:59 ga qadar Siz tomoningizdan qabul qilinmaganligi sababli
              tizim tomonidan bekor qilindi.
            </Text> */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 10,
              }}>
              <View style={{flexDirection: 'row'}}>
                <Text style={styles.notificationTitle}>
                  <Text>{item?.created} </Text>
                </Text>
                <Text style={styles.notificationTitle}>
                  {' '}
                  {item.time.slice(0, 5)}
                </Text>
              </View>
              <View style={{}}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() => {
                      okay(item.id);
                    }}
                    activeOpacity={0.8}
                    style={styles.button}>
                    <Text
                      style={[
                        styles.notification,
                        {color: '#fff', fontSize: style.fontSize.xx - 2},
                      ]}>
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

export default memo(QarzniQaytarishRadQilinganligi);

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
