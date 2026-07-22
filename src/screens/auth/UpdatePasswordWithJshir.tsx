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
// Eski ilovada bu ekranda telefon-kiritish illyustratsiyasi bor edi.
import PhoneIllustration from '../../images/changeNumber';
import {
  AuthBackdrop,
  AuthFloat,
  AuthHero,
  AuthPrimaryButton,
  AuthTopBar,
  AuthReveal,
  authStyles,
} from './authKit';

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
      {/* Fintech atmosfera — butun ekran ortidagi brend gradienti */}
      <AuthBackdrop />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Ekran nomi markazdagi katta sarlavha emas, shu qatorda kichik
              yozuv — vizual markaz illyustratsiyaga qoladi. */}
          <AuthTopBar onBack={() => navigation.goBack()} title={t('729')} />

          {/* Illyustratsiya TEPA yarmda (markazda) — forma bilan yopishmasin. */}
          <View style={styles.topHalf}>
            <AuthReveal>
              <AuthHero style={styles.hero}>
                <AuthFloat>
                  <PhoneIllustration width={rs(268)} height={rs(200)} />
                </AuthFloat>
              </AuthHero>
            </AuthReveal>
          </View>

          {/* Ko'rsatma + forma PASTKI yarmda. */}
          <View style={styles.bottomHalf}>
            <AuthReveal delay={140}>
              <Text style={styles.subtitle}>{t('42')}</Text>
            </AuthReveal>

            <AuthReveal delay={230}>
            {/* Telefon raqami — yorliqsiz: bayroq + "+998" o'zi tushuntiradi. */}
            <InputMask
              onChangeText={(formatted, extracted) => {
                setPhone(extracted);
              }}
              value={phone}
              icon={true}
            />

            {/* Davom etish */}
            <AuthPrimaryButton
              label={t('45')}
              disabled={disabled}
              onPress={() => {
                PostData();
              }}
              style={styles.submitBtn}
            />
            </AuthReveal>
          </View>
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

  // Illyustratsiya tepa yarmda, forma pastki yarmda.
  topHalf: { flex: 1, justifyContent: 'center' },
  bottomHalf: { flex: 1 },

  // Panelning o'zi AuthHero'da — bu yerda faqat joylashuv.
  hero: { marginTop: rs(10), marginBottom: rs(18) },
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(18),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    // Ko'rsatma va forma yorlig'i orasida nafas (ritm).
    marginBottom: rs(26),
    lineHeight: rs(20),
    paddingHorizontal: rs(12),
  },


  // Tugmaning o'zi AuthPrimaryButton (gradient + rangli soya).
  submitBtn: { marginTop: rs(24) },
});
