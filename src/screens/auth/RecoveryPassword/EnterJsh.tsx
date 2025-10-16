import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { normalize, style } from '../../../theme/style';
import ResetPassword from '../../../images/RecoveryPassword';
import axios from 'axios';
import OtherHeader from '../../components/OtherHeader';
import { URL } from '../../constants';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../components/ToastConfig';
import Loading from '../../components/Loading';
import { Modal } from 'react-native-paper';
import MainText from '../../components/MainText';
import { fontSize } from '../../../theme/font';
import { colors } from '../../../theme/colors';
import { t } from 'i18next';
import { checkPhoneTime } from '../../../helper/timeChecker';

const EnterJsh = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const [value, setValue] = useState(''); // 33008943120050
  const [loading, setLoading] = useState(false);
  const [hide, setHide] = useState(false);
  const onHandle = useCallback(async () => {
    setLoading(true);
    try {
      if (await checkPhoneTime()) {
        const { data } = await axios.post(
          URL + '/user/askjshshir',
          {
            jshshir: value,
            phone: '+998' + params?.phone,
          },
          {
            headers: {
              Connection: 'close',
            },
          },
        );
        if (data.code === 2) {
          Toast.show({
            autoHide: true,
            visibilityTime: 3000,
            position: 'bottom',
            type: 'error2',
            props: {
              title: 'Xatolik',
              desc: t('JShShIR noto‘g‘ri kiritilgan'),
            },
          });
          setLoading(false);
          return;
        }

        if (data.success) {
          // navigation.navigate('Inforamation', { jshshir: value }); // 2500 tolash haqida ogohlantirsh chiqishi uchun
          // navigation.navigate('ScanFaceMyId');
          navigation.navigate('MyIdScreen', { jshshir: value });
          setTimeout(() => {
            setLoading(false);
          }, 500);
          return;
        } else {
          if (data.code === 0) {
            Toast.show({
              autoHide: true,
              visibilityTime: 3000,
              position: 'bottom',
              type: 'error2',
              props: {
                title: 'Xatolik',
                desc: t('765'),
              },
            });
            setLoading(false);
            return;
            // navigation.navigate('RegisterWithPeople', {type: 1});
          }
          // if (data.code === 1) {
          //   setLoading(false);
          //   navigation.navigate('PayFor', {user: data.data});
          // }
        }
      }
    } catch (error) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc: t('JShShIR noto‘g‘ri kiritilgan'),
        },
      });
      setLoading(false);
    }
  }, [navigation, value]);

  const onModal = useCallback(() => {
    setHide(!hide);
  }, [hide]);

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={[styles.container]}>
      <OtherHeader
        title={t('729')}
        titleColor={'#000'}
        iconColor="#fff"
        backgroundColor={style.blue}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View
            style={{ alignSelf: 'center', marginTop: 20, marginBottom: 20 }}
          >
            <ResetPassword />
          </View>
          <View style={styles.main}>
            <View>
              <View style={styles.TextInputLabelContainer}>
                <View style={styles.bbb}>
                  <MainText size={fontSize[12]} style={styles.phoneText}>
                    {t('732').slice(0, -1)}
                  </MainText>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    allowFontScaling={false}
                    maxLength={14}
                    value={value}
                    onChangeText={text => {
                      setValue(text);
                    }}
                    keyboardType="numeric"
                    style={styles.TextInput}
                  />
                </View>
              </View>
            </View>
          </View>
          <View
            style={{
              width: '90%',
              alignSelf: 'center',
              marginTop: 10,
              alignItems: 'flex-end',
            }}
          >
            <TouchableOpacity onPress={onModal}>
              <MainText
                color={colors.blue}
                size={fontSize[14]}
                style={styles.jshshir}
              >
                {t('735')}
              </MainText>
            </TouchableOpacity>
          </View>
          <View style={styles.enterButtonContainer}>
            <TouchableOpacity
              disabled={value.length >= 14 ? false : true}
              activeOpacity={0.8}
              onPress={onHandle}
              style={[
                styles.enterButton,
                {
                  backgroundColor:
                    value.length >= 14 ? style.blue : style.disabledButtonColor,
                },
              ]}
            >
              <MainText size={fontSize[16]} color={colors.white}>
                {t('45')}
              </MainText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* <Toast config={toastConfig} /> */}
      <ModalView hide={hide} setHide={setHide} />
    </View>
  );
};

export default EnterJsh;

const ModalView = ({ hide, setHide }) => {
  const onClose = useCallback(() => {
    setHide(false);
  }, []);

  return (
    <Modal visible={hide} dismissable={true}>
      <View style={styles.modalView}>
        <Image
          source={require('../../../images/jshir.jpg')}
          style={styles.image}
        />
        <TouchableOpacity
          onPress={onClose}
          style={[styles.enterButton, { marginTop: 10 }]}
        >
          <MainText color={colors.white} size={fontSize[16]}>
            {t('741')}
          </MainText>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '90%',
    height: normalize(270),
    padding: 10,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalView: {
    width: '90%',
    height: normalize(350),
    backgroundColor: 'white',
    alignSelf: 'center',
    borderRadius: 12,
  },
  jshshir: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.blue,
  },
  bbb: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
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
    marginTop: 20,
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
    fontSize: style.fontSize.small + 1,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
