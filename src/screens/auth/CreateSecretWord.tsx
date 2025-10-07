import {
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {style} from '../../theme/style';
import SecretWord from '../../images/sercretword.svg';
import BackButton from '../components/BackButton';
import MainText from '../components/MainText';
import {font, fontSize} from '../../theme/font';
import {colors} from '../../theme/colors';
const CreateSecretWord = () => {
  const navigation = useNavigation();

  return (
    <View style={[styles.container]}>
      <View style={[styles.BackButton, {marginTop: 40}]}>
        <BackButton
          navigation={navigation}
          IconColor="#fff"
          backgroundColor={style.blue}
        />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{width: style.width, height: style.height}}>
          <View
            style={{alignItems: 'center', flex: 0.5, justifyContent: 'center'}}>
            <SecretWord width="70%" height="70%" />
          </View>
          <View style={{alignItems: 'center'}}>
            <MainText size={fontSize[14]} ft={font.bold}>
              Maxfiy so’z yaratish
            </MainText>
          </View>

          <View style={styles.main}>
            <View style={{marginTop: 20}}>
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
                  }}>
                  <MainText size={fontSize[12]}>
                    Maxfiy so’z uchun savol yarating
                  </MainText>
                </View>
                <View style={{flex: 1}}>
                  <TextInput keyboardType="default" style={styles.TextInput} />
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
                  }}>
                  <MainText size={fontSize[12]}>
                    Maxfiy so’zni yarating
                  </MainText>
                </View>
                <View style={{flex: 1}}>
                  <TextInput keyboardType="default" style={styles.TextInput} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.enterButtonContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('NewPasswordEnter');
              }}
              style={styles.enterButton}>
              <MainText color={colors.white} size={fontSize[16]}>
                Davom etish
              </MainText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateSecretWord;

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
    zIndex: 1,
    marginTop: Platform.OS === 'android' ? 40 : 0,
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
    borderRadius: 6,
    height: style.textInputHeight,
    alignSelf: 'center',
  },
  enterText: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xx,
    color: style.textColor,
  },
  phoneText: {
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
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
