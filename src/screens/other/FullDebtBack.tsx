import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {BackGroundIcon, PurseIcon} from '../../helper/homeIcon';
import {normalize, style} from '../../theme/style';
import BackButton from '../components/BackButton';
import {useNavigation} from '@react-navigation/native';

import CheckBox from '@react-native-community/checkbox';
import OtherHeader from '../components/OtherHeader';

const FullDebtBack = () => {
  const [check, setCheck] = useState(false);
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View
        style={{position: 'absolute', height: style.height / 3, width: '100%'}}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={' Qarzni to’liq qaytarishni talab qilish'} />
      <View style={[styles.main]}>
        <View style={{marginTop: 10}}>
          <BackButton
            navigation={navigation}
            backgroundColor={'#fff'}
            IconColor={style.blue}
          />
        </View>
        <View style={styles.aboutUsContainer}>
          <View style={{width: '90%', alignSelf: 'center', marginVertical: 20}}>
            <View>
              <View style={[styles.card]}>
                <View style={styles.insideMoney}>
                  <Text
                    style={[styles.hisob, {fontSize: style.fontSize.small}]}
                  >
                    01.01.2021 yildagi 1-sonli qarz shartnomasi bo‘yicha siz
                    fuqaro Abdullayev Abdulladan qarzni to’liq qaytarishini
                    talab qilmoqdasiz.
                  </Text>
                </View>
              </View>
            </View>
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 20,
                }}
              >
                <CheckBox
                  value={check}
                  tintColor={style.blue}
                  tintColors={{
                    true: style.blue,
                    false: style.disabledButtonColor,
                  }}
                  onValueChange={() => setCheck(!check)}
                />
                <Text style={styles.phoneText}>
                  Ushbu jarayon yuzasidan rasmiylashtirilgan dalolatnoma bilan
                  tanishdim
                </Text>
              </View>
            </View>
            <View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.registerButton, {marginTop: 20}]}
              >
                <Text style={[styles.textButton]}>Tasdiqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default FullDebtBack;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
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
    width: '100%',
    flexDirection: 'row',
    marginTop: 30,
    alignSelf: 'center',
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  hisob: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    textAlign: 'center',
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
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
  },
  item: {
    flex: 1,
  },
  info: {
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    textAlign: 'left',
  },
  header: {
    backgroundColor: '#fff',
    height: style.height / 15,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
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
  },
});
