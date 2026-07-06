import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Loading from '../components/Loading';

import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { storage } from '../../store/api/token/getToken';
import { UpdatePasswordWithJshirApi } from '../../store/api/auth';
import { useDispatch } from 'react-redux';
import InputMask from '../components/InputMask';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, LockIcon } from '../home/redesign/icons';

const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to check if the phone time is within the allowed range
const checkPhoneTime = async () => {
  const currentTime = new Date().getTime();
  const lastCheckedTime =
    storage.getNumber('lastCheckedTime') || new Date().getTime();

  // If the last checked time is more than one hour ago, reset the count
  if (currentTime - lastCheckedTime > oneHour) {
    storage.set('count', 0);
    storage.set('lastCheckedTime', currentTime);
    return true;
  }

  // If the count is less than 3, allow the request
  const count = storage.getNumber('count') || 0;
  return count < 3;
};

const UpdatePasswordWithJshir = () => {
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const dispatch = useDispatch();

  const { i18n } = useTranslation();

  const PostData = async () => {
    const isAllowed = await checkPhoneTime();

    if (!isAllowed) {
      Toast.show({
        type: 'error2',
        position: 'bottom',
        props: {
          title: 'Xatolik!',
          desc: t(
            "Urinishlar soni cheklanganligi sababli ro'yxatdan o'tish 1 soatga bloklandi. Iltimos, keyinroq urinib ko'ring.",
          ),
        },
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 5 : rs(50),
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await dispatch(
        UpdatePasswordWithJshirApi({
          phone: phone.replace(/\s/g, ''),
        }),
      ).unwrap();

      // PAROL TIKLASH — foydalanuvchi holatiga qarab 2 xil yo'l:
      //   code 2 (PINFL bor = IDENTIFIKATSIYADAN O'TGAN) → JSHSHIR + MyID orqali (xavfsiz,
      //           yuz-tasdiq). EnterJsh ekraniga o'tadi.
      //   code 1 (PINFL yo'q = IDENTIFIKATSIYADAN O'TMAGAN) → SMS orqali tiklash.
      //           RecoverySmsReset ekrani telefon raqamiga SMS yuboradi va tekshiradi.
      const cleanPhone = phone.replace(/\s/g, '');
      if (response.code === 2) {
        navigation.navigate('EnterJsh', { phone: cleanPhone });
      } else if (response.code === 1) {
        navigation.navigate('RecoverySmsReset', { phone: cleanPhone });
      }

      // code 0 → raqam ro'yxatdan o'tmagan → aniq xato beramiz.
      if (response.code === 0) {
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            title: 'Xatolik!',
            desc: t("Bu telefon raqami ro'yxatdan o'tmagan."),
          },
          visibilityTime: 3000,
          autoHide: true,
        });
      }
      if (response.code === 3) {
        Toast.show({
          type: 'error2',
          position: 'bottom',
          props: {
            title: 'Xatolik!',
            desc: t('Xatolik!'),
          },
          visibilityTime: 3000,
          autoHide: true,
        });
      }

      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
      Toast.show({
        type: 'error2',
        position: 'bottom',
        props: {
          title: 'Xatolik!',
          desc: t('Xatolik!'),
        },
        visibilityTime: 3000,
        autoHide: true,
      });
    }
  };

  useEffect(() => {
    if (phone.replace(/\s/g, '').length === 9) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [phone]);

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
            <Text style={styles.title}>{t('729')}</Text>
            <Text style={styles.subtitle}>{t('42')}</Text>
          </View>

          {/* Telefon raqami — tiklash shu raqam bo'yicha aniqlanadi */}
          <Text style={styles.label}>{t('Telefon raqami')}</Text>
          <InputMask
            onChangeText={(formatted, extracted) => {
              setPhone(extracted);
            }}
            value={phone}
            icon={true}
          />

          {/* Davom etish */}
          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.85}
            onPress={() => {
              PostData();
            }}
            style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
          >
            <Text
              style={[
                styles.submitText,
                disabled && { color: rd.color.textTertiary },
              ]}
            >
              {t('45')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default UpdatePasswordWithJshir;

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

  hero: { alignItems: 'center', marginTop: rs(24), marginBottom: rs(28) },
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(18),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.text,
    textAlign: 'center',
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

  submitBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(24),
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
