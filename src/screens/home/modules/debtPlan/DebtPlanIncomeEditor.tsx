/**
 * DebtPlanIncomeEditor.tsx — bitta daromad oqimi (sozlashning 2-qadami):
 * nom, summa + valyuta, qaysi oylarda (har oy / ma'lum oylar / bir martalik),
 * oyning qaysi kuni va ishonchliligi (kafolatlangan 1,0 / odatda 0,8 / ehtimoliy 0,5).
 */
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import { TrashIcon } from '../../redesign/icons';
import { CurrencyToggle } from '../financeForm';
import { addMonths, ALL_MONTHS_MASK, currentYm, maskHas, maskToggle, PlanIncome } from './debtPlanApi';
import { Chip, DP, Label, Segmented, Stepper } from './debtPlanUi';
import { MoneyInput } from './DebtPlanFields';
import { fmtYmShort, MONTHS_UZ, RELIABILITY } from './debtPlanText';

type Mode = 'monthly' | 'months' | 'once';
const modeOf = (i: PlanIncome): Mode => (i.oneOffYm ? 'once' : i.monthsMask === ALL_MONTHS_MASK ? 'monthly' : 'months');

const DebtPlanIncomeEditor = ({
  income,
  onChange,
  onRemove,
}: {
  income: PlanIncome;
  onChange: (i: PlanIncome) => void;
  onRemove: () => void;
}) => {
  const set = (patch: Partial<PlanIncome>) => onChange({ ...income, ...patch });
  const mode = modeOf(income);
  const nowYm = currentYm();
  const nextMonths = Array.from({ length: 13 }, (_, k) => addMonths(nowYm, k));

  const setMode = (m: Mode) => {
    if (m === 'monthly') set({ monthsMask: ALL_MONTHS_MASK, oneOffYm: null });
    else if (m === 'months') set({ monthsMask: income.monthsMask === ALL_MONTHS_MASK || !income.monthsMask ? 0 : income.monthsMask, oneOffYm: null });
    else set({ monthsMask: 0, oneOffYm: income.oneOffYm || addMonths(nowYm, 1) });
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <TextInput
          style={styles.title}
          value={income.title}
          onChangeText={v => set({ title: v })}
          placeholder={t('Masalan: Maosh')}
          placeholderTextColor={rd.color.textTertiary}
          allowFontScaling={false}
          maxLength={100}
        />
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('O‘chirish')}
          style={styles.trash}>
          <TrashIcon size={rs(17)} color={rd.color.error} />
        </TouchableOpacity>
      </View>

      <Label>{t('Summa')}</Label>
      <MoneyInput value={income.amount || null} onChange={v => set({ amount: v || 0 })} currency={income.currency} />
      <View style={{ marginTop: rs(8) }}>
        <CurrencyToggle value={income.currency === 'USD' ? 'USD' : 'UZS'} onChange={c => set({ currency: c })} accent={DP.accent} />
      </View>

      <Label>{t('Qachon keladi')}</Label>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'monthly', label: t('Har oy') },
          { value: 'months', label: t('Ma’lum oylar') },
          { value: 'once', label: t('Bir martalik') },
        ]}
      />
      {mode === 'months' ? (
        <View style={styles.chips}>
          {MONTHS_UZ.map((m, idx) => (
            <Chip
              key={m}
              label={t(m).slice(0, 3)}
              active={maskHas(income.monthsMask, idx)}
              onPress={() => set({ monthsMask: maskToggle(income.monthsMask, idx) })}
            />
          ))}
        </View>
      ) : null}
      {mode === 'once' ? (
        <View style={styles.chips}>
          {nextMonths.map(ym => (
            <Chip key={ym} label={fmtYmShort(ym)} active={income.oneOffYm === ym} onPress={() => set({ oneOffYm: ym })} />
          ))}
        </View>
      ) : null}

      <Label>{t('Oyning qaysi kuni')}</Label>
      <Stepper
        value={income.dayOfMonth}
        min={1}
        max={31}
        onChange={v => set({ dayOfMonth: v })}
        format={v => t('{{d}}-kuni', { d: v })}
        label={t('Oyning qaysi kuni')}
      />

      <Label>{t('Ishonchliligi')}</Label>
      <View style={styles.relRow}>
        {RELIABILITY.map(r => {
          const active = Math.abs(income.reliability - r.value) < 0.01;
          return (
            <TouchableOpacity
              key={r.value}
              activeOpacity={0.85}
              onPress={() => set({ reliability: r.value })}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.rel, active && styles.relActive]}>
              <Text allowFontScaling={false} style={[styles.relTitle, active && { color: DP.accentStrong }]} numberOfLines={1}>
                {t(r.label)}
              </Text>
              <Text style={styles.relHint} numberOfLines={2}>
                {t(r.hint)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default DebtPlanIncomeEditor;

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  title: {
    flex: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
    borderBottomWidth: 1.5,
    borderBottomColor: rd.color.border,
    paddingVertical: rs(6),
  },
  trash: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    backgroundColor: rd.color.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), marginTop: rs(10) },
  relRow: { flexDirection: 'row', gap: rs(6) },
  rel: {
    flex: 1,
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    padding: rs(8),
    minHeight: rs(66),
  },
  relActive: { borderColor: DP.accent, backgroundColor: DP.tint },
  relTitle: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.text },
  relHint: { fontFamily: rd.font.regular, fontSize: rs(10.5), color: rd.color.textTertiary, marginTop: rs(3), lineHeight: rs(14) },
});
