/**
 * FinanceGap.tsx — Gap (ROSCA / "qora kassa") ro'yxati (web pages/finance/gap/index.vue).
 * Gap kartalari (nomi, summa, davriylik, a'zolar soni, status) + yaratish modal.
 * Bosilса -> FinanceGapDetail. Backend: GET /finance/gap, POST /finance/gap.
 */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { financeApi } from './financeApi';
import { AmountField, CurrencyToggle, DateField, FieldLabel } from './financeForm';
import { fDate, fMoney, num } from './financeMoney';
import { PlusIcon } from '../redesign/icons';

const TEAL = '#0d9488';

const FREQ = [
  { key: 'monthly', label: 'Har oy' },
  { key: '15days', label: '15 kunda' },
  { key: '10days', label: '10 kunda' },
];
const freqLabel = (f?: string) => FREQ.find(x => x.key === f)?.label || 'Har oy';

const statusMeta = (s?: string) => {
  switch (s) {
    case 'active': return { label: 'Faol', color: '#16a34a' };
    case 'completed': return { label: 'Tugallangan', color: rd.color.textTertiary };
    default: return { label: 'Qoralama', color: '#f59e0b' };
  }
};

const FinanceGap = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const listFetch = useFetch({ url: `${URL}/finance/gap`, method: 'GET' });
  const refresh = listFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) { firstFocus.current = false; return; }
      refresh({});
    }, [refresh]),
  );

  const allGaps: any[] = (listFetch.data as any)?.data || [];
  // SS10: status filtri (Faol / Tugallangan / Barchasi) — Maqsadlar kabi.
  const [filter, setFilter] = React.useState<'active' | 'completed' | 'all'>('active');
  const gaps = allGaps.filter(g =>
    filter === 'all' ? true : filter === 'active' ? g.status !== 'completed' : g.status === 'completed',
  );
  const [modal, setModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [freq, setFreq] = React.useState('monthly');
  const [day, setDay] = React.useState('1');
  const [dayErr, setDayErr] = React.useState(''); // SS9: modal ichida KO'RINADIGAN xato
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState<'UZS' | 'USD'>('UZS');
  const [startDate, setStartDate] = React.useState<Date | null>(null); // SS2: o'tgan sanadan boshlash
  const [saving, setSaving] = React.useState(false);

  const close = () => { setModal(false); setName(''); setFreq('monthly'); setDay('1'); setDayErr(''); setAmount(''); setStartDate(null); };

  const submit = async () => {
    if (saving) return;
    if (!name.trim()) { Toast.show({ type: 'error2', props: { desc: 'Gap nomini kiriting' } }); return; }
    // SS9: ilgari xato Toast MODAL ORQASIDA chiqib ko'rinmasdi. Endi kun-maydoni
    // OSTIDA inline qizil xato ko'rsatamiz (modal ichida, aniq ko'rinadi).
    const dayNum = num(day);
    if (freq === 'monthly' && (!dayNum || dayNum < 1 || dayNum > 31)) {
      setDayErr('Oyning kuni 1-31 orasida bo‘lishi kerak');
      return;
    }
    setDayErr('');
    try {
      setSaving(true);
      const pad = (n: number) => String(n).padStart(2, '0');
      const res = await financeApi.createGap({
        name: name.trim(),
        frequency: freq,
        day_of_month: dayNum,
        amount: num(amount) || 0,
        currency,
        // SS2: boshlanish sanasi (o'tgan sanadan boshlangan gap ham); bo'sh — bugundan
        start_date: startDate ? `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}` : undefined,
      });
      const id = res.data?.data?.id;
      close();
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Gap yaratildi' } });
      if (id) navigation.navigate('FinanceGapDetail', { id });
    } catch (e: any) {
      // So'rov SS9.1: backend xatosi foydalanuvchiga KO'RINSIN (jim qolmasin).
      const msg = e?.response?.data?.message || e?.response?.data?.msg || 'Xatolik yuz berdi';
      Toast.show({ type: 'error2', visibilityTime: 4000, props: { desc: String(msg) } });
    } finally {
      setSaving(false);
    }
  };

  // SS13.2: "Yangi Gap" endi SARLAVHADAGI "+" tugmasi (Maqsadlar bo'limi kabi).
  const addBtn = (
    <TouchableOpacity onPress={() => setModal(true)} style={styles.headerAdd} activeOpacity={0.85}>
      <PlusIcon size={rs(18)} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS13.1: orqaga tugmasi Gap bo'limi rangida (teal). */}
      <RdHeader title={t('Gap (Чёрная касса)')} right={addBtn} backColor={TEAL} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SS10: Faol / Tugallangan / Barchasi filtr tablari (Maqsadlar kabi). */}
        <View style={styles.filterTabs}>
          {([['active', 'Faol'], ['completed', 'Tugallangan'], ['all', 'Barchasi']] as const).map(([k, lbl]) => {
            const on = filter === k;
            return (
              <TouchableOpacity
                key={k}
                activeOpacity={0.85}
                onPress={() => setFilter(k)}
                style={[styles.filterTab, on && styles.filterTabOn]}>
                <Text allowFontScaling={false} style={[styles.filterTabText, on && styles.filterTabTextOn]}>{t(lbl)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {gaps.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>{t('Gap yo‘q. "Yangi gap" orqali oching.')}</Text></View>
        ) : (
          gaps.map((g, i) => {
            const sm = statusMeta(g.status);
            return (
              <TouchableOpacity key={g.id ?? i} style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('FinanceGapDetail', { id: g.id })}>
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}><Text style={styles.icon}>💰</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{g.name}</Text>
                    <Text allowFontScaling={false} style={styles.sub}>
                      {t(freqLabel(g.frequency))} · {num(g.member_count)} {t('a‘zo')}{g.is_organizer ? ' · 👑' : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {num(g.amount) > 0 && (
                      <Text allowFontScaling={false} style={styles.amt} numberOfLines={1}>{fMoney(g.amount, g.currency)}</Text>
                    )}
                    <View style={[styles.badge, { backgroundColor: sm.color + '18' }]}>
                      <Text style={[styles.badgeText, { color: sm.color }]}>{t(sm.label)}</Text>
                    </View>
                  </View>
                </View>
                {g.next_due ? (() => {
                  // SS10: keyingi davra sanasi o'tган bo'lsa — "Muddati o'tgan" (qizil).
                  const overdue = new Date(g.next_due).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
                  return (
                    <Text allowFontScaling={false} style={[styles.next, overdue && styles.nextOverdue]}>
                      {overdue ? t('Muddati o‘tgan davra:') : t('Keyingi davra:')} {fDate(g.next_due)}
                    </Text>
                  );
                })() : null}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: rs(20) }} />
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
        <View style={styles.sheetBackdrop}>
          {/* SS9: tashqariga (modal ustidagi bo'sh joyga) bosilса yopiladi. */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
          <View style={styles.sheet}>
            {/* So'rov N6: kontent ScrollView'да, tugmalar sticky — hammasi sig'adi. */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Yangi Gap (Чёрная касса)')}</Text>
              <FieldLabel>{t('Nomi')}</FieldLabel>
              <TextInput allowFontScaling={false} value={name} onChangeText={setName} placeholder={t('Masalan: Ish jamoasi')} placeholderTextColor={rd.color.textTertiary} style={styles.input} />

              <FieldLabel>{t('Davriylik')}</FieldLabel>
              <View style={styles.freqRow}>
                {FREQ.map(f => {
                  const on = freq === f.key;
                  return (
                    <TouchableOpacity key={f.key} style={[styles.freqBtn, on && { borderColor: TEAL, backgroundColor: TEAL + '12' }]} onPress={() => setFreq(f.key)}>
                      <Text allowFontScaling={false} style={[styles.freqText, on && { color: TEAL }]}>{t(f.label)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {freq === 'monthly' && (
                <>
                  <FieldLabel>{t('Oyning kuni (1–31)')}</FieldLabel>
                  <TextInput allowFontScaling={false} value={day} onChangeText={t => { setDay(t.replace(/\D/g, '').slice(0, 2)); if (dayErr) setDayErr(''); }} keyboardType="numeric" placeholder="1" placeholderTextColor={rd.color.textTertiary} style={[styles.input, !!dayErr && styles.inputErr]} />
                  {!!dayErr && <Text allowFontScaling={false} style={styles.errText}>{dayErr}</Text>}
                </>
              )}

              <FieldLabel>{t('Valyuta')}</FieldLabel>
              <CurrencyToggle value={currency} onChange={setCurrency} accent={TEAL} />
              <FieldLabel>{t('Har a‘zo summasi (ixtiyoriy)')}</FieldLabel>
              <AmountField value={amount} onChange={setAmount} currency={currency} />
              {/* SS2: boshlanish sanasi — o'tgan sanadan boshlangan gapni ham kiritish */}
              <View style={{ height: rs(6) }} />
              <DateField value={startDate} onChange={setStartDate} label={t('Boshlanish sanasi (ixtiyoriy)')} accent={TEAL} placeholder={t('Bo\'sh bo\'lsa — bugundan boshlanadi')} />
            </ScrollView>

            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={close}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}><Text style={styles.saveText}>{t('Yaratish')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FinanceGap;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), height: rs(48), borderRadius: rd.radius.md, backgroundColor: TEAL, marginBottom: rs(14) },
  addBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },
  // SS13.2: sarlavhadagi "+" tugmasi (Maqsadlar kabi)
  headerAdd: { width: rs(38), height: rs(38), borderRadius: rs(19), backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: rs(50) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textTertiary, textAlign: 'center', paddingHorizontal: rs(30) },

  card: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginBottom: rs(12) },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  iconWrap: { width: rs(44), height: rs(44), borderRadius: rs(22), backgroundColor: TEAL + '14', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: rs(20) },
  name: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  sub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  amt: { fontFamily: rd.font.bold, fontSize: rs(14), color: TEAL },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2), marginTop: rs(4) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  next: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(10) },
  nextOverdue: { color: rd.color.error, fontFamily: rd.font.semibold },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: rd.color.page, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24), paddingHorizontal: rs(18), paddingTop: rs(18), paddingBottom: rs(24), maxHeight: '90%' },
  sheetTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  input: { height: rs(50), borderRadius: rs(14), borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.surface, paddingHorizontal: rs(14), fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  inputErr: { borderColor: rd.color.error },
  errText: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.error, marginTop: rs(5) },
  // SS10: status filtr tablari
  filterTabs: { flexDirection: 'row', gap: rs(8), marginBottom: rs(12) },
  filterTab: { flex: 1, height: rs(38), borderRadius: rd.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: rd.color.surface, borderWidth: 1, borderColor: rd.color.border },
  filterTabOn: { backgroundColor: TEAL, borderColor: TEAL },
  filterTabText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  filterTabTextOn: { color: '#fff' },
  freqRow: { flexDirection: 'row', gap: rs(8) },
  freqBtn: { flex: 1, height: rs(42), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center', backgroundColor: rd.color.surface },
  freqText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  sheetBtns: { flexDirection: 'row', gap: rs(12), marginTop: rs(20) },
  cancelBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: rd.color.surfaceAlt, borderWidth: 1, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  saveBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
