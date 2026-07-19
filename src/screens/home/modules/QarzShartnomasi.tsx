/**
 * QarzShartnomasi.tsx — "Qarz shartnomasi" moduli (veb dashboard'ining mobil ko'rinishi).
 *
 * Ma'lumot REAL: /home/my?type=debitor va /home/my?type=creditor (useFetch).
 *   - data.data.chart.{jarayon, tugallangan, rad}  → statistika donut'lari
 *   - data.data.data                                → qarzdorlik summalari (residual_amount, currency)
 *   - data.data.expired                             → muddati o'tgan qarzlar
 *   - data.data.five                                → muddati oz qolgan qarzlar (jadval)
 * Ism REAL: HomeReducer.user.data.first_name (Redux).
 *
 * Dizayn: rd/rs tokenlari (HomeRedesign uslubi — gradient hero, oq kartalar).
 * Literal hex faqat gradient/pie ranglarida.
 */
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useFetch } from '../../../hooks/useFetch';
import { rd, rs } from '../../../theme/rd';
import { URL } from '../../constants';
import Loading from '../../components/Loading';
import { getDueMeta, sortText } from '../../components/StatisticCard';
import Donut from '../redesign/Donut';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChartIcon,
  ChevronRight,
  ClockIcon,
  IconProps,
} from '../redesign/icons';
import { debtNav, DebtRole, DebtTab } from '../redesign/debtNav';

// Pie/gradient ranglari (literal hex faqat shu yerda ruxsat etilgan).
const C_JARAYON = '#2f6fed'; // jarayonda — ko'k
const C_TUGALLANGAN = '#16a34a'; // tugallangan — yashil
const C_RAD = '#f59e0b'; // rad etildi — sariq/orange
const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;

type Row = {
  residual_amount?: number | string;
  amount?: number | string;
  currency?: string;
  end_date?: string;
  creditor_name?: string;
  debitor_name?: string;
};
type MyData = {
  chart?: { jarayon?: number; tugallangan?: number; rad?: number };
  five?: Row[];
  expired?: Row[];
  data?: Row[];
};

// ---------- Yordamchi ----------
const num = (v: any) => Number(v || 0);
const isCur = (r: Row, cur: string) =>
  String(r?.currency || 'UZS').toUpperCase() === cur;
const sumCur = (rows: Row[] | undefined, cur: string) =>
  (rows || []).reduce((s, r) => (isCur(r, cur) ? s + num(r.residual_amount) : s), 0);

// UZS + (ixtiyoriy) USD matni.
const money = (uzs: number, usd: number) => {
  const parts: string[] = [`${sortText(Math.round(uzs))} so‘m`];
  if (usd > 0) parts.push(`${sortText(Math.round(usd))} $`);
  return parts;
};

// ---------- Gradient fon ----------
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

