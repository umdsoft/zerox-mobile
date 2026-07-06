import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import PasswordInput from '../components/PasswordInput';
import axios from 'axios';
import {URL} from '../constants';
import {storage} from '../../store/api/token/getToken';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import Loading from '../components/Loading';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
import {t} from 'i18next';
import Svg, {Polyline} from 'react-native-svg';
import {rd, rs} from '../../theme/rd';
import {ChevronLeft, LockIcon} from '../home/redesign/icons';

// Kichik "check" ikonkasi — checklist uchun (bajarilgan shart yashil ✓ bilan).
const Check = ({color}: {color: string}) => (
  <Svg
    width={rs(12)}
    height={rs(12)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const NewPasswordEnter = () => {
  const navigation = useNavigation();
  // const {key} = useRoute().params;
  let key = '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lower, setLower] = useState(false);
  const [upper, setUpper] = useState(false);
  const [number, setNumber] = useState(false);
  const [space, setSpace] = useState(true);
  const [symbole, setSymbole] = useState(false);
  const [min, setMin] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<'confirm' | null>(null);

  const onChangeText = text => {
    setPassword(text);
  };

  const changePasswordHandle = useCallback(async () => {
    try {
      setLoading(true);
      const {data} = await axios.post(
        URL + '/user/edit-password',
        {
          secret: key,
          step: 2,
          password: password,
        },
        {
          headers: {
            Authorization: 'Bearer ' + storage.getString('token'),
          },
        },
      );

      if (data.msg === 'suc-password') {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'omad',
          props: {title: 'Muvaffaqiyatli', desc: t('changepassword')},
        });
        setTimeout(() => {
          navigation.navigate('BottomTabNavigator');
        }, 2000);
      }
    } catch (error) {
      setLoading(false);
    }
  }, [key, navigation, password]);

  const renderValidation = useMemo(() => {
    return (
      <View style={styles.checklist}>
        {[
          {label: 'Kamida 8 belgidan iborat', valid: min},
          {label: 'Kamida bitta kichik harf', valid: lower},
          {label: 'Kamida bitta katta harf', valid: upper},
          {label: 'Kamida bitta raqam', valid: number},
          {label: 'Kamida bitta belgi', valid: symbole},
          {label: "Bo'sh joy bo'lmasligi kerak", valid: space},
        ].map(({label, valid}, index) => (
          <View style={styles.validationItem} key={index}>
            <View
              style={[
                styles.checkDot,
                valid ? styles.checkDotOn : styles.checkDotOff,
              ]}>
              <Check color={valid ? rd.color.onPrimary : rd.color.textTertiary} />
            </View>
            <Text
              style={[
                styles.validationText,
                {color: valid ? rd.color.success : rd.color.textTertiary},
              ]}
              allowFontScaling={false}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    );
  }, [lower, min, number, space, symbole, upper]);

  useEffect(() => {
    if (
      lower === true &&
      upper === true &&
      min === true &&
      number === true &&
      symbole === true &&
      space === true &&
      password === confirmPassword
    ) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [confirmPassword, lower, min, number, password, space, symbole, upper]);

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Orqaga */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroCircle}>
              <LockIcon size={rs(34)} color={rd.color.primary} />
            </View>
            <Text style={styles.title} allowFontScaling={false}>
              Yangi parol kiriting
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Hisobingiz uchun yangi parol o'ylab toping
            </Text>
          </View>

          {/* Yangi parol */}
          <PasswordInput
            title={'Parolni kiriting'}
            password={password}
            onChangeText={onChangeText}
            setLower={setLower}
            setMin={setMin}
            setSymbole={setSymbole}
            setUpper={setUpper}
            setNumber={setNumber}
            setSpace={setSpace}
          />

          {/* Parolni takrorlang */}
          <Text style={[styles.label, {marginTop: rs(16)}]} allowFontScaling={false}>
            Parolni takrorlang
          </Text>
          <View
            style={[styles.field, focused === 'confirm' && styles.fieldFocused]}>
            <View style={styles.leadIcon}>
              <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            </View>
            <TextInput
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
              }}
              secureTextEntry={!showConfirm}
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholderTextColor={rd.color.textTertiary}
              allowFontScaling={false}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowConfirm(prev => !prev)}
              style={styles.eyeBtn}>
              {showConfirm ? (
                <EyeClose width={rs(22)} height={rs(22)} color={rd.color.textSecondary} />
              ) : (
                <Eye width={rs(22)} height={rs(22)} color={rd.color.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {renderValidation}

          {/* Tasdiqlash */}
          <TouchableOpacity
            disabled={disabled}
            onPress={changePasswordHandle}
            activeOpacity={0.85}
            style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}>
            <Text
              style={[
                styles.submitText,
                disabled && {color: rd.color.textTertiary},
              ]}
              allowFontScaling={false}>
              Tasdiqlash
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default NewPasswordEnter;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: rd.color.page},
  content: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
    paddingBottom: rs(28),
  },
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(8),
  },

  hero: {alignItems: 'center', marginTop: rs(16), marginBottom: rs(26)},
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(18),
  },
  title: {fontFamily: rd.font.bold, fontSize: rs(23), color: rd.color.text},
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    lineHeight: rs(20),
    paddingHorizontal: rs(12),
  },

  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  field: {
    height: rs(56),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  fieldFocused: {borderColor: rd.color.primary},
  leadIcon: {marginRight: rs(10)},
  input: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  eyeBtn: {paddingLeft: rs(8), height: '100%', justifyContent: 'center'},

  checklist: {marginTop: rs(20), gap: rs(10)},
  validationItem: {flexDirection: 'row', alignItems: 'center'},
  checkDot: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(10),
  },
  checkDotOn: {backgroundColor: rd.color.success},
  checkDotOff: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
  },
  validationText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    flex: 1,
  },

  submitBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(28),
    shadowColor: rd.color.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: rd.color.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
