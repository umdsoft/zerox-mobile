import {
  AppState,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { BackGroundIcon } from '../../../helper/homeIcon';
import { normalize, style } from '../../../theme/style';
import BackButton from '../../components/BackButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import ClickIcon from '../../../images/pay/ClickIcon';
import { useSelector } from 'react-redux';
import { encode } from 'base-64';
import OtherHeader from '../../components/OtherHeader';
import axios from 'axios';
import { URL } from '../../constants';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import Loading from '../../components/Loading';
import { t } from 'i18next';

const PayScreenForRecovery = () => {
  const { type, title, user } = useRoute().params;
  const navigation = useNavigation();

  const [sum, setSum] = useState('');
  const [loading, setLoading] = useState(false);
  console.log(JSON.stringify(user, null, 2), type);
  const PayUser = () => {
    try {
      // navigation.navigate('MyIdScreen');

      if (type === 0) {
        Linking.openURL(
          `https://my.click.uz/services/pay?service_id=24899&merchant_id=17375&amount=${sum}&transaction_param=${user.uid}`,
        );
      } else {
        if (type === 1) {
          let str = `m=62fa657ea12ad7a48f4b2dd9;ac.user_id=${user.uid};a=${
            sum * 100
          }`;
          // eslint-disable-next-line no-undef
          let url = encode(str);
          Linking.openURL('https://checkout.paycom.uz/' + url);
        }
      }
    } catch (error) {
      console.error('Err', error);
    }
  };

  const getUser = useCallback(async () => {
    try {
      const { data } = await axios.post(
        URL + '/user/askjshshir',
        {
          jshshir: user.pinfl,
        },
        {
          headers: {
          },
        },
      );
      if (data.success) {
        navigation.navigate('MyIdScreen');
        setLoading(false);
      } else {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'top',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: "Xisobingizda yetarli mablag' mavjud emas.",
          },
        });
      }
    } catch (error) {
      setLoading(false);
    }
  }, [navigation, user.pinfl]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        getUser();
      }
    });
    return () => {
      sub.remove();
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          position: 'absolute',
          height: style.height / 3,
          width: '100%',
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={title} />
      <View style={[styles.main]}>
        <View style={styles.aboutUsContainer}>
          <View
            style={{ width: '90%', alignSelf: 'center', marginVertical: 20 }}
          >
            <View>
              <View style={styles.card}>
                <View style={styles.insideMoney}>
                  {type === 0 ? (
                    <ClickIcon width={200} height={50} color={style.blue} />
                  ) : type === 1 ? (
                    <Image source={require('../../../images/payme.png')} />
                  ) : (
                    <Image source={require('../../../images/paynet.png')} />
                  )}
                </View>
              </View>
            </View>
            <View style={{ marginTop: 20 }}>
              <View style={[styles.TextInputLabelContainer, { width: '100%' }]}>
                <View style={styles.inputTitle}>
                  <Text style={styles.phoneText} allowFontScaling={false}>
                    So'm:{' '}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    allowFontScaling={false}
                    value={sum}
                    placeholder={t('844')}
                    placeholderTextColor={style.placeHolderColor}
                    keyboardType="number-pad"
                    onChangeText={text => {
                      setSum(text);
                    }}
                    style={[styles.TextInput, { paddingLeft: 15 }]}
                  />
                </View>
              </View>
              <TouchableOpacity
                disabled={sum.length > 3 ? false : true}
                activeOpacity={0.8}
                onPress={PayUser}
                style={[
                  styles.registerButton,
                  {
                    backgroundColor:
                      sum.length > 3 ? style.blue : style.disabledButtonColor,
                  },
                ]}
              >
                <Text style={styles.text} allowFontScaling={false}>
                  To'ldirish
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PayScreenForRecovery;

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
  phoneText: {
    color: '#000',
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
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
