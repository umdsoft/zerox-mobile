/**
 * DebtPlanDebt.tsx — "Qarzdan chiqish" ichida bitta qarz tafsiloti.
 * Navbat va sabab, qoldiq/progress, kelgusi to'lovlar jadvali (schedule, asosiy stsenariy),
 * reja maydonlarini tahrirlash (PATCH /finance/debts/:id/plan) + rejadan chiqarish +
 * qo'lda navbat (plan_priority), to'lovlar tarixi (GET /finance/debts/:id), "To'ladim".
 * Params: { debtId }.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import Loading from '../../../components/Loading';
import RdHeader from '../../redesign/RdHeader';
import { CheckIcon, ChevronRight } from '../../redesign/icons';
import { fCompact, fDate, fMoney, num } from '../financeMoney';
import { apiErrorText, currentYm, debtPlanApi, paymentBelowInterest, PlanBundle, PlanDebt } from './debtPlanApi';
import { Badge, Card, DP, ErrorBox, HelpBox, PrimaryButton, ProgressBar, SectionTitle, Stepper } from './debtPlanUi';
import { fmtYm, fUzs, kindLabel, paymentTypeMeta, reasonText } from './debtPlanText';
import DebtPlanFields from './DebtPlanFields';
import DebtPlanPayModal from './DebtPlanPayModal';

const SCHEDULE_PREVIEW = 6;

type Payment = { id: any; amount: number; date: string; notes: string };

const paymentsOf = (raw: any): Payment[] =>
  (Array.isArray(raw?.payments) ? raw.payments : [])
    .filter((p: any) => !/^__(increase|forgive)__/.test(String(p?.notes || '')))
    .map((p: any) => ({ id: p.id, amount: num(p.amount), date: String(p.payment_date || p.created_at || ''), notes: String(p.notes || '') }))
    .sort((a: Payment, b: Payment) => new Date(b.date).getTime() - new Date(a.date).getTime());

const DebtPlanDebt = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const debtId = Number(route?.params?.debtId);

  const [bundle, setBundle] = React.useState<PlanBundle | null>(null);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [edit, setEdit] = React.useState<PlanDebt | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [origAmount, setOrigAmount] = React.useState(0); // boshlang'ich summa (GET /debts/:id)
  // Fokusda qayta yuklanganda foydalanuvchining saqlanmagan tahrirlari ustiga yozilmasin.
  const dirtyRef = React.useRef(false);
  dirtyRef.current = dirty;

  const load = React.useCallback(async () => {
    const [b, d] = await Promise.allSettled([debtPlanApi.get(), debtPlanApi.getDebt(debtId)]);
    if (b.status === 'rejected') {
      setError(true);
      return;
    }
    setError(false);
    setBundle(b.value);
    setPayments(d.status === 'fulfilled' ? paymentsOf(d.value) : []);
    setOrigAmount(d.status === 'fulfilled' ? num(d.value?.amount) : 0);
    const fresh = b.value.debts.find(x => x.id === debtId) || null;
    setEdit(prev => (prev && dirtyRef.current ? prev : fresh));
  }, [debtId]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  if (!bundle || !edit) {
    return (
      <View style={styles.screen}>
        <RdHeader title={t('Qarz rejasi')} />
        {error || (bundle && !edit) ? (
          <ErrorBox onRetry={() => { setError(false); load(); }} />
        ) : (
          <Loading />
        )}
      </View>
    );
  }

  const debt = bundle.debts.find(x => x.id === debtId) || edit;
  const r = bundle.result;
  const rank = r ? r.order.findIndex(o => o.debtId === String(debtId)) : -1;
  const order = rank >= 0 && r ? r.order[rank] : null;
  const closeYm = r?.scenarios.base?.closed?.[String(debtId)] || null;
  const startAmount = debt.amount || origAmount;
  const pct = startAmount > 0 ? Math.max(0, Math.round(((startAmount - debt.balance) / startAmount) * 100)) : 0;
  const rows = (r?.schedule || []).flatMap(m =>
    m.payments.filter(p => p.debtId === String(debtId)).map(p => ({ ...p, ym: m.ym })),
  );
  const visibleRows = showAll ? rows : rows.slice(0, SCHEDULE_PREVIEW);
  const ym = currentYm();
  const thisMonth = rows.filter(p => p.ym === ym && p.type !== 'saving').reduce((s, p) => s + p.amount, 0);
  const isManual = bundle.settings.strategy === 'manual';
  const closed = debt.balance <= 0 || debt.status === 'completed';

  const change = (d: PlanDebt) => {
    setEdit(d);
    setDirty(true);
  };

  const save = async () => {
    if (saving) return;
    if (!edit.kind) {
      Toast.show({ type: 'error2', props: { desc: t('Qarz turini tanlang') } });
      return;
    }
    if (paymentBelowInterest(edit)) {
      Toast.show({ type: 'error2', props: { desc: t('To‘lov foizni ham qoplamaydi') } });
      return;
    }
    try {
      setSaving(true);
      await debtPlanApi.patchDebt(debtId, edit);
      setDirty(false);
      dirtyRef.current = false;
      Toast.show({ type: 'omad', props: { desc: t('Saqlandi. Reja qayta hisoblandi.') } });
      load();
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: apiErrorText(e) || t('Xatolik yuz berdi') } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={debt.title} subtitle={t('Qarz rejasi')} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.kind}>
                {kindLabel(debt.kind)}
              </Text>
              <Text allowFontScaling={false} style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
                {fMoney(debt.balance, debt.currency)}
              </Text>
            </View>
            {closed ? (
              <Badge text={t('Yopildi')} color={DP.accentStrong} bg={DP.tint} />
            ) : debt.excluded ? (
              <Badge text={t('Rejadan tashqari')} color={rd.color.textSecondary} bg={rd.color.surfaceAlt} />
            ) : rank >= 0 ? (
              <Badge text={t('{{n}}-navbat', { n: rank + 1 })} color={DP.accentStrong} bg={DP.tint} />
            ) : null}
          </View>
          <View style={{ marginTop: rs(12) }}>
            <ProgressBar pct={pct} />
          </View>
          <View style={styles.progressRow}>
            <Text allowFontScaling={false} style={styles.small}>
              {t('{{p}}% to‘landi', { p: pct })}
            </Text>
            <Text allowFontScaling={false} style={[styles.small, { color: DP.accentStrong }]}>
              {closeYm ? t('Yopiladi: {{date}}', { date: fmtYm(closeYm) }) : ''}
            </Text>
          </View>
          {order ? <Text style={styles.reason}>{reasonText(order, rank + 1)}</Text> : null}
          {!closed && !debt.excluded ? (
            <PrimaryButton label={t('To‘ladim')} onPress={() => setPayOpen(true)} style={{ marginTop: rs(14) }} />
          ) : null}
        </Card>

        {rows.length > 0 ? (
          <>
            <SectionTitle text={t('Kelgusi to‘lovlar')} color={rd.color.primary} />
            <Card style={{ paddingVertical: rs(4) }}>
              {visibleRows.map((p, i) => {
                const meta = paymentTypeMeta(p.type);
                return (
                  <View key={`${p.ym}_${p.type}_${i}`} style={[styles.schedRow, i > 0 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text allowFontScaling={false} style={styles.schedDate}>
                        {fmtYm(p.ym)}
                        {p.day ? `, ${t('{{d}}-kuni', { d: p.day })}` : ''}
                      </Text>
                      <View style={{ marginTop: rs(4) }}>
                        <Badge text={t(meta.label)} color={meta.color} bg={meta.bg} />
                      </View>
                    </View>
                    <Text allowFontScaling={false} style={styles.schedAmount}>
                      {fUzs(p.amount)}
                    </Text>
                  </View>
                );
              })}
              {rows.length > SCHEDULE_PREVIEW ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowAll(v => !v)}
                  style={styles.moreBtn}
                  accessibilityRole="button">
                  <Text style={styles.moreText}>
                    {showAll ? t('Yig‘ish') : t('Barchasi ({{n}})', { n: rows.length })}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          </>
        ) : null}

        <SectionTitle text={t('Reja sozlamalari')} />
        <Card>
          <DebtPlanFields debt={edit} onChange={change} />

          <View style={styles.sep} />
          <Text style={styles.subTitle}>{t('Qo‘lda navbat')}</Text>
          <Text style={styles.small}>
            {isManual
              ? t('“O‘zim tanlayman” usulida kichik raqam oldin to‘lanadi.')
              : t('Faqat “O‘zim tanlayman” usulida ishlaydi. Usulni reja sozlamalarida o‘zgartirasiz.')}
          </Text>
          <View style={{ marginTop: rs(8) }}>
            <Stepper
              value={edit.priority || 0}
              min={0}
              max={99}
              onChange={v => change({ ...edit, priority: v || null })}
              format={v => (v ? t('{{n}}-o‘rin', { n: v }) : t('Belgilanmagan'))}
              label={t('Qo‘lda navbat')}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => change({ ...edit, excluded: !edit.excluded })}
            accessibilityRole="switch"
            accessibilityState={{ checked: edit.excluded }}
            style={styles.excludeRow}>
            <View style={[styles.checkbox, edit.excluded && styles.checkboxOn]}>
              {edit.excluded ? <CheckIcon size={rs(13)} color={rd.color.onPrimary} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.excludeText}>{t('Rejaga kiritmaslik')}</Text>
              <Text style={styles.small}>{t('Qarz ro‘yxatda qoladi, lekin rejada hisoblanmaydi.')}</Text>
            </View>
          </TouchableOpacity>

          <PrimaryButton label={t('Saqlash')} onPress={save} busy={saving} disabled={!dirty} style={{ marginTop: rs(16) }} />
        </Card>

        <SectionTitle text={t('To‘lovlar tarixi')} color="#7c3aed" />
        <Card style={{ paddingVertical: rs(4) }}>
          {payments.length === 0 ? (
            <Text style={styles.empty}>{t('Hali to‘lov yo‘q.')}</Text>
          ) : (
            payments.map((p, i) => (
              <View key={String(p.id ?? i)} style={[styles.schedRow, i > 0 && styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text allowFontScaling={false} style={styles.schedDate}>
                    {fDate(p.date)}
                  </Text>
                  {p.notes ? (
                    <Text style={styles.small} numberOfLines={1}>
                      {p.notes}
                    </Text>
                  ) : null}
                </View>
                <Text allowFontScaling={false} style={[styles.schedAmount, { color: DP.accentStrong }]}>
                  −{fCompact(p.amount, debt.currency)}
                </Text>
              </View>
            ))
          )}
        </Card>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('FinanceDebtDetail', { id: debtId })}
          style={styles.linkRow}
          accessibilityRole="link">
          <Text style={styles.linkText}>{t('“Shaxsiy qarz”da ochish')}</Text>
          <ChevronRight size={rs(16)} color={rd.color.primary} />
        </TouchableOpacity>

        {debt.excluded ? null : thisMonth > 0 ? null : (
          <HelpBox text={t('Bu oy shu qarz bo‘yicha rejada to‘lov yo‘q.')} />
        )}
      </ScrollView>

      <DebtPlanPayModal
        debt={payOpen ? debt : null}
        suggestedUzs={thisMonth > 0 ? thisMonth : null}
        fxUsd={bundle.fxUsd}
        onClose={() => setPayOpen(false)}
        onDone={() => {
          setPayOpen(false);
          load();
        }}
      />
    </View>
  );
};

export default DebtPlanDebt;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(32) },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10) },
  kind: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary },
  balance: { fontFamily: rd.font.bold, fontSize: rs(26), color: rd.color.text, marginTop: rs(4) },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rs(6) },
  small: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, lineHeight: rs(17) },
  reason: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
    marginTop: rs(12),
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.md,
    padding: rs(10),
  },
  schedRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), paddingVertical: rs(11) },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: rd.color.border },
  schedDate: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  schedAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  moreBtn: { alignItems: 'center', paddingVertical: rs(10), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: rd.color.border },
  moreText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: rd.color.border, marginVertical: rs(16) },
  subTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text, marginBottom: rs(4) },
  excludeRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(16) },
  checkbox: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(6),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: DP.danger, borderColor: DP.danger },
  excludeText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  empty: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary, textAlign: 'center', paddingVertical: rs(12) },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4), paddingVertical: rs(12) },
  linkText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.primary },
});
