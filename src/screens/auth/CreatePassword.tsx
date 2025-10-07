import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Platform,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { style } from '../../theme/style';
import NewPasspord from '../../images/newpasspord.svg';
import { useDispatch } from 'react-redux';
import { CreatePasswordSendApi } from '../../store/api/auth';

import OtherHeader from '../components/OtherHeader';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import MainText from '../components/MainText';
import { font, fontSize } from '../../theme/font';
import { colors } from '../../theme/colors';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';

import CheckIcon from '../../images/CheckIcon';
import { useTranslation } from 'react-i18next';
import Loading from '../components/Loading';

const CreatePassword = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const route = useRoute();
  const { phone, code } = route.params;

  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Password validation states
  const [validation, setValidation] = useState({
    lower: false,
    upper: false,
    number: false,
    symbol: false,
    minLength: false,
    noSpace: true,
  });

  const isFormValid = useMemo(() => {
    return Object.values(validation).every(Boolean) && value === confirmValue;
  }, [validation, value, confirmValue]);

  const handlePasswordChange = text => {
    console.log(text, 'text');
    setValue(text);
    setValidation(prev => ({
      ...prev,
      lower: /[\p{Ll}]/u.test(text), // any lowercase letter
      upper: /[\p{Lu}]/u.test(text), // any uppercase letter
      number: /\p{Nd}/u.test(text), // any digit (Arabic, Cyrillic, etc.)
      symbol: /[^\p{L}\p{Nd}\s]/u.test(text), // any symbol
      minLength: text.length >= 8,
      noSpace: !/\s/.test(text),
    }));
  };

  const SendCreatePassword = async () => {
    try {
      console.log(phone.replace(/\s/g, ''), 'asdads');
      setLoading(true);
      const response = await dispatch(
        CreatePasswordSendApi({
          phone: phone.replace(/\s/g, ''),
          code,
          password: value,
        }),
      ).unwrap();
      console.log(response, 'response');

      if (response.success === true) {
        setLoading(false);
        Toast.show({
          autoHide: true,
          type: 'omad',
          topOffset: 50,
          position: 'top',
          visibilityTime: 2000,
          props: {
            desc: t('99'),
          },
        });
        setTimeout(() => {
          navigation.navigate('LoginWithPhone');
        }, 2000);
      }
    } catch (error) {
      setLoading(false);
      console.log(JSON.stringify(error, null, 2));
    }
  };

  const renderValidation = useMemo(
    () => (
      <View style={{ width: '90%', alignSelf: 'center', marginTop: 10 }}>
        {[
          { label: t('78'), valid: validation.minLength },
          { label: t('81'), valid: validation.lower },
          { label: t('75'), valid: validation.upper },
          { label: t('84'), valid: validation.number },
          { label: t('87'), valid: validation.symbol },
          { label: t('90'), valid: validation.noSpace },
          {
            label: t("Parollar bir xil bo'lishi kerak"),
            valid: value === confirmValue,
          },
        ].map(({ label, valid }, index) => (
          <View style={styles.validationItem} key={index}>
            <CheckIcon
              width={20}
              height={20}
              color={valid ? 'green' : '#000'}
            />
            <Text
              style={[
                styles.validationText,
                { color: valid ? 'green' : '#000' },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    ),
    [
      t,
      validation.minLength,
      validation.lower,
      validation.upper,
      validation.number,
      validation.symbol,
      validation.noSpace,
      value,
      confirmValue,
    ],
  );

  const onChangeShow = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const onChangeShowConfirm = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const renderButton = useMemo(() => {
    return (
      <TextInput
        key={'password'}
        // title={t('696')}
        // password={value}
        value={value}
        selectTextOnFocus={false}
        secureTextEntry={!showPassword}
        style={styles.textInput}
        onChangeText={text => {
          handlePasswordChange(text);
        }}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.disabledButtonColor}
      />
    );
  }, [showPassword, value]);

  const renderButtonConfirm = useMemo(() => {
    return (
      <TextInput
        key={'confirm'}
        value={confirmValue}
        secureTextEntry={!showConfirmPassword}
        onChangeText={setConfirmValue}
        keyboardType="default"
        style={styles.textInput}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.disabledButtonColor}
      />
    );
  }, [confirmValue, showConfirmPassword]);

  console.log(value, 'value');
  if (loading) {
    return <Loading />;
  }
  return (
    <View style={[styles.container]}>
      <OtherHeader
        title={t('63')}
        titleColor="#000"
        iconColor={'#fff'}
        backgroundColor={style.blue}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NewPasspord width={200} height={200} />
            </View>

            <View style={styles.main}>
              <View
                style={{
                  alignItems: 'center',
                  width: '90%',
                }}
              >
                {/* <PhoneInput value={phone} /> */}
                <MainText
                  textAlign="center"
                  color={colors.black}
                  size={fontSize[14]}
                  style={styles.infoText}
                >
                  {t('66')}
                </MainText>
              </View>
            </View>
            <View style={styles.main}>
              <View style={{ width: '90%' }}>
                <View style={styles.confirmInputContainer}>
                  <Text style={styles.label}>{t('69')}</Text>
                  {renderButton}
                  <TouchableOpacity
                    onPress={onChangeShow}
                    style={{ position: 'absolute', right: 10, top: 15 }}
                  >
                    {showPassword ? (
                      <EyeClose width={24} height={24} color={style.blue} />
                    ) : (
                      <Eye width={24} height={24} color={style.blue} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
                <View style={styles.confirmInputContainer}>
                  <Text style={styles.label}>{t('72')}</Text>
                  {renderButtonConfirm}
                  <TouchableOpacity
                    onPress={onChangeShowConfirm}
                    style={{ position: 'absolute', right: 10, top: 15 }}
                  >
                    {showConfirmPassword ? (
                      <EyeClose width={24} height={24} color={style.blue} />
                    ) : (
                      <Eye width={24} height={24} color={style.blue} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {renderValidation}
            <View style={styles.enterButtonContainer}>
              <TouchableOpacity
                disabled={!isFormValid || loading}
                onPress={() => {
                  SendCreatePassword();
                }}
                activeOpacity={0.8}
                style={[
                  styles.updateButton,
                  {
                    backgroundColor:
                      isFormValid || !loading
                        ? style.blue
                        : style.disabledButtonColor,
                  },
                ]}
              >
                <Text style={styles.updateButtonText}>{t('45')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreatePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  infoText: {
    textAlign: 'center',
    marginVertical: 10,
  },
  label: {
    position: 'absolute',
    left: 15,
    top: -10,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontSize: fontSize[12],
    color: colors.black,
    zIndex: 1,
    fontFamily: style.fontFamilyMedium,
  },
  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 8,
    width: '90%',
    alignSelf: 'center',
  },
  validationContainer: {
    marginTop: 10,
    marginBottom: 10,
    width: '90%',
  },
  validationText: {
    marginLeft: 5,
    fontSize: fontSize[12],
    fontFamily: style.fontFamilyMedium,
  },
  textInput: {
    width: '100%',
    height: 55,
    paddingLeft: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: fontSize[12],
    color: colors.black,
    fontFamily: style.fontFamilyMedium,
  },
  phoneNumberText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    color: style.textColor,
  },
  confirmInputContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
  },

  updateButtonText: {
    color: '#fff',
    fontSize: fontSize[15],
    fontFamily: font.medium,
  },
  icon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
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
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  inputFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '22%',
    justifyContent: 'flex-end',
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
});