// ---------- Hero statistika ----------
const HeroStat = ({ value, label }: { value: number | string; label: string }) => (
  <View style={styles.heroStat}>
    <Text style={styles.heroStatValue}>{value}</Text>
    <Text style={styles.heroStatLabel} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

// ---------- Statistika kartasi (donut + legend) ----------
const StatCard = ({ title, chart }: { title: string; chart?: MyData['chart'] }) => {
  const jarayon = num(chart?.jarayon);
  const tugallangan = num(chart?.tugallangan);
  const rad = num(chart?.rad);
  const total = jarayon + tugallangan + rad;
  const legend = [
    { label: 'Jarayonda', color: C_JARAYON, value: jarayon },
    { label: 'Tugallangan', color: C_TUGALLANGAN, value: tugallangan },
    { label: 'Rad etildi', color: C_RAD, value: rad },
  ];
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statBody}>
        <Donut
          segments={total === 0 ? [{ value: 1, color: rd.color.border }] : legend}
          size={rs(96)}
          centerValue={String(total)}
          centerLabel="jami"
        />
        <View style={styles.legend}>
          {legend.map(l => (
            <View key={l.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: l.color }]} />
              <Text style={styles.legendLabel}>{l.label}</Text>
              <Text style={styles.legendCount}>{l.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ---------- Qarzdorlik kartasi (chegara rangli) ----------
const DebtCard = ({
  accent,
  Icon,
  label,
  badge,
  badgeBg,
  badgeColor,
  lines,
  amountColor,
  onPress,
}: {
  accent: string;
  Icon: (p: IconProps) => React.ReactElement;
  label: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  lines: string[];
  amountColor: string;
  onPress?: () => void;
}) => (
  // View -> TouchableOpacity: karta bosilganda tegishli qarzlar ro'yxati ochiladi.
  // onPress berilmasa disabled — bosilmaydigan karta sifatida ishlaydi (regressiyasiz).
  <TouchableOpacity
    activeOpacity={0.85}
    disabled={!onPress}
    onPress={onPress}
    style={[styles.debtCard, { borderColor: accent }]}
  >
    <View style={styles.debtHead}>
      <View style={[styles.debtIcon, { backgroundColor: badgeBg }]}>
        <Icon size={rs(18)} color={accent} />
      </View>
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
      </View>
    </View>
    <Text style={styles.debtLabel}>{label}</Text>
    <Text style={[styles.debtAmount, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit>
      {lines[0]}
    </Text>
    {lines[1] ? <Text style={styles.debtAmountUsd}>{lines[1]}</Text> : null}
    {/* Bosiladigan ekanini bildiruvchi ishora (o'ngda kichik strelka) */}
    {onPress ? (
      <View style={styles.debtGo}>
        <ChevronRight size={rs(15)} color={rd.color.textTertiary} />
      </View>
    ) : null}
  </TouchableOpacity>
);

// ---------- Muddati oz qolgan (segment-toggle + jadval) ----------
const NearCard = ({
  title,
  five,
  onPress,
}: {
  title: string;
  five?: Row[];
  onPress?: () => void;
}) => {
  const [cur, setCur] = useState<'UZS' | 'USD'>('UZS');
  const rows = useMemo(
    () => (five || []).filter(r => isCur(r, cur)),
    [five, cur],
  );
  return (
    // Butun karta bosiladigan. Ichkaridagi UZS/USD tugmalari o'z bosishini
    // o'zlari ushlaydi (RN'da ichki touchable ustun) -> valyuta almashtirish
    // navigatsiyani ishga tushirmaydi.
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={!onPress}
      onPress={onPress}
      style={styles.nearCard}
    >
      <View style={styles.nearHead}>
        <Text style={styles.nearTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.segment}>
          {(['UZS', 'USD'] as const).map(c => {
            const active = cur === c;
            return (
              <TouchableOpacity
                key={c}
                activeOpacity={0.8}
                onPress={() => setCur(c)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.nearEmpty}>
          Hozircha sizda muddati oz qolgan qarzdorliklar mavjud emas.
        </Text>
      ) : (
        <View>
          <View style={styles.tableHead}>
            <Text style={styles.tableHeadCol}>Qolgan vaqt</Text>
            <Text style={[styles.tableHeadCol, styles.tableRight]}>Qarz miqdori</Text>
          </View>
          {rows.map((r, i) => {
            const due = getDueMeta(r.end_date);
            return (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.dueBadge, { backgroundColor: due.bg }]}>
                  <Text style={[styles.dueBadgeText, { color: due.color }]}>{due.label}</Text>
                </View>
                <Text style={[styles.tableAmount, styles.tableRight]} numberOfLines={1}>
                  {sortText(num(r.residual_amount))} {r.currency || 'UZS'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Bosiladigan ekanini bildiruvchi pastki qator */}
      {onPress ? (
        <View style={styles.nearMore}>
          <Text style={styles.nearMoreText}>Barchasini ko‘rish</Text>
          <ChevronRight size={rs(15)} color={rd.color.primary} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// ---------- Hisobot kartasi ----------
const ReportCard = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.85} style={styles.reportCard} onPress={onPress}>
    <View style={styles.reportIcon}>
      <BarChartIcon size={rs(20)} color={rd.color.primary} />
    </View>
    <Text style={styles.reportLabel} numberOfLines={2}>
      {label}
    </Text>
    <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
  </TouchableOpacity>
);

// Hisobot ro'yxatiga navigatsiya paramlari (Statistic.tsx bilan bir xil — SearchDebitor
// real /contract/report endpointidan to'liq ro'yxatni yuklaydi).
const REPORT_NAV = {
  debitor: {
    title: 'Debitor qarzdorlik',
    type: 1,
    person: 'debitor',
    isHave: false,
    url: '/contract/report?type=debitor&page=1&limit=1000&status=all&start=0&end=0',
    searchUrl: '/contract/report/search?type=debitor&page=1&limit=500&search=',
    iconType: 3,
  },
  creditor: {
    title: 'Kreditor qarzdorlik',
    type: 3,
    person: 'creditor',
    isHave: false,
    url: '/contract/report?type=creditor&page=1&limit=1000&status=all&start=0&end=0',
    searchUrl: '/contract/report/search?type=creditor&page=1&limit=500&search=',
    iconType: 3,
  },
};

// ---------- Ekran ----------
const QarzShartnomasi = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((s: any) => s.HomeReducer);
  const name = user?.data?.first_name || 'foydalanuvchi';

  const debitor = useFetch({ url: `${URL}/home/my?type=debitor`, method: 'GET' });
  const creditor = useFetch({ url: `${URL}/home/my?type=creditor`, method: 'GET' });

  if (debitor.loading && creditor.loading) {
    return <Loading />;
  }

  const deb: MyData = (debitor.data as any)?.data || {};
  const cred: MyData = (creditor.data as any)?.data || {};

  // Debitor/Kreditor — JORIY (jarayondagi) shartnomalar soni.
  // Ilgari `data.length` ishlatilardi, lekin u sahifalangan ro'yxatning yuklangan
  // uzunligi (limit bilan cheklangan) — shu sabab "debitorda 2 / kreditorda 2,
  // lekin faol shartnomalarda 16" nomuvofiqligi chiqardi. chart.jarayon esa
  // backend hisoblagan haqiqiy joriy shartnomalar soni.
  const debCount = num(deb.chart?.jarayon);
  const credCount = num(cred.chart?.jarayon);
  // Eski "Faol shartnomalar" = debCount + credCount bo'lgani uchun endi takror
  // bo'lardi. O'rniga tugallangan shartnomalar soni ko'rsatiladi — natijada
  // to'liq hayot-sikl: joriy (debitor/kreditor) -> tugallangan -> muddati o'tgan.
  const completedCount =
    num(deb.chart?.tugallangan) + num(cred.chart?.tugallangan);
  const expiredCount = (deb.expired?.length || 0) + (cred.expired?.length || 0);

  // Karta bosilganda qarzlar ro'yxatiga (SearchDebitor) o'tish.
  // `tab` mavjud filtrni darhol ochadi: 'overdue' — muddati o'tganlar,
  // 'near' — muddati oz qolganlar, 'all' — barchasi.
  const goList = (role: DebtRole, tab: DebtTab, title: string) =>
    navigation.navigate('SearchDebitor', debtNav(role, tab, title));

  // Qarzdorlik summalari (valyuta bo'yicha alohida).
  const debGivenUzs = sumCur(deb.data, 'UZS');
  const debGivenUsd = sumCur(deb.data, 'USD');
  const debExpUzs = sumCur(deb.expired, 'UZS');
  const debExpUsd = sumCur(deb.expired, 'USD');
  const credTakenUzs = sumCur(cred.data, 'UZS');
  const credTakenUsd = sumCur(cred.data, 'USD');
  const credExpUzs = sumCur(cred.expired, 'UZS');
  const credExpUsd = sumCur(cred.expired, 'USD');

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader
        title="Qarz shartnomasi"
        onBack={() =>
          navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={debitor.loading && creditor.loading}
            onRefresh={() => {
              debitor.onRefresh({});
              creditor.onRefresh({});
            }}
            tintColor={rd.color.primary}
            colors={[rd.color.primary]}
          />
        }
      >
        {/* 1. Hero banner */}
        <View style={styles.hero}>
          <Grad id="qshHero" colors={GRAD_BRAND} />
          <Text style={styles.heroTitle} numberOfLines={2}>
            Xush kelibsiz, {name}!
          </Text>
          <Text style={styles.heroSub} numberOfLines={2}>
            Shartnomalarni elektron rasmiylashtiring va oson boshqaring.
          </Text>
          <View style={styles.heroBtns}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.heroBtn, styles.heroBtnLight]}
              onPress={() => navigation.navigate('SearchUserScreen', { type: 1 })}
            >
              <ArrowUpRight size={rs(18)} color={rd.color.primary} />
              <Text style={[styles.heroBtnText, { color: rd.color.primary }]}>Qarz berish</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.heroBtn, { backgroundColor: rd.color.success }]}
              onPress={() => navigation.navigate('SearchUserScreen', { type: 0 })}
            >
              <ArrowDownLeft size={rs(18)} color={rd.color.onPrimary} />
              <Text style={[styles.heroBtnText, { color: rd.color.onPrimary }]}>Qarz olish</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroStats}>
            <HeroStat value={debCount} label="Debitor qarzdorlik" />
            <HeroStat value={credCount} label="Kreditor qarzdorlik" />
            <HeroStat value={completedCount} label="Tugallangan" />
            <HeroStat value={expiredCount} label="Muddati o‘tgan" />
          </View>
        </View>

        {/* 2. Shartnomalar statistikasi */}
        <Text style={styles.blockTitle}>Shartnomalar statistikasi</Text>
        <StatCard title="Debitor qarzdorlik" chart={deb.chart} />
        <StatCard title="Kreditor qarzdorlik" chart={cred.chart} />

        {/* 3. Qarzdorliklar */}
        <Text style={styles.blockTitle}>Qarzdorliklar</Text>
        <View style={styles.debtGrid}>
          <DebtCard
            accent={rd.color.primary}
            Icon={ArrowUpRight}
            label="Berilgan qarz"
            badge="Olish kerak"
            badgeBg={rd.color.primaryTint}
            badgeColor={rd.color.primary}
            amountColor={rd.color.text}
            lines={money(debGivenUzs, debGivenUsd)}
            onPress={() => goList('debitor', 'all', 'Berilgan qarz')}
          />
          <DebtCard
            accent={rd.color.error}
            Icon={ClockIcon}
            label="Muddati o‘tgan (debitor)"
            badge="Muddati o‘tgan"
            badgeBg={rd.color.errorBg}
            badgeColor={rd.color.error}
            amountColor={rd.color.error}
            lines={money(debExpUzs, debExpUsd)}
            onPress={() => goList('debitor', 'overdue', 'Muddati o‘tgan (debitor)')}
          />
          <DebtCard
            accent={rd.color.success}
            Icon={ArrowDownLeft}
            label="Olingan qarz"
            badge="Berish kerak"
            badgeBg={rd.color.successBg}
            badgeColor={rd.color.success}
            amountColor={rd.color.text}
            lines={money(credTakenUzs, credTakenUsd)}
            onPress={() => goList('creditor', 'all', 'Olingan qarz')}
          />
          <DebtCard
            accent={rd.color.error}
            Icon={ClockIcon}
            label="Muddati o‘tgan (kreditor)"
            badge="Muddati o‘tgan"
            badgeBg={rd.color.errorBg}
            badgeColor={rd.color.error}
            amountColor={rd.color.error}
            lines={money(credExpUzs, credExpUsd)}
            onPress={() => goList('creditor', 'overdue', 'Muddati o‘tgan (kreditor)')}
          />
        </View>

        {/* 4. Muddati oz qolgan */}
        <Text style={styles.blockTitle}>Muddati oz qolgan qarzdorliklar</Text>
        <NearCard
          title="Muddati oz qolgan debitor qarzdorliklar"
          five={deb.five}
          onPress={() => goList('debitor', 'near', 'Muddati oz qolgan (debitor)')}
        />
        <NearCard
          title="Muddati oz qolgan kreditor qarzdorliklar"
          five={cred.five}
          onPress={() => goList('creditor', 'near', 'Muddati oz qolgan (kreditor)')}
        />

        {/* 5. Hisobotlar */}
        <Text style={styles.blockTitle}>Hisobotlar</Text>
        <ReportCard
          label="Hisobot (debitor qarzdorliklar)"
          onPress={() => navigation.navigate('SearchDebitor', REPORT_NAV.debitor)}
        />
        <ReportCard
          label="Hisobot (kreditor qarzdorliklar)"
          onPress={() => navigation.navigate('SearchDebitor', REPORT_NAV.creditor)}
        />
      </ScrollView>
    </View>
  );
};

export default QarzShartnomasi;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { padding: rs(16), gap: rs(16), paddingBottom: rs(28) },

  // Hero
  // KICHRAYTIRILDI: hero ilgari kichik ekranlarda sahifaning yarmidan ko'pini
  // egallardi. Barcha o'lchamlar rs() orqali — ya'ni har qanday ekranda
  // proporsional kichrayadi, kichik telefonlarda ham mos tushadi.
  hero: {
    borderRadius: rs(18),
    overflow: 'hidden',
    padding: rs(16),
    shadowColor: GRAD_BRAND[1],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.onPrimary },
  heroSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: 'rgba(255,255,255,0.9)',
    marginTop: rs(4),
    lineHeight: rs(16),
  },
  heroBtns: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(5),
    borderRadius: rs(12),
    paddingVertical: rs(10),
  },
  heroBtnLight: { backgroundColor: rd.color.surface },
  heroBtnText: { fontFamily: rd.font.semibold, fontSize: rs(12.5) },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: rs(14), gap: rs(10) },
  heroStat: { width: '45%', flexGrow: 1 },
  heroStatValue: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.onPrimary },
  heroStatLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(10.5),
    color: 'rgba(255,255,255,0.85)',
    marginTop: rs(2),
  },

  // Blok sarlavhasi
  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    marginBottom: rs(-6),
  },

  // Statistika kartasi
  statCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  statTitle: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  statBody: { flexDirection: 'row', alignItems: 'center', gap: rs(16), marginTop: rs(12) },
  legend: { flex: 1, gap: rs(10) },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  dot: { width: rs(9), height: rs(9), borderRadius: rs(4.5) },
  legendLabel: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textSecondary },
  legendCount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },

  // Qarzdorlik kartalari
  debtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  debtCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1.5,
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
  },
  // Bosiladigan karta ishorasi. `position: absolute` — kontent oqimiga ta'sir
  // qilmaydi, shuning uchun kichik ekranlarda ham matnni siqib qo'ymaydi.
  debtGo: {
    position: 'absolute',
    right: rs(9),
    bottom: rs(9),
    opacity: 0.65,
  },
  debtHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  debtIcon: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(3) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(9.5) },
  debtLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(12),
  },
  debtAmount: { fontFamily: rd.font.bold, fontSize: rs(16), marginTop: rs(4) },
  debtAmountUsd: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Muddati oz qolgan
  nearCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  // "Barchasini ko'rish" pastki qatori — kartaning bosiladiganini bildiradi.
  nearMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(4),
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  nearMoreText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.primary,
  },
  nearHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  nearTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  segment: {
    flexDirection: 'row',
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.pill,
    padding: rs(3),
  },
  segmentBtn: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    borderRadius: rd.radius.pill,
  },
  segmentBtnActive: { backgroundColor: rd.color.primary },
  segmentText: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary },
  segmentTextActive: { color: rd.color.onPrimary },
  nearEmpty: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    textAlign: 'center',
    paddingVertical: rs(20),
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(14),
    paddingBottom: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  tableHeadCol: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary },
  tableRight: { textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(10),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
    gap: rs(10),
  },
  dueBadge: { paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rd.radius.pill },
  dueBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(11) },
  tableAmount: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },

  // Hisobot kartasi
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  reportIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportLabel: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
});
