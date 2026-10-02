/**
 * useDebtGroupActions.ts — "Qarz oldi-berdi" (FinanceDebtGroup) sarlavhasidagi amallar.
 *
 * 02.10: sayt `pages/finance/debts/group/_key.vue` (actPayGroups / payOne / payMany /
 * allocateSequential / actForgiveMany / sendDemand) bilan AYNAN bir xil API oqimi:
 *   • yopish / qaytarish — tanlangan qarzlar VALYUTA bo'yicha guruhlanadi (UZS va USD
 *     qo'shilmaydi); guruhda bitta qarz → `/payments` (ko'zguda `mirror-payment`), bir nechta →
 *     `POST /finance/debts/allocate-payment` (marshrut yo'q bo'lsa — 404 — ketma-ket zaxira);
 *   • voz kechish — tanlangan har bir qarz uchun ketma-ket `/forgive` (ko'zguda `mirror-forgive`);
 *     qisman muvaffaqiyat ham aniq aytiladi;
 *   • talab — bitta SMS (matn qarzga bog'liq emas): telefonli eng oxirgi ochiq qarz.
 * Tarif qulfi (02.10, planGate) saqlangan: 403 `plan-required` → tarif matni + Tariflar.
 */
import React from 'react';
import Toast from 'react-native-toast-message';
import { allocatePayment, groupByCurrency } from './debtAllocation';
import { DebtActionMode, DebtActionResult } from './FinanceDebtActionModal';
import { financeApi } from './financeApi';
import { localDateKey, num } from './financeMoney';
import { handlePlanRequiredError, PlanState, showPlanRequired } from './planGate';

type Translate = (k: string, o?: any) => string;
type Nav = { navigate: (name: string, params?: object) => void };

type Args = {
  t: Translate;
  navigation: Nav;
  reload: () => Promise<void>;
  plan: PlanState | null;
  demandLocked: boolean;
};

const today = () => localDateKey(new Date());

