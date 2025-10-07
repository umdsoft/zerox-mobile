import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {BackGroundIcon} from '../../helper/homeIcon';
import {normalize, style} from '../../theme/style';

import {useNavigation, useRoute} from '@react-navigation/native';
import Card from '../components/Card';
import BerilganQarzIcon from '../../images/home/QarzOlganIcon.svg';
import MuddatUtganPlus from '../../images/home/MuddatUtgan+.svg';
import MuddatUtganMinus from '../../images/home/MuddatUtgan-.svg';
import OlinganQarz from '../../images/home/OlingaQarz.svg';
import GiveDebtIcon from '../../images/tab/GiveDebtIconBlue.svg';
// import ListCard from '../components/ListCard';
import axios from 'axios';
import {URL} from '../constants';
import {storage} from '../../store/api/token/getToken';
import Loading from '../components/Loading';
import PersonIcon from '../../images/home/person';
import JuridicIcon from '../../images/home/juridic';
import {settingDate} from './UserDetails';
import OtherHeader from '../components/OtherHeader';
import ListCardShowDetails from '../components/ListCardShowDetails';
import Famale from '../../images/Famale';
import {useTranslation} from 'react-i18next';
import {TakeIcon} from '../../navigation/Index';
import {expire_passport_check} from '../../helper/timeChecker';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {checkExpire} from '../../store/reducers/HomeReducer';

