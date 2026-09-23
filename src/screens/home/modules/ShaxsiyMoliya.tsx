/**
 * ShaxsiyMoliya.tsx — "Shaxsiy moliya" DASHBOARD (web pages/finance/index.vue bilan bir xil,
 * daromad-markazli yangi tuzilma).
 *
 * REAL backend:
 *   GET /finance/dashboard → incomes/expenses/goals/budget/daily_series/debts
 *   GET /finance/health    → moliyaviy sog'liq (score/status/factors)
 *
 * Tuzilma (yuqoridan pastga):
 *   1) 4 tezkor tugma (Xarajat/Daromad/Maqsad/Tahlil)
 *   2) Moliyaviy sog'liq kartasi
 *   3) 3 karta: Oylik daromad / Oylik xarajat / Maqsadlar
 *   4) Byudjet (agar bor)
 *   5) Kunlik trend (daily_series — sodda bar grafik)
 *   6) Daromadlar kategoriya bo'yicha + Xarajatlar kategoriya bo'yicha (ro'yxat + foiz bar)
 *   7) So'nggi amaliyotlar (daromad +yashil / xarajat −qizil)
 *
 * MUHIM: pul maydonlari backenddan STRING keladi -> financeMoney.num()/fCompact() bilan.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import RdTopBar from '../redesign/RdTopBar';
// SS9: kalendar bloki (ilgari "Tahlil" tabi edi) — sahifa pastida.
import FinanceCalendarCard from './FinanceCalendarCard';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChartIcon,
  BulbIcon,
  CoinIcon,
  HomeIcon,
  IconProps,
  ShieldIcon,
  StarIcon,
  UsersIcon,
  WalletIcon,
} from '../redesign/icons';
import {
  catLabel,
  currencyTotals,
  currencyTotalsCompact,
  fDate,
  fMoney,
  fCompact,
  fShort,
  healthStatusUz,
  num,
} from './financeMoney';

// Dizayn tizimidan tashqari literal ranglar (gradient/bar/kategoriya).
const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;
const RED = '#dc2626';
const GREEN = '#16a34a';
const BLUE = '#2f6fed';
const PURPLE = '#7c3aed';
const CAT_COLORS = ['#2f6fed', '#22c55e', '#f59e0b', '#e11d48', '#7c3aed', '#0ea5e9'];

// ─────────── Kichik komponentlar ───────────
const Grad = ({ id, colors }: { id: string; colors: readonly string[] }) => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={colors[0]} />
        <Stop offset="1" stopColor={colors[1]} />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
  </Svg>
);

const CircleIcon = ({ size, bg, children }: any) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
    {children}
  </View>
);

// Tezkor amal tugmasi (yuqori qatordagi 4 tadan biri).
const QuickBtn = ({
  Icon,
  label,
  color,
  bg,
  onPress,
}: {
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} style={styles.quickBtn} onPress={onPress}>
    <CircleIcon size={rs(40)} bg={bg}>
      <Icon size={rs(19)} color={color} />
    </CircleIcon>
    <Text allowFontScaling={false} style={styles.quickLabel} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Ko'rsatkich kartasi — per-currency ko'p qatorli qiymat bilan.
const MetricCard = ({
  accent,
  accentBg,
  Icon,
  label,
  lines,
  sub,
  onPress,
}: {
  accent: string;
  accentBg: string;
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  lines: string[]; // per-currency (yoki 1 element)
  sub?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity activeOpacity={onPress ? 0.9 : 1} onPress={onPress} style={styles.metric}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <View style={styles.metricHead}>
      <CircleIcon size={rs(30)} bg={accentBg}>
        <Icon size={rs(16)} color={accent} />
      </CircleIcon>
    </View>
    <Text allowFontScaling={false} style={styles.metricLabel} numberOfLines={2}>
      {label}
    </Text>
    {(lines.length ? lines : ['0 UZS']).map((ln, i) => (
      <Text
        key={i}
        allowFontScaling={false}
        style={[styles.metricValue, i > 0 && styles.metricValueSm]}
        numberOfLines={1}
        adjustsFontSizeToFit={i === 0}>
        {ln}
      </Text>
    ))}
    {!!sub && (
      <Text allowFontScaling={false} style={styles.metricSub}>
        {sub}
      </Text>
    )}
  </TouchableOpacity>
);

// SS4: Pul oqimi — "Joriy oy" (kunlik) / "Oylar kesimida" (12 oy) tab + bosiladigan
// legend (Daromad/Xarajat filtr — birini yashirsa faqat ikkinchisi grafigi qoladi).
const FlowChart = ({ daily, monthly }: { daily: any[]; monthly: any[] }) => {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<'day' | 'month'>('day');
  const [showInc, setShowInc] = React.useState(true);
  const [showExp, setShowExp] = React.useState(true);
  const rows = (mode === 'day' ? daily : monthly) || [];
  const max = Math.max(
    1,
    ...rows.map((d: any) =>
      Math.max(showInc ? num(d?.income) : 0, showExp ? num(d?.expense) : 0),
    ),
  );
  const H = rs(96);
  return (
    <View style={styles.card}>
      <View style={styles.chartHead}>
        <Text allowFontScaling={false} style={styles.cardTitle}>
          {t('Pul oqimi')}
        </Text>
        <View style={styles.flowTabs}>
          {([['day', 'Joriy oy'], ['month', 'Oylar kesimida']] as const).map(([m, lbl]) => {
            const on = mode === m;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={0.85}
                onPress={() => setMode(m)}
                style={[styles.flowTab, on && styles.flowTabOn]}>
                <Text allowFontScaling={false} style={[styles.flowTabText, on && styles.flowTabTextOn]}>
                  {t(lbl)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bosiladigan legend */}
      <View style={styles.legendRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowInc(v => !v)}
          disabled={showInc && !showExp}
          style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: showInc ? GREEN : '#cbd5e1' }]} />
          <Text
            allowFontScaling={false}
            style={[styles.legendText, !showInc && { textDecorationLine: 'line-through' }]}>
            {t('Daromad')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowExp(v => !v)}
          disabled={showExp && !showInc}
          style={[styles.legendItem, { marginLeft: rs(12) }]}>
          <View style={[styles.legendDot, { backgroundColor: showExp ? RED : '#cbd5e1' }]} />
          <Text
            allowFontScaling={false}
            style={[styles.legendText, !showExp && { textDecorationLine: 'line-through' }]}>
            {t('Xarajat')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.chartBody, { height: H }]}>
        {rows.map((d: any, i: number) => (
          <View key={i} style={styles.chartCol}>
            {showInc && (
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(2, (num(d?.income) / max) * H), backgroundColor: GREEN },
                ]}
              />
            )}
            {showExp && (
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(2, (num(d?.expense) / max) * H), backgroundColor: RED },
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.chartAxis}>
        <Text allowFontScaling={false} style={styles.axisText}>
          {mode === 'day' ? '1' : rows[0]?.label || ''}
        </Text>
        <Text allowFontScaling={false} style={styles.axisText}>
          {mode === 'day' ? rows.length || 0 : rows[rows.length - 1]?.label || ''}
        </Text>
      </View>
    </View>
  );
};

