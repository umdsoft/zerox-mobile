import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import ResetPasswordIcon from '../../../images/RecoveryPassword';
import CheckIcon from '../../../images/CheckIcon';
import OtherHeader from '../../components/OtherHeader';
import Loading from '../../components/Loading';

import MainText from '../../components/MainText';
import { URL } from '../../constants';
import { style, fontSize, colors } from '../../../theme/index';
import { t } from 'i18next';

const UpdatePassword = () => {
  const navigation = useNavigation();
  const { user } = useRoute().params;

  const [value, setValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handlePasswordUpdate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${URL}/user/updatePassword`,
        {
          jshshir: user.pinfl,
          password: value,
        },
        {
          headers: {
            Connection: 'close',
          },
        },
      );

      if (response.data.success) {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'omad',
          props: {
            title: t('243'),
            desc: t('Parol tiklandi'),
          },
        });
        setLoading(false);
        setTimeout(() => {
          navigation.reset({
            routes: [{ name: 'LoginWithPhone' }],
            index: 0,
          });
        }, 2000);
      } else {
        const errorMessage =
          response.data.code == 1
            ? t('825')
            : t('Parolni tiklashda xatolik yuz berdi');

        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc: errorMessage,
          },
        });
        setLoading(false);
      }
    } catch (error) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          desc: t('Parolni tiklashda xatolik yuz berdi'),
        },
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [value, navigation]);

  const renderValidation = useMemo(
    () => (
      <View style={styles.validationContainer}>
        {[
          { label: t('78'), valid: validation.minLength },
          { label: t('81'), valid: validation.lower },
          { label: t('75'), valid: validation.upper },
          { label: t('84'), valid: validation.number },
          { label: t('87'), valid: validation.symbol },
          { label: t('90'), valid: validation.noSpace },
          {
            label: t('Yangi parollar mos kelmayapti'),
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
    [validation, value, confirmValue],
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <OtherHeader
        title={t('729')}
        titleColor="#000"
        iconColor="#fff"
        backgroundColor={style.blue}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <ResetPasswordIcon />
          </View>

          <MainText
            color={colors.black}
            size={fontSize[12]}
            textAlign="center"
            style={styles.infoText}
          >
            {t('66')}
          </MainText>

          <View style={styles.inputContainer}>
            <View style={styles.confirmInputContainer}>
              <Text style={styles.label}>{t('696')}</Text>
              <TextInput
                // title={t('696')}
                // password={value}
                value={value}
                style={styles.textInput}
                onChangeText={handlePasswordChange}
                placeholderTextColor={colors.disabledButtonColor}
              />
            </View>

            <View style={styles.confirmInputContainer}>
              <Text style={styles.label}>{t('699')}</Text>
              <TextInput
                value={confirmValue}
                onChangeText={setConfirmValue}
                keyboardType="default"
                style={styles.textInput}
                placeholderTextColor={colors.disabledButtonColor}
              />
            </View>
          </View>

          {renderValidation}

          <TouchableOpacity
            disabled={!isFormValid}
            onPress={handlePasswordUpdate}
            style={[
              styles.updateButton,
              {
                backgroundColor: isFormValid
                  ? style.blue
                  : style.disabledButtonColor,
              },
            ]}
          >
            <Text style={styles.updateButtonText}>{t('45')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  contentContainer: {
    padding: 20,
  },
  iconContainer: {
    alignSelf: 'center',
    marginVertical: 20,
  },
  infoText: {
    textAlign: 'center',
    marginVertical: 10,
  },
  inputContainer: {
    // marginBottom: 10,
  },
  confirmInputContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
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
  validationContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  validationText: {
    marginLeft: 10,
    fontSize: fontSize[12],
    fontFamily: style.fontFamilyMedium,
  },
  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    borderRadius: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: fontSize[16],
    fontFamily: style.fontFamilyMedium,
  },
});

export default UpdatePassword;
