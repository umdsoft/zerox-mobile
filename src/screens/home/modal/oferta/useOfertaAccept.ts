/**
 * useOfertaAccept.ts — ofertani tasdiqlash (`PUT /user/edit_contract`) va rad etish (ContractModal.tsx dan
 * ko'chirilgan). So'rov useApiAction ustida: takroriy bosishdan himoya + `loading` (Loading ko'rsatiladi).
 * Xulq o'zgarmagan (__tests__/contract_modal.test.tsx); yagona farq: bir renderdagi IKKI tezkor "Tasdiqlash" — bitta PUT.
 */
import axios from 'axios';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { rs } from '../../../../theme/rd';
import { clearPendingOfertaAction, runPendingOfertaAction } from '../../../../helper/ofertaGate';
import { useApiAction } from '../../../../hooks/useApiAction';
import { getMe } from '../../../../store/api/home';
import { storage } from '../../../../store/api/token/getToken';
import { contractModalShow } from '../../../../store/reducers/HomeReducer';
import { URL } from '../../../constants';
import { PENDING_ACTION_DELAY_MS, serverMsg } from './ofertaLogic';

export const useOfertaAccept = (check: boolean, resetHiddenByLock: () => void) => {
  const dispatch = useDispatch<any>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const action = useApiAction();
  const loading = action.loading;

  // SS-DEV (2026-10-04, 04.10 (1) 1-band): ogohlantirish sahifa PASTIDA — rozilik qatori ustida.
  const warn = useCallback(
    (desc: string) => {
      Toast.show({
        autoHide: true,
        visibilityTime: 3500,
        position: 'bottom',
        bottomOffset: insets.bottom + rs(130),
        type: 'error2',
        props: { desc },
      });
    },
    [insets.bottom],
  );
  // Oferta oxirigacha o'qilmay turib "tanishdim" belgisini qo'ymoqchi bo'lsa (5 tilda, i18n/new/*.json).
  const warnRead = useCallback(() => {
    warn(t('Iltimos, ommaviy ofertani oxirigacha o‘qib chiqing va tasdiqlang.'));
  }, [t, warn]);
  // O'qib bo'lingan, lekin "tanishdim" belgilanmagan holda "Tasdiqlash" bosildi.
  const warnCheck = useCallback(() => {
    warn(t('Iltimos, ommaviy oferta bilan tanishganingizni belgilang.'));
  }, [t, warn]);

  /**
   * Foydalanuvchi ofertani tasdiqlashni ISTAMASA — oynani yopadi va ilovaning qolgan bo'limlaridan foydalanishda
   * davom etadi; eslab qolingan shartnoma amali bekor qilinadi (keyingi urinishda oyna yana ochiladi).
   */
  const onDecline = useCallback(() => {
    if (loading) return;
    resetHiddenByLock();
    clearPendingOfertaAction();
    dispatch(contractModalShow({ show: false }));
  }, [dispatch, loading, resetHiddenByLock]);

  const onClose = useCallback(async () => {
    // Tugma FAQAT `check` (rozilik belgilangan)da yoqiladi; rozilik belgisiga tayanamiz.
    if (!check) return;
    const token = storage.getString('token');
    await action.run(
      async () => {
        const { data } = await axios.put(URL + '/user/edit_contract', {}, { headers: { Authorization: `Bearer ${token}` } });
        if (data.success) {
          // is_contract=1 bo'ldi — redux `user`ni YANGILAB BO'LGACH yopamiz. Aks holda Main.tsx re-trigger effekti
          // (is_contract hali 0) modalni QAYTA ochadi (flicker/loop).
          await dispatch(getMe());
          dispatch(contractModalShow({ show: false }));
          // SS-DEV (2026-09-29): oferta so'ralgan shartnoma amali tasdiqlangach AVTOMATIK davom etadi.
          setTimeout(runPendingOfertaAction, PENDING_ACTION_DELAY_MS);
        }
        if (data.success === false && data.msg === 'is_contract_true') {
          Toast.show({
            autoHide: true,
            visibilityTime: 3000,
            position: 'bottom',
            type: 'error2',
            props: { desc: t('Siz ommaviy ofertani boshqa qurilmada tasdiqlagansiz') },
          });
          await dispatch(getMe());
          dispatch(contractModalShow({ show: false }));
          setTimeout(runPendingOfertaAction, PENDING_ACTION_DELAY_MS);
        }
        // 08.10 (5-band): boshqa `success:false` javobi ilgari JIM o'tib ketardi — endi server xabari ko'rsatiladi.
        if (data?.success === false && data?.msg !== 'is_contract_true') {
          warn(serverMsg(data) || t('Ofertani tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.'));
        }
      },
      {
        // 08.10 (5-band): server xabari (403/401/400 javobidagi message/msg), bo'lmasa umumiy matn.
        onError: error => warn(serverMsg((error as any)?.response?.data) || t('Ofertani tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.')),
      },
    );
  }, [action, check, dispatch, t, warn]);

  return { loading, onClose, onDecline, warn, warnRead, warnCheck };
};
