/**
 * DebtPlan.tsx — "Qarzdan chiqish" asosiy paneli (egasi hujjati, "Ekranlar" 2–3).
 *
 * Katta raqamlar: qarzsiz bo'lish sanasi (+ Monte-Karlo 90%), jami qarz, shu oy to'lov,
 * "Bugun xavfsiz sarflash mumkin" (GET /finance/debt-plan/daily-limit); qoplash
 * ogohlantirishi va yetishmovchilik hodisalari; qoldiq grafigi; "Shu oy to'lovlari"
 * ("To'ladim" → POST /finance/debts/:id/payments); to'lash tartibi (sabab matni bilan).
 * Sozlash tugamagan bo'lsa → DebtPlanSetup. Pull-to-refresh + fokusda yangilash.
 */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import Loading from '../../../components/Loading';
import RdHeader from '../../redesign/RdHeader';
import { BarChartIcon, CoinsIcon, PencilIcon, ShieldIcon, WalletIcon } from '../../redesign/icons';
import { fCompact } from '../financeMoney';
import {
  currentYm,
  DailyLimit,
  debtPlanApi,
  isNewDebtKey,
  MonthPayment,
  PlanBundle,
  PlanDebt,
  PlanResult,
  progressPct,
} from './debtPlanApi';
import { Card, DP, ErrorBox, GhostButton, HelpBox, SectionTitle } from './debtPlanUi';
import { debtsByKey, debtTitleOf, fDateLimit, fUzs, strategyLabel } from './debtPlanText';
import DebtPlanChart, { chartPointsOf } from './DebtPlanChart';
import DebtPlanPayModal from './DebtPlanPayModal';
import { CoverageCard, MonthPayments, OrderList, PlanHero } from './DebtPlanSections';

/** Shu oy to'lovlari: /month endpoint; bo'sh/xato bo'lsa — reja jadvalining joriy oyi. */
const monthFromSchedule = (r: PlanResult | null, debts: PlanDebt[], ym: string): MonthPayment[] => {
  if (!r) return [];
  const m = r.schedule.find(x => x.ym === ym) || r.schedule[0];
  if (!m) return [];
  const byKey = debtsByKey(debts);
  return m.payments.map(p => ({
    ...p,
    title: debtTitleOf(p.debtId, byKey),
    currency: byKey[p.debtId]?.currency || null,
    amountOrig: null,
    paid: false,
    isNewDebt: isNewDebtKey(p.debtId),
  }));
};

