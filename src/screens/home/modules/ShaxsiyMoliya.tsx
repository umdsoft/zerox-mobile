/**
 * ShaxsiyMoliya.tsx — "Shaxsiy moliya" moduli (web /finance dashboard bilan bir xil).
 *
 * Barcha ma'lumot REAL backend'dan olinadi:
 *   GET /finance/dashboard  → qarzlar, xarajatlar, byudjet, maqsadlar
 *   GET /finance/health     → moliyaviy sog'liq ball (0..100) + status
 *
 * Web tuzilma (pages/finance/index.vue) tartibi:
 *   1) Moliyaviy sog'liq kartasi (yashil gradient) — ball + status + jami qarz/muddati o'tgan
 *   2) 4 ta ko'rsatkich: Olingan qarz / Berilgan qarz / Oylik xarajat / Maqsadlar jarayoni
 *   3) Byudjet progress (agar bo'lsa)
 *   4) Yaqinlashgan to'lovlar
 *   5) Asosiy kategoriyalar (joriy oy)
 *   6) So'nggi xarajatlar
 *
 * Dizayn: FAQAT rd/rs tokenlari; literal hex faqat gradient/bar/kategoriya ranglarida.
 */
import { useNavigation } from '@react-navigation/native';
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
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { getDueMeta, sortText } from '../../components/StatisticCard';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChartIcon,
  ChevronRight,
  ClockIcon,
  CoinIcon,
  IconProps,
  PlusIcon,
  ShieldIcon,
} from '../redesign/icons';

type Nav = (route: string, params?: object) => void;

// Gradient / progress / kategoriya ranglari (dizayn tizimidan tashqari — faqat shu joyda literal).
const GRAD_GREEN = ['#22c55e', '#0d9488'] as const;
const RED = '#dc2626';
const GREEN = '#16a34a';
const BLUE = '#2f6fed';
const PURPLE = '#7c3aed';
// Top-kategoriya pie ranglari (web chartColors palitrasi bilan mos).
const CAT_COLORS = ['#2f6fed', '#22c55e', '#f59e0b', '#e11d48', '#7c3aed', '#0ea5e9'];

// Sog'liq status → uzbekcha (web finance.health_* bilan mos).
const STATUS_UZ: Record<string, string> = {
  excellent: 'A’lo',
  good: 'Yaxshi',
  fair: 'O‘rtacha',
  poor: 'Yomon',
};

const uzsText = (n: number) => `${sortText(n) || 0} UZS`;

// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// ---------- Kichik komponentlar ----------
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

const CircleIcon = ({
  size,
  bg,
  children,
}: {
  size: number;
  bg: string;
  children: React.ReactNode;
}) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </View>
);

// Moliyaviy sog'liq kartasi — yashil gradient, ball + status + 2 chip.
const HealthCard = ({
  score,
  status,
  totalDebt,
  overdue,
}: {
  score: number;
  status: string;
  totalDebt: number;
  overdue: number;
}) => (
  <View style={styles.health}>
    <Grad id="fmHealth" colors={GRAD_GREEN} />
    <View style={styles.healthTop}>
      <View style={{ flex: 1 }}>
        <View style={styles.healthLabelRow}>
          <ShieldIcon size={rs(16)} color={rd.color.onPrimary} />
          <Text style={styles.healthLabel}>Moliyaviy sog‘liq</Text>
        </View>
        <View style={styles.healthScoreRow}>
          <Text style={styles.healthScore}>{score}</Text>
          <Text style={styles.healthScoreMax}>/100</Text>
        </View>
        <Text style={styles.healthStatus}>{STATUS_UZ[status] || status}</Text>
      </View>
    </View>
    <View style={styles.healthChips}>
      <View style={styles.healthChip}>
        <Text style={styles.healthChipLabel}>Jami qarz</Text>
        <Text style={styles.healthChipValue} numberOfLines={1} adjustsFontSizeToFit>
          {uzsText(totalDebt)}
        </Text>
      </View>
      <View style={styles.healthChip}>
        <Text style={styles.healthChipLabel}>Muddati o‘tgan</Text>
        <Text style={styles.healthChipValue}>{overdue} ta</Text>
      </View>
    </View>
  </View>
);

// Ko'rsatkich kartasi (rangli aksent chizig'i bilan).
const MetricCard = ({
  accent,
  accentBg,
  Icon,
  label,
  value,
  sub,
  onPress,
}: {
  accent: string;
  accentBg: string;
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.9 : 1}
    onPress={onPress}
    style={styles.metric}
  >
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <View style={styles.metricHead}>
      <CircleIcon size={rs(30)} bg={accentBg}>
        <Icon size={rs(16)} color={accent} />
      </CircleIcon>
    </View>
    <Text style={styles.metricLabel} numberOfLines={2}>
      {label}
    </Text>
    <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    {!!sub && <Text style={styles.metricSub}>{sub}</Text>}
  </TouchableOpacity>
);

