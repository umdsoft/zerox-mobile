import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import ReactNativeBiometrics from 'react-native-biometrics';
import { storage } from '../../../store/api/token/getToken';
import { getLockState } from '../../../store/api/token/pinLockout';
import {
  enrollBiometricUnlock,
  isBiometricEnrolled,
  unlockWithBiometrics,
} from '../../../helper/biometricUnlock';
import { normalize } from '../../../theme/style';

const rnBiometrics = new ReactNativeBiometrics();

/** Ekran tepasidagi xato toast'i (barcha PIN xatolari uchun bir xil). */
export const showPinToast = (desc: string, visibilityTime: number) =>
  Toast.show({
    type: 'error2',
    position: 'top',
    props: { desc },
    visibilityTime,
    autoHide: true,
    topOffset: Platform.OS === 'android' ? 5 : normalize(50),
  });

interface BioModalState {
  visible: boolean;
  onDone: () => void;
}
const CLOSED_MODAL: BioModalState = { visible: false, onDone: () => {} };

/** Biometrik qulf ochish + PIN o'rnatilgach opt-in modal. SEC: chaqiruvlar eski ekran bilan aynan bir xil. */
export function useBiometricUnlock(isLocal: boolean, finishUnlock: () => void) {
  // Biometrik OPT-IN — native Alert o'rniga CHIROYLI maxsus modal.
  const [bioModal, setBioModal] = useState<BioModalState>(CLOSED_MODAL);

  const bioPrompt = useCallback(
    () => ({
      title: t('Face ID / Touch ID bilan tasdiqlang') as string,
      cancel: t('Bekor qilish') as string,
    }),
    [],
  );

  // SEC (2026-10-31): Keychain/Keystore'dagi, faqat haqiqiy biometrik tasdiqdan keyin chiqadigan sir orqali.
  const onFingerScan = useCallback(async () => {
    try {
      if (getLockState().locked) return;
      const result = await unlockWithBiometrics(bioPrompt());
      if (result === 'ok') {
        finishUnlock();
      } else if (result === 'invalid') {
        // Yangi barmoq izi/yuz qo'shilgan (yoki sir yo'qolgan): PIN bilan kiring, qayta yoqing.
        storage.set('touch', false);
        showPinToast(
          t('Biometrik kirish yangilanishi kerak. Xavfsizlik bo‘limida uni qayta yoqing.'),
          4000,
        );
      }
    } catch {
      // Biometrik muvaffaqiyatsiz — PIN bilan davom etiladi.
    }
  }, [bioPrompt, finishUnlock]);

  // PIN o'rnatilgach Touch/Face ID ni yoqishni SO'RAYMIZ (avtomatik yoqmaymiz).
  const askForBiometric = useCallback(async (onDone: () => void) => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();
      if (!available) {
        storage.set('touch', false);
        onDone();
        return;
      }
      setBioModal({ visible: true, onDone });
    } catch {
      storage.set('touch', false);
      onDone();
    }
  }, []);

  // Modal tugmalari: tanlovni saqlab, davom etadi.
  const onBioChoose = useCallback(
    (yes: boolean) => {
      const done = bioModal.onDone;
      setBioModal(CLOSED_MODAL);
      if (!yes) {
        storage.set('touch', false);
        done();
        return;
      }
      // Sirni biometrik-bog'langan holda yaratamiz; muvaffaqiyatsiz bo'lsa — o'chiq.
      enrollBiometricUnlock(bioPrompt())
        .then(ok => storage.set('touch', ok))
        .catch(() => storage.set('touch', false))
        .finally(done);
    },
    [bioModal, bioPrompt],
  );

  // PIN bor, bloklanmagan, foydalanuvchi yoqqan (touch) va sir ro'yxatdan o'tgan bo'lsa — ochilishi bilan so'raymiz.
  useEffect(() => {
    const touch = storage.getBoolean('touch');
    if (!isLocal && !getLockState().locked && touch === true && isBiometricEnrolled()) {
      rnBiometrics
        .isSensorAvailable()
        .then(({ available }) => {
          if (available) {
            onFingerScan();
          }
        })
        .catch(() => {});
    }
  }, [isLocal, onFingerScan]);

  return { bioModal, bioPrompt, onFingerScan, askForBiometric, onBioChoose };
}
