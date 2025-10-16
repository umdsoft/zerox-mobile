import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {style} from '../../theme/style';
import ResetPassword from '../../images/RecoveryPassword';
import axios from 'axios';
import OtherHeader from '../components/OtherHeader';
import {URL} from '../constants';
import Toast from 'react-native-toast-message';
import {toastConfig} from '../components/ToastConfig';
import {storage} from '../../store/api/token/getToken';
import Loading from '../components/Loading';
const NewRecoveryPassword = () => {
  // 1 type parolni uzgartirish
  // 2 parolni tiklash
  const {type} = useRoute().params;
  const navigation = useNavigation();

  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const changePasswordHandle = useCallback(async () => {}, []);
  if (loading) {
    return <Loading />;
  }
  console.log('red');

  return (
    <View style={[styles.container]}>
      <OtherHeader
        title={type === 2 ? 'Parolni tiklash' : "Parolni o'zgartirish"}
        titleColor={'#000'}
        iconColor="#fff"
        backgroundColor={style.blue}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={{alignSelf: 'center', marginTop: 20, marginBottom: 20}}>
            <ResetPassword />
          </View>

          <View style={{alignItems: 'center'}}>
            <Text
              style={[
                styles.enterText,
                {
                  fontSize: style.fontSize.xx,
                  fontFamily: style.fontFamilyMedium,
                  textAlign: 'center',
                },
              ]}
              allowFontScaling={false}>
              {type === 2
                ? 'Parolni tiklash uchun maxfiy so’zni kiriting'
                : 'Parolni o‘zgartirish uchun\nmaxfiy so‘zni kiriting'}
            </Text>
          </View>
          <View style={styles.main}>
            <View>
              <Text
                style={[
                  styles.enterText,
                  {
                    fontSize: style.fontSize.small,
                    marginBottom: 20,
                    marginTop: 40,
                    fontFamily: style.fontFamilyMedium,
                    color: style.disabledButtonColor,
                  },
                ]}
                allowFontScaling={false}>
                Maxfiy so‘z: Men aytgan gap
              </Text>

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
                  <Text style={styles.phoneText} allowFontScaling={false}>Maxfiy so’zni kiriting</Text>
                </View>
                <View style={{flex: 1}}>
                  <TextInput
                    value={value}
                    onChangeText={text => {
                      setValue(text);
                    }}
                    keyboardType="default"
                    style={styles.TextInput}
                    allowFontScaling={false} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.enterButtonContainer}>
            <TouchableOpacity
              disabled={value.length >= 0 ? false : true}
              activeOpacity={0.8}
              onPress={() => {
                if (type === 1) {
                  changePasswordHandle();
                } else {
                  navigation.navigate('NewPasswordEnter');
                }
              }}
              style={[
                styles.enterButton,
                {
                  backgroundColor:
                    value.length >= 0 ? style.blue : style.disabledButtonColor,
                },
              ]}
            >
              <Text style={[styles.enterText, {color: '#fff'}]} allowFontScaling={false}>
                Davom etish
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* <Toast config={toastConfig} /> */}
    </View>
  );
};

export default NewRecoveryPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
  },
  registerButton: {
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 6,
    paddingBottom: 10,
    paddingTop: 10,
  },
  BackButton: {
    position: 'absolute',
    marginLeft: 15,
    marginTop: 15,
    zIndex: 1,
  },
  enterButtonContainer: {
    marginTop: 20,
  },
  main: {
    alignItems: 'center',
  },
  enterButton: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: style.textInputHeight,
    alignSelf: 'center',
  },
  enterText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  phoneNumberText: {
    marginLeft: 5,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 15,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
