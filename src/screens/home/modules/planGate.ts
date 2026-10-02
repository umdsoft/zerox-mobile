/**
 * planGate.ts — TARIF CHEKLOVI (02.10): pullik tarif muddati tugasa, u Free bilan
 * TENG — obuna imkoniyatlari (qo'lda SMS, talab, eslatma va h.k.) yopiladi.
 *
 * Backend kontrakti (foydalanuvchi boshlagan SMS amallari, tarifda imkoniyat yo'q):
 *   403 { success:false, code:'plan-required', feature:'manual_sms_send',
 *         required_plan:'start', current_plan:'free', expired:true|false,
 *         message:'<tarjima qilingan matn>',
 *         sms:{ sent:false, reason:'PLAN_REQUIRED', message } }
 *   `requireFeature` middleware 403 lari ham endi `code:'plan-required'` + `feature`.
 * Shaxsiy qarz to'lovi (notify_sms) esa MUVAFFAQIYATLI o'tadi, faqat javobda
 *   sms:{ sent:false, reason:'PLAN_REQUIRED', message } bo'lishi mumkin.
 *
 * Qo'llanilishi: Qarz daftari talab (qarzTalab.ts), Shaxsiy qarz talab
 * (FinanceDebtDetail / FinanceDebtGroup). Oldindan qulf — `usePlanFeatures`:
 * imkoniyatlar YUKLANMAGAN bo'lsa qulflanmaydi (server o'zi hal qiladi).
 */
import React from 'react';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { financeApi } from './financeApi';
import { isXodimSession } from '../../../store/api/token/xodimSession';
import { isXodimShopSelected } from '../../../store/api/token/qarzShop';

export const PLAN_EXPIRED_TEXT =
  'Tarif muddati tugagan. Bu imkoniyatdan foydalanish uchun tarifni uzaytiring.';
export const PLAN_PAID_ONLY_TEXT =
  'Bu imkoniyat faqat pullik tarifda mavjud. Foydalanish uchun tarifni faollashtiring.';

type Translate = (k: string) => string;
type PlanCtx = {
  t: Translate;
  navigation: { navigate: (name: string, params?: object) => void };
};
type PlanInfo = { message?: unknown; expired?: unknown } | null | undefined;

/** Xato backend'ning "tarif kerak" javobimi (403 code:'plan-required'). */
export const isPlanRequiredError = (error: any): boolean =>
  error?.response?.data?.code === 'plan-required';

/** Server matni (tarjima qilingan) ustun; bo'lmasa — `expired` ga qarab mahalliy matn. */
export const planRequiredText = (info: PlanInfo, t: Translate): string => {
  const srv = typeof info?.message === 'string' ? info.message.trim() : '';
  if (srv) return srv;
  return t(info?.expired === true ? PLAN_EXPIRED_TEXT : PLAN_PAID_ONLY_TEXT);
};

/** Toast + Tariflar sahifasi ('Types'). */
export const showPlanRequired = (info: PlanInfo, { t, navigation }: PlanCtx) => {
  Toast.show({
    type: 'error2',
    visibilityTime: 4500,
    props: { desc: planRequiredText(info, t) },
  });
  navigation.navigate('Types');
};

/** 'plan-required' bo'lsa ko'rsatadi va `true` qaytaradi (umumiy xato toasti chiqmasin). */
export const handlePlanRequiredError = (error: any, ctx: PlanCtx): boolean => {
  if (!isPlanRequiredError(error)) return false;
  showPlanRequired(error.response.data, ctx);
  return true;
};

/**
 * Muvaffaqiyatli javobdagi `sms:{sent:false, reason:'PLAN_REQUIRED'}` — SMS tarif
 * sababli yuborilmagan. Ma'lumot matnini qaytaradi, aks holda `null`.
 */
export const smsPlanNotice = (resData: any, t: Translate): string | null => {
  const sms = resData?.sms;
  if (!sms || sms.sent !== false || sms.reason !== 'PLAN_REQUIRED') return null;
  return planRequiredText({ message: sms.message, expired: resData?.expired }, t);
};

export type PlanState = { features: Record<string, unknown>; expired: boolean };

/**
 * Joriy tarif imkoniyatlari (GET /finance/subscription → data.features).
 * Har FOKUSda qayta olinadi — Tariflar sahifasida tarif olib qaytganda qulf
 * darhol ochiladi. Xato bo'lsa `null` qoladi: qulf YO'Q, server 403 hal qiladi.
 */
export const usePlanFeatures = (): PlanState | null => {
  const [state, setState] = React.useState<PlanState | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      financeApi
        .getSubscription()
        .then(r => {
          const d = r?.data?.data;
          if (!alive || !d?.features || typeof d.features !== 'object') return;
          setState({
            features: d.features,
            // Faol pullik tarif yo'q, lekin yaqinda tugagani bor → "muddati tugagan".
            expired: !!d.previous || d.subscription?.is_expired === true,
          });
        })
        .catch(() => {
          // Ataylab jim: imkoniyatlar noma'lum → tugma qulflanmaydi, server tekshiradi.
        });
      return () => {
        alive = false;
      };
    }, []),
  );
  return state;
};

/**
 * Qarz daftari: tarif — do'kon EGASINIKI. Xodim sessiyasi yoki begona (xodim bo'lgan) do'kon
 * tanlangan bo'lsa, o'z tarifimiz bo'yicha QULFLAMAYMIZ — server egasi tarifini tekshiradi.
 */
export const isQarzStaffContext = (): boolean => {
  try {
    return isXodimSession() || isXodimShopSelected();
  } catch {
    return false;
  }
};

/** Imkoniyat ANIQ `false` bo'lsagina qulf (kalit yo'q / yuklanmagan → qulf yo'q). */
export const isFeatureLocked = (plan: PlanState | null, key: string): boolean =>
  plan?.features?.[key] === false;
