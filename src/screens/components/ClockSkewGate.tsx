/**
 * ClockSkewGate — 08.10: server va qurilma vaqti o'rtasida tafovut bo'lsa (helper/clockSkew)
 * to'liq ekranli bloklovchi oyna. Login ekranlari ham bloklanadi (OTP/JWT vaqtga bog'liq).
 *
 * Qayta tekshirish: ilova ochilganda, fondan qaytganda (AppState 'active' — foydalanuvchi
 * sozlamalarda "avtomatik vaqt"ni yoqib qaytadi), "Qayta tekshirish" tugmasida va bloklangan
 * paytda har RECHECK_WHILE_BLOCKED_MS da. Vaqt to'g'rilansa oyna o'zi yopiladi.
 * Server javob bermasa — bloklanmaydi (helper/clockSkew).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../theme/rd';
import {
  installClockSkewWatcher,
  isClockBlocked,
  subscribeClockSkew,
  verifyClock,
} from '../../helper/clockSkew';
import { ClockIcon } from '../home/redesign/icons';

/** 08.10: bloklangan paytda davriy qayta tekshirish oralig'i. */
const RECHECK_WHILE_BLOCKED_MS = 15 * 1000;
const ANDROID_DATE_SETTINGS = 'android.settings.DATE_SETTINGS';

/** 08.10: Android — to'g'ridan-to'g'ri "Sana va vaqt" sozlamasi; bo'lmasa ilova sozlamalari. */
const openDateSettings = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent(ANDROID_DATE_SETTINGS);
      return;
    } catch {
      // ba'zi qobiqlarda intent yo'q — umumiy sozlamalarga tushamiz
    }
  }
  try {
    await Linking.openSettings();
  } catch {
    // ochib bo'lmadi — oyna ochiq qoladi
  }
};

const ClockSkewGate = () => {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState<boolean>(isClockBlocked());
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    installClockSkewWatcher();
    const unsub = subscribeClockSkew(setBlocked);
    verifyClock();
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') verifyClock();
    });
    return () => {
      unsub();
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!blocked) return undefined;
    const timer = setInterval(() => {
      verifyClock();
    }, RECHECK_WHILE_BLOCKED_MS);
    return () => clearInterval(timer);
  }, [blocked]);

  const onRetry = useCallback(async () => {
    setChecking(true);
    try {
      await verifyClock();
    } finally {
      setChecking(false);
    }
  }, []);

  if (!blocked) return null;

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      // Android "orqaga" — oyna YOPILMAYDI (vaqt to'g'rilanmaguncha ilova ishlamaydi).
      onRequestClose={() => undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <View style={styles.root}>
        <View style={styles.iconCircle}>
          <ClockIcon size={rs(44)} color={rd.color.warning} strokeWidth={1.8} />
        </View>
        <Text allowFontScaling={false} style={styles.title}>
          {t("Sana va vaqt noto'g'ri")}
        </Text>
        <Text allowFontScaling={false} style={styles.desc}>
          {t(
            "Server va qurilmangiz o'rtasida vaqt tafovuti mavjud. Iltimos, qurilmangizda sana va vaqtni avtomatik sozlash rejimini yoqing.",
          )}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          onPress={openDateSettings}
          style={styles.btn}
        >
          <Text allowFontScaling={false} style={styles.btnText}>
            {t('Sozlamalarni ochish')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: checking, busy: checking }}
          disabled={checking}
          onPress={onRetry}
          style={[styles.btn, styles.btnGhost]}
        >
          {checking ? (
            <ActivityIndicator color={rd.color.primary} />
          ) : (
            <Text allowFontScaling={false} style={[styles.btnText, styles.btnGhostText]}>
              {t('Qayta tekshirish')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ClockSkewGate;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: rd.color.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  iconCircle: {
    width: rs(104),
    height: rs(104),
    borderRadius: rs(52),
    backgroundColor: rd.color.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: rs(24),
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    lineHeight: rs(26),
    color: rd.color.text,
    textAlign: 'center',
  },
  desc: {
    marginTop: rs(10),
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    lineHeight: rs(21),
    color: rd.color.textSecondary,
    textAlign: 'center',
  },
  btn: {
    marginTop: rs(28),
    height: rs(54),
    alignSelf: 'stretch',
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    marginTop: rs(12),
    backgroundColor: rd.color.primaryTint,
  },
  btnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
  btnGhostText: {
    color: rd.color.primary,
  },
});
