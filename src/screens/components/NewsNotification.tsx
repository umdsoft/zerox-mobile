import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {memo} from 'react';
import {style} from '../../theme/style';
import {mylog} from '../../log';
import {settingDate} from '../../helper';
import {navigate} from '../../navigation/NavigationRef';
const NewsNotificationCard = ({data}) => {
  mylog(data);
  return (
    <TouchableOpacity
      onPress={() => {
        navigate('NewsScreen', {data: data});
      }}
      activeOpacity={0.7}
      style={styles.container}>
      <View style={{marginVertical: 15, marginHorizontal: 15}}>
        <View style={{}}>
          <Text style={styles.notificationTitle} allowFontScaling={false}>{data?.title}</Text>
        </View>
        {/* <View style={{marginTop: 5}}>
          <Text style={[styles.notification, {fontSize: style.fontSize.small}]}>
            {data?.title}
          </Text>
        </View> */}
        <View style={{marginTop: 15}}>
          <Text style={styles.notification} allowFontScaling={false}>
            {data?.description.length > 100
              ? data?.description.slice(0, 100) + '...'
              : data?.description}
          </Text>
        </View>
        <View style={{marginTop: 15}}>
          <Text style={styles.notification} allowFontScaling={false}>{settingDate(data?.created)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(NewsNotificationCard);

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
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: style.width / 4,
  },
  notification: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    // lineHeight: 25,
  },
  notificationTitle: {
    fontSize: style.fontSize.x,
    fontFamily: style.fontFamilyBold,
    color: style.textColor,
  },
});
