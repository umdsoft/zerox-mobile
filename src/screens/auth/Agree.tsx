import {
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {style} from '../../theme/style';
import AgreeSVG from '../../images/agree.svg';
import CheckBox from '@react-native-community/checkbox';
import {colors} from '../../theme/colors';
import MainText from '../components/MainText';
import {fontSize} from '../../theme/font';
import {t} from 'i18next';

const Agree = () => {
  const navigation = useNavigation();
  const [checked, setChecked] = useState(false);
  return (
    <View style={styles.container}>
      <View style={{width: style.width, height: style.height}}>
        <View
          style={{alignItems: 'center', flex: 0.5, justifyContent: 'center'}}>
          <AgreeSVG width="70%" height="70%" />
        </View>
        <View style={{flex: 0.5}}>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              width: '80%',
              alignSelf: 'center',
            }}>
            <View>
              <CheckBox
                value={checked}
                tintColors={{true: style.blue, false: style.blue}}
                tintColor={colors.blue}
                onValueChange={value => {
                  setChecked(value);
                }}
                boxType="square"
                style={{height: 20, width: 20}}
                onCheckColor={colors.blue}
              />
            </View>
            <View style={{marginLeft: 5}}>
              <MainText color={colors.black} size={fontSize[12]} mrLeft={6}>
                {/* Universal shartnoma bilan tanishib chiqib, shartnomaning barcha
                shartlariga rozi{'\n'}ekanligimni tasdiqlayman */}
                {t('846')}
              </MainText>
            </View>
          </View>

          <View style={styles.enterButtonContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('BottomTabNavigator');
              }}
              activeOpacity={0.8}
              style={styles.enterButton}>
              <MainText color={colors.white} size={fontSize[16]}>
                {t('42')}
              </MainText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Agree;

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
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
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
    fontSize: style.fontSize.s,
    color: style.textColor,
  },
  notificationText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
    textAlign: 'left',
  },

  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 15,
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
