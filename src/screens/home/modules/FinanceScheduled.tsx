/**
 * FinanceScheduled.tsx — Rejalashtirilgan to'lovlar (web finance/payments) VA
 * Kutilayotgan daromadlar (web finance/expected-income). Ikkalasi bir xil shakl,
 * shu bois umumiy `ScheduledList` komponenti + 2 ta yupqa ekran.
 *
 * Har yozuv: tur (emoji), nomi, davriylik (har oy N-kun / bir marta sana), keyingi
 * sana, summa+valyuta, faol badge. Amallar: To'landi/Olindi (confirm→expense/income
 * yaratadi), O'tkazish (skip→keyingi oyga), Tahrir, O'chirish. Qo'shish/tahrir modal.
 *
 * Backend: /finance/scheduled-payments/* va /finance/scheduled-incomes/*.
 */
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { financeApi } from './financeApi';
import { AmountField, CurrencyToggle, DateField, FieldLabel } from './financeForm';
import { amountToDisplay, amountToRaw, fDate, fMoney, localDateKey, num } from './financeMoney';
import { PlusIcon, TrashIcon, PencilIcon } from '../redesign/icons';

const RED = '#f26464'; // SS13: "juda qizil"→sal ochiqroq (dc2626→f26464)
const GREEN = '#16a34a';

type TypeDef = { key: string; label: string; emoji: string };

const PAYMENT_TYPES: TypeDef[] = [
  { key: 'ijara', label: 'Ijara', emoji: '🏠' },
  { key: 'telefon', label: 'Telefon', emoji: '📱' },
  { key: 'kredit', label: 'Kredit', emoji: '💳' },
  { key: 'kommunal', label: 'Kommunal', emoji: '💡' },
  { key: 'internet', label: 'Internet', emoji: '🌐' },
  { key: 'bogcha', label: 'Bog‘cha', emoji: '🧸' },
  { key: 'maktab', label: 'Maktab', emoji: '🎒' },
  { key: 'boshqa', label: 'Boshqa', emoji: '📌' },
];
const INCOME_TYPES: TypeDef[] = [
  { key: 'oylik', label: 'Oylik', emoji: '💼' },
  { key: 'biznes', label: 'Biznes', emoji: '🏢' },
  { key: 'ijara', label: 'Ijara', emoji: '🏠' },
  { key: 'dividend', label: 'Dividend', emoji: '📈' },
  { key: 'boshqa', label: 'Boshqa', emoji: '📌' },
];

type Cfg = {
  kind: 'payment' | 'income';
  title: string;
  accent: string;
  types: TypeDef[];
  typeField: 'payment_type' | 'income_type';
  confirmLabel: string;
  listUrl: string;
  api: {
    create: (b: any) => Promise<any>;
    update: (id: any, b: any) => Promise<any>;
    del: (id: any) => Promise<any>;
    confirm: (id: any) => Promise<any>;
    skip: (id: any) => Promise<any>;
    history?: (id: any) => Promise<any>;
  };
};

const emptyForm = (types: TypeDef[]) => ({
  id: null as any,
  title: '',
  type: types[0].key,
  amount: '',
  currency: 'UZS' as 'UZS' | 'USD',
  frequency: 'monthly' as 'monthly' | 'once',
  day_of_month: '1',
  once_date: null as Date | null,
  is_active: true,
});

