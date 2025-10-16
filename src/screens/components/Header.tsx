import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import React from 'react';

import {normalize, style} from '../../theme/style';
import {DrawerIcon, AlarmIcon} from '../../helper/homeIcon';
import {useNavigation} from '@react-navigation/native';
import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';
import {useSelector} from 'react-redux';
import Famale from '../../images/Famale';

import Logox from '../../images/TextAndLogo';

import {fontSize} from '../../theme';
const Header = ({count, show}) => {
  const navigation = useNavigation();
  const {user} = useSelector(state => state.HomeReducer);

  return (
    <View style={styles.DrawerContainer}>
      <View
        style={{
          flexDirection: 'row',
        }}>
        <View style={styles.drawer}>
          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              onPress={() => {
                navigation.openDrawer();
              }}>
              <DrawerIcon width={25} height={25} />
            </TouchableOpacity>
            <View
              style={{
                marginLeft: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Logox />
            </View>
          </View>
        </View>
        <View style={styles.AlarmContainer}>
          <View style={{left: 15}}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Notification');
              }}>
              <AlarmIcon width={normalize(25)} height={normalize(25)} />
              {show && (
                <View style={styles.count}>
                  <Text allowFontScaling={false} style={styles.textColor}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('UserScreen', {user});
              }}
              style={[styles.ImageButton, {padding: 6}]}>
              <View>
                {user?.data?.type === 1 ? (
                  <Juridic
                    width={normalize(18)}
                    height={normalize(18)}
                    color={style.blue}
                  />
                ) : user?.data?.gender === 2 ? (
                  <Famale
                    width={normalize(18)}
                    height={normalize(18)}
                    color={style.blue}
                  />
                ) : (
                  <Person
                    width={normalize(18)}
                    height={normalize(18)}
                    color={style.blue}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  userNameText: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },
  textColor: {
    fontSize: fontSize[10] - 3,
    color: '#fff',
    fontFamily: style.fontFamilyMedium,
  },
  ImageButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#fff',
    // padding: 6,
    borderRadius: 50,
    marginBottom: 5,
  },
  count: {
    position: 'absolute',
    paddingHorizontal: 4,
    right: -5,
    paddingVertical: 2.5,
    backgroundColor: 'red',
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  drawer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  DrawerContainer: {
    // flexDirection: 'row',
    // justifyContent: 'flex-end',
    // alignItems: 'flex-end',
    // paddingTop: 10,
    // paddingBottom: 10,

    marginTop: Platform.OS === 'android' ? normalize(5) : null,
    width: '95%',
    alignSelf: 'center',
  },

  money: {
    color: style.MoneyColor,
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
  },

  moneyTitle: {
    color: style.textColor,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
  },
  AlarmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 0.35,
  },
});
