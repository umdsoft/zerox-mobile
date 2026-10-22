/**
 * DebtPlanPayModal.tsx — "To'ladim" tasdiq oynasi.
 * Mavjud POST /finance/debts/:id/payments (create_expense) — yangi mexanizm yo'q.
 * Reja summasi UZS da; USD qarzda summa kurs bo'yicha qarz valyutasiga o'giriladi
 * (kurs noma'lum bo'lsa foydalanuvchi o'zi kiritadi). Qoldiqdan oshmaydi.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import { AmountField } from '../financeForm';
import { localDateKey } from '../financeMoney';
import { amountToInput, exceedsAmount, fmtAmountByCurrency, isUsd, parseAmount, toCents } from '../../../../helper/money';
import { apiErrorText, debtPlanApi, PlanDebt } from './debtPlanApi';
import { ConfirmModal } from './debtPlanUi';
import { fUzs } from './debtPlanText';

type Props = {
  debt: PlanDebt | null;
  suggestedUzs: number | null;
  suggestedOrig?: number | null; // qarz valyutasida (backend amountOrig)
  fxUsd: number | null;
  onClose: () => void;
  onDone: (debtId: number) => void;
};

const initialAmount = (debt: PlanDebt, suggestedUzs: number | null, fxUsd: number | null, orig: number | null): string => {
  const usd = isUsd(debt.currency);
  let v: number | null = orig != null && orig > 0 ? orig : suggestedUzs;
  if (orig == null && v != null && usd) v = fxUsd ? v / fxUsd : null;
  if (v == null || !(v > 0)) return '';
  return amountToInput(Math.min(v, debt.balance), usd);
};

const DebtPlanPayModal = ({ debt, suggestedUzs, suggestedOrig = null, fxUsd, onClose, onDone }: Props) => {
  const [val, setVal] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (debt) setVal(initialAmount(debt, suggestedUzs, fxUsd, suggestedOrig));
  }, [debt, suggestedUzs, fxUsd, suggestedOrig]);

  if (!debt) return null;
  const usd = isUsd(debt.currency);
  const amount = parseAmount(val, usd);
  const over = exceedsAmount(amount, debt.balance);

  const submit = async () => {
    if (busy) return;
    if (!(amount > 0)) {
      Toast.show({ type: 'error2', props: { desc: t('Summani kiriting') } });
      return;
    }
    if (over) {
      Toast.show({ type: 'error2', props: { desc: t('Summa qoldiqdan oshmasligi kerak') } });
      return;
    }
    try {
      setBusy(true);
      await debtPlanApi.pay(debt.id, { amount, payment_date: localDateKey(new Date()) });
      const closed = toCents(amount) >= toCents(debt.balance);
      Toast.show({ type: 'omad', props: { desc: closed ? t('Qarz yopildi') : t('To‘lov qayd etildi') } });
      onDone(debt.id);
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: apiErrorText(e) || t('Xatolik yuz berdi') } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmModal
      visible={!!debt}
      title={t('To‘lovni tasdiqlang')}
      text={t('“{{title}}” qarziga to‘lov qayd etiladi va qarz qoldig‘i kamayadi.', { title: debt.title })}
      confirmText={t('To‘ladim')}
      onConfirm={submit}
      onCancel={onClose}
      busy={busy}>
      <View style={styles.box}>
        <Text style={styles.label}>{t('Summa')}</Text>
        <AmountField value={val} onChange={setVal} currency={debt.currency} />
        <Text style={[styles.hint, over && styles.err]}>
          {over
            ? t('Summa qoldiqdan oshmasligi kerak')
            : t('Qoldiq: {{amount}}', { amount: `${fmtAmountByCurrency(debt.balance, debt.currency)} ${debt.currency}` })}
        </Text>
        {usd && suggestedUzs ? (
          <Text style={styles.hint}>{t('Reja bo‘yicha: {{amount}}', { amount: fUzs(suggestedUzs) })}</Text>
        ) : null}
      </View>
    </ConfirmModal>
  );
};

export default DebtPlanPayModal;

const styles = StyleSheet.create({
  box: { marginTop: rs(14) },
  label: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary, marginBottom: rs(6) },
  hint: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(6) },
  err: { color: rd.color.error },
});