const UserInformationOfDebt = () => {
  const navigation = useNavigation();
  const {user, type, ctok, dtok, item} = useRoute().params;
  const {t} = useTranslation();
  const userInfo = useSelector(state => state.HomeReducer);
  const [me, setMe] = useState({});
  const [data, setData] = useState({profile: {}, creditor: {}, debitor: {}});
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const FetchData = async () => {
    setLoading(true);
    try {
      const [profile, creditor, debitor] = await axios.all([
        axios.get(URL + `/user/candidate-search/${item.duid}`, {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
            Connection: 'close',
          },
        }),
        axios.get(URL + `/home/by/${item.debitor}?type=creditor`, {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
            Connection: 'close',
          },
        }),
        axios.get(URL + `/home/by/${item.debitor}?type=debitor`, {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
            Connection: 'close',
          },
        }),
      ]);
      axios
        .get(URL + `/user/me`, {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
            Connection: 'close',
          },
        })
        .then(res => {
          return setMe(res.data.data);
        });

      if (
        profile.status === 200 &&
        creditor.status === 200 &&
        debitor.status === 200
      ) {
        setData({
          profile: profile.data.data,
          creditor: creditor.data.data,
          debitor: debitor.data.data,
        });
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    FetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  console.log(data.debitor, 'debitor');
  console.log(data.creditor, 'creditor');

  return (
    <View style={styles.container}>
      <View
        style={{
          width: style.width,
          position: 'absolute',
          height: style.height / 3,
        }}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={type === 1 ? '' : t('qidiruv')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.main}>
          <View style={styles.aboutUsContainer}>
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginHorizontal: 10,
                }}>
                {item?.dimage === null ? (
                  <View style={styles.userImageContainer}>
                    {data?.profile?.type === 1 ? (
                      <JuridicIcon
                        width={style.width / 7}
                        height={style.width / 7}
                        color={style.blue}
                      />
                    ) : data?.profile?.gender === 2 ? (
                      <Famale
                        width={style.width / 7}
                        height={style.width / 7}
                        color={style.blue}
                      />
                    ) : (
                      <PersonIcon
                        width={style.width / 7}
                        height={style.width / 7}
                        color={style.blue}
                      />
                    )}
                  </View>
                ) : (
                  <Image
                    source={{uri: URL.slice(0, -6) + item?.dimage}}
                    width={normalize(70)}
                    height={normalize(100)}
                    style={{
                      borderRadius: 10,
                    }}
                  />
                )}
                <View
                  style={{
                    marginLeft: 10,
                    maxWidth: '70%',
                    width: '70%',
                  }}>
                  <View
                    style={{
                      borderBottomColor: style.blue,
                      borderBottomWidth: 1,
                      paddingBottom: 3,
                    }}>
                    <Text style={[styles.phoneText, {color: style.blue}]}>
                      {t('fish')}
                    </Text>
                    <Text style={styles.phoneText}>
                      {data.profile?.last_name +
                        ' ' +
                        data.profile?.first_name +
                        ' ' +
                        data.profile?.middle_name}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderBottomColor: style.blue,
                      borderBottomWidth: 1,
                      paddingBottom: 3,
                    }}>
                    <Text style={[styles.phoneText, {color: style.blue}]}>
                      {t('reg')}
                    </Text>
                    <Text style={styles.phoneText}>
                      {settingDate(data?.profile?.created_at?.slice(0, 10))}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderBottomColor: style.blue,
                      borderBottomWidth: 1,
                      paddingBottom: 3,
                    }}>
                    <Text style={[styles.phoneText, {color: style.blue}]}>
                      {t('120')}
                    </Text>
                    <Text style={styles.phoneText}>{data?.profile?.uid}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={{flex: 1, marginHorizontal: 10}}>
              <View style={styles.cardViewContainer}>
                <View>
                  <Card
                    data={data.debitor?.data}
                    width={style.width / 2.4}
                    disabled={true}
                    title={t('153')}
                    Icon={OlinganQarz}
                    type={0}
                    color={style.blue}
                  />
                </View>
                <View>
                  <Card
                    data={data?.creditor?.data}
                    width={style.width / 2.4}
                    disabled={true}
                    title={t('156')}
                    Icon={BerilganQarzIcon}
                    type={0}
                    color={style.blue}
                  />
                </View>
              </View>
              <View style={styles.cardViewContainer}>
                <View>
                  <Card
                    width={style.width / 2.4}
                    disabled={true}
                    title={t('170')}
                    Icon={MuddatUtganPlus}
                    type={2}
                    color={style.blue}
                    data={data?.debitor?.expired}
                  />
                </View>
                <View>
                  <Card
                    width={style.width / 2.4}
                    disabled={true}
                    title={t('170')}
                    Icon={MuddatUtganMinus}
                    type={2}
                    color={style.blue}
                    data={data.creditor?.expired}
                  />
                </View>
              </View>
              <View style={styles.cardViewContainer}>
                <View>
                  <ListCardShowDetails
                    disabled={true}
                    width={style.width / 2.4}
                    title={t('168')}
                    type={2}
                    color={style.blue}
                    data={data?.debitor?.five}
                  />
                </View>
                <View>
                  <ListCardShowDetails
                    disabled={true}
                    width={style.width / 2.4}
                    title={t('171')}
                    type={2}
                    color={style.blue}
                    data={data?.creditor?.five}
                  />
                </View>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                {/* Qarz berish */}
                <TouchableOpacity
                  onPress={() => {
                    if (
                      expire_passport_check(userInfo?.user.data.expiry_date)
                    ) {
                      dispatch(checkExpire({expire: true}));
                      return;
                    }
                    navigation.navigate('GiveDebtUser', {
                      qarzoluvchi: data.profile,
                      type: 1,
                    });
                  }}
                  activeOpacity={0.8}
                  style={styles.qarzberish}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      width: '100%',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: style.fontFamilyMedium,
                        fontSize: style.fontSize.xx - 2,
                        color: '#fff',
                      }}>
                      {t('147')}
                    </Text>
                    <View style={{backgroundColor: '#fff', borderRadius: 8}}>
                      <View style={{padding: 5}}>
                        <TakeIcon width={25} height={25} color={style.blue} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Qarz olish */}
                <TouchableOpacity
                  onPress={() => {
                    if (
                      expire_passport_check(userInfo?.user.data.expiry_date)
                    ) {
                      dispatch(checkExpire({expire: true}));
                      return;
                    }
                    navigation.navigate('GiveDebtUser', {
                      qarzoluvchi: data.profile,
                      type: 0,
                    });
                  }}
                  activeOpacity={0.8}
                  style={styles.qarzberish}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      width: '100%',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: style.fontFamilyMedium,
                        fontSize: style.fontSize.xx - 2,
                        color: '#fff',
                      }}>
                      {t('150')}
                    </Text>
                    <View style={{backgroundColor: '#fff', borderRadius: 8}}>
                      <View style={{padding: 5}}>
                        <GiveDebtIcon width={25} height={25} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default UserInformationOfDebt;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  qarzberish: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 10,
    padding: 10,
    width: '48%',
    alignSelf: 'center',
    marginTop: 20,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  cardViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
    alignSelf: 'center',
  },
  userImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  userImage: {
    width: style.width / 7,
    height: style.width / 7,
    borderRadius: style.width / 6,
  },
  time: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },

  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#EAF2FB',
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
    marginBottom: 10,
    paddingVertical: 20,
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
    width: '90%',
    flexDirection: 'row',
    marginTop: 30,
    alignSelf: 'center',
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#EAF2FB',
    paddingLeft: 5,
    paddingRight: 5,
  },
  containerrr: {
    flex: 1,
    width: style.width / 2.4,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
  },
  sum: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.MoneyColor,
  },
  title: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyBold,
    color: style.textColor,
  },
});
