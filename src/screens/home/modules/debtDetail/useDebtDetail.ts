/**
 * useDebtDetail.ts — FinanceDebtDetail ma'lumot + amal hook'i (FinanceDebtDetail.tsx dan ko'chirilgan).
 * Barcha API amallari useApiAction ustida: takroriy bosishdan himoya + `loading` bayrog'i. Xulq o'zgarmagan
 * (__tests__/finance_debt_detail.test.tsx); yagona farq: o'sha render ichidagi IKKI TEZKOR bosish endi bitta so'rov.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { safeOpenURL } from '../../../../helper/safeOpenURL';
import { apiErrorMessage, useApiAction } from '../../../../hooks/useApiAction';
import { useFetch } from '../../../../hooks/useFetch';
import { URL } from '../../../constants';
import { financeApi } from '../financeApi';
import { localDateKey } from '../financeMoney';
import { isFeatureLocked, showPlanRequired, usePlanFeatures } from '../planGate';
import { useFinanceDemand } from '../useDebtGroupActions';
import {
  actionFlags, applyMirrorPayment, buildDebtView, complaintTargetFor, forgiveErrorText, mirrorPayBody, ownPayBody,
  payAmountState, payErrorText, paySmsNotice, payToast, smsTemplates, smsUrl,
} from './debtDetailLogic';

export const useDebtDetail = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  /**
   * SS6 (2026-09-17): KO'ZGU qarz — `id` server yozuvi emas ("shop_12"), so'rov yuborilmaydi.
   * `hideParty` — SS5: kontragent guruhidan ochilganda ism/telefon takrorlanmaydi.
   */
  const { id, mirror, hideParty } = (useRoute().params as any) || {};
  const isMirror = !!mirror;
  // SS-DEV (2026-09-24): ko'zgu — mahalliy NUSXA (amaldan keyin shu yerda tuzatiladi).
  const [mirrorLocal, setMirrorLocal] = React.useState<any>(mirror || null);
  const patchMirror = (patch: any) => setMirrorLocal((prev: any) => ({ ...(prev || mirror), ...patch }));

  const detailFetch = useFetch({ url: isMirror ? '' : `${URL}/finance/debts/${id}`, method: 'GET' });
  const refresh = detailFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh({});
    }, [refresh]),
  );

  const d: any = isMirror ? mirrorLocal || mirror : (detailFetch.data as any)?.data || null;
  // 02.10: "Qarzni yopish / qaytarish" oynasi (sayt `showPay`): To'liq | Qisman.
  const [showPay, setShowPay] = React.useState(false);
  const [payFull, setPayFull] = React.useState(true);
  const [payVal, setPayVal] = React.useState('');
  const [payDate, setPayDate] = React.useState<Date>(new Date());
  const [payNotes, setPayNotes] = React.useState('');
  const [paySms, setPaySms] = React.useState(false);
  const [showDel, setShowDel] = React.useState(false);
  const [showForgive, setShowForgive] = React.useState(false);
  const [showSms, setShowSms] = React.useState(false);
  const [showComplaint, setShowComplaint] = React.useState(false);
  const [complaintReason, setComplaintReason] = React.useState('');
  const [complaintNote, setComplaintNote] = React.useState('');
  const [complaintSent, setComplaintSent] = React.useState(false);
  const [payoutCard, setPayoutCard] = React.useState<any>(null);
  const payAction = useApiAction();
  const forgiveAction = useApiAction();
  const deleteAction = useApiAction();
  const complaintAction = useApiAction();
  // 02.10: tarif qulflari — talab (manual_sms_send) va to'lov SMS (auto_sms_reminder).
  // Imkoniyatlar yuklanmagan bo'lsa qulf yo'q. ⚠️ Hook — ekrandagi `if (!d) return` DAN OLDIN.
  const plan = usePlanFeatures();
  const demandLocked = isFeatureLocked(plan, 'manual_sms_send');
  const smsLocked = isFeatureLocked(plan, 'auto_sms_reminder');
  // 03.10: talab — karta tekshiruvi + "Talab SMS yuborilsinmi?" oynasi (useDebtGroupActions.useFinanceDemand).
  const finDemand = useFinanceDemand({ t, navigation, plan, demandLocked });
  // 🔴 SS1 (2026-09-13): karta rekvizitlari har FOKUSda qayta o'qiladi.
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      financeApi
        .getPayoutCard()
        .then(r => {
          if (alive) setPayoutCard(r.data?.data || null);
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, []),
  );

  const view = d ? buildDebtView(d, isMirror, t) : null;
  const flags = d && view ? actionFlags(d, view, isMirror, !!hideParty) : null;
  const complaintTarget = d ? complaintTargetFor(d, financeApi, t) : null;
  const complaintCanSend = !!complaintReason || !!complaintNote.trim();
  const { payAmount, payOver } = view ? payAmountState(view, payFull, payVal) : { payAmount: 0, payOver: false };

  const openPay = () => {
    setPayFull(true);
    setPayVal('');
    setPayNotes('');
    setPaySms(false);
    setPayDate(new Date());
    setShowPay(true);
  };
  const choosePayMode = (full: boolean) => {
    setPayFull(full);
    setPayVal('');
  };

  const submitPay = async () => {
    if (payAction.loading || !d || !view) return;
    if (!(payAmount > 0)) {
      Toast.show({ type: 'error2', props: { desc: t('Summani kiriting') } });
      return;
    }
    if (payOver) {
      Toast.show({ type: 'error2', props: { desc: t('Summa qoldiqdan oshmasligi kerak') } });
      return;
    }
    const ymd = localDateKey(payDate);
    const note = payNotes.trim();
    // 03.10 (10-rasm): SMS faqat kalit yoqilgan va telefon bo'lsa (ko'zguda — qarshi tomon raqami).
    const wantSms = paySms && !smsLocked && !!d.phone;
    await payAction.run(
      async () => {
        let planNote: string | null;
        if (isMirror) {
          // SS-DEV (2026-09-24): ko'zgu (men qarz beruvchi) — `mirror-payment`; To'liq = summasiz.
          // 03.10: `notify_sms` — backend hozircha qo'llamaydi; javobda `sms` yo'q → "yuborilmadi".
          const r = await financeApi.mirrorPayDebt(d.id, mirrorPayBody({ ymd, payFull, payAmount, note, wantSms }));
          planNote = paySmsNotice(r, wantSms, t);
          setMirrorLocal((prev: any) => applyMirrorPayment(prev || mirror, r, { remaining: view.remaining, payAmount, ymd, note }));
        } else {
          const pr = await financeApi.addDebtPayment(d.id, ownPayBody({ ymd, payAmount, borrowed: view.borrowed, note, wantSms }));
          // 02.10: to'lov SAQLANDI, lekin SMS tarif sababli yuborilmagan bo'lishi mumkin (+ 03.10: boshqa sabablar).
          planNote = paySmsNotice(pr, wantSms, t);
          refresh({});
        }
        setShowPay(false);
        return planNote;
      },
      {
        onSuccess: planNote => Toast.show(payToast(payAmount, view.remaining, planNote, t)),
        error: e => payErrorText(e, t),
      },
    );
  };

  // 02.10: to'lov SMS'i tarifda yo'q bo'lsa — yoqilmaydi, Tariflar taklifi (sayt `toggleNotifySms`).
  const togglePaySms = (v: boolean) => {
    if (v && smsLocked) {
      setShowPay(false); // 03.10: oyna Tariflar ekrani ustida qolib ketmasin
      showPlanRequired({ expired: plan?.expired }, { t, navigation });
      return;
    }
    setPaySms(v);
  };

  /** SS-DEV (2026-09-24): QARZDAN VOZ KECHISH — o'zimniki `/forgive`, ko'zguda `/mirror-forgive`. */
  const submitForgive = async () => {
    if (forgiveAction.loading || !d) return;
    await forgiveAction.run(
      async () => {
        await financeApi.forgiveDebtAny(d.id, isMirror);
        if (isMirror) patchMirror({ status: 'completed', remaining_amount: 0 });
        else refresh({});
        setShowForgive(false);
      },
      { success: t('Qarzdan voz kechildi'), error: e => forgiveErrorText(e, t) },
    );
  };

  // SS2: qaytarishni talab qilish (SMS). 03.10: karta yo'q → karta ekrani, bor → tasdiq oynasi; tarif qulfi — oqim ichida.
  const demandRepay = () => d && finDemand.start({ id: d.id, is_mirror: isMirror });

  const openComplaint = () => {
    setComplaintReason('');
    setComplaintNote('');
    setComplaintSent(false);
    setShowComplaint(true);
  };
  const submitComplaint = async () => {
    if (complaintAction.loading || !complaintCanSend || !d || !complaintTarget) return;
    await complaintAction.run(
      () => complaintTarget.send({ reason: complaintReason || 'other', izoh: complaintNote.trim() }),
      {
        onSuccess: r => {
          if (r?.data?.success) {
            // SS-DEV (2026-09-29): takror yuborish bloklanmaydi — har safar YANGI shikoyat.
            setComplaintSent(true);
            Toast.show({ type: 'omad', props: { desc: t('Shikoyat yuborildi') } });
          } else {
            Toast.show({ type: 'error2', props: { desc: r?.data?.message || t('Xatolik yuz berdi') } });
          }
        },
        error: e => apiErrorMessage(e, t('Xatolik yuz berdi')),
      },
    );
  };

  /**
   * 02.10 (sayt): yopilgan qarzni O'CHIRISH — bir tomonlama (faqat mening ro'yxatimdan):
   * o'z qaydim → DELETE, hamkor qaydi → `mirror-hide`.
   */
  const doDelete = async () => {
    if (deleteAction.loading || !d) return;
    await deleteAction.run(
      async () => {
        if (isMirror) await financeApi.mirrorHideDebt(d.id);
        else await financeApi.deleteDebt(d.id);
        setShowDel(false);
      },
      { success: t('O‘chirildi'), error: e => apiErrorMessage(e, t('Xatolik yuz berdi')), onSuccess: () => navigation.goBack() },
    );
  };

  /** Ochiq qarzda shu kontragent bilan YANA qarz — faqat shu qarz turida (sayt "Yana qarz berish"). */
  const addMore = () =>
    d &&
    navigation.navigate('FinanceDebtAdd', {
      initialType: d.type === 'borrowed' ? 'borrowed' : 'lent',
      initialName: d.source_name || '',
      initialPhone: d.phone || '',
    });

  const sendSms = (text?: string) => {
    setShowSms(false);
    safeOpenURL(smsUrl(view?.partyPhone || '', text)); // SS-SEC (2026-09-25): faqat https/tel/sms/tg
  };
  const templates = () => (d && view ? smsTemplates(d, view, payoutCard) : []);

  return {
    t, d, view, flags, isMirror, hideParty: !!hideParty, payoutCard,
    demandLocked, smsLocked, demanding: finDemand.demanding, demandModal: finDemand.modal,
    // to'lov
    showPay, setShowPay, payFull, payVal, setPayVal, payDate, setPayDate, payNotes, setPayNotes, paySms,
    paying: payAction.loading, payAmount, payOver, openPay, choosePayMode, submitPay, togglePaySms,
    // voz kechish / o'chirish
    showForgive, setShowForgive, forgiving: forgiveAction.loading, submitForgive,
    showDel, setShowDel, deleting: deleteAction.loading, doDelete,
    // shikoyat
    showComplaint, setShowComplaint, complaintReason, setComplaintReason, complaintNote, setComplaintNote,
    complaintSent, complaintBusy: complaintAction.loading, complaintCanSend, complaintTarget, openComplaint, submitComplaint,
    // SMS / navigatsiya
    showSms, setShowSms, templates, sendSms, demandRepay, addMore,
  };
};
export type DebtDetailState = ReturnType<typeof useDebtDetail>;
