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
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { URL } from '../constants';
import Loading from '../components/Loading';
import InputMask from '../components/InputMask';
import { storage } from '../../store/api/token/getToken';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, PhoneIcon } from '../home/redesign/icons';

const ChangePhoneNumber = () => {
  const [phone, setPhone] = useState('');
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const { i18n } = useTranslation();

  const { user } = useSelector(state => state.HomeReducer);

  const onPress = useCallback(async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data } = await axios.post(
        URL + '/user/rephone',
        {
          phone: '+998' + phone.replace(/\s/g, ''),
          step: 1,
          lang: i18n.language,
          user: user?.data?.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(data, 'response');

      if (data.success) {
        setLoading(false);
        navigation.navigate('ChangePhoneNumberSmsCheck', {
          phone: '+998' + phone.replace(/\s/g, ''),
        });
      } else {
        setLoading(false);
        Toast.show({
          autoHide: true,
          visibilityTime: 2000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: t('708'),
          },
        });
      }
    } catch (error) {
      setLoading(false);
    }
  }, [i18n.language, navigation, phone, user?.data?.phone]);

  const disabled = useMemo(
    () => phone.replace(/\s/g, '').length !== 9,
    [phone],
  );

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
              <PhoneIcon size={rs(34)} color={rd.color.primary} />
            </View>
            <Text style={styles.title}>{t('702')}</Text>
          </View>

          {/* Telefon */}
          <Text style={styles.label}>{t('705')}</Text>
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
            onPress={onPress}
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

export default ChangePhoneNumber;

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

  hero: { alignItems: 'center', marginTop: rs(24), marginBottom: rs(32) },
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
    paddingHorizontal: rs(16),
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
