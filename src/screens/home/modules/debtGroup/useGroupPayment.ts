import React from 'react';
import Toast from 'react-native-toast-message';
import { DebtActionResult } from '../FinanceDebtActionModal';
import { handlePlanRequiredError, isFeatureLocked, isPlanRequiredError, showPlanRequired } from '../planGate';
import { payDebtsWithSms, smsNoticeText, SmsPayError } from '../debtSms';
import { useDebtGroupActions } from '../useDebtGroupActions';
import type { GroupData } from './useGroupData';

/** FinanceDebtGroup amallari: yopish / qaytarish / voz kechish oynasi, SMS bilan to'lov, talab qilish. */
export function useGroupPayment(g: GroupData) {
  const { t, navigation, reload, plan, demandLocked, actionDebts, demandTarget } = g;

  // 03.10: `demandModal` — "Talab SMS yuborilsinmi?" tasdiq oynasi (karta + OK / X / o'zgartirish).
  const { actModal, setActModal, actBusy, demanding, onActConfirm, sendDemand, demandModal } = useDebtGroupActions({
    t,
    navigation,
    reload,
    plan,
    demandLocked,
  });

  /**
   * 03.10 (10-rasm): yopish/qaytarishda "SMS yuborish" (standart o'chiq). Tarif qulfi — to'lov xabari `auto_sms_reminder`.
   * SMS yoqilganda har qarz alohida `/payments` + `notify_sms` (allocate-payment SMS yubormaydi) — debtSms.payDebtsWithSms.
   */
  const smsLocked = isFeatureLocked(plan, 'auto_sms_reminder');
  const [smsBusy, setSmsBusy] = React.useState(false);
  const onSmsLocked = () => {
    setActModal(''); // Modal Tariflar ekrani ustida qolib ketmasin
    showPlanRequired({ expired: plan?.expired }, { t, navigation });
  };
  const showPayError = (e: any) => {
    if (isPlanRequiredError(e)) setActModal('');
    if (handlePlanRequiredError(e, { t, navigation })) return;
    const d = e?.response?.data || {};
    const msg =
      d.code === 'over-remaining'
        ? t('Summa qoldiqdan oshmasligi kerak')
        : d.code === 'already-closed'
        ? t('Qarz allaqachon yopilgan')
        : d.message || t('Xatolik yuz berdi');
    Toast.show({ type: 'error2', visibilityTime: 4000, props: { desc: String(msg) } });
  };
  const payWithSms = async ({ debts, amounts }: DebtActionResult) => {
    if (smsBusy || actBusy || !debts.length) return;
    setSmsBusy(true);
    try {
      const r = await payDebtsWithSms(debts, amounts);
      setActModal('');
      const okMsg = r.allClosed ? t('Qarz yopildi') : t('To‘lov qayd etildi');
      const note = smsNoticeText(r.outcomes, r.resData, t);
      Toast.show(
        note
          ? { type: 'omad', visibilityTime: 5000, props: { title: okMsg, desc: note } }
          : { type: 'omad', props: { desc: okMsg } },
      );
      await reload();
    } catch (e) {
      const err = e instanceof SmsPayError ? e : null;
      if (err?.done) {
        setActModal('');
        await reload();
      }
      showPayError(err ? err.cause : e);
    } finally {
      setSmsBusy(false);
    }
  };
  const onConfirmAct = (r: DebtActionResult) =>
    r.sms && actModal !== 'forgive' ? payWithSms(r) : onActConfirm(r);

  // Oyna yopilayotganda (fade) sarlavha boshqa rejimga sakramasin — oxirgi rejim saqlanadi.
  const lastMode = React.useRef<'close' | 'pay' | 'forgive'>('close');
  if (actModal) lastMode.current = actModal;

  // 02.10: o'chiq amal bosilganda — sabab (sayt `title` izohi).
  const hint = (msg: string) => Toast.show({ type: 'error2', visibilityTime: 3500, props: { desc: msg } });
  const openAct = (mode: 'close' | 'pay' | 'forgive') => {
    if (actBusy) return;
    if (!actionDebts.length) {
      hint(t('Aktiv qarzlar yo‘q'));
      return;
    }
    setActModal(mode);
  };
  const onDemand = () => {
    if (!actionDebts.length) {
      hint(t('Aktiv qarzlar yo‘q'));
      return;
    }
    if (!demandTarget) {
      hint(t('Qarzdorning telefon raqami kiritilmagan — qarz tafsilotida qo‘shing'));
      return;
    }
    sendDemand(demandTarget);
  };

  return {
    actModal,
    setActModal,
    actBusy,
    demanding,
    demandModal,
    smsLocked,
    smsBusy,
    onSmsLocked,
    onConfirmAct,
    modalMode: actModal || lastMode.current,
    openAct,
    onDemand,
  };
}

export type GroupPayment = ReturnType<typeof useGroupPayment>;
