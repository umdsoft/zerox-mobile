/**
 * QarzDaftari.tsx — "Qarz daftari" moduli DASHBOARD'i (web pages/qarz-daftari/index.vue
 * bilan 1:1 tuzilma va ranglar).
 *
 * Qarz daftari — qarz oldi-berdi DAFTARI (ledger). Barcha summalar REAL backend'dan:
 *   GET /qarz-daftari/dashboard        → shartnoma + daftar summalari, usd_rate
 *   GET /qarz-daftari/near-expiration  → muddati yaqin debitor/kreditor qatorlar
 *
 * Web bo'limlar tartibi:
 *   B) Hero banner (Qarz daftari + 2 tugma)
 *   C) Umumiy ko'rinish — 2 chart karta (Berilgan / Olingan): shartnoma vs daftari nisbati
 *   D) Tezkor amallar — Qarzga berish / Qarzga olish
 *   E) Qarzdorliklar — 4 karta (FAQAT daftari o'qiydi)
 *   F) Muddati yaqinlashganlar — 2 jadval (UZS/USD tab)
 *   G) Ogohlantirish banneri (yopiladigan)
 *
 * Web rang semantikasi: berish/berilgan = KO'K, olish/olingan = YASHIL, muddati o'tgan = QIZIL.
 * Dizayn: rd/rs tokenlari; literal hex faqat gradient/bar/aksent ranglarida.
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
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { sortText } from '../../components/StatisticCard';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  ClockIcon,
  CoinIcon,
  IconProps,
  PlusIcon,
  ShieldIcon,
  TransferIcon,
} from '../redesign/icons';

type Nav = (route: string, params?: object) => void;

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const BLUE = '#2f6fed'; // berish / berilgan / shartnoma
const GREEN = '#16a34a'; // olish / olingan / daftari
const RED = '#dc2626'; // muddati o'tgan
const AMBER = '#f59e0b';
const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;

// ---------- Yordamchilar ----------
const uzsText = (n: number) => `${sortText(n) || 0} UZS`;
const usdText = (n: number) => `${sortText(n) || 0} USD`;

// Sanadan necha kun qolganini hisoblaymiz (web daysText mantiqi).
const daysUntil = (end?: string): number | null => {
  if (!end) return null;
  const d = new Date(end);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};
const daysText = (end?: string): string => {
  const n = daysUntil(end);
  if (n === null) return '—';
  if (n < 0) return `${Math.abs(n)} kun o‘tdi`;
  if (n === 0) return 'Bugun';
  if (n === 1) return 'Ertaga';
  return `${n} kun`;
};
const daysColor = (end?: string): string => {
  const n = daysUntil(end);
  if (n === null) return rd.color.textTertiary;
  if (n <= 1) return RED;
  if (n <= 7) return AMBER;
  return BLUE;
};

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

// B) Hero banner — ko'k gradient, 2 tugma.
const Hero = ({ onContract, onAdd }: { onContract: () => void; onAdd: () => void }) => (
  <View style={styles.hero}>
    <Grad id="qdHero" colors={GRAD_BRAND} />
    <Text style={styles.heroTitle}>Qarz daftari</Text>
    <Text style={styles.heroSub}>
      Qarz oldi-berdi munosabatlaringizni elektron boshqaring
    </Text>
    <View style={styles.heroBtns}>
      <TouchableOpacity activeOpacity={0.85} style={styles.heroBtn} onPress={onContract}>
        <TransferIcon size={rs(17)} color={rd.color.primary} />
        <Text style={styles.heroBtnText}>Qarz shartnomasi</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.85} style={styles.heroBtn} onPress={onAdd}>
        <PlusIcon size={rs(17)} color={rd.color.primary} />
        <Text style={styles.heroBtnText}>Daftariga kiritish</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Nisbat bari — ko'k (shartnoma) + yashil (daftar).
const RatioBar = ({ contract, ledger }: { contract: number; ledger: number }) => {
  const total = contract + ledger;
  const cPct = total > 0 ? Math.round((contract / total) * 100) : 0;
  const lPct = total > 0 ? 100 - cPct : 0;
  return (
    <View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { flex: cPct || 0.0001, backgroundColor: BLUE }]} />
        <View style={[styles.barFill, { flex: lPct || 0.0001, backgroundColor: GREEN }]} />
      </View>
      <View style={styles.barLegend}>
        <View style={styles.barLegendItem}>
          <View style={[styles.barDot, { backgroundColor: BLUE }]} />
          <Text style={styles.barLegendText}>Shartnoma {cPct}%</Text>
        </View>
        <View style={styles.barLegendItem}>
          <View style={[styles.barDot, { backgroundColor: GREEN }]} />
          <Text style={styles.barLegendText}>Daftar {lPct}%</Text>
        </View>
      </View>
    </View>
  );
};

// C) Umumiy ko'rinish kartasi (Berilgan / Olingan) — web DashboardChart.
// Jami = (uzs + usd*rate) shartnoma va daftari bo'yicha (nisbat uchun UZS'ga keltiriladi).
const DashboardChartCard = ({
  accent,
  Icon,
  title,
  usdRate,
  shartnomaUzs,
  shartnomaUsd,
  daftariUzs,
  daftariUsd,
}: {
  accent: string;
  Icon: (p: IconProps) => JSX.Element;
  title: string;
  usdRate: number;
  shartnomaUzs: number;
  shartnomaUsd: number;
  daftariUzs: number;
  daftariUsd: number;
}) => {
  const rate = usdRate || 0;
  const shartnomaTotalUzs = shartnomaUzs + shartnomaUsd * rate;
  const daftariTotalUzs = daftariUzs + daftariUsd * rate;
  const totalCombined = shartnomaTotalUzs + daftariTotalUzs;
  const totalUsd = shartnomaUsd + daftariUsd;

  return (
    <View style={styles.card}>
      <View style={styles.ovHead}>
        <CircleIcon size={rs(36)} bg={accent + '1A'}>
          <Icon size={rs(18)} color={accent} />
        </CircleIcon>
        <View style={{ flex: 1 }}>
          <Text style={styles.ovTitle}>{title}</Text>
          <Text style={styles.ovSubtitle}>Shartnoma va daftari nisbati</Text>
        </View>
      </View>

      <Text style={styles.ovTotalLabel}>Jami</Text>
      <Text style={styles.ovTotal} numberOfLines={1} adjustsFontSizeToFit>
        {uzsText(Math.round(totalCombined))}
      </Text>
      {rate > 0 && totalUsd > 0 && (
        <Text style={styles.ovRate}>
          Markaziy bank kursi: 1 USD = {sortText(rate) || 0} UZS
        </Text>
      )}

      <View style={{ marginTop: rs(12) }}>
        <RatioBar contract={shartnomaTotalUzs} ledger={daftariTotalUzs} />
      </View>

      <View style={styles.subRow}>
        <View style={[styles.subCard, { borderColor: BLUE, backgroundColor: '#EFF6FF' }]}>
          <View style={styles.subCardHead}>
            <TransferIcon size={rs(14)} color={BLUE} />
            <Text style={styles.subCardTitle}>Qarz shartnomasi</Text>
          </View>
          <Text style={styles.subCardUzs} numberOfLines={1} adjustsFontSizeToFit>
            {uzsText(shartnomaUzs)}
          </Text>
          <Text style={styles.subCardUsd}>{usdText(shartnomaUsd)}</Text>
        </View>
        <View style={[styles.subCard, { borderColor: GREEN, backgroundColor: '#F0FDF4' }]}>
          <View style={styles.subCardHead}>
            <CoinIcon size={rs(14)} color={GREEN} />
            <Text style={styles.subCardTitle}>Qarz daftari</Text>
          </View>
          <Text style={styles.subCardUzs} numberOfLines={1} adjustsFontSizeToFit>
            {uzsText(daftariUzs)}
          </Text>
          <Text style={styles.subCardUsd}>{usdText(daftariUsd)}</Text>
        </View>
      </View>
    </View>
  );
};

// D) Amal kartasi (Qarzga berish / olish) — chegara rangli.
const ActionCard = ({
  color,
  bg,
  Icon,
  title,
  note,
  onPress,
}: {
  color: string;
  bg: string;
  Icon: (p: IconProps) => JSX.Element;
  title: string;
  note: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={[styles.actionCard, { borderColor: color }]}
    onPress={onPress}
  >
    <CircleIcon size={rs(40)} bg={bg}>
      <Icon size={rs(20)} color={color} />
    </CircleIcon>
    <View style={{ flex: 1 }}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionNote}>{note}</Text>
    </View>
    <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
  </TouchableOpacity>
);

// E) Qarzdorlik summasi kartasi (UZS + USD + holat pill) — bosiladigan.
const DebtSumCard = ({
  accent,
  accentBg,
  Icon,
  label,
  pill,
  pillColor,
  uzs,
  usd,
  onPress,
}: {
  accent: string;
  accentBg: string;
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  pill: string;
  pillColor: string;
  uzs: number;
  usd: number;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.9} style={styles.sumCard} onPress={onPress}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <View style={styles.sumHead}>
      <CircleIcon size={rs(30)} bg={accentBg}>
        <Icon size={rs(16)} color={accent} />
      </CircleIcon>
      <View style={[styles.pill, { backgroundColor: pillColor + '1A' }]}>
        <Text style={[styles.pillText, { color: pillColor }]} numberOfLines={1}>
          {pill}
        </Text>
      </View>
    </View>
    <Text style={styles.sumLabel} numberOfLines={2}>
      {label}
    </Text>
    <Text style={styles.sumUzs} numberOfLines={1} adjustsFontSizeToFit>
      {uzsText(uzs)}
    </Text>
    <Text style={styles.sumUsd}>{usdText(usd)}</Text>
  </TouchableOpacity>
);

type Row = { id: any; name: string; end: string; amount: number; currency: string };

// F) Muddati yaqin qarzlar jadvali (UZS/USD toggle bilan).
const DueTable = ({
  title,
  accent,
  rows,
  onRow,
}: {
  title: string;
  accent: string;
  rows: any[];
  onRow: (id: any) => void;
}) => {
  const [cur, setCur] = React.useState<'UZS' | 'USD'>('UZS');
  const filtered: Row[] = (rows || [])
    .filter(r => String(r?.currency || 'UZS').toUpperCase() === cur)
    .map(r => ({
      id: r?.qarz_id,
      name: titleCase(r?.mijoz_fish),
      end: r?.end_date,
      amount: Number(r?.residual_amount || 0),
      currency: cur,
    }));

  return (
    <View style={styles.card}>
      <View style={styles.tableHeadRow}>
        <Text style={[styles.tableTitle, { color: accent }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.toggle}>
          {(['UZS', 'USD'] as const).map(c => (
            <TouchableOpacity
              key={c}
              activeOpacity={0.8}
              onPress={() => setCur(c)}
              style={[styles.toggleBtn, cur === c && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, cur === c && styles.toggleTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <CircleIcon size={rs(40)} bg={rd.color.surfaceAlt}>
            <ClockIcon size={rs(22)} color={rd.color.textTertiary} />
          </CircleIcon>
          <Text style={styles.emptyText}>
            Yaqin orada muddati tugaydigan qarzlar yo‘q.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.trHead}>
            <Text style={[styles.thText, styles.colName]}>Mijoz</Text>
            <Text style={[styles.thText, styles.colDate]}>Muddat</Text>
            <Text style={[styles.thText, styles.colAmt]}>Qarz miqdori</Text>
          </View>
          {filtered.map((row, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => onRow(row.id)}
              style={styles.tr}
            >
              <Text style={[styles.tdName, styles.colName]} numberOfLines={1}>
                {row.name}
              </Text>
              <View style={styles.colDate}>
                <View
                  style={[styles.dayPill, { backgroundColor: daysColor(row.end) + '1A' }]}
                >
                  <Text style={[styles.dayPillText, { color: daysColor(row.end) }]}>
                    {daysText(row.end)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tdAmt, styles.colAmt]} numberOfLines={1}>
                {`${sortText(row.amount) || 0} ${row.currency}`}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
};

// G) Ogohlantirish banneri (yopiladigan).
const WarningBanner = ({ onClose }: { onClose: () => void }) => (
  <View style={styles.warnBox}>
    <ShieldIcon size={rs(20)} color={AMBER} />
    <Text style={styles.warnText}>
      Qarz oldi-berdi munosabatlaringizni qarz daftariga kiritish orqali qarzlaringizni
      elektron boshqarish imkoniyatiga ega bo‘lasiz. Biroq bu holatda qarz daftariga
      kiritilgan qarzlar bo‘yicha qarz shartnomasi rasmiylashtirilmaydi.
    </Text>
    <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.warnClose}>
      <Text style={styles.warnCloseText}>Tushundim</Text>
    </TouchableOpacity>
  </View>
);

// ---------- Ekran ----------
const QarzDaftari = () => {
  const navigation = useNavigation<any>();
  const nav: Nav = (route, params) => navigation.navigate(route, params);
  const [showWarn, setShowWarn] = React.useState(true);

  // REAL backend — dashboard summalari + muddati yaqin qatorlar.
  const dashboard = useFetch({ url: `${URL}/qarz-daftari/dashboard`, method: 'GET' });
  const nearExp = useFetch({ url: `${URL}/qarz-daftari/near-expiration`, method: 'GET' });

  const d: any = (dashboard.data as any)?.data || dashboard.data || {};
  const usdRate = Number(d?.usd_rate || 0);

  //   berilgan_qarz = BERILGAN qarz (menga qarzdorlar / debitor) — KO'K
  //   olingan_qarz  = OLINGAN qarz (men qarzdor / kreditor)      — YASHIL
  const bq: any = d?.berilgan_qarz || {};
  const oq: any = d?.olingan_qarz || {};

  // Qarzdorliklar kartalari FAQAT daftari o'qiydi (web bilan bir xil).
  const daftariBerilganUzs = bq?.daftari?.uzs || 0;
  const daftariBerilganUsd = bq?.daftari?.usd || 0;
  const daftariOlinganUzs = oq?.daftari?.uzs || 0;
  const daftariOlinganUsd = oq?.daftari?.usd || 0;

  // Muddati o'tgan — .daftari.{uzs,usd} (oldin xato bo'yicha top-level .uzs o'qilardi → 0).
  const modeb: any = d?.muddati_otgan_debitor?.daftari || {};
  const mokred: any = d?.muddati_otgan_kreditor?.daftari || {};
  const overdueBerilganUzs = modeb?.uzs || 0;
  const overdueBerilganUsd = modeb?.usd || 0;
  const overdueOlinganUzs = mokred?.uzs || 0;
  const overdueOlinganUsd = mokred?.usd || 0;

  // Muddati yaqin qatorlar.
  const near: any = (nearExp.data as any)?.data || nearExp.data || {};
  const nearBerilgan = near?.debitor || [];
  const nearOlingan = near?.kreditor || [];

  const goKiritish = (turi?: 'berish' | 'olish') =>
    nav('QarzDaftariKiritish', turi ? { turi } : undefined);
  const goQarz = (id: any) => id && nav('QarzDaftariQarz', { id });

  if (dashboard.loading && nearExp.loading) {
    return <Loading />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* Endi TAB — orqaga knopkasi Asosiy tabga qaytaradi. */}
      <RdHeader title="Qarz daftari" onBack={() => navigation.navigate('Home')} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* B. Hero */}
        <Hero onContract={() => nav('QarzShartnomasi')} onAdd={() => goKiritish()} />

        {/* C. Umumiy ko'rinish */}
        <Text style={styles.blockTitle}>Umumiy ko‘rinish</Text>
        <DashboardChartCard
          accent={BLUE}
          Icon={ArrowUpRight}
          title="Berilgan qarz"
          usdRate={usdRate}
          shartnomaUzs={bq?.shartnoma?.uzs || 0}
          shartnomaUsd={bq?.shartnoma?.usd || 0}
          daftariUzs={daftariBerilganUzs}
          daftariUsd={daftariBerilganUsd}
        />
        <DashboardChartCard
          accent={GREEN}
          Icon={ArrowDownLeft}
          title="Olingan qarz"
          usdRate={usdRate}
          shartnomaUzs={oq?.shartnoma?.uzs || 0}
          shartnomaUsd={oq?.shartnoma?.usd || 0}
          daftariUzs={daftariOlinganUzs}
          daftariUsd={daftariOlinganUsd}
        />

        {/* D. Tezkor amallar */}
        <Text style={styles.blockTitle}>Tezkor amallar</Text>
        <View style={styles.actionsWrap}>
          <ActionCard
            color={BLUE}
            bg="#EFF6FF"
            Icon={ArrowUpRight}
            title="Qarzga berish"
            note="Mijozga qarz bering va to‘lovlarni kuzating"
            onPress={() => goKiritish('berish')}
          />
          <ActionCard
            color={GREEN}
            bg="#F0FDF4"
            Icon={ArrowDownLeft}
            title="Qarzga olish"
            note="Olingan qarzni qayd eting va muddatini belgilang"
            onPress={() => goKiritish('olish')}
          />
        </View>

        {/* E. Qarzdorliklar */}
        <Text style={styles.blockTitle}>Qarzdorliklar</Text>
        <View style={styles.sumGrid}>
          <DebtSumCard
            accent={BLUE}
            accentBg="#EFF6FF"
            Icon={ArrowUpRight}
            label="Berilgan qarz"
            pill="Olish kerak"
            pillColor={BLUE}
            uzs={daftariBerilganUzs}
            usd={daftariBerilganUsd}
            onPress={() => nav('QarzDaftariQarzlar', { turi: 'berish' })}
          />
          <DebtSumCard
            accent={RED}
            accentBg="#FEF2F2"
            Icon={ClockIcon}
            label="Muddati o‘tgan (debitor)"
            pill="Muddati o‘tgan"
            pillColor={RED}
            uzs={overdueBerilganUzs}
            usd={overdueBerilganUsd}
            onPress={() =>
              nav('QarzDaftariQarzlar', { turi: 'berish', status: 'muddati-otgan' })
            }
          />
          <DebtSumCard
            accent={GREEN}
            accentBg="#F0FDF4"
            Icon={ArrowDownLeft}
            label="Olingan qarz"
            pill="Berish kerak"
            pillColor={GREEN}
            uzs={daftariOlinganUzs}
            usd={daftariOlinganUsd}
            onPress={() => nav('QarzDaftariQarzlar', { turi: 'olish' })}
          />
          <DebtSumCard
            accent={RED}
            accentBg="#FEF2F2"
            Icon={ClockIcon}
            label="Muddati o‘tgan (kreditor)"
            pill="Muddati o‘tgan"
            pillColor={RED}
            uzs={overdueOlinganUzs}
            usd={overdueOlinganUsd}
            onPress={() =>
              nav('QarzDaftariQarzlar', { turi: 'olish', status: 'muddati-otgan' })
            }
          />
        </View>

        {/* F. Muddati yaqinlashganlar */}
        <Text style={styles.blockTitle}>Muddati yaqinlashganlar</Text>
        <DueTable
          title="Muddati yaqin berilgan qarzlar"
          accent={BLUE}
          rows={nearBerilgan}
          onRow={goQarz}
        />
        <DueTable
          title="Muddati yaqin olingan qarzlar"
          accent={GREEN}
          rows={nearOlingan}
          onRow={goQarz}
        />

        {/* G. Ogohlantirish */}
        {showWarn && <WarningBanner onClose={() => setShowWarn(false)} />}
      </ScrollView>
    </View>
  );
};