export const useDebtGroupActions = ({ t, navigation, reload, plan, demandLocked }: Args) => {
  const [actModal, setActModal] = React.useState<DebtActionMode | ''>('');
  const [actBusy, setActBusy] = React.useState(false);
  const [demanding, setDemanding] = React.useState(false);

  /** Server `code` bo'yicha joriy tilda xabar (server matni faqat o'zbekcha bo'lishi mumkin). */
  const actError = (e: any) => {
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

  /** Bitta qarz: `amount` null — butun qoldiq. Qaytaradi: yopildimi. */
  const payOne = async (debt: any, amount: number | null): Promise<boolean> => {
    const full = num(debt.remaining_amount);
    const amt = amount && amount > 0 ? amount : full;
    const res = debt.is_mirror
      ? await financeApi.mirrorPayDebt(debt.id, amount && amount > 0 ? { amount, payment_date: today() } : { payment_date: today() })
      : await financeApi.addDebtPayment(debt.id, { amount: amt, payment_date: today() });
    if (!res?.data?.success) throw new Error('payment failed');
    return amt + 0.0001 >= full;
  };

  /** Zaxira: taqsimot bo'yicha ketma-ket to'lovlar (backend `allocate-payment` yo'q bo'lsa). */
  const allocateSequential = async (debts: any[], amount: number | null) => {
    const planRes = allocatePayment(debts, amount && amount > 0 ? amount : null);
    for (const a of planRes.allocations) {
      if (!(a.pay > 0)) continue;
      const d = a.debt;
      const res = d.is_mirror
        ? await financeApi.mirrorPayDebt(d.id, { amount: a.pay, payment_date: today() })
        : await financeApi.addDebtPayment(d.id, { amount: a.pay, payment_date: today() });
      if (!res?.data?.success) throw new Error('payment failed');
    }
  };

  /** Bir valyutadagi bir nechta qarzga BITTA summa (serverda bitta tranzaksiya). */
  const payMany = async (debts: any[], amount: number | null): Promise<boolean> => {
    const total = debts.reduce((s, d) => s + num(d.remaining_amount), 0);
    const paid = amount && amount > 0 ? amount : total;
    const body: { ids: any[]; amount?: number; payment_date: string } = {
      ids: debts.map(d => d.id),
      payment_date: today(),
    };
    if (amount && amount > 0) body.amount = amount;
    try {
      const res = await financeApi.allocateDebtPayment(body);
      if (!res?.data?.success) throw new Error('allocate failed');
    } catch (e: any) {
      const r = e?.response;
      const routeMissing = r && r.status === 404 && !r?.data?.code;
      if (!routeMissing) throw e;
      await allocateSequential(debts, amount);
    }
    return paid + 0.0001 >= total;
  };

  const finish = async (msg: string) => {
    Toast.show({ type: 'omad', props: { desc: msg } });
    setActModal('');
    await reload();
  };

  /** Har valyuta ALOHIDA, ketma-ket; o'rtada xato bo'lsa bajarilganlari saqlanadi. */
  const actPayGroups = async (debts: any[], amounts: Record<string, number | null>) => {
    if (actBusy) return;
    setActBusy(true);
    let done = 0;
    let allClosed = true;
    try {
      for (const g of groupByCurrency(debts)) {
        const want = num(amounts[g.currency]) > 0 ? num(amounts[g.currency]) : null;
        const closed = g.debts.length === 1 ? await payOne(g.debts[0], want) : await payMany(g.debts, want);
        done += 1;
        if (!closed) allClosed = false;
      }
      await finish(allClosed ? t('Qarz yopildi') : t('To‘lov qayd etildi'));
    } catch (e) {
      if (done) {
        setActModal('');
        await reload();
      }
      actError(e);
    } finally {
      setActBusy(false);
    }
  };

  /** Tanlangan qarzlardan ketma-ket voz kechish (sayt `actForgiveMany`). */
  const actForgiveMany = async (debts: any[]) => {
    if (actBusy) return;
    setActBusy(true);
    let ok = 0;
    let firstErr: any = null;
    try {
      for (const d of debts) {
        try {
          const res = await financeApi.forgiveDebtAny(d.id, !!d.is_mirror);
          if (res?.data?.success) ok += 1;
        } catch (e) {
          if (!firstErr) firstErr = e;
        }
      }
    } finally {
      setActBusy(false);
    }
    if (firstErr) actError(firstErr);
    if (ok > 0) {
      await finish(ok > 1 ? t('{{n}} ta qarzdan voz kechildi', { n: ok }) : t('Qarzdan voz kechildi'));
    } else {
      setActModal('');
    }
  };

  const onActConfirm = ({ debts, amounts }: DebtActionResult) => {
    if (!debts.length) return;
    if (actModal === 'forgive') return actForgiveMany(debts);
    return actPayGroups(debts, amounts);
  };

  /** Talab SMS — karta yo'q bo'lsa karta ekrani; tarifda yo'q bo'lsa — Tariflar taklifi. */
  const sendDemand = async (debt: any) => {
    if (!debt || demanding) return;
    if (demandLocked) {
      showPlanRequired({ expired: plan?.expired }, { t, navigation });
      return;
    }
    setDemanding(true);
    try {
      await financeApi.demandDebtAny(debt.id, !!debt.is_mirror);
      Toast.show({ type: 'omad', props: { desc: t('Qaytarish bo‘yicha SMS yuborildi') } });
    } catch (e: any) {
      if (handlePlanRequiredError(e, { t, navigation })) return;
      const code = e?.response?.data?.code;
      if (code === 'no-card') {
        Toast.show({
          type: 'error2',
          visibilityTime: 4000,
          props: { desc: t('Talab qilish uchun avval plastik karta ma’lumotlaringizni kiriting.') },
        });
        navigation.navigate('FinancePayoutCard');
        return;
      }
      const msg = code === 'no-phone' ? t('Mijoz telefoni yo‘q') : e?.response?.data?.message || t('Xatolik yuz berdi');
      Toast.show({ type: 'error2', visibilityTime: 4000, props: { desc: String(msg) } });
    } finally {
      setDemanding(false);
    }
  };

  return { actModal, setActModal, actBusy, demanding, onActConfirm, sendDemand };
};
