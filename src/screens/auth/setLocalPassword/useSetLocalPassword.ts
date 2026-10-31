import { useCallback, useEffect, useRef, useState } from 'react';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import { t } from 'i18next';
import { storage } from '../../../store/api/token/getToken';
import { warmHome } from '../../../helper/homeCache';
// SS-SEC (2026-09-25): PIN ochiq matnda emas — salt+SHA-256 (pin.ts).
import { hasPin, setPin, verifyPin } from '../../../store/api/token/pin';
import { attemptPin, getLockState } from '../../../store/api/token/pinLockout';
import { forceLogout } from '../../../helper/forceLogout';
import { disableBiometricUnlock, enrollBiometricUnlock, isBiometricEnrolled } from '../../../helper/biometricUnlock';
import { showPinToast, useBiometricUnlock } from './useBiometricUnlock';
import { useUnlockNavigation } from './useUnlockNavigation';

const PIN_LENGTH = 4;
const TOAST_MS = 3000;
const LOCK_TICK_MS = 1000;

/** PIN o'rnatish / kiritish / qulf ekranining holati va amallari. */
export function useSetLocalPassword() {
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  // SS-SEC (2026-09-25): PIN bor-yo'qligi hash (yoki eski ochiq k2) orqali.
  const [isLocal] = useState(() => !hasPin());
  // Birinchi qadamda terilgan PIN — faqat xotirada (ilgari MMKV'ga `k1` ochiq yozilardi).
  const firstPinRef = useRef('');
  // SEC (2026-10-31): urinishlar/qulf shifrlangan MMKV'da (pinLockout.ts). Qolgan qulf vaqti (ms), 0 = qulf yo'q.
  const [lockRemaining, setLockRemaining] = useState(() => getLockState().remainingMs);

  const { navigation, restoreAfterUnlock, openPendingNotification, finishUnlock } = useUnlockNavigation();

  // V-012 / QULF EKRANIDA MENYU OCHIQ QOLMASIN: Drawer butun ilovani o'raydi, shuning uchun fokusda majburan yopamiz.
  // (Screenshot himoyasi markaziy — helper/captureGuard.ts.)
  useFocusEffect(
    useCallback(() => {
      navigation.dispatch(DrawerActions.closeDrawer());
    }, [navigation]),
  );

  // SS-DEV (2026-10-05): PIN kiritilayotganda bosh sahifa ma'lumotlarini OLDINDAN yuklaymiz.
  useEffect(() => {
    try {
      const { Store } = require('../../../store/store/Store');
      const hasUser = !!Store.getState()?.HomeReducer?.user?.data;
      if (!hasUser) warmHome();
    } catch {}
  }, []);

  // Qulf taymeri: har soniya qolgan vaqtni yangilaydi, tugagach PIN kiritish ochiladi.
  useEffect(() => {
    if (lockRemaining <= 0) return;
    const id = setInterval(() => {
      const st = getLockState();
      setLockRemaining(st.locked ? st.remainingMs : 0);
    }, LOCK_TICK_MS);
    return () => clearInterval(id);
  }, [lockRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Biometrik auto-so'rov effekti eski ekrandagidek OXIRGI effekt (yuqoridagilardan keyin).
  const bio = useBiometricUnlock(isLocal, finishUnlock);

  /** PIN o'rnatildi -> biometrik OPT-IN so'raymiz, javobdan keyin davom etamiz. */
  const goAfterPinSet = (token: string | undefined) => () => {
    if (openPendingNotification()) return;
    navigation.reset({ routes: [{ name: 'BottomTabNavigator', params: { token } }], index: 0 });
  };

  const onSetupDigit = (val: number) => {
    const next = password + val;
    setPassword(next);
    if (next.length !== PIN_LENGTH) return;
    if (step === 1) {
      setStep(2);
      firstPinRef.current = next;
      setPassword('');
      return;
    }
    if (next === firstPinRef.current) {
      const token = storage.getString('token');
      setPin(next);
      firstPinRef.current = '';
      storage.delete('isLoginScreen');
      storage.set('appLocked', false);
      bio.askForBiometric(goAfterPinSet(token));
    } else {
      setStep(1);
      setPassword('');
      firstPinRef.current = '';
      showPinToast(t('Yangi PIN-kodni takrorlashda xatolikka yo‘l qo‘yilgan'), TOAST_MS);
    }
  };

  /** Biometrik sir hali yaratilmagan (eski foydalanuvchi, touch=true): bir marta ro'yxatdan o'tkazamiz. */
  const enrollLegacyBiometric = () => {
    if (storage.getBoolean('touch') === true && !isBiometricEnrolled()) {
      enrollBiometricUnlock(bio.bioPrompt())
        .then(ok => {
          if (!ok) storage.set('touch', false);
        })
        .catch(() => storage.set('touch', false));
    }
  };

  const onUnlockDigit = (val: number) => {
    const next = password + val;
    setPassword(next);
    if (next.length !== PIN_LENGTH) return;
    // SEC (2026-10-31): urinish tekshiruvdan OLDIN shifrlangan MMKV'ga yoziladi; ketma-ket xatolarda o'sib
    // boruvchi qulf, 10-xatoda sessiya o'chiriladi.
    const attempt = attemptPin(verifyPin, next);
    if (attempt.result === 'ok') {
      storage.delete('isLoginScreen');
      storage.set('appLocked', false);
      enrollLegacyBiometric();
      if (openPendingNotification()) return;
      // J: qulf oldidagi ekranga qaytamiz (bosh sahifa emas).
      restoreAfterUnlock();
    } else if (attempt.result === 'wipe') {
      setPassword('');
      disableBiometricUnlock();
      forceLogout('pin-lockout');
    } else if (attempt.result === 'locked') {
      setPassword('');
      setLockRemaining(attempt.remainingMs);
    } else {
      setPassword('');
      if (attempt.lockMs > 0) {
        setLockRemaining(getLockState().remainingMs);
      } else {
        showPinToast(t('parol', { count: attempt.attemptsLeft }), TOAST_MS);
      }
    }
  };

  const onSetCode = (val: number) => (isLocal ? onSetupDigit(val) : onUnlockDigit(val));
  const onBackSpace = () => setPassword(password.slice(0, -1));
  const onResetPin = () => navigation.navigate('ResetPassCode', { isLocal: true });
  const onFaceTouch = () => {
    // PIN O'RNATISHDA (isLocal) tugma NO-OP — PIN hali yo'q, biometrik autentifikatsiya bo'lishi mumkin emas.
    if (!isLocal) bio.onFingerScan();
  };

  return { isLocal, step, password, lockRemaining, bio, onSetCode, onBackSpace, onResetPin, onFaceTouch };
}