// Byudjet progress kartasi.
const BudgetCard = ({
  planned,
  spent,
  remaining,
  percentage,
}: {
  planned: number;
  spent: number;
  remaining: number;
  percentage: number;
}) => {
  const pct = Math.max(0, Math.min(100, percentage || 0));
  const barColor = pct >= 100 ? RED : pct >= 90 ? '#f59e0b' : GREEN;
  return (
    <View style={styles.card}>
      <View style={styles.budgetHead}>
        <Text style={styles.cardTitle}>Oylik byudjet</Text>
        <Text style={[styles.budgetPct, { color: barColor }]}>{pct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.budgetRow}>
        <View>
          <Text style={styles.budgetSmallLabel}>Sarflandi</Text>
          <Text style={styles.budgetSmallValue}>{uzsText(spent)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.budgetSmallLabel}>Reja</Text>
          <Text style={styles.budgetSmallValue}>{uzsText(planned)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.budgetSmallLabel}>Qolgan</Text>
          <Text style={[styles.budgetSmallValue, { color: remaining < 0 ? RED : GREEN }]}>
            {uzsText(remaining)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ---------- Ekran ----------
const ShaxsiyMoliya = () => {
  const navigation = useNavigation<any>();
  const nav: Nav = (route, params) => navigation.navigate(route, params);

  // REAL backend — dashboard + moliyaviy sog'liq.
  const dashboard = useFetch({ url: `${URL}/finance/dashboard`, method: 'GET' });
  const health = useFetch({ url: `${URL}/finance/health`, method: 'GET' });

  const d: any = (dashboard.data as any)?.data || {};
  const h: any = (health.data as any)?.data || {};

  const debts: any = d?.debts || {};
  const expenses: any = d?.expenses || {};
  const budget: any = d?.budget || null;
  const goals: any = d?.goals || {};

  const score = h?.score ?? 0;
  const status = h?.status ?? 'poor';
  const totalDebt = h?.factors?.debt_level ?? debts?.borrowed ?? 0;
  const overdueCount = h?.factors?.overdue_debts ?? (debts?.overdue?.length || 0);

  const upcoming: any[] = debts?.upcoming || [];
  const topCategories: any[] = expenses?.top_categories || [];
  const recent: any[] = expenses?.recent || [];

  // Top-kategoriyalar jami (foiz uchun).
  const catTotal = topCategories.reduce(
    (s, c) => s + Number(c?.total || 0),
    0,
  );

  const soon = () =>
    Toast.show({
      type: 'info',
      text1: 'Tez kunda',
      text2: 'Bu amal mobil ilovada tez orada ishga tushadi.',
    });

  if (dashboard.loading && health.loading) {
    return <Loading />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title="Shaxsiy moliya" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 1. Moliyaviy sog'liq */}
        <HealthCard
          score={score}
          status={status}
          totalDebt={totalDebt}
          overdue={overdueCount}
        />

        {/* 2. Ko'rsatkichlar */}
        <View style={styles.metricGrid}>
          <MetricCard
            accent={RED}
            accentBg={rd.color.errorBg}
            Icon={ArrowDownLeft}
            label="Olingan qarz"
            value={uzsText(debts?.borrowed || 0)}
            onPress={soon}
          />
          <MetricCard
            accent={GREEN}
            accentBg={rd.color.successBg}
            Icon={ArrowUpRight}
            label="Berilgan qarz"
            value={uzsText(debts?.lent || 0)}
            onPress={soon}
          />
          <MetricCard
            accent={BLUE}
            accentBg={rd.color.primaryTint}
            Icon={CoinIcon}
            label="Oylik xarajat"
            value={uzsText(expenses?.monthly_total || 0)}
            sub="Bu oy"
            onPress={soon}
          />
          <MetricCard
            accent={PURPLE}
            accentBg="#efe7fd"
            Icon={BarChartIcon}
            label="Maqsadlar jarayoni"
            value={`${goals?.progress || 0}%`}
            sub={`${goals?.active_count || 0} ta faol`}
            onPress={soon}
          />
        </View>

        {/* 3. Byudjet */}
        {budget && (
          <BudgetCard
            planned={budget?.planned || 0}
            spent={budget?.spent || 0}
            remaining={budget?.remaining || 0}
            percentage={budget?.percentage || 0}
          />
        )}

        {/* 4. Yaqinlashgan to'lovlar */}
        <Text style={styles.blockTitle}>Yaqinlashgan to‘lovlar</Text>
        <View style={styles.card}>
          {upcoming.length === 0 ? (
            <View style={styles.emptyBox}>
              <CircleIcon size={rs(40)} bg={rd.color.surfaceAlt}>
                <ClockIcon size={rs(22)} color={rd.color.textTertiary} />
              </CircleIcon>
              <Text style={styles.emptyText}>Yaqinlashgan to‘lovlar yo‘q.</Text>
            </View>
          ) : (
            upcoming.map((r, i) => {
              const isLent = String(r?.type) === 'lent';
              const c = isLent ? GREEN : RED;
              return (
                <View
                  key={i}
                  style={[styles.payRow, i === 0 && { borderTopWidth: 0 }]}
                >
                  <CircleIcon size={rs(34)} bg={isLent ? rd.color.successBg : rd.color.errorBg}>
                    {isLent ? (
                      <ArrowUpRight size={rs(16)} color={c} />
                    ) : (
                      <ArrowDownLeft size={rs(16)} color={c} />
                    )}
                  </CircleIcon>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payName} numberOfLines={1}>
                      {titleCase(r?.person_name)}
                    </Text>
                    <Text style={styles.payDate}>
                      {getDueMeta(r?.due_date)?.date || '—'}
                    </Text>
                  </View>
                  <Text style={[styles.payAmount, { color: c }]} numberOfLines={1}>
                    {uzsText(r?.remaining_amount || 0)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* 5. Asosiy kategoriyalar */}
        <Text style={styles.blockTitle}>Asosiy kategoriyalar</Text>
        <View style={styles.card}>
          {topCategories.length === 0 ? (
            <View style={styles.emptyBox}>
              <CircleIcon size={rs(40)} bg={rd.color.surfaceAlt}>
                <BarChartIcon size={rs(22)} color={rd.color.textTertiary} />
              </CircleIcon>
              <Text style={styles.emptyText}>Xarajatlar mavjud emas.</Text>
            </View>
          ) : (
            topCategories.map((c, i) => {
              const color = c?.color || CAT_COLORS[i % CAT_COLORS.length];
              const pct = catTotal > 0 ? Math.round((Number(c?.total || 0) / catTotal) * 100) : 0;
              return (
                <View key={i} style={[styles.catRow, i === 0 && { borderTopWidth: 0 }]}>
                  <View style={[styles.catDot, { backgroundColor: color }]} />
                  <Text style={styles.catName} numberOfLines={1}>
                    {c?.name || 'Boshqa'}
                  </Text>
                  <Text style={styles.catPct}>{pct}%</Text>
                  <Text style={styles.catAmount} numberOfLines={1}>
                    {uzsText(c?.total || 0)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* 6. So'nggi xarajatlar */}
        <Text style={styles.blockTitle}>So‘nggi xarajatlar</Text>
        <View style={styles.card}>
          {recent.length === 0 ? (
            <View style={styles.emptyBox}>
              <CircleIcon size={rs(40)} bg={rd.color.surfaceAlt}>
                <CoinIcon size={rs(22)} color={rd.color.textTertiary} />
              </CircleIcon>
              <Text style={styles.emptyText}>Xarajatlar mavjud emas.</Text>
            </View>
          ) : (
            recent.map((r, i) => (
              <View key={i} style={[styles.expRow, i === 0 && { borderTopWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expTitle} numberOfLines={1}>
                    {r?.title || r?.description || r?.category?.name || 'Xarajat'}
                  </Text>
                  <Text style={styles.expMeta} numberOfLines={1}>
                    {(r?.category?.name || 'Boshqa') +
                      ' · ' +
                      (getDueMeta(r?.expense_date)?.date || '—')}
                  </Text>
                </View>
                <Text style={styles.expAmount} numberOfLines={1}>
                  −{uzsText(r?.amount || 0)}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.ctaBtn} onPress={soon}>
          <PlusIcon size={rs(18)} color={rd.color.onPrimary} />
          <Text style={styles.ctaText}>Xarajat qo‘shish</Text>
          <ChevronRight size={rs(18)} color={rd.color.onPrimary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ShaxsiyMoliya;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(14),
  },

  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    marginTop: rs(4),
    marginBottom: rs(-4),
  },

  // Health card
  health: {
    borderRadius: rs(22),
    overflow: 'hidden',
    padding: rs(20),
    shadowColor: GRAD_GREEN[1],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  healthTop: { flexDirection: 'row', alignItems: 'flex-start' },
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

  // Metric grid
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  metric: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    overflow: 'hidden',
  },
  metricAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(4) },
  metricHead: { flexDirection: 'row', marginBottom: rs(10), marginTop: rs(2) },
  metricLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    minHeight: rs(32),
  },
  metricValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    marginTop: rs(4),
  },
  metricSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
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
    paddingVertical: rs(6),
  },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  // Budget
  budgetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12),
    marginBottom: rs(10),
  },
  budgetPct: { fontFamily: rd.font.bold, fontSize: rs(15) },
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
    marginBottom: rs(12),
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

  // Upcoming payments
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingVertical: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  payName: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  payDate: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  payAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5) },

  // Categories
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  catDot: { width: rs(12), height: rs(12), borderRadius: rs(6) },
  catName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  catPct: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    width: rs(42),
    textAlign: 'right',
  },
  catAmount: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
    minWidth: rs(90),
    textAlign: 'right',
  },

  // Recent expenses
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  expTitle: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  expMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  expAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: RED },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(14),
    marginTop: rs(4),
  },
  ctaText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.onPrimary },

  // Empty
  emptyBox: { alignItems: 'center', gap: rs(8), paddingVertical: rs(22) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary },
});
