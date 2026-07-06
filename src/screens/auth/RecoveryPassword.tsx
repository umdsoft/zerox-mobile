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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { storage } from '../../store/api/token/getToken';
import { t } from 'i18next';
import Loading from '../components/Loading';
import Check from '../../images/CheckIcon';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
import { URL } from '../constants';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, LockIcon } from '../home/redesign/icons';

const PasswordInput = React.memo(
  ({
    value,
    onChangeText,
    secureTextEntry,
    title,
    showPassword,
    onTogglePassword,
  }) => {
    const [focused, setFocused] = useState(false);
    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>{t(title)}</Text>
        <View style={[styles.field, focused && styles.fieldFocused]}>
          <View style={styles.leadIcon}>
            <LockIcon size={rs(20)} color={rd.color.textTertiary} />
          </View>
          <TextInput
            allowFontScaling={false}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!showPassword}
            placeholderTextColor={rd.color.textTertiary}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.input}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onTogglePassword}
            style={styles.eyeBtn}
          >
            {showPassword ? (
              <EyeClose
                width={rs(22)}
                height={rs(22)}
                color={rd.color.textSecondary}
              />
            ) : (
              <Eye
                width={rs(22)}
                height={rs(22)}
                color={rd.color.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);
const ValidationItem = React.memo(
  ({ isValid, text }: { isValid: boolean; text: string }) => (
    <View style={styles.validationItem}>
      <Check
        width={rs(18)}
        height={rs(18)}
        color={isValid ? rd.color.success : rd.color.textTertiary}
      />
      <Text
        style={[
          styles.validationText,
          { color: isValid ? rd.color.success : rd.color.textSecondary },
        ]}
      >
        {text}
      </Text>
    </View>
  ),
);

const RecoveryPassword = () => {
  const navigation = useNavigation();
  const [state, setState] = useState({
    prevPassword: '',
    password: '',
    confirmPassword: '',
    loading: false,
    showPrevPassword: false,
    showPassword: false,
    showConfirmPassword: false,
  });

  const [validation, setValidation] = useState({
    lower: false,
    upper: false,
    number: false,
    space: true,
    symbol: false,
    min: false,
    match: false,
  });

  // Memoize the disabled state calculation
  const disabled = useMemo(() => {
    const { lower, upper, number, space, symbol, min, match } = validation;
    return !(
      lower &&
      upper &&
      number &&
      space &&
      symbol &&
      min &&
      match &&
      state.prevPassword.length > 0
    );
  }, [validation, state.prevPassword]);

  // Single handler for all password changes
  const handleChange = useCallback((field, value) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Toggle password visibility
  const togglePassword = useCallback(field => {
    setState(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Memoized password validation
  const validatePassword = useCallback(() => {
    const { password, confirmPassword } = state;
    setValidation({
      lower: /[\p{Ll}]/u.test(password), // any lowercase letter
      upper: /[\p{Lu}]/u.test(password),
      number: /\d/.test(password),
      space: !/\s/.test(password),
      symbol: /[^\p{L}\p{Nd}\s]/u.test(password),
      min: password.length >= 8,
      match: password === confirmPassword,
    });
  }, [state.password, state.confirmPassword]);

  // Only validate when passwords change
  useEffect(() => {
    validatePassword();
  }, [state.password, state.confirmPassword, validatePassword]);

  const showToast = useCallback((type, title, description) => {
    Toast.show({
      autoHide: true,
      visibilityTime: 3000,
      position: 'bottom',
      type: type,
      props: {
        title: title,
        desc: t(description),
      },
    });
  }, []);
  const handleResponse = useCallback(
    json => {
      switch (json.code) {
        case 4:
          showToast(
            'error2',
            t('Xatolik'),
            t('Yangi parol joriy paroldan farq qilishi lozim'),
          );
          break;
        case 0:
          showToast(
            'error2',
            t('Xatolik'),
            t('Bunday foydalanuvchi topilmadi.'),
          );
          break;
        case 1:
          showToast(
            'error2',
            t('Xatolik'),
            t('Joriy parolni noto‘g‘ri kiritdingiz'),
          );
          break;
        case 2:
          showToast('omad', '', t('changepassword'));
          setTimeout(() => navigation.navigate('BottomTabNavigator'), 3000);
          break;
        case 3:
          showToast(
            'error2',
            t('Xatolik'),
            t('Parolni o‘zgartirishda xatolik sodir bo‘ldi.'),
          );
          break;
        default:
          showToast('error', t('Xatolik'), t('Noma’lum xatolik yuz berdi.'));
      }
    },
    [navigation, showToast],
  );
  const changePasswordHandle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // axios (fetch emas) — token eskirsa authInterceptor avto-refresh qiladi.
      const response = await axios.post(
        `${URL}/user/edit/password`,
        {
          newPass: state.password,
          prevPass: state.prevPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storage.getString('token')}`,
          },
        },
      );

      setState(prev => ({ ...prev, loading: false }));
      handleResponse(response.data);
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      // Server xato javob tanasini qaytargan bo'lsa (masalan noto'g'ri joriy parol) —
      // uni handleResponse'ga uzatamiz (fetch xulqi bilan bir xil). Aks holda (tarmoq
      // xatosi) umumiy toast.
      const data = (error as any)?.response?.data;
      if (data) {
        handleResponse(data);
      } else {
        showToast(
          'error',
          t('Xatolik'),
          t('Server bilan bog‘lanishda muammo yuzaga keldi'),
        );
      }
    }
  }, [state.password, state.prevPassword, handleResponse, showToast]);
  // Memoize the validation UI to prevent unnecessary re-renders
  const renderValidation = useMemo(
    () => (
      <View style={styles.validationContainer}>
        <ValidationItem isValid={validation.min} text={t('78')} />
        <ValidationItem isValid={validation.lower} text={t('81')} />
        <ValidationItem isValid={validation.upper} text={t('75')} />
        <ValidationItem isValid={validation.number} text={t('84')} />
        <ValidationItem isValid={validation.symbol} text={t('87')} />
        <ValidationItem isValid={validation.space} text={t('90')} />
        <ValidationItem
          isValid={validation.match}
          text={t('Yangi parollar mos kelmayapti')}
        />
      </View>
    ),
    [validation],
  );

  if (state.loading) return <Loading />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
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
            <View style={styles.heroCircle}>
              <LockIcon size={rs(34)} color={rd.color.primary} />
            </View>
            <Text style={styles.title}>{t('678')}</Text>
            <Text style={styles.subtitle}>{t('66')}</Text>
          </View>

          <PasswordInput
            value={state.prevPassword}
            onChangeText={text => handleChange('prevPassword', text)}
            secureTextEntry={!state.showPrevPassword}
            title="693"
            showPassword={state.showPrevPassword}
            onTogglePassword={() => togglePassword('showPrevPassword')}
          />

          <PasswordInput
            value={state.password}
            onChangeText={text => handleChange('password', text)}
            secureTextEntry={!state.showPassword}
            title="696"
            showPassword={state.showPassword}
            onTogglePassword={() => togglePassword('showPassword')}
          />

          <PasswordInput
            value={state.confirmPassword}
            onChangeText={text => handleChange('confirmPassword', text)}
            secureTextEntry={!state.showConfirmPassword}
            title="699"
            showPassword={state.showConfirmPassword}
            onTogglePassword={() => togglePassword('showConfirmPassword')}
          />

          {renderValidation}

          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.85}
            onPress={changePasswordHandle}
            style={[styles.button, disabled && styles.buttonDisabled]}
          >
            <Text
              style={[
                styles.buttonText,
                disabled && { color: rd.color.textTertiary },
              ]}
            >
              {t('93')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RecoveryPassword;

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

  hero: { alignItems: 'center', marginTop: rs(20), marginBottom: rs(24) },
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(18),
  },
  title: { fontFamily: rd.font.bold, fontSize: rs(24), color: rd.color.text },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    lineHeight: rs(20),
    paddingHorizontal: rs(12),
  },

  fieldBlock: { marginTop: rs(16) },
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

  validationContainer: { marginTop: rs(16), marginBottom: rs(4) },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(8),
    gap: rs(8),
  },
  validationText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
  },

  button: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(20),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: rd.color.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
