/**
 * DebtPlanFields.tsx — bitta qarzning REJA maydonlari (PATCH /finance/debts/:id/plan):
 * tur (izohi bilan), yillik foiz, muddat, oylik to'lov, karta minimumi, muddatidan oldin
 * to'lash jarimasi/rejimi, qo'lga tekkan summa (haqiqiy stavka), to'lov kuni.
 * Sozlash (1-qadam) va Qarz tafsilotida bir xil ishlatiladi. Holat — ota komponentda.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import { AmountField } from '../financeForm';
import { amountToInput, isUsd, parseAmount } from '../../../../helper/money';
import { fDate } from '../financeMoney';
import { DEBT_KINDS, DebtKind, paymentBelowInterest, PlanDebt, realAnnualRate } from './debtPlanApi';
import { HelpBox, Label, NumField, Segmented, Stepper, DP } from './debtPlanUi';
import { fPct, KIND_META } from './debtPlanText';

/** Raqamli (number|null) qiymat uchun AmountField o'ramasi — xom satr ichkarida saqlanadi. */
export const MoneyInput = ({
  value,
  onChange,
  currency,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  currency: string;
}) => {
  const usd = isUsd(currency);
  const [raw, setRaw] = React.useState(value != null && value > 0 ? amountToInput(value, usd) : '');
  React.useEffect(() => {
    const cur = parseAmount(raw, usd);
    if ((value ?? 0) !== cur) setRaw(value != null && value > 0 ? amountToInput(value, usd) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <AmountField
      value={raw}
      currency={currency}
      onChange={r => {
        setRaw(r);
        const v = parseAmount(r, usd);
        onChange(v > 0 ? v : null);
      }}
    />
  );
};

const KIND_HAS = {
  apr: ['annuity', 'differentiated', 'card'],
  term: ['annuity', 'differentiated', 'installment'],
  minPayment: ['annuity', 'differentiated', 'installment'],
  card: ['card'],
  prepay: ['annuity', 'differentiated'],
  received: ['annuity'],
  payDay: ['annuity', 'differentiated', 'card', 'installment'],
} as const;
const has = (k: keyof typeof KIND_HAS, kind: DebtKind | null) =>
  !!kind && (KIND_HAS[k] as readonly string[]).includes(kind);

const DebtPlanFields = ({ debt, onChange }: { debt: PlanDebt; onChange: (d: PlanDebt) => void }) => {
  const set = (patch: Partial<PlanDebt>) => onChange({ ...debt, ...patch });
  const kind = debt.kind;
  const real =
    has('received', kind) && debt.receivedAmount && debt.minPayment && debt.termMonths
      ? realAnnualRate(debt.minPayment, debt.termMonths, debt.receivedAmount)
      : null;

  return (
    <View>
      <Label>{t('Qarz turi')}</Label>
      <View style={styles.kindGrid}>
        {DEBT_KINDS.map(k => {
          const active = k === kind;
          return (
            <TouchableOpacity
              key={k}
              activeOpacity={0.85}
              onPress={() => set({ kind: k })}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.kindBtn, active && styles.kindActive]}>
              <Text allowFontScaling={false} style={[styles.kindText, active && styles.kindTextActive]} numberOfLines={2}>
                {t(KIND_META[k].label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {kind ? <Text style={styles.kindHint}>{t(KIND_META[kind].hint)}</Text> : (
        <Text style={[styles.kindHint, { color: DP.warn }]}>{t('Turini tanlang — to‘lov shunga qarab hisoblanadi.')}</Text>
      )}

      {has('apr', kind) ? (
        <>
          <Label hint={t('Shartnomadagi nominal stavka. Bilmasangiz — qo‘lga tekkan summani kiriting.')}>
            {t('Yillik foiz')}
          </Label>
          <NumField value={debt.apr} onChange={v => set({ apr: v })} suffix="%" decimals max={500} />
        </>
      ) : null}

      {has('term', kind) ? (
        <>
          <Label>{t('Qolgan muddat')}</Label>
          <NumField value={debt.termMonths} onChange={v => set({ termMonths: v })} suffix={t('oy')} max={600} />
        </>
      ) : null}

      {has('minPayment', kind) ? (
        <>
          <Label hint={kind === 'annuity' ? t('Bo‘sh qoldirsangiz — qoldiq, foiz va muddatdan hisoblanadi.') : undefined}>
            {t('Oylik to‘lov')}
          </Label>
          <MoneyInput value={debt.minPayment} onChange={v => set({ minPayment: v })} currency={debt.currency} />
        </>
      ) : null}

      {paymentBelowInterest(debt) ? (
        <View style={{ marginTop: rs(10) }}>
          <HelpBox
            tone="danger"
            title={t('To‘lov foizni ham qoplamaydi')}
            text={t('Oylik to‘lov qoldiq × oylik foizdan kichik — bunday qarz hech qachon yopilmaydi. Summa yoki foizni tekshiring.')}
          />
        </View>
      ) : null}

      {has('card', kind) ? (
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Label>{t('Minimal to‘lov, %')}</Label>
            <NumField value={debt.cardMinPct} onChange={v => set({ cardMinPct: v })} suffix="%" decimals max={100} placeholder="5" />
          </View>
          <View style={{ flex: 1.3 }}>
            <Label>{t('Eng kam summa')}</Label>
            <MoneyInput value={debt.cardMinAbs} onChange={v => set({ cardMinAbs: v })} currency={debt.currency} />
          </View>
        </View>
      ) : null}

      {kind === 'dated' ? (
        <View style={{ marginTop: rs(10) }}>
          <HelpBox
            tone={debt.dueDate ? 'info' : 'warn'}
            text={
              debt.dueDate
                ? t('Qaytarish sanasi: {{date}}. Sanani “Shaxsiy qarz” bo‘limida o‘zgartirish mumkin.', { date: fDate(debt.dueDate) })
                : t('Qaytarish sanasi kiritilmagan. “Shaxsiy qarz” bo‘limida qarzga muddat qo‘shing.')
            }
          />
        </View>
      ) : null}

      {has('received', kind) ? (
        <>
          <Label hint={t('Komissiya ushlangan bo‘lsa — haqiqiy stavka to‘lovlardan topiladi.')}>
            {t('Qo‘lga tekkan summa (ixtiyoriy)')}
          </Label>
          <MoneyInput value={debt.receivedAmount} onChange={v => set({ receivedAmount: v })} currency={debt.currency} />
          {real != null ? (
            <Text style={styles.realRate}>
              {t('Haqiqiy stavka: yillik {{rate}}%', { rate: fPct(real) })}
            </Text>
          ) : null}
        </>
      ) : null}

      {has('prepay', kind) ? (
        <>
          <Label>{t('Muddatidan oldin to‘lash jarimasi')}</Label>
          <NumField value={debt.prepayFeePct || null} onChange={v => set({ prepayFeePct: v || 0 })} suffix="%" decimals max={50} />
          <Label hint={t('Muddat qisqarsa foiz ko‘proq tejaladi — bankdan shuni so‘rang.')}>
            {t('Ortiqcha to‘lov nima qiladi')}
          </Label>
          <Segmented
            value={debt.prepayMode}
            onChange={v => set({ prepayMode: v })}
            options={[
              { value: 'shorten_term', label: t('Muddat qisqaradi') },
              { value: 'lower_payment', label: t('To‘lov kamayadi') },
            ]}
          />
        </>
      ) : null}

      {has('payDay', kind) ? (
        <>
          <Label hint={t('Shu kuni va bir kun oldin eslatma keladi.')}>{t('To‘lov kuni')}</Label>
          <Stepper
            value={debt.paymentDay || 0}
            min={0}
            max={31}
            onChange={v => set({ paymentDay: v || null })}
            format={v => (v ? t('har oy {{d}}-kuni', { d: v }) : t('Belgilanmagan'))}
            label={t('To‘lov kuni')}
          />
        </>
      ) : null}
    </View>
  );
};

export default DebtPlanFields;

const styles = StyleSheet.create({
  kindGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  kindBtn: {
    width: '48%',
    flexGrow: 1,
    minHeight: rs(46),
    justifyContent: 'center',
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(10),
    paddingVertical: rs(8),
  },
  kindActive: { borderColor: DP.accent, backgroundColor: DP.tint },
  kindText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  kindTextActive: { color: DP.accentStrong },
  kindHint: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(8), lineHeight: rs(17) },
  row2: { flexDirection: 'row', gap: rs(10) },
  realRate: { fontFamily: rd.font.bold, fontSize: rs(13), color: DP.accentStrong, marginTop: rs(8) },
});
