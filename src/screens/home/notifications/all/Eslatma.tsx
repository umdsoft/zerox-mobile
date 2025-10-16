import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import TextBold from '../../../components/TextBold';

import {style} from '../../../../theme/style';
import {t} from 'i18next';
import {useSelector} from 'react-redux';
const Eslatma = ({item, okay, navigation}) => {
  const {home} = useSelector(state => state.HomeReducer);
  const onOkay = async () => {
    okay(item?.id);
  };
  return (
    <View style={styles.container}>
      <View style={{marginVertical: 15, marginHorizontal: 15}}>
        <View>
          <TextBold>{t('eslatma')}</TextBold>
        </View>
        <View style={{marginTop: 10}}>
          <Text style={styles.notification} allowFontScaling={false}>{t('eslatma1')}</Text>
        </View>
        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
            }}>
            <View style={{flexDirection: 'row'}}>
              <Text style={styles.notificationTitle} allowFontScaling={false}>
                <Text  allowFontScaling={false}>{item?.created} </Text>
              </Text>
              <Text style={styles.notificationTitle} allowFontScaling={false}>
                {' '}
                {item?.time?.slice(0, 5)}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              //   marginTop: 10,
            }}>
            <TouchableOpacity
              onPress={() => {
                // i need to call api to get creditor and debitor
                // /contract/near-notification?type=creditor&page=${this.page + 1}&limit=${this.limit}
                navigation.navigate('MuddatOzQolgan', {
                  creditor: home?.creditor,
                  debitor: home?.debitor,
                  type: 'creditor',
                });
              }}
              activeOpacity={0.8}
              style={styles.button}>
              <Text
                style={[
                  styles.notification,
                  {color: '#fff', fontSize: style.fontSize.xx - 2},
                ]}
                allowFontScaling={false}>
                {t('22')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onOkay}
              activeOpacity={0.8}
              style={[styles.button, {marginLeft: 10}]}>
              <Text
                style={[
                  styles.notification,
                  {color: '#fff', fontSize: style.fontSize.xx - 2},
                ]}
                allowFontScaling={false}>
                Ok
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Eslatma;

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
