/**
 * ForceUpdateGate — majburiy yangilanish oynasi (SS-DEV 2026-10-04, 04.10 hujjat 6-band).
 *
 * Ilova ishga tushganda va fonдан qaytganda (AppState 'active') backend siyosatini tekshiradi.
 * Versiya min_version dan past bo'lsa — TO'LIQ EKRANLI bloklovchi oyna: navigatsiya ostida
 * qoladi (Modal hamma narsani yopadi), Android "orqaga" tugmasi yopmaydi (onRequestClose
 * bo'sh), yopish tugmasi yo'q. "Yangilash" — do'kon havolasi. Tarmoq xatosida bloklamaydi
 * (oxirgi muvaffaqiyatli natija saqlanadi).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../theme/rd';
import {
  VersionPolicy,
  fetchVersionPolicy,
  isUpdateRequired,
  loadCachedPolicy,
  openStore,
} from '../../helper/forceUpdate';
import { SmartphoneIcon } from '../home/redesign/icons';

const MIN_INTERVAL_MS = 30 * 1000;

const ForceUpdateGate = () => {
  const { t } = useTranslation();
  // 08.10: oxirgi saqlangan siyosatdan boshlaymiz — oflayn sovuq startda ham eski versiya
  // darhol bloklanadi (tarmoq javobini kutmasdan); serverdan yangisi kelsa yangilanadi.
  const [policy, setPolicy] = useState<VersionPolicy | null>(loadCachedPolicy);
  const [blocked, setBlocked] = useState<boolean>(() => isUpdateRequired(loadCachedPolicy()));
  const lastCheck = useRef(0);
  const inFlight = useRef(false);

  const check = useCallback(async (force = false) => {
    const now = Date.now();
    if (inFlight.current) return;
    if (!force && now - lastCheck.current < MIN_INTERVAL_MS) return;
    inFlight.current = true;
    lastCheck.current = now;
    try {
      const p = await fetchVersionPolicy();
      if (!p) return; // tarmoq xatosi — holat o'zgarmaydi (bloklamaymiz)
      setPolicy(p);
      setBlocked(isUpdateRequired(p));
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    check(true);
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') check(false);
    });
    return () => sub.remove();
  }, [check]);

  if (!blocked) return null;

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      // Android "orqaga" — oyna YOPILMAYDI (yangilanmaguncha ilova ishlamaydi).
      onRequestClose={() => undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <View style={styles.root}>
        <View style={styles.iconCircle}>
          <SmartphoneIcon size={rs(44)} color={rd.color.primary} strokeWidth={1.8} />
        </View>
        <Text allowFontScaling={false} style={styles.title}>
          {t('Ilovaning yangi versiyasi mavjud. Iltimos, ilovani yangilang.')}
        </Text>
        {!!policy?.latest_version && (
          <Text allowFontScaling={false} style={styles.version}>
            {policy.latest_version}
          </Text>
        )}
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          onPress={() => openStore(policy)}
          style={styles.btn}
        >
          <Text allowFontScaling={false} style={styles.btnText}>
            {t('Yangilash')}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ForceUpdateGate;

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
    backgroundColor: rd.color.primaryTint,
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
  version: {
    marginTop: rs(8),
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textTertiary,
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
  btnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
