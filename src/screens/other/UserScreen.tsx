import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {BackGroundIcon} from '../../helper/homeIcon';
import {normalize, style} from '../../theme/style';
import messaging from '@react-native-firebase/messaging';
import {useNavigation, useRoute} from '@react-navigation/native';
import {storage} from '../../store/api/token/getToken';
import ProfileIcon from '../../images/Profile';
import ContractIcon from '../../images/Contract';
import SecurityIcon from '../../images/Security';
import LanguageIcon from '../../images/Language';
import ExitIcon from '../../images/Exit';
import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';
import OtherHeader from '../components/OtherHeader';
import {useDispatch} from 'react-redux';
import {
  checkUpdate,
  setEmptyUser,
  setNotification,
  showModal,
} from '../../store/reducers/HomeReducer';
import Famale from '../../images/Famale';
import {Modal} from 'react-native-paper';
import MainText from '../components/MainText';
import {colors} from '../../theme/colors';
import {fontSize} from '../../theme/font';
// import {t} from 'i18next';
import {useTranslation} from 'react-i18next';
import {URL} from '../constants';
import notifee from '@notifee/react-native';
import {NotificationBadgeModule} from '../../nativemodule/notificationBadge';
import socketService from '../../helper/socketService';
import Main from '../home/Main';
import {expire_passport_check} from '../../helper/timeChecker';

const UserScreen = () => {
  const route = useRoute();
  const {user} = route.params;
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const [hide, setHide] = useState(false);
  const navigation = useNavigation();
  const navigateScreen = useCallback(
    name => {
      navigation.navigate(name);
    },
    [navigation],
  );

  const onCheckIsActive = useCallback(() => {
    if (user.data.is_active === 1) {
      navigateScreen('UserDetails');
    } else {
      dispatch(showModal({show: true}));
    }
  }, [navigateScreen, user]);

  // eslint-disable-next-line react/no-unstable-nested-components
  const UserInfo = () => {
    if (user.data.is_active === 0) {
      return (
        <View style={[styles.info]}>
          <MainText size={fontSize[12]}>
            {t('Tasdiqlanmagan foydalanuvchi')}
          </MainText>
          <TouchableOpacity
            onPress={() => {
              navigateScreen('ScanFaceMyId');
            }}
            style={styles.active}>
            <MainText color={colors.white} size={fontSize[12]}>
              {user.data.is_active === 0
                ? t('747')
                : 'Identifikatsiyalangan mijoz'}
            </MainText>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <>
          <View style={styles.info}>
            <MainText color={colors.blue} size={fontSize[11]}>
              {t('familiya')}
            </MainText>
            <MainText size={fontSize[13]}>{user?.data?.last_name}</MainText>
          </View>
          <View style={styles.info}>
            <MainText color={colors.blue} size={fontSize[11]}>
              {t('ism')}
            </MainText>
            <MainText size={fontSize[13]}>{user?.data?.first_name}</MainText>
          </View>
          <View style={styles.info}>
            <MainText color={colors.blue} size={fontSize[11]}>
              {t('ota')}
            </MainText>
            <MainText size={fontSize[13]}>{user?.data?.middle_name}</MainText>
          </View>
        </>
      );
    }
  };
  // console.log(
  //   `https://pdf.zerox.uz/oferta.php?id=${user.data.uid}&lang=uz&download=0`,
  // );

  // const onLastTime = useCallback(async () => {
  //   const device_id = await getUniqueId();
  //   // dispatch(onListTimePostAction({device_id}));
  // }, []);

  const deleteToken = useCallback(async () => {
    // await dispatch(setNotification({notification: []}));
    dispatch(checkUpdate({update: false}));
    socketService.disconnect();
    await messaging().deleteToken();
  }, []);

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
      <OtherHeader title={t('807')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={styles.Main}>
            <View style={styles.aboutUsContainer}>
              <View style={{flexDirection: 'row'}}>
                {/* {user.data.image === null ? ( */}
                  <View style={styles.userImageContainer}>
                    {user?.data?.type === 2 ? (
                      user?.data?.gender === 2 ? (
                        <Famale
                          width={normalize(50)}
                          height={normalize(normalize(100))}
                          color={style.blue}
                        />
                      ) : (
                        <Person
                          width={normalize(50)}
                          height={normalize(100)}
                          color={style.blue}
                        />
                      )
                    ) : (
                      <Juridic
                        width={normalize(50)}
                        height={normalize(100)}
                        color={style.blue}
                      />
                    )}
                  </View>
                {/* ) : ( */}
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
                    {/* <Image
                      source={{uri: URL.slice(0, -6) + user?.data?.image}}
                      width={normalize(70)}
                      // onLoadEnd={() => setLoadingImage(false)}
                      // onError={() => setLoadingImage(false)}
                      // onLoad={() => setLoadingImage(false)}
                      height={normalize(100)}
                      style={{
                        borderRadius: 10,
                      }}
                    /> */}
                    {/* )} */}
                  </>
                {/* )} */}

                <View style={{marginLeft: 10, flex: 1}}>
                  {user?.data?.type === 2 ? (
                    UserInfo()
                  ) : (
                    <>
                      <View style={styles.info}>
                        <MainText color={colors.blue} size={fontSize[12]}>
                          Direktor
                        </MainText>
                        <MainText size={fontSize[14]}>
                          {user?.data?.director}
                        </MainText>
                      </View>
                      <View style={styles.info}>
                        <MainText color={colors.blue} size={fontSize[12]}>
                          Kompaniya
                        </MainText>
                        <MainText size={fontSize[14]}>
                          {user?.data?.company}
                        </MainText>
                      </View>
                      <View style={styles.info}>
                        <MainText color={colors.blue} size={fontSize[12]}>
                          {t('786')}
                        </MainText>
                        <MainText size={fontSize[14]}>
                          {user?.data?.address}
                        </MainText>
                      </View>
                    </>
                  )}
                </View>
              </View>
              <View>
                {user.data.is_active === 0
                  ? null
                  : expire_passport_check(user?.data?.expiry_date) && (
                      <TouchableOpacity
                        onPress={() => {
                          navigateScreen('ChangePassportData');
                        }}
                        style={[styles.active, {width: '65%'}]}>
                        <MainText color={colors.white} size={fontSize[12]}>
                          {t('747')}
                        </MainText>
                      </TouchableOpacity>
                    )}
              </View>
              <View style={{marginTop: 5}}>
                <TouchableOpacity
                  onPress={onCheckIsActive}
                  style={styles.TouchableOpacity}>
                  <ProfileIcon size={22} color={style.blue} />
                  <MainText mrLeft={8} color={colors.black} size={fontSize[14]}>
                    {t('810')}
                  </MainText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    let lang = storage.getString('lang');
                    navigation.navigate('Contract', {
                      url: `https://pdf.zerox.uz/oferta.php?id=${user.data.uid}&lang=${lang}&download=0`,
                      title: t('681'),
                    });
                  }}
                  style={styles.TouchableOpacity}>
                  <ContractIcon size={22} color={style.blue} />
                  <MainText mrLeft={8} color={colors.black} size={fontSize[14]}>
                    {t('681')}
                  </MainText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    navigateScreen('Language');
                  }}
                  style={styles.TouchableOpacity}>
                  <LanguageIcon size={22} color={style.blue} />
                  <MainText mrLeft={8} color={colors.black} size={fontSize[14]}>
                    {t('til')}
                  </MainText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    navigateScreen('Security');
                  }}
                  style={styles.TouchableOpacity}>
                  <SecurityIcon size={22} color={style.blue} />
                  <MainText mrLeft={8} color={colors.black} size={fontSize[14]}>
                    {t('816')}
                  </MainText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setHide(true);
                  }}
                  style={styles.TouchableOpacity}>
                  <ExitIcon size={22} color={style.blue} />
                  <MainText mrLeft={8} color={colors.black} size={fontSize[14]}>
                    {t('672')}
                  </MainText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <ExitModal
        hide={hide}
        setHide={setHide}
        navigation={navigation}
        deleteToken={deleteToken}
      />
    </View>
  );
};