/**
 * SS15: Bo'lim sarlavhasi — rangli aksent chizig'i bilan.
 * MUAMMO: ekranda 8+ karta ketma-ket TEKIS turardi, faqat pastki uchtasida sarlavha
 * bor edi → "ma'lumotlar aralashib yotibdi". YECHIM: HAR BIR blok o'z sarlavhasini
 * oladi, shunda ko'z bloklarni ajratadi (guruhlash — bezak emas, tuzilma).
 */
const SectionTitle = ({ text, color }: { text: string; color: string }) => (
  <View style={styles.sectionTitleRow}>
    <View style={[styles.sectionBar, { backgroundColor: color }]} />
    <Text allowFontScaling={false} style={styles.blockTitle}>{text}</Text>
  </View>
);

// Kategoriya ro'yxati (ro'yxat + foiz bar) — pie o'rniga (mobil sodda naqsh).
const CategoryList = ({ items, empty }: { items: any[]; empty: string }) => {
  const total = (items || []).reduce((s, c) => s + num(c?.total), 0);
  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <CircleIcon size={rs(40)} bg={rd.color.surfaceAlt}>
          <BarChartIcon size={rs(22)} color={rd.color.textTertiary} />
        </CircleIcon>
        <Text allowFontScaling={false} style={styles.emptyText}>
          {empty}
        </Text>
      </View>
    );
  }
  return (
    <>
      {items.map((c, i) => {
        const color = c?.color || CAT_COLORS[i % CAT_COLORS.length];
        const val = num(c?.total);
        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
        return (
          <View key={i} style={styles.catRow}>
            <View style={styles.catTop}>
              <View style={[styles.catDot, { backgroundColor: color }]} />
              <Text allowFontScaling={false} style={styles.catName} numberOfLines={1}>
                {c?.icon ? `${c.icon} ` : ''}
                {catLabel(c?.name)}
              </Text>
              <Text allowFontScaling={false} style={styles.catAmount} numberOfLines={1}>
                {fCompact(val, c?.currency || 'UZS')}
              </Text>
            </View>
            <View style={styles.catBarTrack}>
              <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </>
  );
};

// ─────────── Ekran ───────────
const ShaxsiyMoliya = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const isTab = !!route?.params?.tab;

  const dashboard = useFetch({ url: `${URL}/finance/dashboard`, method: 'GET' });
  const health = useFetch({ url: `${URL}/finance/health`, method: 'GET' });

  // Ekranga qayta fokuslanganda (xarajat/daromad/maqsad qo'shib qaytganda) yangilash.
  // MUHIM: barqaror onRefresh funksiyalariga bog'laymiz — butun `dashboard`/`health`
  // obyektlari har render'da yangi bo'lib, [dashboard, health] cheksiz refetch loop hosil
  // qilardi (birinchi fetch ba'zan loopdan oldin tugab qolardi, lekin ishonchsiz).
  const refreshDash = dashboard.onRefresh;
  const refreshHealth = health.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refreshDash({});
      refreshHealth({});
    }, [refreshDash, refreshHealth]),
  );

  const d: any = (dashboard.data as any)?.data || {};
  const h: any = (health.data as any)?.data || {};

  const incomes: any = d?.incomes || {};
  const expenses: any = d?.expenses || {};
  const goals: any = d?.goals || {};
  const budget: any = d?.budget || null;
  // N14: Shaxsiy qarzlar inline-xulosasi (dashboard `debts` bloki).
  const debts: any = d?.debts || {};
  const debtBorrowed = num(debts?.borrowed);
  const debtLent = num(debts?.lent);
  const debtNet = num(debts?.net_balance);
  // img10: valyuta bo'yicha ALOHIDA (USD + UZS ni qo'shmaymiz — mantiqan noto'g'ri edi).
  const debtBorrowedCur: any[] = Array.isArray(debts?.borrowed_by_currency) ? debts.borrowed_by_currency : [];
  const debtLentCur: any[] = Array.isArray(debts?.lent_by_currency) ? debts.lent_by_currency : [];
  const debtNetCur: any[] = Array.isArray(debts?.net_by_currency) ? debts.net_by_currency : [];
  // SS6/SS14: valyutalar ALOHIDA QATORDA (bir qatorda siqilib mayda ko'rinardi) — o'qiladi.
  const debtMoneyList = (arr: any[], scalar: number, signed: boolean): string[] => {
    const list = arr && arr.length ? arr.map((x) => ({ v: num(x.total), c: x.currency })) : [{ v: num(scalar), c: 'UZS' }];
    return list.map(({ v, c }) => (signed ? (v >= 0 ? '+' : '−') : '') + fCompact(Math.abs(v), c));
  };
  const debtNetColor = debtNetCur.length
    ? debtNetCur.every((x) => num(x.total) >= 0)
      ? GREEN
      : debtNetCur.every((x) => num(x.total) < 0)
      ? RED
      : rd.color.text
    : debtNet >= 0
    ? GREEN
    : RED;
  const debtOverdue = Array.isArray(debts?.overdue) ? debts.overdue.length : num(debts?.overdue);
  const debtUpcoming = Array.isArray(debts?.upcoming) ? debts.upcoming.length : num(debts?.upcoming);
  const hasDebtData = debtBorrowed > 0 || debtLent > 0 || debtBorrowedCur.length > 0 || debtLentCur.length > 0;

  const score = h?.score ?? 0;
  const status = h?.status ?? 'poor';
  const debtLevel = num(h?.factors?.debt_level);
  const overdueCount = h?.factors?.overdue_debts ?? 0;
  // SS2: "Qoldiq" — UMUMIY balans (butun tarix daromad − xarajat, UZS). Backend
  // `balance` bermasa, joriy oy sofiga qaytamiz (regressiyasiz).
  const balance =
    d?.balance != null
      ? num(d?.balance)
      : num(incomes?.monthly_total_uzs) - num(expenses?.monthly_total_uzs);

  // So'nggi amaliyotlar: daromad(+) + xarajat(−), sana bo'yicha kamayish.
  const recent = React.useMemo(() => {
    const inc = (incomes?.recent || []).map((r: any) => ({
      ...r,
      _kind: 'income',
      _date: r?.income_date,
    }));
    const exp = (expenses?.recent || []).map((r: any) => ({
      ...r,
      _kind: 'expense',
      _date: r?.expense_date,
    }));
    return [...inc, ...exp]
      .sort((a, b) => {
        // So'rov: sana bo'yicha, teng bo'lsa created_at (vaqt) bo'yicha — bir kundagi
        // daromad/xarajat ham VAQT bo'yicha to'g'ri tartiblanadi.
        const dd =
          new Date(b?._date || 0).getTime() - new Date(a?._date || 0).getTime();
        if (dd !== 0) return dd;
        return (
          new Date(b?.created_at || 0).getTime() -
          new Date(a?.created_at || 0).getTime()
        );
      })
      .slice(0, 8);
  }, [incomes?.recent, expenses?.recent]);

  // img1: menyu — zamonaviy "mahsulot kartalari" (rangli fon + oq ikonka plita + tavsif).
  // SS1: Limit karta OLIB TASHLANdi (pastdagi "Oylik limit" kartasida "Batafsil" bor).
  // Tartib: Rejalashtirilgan to'lovlar/Kutilayotgan daromad → Oila/Gap → Maqsadlar/Tahlil.
  // "Чёрная касса" — ATAMA (tarjima qilinmaydi, t() ishlatilmaydi).
  const MENU = [
    { key: 'sched_pay', route: 'FinanceScheduledPayments', Icon: ArrowDownLeft, accent: RED, tint: '#fdeeee', title: t('Rejalashtirilgan to‘lovlar'), sub: t('Kelgusi to‘lovlar') },
    { key: 'sched_inc', route: 'FinanceScheduledIncomes', Icon: ArrowUpRight, accent: GREEN, tint: '#e9f7ef', title: t('Kutilayotgan daromad'), sub: t('Kelgusi daromad') },
    { key: 'family', route: 'FinanceFamily', Icon: HomeIcon, accent: '#db2777', tint: '#fce8f2', title: t('Oila moliyasi'), sub: t('Oila budjeti') },
    { key: 'gap', route: 'FinanceGap', Icon: WalletIcon, accent: '#0d9488', tint: '#d8f5f0', title: t('Gap'), sub: 'Чёрная касса' },
    { key: 'goals', route: 'FinanceGoalList', Icon: StarIcon, accent: '#7c3aed', tint: '#f4efff', title: t('Maqsadlar'), sub: t('Jamg‘arma') },
    { key: 'analytics', route: 'FinanceAnalytics', Icon: BarChartIcon, accent: '#4f46e5', tint: '#eef0fe', title: t('Tahlil'), sub: t('Daromad va xarajat') },
  ];

  if (dashboard.loading && health.loading) {
    return (
      <View style={styles.screen}>
        <RdHeader title={t('Shaxsiy moliya')} showBack={!isTab} />
        <Loading />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS7 (2026-09-18): tab rejimida YAGONA yuqori panel. */}
      {isTab ? (
        <RdTopBar title={t('Shaxsiy moliya')} />
      ) : (
        <RdHeader title={t('Shaxsiy moliya')} showBack />
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* SS7: "Shaxsiy qarzlar" bloki BU YERDAN OLIB TASHLANDI — endi u
            pastki menyudagi mustaqil "Shaxsiy qarz" bo‘limi. "Shaxsiy moliya"
            sahifasida faqat moliya (daromad/xarajat/byudjet/maqsad) qoladi. */}

        {/*
          SS19 (2026-09-14): ilgari bu yerda IKKI alohida rangli karta turardi —
          ko'k "Tezkor amallar" hero'si va yashil "Moliyaviy sog'liq" kartasi —
          va ular oralig'ida "Shu oy" metrikalari. Ikki to'q gradient bir-biri
          bilan e'tibor uchun kurashib, sahifaning boshi chalkash ko'rinardi.

          Endi ular BITTA kartada: tepada HOLAT (sog'liq bali + qoldiq),
          ajratgich chizig'idan keyin esa shu holatga ta'sir qiladigan IKKI AMAL.
          Ya'ni "qanday turibman?" va "nima qilaman?" bir joyda, bitta rangda.
        */}
        <View style={styles.fmHero}>
          <Grad id="fmHero" colors={GRAD_BRAND} />

          {/* Holat: sog'liq bali + tavsiya tugmasi + qoldiq */}
          <View style={styles.healthTopRow}>
            <View style={styles.healthLabelRow}>
              <ShieldIcon size={rs(15)} color={rd.color.onPrimary} />
              <Text allowFontScaling={false} style={styles.healthLabel}>
                {t('Moliyaviy sog‘liq')}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('FinanceAdvice')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.healthAdviceBtn}>
              <BulbIcon size={rs(15)} color={rd.color.onPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.healthBottomRow}>
            <View style={styles.healthScoreInline}>
              <Text allowFontScaling={false} style={styles.healthScore2}>
                {score}
              </Text>
              <Text allowFontScaling={false} style={styles.healthScoreMax2}>
                /100
              </Text>
              <Text allowFontScaling={false} style={styles.healthStatusInline} numberOfLines={1}>
                {'  ·  '}
                {healthStatusUz(status)}
              </Text>
            </View>
            <View style={styles.healthQoldiq}>
              <Text allowFontScaling={false} style={styles.healthQoldiqLabel}>
                {t('Qoldiq')}
              </Text>
              <Text
                allowFontScaling={false}
                style={styles.healthQoldiqVal}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {balance >= 0 ? '+' : '−'}
                {fCompact(Math.abs(balance))}
              </Text>
            </View>
          </View>

          <View style={styles.fmHeroSep} />

          <View style={styles.fmHeroBtns}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.fmHeroBtn, styles.fmHeroBtnLight]}
              onPress={() => navigation.navigate('FinanceExpenseAdd')}>
              <ArrowDownLeft size={rs(18)} color={RED} />
              <Text allowFontScaling={false} style={[styles.fmHeroBtnText, { color: RED }]}>
                {t('Xarajat qo‘shish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.fmHeroBtn, { backgroundColor: rd.color.success }]}
              onPress={() => navigation.navigate('FinanceIncomeAdd')}>
              <ArrowUpRight size={rs(18)} color={rd.color.onPrimary} />
              <Text allowFontScaling={false} style={[styles.fmHeroBtnText, { color: rd.color.onPrimary }]}>
                {t('Daromad qo‘shish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SS15: "Shu oy" bloki — oylik xarajat/daromad + sog'liq + limit BIRGA
            (hammasi shu oyning holati; ilgari aralash tartibda edi). */}
        <SectionTitle text={t('Shu oy')} color={GREEN} />
        {/* So'rov: Oylik XARAJAT birinchi, keyin Oylik daromad (joyi almashdi). */}
        <View style={styles.metricGrid}>
          <MetricCard
            accent={RED}
            accentBg={rd.color.errorBg}
            Icon={ArrowDownLeft}
            label={t('Oylik xarajat')}
            lines={currencyTotalsCompact(expenses?.by_currency)}
            sub={t('Bu oy')}
            onPress={() => navigation.navigate('FinanceExpenseList')}
          />
          <MetricCard
            accent={GREEN}
            accentBg={rd.color.successBg}
            Icon={ArrowUpRight}
            label={t('Oylik daromad')}
            lines={currencyTotalsCompact(incomes?.by_currency)}
            sub={t('Bu oy')}
            onPress={() => navigation.navigate('FinanceIncomeList')}
          />
        </View>

        {/* 4. Budjet — SS1: Limit menyu kartasi olib tashlandi, shu yerda "Batafsil" bor.
            SS15: "Shu oy" guruhiga ko‘chirildi (oylik limit = shu oy holati). */}
        {budget && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('FinanceBudget')}
            style={styles.card}>
            <View style={styles.budgetHead}>
              {/* SS1: "Batafsil" sarlavha yonidan OLINDI — endi "Qolgan" ostida (mantiqan mos). */}
              <Text allowFontScaling={false} style={styles.cardTitle}>
                {t('Oylik limit')}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.budgetPct,
                  {
                    color:
                      num(budget?.percentage) >= 100
                        ? RED
                        : num(budget?.percentage) >= 90
                        ? '#f59e0b'
                        : GREEN,
                  },
                ]}>
                {num(budget?.percentage)}%
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, num(budget?.percentage))}%`,
                    backgroundColor:
                      num(budget?.percentage) >= 100
                        ? RED
                        : num(budget?.percentage) >= 90
                        ? '#f59e0b'
                        : GREEN,
                  },
                ]}
              />
            </View>
            <View style={styles.budgetRow}>
              <View>
                <Text allowFontScaling={false} style={styles.budgetSmallLabel}>
                  {t('Sarflandi')}
                </Text>
                <Text allowFontScaling={false} style={styles.budgetSmallValue}>
                  {fCompact(budget?.spent)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text allowFontScaling={false} style={styles.budgetSmallLabel}>
                  {t('Reja')}
                </Text>
                <Text allowFontScaling={false} style={styles.budgetSmallValue}>
                  {fCompact(budget?.planned)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text allowFontScaling={false} style={styles.budgetSmallLabel}>
                  {t('Qolgan')}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.budgetSmallValue,
                    { color: num(budget?.remaining) < 0 ? RED : GREEN },
                  ]}>
                  {fCompact(budget?.remaining)}
                </Text>
                {/* SS1: "Batafsil ›" — aynan "Qolgan" ostida. */}
                <Text allowFontScaling={false} style={styles.budgetMore}>
                  {t('Batafsil')} ›
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 3b. Qo'shimcha menyu — SS3: "Maqsadlar" (Qarzdorlar o'rnida), "Tahlil"
            (yuqoridagi quickRow'dan), "Tavsiyalar" OLIB TASHLANDI (health-ikonkaga
            ko'chdi), "Rejalashtirilgan to'lovlar"+"Kutilayotgan daromad" BIR QATORDA. */}
        <SectionTitle text={t('Bo‘limlar')} color={BLUE} />
        <View style={styles.menuGrid}>
          {MENU.map(m => {
            const Icon = m.Icon;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.mCard, { backgroundColor: m.tint, borderColor: m.accent + '22' }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(m.route as never)}>
                <View style={styles.mIcon}>
                  <Icon size={rs(20)} color={m.accent} />
                </View>
                <Text allowFontScaling={false} style={styles.mTitle} numberOfLines={2}>
                  {m.title}
                </Text>
                <Text allowFontScaling={false} style={[styles.mSub, { color: m.accent }]} numberOfLines={1}>
                  {m.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>


        {/* 5. SS4: Pul oqimi (Joriy oy / Oylar kesimida + filtr) */}
        {/* SS15: sarlavha "Tahlil" EMAS — menyudagi "Tahlil" kartasi bilan yonma-yon
            tushib, ikkita bir xil yozuv chiqib qolardi. "Hisobotlar" aniqroq. */}
        <SectionTitle text={t('Hisobotlar')} color={'#0ea5e9'} />
        {/* SS18 (2026-09-14): KALENDAR endi "Hisobotlar" bo'limining BIRINCHI
            elementi — ilgari sahifaning eng pastida, "So'nggi amaliyotlar"dan
            keyin turardi va uni topish uchun butun sahifani aylantirish kerak
            edi. Tartib: Kalendar -> Pul oqimi -> Daromadlar -> Xarajatlar. */}
        <FinanceCalendarCard />
        {((d?.daily_series || []).some(
          (x: any) => num(x?.income) > 0 || num(x?.expense) > 0,
        ) ||
          (d?.monthly_series || []).some(
            (x: any) => num(x?.income) > 0 || num(x?.expense) > 0,
          )) && <FlowChart daily={d?.daily_series} monthly={d?.monthly_series} />}

        {/* 6a. Daromadlar kategoriya bo'yicha */}
        <SectionTitle text={t('Daromadlar')} color={GREEN} />
        <View style={styles.card}>
          <CategoryList items={incomes?.by_category} empty={t('Daromadlar mavjud emas.')} />
        </View>

        {/* 6b. Xarajatlar kategoriya bo'yicha */}
        <SectionTitle text={t('Xarajatlar')} color={RED} />
        <View style={styles.card}>
          <CategoryList items={expenses?.top_categories} empty={t('Xarajatlar mavjud emas.')} />
        </View>

        {/* 7. So'nggi amaliyotlar */}
        <SectionTitle text={t('So‘nggi amaliyotlar')} color={rd.color.textSecondary} />
        <View style={styles.card}>
          {recent.length === 0 ? (
            <View style={styles.emptyBox}>
              <CircleIcon size={rs(40)} bg={rd.color.surfaceAlt}>
                <CoinIcon size={rs(22)} color={rd.color.textTertiary} />
              </CircleIcon>
              <Text allowFontScaling={false} style={styles.emptyText}>
                {t('Amaliyotlar mavjud emas.')}
              </Text>
            </View>
          ) : (
            recent.map((r, i) => {
              const isIncome = r._kind === 'income';
              const c = isIncome ? GREEN : RED;
              return (
                <View key={i} style={[styles.txRow, i === 0 && { borderTopWidth: 0 }]}>
                  <CircleIcon size={rs(34)} bg={isIncome ? rd.color.successBg : rd.color.errorBg}>
                    {isIncome ? (
                      <ArrowUpRight size={rs(15)} color={c} />
                    ) : (
                      <ArrowDownLeft size={rs(15)} color={c} />
                    )}
                  </CircleIcon>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.txTitle} numberOfLines={1}>
                      {r?.description || catLabel(r?.category?.name)}
                    </Text>
                    <Text allowFontScaling={false} style={styles.txMeta} numberOfLines={1}>
                      {catLabel(r?.category?.name)} · {fDate(r?._date)}
                    </Text>
                  </View>
                  <Text allowFontScaling={false} style={[styles.txAmount, { color: c }]} numberOfLines={1}>
                    {isIncome ? '+' : '−'}
                    {fCompact(r?.amount, r?.currency || 'UZS')}
                  </Text>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
};

export default ShaxsiyMoliya;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(14),
  },
  // SS15: bo'lim sarlavhasi — rangli aksent chizig'i + matn.
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(6),
    marginBottom: rs(-6),
  },
  sectionBar: { width: rs(3), height: rs(15), borderRadius: rs(2) },
  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
  },

  // Hero (SS21 gradient)
  fmHero: {
    borderRadius: rs(22),
    overflow: 'hidden',
    padding: rs(18),
    shadowColor: GRAD_BRAND[1],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  // SS19: hero ichida holat va amallarni ajratuvchi nozik chiziq.
  fmHeroSep: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginTop: rs(12),
  },
  fmHeroBtns: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  fmHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    borderRadius: rs(14),
    paddingVertical: rs(11),
    paddingHorizontal: rs(6),
  },
  fmHeroBtnLight: { backgroundColor: rd.color.onPrimary },
  fmHeroBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13) },

  // Tezkor tugmalar
  quickRow: { flexDirection: 'row', gap: rs(8) },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: rs(6),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(12),
    paddingHorizontal: rs(4),
  },
  quickLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.text,
    textAlign: 'center',
  },

  healthLabelRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  healthLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: 'rgba(255,255,255,0.92)',
  },
  healthScoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: rs(6) },
  healthScore: { fontFamily: rd.font.bold, fontSize: rs(40), color: rd.color.onPrimary },
  healthScoreMax: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: rs(7),
    marginLeft: rs(2),
  },
  healthStatus: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.onPrimary,
    marginTop: rs(2),
  },
  healthChips: { flexDirection: 'row', gap: rs(10), marginTop: rs(16) },
  healthChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: rs(14),
    padding: rs(12),
  },
  healthChipLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: 'rgba(255,255,255,0.85)',
  },
  healthChipValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
    marginTop: rs(4),
  },

  healthTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthAdviceBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  healthScoreInline: { flexDirection: 'row', alignItems: 'flex-end', flex: 1 },
  healthScore2: { fontFamily: rd.font.bold, fontSize: rs(26), color: rd.color.onPrimary },
  healthScoreMax2: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: rs(3),
    marginLeft: rs(1),
  },
  healthStatusInline: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: rs(4),
    flexShrink: 1,
  },
  healthQoldiq: { alignItems: 'flex-end', maxWidth: '46%' },
  healthQoldiqLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11),
    color: 'rgba(255,255,255,0.85)',
  },
  healthQoldiqVal: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
    marginTop: rs(1),
  },

  // Metric grid
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },

  // Qo'shimcha menyu (Byudjet / Tavsiyalar / To'lovlar / Kutilayotgan daromad) — 2×2
  // N14 inline qarz-summary karta
  debtCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    gap: rs(12),
  },
  debtHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  debtTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  debtMore: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.primary },
  debtRow: { flexDirection: 'row', alignItems: 'center' },
  debtCol: { flex: 1, alignItems: 'center', gap: rs(3) },
  debtDivider: { width: 1, alignSelf: 'stretch', backgroundColor: rd.color.border, marginVertical: rs(2) },
  debtLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  debtVal: { fontFamily: rd.font.bold, fontSize: rs(17) },
  debtNetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    paddingTop: rs(10),
  },
  debtNetLabel: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  debtNetVal: { fontFamily: rd.font.bold, fontSize: rs(15) },
  debtBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  debtBadge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(10), paddingVertical: rs(5) },
  debtBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(11.5) },

  menuRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginTop: rs(14) },
  menuCard: {
    width: '47.6%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(13),
    paddingHorizontal: rs(12),
    minHeight: rs(62),
  },
  menuIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // So'rov: uzun yorliq (masalan "Rejalashtirilgan to'lovlar") KESILMASDAN sig'ishi
  // uchun flex:1 + kichikroq shrift + qatorlar.
  menuLabel: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5), lineHeight: rs(16), color: rd.color.text },
  // img1: zamonaviy "mahsulot kartalari" menyu
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginTop: rs(14) },
  mCard: {
    width: '47.6%',
    flexGrow: 1,
    borderRadius: rs(18),
    borderWidth: 1,
    paddingVertical: rs(14),
    paddingHorizontal: rs(14),
    minHeight: rs(104),
  },
  mIcon: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
    shadowColor: '#0b1220',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  mTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), lineHeight: rs(17), color: rd.color.text },
  mSub: { fontFamily: rd.font.medium, fontSize: rs(11), marginTop: rs(3) },
  metric: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    overflow: 'hidden',
  },
  metricAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(4) },
  metricHead: { flexDirection: 'row', marginBottom: rs(8), marginTop: rs(2) },
  metricLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    minHeight: rs(30),
  },
  metricValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(14),
    color: rd.color.text,
    marginTop: rs(3),
  },
  metricValueSm: { fontSize: rs(11.5), color: rd.color.textSecondary, marginTop: rs(1) },
  metricSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(11),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Generic card
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
  },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  // Budget
  budgetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
  },
  budgetPct: { fontFamily: rd.font.bold, fontSize: rs(15) },
  budgetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  budgetMore: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.primary, marginTop: rs(4) },
  barTrack: {
    height: rs(10),
    borderRadius: rd.radius.pill,
    overflow: 'hidden',
    backgroundColor: rd.color.surfaceAlt,
  },
  barFill: { height: '100%', borderRadius: rd.radius.pill },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(12),
  },
  budgetSmallLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  budgetSmallValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
    marginTop: rs(3),
  },

  // Daily chart
  chartHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(10) },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: rs(8), height: rs(8), borderRadius: rs(4), marginRight: rs(4) },
  legendText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
  // SS4: Joriy oy / Oylar kesimida tablar
  flowTabs: {
    flexDirection: 'row',
    gap: rs(2),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rs(9),
    padding: rs(2),
  },
  flowTab: { paddingHorizontal: rs(10), paddingVertical: rs(5), borderRadius: rs(7) },
  flowTabOn: {
    backgroundColor: rd.color.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  flowTabText: { fontFamily: rd.font.semibold, fontSize: rs(11), color: rd.color.textTertiary },
  flowTabTextOn: { color: rd.color.text },
  chartBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: rs(1),
  },
  chartCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1,
    height: '100%',
  },
  chartBar: { width: rs(2.5), borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  chartAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rs(6) },
  axisText: { fontFamily: rd.font.regular, fontSize: rs(10), color: rd.color.textTertiary },

  // Categories
  catRow: { paddingVertical: rs(9) },
  catTop: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  catDot: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  catName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  catAmount: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text },
  catBarTrack: {
    height: rs(6),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(6),
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: rd.radius.pill },

  // Recent tx
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(11),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  txTitle: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  txMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  txAmount: { fontFamily: rd.font.bold, fontSize: rs(13) },

  // Empty
  emptyBox: { alignItems: 'center', gap: rs(8), paddingVertical: rs(20) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary },
});