const StatTile = ({
  Icon,
  label,
  value,
  sub,
  color,
}: {
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) => (
  <View style={styles.tile}>
    <View style={[styles.tileIcon, { backgroundColor: color + '16' }]}>
      <Icon size={rs(17)} color={color} />
    </View>
    <Text allowFontScaling={false} style={styles.tileLabel} numberOfLines={1}>
      {label}
    </Text>
    <Text allowFontScaling={false} style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    {sub ? (
      <Text allowFontScaling={false} style={styles.tileSub} numberOfLines={1}>
        {sub}
      </Text>
    ) : null}
  </View>
);

const DebtPlan = () => {
  const navigation = useNavigation<any>();
  const [bundle, setBundle] = React.useState<PlanBundle | null>(null);
  const [limit, setLimit] = React.useState<DailyLimit | null>(null);
  const [month, setMonth] = React.useState<MonthPayment[] | null>(null);
  const [error, setError] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [paidIds, setPaidIds] = React.useState<Set<string>>(new Set());
  const [payTarget, setPayTarget] = React.useState<{ debt: PlanDebt; amount: number; orig: number | null } | null>(null);
  const ym = currentYm();

  const load = React.useCallback(async () => {
    const [b, l, m] = await Promise.allSettled([debtPlanApi.get(), debtPlanApi.dailyLimit(), debtPlanApi.month(ym)]);
    if (b.status === 'rejected') {
      setError(true);
      return;
    }
    if (!b.value.setupDone) {
      navigation.replace('DebtPlanSetup', { first: true });
      return;
    }
    setError(false);
    setBundle(b.value);
    setLimit(l.status === 'fulfilled' ? l.value : null);
    setMonth(m.status === 'fulfilled' ? m.value : null);
  }, [navigation, ym]);

  // Fokusda (birinchi ochilish ham) yangilanadi: to'lov/sozlash/qarz qo'shishdan qaytganda.
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const header = (
    <RdHeader
      title={t('Qarzdan chiqish')}
      right={
        bundle ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('DebtPlanSetup', { mode: 'edit' })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('Reja sozlamalari')}
            style={styles.headerBtn}>
            <PencilIcon size={rs(18)} color={rd.color.text} />
          </TouchableOpacity>
        ) : undefined
      }
    />
  );

  if (!bundle) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        {header}
        {error ? <ErrorBox onRetry={() => { setError(false); load(); }} /> : <Loading />}
      </View>
    );
  }

  const r = bundle.result;
  const debts = bundle.debts;
  const debtsById = debtsByKey(debts);
  const titleOf = (id: string | null) => debtTitleOf(id, debtsById);
  const monthItems = month && month.length > 0 ? month : monthFromSchedule(r, debts, ym);
  const monthTotal = monthItems.reduce((s, p) => s + p.amount, 0) || r?.totals.monthlyRequired || 0;
  const progress = progressPct(debts, bundle.fxUsd);
  const points = chartPointsOf(r);
  const activeDebts = debts.filter(d => !d.excluded && d.balance > 0);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {header}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DP.accent} colors={[DP.accent]} />
        }>
        {activeDebts.length === 0 ? (
          <HelpBox
            title={t('Qarzlar yo‘q')}
            text={t('Rejaga “Shaxsiy qarz”dagi olingan qarzlar kiradi. Qarz qo‘shsangiz, reja shu yerda paydo bo‘ladi.')}
          />
        ) : null}

        <PlanHero bundle={bundle} progress={progress} />

        <View style={styles.tiles}>
          <StatTile
            Icon={WalletIcon}
            label={t('Jami qarz')}
            value={fCompact(r?.totals.totalDebt ?? 0, 'UZS')}
            sub={t('{{n}} ta qarz', { n: activeDebts.length })}
            color={rd.color.error}
          />
          <StatTile
            Icon={CoinsIcon}
            label={t('Shu oy to‘lov')}
            value={fCompact(monthTotal, 'UZS')}
            sub={strategyLabel(bundle.settings.strategy)}
            color={rd.color.primary}
          />
        </View>

        <View style={styles.safeCard}>
          <View style={styles.safeHead}>
            <ShieldIcon size={rs(18)} color={DP.accent} />
            <Text allowFontScaling={false} style={styles.safeLabel}>
              {t('Bugun xavfsiz sarflash mumkin')}
            </Text>
          </View>
          <Text allowFontScaling={false} style={styles.safeValue} numberOfLines={1} adjustsFontSizeToFit>
            {limit ? fUzs(Math.max(0, limit.amount)) : '—'}
          </Text>
          <Text style={styles.safeSub}>
            {limit?.until
              ? t('{{date}} gacha kunlik limit. Bugun kam sarflasangiz, ertangi limit oshadi.', { date: fDateLimit(limit.until) })
              : t('Keyingi daromadgacha kunlik limit. Bugun kam sarflasangiz, ertangi limit oshadi.')}
          </Text>
          {limit?.explanation ? <Text style={styles.safeExpl}>{limit.explanation}</Text> : null}
        </View>

        <CoverageCard bundle={bundle} titleOf={titleOf} />

        {points.length > 1 ? (
          <>
            <SectionTitle text={t('Qoldiq grafigi')} />
            <Card>
              <DebtPlanChart points={points} />
            </Card>
          </>
        ) : null}

        <SectionTitle text={t('Shu oy to‘lovlari')} color={rd.color.primary} />
        <MonthPayments
          items={monthItems}
          debtsById={debtsById}
          paidIds={paidIds}
          onPay={p => {
            const d = debtsById[p.debtId];
            if (d) setPayTarget({ debt: d, amount: p.amount, orig: p.amountOrig });
          }}
        />

        <View style={styles.actions}>
          <GhostButton
            label={t('Usullarni solishtirish')}
            Icon={BarChartIcon}
            onPress={() => navigation.navigate('DebtPlanCompare')}
            style={{ flex: 1 }}
          />
          <GhostButton
            label={t('“Agar” kalkulyatori')}
            Icon={CoinsIcon}
            color={rd.color.primary}
            onPress={() => navigation.navigate('DebtPlanCalculator')}
            style={{ flex: 1 }}
          />
        </View>

        {r && r.order.length > 0 ? (
          <>
            <SectionTitle text={t('To‘lash tartibi')} color="#7c3aed" />
            <OrderList
              order={r.order}
              debts={debts}
              closed={r.scenarios.base?.closed || {}}
              onOpen={id => navigation.navigate('DebtPlanDebt', { debtId: Number(id) })}
            />
          </>
        ) : null}

        <HelpBox
          text={t('Rejaga “Shaxsiy qarz”dagi olingan qarzlar kiradi. Qarz shartnomalari, do‘kon nasiyalari va ko‘zgu qarzlar keyingi bosqichda qo‘shiladi.')}
        />
      </ScrollView>

      <DebtPlanPayModal
        debt={payTarget?.debt || null}
        suggestedUzs={payTarget?.amount ?? null}
        suggestedOrig={payTarget?.orig ?? null}
        fxUsd={bundle.fxUsd}
        onClose={() => setPayTarget(null)}
        onDone={id => {
          setPayTarget(null);
          setPaidIds(prev => new Set(prev).add(String(id)));
          load();
        }}
      />
    </View>
  );
};

export default DebtPlan;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(32) },
  headerBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: { flexDirection: 'row', gap: rs(10), marginBottom: rs(10) },
  tile: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(13),
  },
  tileIcon: { width: rs(32), height: rs(32), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(10) },
  tileValue: { fontFamily: rd.font.bold, fontSize: rs(19), color: rd.color.text, marginTop: rs(3) },
  tileSub: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2) },
  safeCard: {
    backgroundColor: DP.tint,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: DP.accent + '33',
    padding: rs(14),
    marginBottom: rs(12),
  },
  safeHead: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  safeLabel: { fontFamily: rd.font.semibold, fontSize: rs(13), color: DP.accentStrong },
  safeValue: { fontFamily: rd.font.bold, fontSize: rs(26), color: rd.color.text, marginTop: rs(6) },
  safeSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(4), lineHeight: rs(17) },
  safeExpl: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(6), lineHeight: rs(16) },
  actions: { flexDirection: 'row', gap: rs(10), marginBottom: rs(8) },
});
