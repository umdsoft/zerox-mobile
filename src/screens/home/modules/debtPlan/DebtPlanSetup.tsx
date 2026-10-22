/**
 * DebtPlanSetup.tsx — "Qarzdan chiqish" sozlash ustasi (3 qadam + natija).
 *
 *  1. Qarzlar — "Shaxsiy qarz"dagi olingan qarzlar; har biriga tur, oylik to'lov, muddat,
 *     foiz, to'lov kuni (PATCH /finance/debts/:id/plan). Yangi qarz → FinanceDebtAdd.
 *  2. Daromadlar — GET /finance/debt-plan/suggestions dan ("Kutilayotgan daromad").
 *  3. Xarajat va bufer — majburiy to'lovlar, kundalik xarajat, erkin pul, bufer, usul.
 *  → PUT /finance/debt-plan { settings, incomes, setupDone:true } → "N oyda qarzsiz bo'lasiz".
 *
 * Params: { first?: true } (birinchi ochilish — DebtPlan'dan replace), { mode: 'edit' }.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { BackHandler, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import Loading from '../../../components/Loading';
import RdHeader from '../../redesign/RdHeader';
import { CheckIcon, ChevronRight, PlusIcon } from '../../redesign/icons';
import { fCompact } from '../financeMoney';
import {
  apiErrorText,
  buildPlanBody,
  DEFAULT_SETTINGS,
  debtPlanApi,
  newIncomeKey,
  paymentBelowInterest,
  PlanBundle,
  PlanDebt,
  PlanIncome,
  PlanSettings,
  PlanSuggestions,
  STRATEGIES,
  ALL_MONTHS_MASK,
} from './debtPlanApi';
import { Chip, DP, ErrorBox, GhostButton, HelpBox, Label, NumField, PrimaryButton, Segmented } from './debtPlanUi';
import DebtPlanFields, { MoneyInput } from './DebtPlanFields';
import DebtPlanIncomeEditor from './DebtPlanIncomeEditor';
import { fmtYm, fUzs, kindLabel, STRATEGY_META } from './debtPlanText';

const STEPS = ['Qarzlar', 'Daromadlar', 'Xarajat va bufer'];
const FREE_PCT = [0, 3, 5, 10];
const MAD_GUESS = 0.15; // tarix yo'q — MAD ≈ 15% mediana (DESIGN, standart 6)

const mergeDebts = (planDebts: PlanDebt[], sugg: PlanDebt[]): PlanDebt[] => {
  const byId = new Map<number, PlanDebt>();
  sugg.forEach(d => byId.set(d.id, d));
  planDebts.forEach(d => byId.set(d.id, { ...(byId.get(d.id) || {}), ...d }));
  return Array.from(byId.values()).filter(d => d.balance > 0 || d.excluded);
};

const initialSettings = (b: PlanBundle | null, s: PlanSuggestions | null): PlanSettings => {
  const base = b ? b.settings : DEFAULT_SETTINGS;
  if (b?.setupDone || !s) return base;
  return {
    ...base,
    fixedExpense: base.fixedExpense || s.fixedExpense || 0,
    livingMedian: base.livingMedian || s.livingMedian || 0,
    livingMad: base.livingMad || s.livingMad || 0,
    historyMonths: base.historyMonths || s.historyMonths || 0,
  };
};

const StepBar = ({ step }: { step: number }) => (
  <View style={styles.stepBar}>
    {STEPS.map((s, i) => {
      const done = i < step;
      const active = i === step;
      return (
        <React.Fragment key={s}>
          {i > 0 ? <View style={[styles.stepLine, (done || active) && { backgroundColor: DP.accent }]} /> : null}
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, (done || active) && { backgroundColor: DP.accent, borderColor: DP.accent }]}>
              {done ? (
                <CheckIcon size={rs(13)} color={rd.color.onPrimary} />
              ) : (
                <Text allowFontScaling={false} style={[styles.stepNum, active && { color: rd.color.onPrimary }]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text allowFontScaling={false} style={[styles.stepLbl, active && { color: rd.color.text }]} numberOfLines={1}>
              {t(s)}
            </Text>
          </View>
        </React.Fragment>
      );
    })}
  </View>
);

const DebtPlanSetup = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isEdit = route?.params?.mode === 'edit';

  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [debts, setDebts] = React.useState<PlanDebt[]>([]);
  const [dirty, setDirty] = React.useState<Set<number>>(new Set());
  const [open, setOpen] = React.useState<number | null>(null);
  const [incomes, setIncomes] = React.useState<PlanIncome[]>([]);
  const [settings, setSettings] = React.useState<PlanSettings>(DEFAULT_SETTINGS);
  const [sugg, setSugg] = React.useState<PlanSuggestions | null>(null);
  const [advanced, setAdvanced] = React.useState(false);
  const [result, setResult] = React.useState<PlanBundle | null>(null);
  const scrollRef = React.useRef<ScrollView>(null);

  const load = React.useCallback(async () => {
    const [b, s] = await Promise.allSettled([debtPlanApi.get(), debtPlanApi.suggestions()]);
    const bundle = b.status === 'fulfilled' ? b.value : null;
    const suggestions = s.status === 'fulfilled' ? s.value : null;
    if (!bundle && !suggestions) {
      setError(true);
      return;
    }
    setError(false);
    setSugg(suggestions);
    setDebts(prev => {
      const fresh = mergeDebts(bundle?.debts || [], suggestions?.debts || []);
      // Qayta yuklashda (yangi qarz qo'shilgach) foydalanuvchi tahrirlari saqlanadi.
      const edited = new Map(prev.map(d => [d.id, d]));
      return fresh.map(d => edited.get(d.id) || d);
    });
    if (!loaded) {
      const inc = bundle && bundle.incomes.length > 0 ? bundle.incomes : suggestions?.incomes || [];
      setIncomes(inc);
      setSettings(initialSettings(bundle, suggestions));
      setLoaded(true);
    }
  }, [loaded]);

  // Fokusda: "Qarz qo'shish"dan qaytganda yangi qarz ro'yxatga tushadi.
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });

  // Android "orqaga" tugmasi: sozlash qadamlari bo'ylab orqaga (ekrandan chiqib ketmasin);
  // natija qadamida — sarlavhadagi kabi rejaga o'tadi. 1-qadamda — odatiy (ekrandan chiqish).
  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (busy) return true;
        if (step > 0 && step < 3) {
          setStep(s => s - 1);
          scrollTop();
          return true;
        }
        if (step === 3) {
          if (isEdit) navigation.goBack();
          else navigation.replace('DebtPlan');
          return true;
        }
        return false;
      });
      return () => sub.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, busy, isEdit]),
  );

  const updateDebt = (d: PlanDebt) => {
    setDebts(prev => prev.map(x => (x.id === d.id ? d : x)));
    setDirty(prev => new Set(prev).add(d.id));
  };

  // ── 1-qadam: qarz maydonlarini saqlash ──
  const saveDebts = async (): Promise<boolean> => {
    const active = debts.filter(d => !d.excluded);
    const noKind = active.find(d => !d.kind);
    if (noKind) {
      setOpen(noKind.id);
      Toast.show({ type: 'error2', props: { desc: t('“{{title}}” qarzining turini tanlang', { title: noKind.title }) } });
      return false;
    }
    const bad = active.find(paymentBelowInterest);
    if (bad) {
      setOpen(bad.id);
      Toast.show({ type: 'error2', props: { desc: t('To‘lov foizni ham qoplamaydi') } });
      return false;
    }
    const toSave = debts.filter(d => dirty.has(d.id));
    if (toSave.length === 0) return true;
    try {
      await Promise.all(toSave.map(d => debtPlanApi.patchDebt(d.id, d)));
      setDirty(new Set());
      return true;
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: apiErrorText(e) || t('Xatolik yuz berdi') } });
      return false;
    }
  };

  const validIncomes = () => {
    const list = incomes.filter(i => i.amount > 0);
    if (list.length === 0) {
      Toast.show({ type: 'error2', props: { desc: t('Kamida bitta daromad kiriting') } });
      return false;
    }
    if (list.some(i => !i.title.trim())) {
      Toast.show({ type: 'error2', props: { desc: t('Daromad nomini kiriting') } });
      return false;
    }
    if (list.some(i => !i.oneOffYm && !i.monthsMask)) {
      Toast.show({ type: 'error2', props: { desc: t('Daromad qaysi oylarda kelishini belgilang') } });
      return false;
    }
    return true;
  };

  const savePlan = async () => {
    if (!(settings.livingMedian > 0)) {
      Toast.show({ type: 'error2', props: { desc: t('Oylik kundalik xarajatni kiriting') } });
      return;
    }
    const sameAsSugg = sugg?.livingMedian != null && sugg.livingMedian === settings.livingMedian && (sugg.historyMonths || 0) >= 3;
    const finalSettings: PlanSettings = {
      ...settings,
      livingMad: sameAsSugg && sugg?.livingMad != null ? sugg.livingMad : Math.round(settings.livingMedian * MAD_GUESS),
    };
    try {
      setBusy(true);
      await debtPlanApi.save(buildPlanBody(finalSettings, incomes.filter(i => i.amount > 0), true));
      const fresh = await debtPlanApi.get();
      setResult(fresh);
      setStep(3);
      scrollTop();
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: apiErrorText(e) || t('Xatolik yuz berdi') } });
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    if (busy) return;
    if (step === 0) {
      setBusy(true);
      const ok = await saveDebts();
      setBusy(false);
      if (!ok) return;
    }
    if (step === 1 && !validIncomes()) return;
    if (step === 2) return savePlan();
    setStep(s => s + 1);
    scrollTop();
  };

  const finish = () => {
    if (isEdit) navigation.goBack();
    else navigation.replace('DebtPlan');
  };

  if (!loaded) {
    return (
      <View style={styles.screen}>
        <RdHeader title={t('Qarzdan chiqish')} />
        {error ? <ErrorBox onRetry={() => { setError(false); load(); }} /> : <Loading />}
      </View>
    );
  }

  const set = (patch: Partial<PlanSettings>) => setSettings(prev => ({ ...prev, ...patch }));
  const bufferDefault = settings.fixedExpense + settings.livingMedian;

  // ─────────── Qadamlar ───────────
  const stepDebts = (
    <>
      <Text style={styles.lead}>
        {t('“Shaxsiy qarz”dagi olingan qarzlaringiz. Har birining turini va oylik to‘lovini tekshiring — reja shunga qarab tuziladi.')}
      </Text>
      {debts.length === 0 ? (
        <HelpBox title={t('Olingan qarzlar yo‘q')} text={t('Rejani tuzish uchun avval qarz qo‘shing.')} />
      ) : null}
      {debts.map(d => {
        const expanded = open === d.id;
        const missing = !d.excluded && (!d.kind || (d.kindInferred && !dirty.has(d.id)));
        return (
          <View key={d.id} style={[styles.debtCard, missing && { borderColor: DP.warn }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setOpen(expanded ? null : d.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={styles.debtHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.debtTitle, d.excluded && styles.muted]} numberOfLines={1}>
                  {d.title}
                </Text>
                <Text allowFontScaling={false} style={[styles.debtSub, missing && { color: DP.warn }]} numberOfLines={1}>
                  {d.excluded
                    ? t('Rejadan chiqarilgan')
                    : `${kindLabel(d.kind)}${d.kindInferred && !dirty.has(d.id) ? ` · ${t('taxminiy, tekshiring')}` : ''}`}
                </Text>
              </View>
              <Text allowFontScaling={false} style={styles.debtBal}>
                {fCompact(d.balance, d.currency)}
              </Text>
              <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
                <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
              </View>
            </TouchableOpacity>
            {expanded ? (
              <View style={styles.debtBody}>
                <DebtPlanFields debt={d} onChange={updateDebt} />
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => updateDebt({ ...d, excluded: !d.excluded })}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: d.excluded }}
                  style={styles.excludeRow}>
                  <View style={[styles.checkbox, d.excluded && styles.checkboxOn]}>
                    {d.excluded ? <CheckIcon size={rs(13)} color={rd.color.onPrimary} /> : null}
                  </View>
                  <Text style={styles.excludeText}>{t('Rejaga kiritmaslik')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        );
      })}
      <GhostButton
        label={t('Qarz qo‘shish')}
        Icon={PlusIcon}
        onPress={() => navigation.navigate('FinanceDebtAdd', { initialType: 'borrowed' })}
      />
      <Text style={styles.footnote}>
        {t('Qarz shartnomalari keyingi bosqichda rejaga qo‘shiladi.')}
      </Text>
    </>
  );

  const stepIncomes = (
    <>
      <Text style={styles.lead}>
        {t('Har oy qancha pul kelishi. “Kutilayotgan daromad”dan taklif qilindi — tekshirib, kerak bo‘lsa o‘zgartiring.')}
      </Text>
      {incomes.map(i => (
        <DebtPlanIncomeEditor
          key={i.key}
          income={i}
          onChange={v => setIncomes(prev => prev.map(x => (x.key === v.key ? v : x)))}
          onRemove={() => setIncomes(prev => prev.filter(x => x.key !== i.key))}
        />
      ))}
      <GhostButton
        label={t('Daromad qo‘shish')}
        Icon={PlusIcon}
        onPress={() =>
          setIncomes(prev => [
            ...prev,
            {
              key: newIncomeKey(),
              title: '',
              amount: 0,
              currency: 'UZS',
              monthsMask: ALL_MONTHS_MASK,
              oneOffYm: null,
              dayOfMonth: 10,
              reliability: 1,
            },
          ])
        }
      />
    </>
  );

  const history = settings.historyMonths || sugg?.historyMonths || 0;
  const stepExpenses = (
    <>
      <Text style={styles.lead}>
        {t('Reja avval yashashingiz uchun pul ajratadi, qarzga faqat qolganini beradi. Shunda oy o‘rtasida pul tugab, yana qarz olishga to‘g‘ri kelmaydi.')}
      </Text>

      <Label hint={sugg?.fixedExpense ? t('“Rejalashtirilgan to‘lovlar”dan: {{amount}}', { amount: fUzs(sugg.fixedExpense) }) : t('Ijara, kommunal, aloqa, bog‘cha')}>
        {t('Majburiy oylik to‘lovlar')}
      </Label>
      <MoneyInput value={settings.fixedExpense || null} onChange={v => set({ fixedExpense: v || 0 })} currency="UZS" />

      <Label
        hint={
          history >= 3
            ? t('Oxirgi {{n}} oy xarajatlaringiz medianasi (oziq-ovqat, yo‘l, uy-ro‘zg‘or, dori).', { n: history })
            : t('Xarajat tarixi kam — oyiga taxminan qancha ketishini kiriting.')
        }>
        {t('Kundalik xarajat (oyiga)')}
      </Label>
      <MoneyInput value={settings.livingMedian || null} onChange={v => set({ livingMedian: v || 0 })} currency="UZS" />

      <Label hint={t('O‘zingiz uchun, hisobot so‘ralmaydigan pul — kafolatlangan daromadning foizi.')}>
        {t('Erkin pul')}
      </Label>
      <View style={styles.chipRow}>
        {FREE_PCT.map(p => (
          <Chip
            key={p}
            label={p === 0 ? t('Yo‘q') : `${p}%`}
            active={settings.freeMoney == null && settings.freeMoneyPct === p}
            onPress={() => set({ freeMoneyPct: p, freeMoney: null })}
          />
        ))}
      </View>

      <Label hint={t('Kutilmagan xarajat yangi qarzga olib kelmasligi uchun zaxira.')}>{t('Hozirgi jamg‘arma')}</Label>
      <MoneyInput value={settings.bufferCurrent || null} onChange={v => set({ bufferCurrent: v || 0 })} currency="UZS" />

      <Label hint={t('Bo‘sh qoldirsangiz: 1 oylik majburiy va kundalik xarajat ({{amount}}).', { amount: fUzs(bufferDefault) })}>
        {t('Zaxira maqsadi (bufer)')}
      </Label>
      <MoneyInput value={settings.bufferTarget} onChange={v => set({ bufferTarget: v })} currency="UZS" />

      <Label>{t('To‘lash usuli')}</Label>
      <Segmented
        value={settings.strategy}
        onChange={v => set({ strategy: v })}
        options={STRATEGIES.map(s => ({ value: s, label: t(STRATEGY_META[s].label) }))}
      />
      <Text style={styles.hint}>{t(STRATEGY_META[settings.strategy].hint)}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setAdvanced(a => !a)}
        accessibilityRole="button"
        accessibilityState={{ expanded: advanced }}
        style={styles.advToggle}>
        <Text style={styles.advText}>{t('Qo‘shimcha sozlamalar')}</Text>
        <View style={{ transform: [{ rotate: advanced ? '90deg' : '0deg' }] }}>
          <ChevronRight size={rs(16)} color={DP.accent} />
        </View>
      </TouchableOpacity>
      {advanced ? (
        <View>
          <Label hint={t('Majburiy to‘lov va kundalik xarajat har yili shuncha oshadi deb olinadi.')}>{t('Yillik inflyatsiya')}</Label>
          <NumField value={settings.inflationPct} onChange={v => set({ inflationPct: v ?? 0 })} suffix="%" decimals max={100} />
          <Label hint={t('USD qarzning so‘mdagi qoldig‘i shuncha o‘sadi (yashirin foiz).')}>{t('So‘m qadrsizlanishi (yillik)')}</Label>
          <NumField value={settings.devaluationPct} onChange={v => set({ devaluationPct: v ?? 0 })} suffix="%" decimals max={100} />
          <Label>{t('Daromad o‘sishi (yillik)')}</Label>
          <NumField value={settings.incomeGrowthPct} onChange={v => set({ incomeGrowthPct: v ?? 0 })} suffix="%" decimals max={100} />
        </View>
      ) : null}
    </>
  );

  const r = result?.result || null;
  const base = r?.scenarios.base || null;
  const firstMonth = r?.schedule[0]?.payments.reduce((s, p) => s + p.amount, 0) || r?.totals.monthlyRequired || 0;
  const stepResult = (
    <View>
      {r && r.feasible && base?.finishYm && base.months != null ? (
        <View style={styles.resultBox}>
          <View style={styles.resultIcon}>
            <CheckIcon size={rs(28)} color={rd.color.onPrimary} />
          </View>
          <Text style={styles.resultBig}>{t('{{n}} oyda qarzsiz bo‘lasiz', { n: base.months })}</Text>
          <Text style={styles.resultDate}>{fmtYm(base.finishYm)}</Text>
          <View style={styles.resultNums}>
            <View style={styles.resultNum}>
              <Text style={styles.resultLbl}>{t('Shu oy to‘lov')}</Text>
              <Text style={styles.resultVal}>{fCompact(firstMonth, 'UZS')}</Text>
            </View>
            <View style={styles.resultNum}>
              <Text style={styles.resultLbl}>{t('Foiz va kurs farqi')}</Text>
              <Text style={styles.resultVal}>{fCompact(r.totals.interestAndFx, 'UZS')}</Text>
            </View>
          </View>
        </View>
      ) : r && r.feasible ? (
        <HelpBox
          tone="warn"
          title={t('Tugash sanasi aniqlanmadi')}
          text={result?.resultError || t('Oylik to‘lovlar qarzni yopishga yetmaydi. Daromad, xarajat yoki qarz to‘lovlarini tekshiring.')}
        />
      ) : (
        <HelpBox
          tone="danger"
          title={t('Pul minimal to‘lovlarga ham yetmaydi')}
          text={t('Reja tuzilmadi. Panelda qaysi oylarda qancha yetishmasligini ko‘rasiz — kreditor bilan muddatni uzaytirishni kelishing.')}
        />
      )}
      {r && r.coverage.verdict === 'tight' ? (
        <HelpBox
          tone="warn"
          title={t('Reja tig‘iz')}
          text={t('Ehtimoliy daromad kelmagan oyda yashash puli qisqarishi mumkin. Boshlang‘ich zaxira yig‘ish tavsiya etiladi.')}
        />
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader
        title={isEdit ? t('Reja sozlamalari') : t('Qarzdan chiqish')}
        onBack={step > 0 && step < 3 ? () => { setStep(s => s - 1); scrollTop(); } : undefined}
      />
      {step < 3 ? <StepBar step={step} /> : null}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {step === 0 ? stepDebts : step === 1 ? stepIncomes : step === 2 ? stepExpenses : stepResult}
      </ScrollView>
      <View style={styles.bottom}>
        {step < 3 ? (
          <PrimaryButton
            label={step === 2 ? t('Rejani tuzish') : t('Keyingi')}
            onPress={next}
            busy={busy}
            disabled={step === 0 && debts.filter(d => !d.excluded).length === 0}
          />
        ) : (
          <PrimaryButton label={isEdit ? t('Tayyor') : t('Rejani ko‘rish')} onPress={finish} />
        )}
      </View>
    </View>
  );
};

export default DebtPlanSetup;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(24) },
  lead: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textSecondary, lineHeight: rs(19), marginBottom: rs(12) },
  hint: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(8), lineHeight: rs(17) },
  footnote: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(10), textAlign: 'center' },
  muted: { color: rd.color.textTertiary },

  stepBar: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: rs(20), paddingTop: rs(4), paddingBottom: rs(12) },
  stepItem: { alignItems: 'center', width: rs(76) },
  stepLine: { flex: 1, height: 2, backgroundColor: rd.color.border, marginTop: rs(13) },
  stepDot: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.textTertiary },
  stepLbl: { fontFamily: rd.font.semibold, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(5) },

  debtCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    marginBottom: rs(10),
    overflow: 'hidden',
  },
  debtHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10), padding: rs(14) },
  debtTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text },
  debtSub: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  debtBal: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  debtBody: { paddingHorizontal: rs(14), paddingBottom: rs(14), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: rd.color.border },
  excludeRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(14) },
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
  excludeText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textSecondary },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  advToggle: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginTop: rs(18), paddingVertical: rs(4) },
  advText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: DP.accent },

  resultBox: {
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xl,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(22),
    marginTop: rs(10),
    marginBottom: rs(12),
  },
  resultIcon: {
    width: rs(60),
    height: rs(60),
    borderRadius: rs(30),
    backgroundColor: DP.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBig: { fontFamily: rd.font.bold, fontSize: rs(22), color: rd.color.text, textAlign: 'center', marginTop: rs(14) },
  resultDate: { fontFamily: rd.font.semibold, fontSize: rs(15), color: DP.accentStrong, marginTop: rs(4) },
  resultNums: { flexDirection: 'row', gap: rs(10), marginTop: rs(18), alignSelf: 'stretch' },
  resultNum: { flex: 1, backgroundColor: rd.color.page, borderRadius: rd.radius.md, padding: rs(12) },
  resultLbl: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary },
  resultVal: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text, marginTop: rs(3) },

  bottom: {
    paddingHorizontal: rs(16),
    paddingTop: rs(10),
    paddingBottom: rs(16),
    backgroundColor: rd.color.page,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: rd.color.border,
  },
});
