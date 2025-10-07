import {
  Alert,
  DeviceEventEmitter,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import BackButton from '../components/BackButton';
import {normalize, style} from '../../theme/style';
import RegisterWithJuridic from '../../images/auth/illustrationregisterwithpeople.svg';

import {eimzo} from '../../nativemodule/android.event';
import axios from 'axios';
import {URL} from '../constants';
import Loading from '../components/Loading';
import {storage} from '../../store/api/token/getToken';
import {Toast} from 'react-native-toast-message';
import MainText from '../components/MainText';
import {colors} from '../../theme/colors';
import {font, fontSize} from '../../theme/font';
import {useTranslation} from 'react-i18next';

const Register = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const {i18n} = useTranslation();

  const onOpenNativeFunction = useCallback(async () => {
    if (Platform.OS === 'android') {
      // Linking.canOpenURL('https://my.soliq.uz').then(val => {
      //   if (val) {
      eimzo();
      //   } else {
      //     Linking.openURL(
      //       'https://play.google.com/store/apps/details?id=uz.yt.idcard.eimzo&hl=en&gl=US',
      //     );
      //   }
      // });
    } else {
      Alert.alert('Xatolik', 'hozircha faqat androidda mavjud');
    }
  }, []);

  const onPostUserData = useCallback(
    async item => {
      try {
        const {data} = await axios.post(URL + '/user/legal', {
          stir: item.subjectCertificateInfo.subjectName['1.2.860.3.16.1.1'],
          company: item.subjectCertificateInfo.subjectName['company'],
          address: item.subjectCertificateInfo.subjectName['ST'],
          director: item.subjectCertificateInfo.subjectName['T'],
          lang: i18n.language,
        });
        if (data.success && data?.token) {
          storage.set('token', data?.token);
          navigation.reset({
            routes: [
              {name: 'BottomTabNavigator', params: {token: data?.token}},
            ],
            index: 0,
          });
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    },
    [navigation],
  );

  useEffect(() => {
    DeviceEventEmitter.addListener('eimzo', data => {
      let a = JSON.parse(data.data);
      let code = a.subjectCertificateInfo.subjectName['1.2.860.3.16.1.1'];
      if (code.slice(0, 1) === 2 || 3) {
        setLoading(true);
        onPostUserData(JSON.parse(data.data));
      } else {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: 'Hurmatli foydalanuvchi, e-imzo orqali jismoniy shaxs sifatida ilovadan foydalana olmaysiz.',
          },
        });
      }
    });

    DeviceEventEmitter.addListener('eimzo_error', data => {
      console.log(data, 'errorr');
    });

    return () => {
      DeviceEventEmitter.removeAllListeners('eimzo');
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.BackButton,
          {marginTop: Platform.OS === 'android' ? 10 : normalize(35)},
        ]}>
        <BackButton
          navigation={navigation}
          IconColor="#fff"
          backgroundColor={style.blue}
        />
      </View>
      <View style={{width: style.width, height: style.height}}>
        <View
          style={{alignItems: 'center', flex: 0.5, justifyContent: 'center'}}>
          <RegisterWithJuridic width="70%" height="70%" />
        </View>
        <View style={{alignItems: 'center'}}>
          <MainText color={colors.black} size={fontSize[16]} ft={font.bold}>
            Avtorizatsiya
          </MainText>
        </View>

        {/* <View style={styles.main}>
          <View>
            <View style={[styles.TextInputLabelContainer, {marginBottom: 25}]}>
              <View style={styles.retryPassword}>
                <Text style={styles.phoneText}>STIRni kiriting</Text>
              </View>
              <View style={{flex: 1}}>
                <TextInput
                  placeholderTextColor={style.placeHolderColor}
                  placeholder="AA1215125"
                  keyboardType="default"
                  style={styles.TextInput}
                />
              </View>
            </View>
            <View style={styles.TextInputLabelContainer}>
              <View
                style={{
                  position: 'absolute',
                  marginLeft: 15,
                  flex: 1,
                  zIndex: 1,
                  top: -10,
                  backgroundColor: '#fff',
                  paddingLeft: 5,
                  paddingRight: 5,
                }}
              >
                <Text style={styles.phoneText}>
                  Telefon raqamingizni kiriting
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '22%',
                  justifyContent: 'flex-end',
                }}
              >
                <Uzbekistan width="40%" height="40%" />
                <Text style={styles.phoneNumberText}>+998</Text>
              </View>
              <View style={{flex: 1}}>
                <TextInput
                  placeholder="00 000 00 00"
                  placeholderTextColor={style.placeHolderColor}
                  maxLength={9}
                  keyboardType="number-pad"
                  style={[styles.TextInput, {paddingLeft: 5}]}
                />
              </View>
            </View>
          </View>
        </View> */}
        <View style={styles.enterButtonContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenNativeFunction}
            style={styles.enterButton}>
            <MainText color={colors.white} size={fontSize[16]}>
              E-imzo orqali kirish
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  enterButtonContainer: {
    marginTop: 20,
  },
  phoneNumberText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  retryPassword: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  BackButton: {
    position: 'absolute',
    marginLeft: 15,
    zIndex: 1,
    marginTop: Platform.OS === 'android' ? 40 : 0,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
  },

  main: {
    alignItems: 'center',
    marginTop: 20,
  },
  enterButton: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    height: style.textInputHeight,
    alignSelf: 'center',
  },
  enterText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },

  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 15,
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