const ScheduledList = ({ cfg }: { cfg: Cfg }) => {
  const { t } = useTranslation();
  const listFetch = useFetch({ url: cfg.listUrl, method: 'GET' });
  const refresh = listFetch.onRefresh;
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

  const items: any[] = (listFetch.data as any)?.data || [];
  const [form, setForm] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);
  const [delTarget, setDelTarget] = React.useState<any>(null);
  const [busyId, setBusyId] = React.useState<any>(null);
  const [detail, setDetail] = React.useState<any>(null); // SS13/SS14: Batafsil modal
  // So'rov: batafsilда — amalga oshirilgan to'lovlar/daromadlar TARIXI.
  const [history, setHistory] = React.useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const openDetail = async (it: any) => {
    setDetail(it);
    setHistory([]);
    if (!cfg.api.history || it?.id == null) return;
    setHistoryLoading(true);
    try {
      const res = await cfg.api.history(it.id);
      setHistory(((res?.data as any)?.data as any[]) || []);
    } catch (_) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const typeDef = (k?: string) => cfg.types.find(t => t.key === k) || cfg.types[cfg.types.length - 1];

  const openAdd = () => setForm(emptyForm(cfg.types));
  const openEdit = (it: any) => {
    setForm({
      id: it.id,
      title: it.title || '',
      type: it[cfg.typeField] || cfg.types[0].key,
      amount: String(Math.round(num(it.amount))),
      currency: it.currency === 'USD' ? 'USD' : 'UZS',
      frequency: it.frequency === 'once' ? 'once' : 'monthly',
      day_of_month: String(it.day_of_month || 1),
      once_date: it.frequency === 'once' && it.next_date ? new Date(String(it.next_date).slice(0, 10)) : null,
      is_active: it.is_active !== false && it.is_active !== 0,
    });
  };

  const submit = async () => {
    if (saving || !form) return;
    if (!form.title.trim()) {
      Toast.show({ type: 'error2', props: { desc: 'Nomini kiriting' } });
      return;
    }
    const amt = num(form.amount);
    if (amt <= 0) {
      Toast.show({ type: 'error2', props: { desc: 'Summani kiriting' } });
      return;
    }
    const body: any = {
      title: form.title.trim(),
      amount: amt,
      currency: form.currency,
      [cfg.typeField]: form.type,
      frequency: form.frequency,
      is_active: form.is_active,
    };
    if (form.frequency === 'monthly') {
      const dom = Math.min(31, Math.max(1, num(form.day_of_month) || 1));
      body.day_of_month = dom;
    } else {
      if (!form.once_date) {
        Toast.show({ type: 'error2', props: { desc: 'Sanani tanlang' } });
        return;
      }
      body.once_date = localDateKey(form.once_date);
    }
    try {
      setSaving(true);
      if (form.id) await cfg.api.update(form.id, body);
      else await cfg.api.create(body);
      setForm(null);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Saqlandi' } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setSaving(false);
    }
  };

  const doConfirm = async (it: any) => {
    if (busyId) return;
    try {
      setBusyId(it.id);
      await cfg.api.confirm(it.id);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: cfg.kind === 'payment' ? 'To‘lov bajarildi' : 'Daromad qayd etildi' } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setBusyId(null);
    }
  };
  const doSkip = async (it: any) => {
    if (busyId) return;
    try {
      setBusyId(it.id);
      await cfg.api.skip(it.id);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Keyingi davrga o‘tkazildi' } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setBusyId(null);
    }
  };
  const doDelete = async () => {
    if (!delTarget) return;
    try {
      await cfg.api.del(delTarget.id);
      setDelTarget(null);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'O‘chirildi' } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t(cfg.title)} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Qo'shish */}
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: cfg.accent }]} activeOpacity={0.85} onPress={openAdd}>
          <PlusIcon size={rs(18)} color="#fff" />
          <Text allowFontScaling={false} style={styles.addBtnText}>{t('Yangi qo‘shish')}</Text>
        </TouchableOpacity>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('Hozircha yozuv yo‘q. "Yangi qo‘shish" orqali qo‘shing.')}</Text>
          </View>
        ) : (
          items.map((it, i) => {
            const td = typeDef(it[cfg.typeField]);
            const active = it.is_active !== false && it.is_active !== 0;
            const sched =
              it.frequency === 'once'
                ? `${fDate(it.next_date)} (bir marta)`
                : `Har oy ${it.day_of_month}-kun`;
            return (
              <View key={it.id ?? i} style={[styles.card, !active && { opacity: 0.6 }]}>
                {/* SS13/SS14: kartaga bosilganda BATAFSIL modal (sayt kabi); tahrir
                    qalamcha-ikonда qoladi. */}
                <TouchableOpacity activeOpacity={0.8} style={styles.cardTop} onPress={() => openDetail(it)}>
                  <View style={[styles.emojiWrap, { backgroundColor: cfg.accent + '14' }]}>
                    <Text style={styles.emoji}>{td.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.cardTitle} numberOfLines={1}>
                      {it.title}
                    </Text>
                    <Text allowFontScaling={false} style={styles.cardSched}>{sched}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text allowFontScaling={false} style={[styles.cardAmt, { color: cfg.accent }]} numberOfLines={1}>
                      {fMoney(it.amount, it.currency)}
                    </Text>
                    <View style={[styles.badge, active ? styles.badgeOn : styles.badgeOff]}>
                      <Text allowFontScaling={false} style={[styles.badgeText, { color: active ? GREEN : rd.color.textTertiary }]}>
                        {active ? 'Faol' : 'Nofaol'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {it.next_date ? (
                  <Text allowFontScaling={false} style={styles.nextDate}>
                    Keyingi: {fDate(it.next_date)}
                  </Text>
                ) : null}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actBtn, { backgroundColor: cfg.accent }]}
                    activeOpacity={0.85}
                    disabled={busyId === it.id}
                    onPress={() => doConfirm(it)}>
                    <Text allowFontScaling={false} style={styles.actBtnText}>{t(cfg.confirmLabel)}</Text>
                  </TouchableOpacity>
                  {it.frequency !== 'once' && active && (
                    <TouchableOpacity style={styles.actGhost} activeOpacity={0.85} disabled={busyId === it.id} onPress={() => doSkip(it)}>
                      <Text allowFontScaling={false} style={styles.actGhostText}>{t('O‘tkazish')}</Text>
                    </TouchableOpacity>
                  )}
                  {/* So'rov N9/N11: "Tahrir" yozuvi o'rniga qalam ikonkasi. */}
                  <TouchableOpacity style={styles.actIcon} activeOpacity={0.85} onPress={() => openEdit(it)}>
                    <PencilIcon size={rs(17)} color={rd.color.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actDel} activeOpacity={0.85} onPress={() => setDelTarget(it)}>
                    <TrashIcon size={rs(17)} color={RED} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: rs(20) }} />
      </ScrollView>

      {/* ── Qo'shish / Tahrir modal ── */}
      <Modal visible={!!form} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setForm(null)}>
        <View style={styles.sheetBackdrop}>
          {/* So'rov: fon (oynaning tepa qismi)ga bosilganda ham yopiladi. */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setForm(null)}
          />
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text allowFontScaling={false} style={styles.sheetTitle}>
                {form?.id ? 'Tahrirlash' : 'Yangi qo‘shish'}
              </Text>

              <FieldLabel>{t('Nomi')}</FieldLabel>
              <TextInput
                allowFontScaling={false}
                value={form?.title}
                onChangeText={t => setForm((f: any) => ({ ...f, title: t }))}
                placeholder={t('Masalan: Uy ijarasi')}
                placeholderTextColor={rd.color.textTertiary}
                style={styles.textInput}
              />

              <FieldLabel>{t('Turi')}</FieldLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: rs(8) }}>
                {cfg.types.map(t => {
                  const on = form?.type === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.typeChip, on && { borderColor: cfg.accent, backgroundColor: cfg.accent + '12' }]}
                      onPress={() => setForm((f: any) => ({ ...f, type: t.key }))}>
                      <Text style={styles.typeEmoji}>{t.emoji}</Text>
                      <Text allowFontScaling={false} style={[styles.typeLabel, on && { color: cfg.accent }]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <FieldLabel>{t('Valyuta')}</FieldLabel>
              <CurrencyToggle value={form?.currency} onChange={c => setForm((f: any) => ({ ...f, currency: c }))} accent={cfg.accent} />

              <FieldLabel>{t('Summa')}</FieldLabel>
              <AmountField value={form?.amount || ''} onChange={raw => setForm((f: any) => ({ ...f, amount: raw }))} currency={form?.currency} />

              <FieldLabel>{t('Davriylik')}</FieldLabel>
              <View style={styles.freqRow}>
                <TouchableOpacity
                  style={[styles.freqBtn, form?.frequency === 'monthly' && { borderColor: cfg.accent, backgroundColor: cfg.accent + '12' }]}
                  onPress={() => setForm((f: any) => ({ ...f, frequency: 'monthly' }))}>
                  <Text allowFontScaling={false} style={[styles.freqText, form?.frequency === 'monthly' && { color: cfg.accent }]}>{t('Har oy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.freqBtn, form?.frequency === 'once' && { borderColor: cfg.accent, backgroundColor: cfg.accent + '12' }]}
                  onPress={() => setForm((f: any) => ({ ...f, frequency: 'once' }))}>
                  <Text allowFontScaling={false} style={[styles.freqText, form?.frequency === 'once' && { color: cfg.accent }]}>{t('Bir marta')}</Text>
                </TouchableOpacity>
              </View>

              {form?.frequency === 'monthly' ? (
                <>
                  <FieldLabel>{t('Oyning kuni (1–31)')}</FieldLabel>
                  <TextInput
                    allowFontScaling={false}
                    value={String(form?.day_of_month || '')}
                    onChangeText={t => setForm((f: any) => ({ ...f, day_of_month: t.replace(/\D/g, '').slice(0, 2) }))}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={rd.color.textTertiary}
                    style={styles.textInput}
                  />
                </>
              ) : (
                <View style={{ marginTop: rs(10) }}>
                  <DateField
                    label={t('Sana')}
                    value={form?.once_date || null}
                    onChange={d => setForm((f: any) => ({ ...f, once_date: d }))}
                    accent={cfg.accent}
                    minimumDate={new Date()}
                    placeholder={t('Sanani tanlang')}
                  />
                </View>
              )}

              <View style={styles.activeRow}>
                <Text allowFontScaling={false} style={styles.activeLabel}>{t('Faol')}</Text>
                <Switch
                  value={!!form?.is_active}
                  onValueChange={v => setForm((f: any) => ({ ...f, is_active: v }))}
                  trackColor={{ true: cfg.accent, false: rd.color.border }}
                  thumbColor="#fff"
                />
              </View>

            </ScrollView>
            {/* So'rov N10/N12: tugmalar ScrollView TASHQARISIда (doim ko'rinadi, kesilmaydi). */}
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setForm(null)}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: cfg.accent }, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
                <Text allowFontScaling={false} style={styles.saveText}>{t('Saqlash')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── O'chirish tasdig'i ── */}
      <Modal visible={!!delTarget} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setDelTarget(null)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.sheetTitle}>{t('O‘chirish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>
              "{delTarget?.title}" yozuvini o‘chirasizmi?
            </Text>
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDelTarget(null)}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: RED }]} onPress={doDelete}>
                <Text allowFontScaling={false} style={styles.saveText}>{t('O‘chirish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SS13/SS14: Batafsil modal (sayt kabi) — kartaga bosilganda. */}
      <Modal visible={!!detail} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setDetail(null)}>
        <TouchableOpacity activeOpacity={1} style={styles.confirmBackdrop} onPress={() => setDetail(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.confirmCard} onPress={() => {}}>
            <View style={styles.detailHead}>
              <View style={[styles.emojiWrap, { backgroundColor: cfg.accent + '14' }]}>
                <Text style={styles.emoji}>{typeDef(detail?.[cfg.typeField]).emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={styles.detailName} numberOfLines={2}>{detail?.title}</Text>
                <Text allowFontScaling={false} style={[styles.detailAmt, { color: cfg.accent }]}>{fMoney(detail?.amount, detail?.currency)}</Text>
              </View>
            </View>
            <View style={styles.detailRows}>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>{t('Kategoriya')}</Text><Text style={styles.detailValue}>{typeDef(detail?.[cfg.typeField]).label}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>{t('Takrorlanish')}</Text><Text style={styles.detailValue}>{detail?.frequency === 'once' ? 'Bir marta' : `Har oyning ${detail?.day_of_month}-kuni`}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>{cfg.kind === 'payment' ? 'Keyingi to‘lov' : 'Keyingi daromad'}</Text><Text style={styles.detailValue}>{detail?.next_date ? fDate(detail.next_date) : '—'}</Text></View>
              {(detail?.last_paid_date || detail?.last_received_date) ? (
                <View style={styles.detailRow}><Text style={styles.detailLabel}>{t('Oxirgi')}</Text><Text style={styles.detailValue}>{fDate(detail?.last_paid_date || detail?.last_received_date)}</Text></View>
              ) : null}
              <View style={styles.detailRow}><Text style={styles.detailLabel}>{t('Holat')}</Text><Text style={[styles.detailValue, { color: (detail?.is_active !== false && detail?.is_active !== 0) ? GREEN : rd.color.textTertiary }]}>{(detail?.is_active !== false && detail?.is_active !== 0) ? 'Faol' : 'Nofaol'}</Text></View>
            </View>

            {/* So'rov: amalga oshirilgan to'lovlar / olingan daromadlar tarixi. */}
            <View style={styles.detailHistory}>
              <Text allowFontScaling={false} style={styles.detailHistTitle}>
                {cfg.kind === 'payment' ? 'Amalga oshirilgan to‘lovlar' : 'Olingan daromadlar'}
              </Text>
              {historyLoading ? (
                <Text allowFontScaling={false} style={styles.detailHistEmpty}>{t('Yuklanmoqda…')}</Text>
              ) : history.length === 0 ? (
                <Text allowFontScaling={false} style={styles.detailHistEmpty}>{t('Hozircha yo‘q')}</Text>
              ) : (
                <ScrollView style={{ maxHeight: rs(150) }} showsVerticalScrollIndicator={false}>
                  {history.map((h, i) => (
                    <View key={h.id ?? i} style={styles.detailHistRow}>
                      <Text allowFontScaling={false} style={styles.detailHistDate}>
                        {fDate(h.expense_date || h.income_date || h.date)}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.detailHistAmt, { color: cfg.kind === 'payment' ? cfg.accent : GREEN }]}>
                        {cfg.kind === 'payment' ? '−' : '+'}{fMoney(h.amount, h.currency)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <TouchableOpacity style={[styles.detailCloseBtn, { backgroundColor: cfg.accent }]} onPress={() => setDetail(null)}>
              <Text allowFontScaling={false} style={styles.detailCloseText}>{t('Yopish')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ── Ekranlar ──
export const FinanceScheduledPayments = () => (
  <ScheduledList
    cfg={{
      kind: 'payment',
      title: 'Rejalashtirilgan to‘lovlar',
      // SS13: yana ochiqroq qizil (ef4444 hali to'q edi → f26464).
      accent: '#f26464',
      types: PAYMENT_TYPES,
      typeField: 'payment_type',
      confirmLabel: 'To‘landi',
      listUrl: `${URL}/finance/scheduled-payments`,
      api: {
        create: financeApi.createScheduledPayment,
        update: financeApi.updateScheduledPayment,
        del: financeApi.deleteScheduledPayment,
        confirm: financeApi.confirmScheduledPayment,
        skip: financeApi.skipScheduledPayment,
        history: financeApi.scheduledPaymentHistory,
      },
    }}
  />
);

export const FinanceScheduledIncomes = () => (
  <ScheduledList
    cfg={{
      kind: 'income',
      title: 'Kutilayotgan daromadlar',
      accent: '#16a34a',
      types: INCOME_TYPES,
      typeField: 'income_type',
      confirmLabel: 'Olindi',
      listUrl: `${URL}/finance/scheduled-incomes`,
      api: {
        create: financeApi.createScheduledIncome,
        update: financeApi.updateScheduledIncome,
        del: financeApi.deleteScheduledIncome,
        confirm: financeApi.confirmScheduledIncome,
        skip: financeApi.skipScheduledIncome,
        history: financeApi.scheduledIncomeHistory,
      },
    }}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    height: rs(48),
    borderRadius: rd.radius.md,
    marginBottom: rs(14),
  },
  addBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },

  empty: { alignItems: 'center', paddingVertical: rs(50) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textTertiary, textAlign: 'center', paddingHorizontal: rs(30) },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  emojiWrap: { width: rs(42), height: rs(42), borderRadius: rs(21), alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: rs(20) },
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  cardSched: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  cardAmt: { fontFamily: rd.font.bold, fontSize: rs(14.5) },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2), marginTop: rs(4) },
  badgeOn: { backgroundColor: GREEN + '18' },
  badgeOff: { backgroundColor: rd.color.surfaceAlt },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  nextDate: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(10) },

  actions: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(12) },
  actBtn: { flex: 1, height: rs(38), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  actBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: '#fff' },
  actGhost: {
    height: rs(38),
    paddingHorizontal: rs(12),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actGhostText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  // Qalam (tahrir) ikonka-tugmasi — actDel'ga o'xshash, neytral fon.
  actIcon: {
    width: rs(40),
    height: rs(38),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actDel: {
    width: rs(40),
    height: rs(38),
    borderRadius: rd.radius.md,
    backgroundColor: RED + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sheet modal
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: rd.color.page,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    paddingHorizontal: rs(18),
    paddingTop: rs(18),
    paddingBottom: rs(24),
    maxHeight: '90%',
  },
  sheetTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(4) },
  textInput: {
    height: rs(50),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(14),
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  typeChip: {
    alignItems: 'center',
    gap: rs(3),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    backgroundColor: rd.color.surface,
    minWidth: rs(64),
  },
  typeEmoji: { fontSize: rs(18) },
  typeLabel: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary },

  freqRow: { flexDirection: 'row', gap: rs(10) },
  freqBtn: {
    flex: 1,
    height: rs(44),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surface,
  },
  freqText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.textSecondary },

  activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(16) },
  activeLabel: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  sheetBtns: { flexDirection: 'row', gap: rs(12), marginTop: rs(20) },
  cancelBtn: {
    flex: 1,
    height: rs(50),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  saveBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },

  confirmBackdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  confirmCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rd.radius.xxl, padding: rs(20) },
  // SS13/SS14: Batafsil modal
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: rs(14) },
  detailName: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  detailAmt: { fontFamily: rd.font.bold, fontSize: rs(18), marginTop: rs(2) },
  detailRows: { gap: rs(2) },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: rs(12), paddingVertical: rs(9), borderTopWidth: 1, borderTopColor: rd.color.border },
  detailLabel: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textTertiary },
  detailValue: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text, textAlign: 'right' },
  // So'rov: batafsilдаги tarix bo'limi.
  detailHistory: { marginTop: rs(14), borderTopWidth: 1, borderTopColor: rd.color.border, paddingTop: rs(10) },
  detailHistTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text, marginBottom: rs(6) },
  detailHistEmpty: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textTertiary, paddingVertical: rs(4) },
  detailHistRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(6), borderBottomWidth: 1, borderBottomColor: rd.color.border },
  detailHistDate: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  detailHistAmt: { fontFamily: rd.font.bold, fontSize: rs(13) },
  detailCloseBtn: { height: rs(48), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center', marginTop: rs(18) },
  detailCloseText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
  confirmText: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, lineHeight: rs(20), marginTop: rs(6) },
});

export default ScheduledList;
