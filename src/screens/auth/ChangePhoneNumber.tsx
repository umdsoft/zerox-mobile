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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
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

// Animatsiyali "telefon" ikonasi — ortida tarqaluvchi ikki halqa (tirik ko'rinish).
const RING_SCALE = 0.9;
const PhoneHero = () => {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    p.value = withRepeat(
      withTiming(1, { duration: 1900, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [reduce, p]);
  const ring1 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * RING_SCALE }],
    opacity: 0.35 * (1 - p.value),
  }));
  const ring2 = useAnimatedStyle(() => {
    const q = (p.value + 0.5) % 1;
    return { transform: [{ scale: 1 + q * RING_SCALE }], opacity: 0.35 * (1 - q) };
  });

  // Telefon go'shagi NOZIK "qo'ng'iroq" tebranishi — o'ngga/chapga qiyshayadi,
  // markazga qaytadi, so'ng biroz to'xtab yana takrorlanadi (jonli ko'rinish).
  const w = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    w.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 110, easing: Easing.out(Easing.ease) }),
        withTiming(-1, { duration: 220, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 220, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 110, easing: Easing.out(Easing.ease) }),
        withDelay(1500, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );
  }, [reduce, w]);
  const phoneStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${w.value * 12}deg` }],
  }));

  return (
    <View style={styles.heroWrap}>
      <Animated.View style={[styles.ring, ring1]} />
      <Animated.View style={[styles.ring, ring2]} />
      <View style={styles.heroCircle}>
        <Animated.View style={phoneStyle}>
          <PhoneIcon size={rs(50)} color={rd.color.primary} />
        </Animated.View>
      </View>
    </View>
  );
};

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

      if (data.success) {
        setLoading(false);
        navigation.navigate('ChangePhoneNumberSmsCheck', {
          phone: '+998' + phone.replace(/\s/g, ''),
        });
      } else {
        setLoading(false);
        // "Xatolik" sarlavhasi YO'Q — faqat qizil xabar (so'rov bo'yicha).
        Toast.show({
          autoHide: true,
          visibilityTime: 2500,
          position: 'bottom',
          type: 'error2',
          props: { title: t('708') },
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
          {/* Orqaga — TO'LDIRILGAN KO'K. */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={rs(22)} color={rd.color.onPrimary} />
          </TouchableOpacity>

          {/* Ikona TEPA yarmda (markazda), forma PASTKI yarmda — bir qo'lda
              terish oson bo'lsin. */}
          <View style={styles.topHalf}>
            <PhoneHero />
            <Text
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t('702')}
            </Text>
          </View>

          <View style={styles.bottomHalf}>
            <Text style={styles.label}>{t('705')}</Text>
            <InputMask
              onChangeText={(formatted, extracted) => {
                setPhone(extracted);
              }}
              value={phone}
              icon={true}
            />

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
          </View>
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
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(8),
  },

  // Ikona tepa yarmda (markazda), forma pastki yarmda.
  topHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomHalf: { flex: 1 },

  heroWrap: {
    width: rs(120),
    height: rs(120),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(22),
  },
  ring: {
    position: 'absolute',
    width: rs(104),
    height: rs(104),
    borderRadius: rs(52),
    backgroundColor: rd.color.primaryTint,
  },
  heroCircle: {
    width: rs(104),
    height: rs(104),
    borderRadius: rs(52),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bir qatorda, kichikroq shrift (ilgari rs(22) — 2 qatorga sinardi).
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
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
    marginTop: rs(20),
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
