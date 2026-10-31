import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useTranslation } from 'react-i18next';
import { URL } from '../../../../constants';
import { useFetch } from '../../../../../hooks/useFetch';
import apiClient from '../../../../../store/api/apiClient';
import { PLAN_AMOUNT } from './tariffsData';

const toastOk = (desc: string) =>
  Toast.show({
    autoHide: true, visibilityTime: 2400, position: 'bottom', type: 'omad',
    props: { desc },
  });
const toastErr = (desc: string) =>
  Toast.show({
    autoHide: true, visibilityTime: 2600, position: 'bottom', type: 'error2',
    props: { desc },
  });

/** Tariflar ekrani holati: balans, joriy obuna, SMS balansi va tarif/SMS paket xaridi (modal + to'lov so'rovi). */
export function useTariffs() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector((state: any) => state.HomeReducer.user);

  // Mobil hisob balansi — REAL (/user/me). Redux'dagi qiymat zaxira sifatida.
  const me = useFetch({ method: 'GET', url: URL + '/user/me' });
  const balance = Number((me.data as any)?.data?.balance ?? user?.data?.balance ?? 0) || 0;

  // Joriy obuna (tarif) — REAL. Qaysi karta "Joriy tarif" ekanini shu belgilaydi.
  const subRes = useFetch({ method: 'GET', url: URL + '/finance/subscription/' });
  const currentPlan: string = (subRes.data as any)?.data?.subscription?.plan || 'free';
  // 29.09: joriy tarif muddati (ulangan/tugash sanasi, qolgan kun) va yaqinda tugagan tarif.
  const subData: any = (subRes.data as any)?.data || {};

  // Sotib olish jarayoni — bosilgan tugma kaliti (ikki marta bosishdan himoya + spinner).
  const [busy, setBusy] = React.useState<string | null>(null);
  // Tarif/SMS xarid MODALI holati (so'rov SS11 — sayt kabi balans-breakdown oynasi).
  const [payModal, setPayModal] = React.useState<any>(null);

  // SMS balansi — REAL (/qarz-daftari/sms-balance). Free tarifda 100 SMS grant.
  const smsRes = useFetch({ method: 'GET', url: URL + '/qarz-daftari/sms-balance' });
  const smsB: any = (smsRes.data as any)?.data || {};
  const smsTotal = Number(smsB.total || 0);
  const smsRemaining = Number(smsB.remaining || 0);
  const smsUsed = Number(smsB.used ?? Math.max(smsTotal - smsRemaining, 0));
  const smsBarPct = smsTotal > 0 ? Math.min(100, Math.round((smsUsed / smsTotal) * 100)) : 0;

  // Sotib olgandan keyin balans, SMS va obunani qayta yuklaymiz.
  const refetchAll = () => {
    me.onRefresh({});
    smsRes.onRefresh({});
    subRes.onRefresh({});
  };

  // Tarif/SMS xarid MODALI — balans yetsa "Tasdiqlash", aks holda "Mobil hisobni to'ldirish".
  const closePay = () => setPayModal(null);
  const confirmPay = async () => {
    if (!payModal || busy) return;
    setBusy(payModal.key);
    try {
      await apiClient.post(payModal.path, payModal.body);
      toastOk(payModal.successText);
      refetchAll();
      closePay();
    } catch (e: any) {
      const r = e?.response;
      closePay();
      if (r?.status === 402 && r?.data?.code === 'insufficient-balance') {
        toastErr(t('Mobil hisobda mablag‘ yetarli emas'));
      } else {
        toastErr(t('Amalni bajarib bo‘lmadi. Birozdan so‘ng urinib ko‘ring'));
      }
    } finally {
      setBusy(null);
    }
  };

  // Tarifga ulanish — modal ochadi (balansdan yechim tasdiq oynasida).
  const purchasePlan = (planKey: string, badge: string) => {
    setPayModal({
      key: 'plan-' + planKey,
      title: t('Tarifga ulanish'),
      tarif: badge,
      price: PLAN_AMOUNT[planKey] || 0,
      path: '/finance/subscription/purchase-from-balance',
      body: { plan: planKey },
      successText: t('Tarif muvaffaqiyatli ulandi'),
    });
  };

  // Qo'shimcha SMS paket sotib olish — shu modal.
  const purchaseAddon = (pkg: { name: string; sms: string; amount: number }) => {
    setPayModal({
      key: 'sms-' + pkg.name,
      title: t('SMS paket sotib olish'),
      tarif: `${pkg.sms} SMS`,
      price: pkg.amount,
      path: '/finance/subscription/purchase-addon-from-balance',
      body: { package_name: pkg.name },
      successText: t('SMS paket qo‘shildi'),
    });
  };

  return {
    t,
    navigation,
    balance,
    currentPlan,
    subData,
    busy,
    payModal,
    smsTotal,
    smsRemaining,
    smsUsed,
    smsBarPct,
    closePay,
    confirmPay,
    purchasePlan,
    purchaseAddon,
  };
}
