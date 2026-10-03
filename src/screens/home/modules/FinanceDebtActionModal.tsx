/**
 * FinanceDebtActionModal.tsx — kontragentning QAYSI qarz(lar)iga amal qo'llanishini tanlash.
 *
 * 02.10: sayt `components/finance/DebtActionModal.vue` ning mobil nusxasi (8-rasm):
 *   • forgive — "Qarzdan voz kechish": bir, bir nechta yoki "Barchasi (N)" (valyuta bo'yicha
 *               jami), har qatorda summa, "Qarz sanasi: … · Muddat: …", "Muddati o'tgan"
 *               belgisi; pastda "Tanlangan qarzlar yopiladi va qolgan summa qaytmaydi.";
 *               "Voz kechish" tanlov bo'lmaguncha o'chiq.
 *   • close   — "Qarzni yopish" (berilgan qarz qaytarildi), pay — "Qarzni qaytarish" (olingan):
 *               To'liq / Qisman; qisman summa HAR VALYUTA uchun alohida (UZS va USD qo'shilmaydi),
 *               bir valyutada bir nechta qarz bo'lsa summa muddati yaqin qarzdan boshlab
 *               taqsimlanadi (oldindan ko'rinadi — debtAllocation).
 * Natija: onConfirm({ debts, amounts, sms }) — amounts: valyuta → summa | null (null = butun qoldiq).
 * 03.10 (10-rasm): yopish/qaytarishda "SMS yuborish" kaliti — STANDART O'CHIQ; faqat telefoni bor
 *   qarz tanlanganda ko'rinadi. Tarifda imkoniyat yo'q bo'lsa (`smsLocked`) — qulf belgisi, bosilsa
 *   yoqilmaydi, `onSmsLocked` (Tariflar taklifi) chaqiriladi.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { rd, rs } from '../../../theme/rd';
import { CheckIcon, HandCoinReturnIcon, LockIcon } from '../redesign/icons';
import { allocatePayment, Allocation } from './debtAllocation';
import { amountToDisplay, amountToRaw, fDate, fMoney, isDebtOverdue, num } from './financeMoney';

export type DebtActionMode = 'close' | 'pay' | 'forgive';
// 03.10: `sms` — to'lov haqida qarama-qarshi tomonga SMS (faqat yopish/qaytarishda).
export type DebtActionResult = { debts: any[]; amounts: Record<string, number | null>; sms?: boolean };

type Props = {
  visible: boolean;
  mode: DebtActionMode;
  debts: any[];
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (r: DebtActionResult) => void;
  /** 03.10: tarifda to'lov SMS'i yo'q — kalit qulflangan. */
  smsLocked?: boolean;
  /** 03.10: qulflangan kalit bosilganda (Tariflar taklifi). */
  onSmsLocked?: () => void;
};

