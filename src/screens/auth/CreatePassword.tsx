import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Polyline } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { CreatePasswordSendApi } from '../../store/api/auth';

import { Toast } from 'react-native-toast-message/lib/src/Toast';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';

import { useTranslation } from 'react-i18next';
import Loading from '../components/Loading';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, LockIcon } from '../home/redesign/icons';
import { GradientIconBadge } from '../components/BrandLockup';

// Kichik "check" ikonkasi — checklist uchun (bajarilgan shart yashil ✓ bilan).
const Check = ({ color }: { color: string }) => (
  <Svg
    width={rs(12)}
    height={rs(12)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

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
  const [focused, setFocused] = useState<'password' | 'confirm' | null>(null);
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

  const SendCreatePassword = async () => {
    try {
      setLoading(true);
      const response = await dispatch(
        CreatePasswordSendApi({
          phone: phone.replace(/\s/g, ''),
          code,
          password: value,
        }),
      ).unwrap();

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
      Toast.show({
        autoHide: true,
        type: 'error2',
        topOffset: 50,
        position: 'top',
        visibilityTime: 3000,
        props: {
          title: 'Xatolik!',
          desc: t('738'),
        },
      });
    }
  };

  const renderValidation = useMemo(
    () => (
      <View style={styles.checklist}>
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
            <View
              style={[
                styles.checkDot,
                valid ? styles.checkDotOn : styles.checkDotOff,
              ]}
            >
              <Check color={valid ? rd.color.onPrimary : rd.color.textTertiary} />
            </View>
            <Text
              style={[
                styles.validationText,
                { color: valid ? rd.color.success : rd.color.textTertiary },
              ]}
              allowFontScaling={false}
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

  if (loading) {
    return <Loading />;
  }
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Orqaga */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <GradientIconBadge size={rs(84)}>
              <LockIcon size={rs(34)} color={rd.color.primary} />
            </GradientIconBadge>
            <Text style={styles.title} allowFontScaling={false}>
              {t('63')}
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              {t('66')}
            </Text>
          </View>

          {/* Yangi parol */}
          <Text style={styles.label} allowFontScaling={false}>
            {t('69')}
          </Text>
          <View
            style={[styles.field, focused === 'password' && styles.fieldFocused]}
          >
            <View style={styles.leadIcon}>
              <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            </View>
            <TextInput
              key={'password'}
              value={value}
              selectTextOnFocus={false}
              secureTextEntry={!showPassword}
              style={styles.input}
              onChangeText={text => {
                handlePasswordChange(text);
              }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={rd.color.textTertiary}
              allowFontScaling={false}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onChangeShow}
              style={styles.eyeBtn}
            >
              {showPassword ? (
                <EyeClose width={rs(22)} height={rs(22)} color={rd.color.textSecondary} />
              ) : (
                <Eye width={rs(22)} height={rs(22)} color={rd.color.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Parolni tasdiqlang */}
          <Text style={[styles.label, { marginTop: rs(16) }]} allowFontScaling={false}>
            {t('72')}
          </Text>
          <View
            style={[styles.field, focused === 'confirm' && styles.fieldFocused]}
          >
            <View style={styles.leadIcon}>
              <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            </View>
            <TextInput
              key={'confirm'}
              value={confirmValue}
              secureTextEntry={!showConfirmPassword}
              onChangeText={setConfirmValue}
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
              keyboardType="default"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={rd.color.textTertiary}
              allowFontScaling={false}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onChangeShowConfirm}
              style={styles.eyeBtn}
            >
              {showConfirmPassword ? (
                <EyeClose width={rs(22)} height={rs(22)} color={rd.color.textSecondary} />
              ) : (
                <Eye width={rs(22)} height={rs(22)} color={rd.color.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {renderValidation}

          {/* Davom etish */}
          <TouchableOpacity
            disabled={!isFormValid || loading}
            onPress={() => {
              SendCreatePassword();
            }}
            activeOpacity={0.85}
            style={[
              styles.submitBtn,
              (!isFormValid || loading) && styles.submitBtnDisabled,
            ]}
          >
            <Text
              style={[
                styles.submitText,
                (!isFormValid || loading) && { color: rd.color.textTertiary },
              ]}
              allowFontScaling={false}
            >
              {t('45')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreatePassword;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
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

  hero: { alignItems: 'center', marginTop: rs(16), marginBottom: rs(26) },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(23),
    color: rd.color.text,
    marginTop: rs(18),
  },
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
  fieldFocused: { borderColor: rd.color.primary },
  leadIcon: { marginRight: rs(10) },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  eyeBtn: { paddingLeft: rs(8), height: '100%', justifyContent: 'center' },

  checklist: { marginTop: rs(20), gap: rs(10) },
  validationItem: { flexDirection: 'row', alignItems: 'center' },
  checkDot: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(10),
  },
  checkDotOn: { backgroundColor: rd.color.success },
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
    shadowOffset: { width: 0, height: 6 },
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
