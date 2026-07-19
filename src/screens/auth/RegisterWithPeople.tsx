import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Loading from '../components/Loading';

import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { URL } from '../constants';
import { storage } from '../../store/api/token/getToken';
import { normalize } from '../../theme/style';
import { rd, rs } from '../../theme/rd';
import InputMask from '../components/InputMask';
import { ChevronLeft } from '../home/redesign/icons';
import BrandLockup from '../components/BrandLockup';
// Eski ilovada telefon-kiritish ekranlarida ishlatilgan illyustratsiya.
import PhoneIllustration from '../../images/changeNumber';

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

const RegisterWithPeople = () => {
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const { type } = route.params;
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(false);

  const { i18n } = useTranslation();

  const PostData = async () => {
    try {
      setLoading(true);
      const isPhoneTimeValid = await checkPhoneTime();

      if (!isPhoneTimeValid) {
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
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
        setLoading(false);
        return;
      }

      const storageCount = storage.getNumber('count') || 0;
      storage.set('lastCheckedTime', new Date().getTime());

      // Check if the phone time is valid before proceeding
      // If the count is less than 3, proceed with the request
      // Otherwise, show an error message
      if (storageCount >= 3) {
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
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
        setLoading(false);
        return;
      }

      if (await checkPhoneTime()) {
        const res = await fetch(URL + '/user/register', {
          body: JSON.stringify({
            lang: i18n.language,
            phone: '+998' + phone.replace(/\s/g, ''),
            step: 1,
            type: 2,
          }),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();

        setError(false);

        if (data.success === false && data.message === 'user-already-exist') {
          Toast.show({
            type: 'error2',
            position: 'bottom',
            props: {
              title: 'Xatolik!',
              desc: t(
                'Ushbu telefon raqami tizimda ro‘yxatga olingan. Iltimos, ro‘yxatdan o‘tish uchun boshqa telefon raqamidan foydalaning',
              ),
            },
            visibilityTime: 3000,
            autoHide: true,
            topOffset: Platform.OS === 'android' ? 5 : normalize(50),
          });
          setLoading(false);
          return;
        }
        if (data.success === true && data.message === 'not finished yet') {
          Toast.show({
            type: 'error2',
            position: 'bottom',
            props: {
              title: 'Xatolik!',
              desc: t(
                'Ushbu telefon raqami tizimda ro‘yxatga olingan. Iltimos, ro‘yxatdan o‘tish uchun boshqa telefon raqamidan foydalaning',
              ),
            },
            visibilityTime: 3000,
            autoHide: true,
            topOffset: Platform.OS === 'android' ? 5 : normalize(50),
          });
          setLoading(false);
          return;
        }

        if (data.success === false && data.message === 'ip-blocked') {
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
            topOffset: Platform.OS === 'android' ? 5 : normalize(50),
          });
          setLoading(false);
          return;
        }

        if (data.success) {
          storage.set('count', storageCount + 1);
          setLoading(false);
          navigation.navigate(
            type === 1 ? 'CheckSmsPassword' : 'ChangePhoneNumber',
            { phone: phone.replace(/\s/g, '') },
          );
        }
      }
    } catch (e) {
      console.warn(e, 'asdsa');
      setLoading(false);
      setError(true);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
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

          {/* Brend hero */}
          {/* Brend hero: kichik logotip + illyustratsiya (eski ilovadagidek) */}
          <View style={styles.hero}>
            <BrandLockup width={rs(112)} />
            <PhoneIllustration width={rs(206)} height={rs(154)} />
            <Text style={styles.title}>{t('42')}</Text>
          </View>

          {/* Forma kartasi */}
          <View style={styles.card}>
            <Text style={styles.label}>Telefon raqam</Text>
            <InputMask
              onChangeText={(formatted, extracted) => {
                setPhone(extracted);
              }}
              value={phone}
              icon={true}
            />

            {/* Ro'yxatdan o'tish */}
            <TouchableOpacity
              disabled={disabled}
              activeOpacity={0.85}
              onPress={() => {
                PostData();
              }}
              style={[styles.enterButton, disabled && styles.enterButtonDisabled]}
            >
              <Text
                style={[
                  styles.enterText,
                  disabled && { color: rd.color.textTertiary },
                ]}
              >
                {t('45')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Yordam */}
          <TouchableOpacity
            style={styles.supportBtn}
            onPress={() => {
              Linking.openURL('https://t.me/zeroxuz_bot');
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.supportText}>{t('support')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterWithPeople;

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

  hero: { alignItems: 'center', marginTop: rs(24), marginBottom: rs(30) },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(23),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(16),
    paddingHorizontal: rs(16),
  },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(20),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },

  enterButton: {
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
  enterButtonDisabled: {
    backgroundColor: rd.color.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  enterText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },

  supportBtn: { alignSelf: 'flex-end', marginTop: rs(20) },
  supportText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.primary,
  },
});
