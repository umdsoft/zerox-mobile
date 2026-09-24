import {
  AppState,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {rd, rs} from '../../../theme/rd';
import Toast from 'react-native-toast-message';
import {useNavigation, useRoute, StackActions } from '@react-navigation/native';
import ClickIcon from '../../../images/pay/ClickIcon';
import {useDispatch, useSelector} from 'react-redux';
import RdHeader from '../../home/redesign/RdHeader';
import {t} from 'i18next';
import {textInputPlace} from '../../../helper/index';

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
            props: {desc: t('828')},
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
  //       Toast.show({ autoHide: true, position: 'bottom', props: { desc: t('822') }, type: 'error2', visibilityTime: 3000, })
  //     }
  //   }
  // }

  useEffect(() => {
    let appState = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchData();
      } else {
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
          // NAV-FIX: to'lov TUGADI. `replace` — natija ekranidan orqaga bosilganda
          // to'lov (Click WebView) sahifasiga qaytmasin: bu chalkash va xavfli
          // (foydalanuvchi to'lovni takrorlashga urinishi mumkin).
          navigation.dispatch(StackActions.replace('UserMoneyResult', {user: userData.user.data}));
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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={title} />
      <View style={styles.main}>
        {/* TEPA YARIM — KATTA logo (so'rov bo'yicha kattaroq hajmda, 1-yarimda). */}
        <View style={styles.topHalf}>
          <View style={styles.logoCard}>
            {type === 0 ? (
              <ClickIcon width={rs(170)} height={rs(48)} color={rd.color.primary} />
            ) : type === 1 ? (
              <PaymeIcon width={rs(180)} height={rs(58)} />
            ) : (
              <Image source={require('../../../images/paynet.png')} />
            )}
          </View>
        </View>

        {/* PASTKI YARIM — summa maydoni + Davom etish. "Summani kiriting" LABEL
            OLIB TASHLANDI (so'rov bo'yicha) — input placeholder'ining o'zi yetarli. */}
        <View style={styles.bottomHalf}>
          <TextInput
            value={textInputPlace(amount)}
            placeholder={t('276')}
            placeholderTextColor={rd.color.textTertiary}
            keyboardType="numeric"
            onChangeText={val => {
              setAmount(val);
            }}
            style={styles.input}
            allowFontScaling={false}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={PayUser}
            style={styles.payButton}>
            <Text style={styles.payButtonText} allowFontScaling={false}>
              {t('45')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Pay;

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(10),
    paddingBottom: rs(16),
  },
  // Ekran ikkiga bo'linadi: logo tepa yarmda (markazda, katta), forma pastki yarmda.
  topHalf: { flex: 1, justifyContent: 'center' },
  bottomHalf: { flex: 1, paddingTop: rs(8) },
  logoCard: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingVertical: rs(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    height: rs(56),
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingHorizontal: rs(16),
    fontFamily: rd.font.semibold,
    fontSize: rs(18),
    color: rd.color.text,
  },
  payButton: {
    marginTop: rs(22),
    width: '100%',
    height: rs(54),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
