/**
 * DebtPlanCompare.tsx — usullarni solishtirish: algoritm (optimal) / qor ko'chkisi /
 * o'zim tanlayman × 3 stsenariy (ehtiyotkor / asosiy / optimistik).
 * Har usul uchun POST /finance/debt-plan/simulate { strategy } (bazaga yozmaydi).
 * "Shu usulga o'tish" → PUT /finance/debt-plan (joriy sozlamalar + strategy).
 */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import Loading from '../../../components/Loading';
import RdHeader from '../../redesign/RdHeader';
import { fCompact } from '../financeMoney';
import {
  apiErrorText,
  buildPlanBody,
  debtPlanApi,
  PlanBundle,
  PlanResult,
  SCENARIOS,
  Strategy,
  STRATEGIES,
} from './debtPlanApi';
import { Badge, DP, ErrorBox, GhostButton, HelpBox } from './debtPlanUi';
import { debtsByKey, debtTitleOf, fmtYm, fmtYmShort, SCENARIO_META, STRATEGY_META } from './debtPlanText';

type Results = Partial<Record<Strategy, PlanResult | null>>;

const DebtPlanCompare = () => {
  const navigation = useNavigation<any>();
  const [bundle, setBundle] = React.useState<PlanBundle | null>(null);
  const [results, setResults] = React.useState<Results | null>(null);
  const [error, setError] = React.useState(false);
  const [switching, setSwitching] = React.useState<Strategy | null>(null);

  const load = React.useCallback(async () => {
    try {
      const b = await debtPlanApi.get();
      const sims = await Promise.allSettled(STRATEGIES.map(s => debtPlanApi.simulate({ strategy: s })));
      const out: Results = {};
      STRATEGIES.forEach((s, i) => {
        const r = sims[i];
        out[s] = r.status === 'fulfilled' ? r.value : null;
      });
      setBundle(b);
      setResults(out);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const switchTo = async (s: Strategy) => {
    if (!bundle || switching) return;
    try {
      setSwitching(s);
      await debtPlanApi.save(buildPlanBody({ ...bundle.settings, strategy: s }, bundle.incomes, true));
      Toast.show({ type: 'omad', props: { desc: t('Usul o‘zgartirildi. Reja qayta hisoblandi.') } });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: apiErrorText(e) || t('Xatolik yuz berdi') } });
    } finally {
      setSwitching(null);
    }
  };

  if (!bundle || !results) {
    return (
      <View style={styles.screen}>
        <RdHeader title={t('Usullarni solishtirish')} />
        {error ? <ErrorBox onRetry={() => { setError(false); load(); }} /> : <Loading />}
      </View>
    );
  }

  const byKey = debtsByKey(bundle.debts);
  const titleOf = (id: string) => debtTitleOf(id, byKey, '—');
  const baseOf = (s: Strategy) => results[s]?.scenarios.base || null;
  const ranked = STRATEGIES.filter(s => baseOf(s)?.finishYm && baseOf(s)?.months != null);
  const best = ranked.reduce<Strategy | null>((acc, s) => {
    if (!acc) return s;
    const a = baseOf(acc)!;
    const b = baseOf(s)!;
    return b.months! < a.months! || (b.months === a.months && b.cost < a.cost) ? s : acc;
  }, null);
  const bestBase = best ? baseOf(best) : null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Usullarni solishtirish')} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HelpBox
          text={t('Har usul bir xil daromad va xarajat bilan hisoblandi. Asosiy stsenariy — reja shu bo‘yicha tuziladi; ehtiyotkor va optimistik — chegaralar.')}
        />
        {STRATEGIES.map(s => {
          const r = results[s];
          const current = bundle.settings.strategy === s;
          const base = baseOf(s);
          const closedOrder = base
            ? Object.entries(base.closed)
                .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
                .map(([id, ym]) => ({ id, ym: String(ym) }))
            : [];
          const diffMonths = base?.months != null && bestBase?.months != null ? base.months - bestBase.months : 0;
          const diffCost = base && bestBase ? base.cost - bestBase.cost : 0;
          return (
            <View key={s} style={[styles.card, current && styles.cardCurrent]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{t(STRATEGY_META[s].label)}</Text>
                {current ? <Badge text={t('Hozirgi usul')} color={DP.accentStrong} bg={DP.tint} /> : null}
                {best === s ? <Badge text={t('Eng yaxshi')} color={rd.color.primary} bg={rd.color.primaryTint} /> : null}
              </View>
              <Text style={styles.hint}>{t(STRATEGY_META[s].hint)}</Text>

              {!r ? (
                <Text style={styles.na}>{t('Hisoblab bo‘lmadi')}</Text>
              ) : (
                <>
                  <View style={styles.table}>
                    {SCENARIOS.map(k => {
                      const sc = r.scenarios[k];
                      const isBase = k === 'base';
                      return (
                        <View key={k} style={[styles.col, isBase && styles.colBase]}>
                          <Text allowFontScaling={false} style={styles.colHead} numberOfLines={1}>
                            {t(SCENARIO_META[k].label)}
                          </Text>
                          <Text allowFontScaling={false} style={[styles.colMonths, isBase && { color: DP.accentStrong }]}>
                            {sc?.finishYm && sc.months != null ? t('{{n}} oy', { n: sc.months }) : '—'}
                          </Text>
                          <Text allowFontScaling={false} style={styles.colSub} numberOfLines={1}>
                            {sc?.finishYm ? fmtYmShort(sc.finishYm) : ''}
                          </Text>
                          <Text allowFontScaling={false} style={styles.colCost} numberOfLines={1} adjustsFontSizeToFit>
                            {sc ? fCompact(sc.cost, 'UZS') : ''}
                          </Text>
                          {sc && sc.events.length > 0 ? (
                            <Text allowFontScaling={false} style={styles.colWarn} numberOfLines={1}>
                              {t('{{n}} ta yetishmovchilik', { n: sc.events.length })}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                  <Text style={styles.costNote}>{t('Pastki qator — jami foiz va kurs farqi.')}</Text>

                  {best !== s && base && (diffMonths > 0 || diffCost > 0) ? (
                    <Text style={styles.diff}>
                      {t('Eng yaxshisidan: +{{m}} oy, +{{c}}', { m: Math.max(0, diffMonths), c: fCompact(Math.max(0, diffCost), 'UZS') })}
                    </Text>
                  ) : null}

                  {closedOrder.length > 0 ? (
                    <View style={styles.orderWrap}>
                      <Text style={styles.orderLbl}>{t('Yopilish tartibi')}</Text>
                      {closedOrder.map((c, i) => (
                        <View key={c.id} style={styles.orderRow}>
                          <Text allowFontScaling={false} style={styles.orderNum}>
                            {i + 1}
                          </Text>
                          <Text style={styles.orderTitle} numberOfLines={1}>
                            {titleOf(c.id)}
                          </Text>
                          <Text allowFontScaling={false} style={styles.orderYm}>
                            {fmtYm(c.ym)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </>
              )}

              {!current ? (
                <GhostButton
                  label={switching === s ? t('Saqlanmoqda…') : t('Shu usulga o‘tish')}
                  onPress={() => switchTo(s)}
                  style={{ marginTop: rs(12) }}
                />
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default DebtPlanCompare;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(32) },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  cardCurrent: { borderColor: DP.accent, borderWidth: 1.5 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: rs(8), flexWrap: 'wrap' },
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: rd.color.text, marginRight: rs(2) },
  hint: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(6), lineHeight: rs(17) },
  na: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary, marginTop: rs(12) },
  table: { flexDirection: 'row', gap: rs(6), marginTop: rs(12) },
  col: { flex: 1, backgroundColor: rd.color.page, borderRadius: rd.radius.md, padding: rs(9), alignItems: 'center' },
  colBase: { backgroundColor: DP.tint },
  colHead: { fontFamily: rd.font.semibold, fontSize: rs(11), color: rd.color.textTertiary },
  colMonths: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginTop: rs(4) },
  colSub: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textSecondary, marginTop: rs(1) },
  colCost: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.text, marginTop: rs(6) },
  colWarn: { fontFamily: rd.font.semibold, fontSize: rs(10), color: DP.danger, marginTop: rs(4) },
  costNote: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(6) },
  diff: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: DP.warn, marginTop: rs(8) },
  orderWrap: { marginTop: rs(12), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: rd.color.border, paddingTop: rs(10) },
  orderLbl: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary, marginBottom: rs(4) },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingVertical: rs(4) },
  orderNum: { width: rs(18), fontFamily: rd.font.bold, fontSize: rs(12), color: rd.color.textTertiary },
  orderTitle: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text },
  orderYm: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary },
});