/** 02.10: "taqiq" belgisi (aylana + chiziq) — sayt voz kechish ikonkasi bilan bir xil. */
export const BanIcon = ({ size = 24, color = '#131a2a', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Line x1="5.64" y1="5.64" x2="18.36" y2="18.36" />
  </Svg>
);

const TONES: Record<DebtActionMode, { soft: string; fg: string; btn: string }> = {
  forgive: { soft: '#FFE4E6', fg: '#BE123C', btn: '#E11D48' },
  close: { soft: '#DCFCE7', fg: '#166534', btn: '#16A34A' },
  pay: { soft: '#DCFCE7', fg: '#166534', btn: '#16A34A' },
};

const CUR_RANK: Record<string, number> = { UZS: 0, USD: 1 };
const curOf = (d: any): string => String(d?.currency || 'UZS');
const sortCurrencies = (list: string[]): string[] =>
  [...new Set(list)].sort((a, b) => (CUR_RANK[a] ?? 2) - (CUR_RANK[b] ?? 2) || (a < b ? -1 : a > b ? 1 : 0));
export const debtKey = (d: any): string => `${d?.is_mirror ? 'm' : 'o'}-${d?.id}`;

/** Qarzlar qoldig'i valyuta bo'yicha: "1 200 000 UZS · 500 USD". */
export const totalsText = (list: any[]): string => {
  const map = new Map<string, number>();
  for (const d of list) map.set(curOf(d), (map.get(curOf(d)) || 0) + num(d?.remaining_amount));
  return sortCurrencies([...map.keys()]).map(c => fMoney(map.get(c) || 0, c)).join(' · ');
};

const Checkbox = ({ on, color }: { on: boolean; color: string }) => (
  <View style={[styles.check, on ? { borderColor: color, backgroundColor: color } : null]}>
    {on ? <CheckIcon size={rs(12)} color="#fff" strokeWidth={3.5} /> : null}
  </View>
);

const FinanceDebtActionModal = ({ visible, mode, debts, name, busy, onCancel, onConfirm, smsLocked, onSmsLocked }: Props) => {
  const { t } = useTranslation();
  const tone = TONES[mode];
  const isForgive = mode === 'forgive';
  const [selected, setSelected] = React.useState<string[]>([]);
  const [partial, setPartial] = React.useState(false);
  const [amounts, setAmounts] = React.useState<Record<string, string>>({});
  const [sms, setSms] = React.useState(false);

  // Har ochilishda toza holat; bitta qarz bo'lsa — darhol tanlangan (sayt `created`).
  React.useEffect(() => {
    if (!visible) return;
    setSelected(debts.length === 1 ? [debtKey(debts[0])] : []);
    setPartial(false);
    setAmounts({});
    setSms(false); // 03.10: har ochilishda O'CHIQ
  }, [visible, debts]);

  const selectedDebts = debts.filter(d => selected.includes(debtKey(d)));
  const selectedCurrencies = sortCurrencies(selectedDebts.map(curOf));
  const allSelected = debts.length > 0 && debts.every(d => selected.includes(debtKey(d)));
  const totalOf = (cur: string) =>
    selectedDebts.filter(d => curOf(d) === cur).reduce((s, d) => s + num(d?.remaining_amount), 0);
  const amountOf = (cur: string) => num(amountToRaw(amounts[cur]));
  const isOver = (cur: string) => amountOf(cur) > 0 && amountOf(cur) > totalOf(cur) + 0.0001;

  // Tanlovdan chiqqan valyutaning summasi saqlanib qolmasin.
  const pruneAmounts = (nextSel: string[]) => {
    const keep = new Set(debts.filter(d => nextSel.includes(debtKey(d))).map(curOf));
    setAmounts(prev => Object.fromEntries(Object.entries(prev).filter(([c]) => keep.has(c))));
  };
  const toggle = (d: any) => {
    const k = debtKey(d);
    const next = selected.includes(k) ? selected.filter(x => x !== k) : [...selected, k];
    setSelected(next);
    pruneAmounts(next);
  };
  const toggleAll = () => {
    const next = allSelected ? [] : debts.map(debtKey);
    setSelected(next);
    pruneAmounts(next);
  };

  /** Taqsimot oldindan ko'rinishi (qisman summa + shu valyutada bir nechta qarz). */
  const preview = React.useMemo(() => {
    const map: Record<string, Allocation> = {};
    if (isForgive || !partial) return map;
    for (const cur of selectedCurrencies) {
      const list = selectedDebts.filter(d => curOf(d) === cur);
      const a = amountOf(cur);
      if (list.length < 2 || !(a > 0) || isOver(cur)) continue;
      for (const x of allocatePayment(list, a).allocations) map[debtKey(x.debt)] = x;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForgive, partial, selected, amounts, debts]);

  // 03.10: SMS — telefoni bor tanlangan qarz bo'lsagina (raqam ko'rsatiladi).
  const smsPhone = isForgive ? '' : String(selectedDebts.find(d => !!d?.phone)?.phone || '');
  const toggleSms = (v: boolean) => {
    if (v && smsLocked) {
      onSmsLocked?.();
      return;
    }
    setSms(v);
  };

  const canConfirm =
    selectedDebts.length > 0 &&
    (isForgive || !partial || selectedCurrencies.every(c => amountOf(c) > 0 && !isOver(c)));

  const title = isForgive ? t('Qarzdan voz kechish') : mode === 'pay' ? t('Qarzni qaytarish') : t('Qarzni yopish');
  const subtitle = isForgive
    ? t('«{{name}}» qaysi qarz(lar)idan voz kechasiz? Bir nechtasini yoki barchasini tanlashingiz mumkin.', { name: name || '—' })
    : mode === 'pay'
    ? t('«{{name}}»ga qaysi qarz(lar)ni qaytardingiz? Bir yoki bir nechta qarzni tanlang va to‘liq yoki qisman summani kiriting.', { name: name || '—' })
    : t('«{{name}}» qaysi qarz(lar)ni qaytardi? Bir yoki bir nechta qarzni tanlang va to‘liq yoki qisman yoping.', { name: name || '—' });
  const confirmText = isForgive
    ? selectedDebts.length > 1
      ? t('Voz kechish ({{n}})', { n: selectedDebts.length })
      : t('Voz kechish')
    : mode === 'pay'
    ? t('Qayd etish')
    : t('Yopish');

  const confirm = () => {
    if (busy || !canConfirm) return;
    const usePartial = !isForgive && partial;
    const out: Record<string, number | null> = {};
    for (const c of selectedCurrencies) out[c] = usePartial ? amountOf(c) : null;
    onConfirm({ debts: selectedDebts, amounts: out, sms: !isForgive && !!smsPhone && sms && !smsLocked });
  };
  const cancel = () => {
    if (!busy) onCancel();
  };

  const partialHint =
    selectedCurrencies.length > 1
      ? t('Har bir valyuta uchun summa alohida kiritiladi; summa avval muddati yaqin qarzlarga taqsimlanadi.')
      : selectedDebts.length > 1
      ? t('Summa avval muddati yaqin qarzlarga taqsimlanadi; qoldiq muddati uzoq qarzda qoladi.')
      : t('Qoldiqqa teng summa kiritilsa — qarz to‘liq yopiladi.');

  const HeadIcon = isForgive ? BanIcon : mode === 'pay' ? HandCoinReturnIcon : CheckIcon;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={cancel}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={cancel} />
          <View style={styles.card}>
            <View style={styles.head}>
              <View style={[styles.headIcon, { backgroundColor: tone.soft }]}>
                <HeadIcon size={rs(26)} color={tone.fg} strokeWidth={2.2} />
              </View>
              <Text allowFontScaling={false} style={styles.title}>{title}</Text>
              <Text allowFontScaling={false} style={styles.subtitle}>{subtitle}</Text>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingBottom: rs(4) }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {debts.length > 1 && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={toggleAll}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: allSelected }}
                  style={[styles.row, styles.allRow, allSelected && { borderColor: tone.btn, backgroundColor: tone.soft }]}>
                  <Checkbox on={allSelected} color={tone.btn} />
                  <Text allowFontScaling={false} style={[styles.allText, allSelected && { color: tone.fg }]}>
                    {t('Barchasi')} ({debts.length})
                  </Text>
                  <Text allowFontScaling={false} style={[styles.allTotals, allSelected && { color: tone.fg }]} numberOfLines={2}>
                    {totalsText(debts)}
                  </Text>
                </TouchableOpacity>
              )}

              {debts.map(d => {
                const on = selected.includes(debtKey(d));
                const pv = preview[debtKey(d)];
                const changed = Math.abs(num(d.amount) - num(d.remaining_amount)) > 0.009;
                return (
                  <TouchableOpacity
                    key={debtKey(d)}
                    activeOpacity={0.85}
                    onPress={() => toggle(d)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    style={[styles.row, on && { borderColor: tone.btn, backgroundColor: tone.soft }]}>
                    <Checkbox on={on} color={tone.btn} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.amtLine}>
                        <Text allowFontScaling={false} style={styles.amt}>{fMoney(d.remaining_amount, curOf(d))}</Text>
                        {d.is_mirror ? (
                          <View style={styles.linkChip}>
                            <Text allowFontScaling={false} style={styles.linkChipText}>{t('Bog‘langan')}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text allowFontScaling={false} style={styles.meta}>
                        {t('Qarz sanasi:')} {fDate(d.start_date || d.created_at) || '—'}
                        {d.due_date ? ` · ${t('Muddat:')} ${fDate(d.due_date)}` : ''}
                      </Text>
                      {changed ? (
                        <Text allowFontScaling={false} style={styles.metaSoft}>
                          {t('Dastlabki summa')}: {fMoney(d.amount, curOf(d))}
                        </Text>
                      ) : null}
                      {pv ? (
                        <Text allowFontScaling={false} style={[styles.preview, { color: pv.closes ? '#15803D' : '#B45309' }]}>
                          {pv.closes
                            ? `✓ ${t('to‘liq yopiladi')}`
                            : pv.pay > 0
                            ? `− ${fMoney(pv.pay, curOf(d))} · ${t('qoladi:')} ${fMoney(pv.remainingAfter, curOf(d))}`
                            : t('o‘zgarmaydi')}
                        </Text>
                      ) : null}
                    </View>
                    {isDebtOverdue(d) ? (
                      <View style={styles.overdue}>
                        <Text allowFontScaling={false} style={styles.overdueText}>{t('Muddati o‘tgan')}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              {!isForgive && selectedDebts.length > 0 && (
                <View style={{ marginTop: rs(8) }}>
                  <View style={styles.seg}>
                    {[false, true].map(p => (
                      <TouchableOpacity
                        key={String(p)}
                        activeOpacity={0.85}
                        onPress={() => setPartial(p)}
                        style={[styles.segBtn, partial === p && styles.segBtnOn]}>
                        <Text allowFontScaling={false} style={[styles.segText, partial === p && styles.segTextOn]}>
                          {p ? t('Qisman') : t('To‘liq')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {partial ? (
                    <View style={{ marginTop: rs(10) }}>
                      {selectedCurrencies.map(cur => (
                        <View key={cur} style={{ marginBottom: rs(10) }}>
                          <Text allowFontScaling={false} style={styles.label}>
                            {mode === 'pay' ? t('Qaytarayotgan summangiz') : t('Qaytarilgan summa')}
                            {selectedCurrencies.length > 1 ? ` (${cur})` : ''}
                          </Text>
                          <View style={[styles.inputWrap, isOver(cur) && { borderColor: '#f87171' }]}>
                            <TextInput
                              allowFontScaling={false}
                              value={amounts[cur] || ''}
                              onChangeText={v => setAmounts(prev => ({ ...prev, [cur]: amountToDisplay(v) }))}
                              keyboardType="number-pad"
                              placeholder={amountToDisplay(String(Math.round(totalOf(cur))))}
                              placeholderTextColor={rd.color.textTertiary}
                              style={styles.input}
                            />
                            <Text allowFontScaling={false} style={styles.cur}>{cur}</Text>
                          </View>
                          {isOver(cur) ? (
                            <Text allowFontScaling={false} style={styles.err}>
                              {t('Summa tanlangan qarzlar qoldig‘idan oshmasligi kerak')} ({fMoney(totalOf(cur), cur)})
                            </Text>
                          ) : null}
                        </View>
                      ))}
                      <Text allowFontScaling={false} style={styles.hint}>{partialHint}</Text>
                    </View>
                  ) : (
                    <Text allowFontScaling={false} style={[styles.hint, { marginTop: rs(8) }]}>
                      {t('Butun qoldiq yopiladi:')} {totalsText(selectedDebts)}
                    </Text>
                  )}
                </View>
              )}
              {/* 03.10: "SMS yuborish" — standart o'chiq; tarif qulfi bilan */}
              {!!smsPhone && (
                <View style={styles.smsRow}>
                  <View style={styles.smsTextWrap}>
                    <View style={styles.smsLabelRow}>
                      <Text allowFontScaling={false} style={styles.smsLabel}>{t('SMS yuborish')}</Text>
                      {smsLocked ? <LockIcon size={rs(13)} color={rd.color.textTertiary} /> : null}
                    </View>
                    <Text allowFontScaling={false} style={styles.smsSub}>
                      {t('Yoqilsa, {{phone}} raqamiga to‘lov va qoldiq qarz haqida SMS yuboriladi.', { phone: smsPhone })}
                    </Text>
                  </View>
                  <Switch
                    value={sms && !smsLocked}
                    onValueChange={toggleSms}
                    trackColor={{ true: rd.color.primary, false: rd.color.border }}
                    thumbColor="#fff"
                    accessibilityLabel={t('SMS yuborish')}
                  />
                </View>
              )}
              {isForgive && (
                <Text allowFontScaling={false} style={[styles.hint, { marginTop: rs(6) }]}>
                  {t('Tanlangan qarzlar yopiladi va qolgan summa qaytmaydi.')}
                </Text>
              )}
            </ScrollView>

            <View style={styles.btns}>
              <TouchableOpacity style={styles.cancelBtn} disabled={busy} onPress={cancel} activeOpacity={0.85}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={busy || !canConfirm}
                onPress={confirm}
                accessibilityState={{ disabled: busy || !canConfirm }}
                style={[styles.okBtn, { backgroundColor: tone.btn }, (busy || !canConfirm) && { opacity: 0.55 }]}>
                <Text allowFontScaling={false} style={styles.okText} numberOfLines={1}>
                  {busy ? '…' : confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default FinanceDebtActionModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(18),
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    overflow: 'hidden',
  },
  head: { alignItems: 'center', paddingHorizontal: rs(20), paddingTop: rs(20), paddingBottom: rs(12) },
  headIcon: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(10),
  },
  title: { fontFamily: rd.font.bold, fontSize: rs(16.5), color: rd.color.text, textAlign: 'center' },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    textAlign: 'center',
    lineHeight: rs(19),
    marginTop: rs(6),
  },
  body: { paddingHorizontal: rs(18), maxHeight: Math.round(Dimensions.get('window').height * 0.5) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(12),
    paddingVertical: rs(11),
    marginBottom: rs(8),
  },
  allRow: { marginBottom: rs(10) },
  allText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  allTotals: { flex: 1, textAlign: 'right', fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.text },
  check: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(6),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amtLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: rs(6) },
  amt: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  linkChip: { backgroundColor: '#ECFDF5', borderRadius: rd.radius.pill, paddingHorizontal: rs(7), paddingVertical: rs(1) },
  linkChipText: { fontFamily: rd.font.semibold, fontSize: rs(10), color: '#065F46' },
  meta: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textSecondary, marginTop: rs(3), lineHeight: rs(16) },
  metaSoft: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2) },
  preview: { fontFamily: rd.font.semibold, fontSize: rs(11.5), marginTop: rs(3) },
  overdue: { backgroundColor: '#FEE2E2', borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(3) },
  overdueText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: '#B91C1C' },
  seg: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: rd.radius.md, padding: rs(4), gap: rs(4) },
  segBtn: { flex: 1, height: rs(36), borderRadius: rs(9), alignItems: 'center', justifyContent: 'center' },
  segBtnOn: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: '#4B5563' },
  segTextOn: { color: '#111827' },
  label: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, marginBottom: rs(5) },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rs(48),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(12),
  },
  input: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text, paddingVertical: 0 },
  cur: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary, marginLeft: rs(8) },
  err: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: '#dc2626', marginTop: rs(5) },
  hint: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, lineHeight: rs(16) },
  // 03.10: "SMS yuborish" kaliti
  smsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(12),
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
  },
  smsTextWrap: { flex: 1, paddingRight: rs(10) },
  smsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  smsLabel: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  smsSub: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2), lineHeight: rs(15) },
  btns: { flexDirection: 'row', gap: rs(10), paddingHorizontal: rs(18), paddingTop: rs(14), paddingBottom: rs(18) },
  cancelBtn: {
    flex: 1,
    height: rs(48),
    borderRadius: rd.radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: '#374151' },
  okBtn: { flex: 1, height: rs(48), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(8) },
  okText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: '#fff' },
});