const ExitModal = ({hide, setHide, navigation, deleteToken}) => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);

  const onLogOut = useCallback(async () => {
    try {
      setLoading(true);
      deleteToken()
        .then(async () => {
          if (Platform.OS === 'ios') {
            notifee.setBadgeCount(0).then(() => {});
          } else {
            NotificationBadgeModule.setBadgeOnlyNumber(0);
          }
          storage.clearAll();
          navigation.reset({
            routes: [{name: 'SelectLanguageScreen'}],
            index: 0,
          });
          setHide(false);
          setLoading(false);
        })
        .catch((error: any) => {
          // storage.clearAll();
          console.error('Error deleting token:', error);
          setHide(false);
          setLoading(false);
        });
      // await onLastTime();
    } catch (error) {
      // storage.clearAll();
      setLoading(false);
      console.error('Error during logout:', error);
    }
  }, [deleteToken, navigation, setHide]);

  return (
    <Modal
      onDismiss={() => {
        setHide(false);
      }}
      visible={hide}>
      <View style={styles.modal}>
        <View>
          <MainText size={fontSize[14]}>{t('675')}</MainText>
          <View style={styles.brnCn}>
            <TouchableOpacity
              onPress={() => {
                setHide(false);
              }}
              style={styles.btn}>
              <MainText color={colors.white} size={fontSize[14]}>
                {t('21')}
              </MainText>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={loading}
              onPress={onLogOut}
              style={[
                styles.btn,
                {
                  backgroundColor: loading
                    ? colors.disabledButtonColor
                    : style.blue,
                },
              ]}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MainText color={colors.white} size={fontSize[14]}>
                  {t('672')}
                </MainText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UserScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    height: normalize(40),
    backgroundColor: style.blue,
    borderRadius: 12,
  },
  brnCn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  titlex: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
  },
  modal: {
    width: '90%',
    backgroundColor: '#fff',
    alignSelf: 'center',
    borderRadius: 12,
    padding: 10,

    // height: normalize(110),
    // maxHeight: normalize(110),
  },
  active: {
    backgroundColor: style.blue,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginTop: 12,
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
    marginTop: 5,
    maxWidth: '100%',
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

  Main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
  },
  aboutUsContainer: {
    backgroundColor: '#EAF2FB',

    borderRadius: 15,
    flex: 1,
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
});
