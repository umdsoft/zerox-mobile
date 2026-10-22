/**
 * DebtPlanCalculator.tsx — "Agar" kalkulyatori: "Oyiga 500 000 ko'proq to'lasam yoki
 * bonusni qarzga bersam, necha oy tezroq?". Reja bilan bir xil simulyatsiya, saqlanmaydi:
 * POST /finance/debt-plan/simulate { whatIf: { extraMonthly, oneOff: { ym, amount } } }.
 * Surgich o'zgarganda 400 ms kutib qayta hisoblanadi; eski javoblar e'tiborsiz qoldiriladi.
 */
import React from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import Loading from '../../../components/Loading';
import RdHeader from '../../redesign/RdHeader';
import { fCompact } from '../financeMoney';
import { addMonths, currentYm, debtPlanApi, PlanResult } from './debtPlanApi';
import { Card, Chip, DP, ErrorBox, Grad, HelpBox, Label, SectionTitle, Slider } from './debtPlanUi';
import { fmtYm, fmtYmShort, fUzs } from './debtPlanText';
import { MoneyInput } from './DebtPlanFields';
import DebtPlanChart, { chartPointsOf } from './DebtPlanChart';

const STEP = 50_000;
const MIN_MAX = 5_000_000;
const QUICK = [100_000, 250_000, 500_000, 1_000_000];
const DEBOUNCE_MS = 400;

