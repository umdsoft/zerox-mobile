/**
 * useOfertaGuard — "Qarz shartnomasi" AMALLARI uchun oferta darvozasi (hook).
 *
 * SS-DEV (2026-09-29): `const guard = useOfertaGuard(); guard(() => navigation.navigate('DebtEntry'))`.
 * Oferta tasdiqlangan bo'lsa amal darhol bajariladi; aks holda ContractModal ochiladi
 * va amal tasdiqlangandan KEYIN avtomatik davom etadi (batafsil: helper/ofertaGate.ts).
 */
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { guardOferta } from '../helper/ofertaGate';

export const useOfertaGuard = () => {
  const userData = useSelector((s: any) => s.HomeReducer?.user?.data);
  return useCallback((action: () => void): boolean => guardOferta(userData, action), [userData]);
};

export default useOfertaGuard;
