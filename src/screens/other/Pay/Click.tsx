import {
  AppState,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {BackGroundIcon} from '../../../helper/homeIcon';
import {style} from '../../../theme/style';
import Toast from 'react-native-toast-message';
import {useNavigation, useRoute} from '@react-navigation/native';
import ClickIcon from '../../../images/pay/ClickIcon';
import {useDispatch, useSelector} from 'react-redux';
import OtherHeader from '../../components/OtherHeader';
import {t} from 'i18next';
import {textInputPlace} from '../../../helper/index';

import socketService from '../../../helper/socketService';
import {getMe} from '../../../store/api/home';
import PaymeIcon from '../../../images/Payme';
import {URL} from '../../constants';
import {storage} from '../../../store/api/token/getToken';
import Loading from '../../components/Loading';
import axios from 'axios';

const Pay = () => {
  const navigation = useNavigation();
  const {type, title} = useRoute().params;
  const {user} = useSelector(state => state.HomeReducer);

  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  // const [warnings, setWarnings] = useState(0);

  const PayUser = () => {
    try {
      const nums = String(amount).split(' ').join('');
      if (nums.length <= 3) {
        if (Number(nums) <= 1000) {
          Toast.show({
            autoHide: true,
            position: 'bottom',
            props: {title: 'Muvaffaqiyatli', desc: t('828')},
            type: 'error2',
            visibilityTime: 3000,
          });
        }
      } else {
        if (type === 0) {
          Linking.openURL(
            `https://my.click.uz/services/pay?service_id=24899&merchant_id=17375&amount=${nums}&transaction_param=${user.data.uid}&return_url=zeroxuz://UserMoneyResult`,
          );
        } else {
          if (type === 1) {
            setIsLoading(true);
            // let str = `m=62fa657ea12ad7a48f4b2dd9;ac.user_id=${
            //   user.data.uid
            // };a=${Number(nums) * 100};c=zeroxuz://UserMoneyResult/;ct=1000`;
            // let url = btoa(str);

            const paycomParams = {
              m: '62fa657ea12ad7a48f4b2dd9',
              'ac.user_id': user.data.uid,
              a: Number(nums) * 100,
              c: 'https://alisherrahimov.github.io/redirect-html/',
              ct: 200,
              l: 'uz',
            };

            const url = `https://checkout.paycom.uz/${btoa(
              Object.entries(paycomParams)
                .map(([k, v]) => `${k}=${v}`)
                .join(';'),
            )}`;
            Linking.openURL(url);
          }
        }
      }
    } catch (error) {
      console.error('Err', error);
    }
  };
  // const setPayment = (nums) => {
  //   if (nums.length <= 3) {
  //     if (nums < 1000) {
  //       Toast.show({ autoHide: true, position: 'bottom', props: { title: 'Muvaffaqiyatli', desc: t('822') }, type: 'error2', visibilityTime: 3000, })
  //     }
  //   }
  // }

  useEffect(() => {
    let appState = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground!');
        fetchData();
      } else {
        console.log('App has come to the background!');
        setIsLoading(false);
      }
    });

    async function fetchData() {
      const token = storage.getString('token');
      if (!token) {
        return;
      }
      try {
        setIsLoading(true);
        const userData = await dispatch(getMe()).unwrap();

        if (userData.user.data?.balance > user?.data?.balance) {
          navigation.navigate('UserMoneyResult', {user: userData.user.data});
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    }
    let ref = null;

    if (isLoading) {
      ref = setInterval(() => {
        fetchData();
      }, 1000);
    }
    return () => {
      if (ref !== null) {
        clearInterval(ref);
      }
      appState.remove();
    };
  }, [isLoading, navigation, user.data.balance]);
  console.log(isLoading, 'isLoading');

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View
        style={{position: 'absolute', height: style.height / 3, width: '100%'}}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={title} />
      <View style={[styles.main]}>
        <View style={styles.aboutUsContainer}>
          <View style={{width: '90%', alignSelf: 'center', marginVertical: 20}}>
            <View>
              <View style={styles.card}>
                <View style={styles.insideMoney}>
                  {type === 0 ? (
                    <ClickIcon
                      width={style.width / 4}
                      height={style.width / 12}
                      color={style.blue}
                    />
                  ) : type === 1 ? (
                    <PaymeIcon
                      width={style.width / 4}
                      height={style.width / 12}
                    />
                  ) : (
                    <Image source={require('../../../images/paynet.png')} />
                  )}
                </View>
              </View>
            </View>
            <View style={{marginTop: 20}}>
              <View style={[styles.TextInputLabelContainer, {width: '100%'}]}>
                <View style={{flex: 1}}>
                  <TextInput
                    value={textInputPlace(amount)}
                    placeholder={t('276')}
                    placeholderTextColor={style.placeHolderColor}
                    keyboardType="numeric"
                    onChangeText={val => {
                      setAmount(val);
                    }}
                    style={[styles.TextInput, {paddingLeft: 15}]}
                  />
                </View>
              </View>
              <TouchableOpacity
                // disabled={amount.length > 3 ? false : true}
                activeOpacity={0.8}
                onPress={PayUser}
                style={[
                  styles.registerButton,
                  {
                    // backgroundColor: amount.length > 3 ? style.blue : style.disabledButtonColor,
                    backgroundColor: style.blue,
                  },
                ]}>
                <Text style={styles.text}>{t('45')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Pay;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  text: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xs,
    color: '#fff',
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
    marginBottom: 20,
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  hisob: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },

  registerButton: {
    width: '100%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insideMoney: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    width: '100%',
    elevation: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    // height: style.buttonHeight,
  },

  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
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
    overflow: 'hidden',
  },
});