const DebtPlanCalculator = () => {
  const [baseline, setBaseline] = React.useState<PlanResult | null>(null);
  const [whatIf, setWhatIf] = React.useState<PlanResult | null>(null);
  const [error, setError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [extra, setExtra] = React.useState(0);
  const [oneOff, setOneOff] = React.useState<number | null>(null);
  const [oneOffYm, setOneOffYm] = React.useState(addMonths(currentYm(), 1));
  const reqId = React.useRef(0);

  const loadBaseline = React.useCallback(async () => {
    try {
      setError(false);
      setBaseline(await debtPlanApi.simulate({}));
    } catch {
      setError(true);
    }
  }, []);

  React.useEffect(() => {
    loadBaseline();
  }, [loadBaseline]);

  const active = extra > 0 || (oneOff != null && oneOff > 0);

  React.useEffect(() => {
    if (!baseline || !active) {
      setWhatIf(null);
      setBusy(false);
      return;
    }
    const id = ++reqId.current;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const res = await debtPlanApi.simulate({
          whatIf: {
            extraMonthly: extra,
            oneOff: oneOff && oneOff > 0 ? { ym: oneOffYm, amount: oneOff } : null,
          },
        });
        if (id === reqId.current) setWhatIf(res);
      } catch {
        if (id === reqId.current) setWhatIf(null);
      } finally {
        if (id === reqId.current) setBusy(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [baseline, active, extra, oneOff, oneOffYm]);

  if (!baseline) {
    return (
      <View style={styles.screen}>
        <RdHeader title={t('“Agar” kalkulyatori')} />
        {error ? <ErrorBox onRetry={loadBaseline} /> : <Loading />}
      </View>
    );
  }

  const base = baseline.scenarios.base;
  const next = whatIf?.scenarios.base || null;
  const sliderMax = Math.max(MIN_MAX, Math.ceil((baseline.totals.monthlyRequired * 2) / 1_000_000) * 1_000_000);
  const monthsSaved = base?.months != null && next?.months != null ? base.months - next.months : 0;
  const costSaved = base && next ? base.cost - next.cost : 0;
  const nextMonths = Array.from({ length: 12 }, (_, k) => addMonths(currentYm(), k + 1));

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('“Agar” kalkulyatori')} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Grad id="dpCalc" colors={DP.grad} />
          <Text allowFontScaling={false} style={styles.heroKicker}>
            {active ? t('Shunda qarzsiz bo‘lasiz') : t('Hozirgi reja bo‘yicha')}
          </Text>
          <View style={styles.heroRow}>
            <Text allowFontScaling={false} style={styles.heroDate} numberOfLines={1} adjustsFontSizeToFit>
              {fmtYm((active ? next?.finishYm : base?.finishYm) || null)}
            </Text>
            {busy ? <ActivityIndicator color={rd.color.onPrimary} /> : null}
          </View>
          {active && base ? (
            <Text allowFontScaling={false} style={styles.heroSub}>
              {t('Hozirgi reja: {{date}}', { date: fmtYm(base.finishYm) })}
            </Text>
          ) : null}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text allowFontScaling={false} style={styles.heroStatVal}>
                {active && next ? (monthsSaved > 0 ? t('{{n}} oy', { n: monthsSaved }) : '0') : '—'}
              </Text>
              <Text allowFontScaling={false} style={styles.heroStatLbl}>
                {t('tezroq')}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text allowFontScaling={false} style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                {active && next ? fCompact(Math.max(0, costSaved), 'UZS') : '—'}
              </Text>
              <Text allowFontScaling={false} style={styles.heroStatLbl}>
                {t('foiz tejaladi')}
              </Text>
            </View>
          </View>
        </View>

        {active && next && monthsSaved <= 0 && costSaved <= 0 ? (
          <HelpBox
            tone="warn"
            text={t('Bu summa muddatni qisqartirmaydi — ortiqcha pul avval buferga yoki foizsiz qarzlarga ketadi.')}
          />
        ) : null}

        <SectionTitle text={t('Oyiga qo‘shimcha to‘lov')} />
        <Card>
          <Text allowFontScaling={false} style={styles.extraVal}>
            +{fUzs(extra)}
          </Text>
          <Slider value={extra} max={sliderMax} step={STEP} onChange={setExtra} accessibilityLabel={t('Oyiga qo‘shimcha to‘lov')} />
          <View style={styles.scale}>
            <Text allowFontScaling={false} style={styles.scaleText}>
              0
            </Text>
            <Text allowFontScaling={false} style={styles.scaleText}>
              {fCompact(sliderMax)}
            </Text>
          </View>
          <View style={styles.chips}>
            {QUICK.map(q => (
              <Chip key={q} label={`+${fCompact(q)}`} active={extra === q} onPress={() => setExtra(q)} />
            ))}
            {extra > 0 ? <Chip label={t('Tozalash')} active={false} onPress={() => setExtra(0)} /> : null}
          </View>
        </Card>

        <SectionTitle text={t('Bir martalik pul (bonus, sotuv)')} color={rd.color.primary} />
        <Card>
          <MoneyInput value={oneOff} onChange={setOneOff} currency="UZS" />
          <Label>{t('Qaysi oyda')}</Label>
          <View style={styles.chips}>
            {nextMonths.map(ym => (
              <Chip key={ym} label={fmtYmShort(ym)} active={oneOffYm === ym} onPress={() => setOneOffYm(ym)} accent={rd.color.primary} />
            ))}
          </View>
        </Card>

        {active && next ? (
          <>
            <SectionTitle text={t('Qoldiq: reja va “Agar”')} color="#7c3aed" />
            <Card>
              <DebtPlanChart points={chartPointsOf(whatIf)} compare={chartPointsOf(baseline)} />
              <View style={styles.legend}>
                <View style={[styles.legendLine, { backgroundColor: DP.accent }]} />
                <Text style={styles.legendText}>{t('“Agar” bilan')}</Text>
                <View style={[styles.legendLine, styles.legendDash]} />
                <Text style={styles.legendText}>{t('Hozirgi reja')}</Text>
              </View>
            </Card>
          </>
        ) : null}

        <HelpBox text={t('Hisob reja bilan bir xil, lekin saqlanmaydi. Qo‘shimcha pul samarali stavkasi eng yuqori qarzga yo‘naltiriladi.')} />
      </ScrollView>
    </View>
  );
};

export default DebtPlanCalculator;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(32) },
  hero: { borderRadius: rd.radius.xl, overflow: 'hidden', padding: rs(18), marginBottom: rs(12) },
  heroKicker: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: 'rgba(255,255,255,0.88)' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(4) },
  heroDate: { flexShrink: 1, fontFamily: rd.font.bold, fontSize: rs(28), color: rd.color.onPrimary },
  heroSub: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: 'rgba(255,255,255,0.88)', marginTop: rs(4) },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(16),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: rd.radius.md,
    paddingVertical: rs(10),
  },
  heroStat: { flex: 1, alignItems: 'center', paddingHorizontal: rs(6) },
  heroStatVal: { fontFamily: rd.font.bold, fontSize: rs(19), color: rd.color.onPrimary },
  heroStatLbl: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: 'rgba(255,255,255,0.85)', marginTop: rs(2) },
  heroDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.3)' },
  extraVal: { fontFamily: rd.font.bold, fontSize: rs(22), color: DP.accentStrong, marginBottom: rs(6) },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleText: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), marginTop: rs(10) },
  legend: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(10) },
  legendLine: { width: rs(16), height: 3, borderRadius: 2 },
  legendDash: { backgroundColor: rd.color.textTertiary, marginLeft: rs(10) },
  legendText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
});
