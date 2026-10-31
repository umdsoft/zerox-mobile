/**
 * useOfertaAfterId.ts — oferta oynasini ochuvchi ro'yxatdan o'tadi; identifikatsiyadan KEYIN oyna ochiladi; ilova
 * QULFLANSA (PIN) ochiq oyna yashiriladi va qulf ochilgach qayta ko'rsatiladi (ContractModal.tsx dan ko'chirilgan,
 * xulq o'zgarmagan). Tarix: SS-DEV (2026-09-29), 03.10 (1-band), SS-DEV (2026-10-04, 04.10 hujjat 1-band) ILDIZ.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  clearPendingOfertaAction, needsOferta, openOferta, setOfertaOpener,
} from '../../../../helper/ofertaGate';
import {
  consumeOfertaAfterIdentification, hasOfertaAfterIdentification, OFERTA_WAIT_ROUTES,
} from '../../../../helper/ofertaAfterId';
import { navigationRef } from '../../../../navigation/NavigationRef';
import { storage } from '../../../../store/api/token/getToken';
import { contractModalShow } from '../../../../store/reducers/HomeReducer';
import { OFERTA_AFTER_ID_DELAY_MS } from './ofertaLogic';

export const useOfertaAfterId = (contract: boolean, userData: any) => {
  const dispatch = useDispatch();

  /**
   * SS-DEV (2026-09-29, 29.09 doc2 3-rasm): oyna bosh sahifada MAJBURAN ochilmaydi — faqat "Qarz shartnomasi"
   * AMALIDA (helper/ofertaGate.ts). Ochuvchi shu yerda ro'yxatdan o'tadi (ofertaGate Redux store'ni import qilmaydi).
   */
  useEffect(() => {
    setOfertaOpener(() => dispatch(contractModalShow({ show: true })));
    return () => setOfertaOpener(null);
  }, [dispatch]);

  const userDataRef = useRef<any>(userData);
  const contractRef = useRef<boolean>(!!contract);
  useEffect(() => {
    contractRef.current = !!contract;
  }, [contract]);
  const afterIdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // SS-DEV (2026-10-04): oyna ochiq turganda ilova QULFLANSA (PIN ekrani) — oyna vaqtincha yashiriladi va qulf
  // ochilgach QAYTA ko'rsatiladi.
  const hiddenByLockRef = useRef(false);
  const currentRouteName = (): string | undefined => {
    const nav: any = navigationRef.current;
    return nav?.getCurrentRoute?.()?.name;
  };

  const tryOpenAfterId = useCallback(() => {
    const routeName = currentRouteName();
    const waiting = !routeName || OFERTA_WAIT_ROUTES.has(routeName);
    /**
     * Qulf/kirish ekraniga o'tilganda ochiq oyna yashiriladi (eslab qolingan amal SAQLANADI) va oddiy ekranga
     * qaytilganda yana ko'rsatiladi (Android'da MyID javobi qulfdan OLDIN kelsa oyna PIN ekrani ustida qolardi).
     */
    if (waiting) {
      if (contractRef.current) {
        dispatch(contractModalShow({ show: false }));
        if (routeName === 'SetLocalPassword' && storage.getBoolean('appLocked')) {
          hiddenByLockRef.current = true;
        } else {
          // Chiqish (logout) / kirish ekrani — oyna va eslab qolingan amal bekor.
          hiddenByLockRef.current = false;
          clearPendingOfertaAction();
        }
      }
      return;
    }
    if (hiddenByLockRef.current) {
      hiddenByLockRef.current = false;
      if (!contractRef.current && needsOferta({ ...(userDataRef.current || {}), is_active: 1 })) {
        dispatch(contractModalShow({ show: true }));
      } else {
        clearPendingOfertaAction();
      }
      return;
    }
    if (afterIdTimerRef.current || !hasOfertaAfterIdentification()) return;
    if (!consumeOfertaAfterIdentification(userDataRef.current)) return;
    afterIdTimerRef.current = setTimeout(() => {
      afterIdTimerRef.current = null;
      const r = currentRouteName();
      if (!r || OFERTA_WAIT_ROUTES.has(r)) {
        // Shu kechikish ichida ilova qulflandi — qulf ochilgach ko'rsatamiz.
        if (r === 'SetLocalPassword') hiddenByLockRef.current = true;
        return;
      }
      // Oyna allaqachon ochiq (masalan "Qarz berish" darvozasi) — eslab qolingan amalni o'chirib yubormaslik
      // uchun qayta ochmaymiz.
      if (!contractRef.current) openOferta();
    }, OFERTA_AFTER_ID_DELAY_MS);
  }, [dispatch]);

  useEffect(() => {
    const nav: any = navigationRef.current;
    const unsub = nav?.addListener?.('state', tryOpenAfterId);
    return () => {
      unsub?.();
      if (afterIdTimerRef.current) clearTimeout(afterIdTimerRef.current);
      afterIdTimerRef.current = null;
    };
  }, [tryOpenAfterId]);

  useEffect(() => {
    userDataRef.current = userData;
    tryOpenAfterId();
  }, [userData, tryOpenAfterId]);

  /** Rad etish: oynani yopadi; eslab qolingan shartnoma amali bekor qilinadi (keyingi urinishda oyna yana ochiladi). */
  const resetHiddenByLock = () => {
    hiddenByLockRef.current = false;
  };
  return { resetHiddenByLock };
};
