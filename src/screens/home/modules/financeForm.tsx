/**
 * financeForm.tsx — Shaxsiy moliya formalarida qayta ishlatiladigan bo'laklar:
 * CurrencyToggle (UZS/USD), AmountField (mingtalik), QuickAmounts (valyutaga bog'liq),
 * DateField (DatePicker modal). Accent = hex rang (xarajat ko'k / daromad yashil / maqsad binafsha).
 */
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { rd, rs } from '../../../theme/rd';
import { amountToDisplay, amountToRaw } from './financeMoney';
import { CalendarIcon, ChevronRight } from '../redesign/icons';

const p2 = (n: number) => String(n).padStart(2, '0');
const toDisplayDate = (d?: Date) =>
  d ? `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}` : '';

// ── Valyuta toggle ──
export const CurrencyToggle = ({
  value,
  onChange,
  accent,
}: {
  value: 'UZS' | 'USD';
  onChange: (c: 'UZS' | 'USD') => void;
  accent: string;
}) => (
  <View style={styles.curRow}>
    {(['UZS', 'USD'] as const).map(c => {
      const active = value === c;
      return (
        <TouchableOpacity
          key={c}
          activeOpacity={0.85}
          onPress={() => onChange(c)}
          style={[styles.curBtn, active && { borderColor: accent, backgroundColor: accent + '12' }]}>
          {/* So'rov SS5/SS7/SS8: Valyuta IXCHAM — bir qator (subtitle inline, past balandlik). */}
          <Text allowFontScaling={false} style={[styles.curTitle, active && { color: accent }]}>
            {c}
          </Text>
          <Text allowFontScaling={false} style={styles.curNote}>
            {c === 'UZS' ? "so‘m" : 'dollar'}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ── Summa (mingtalik ajratgich) ──
export const AmountField = ({
  value,
  onChange,
  currency,
}: {
  value: string; // xom raqamlar
  onChange: (raw: string) => void;
  currency: string;
}) => (
  <View style={styles.inputWrap}>
    <TextInput
      style={styles.input}
      value={amountToDisplay(value)}
      onChangeText={t => onChange(amountToRaw(t))}
      keyboardType="number-pad"
      placeholder="0"
      placeholderTextColor={rd.color.textTertiary}
      allowFontScaling={false}
    />
    <Text allowFontScaling={false} style={styles.suffix}>
      {currency}
    </Text>
  </View>
);

// ── Tezkor summa chiplar ──
const PRESETS: Record<string, number[]> = {
  UZS: [10000, 50000, 100000, 500000, 1000000],
  USD: [10, 25, 50, 100, 500],
};
export const QuickAmounts = ({
  currency,
  onPick,
  accent,
}: {
  currency: string;
  onPick: (v: number) => void;
  accent: string;
}) => (
  <View style={styles.quickWrap}>
    {/* So'rov SS7: 5 ta preset BIR QATORGA sig'sin (ilgari 2 qatorga o'tardi).
        Har chip flex:1, matn adjustsFontSizeToFit bilan sig'adi. */}
    {(PRESETS[currency] || PRESETS.UZS).map(v => (
      <TouchableOpacity
        key={v}
        activeOpacity={0.85}
        onPress={() => onPick(v)}
        style={[styles.quickChip, { borderColor: accent + '40' }]}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.quickChipText, { color: accent }]}>
          {amountToDisplay(v)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Sana maydoni (DatePicker modal) ──
export const DateField = ({
  value,
  onChange,
  label,
  accent,
  minimumDate,
  maximumDate,
  placeholder,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  label: string;
  accent: string;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <TouchableOpacity activeOpacity={0.85} style={styles.dateCard} onPress={() => setOpen(true)}>
        <View style={[styles.dateIcon, { backgroundColor: accent + '14' }]}>
          <CalendarIcon size={rs(18)} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.dateLabel}>
            {label}
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.dateValue, !value && styles.datePlaceholder]}>
            {value ? toDisplayDate(value) : placeholder || 'Sanani tanlang'}
          </Text>
        </View>
        <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
      </TouchableOpacity>
      <DatePicker
        open={open}
        date={value || new Date()}
        mode="date"
        modal
        theme="light"
        title={label}
        confirmText="OK"
        cancelText="Bekor qilish"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onConfirm={d => {
          setOpen(false);
          onChange(d);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

// ── Label (kichik sarlavha) ──
export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Text allowFontScaling={false} style={styles.fieldLabel}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    // Ixchamroq (so'rov: bir oynada ko'rinsin) — 10/8 -> 8/6.
    // SS9: moliya formalari ixchamroq vertikal ritm (tugma sig‘sin).
    marginTop: rs(6),
    marginBottom: rs(4),
  },
  // Valyuta — IXCHAM: BIR QATOR (UZS so'm / USD dollar yonma-yon).
  curRow: { flexDirection: 'row', gap: rs(10) },
  curBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(5),
    backgroundColor: rd.color.surface,
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingVertical: rs(9),
  },
  curTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  curNote: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary },
  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  input: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    paddingVertical: rs(11),
  },
  suffix: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    marginLeft: rs(8),
  },
  // Tezkor — BIR QATOR (flex:1, wrap yo'q).
  quickWrap: { flexDirection: 'row', gap: rs(6), marginTop: rs(7) },
  quickChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(4),
    paddingVertical: rs(7),
  },
  quickChipText: { fontFamily: rd.font.semibold, fontSize: rs(11.5) },
  // Sana — IXCHAM (so'rov: juda katta edi).
  // So'rov N2/N3: "Sana" bloki IXCHAMROQ (padding 8→5, ikonka 34→28, shrift kichraytirildi).
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
  },
  dateIcon: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: { fontFamily: rd.font.medium, fontSize: rs(10.5), color: rd.color.textTertiary },
  dateValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
    marginTop: rs(1),
  },
  datePlaceholder: { fontFamily: rd.font.semibold, color: rd.color.textTertiary },
});
