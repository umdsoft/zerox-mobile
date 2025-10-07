import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import {BackGroundIcon} from '../../helper/homeIcon';
import {normalize, style} from '../../theme/style';

import {useNavigation} from '@react-navigation/native';

import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';
import {useSelector} from 'react-redux';
import Edit from '../../images/Edit';
import OtherHeader from '../components/OtherHeader';
import Famale from '../../images/Famale';
import {t} from 'i18next';
import {URL} from '../constants';

const UserDetails = () => {
  const navigation = useNavigation();

  const {user} = useSelector(state => state.HomeReducer);

  return (
    <View style={styles.container}>
      <View
        style={{
          height: '40%',
          width: '100%',
          position: 'absolute',
        }}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('810')} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={styles.main}>
            <View style={styles.aboutUsContainer}>
              <View style={{flexDirection: 'row'}}>
                {user.data.image === null ? (
                  <View style={styles.userImageContainer}>
                    {user?.data?.type === 2 ? (
                      user?.data?.gender === 2 ? (
                        <Famale
                          width={normalize(50)}
                          height={normalize(50)}
                          color={style.blue}
                        />
                      ) : (
                        <Person
                          width={normalize(50)}
                          height={normalize(50)}
                          color={style.blue}
                        />
                      )
                    ) : (
                      <Juridic
                        width={normalize(50)}
                        height={normalize(50)}
                        color={style.blue}
                      />
                    )}
                  </View>
                ) : (
                  <>
                    {/* {loadingImage ? (
                      <View
                        style={{
                          height: normalize(100),
                          width: normalize(70),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <ActivityIndicator
                          size="small"
                          color={style.blue}
                          style={{marginTop: 20}}
                        />
                      </View>
                    ) : ( */}
                    <Image
                      source={{uri: URL.slice(0, -6) + user?.data?.image}}
                      width={normalize(70)}
                      height={normalize(100)}
                      style={{
                        borderRadius: 10,
                      }}
                    />
                    {/* )} */}
                  </>
                )}
                <View style={{marginLeft: 10, flex: 1}}>
                  {user.data.type === 2 ? (
                    <>
                      <View style={styles.info}>
                        <Text style={styles.title}>{t('familiya')}</Text>
                        <Text numberOfLines={1} style={styles.name}>
                          {user?.data?.last_name}
                        </Text>
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.title}>{t('ism')}</Text>
                        <Text numberOfLines={1} style={styles.name}>
                          {user?.data?.first_name}
                        </Text>
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.title}>{t('ota')}</Text>
                        <Text numberOfLines={1} style={styles.name}>
                          {user?.data?.middle_name}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.info}>
                        <Text style={styles.title}>Direktor</Text>
                        <Text style={styles.name}>{user?.data?.director}</Text>
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.title}>Kompaniya</Text>
                        <Text style={styles.name}>{user?.data?.company}</Text>
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.title}>{t('786') as string}</Text>
                        <Text style={styles.name}>{user?.data?.address}</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
              <View style={{marginTop: 20}}>
                {user.data.type === 2 ? (
                  <View style={styles.info}>
                    <Text style={styles.title}>{t('684')}</Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.name, {marginTop: 5}]}>
                      {user?.data?.brithday}
                    </Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.info,
                    {
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                    },
                  ]}>
                  <View>
                    <Text style={styles.title}>{t('27')}</Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.name, {marginTop: 5}]}>
                      {phoneSort(user?.data?.phone)}
                    </Text>
                  </View>
                  <View>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('ChangePhoneNumber');
                      }}>
                      <Edit width={normalize(18)} height={normalize(18)} />
                    </TouchableOpacity>
                  </View>
                </View>
                {user.data.type === 2 ? (
                  <>
                    <View style={styles.info}>
                      <Text style={styles.title}>{t('687')}</Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.name, {marginTop: 5}]}>
                        {user?.data?.pinfl}
                      </Text>
                    </View>
                  </>
                ) : null}
                <View style={styles.info}>
                  <Text style={styles.title}>{t('120')}</Text>
                  <Text numberOfLines={1} style={[styles.name, {marginTop: 5}]}>
                    {user?.data?.uid}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.title}>{t('255')}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text
                      numberOfLines={1}
                      style={[styles.name, {marginTop: 5}]}>
                      {settingDate(user?.data?.created_at)}
                    </Text>
                  </View>
                </View>
                {/* <View style={styles.info}>
                  <Text style={styles.title}>Status</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text
                      numberOfLines={1}
                      style={[styles.name, {marginTop: 5}]}>
                      {user?.data?.rating || 0}
                    </Text>
                    <BottomIcon
                      style={{transform: [{rotate: '180deg'}]}}
                      size={10}
                      color={user?.data?.rating_type === 1 ? '#048515' : 'red'}
                    />
                  </View>
                </View> */}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default UserDetails;
export const settingDate = text => {
  const today = new Date(text);

  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};
export const phoneSort = text => {
  let b = [];
  text.split('').forEach((item, index) => {
    if (index === 6) {
      b.push(' ');
    }
    if (index === 9) {
      b.push(' ');
    }
    if (index === 11) {
      b.push(' ');
    }
    b.push(item);
  });
  return b?.toString()?.replace(/,/g, '');
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  TouchableOpacity: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 5,
  },
  optionTx: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 3,
    color: '#000',
    marginLeft: 5,
  },
  name: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 3,
    color: '#000',
  },
  info: {
    marginTop: 10,
  },
  title: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 1,
    color: style.blue,
  },
  userImageContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
  },
  aboutUsContainer: {
    backgroundColor: '#EAF2FB',

    borderRadius: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
    paddingBottom: 20,
    marginBottom: 5,
  },
  titlex: {
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: '#fff',
  },
});
