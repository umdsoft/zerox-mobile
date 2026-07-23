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
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import Svg, { Polyline } from 'react-native-svg';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

import Eye from '../../../images/auth/Eye';
import EyeClose from '../../../images/auth/CloseEye';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import { t } from 'i18next';
import { rd, rs } from '../../../theme/rd';
import { ChevronLeft, LockIcon } from '../../home/redesign/icons';

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

const UpdatePassword = () => {
  const navigation = useNavigation();
  // myidCode — MyID SDK'dan qaytgan disposable kod; token — askjshshir reset_token.
  const { myidCode, token } = useRoute().params;

  const [value, setValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handlePasswordUpdate = useCallback(async () => {
    setLoading(true);
    try {
      // Yangi oqim: /askjshshir/complete — MyID kodini tekshiradi (PINFL mosligi) VA
      // parolni o'rnatadi (eski /myidchecking + /updatePassword o'rniga, bitta chaqiruv).
      const response = await axios.post(
        `${URL}/user/askjshshir/complete`,
        {
          myid_code: myidCode,
          new_password: value,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      if (response.data.success) {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'omad',
          props: {
            // FAQAT "Parol tiklandi" (so'rov bo'yicha) — "Muvaffaqiyatli
            // bajarildi" sarlavhasi olib tashlandi.
            title: t('Parol tiklandi'),
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
    } catch (error: any) {
      // /askjshshir/complete xatoni 4xx + {error} bilan qaytaradi (axios throw qiladi).
      const errCode = error?.response?.data?.error;
      let desc;
      if (errCode === 'pinfl-mismatch') {
        desc = t('Yuz hisobga mos kelmadi.');
      } else if (errCode === 'invalid-myid-code') {
        desc = t("MyID kodi yaroqsiz. Qaytadan urinib ko'ring.");
      } else if (
        errCode === 'invalid-or-expired-token' ||
        errCode === 'myid-not-initiated'
      ) {
        desc = t("Sessiya muddati tugadi. Parol tiklashni qaytadan boshlang.");
      } else if (errCode === 'myid-verify-failed') {
        desc = t("MyID tekshiruvi muvaffaqiyatsiz. Qayta urinib ko'ring.");
      } else {
        desc = t('Parolni tiklashda xatolik yuz berdi');
      }
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: { desc },
      });
    } finally {
      setLoading(false);
    }
  }, [myidCode, value, navigation, token]);

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
            label: t('Yangi parollar mos kelmayapti'),
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
    [validation, value, confirmValue],
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
            <ChevronLeft size={rs(22)} color={rd.color.onPrimary} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroCircle}>
              <LockIcon size={rs(34)} color={rd.color.primary} />
            </View>
            <Text style={styles.title} allowFontScaling={false}>
              {t('729')}
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              {t('66')}
            </Text>
          </View>

          {/* Yangi parol */}
          <Text style={styles.label} allowFontScaling={false}>
            {t('696')}
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
              onChangeText={handlePasswordChange}
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
            {t('699')}
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

          {/* Tasdiqlash */}
          <TouchableOpacity
            disabled={!isFormValid || loading}
            onPress={handlePasswordUpdate}
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

export default UpdatePassword;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
    paddingBottom: rs(28),
  },
  // TO'LDIRILGAN KO'K orqaga knopkasi (oq/kulrang sezilmasdi).
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(8),
  },

  hero: { alignItems: 'center', marginTop: rs(16), marginBottom: rs(26) },
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(18),
  },
  title: { fontFamily: rd.font.bold, fontSize: rs(23), color: rd.color.text },
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