export default QarzDaftari;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(24),
    gap: rs(14),
  },

  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    marginTop: rs(4),
    marginBottom: rs(-4),
  },

  // Hero
  hero: {
    borderRadius: rs(22),
    overflow: 'hidden',
    padding: rs(20),
    shadowColor: GRAD_BRAND[1],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  heroTitle: { fontFamily: rd.font.bold, fontSize: rs(21), color: rd.color.onPrimary },
  heroSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: 'rgba(255,255,255,0.9)',
    marginTop: rs(6),
    lineHeight: rs(18),
  },
  heroBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginTop: rs(16) },
  heroBtn: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(10),
    paddingHorizontal: rs(14),
  },
  heroBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.primary,
  },

  // Generic card
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },

  // Overview / chart
  ovHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  ovTitle: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: rd.color.text },
  ovSubtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(1),
  },
  ovTotalLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    marginTop: rs(14),
  },
  ovTotal: {
    fontFamily: rd.font.bold,
    fontSize: rs(24),
    color: rd.color.text,
    marginTop: rs(2),
  },
  ovRate: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(4),
  },

  // Ratio bar
  barTrack: {
    flexDirection: 'row',
    height: rs(10),
    borderRadius: rd.radius.pill,
    overflow: 'hidden',
    backgroundColor: rd.color.surfaceAlt,
  },
  barFill: { height: '100%' },
  barLegend: { flexDirection: 'row', gap: rs(16), marginTop: rs(8) },
  barLegendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  barDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  barLegendText: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
  },

  // Overview sub cards
  subRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(16) },
  subCard: {
    flex: 1,
    borderRadius: rs(14),
    borderWidth: 1,
    padding: rs(12),
  },
  subCardHead: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  subCardTitle: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
  },
  subCardUzs: {
    fontFamily: rd.font.bold,
    fontSize: rs(14.5),
    color: rd.color.text,
    marginTop: rs(8),
  },
  subCardUsd: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Action cards
  actionsWrap: { gap: rs(12) },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1.5,
    padding: rs(14),
  },
  actionTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  actionNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Qarzdorlik summasi grid
  sumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  sumCard: {
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
  sumHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
    marginTop: rs(2),
  },
  pill: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  pillText: { fontFamily: rd.font.semibold, fontSize: rs(9.5) },
  sumLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    minHeight: rs(32),
  },
  sumUzs: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    color: rd.color.text,
    marginTop: rs(4),
  },
  sumUsd: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Due table
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  tableTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(14), marginRight: rs(8) },
  toggle: {
    flexDirection: 'row',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    padding: rs(3),
  },
  toggleBtn: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    borderRadius: rd.radius.pill,
  },
  toggleBtnActive: { backgroundColor: rd.color.surface },
  toggleText: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  toggleTextActive: { fontFamily: rd.font.semibold, color: rd.color.primary },

  trHead: {
    flexDirection: 'row',
    paddingBottom: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  thText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(11),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  colName: { flex: 1.4 },
  colDate: { flex: 1, alignItems: 'center' },
  colAmt: { flex: 1.2, textAlign: 'right' },
  tdName: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  tdAmt: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  dayPill: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  dayPillText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },

  // Warning banner
  warnBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: rs(16),
    padding: rs(14),
    gap: rs(8),
    marginTop: rs(4),
  },
  warnText: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: '#92400E',
    lineHeight: rs(18),
  },
  warnClose: {
    alignSelf: 'flex-start',
    backgroundColor: AMBER,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(14),
    paddingVertical: rs(7),
    marginTop: rs(2),
  },
  warnCloseText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: '#fff' },

  // Empty
  emptyBox: { alignItems: 'center', gap: rs(8), paddingVertical: rs(24) },
  emptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
});
