import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {style} from '../../theme/style';
import NewPasspord from '../../images/newpasspord.svg';
import BackButton from '../components/BackButton';
import {Checkbox} from 'react-native-paper';
const Identifikatsiya = () => {
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
            style={{
              alignItems: 'center',
              flex: 0.56,
              justifyContent: 'center',
            }}>
            <NewPasspord width="70%" height="70%" />
          </View>
          <View style={{alignItems: 'center'}}>
            <Text
              style={[
                styles.enterText,
                {marginBottom: 30, fontFamily: style.fontFamilyBold},
              ]}>
              Identifikatsiya
            </Text>
          </View>
          <View
            style={{
              width: '90%',
              alignSelf: 'center',
            }}>
            <Text
              style={[
                styles.enterText,
                {
                  fontSize: style.fontSize.small,
                  textAlign: 'center',
                  maxWidth: '100%',
                  fontFamily: style.fontFamilyMedium,
                },
              ]}>
              Jismoniy shaxs sifatida identifikatsiyadan o’tish uchun mobil
              hisobingizda yetarlicha mablag’ bo’lishi lozim.
            </Text>
          </View>
          <View style={styles.main}>
            <View>
              <View
                style={[styles.TextInputLabelContainer, {marginBottom: 25}]}>
                <View style={styles.retryPassword}>
                  <Text style={styles.phoneText}>
                    Pasport seriya va raqamini kiriting
                  </Text>
                </View>
                <View style={{flex: 1}}>
                  <TextInput
                    placeholder="AA9025236"
                    placeholderTextColor={style.placeHolderColor}
                    keyboardType="default"
                    style={styles.TextInput}
                  />
                </View>
              </View>
              <View style={styles.TextInputLabelContainer}>
                <View style={styles.retryPassword}>
                  <Text style={styles.phoneText}>
                    Tug`ilgan sanani kiriting
                  </Text>
                </View>
                <View style={{flex: 1}}>
                  <TouchableOpacity style={styles.buttontime}>
                    <Text
                      style={{
                        fontFamily: style.fontFamilyMedium,
                        color: style.textColor,
                        fontSize: style.fontSize.xx,
                      }}>
                      22/11/1997
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <View style={{width: '90%', alignSelf: 'center'}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 10,
              }}>
              <View>
                <Checkbox status="checked" color={style.blue} />
              </View>
              <View>
                <Text
                  style={[
                    styles.enterText,
                    {
                      fontSize: style.fontSize.small,
                      textAlign: 'left',
                      maxWidth: '90%',
                      fontFamily: style.fontFamilyMedium,
                    },
                  ]}>
                  “Davom etish” bilan sizning mobil hisobingizdan 2000 so’m
                  miqdorida mablag’ yechib olinadi.
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.enterButtonContainer}>
            <TouchableOpacity activeOpacity={0.8} style={styles.enterButton}>
              <Text style={[styles.enterText, {color: '#fff'}]}>
                Davom etish
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Identifikatsiya;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttontime: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    justifyContent: 'center',
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
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
  },
  enterButtonContainer: {
    marginTop: 20,
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
    borderRadius: 10,
    height: style.buttonHeight,
    alignSelf: 'center',
  },
  enterText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },
  BackButton: {
    position: 'absolute',
    marginLeft: 15,

    zIndex: 1,
    marginTop: Platform.OS === 'android' ? 10 : null,
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
