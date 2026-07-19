/**
 * HomeRedesign.tsx — Bosh sahifa (RD/01 Asosiy) redizayni.
 * Figma: ZeroX Mobile App — UI/UX (node 286:2).
 *
 * - Layout SafeArea insets bilan (tepa/past bo'shliqsiz, har qanday telefonga to'liq mos).
 * - O'lchamlar rs() bilan qurilma eniga proporsional masshtablanadi.
 * - Tugmalar useNavigation orqali real ekranlarga o'tadi.
 * Ma'lumot hozircha statik (Figma bilan bir xil) — keyin Redux/backendga ulanadi.
 */
import { DrawerActions, useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { HomeApi } from '../../../store/api/home';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { sortText } from '../../components/StatisticCard';
import { DEBT_NAV } from './debtNav';
import Donut from './Donut';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChartIcon,
  BellIcon,
  ChevronRight,
  ClockIcon,
  CoinIcon,
  GridIcon,
  HelpIcon,
  IconProps,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  TransferIcon,
  UserIcon,
} from './icons';

type Nav = (route: string, params?: object) => void;

// ---------- Statik ma'lumot (Figma) ----------
const user = { name: 'Umidbek', initials: 'UJ' };
const balance = { total: '+25 700 000 so‘m', trend: 'Bu oy +12%', owedToMe: '68.2 mln', iOwe: '42.5 mln' };
// Fintech gradient palitralari (jonli, zamonaviy).
const GRAD = {
  brand: ['#2f6fed', '#5a4fe4'] as const, // primary → binafsha
  green: ['#22c55e', '#0d9488'] as const, // kreditor (menga qarzdor)
  rose: ['#fb7185', '#e11d48'] as const, // debitor (men qarzdor)
};

const actions: {
  key: string;
  label: string;
  Icon: (p: IconProps) => JSX.Element;
  route: string;
  params?: object;
  tint: string;
  color: string;
}[] = [
  // type: 1 = qarz berish (TakeDebt tab), 0 = qarz olish (GiveDebt tab) — eski oqim bilan bir xil.
  { key: 'give', label: 'Qarz berish', Icon: PlusIcon, route: 'SearchUserScreen', params: { type: 1 }, tint: '#e7effd', color: '#2f6fed' },
  { key: 'take', label: 'Qarz olish', Icon: ArrowDownLeft, route: 'SearchUserScreen', params: { type: 0 }, tint: '#e7f7ef', color: '#16a34a' },
  { key: 'search', label: 'Qidiruv', Icon: SearchIcon, route: 'SearchUserScreen', params: { type: 1 }, tint: '#efe9fd', color: '#7c5cff' },
  { key: 'qr', label: 'QR kod', Icon: GridIcon, route: 'QrCode', tint: '#fbefd9', color: '#e0890b' },
];
const contracts = {
  total: '30',
  segments: [
    { label: 'Faol', count: '22 ta', color: rd.color.success, value: 22 },
    { label: 'Muddati yaqin', count: '5 ta', color: rd.color.warning, value: 5 },
    { label: 'Muddati o‘tgan', count: '3 ta', color: rd.color.error, value: 3 },
  ],
};
type RecentOp = { id: string | number; name: string; sub: string; amount: string; positive: boolean };
const recentOps: RecentOp[] = [
  { id: 'd1', name: 'Akmal Toshmatov', sub: 'Qarz berildi · Bugun', amount: '+2.5 mln', positive: true },
  { id: 'd2', name: 'Dilnoza Karimova', sub: 'Qarz olindi · Kecha', amount: '−1.2 mln', positive: false },
];
// ---------- Kichik komponentlar ----------
const GradientBg = () => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id="rdGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={rd.color.gradient[0]} />
        <Stop offset="1" stopColor={rd.color.gradient[1]} />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#rdGrad)" />
  </Svg>
);

// Umumiy gradient fon — ixtiyoriy rang juftligi bilan (fintech kartalar uchun).
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

const CircleIcon = ({ size, bg, children }: { size: number; bg: string; children: React.ReactNode }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </View>
);

/**
 * Header — chapda menyu tugmasi, o'ngda AVATAR + qo'ng'iroq.
 *
 * Dizayn talabi bo'yicha o'zgardi:
 *  - "Assalomu alaykum 👋" salomi va qo'l ikonkasi olib tashlandi;
 *  - foydalanuvchi ismi sarlavha qatorida ko'rsatilmaydi;
 *  - "BB" bosh harflari o'rniga odamni bildiruvchi ikonka (UserIcon);
 *  - avatar o'ng tomonga, qo'ng'iroqdan OLDIN ko'chirildi;
 *  - avatar bosilsa Sozlamalar (profil) sahifasi ochiladi.
 * Natijada qator ancha yengil bo'ldi — kichik ekranlarda ism uzun bo'lsa ham
 * siqilib ketmaydi (endi umuman matn yo'q).
 */
const Header = ({
  badge,
  onMenu,
  onBell,
  onProfile,
}: {
  badge: number;
  onMenu: () => void;
  onBell: () => void;
  onProfile: () => void;
}) => (
  <View style={styles.headerRow}>
    <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn} onPress={onMenu}>
      <MenuIcon color={rd.color.text} size={rs(18)} />
    </TouchableOpacity>

    <View style={styles.headerRight}>
      <TouchableOpacity activeOpacity={0.8} style={styles.avatar} onPress={onProfile}>
        <GradientBg />
        <UserIcon color={rd.color.onPrimary} size={rs(20)} />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn} onPress={onBell}>
        <BellIcon color={rd.color.text} size={rs(24)} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const Stat = ({ Icon, label, value }: { Icon: (p: IconProps) => JSX.Element; label: string; value: string }) => (
  <View style={styles.stat}>
    <CircleIcon size={rs(34)} bg={rd.color.onPrimaryChip}>
      <Icon size={rs(20)} color={rd.color.onPrimary} />
    </CircleIcon>
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

type BalanceData = { total: string; trend: string; owedToMe: string; iOwe: string };
const BalanceCard = ({ data }: { data: BalanceData }) => (
  <View style={styles.balanceCard}>
    <GradientBg />
    <View style={styles.balanceTop}>
      <Text style={styles.balanceTitle}>Umumiy qarz holati</Text>
      <View style={styles.trendChip}>
        <Text style={styles.trendText}>{data.trend}</Text>
      </View>
    </View>
    <Text style={styles.balanceTotal} numberOfLines={1} adjustsFontSizeToFit>
      {data.total}
    </Text>
    <View style={styles.balanceDivider} />
    <View style={styles.statsRow}>
      <Stat Icon={ArrowUpRight} label="Menga qarzdor" value={data.owedToMe} />
      <Stat Icon={ArrowDownLeft} label="Men qarzdor" value={data.iOwe} />
    </View>
  </View>
);

const QuickActions = ({ nav }: { nav: Nav }) => (
  <View style={styles.actionsRow}>
    {actions.map(({ key, label, Icon, route, params, tint, color }) => (
      <TouchableOpacity key={key} activeOpacity={0.85} style={styles.actionCard} onPress={() => nav(route, params)}>
        <CircleIcon size={rs(46)} bg={tint}>
          <Icon size={rs(24)} color={color} />
        </CircleIcon>
        <Text style={styles.actionLabel}>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// Qarzdorlik ro'yxatlariga navigatsiya paramlari endi `./debtNav` faylida —
// QarzShartnomasi kartalari ham aynan shu ro'yxatga o'tadi (bitta manba).

// Qarzdorlik kartasi (kreditor / debitor) — JONLI GRADIENT (fintech), UZS + USD.
const DebtCard = ({
  positive,
  gradId,
  colors,
  label,
  amountUzs,
  amountUsd,
  count,
  onPress,
}: {
  positive: boolean;
  gradId: string;
  colors: readonly string[];
  label: string;
  amountUzs: string;
  amountUsd?: string;
  count: number;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={[styles.debtCard, { shadowColor: colors[1] }]}
    onPress={onPress}
  >
    <Grad id={gradId} colors={colors} />
    <View style={styles.debtTop}>
      <View style={styles.debtIconWrap}>
        {positive ? (
          <ArrowUpRight size={rs(18)} color={rd.color.onPrimary} />
        ) : (
          <ArrowDownLeft size={rs(18)} color={rd.color.onPrimary} />
        )}
      </View>
      <ChevronRight size={rs(18)} color="rgba(255,255,255,0.9)" />
    </View>
    <Text style={styles.debtLabel}>{label}</Text>
    <Text style={styles.debtAmount} numberOfLines={1} adjustsFontSizeToFit>
      {amountUzs}
    </Text>
    {amountUsd ? (
      <View style={styles.debtUsdChip}>
        <CoinIcon size={rs(14)} color={rd.color.onPrimary} />
        <Text style={styles.debtUsd}>{amountUsd}</Text>
      </View>
    ) : null}
    <Text style={styles.debtCount}>{count} ta shartnoma</Text>
  </TouchableOpacity>
);

type ContractsData = { total: string; segments: { label: string; count: string; color: string; value: number }[] };
const ContractsCard = ({ data }: { data: ContractsData }) => (
  <View style={styles.card}>
    <View style={styles.contractsRow}>
      <Donut segments={data.segments} size={rs(96)} centerValue={data.total} centerLabel="shartnoma" />
      <View style={styles.legend}>
        <Text style={styles.cardTitle}>Shartnomalar holati</Text>
        {data.segments.map(seg => (
          <View key={seg.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendLabel}>{seg.label}</Text>
            <Text style={styles.legendCount}>{seg.count}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);

const WarningBanner = ({ count, onPress }: { count: number; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.9} style={styles.warning} onPress={onPress}>
    <CircleIcon size={rs(34)} bg={rd.color.surface}>
      <ClockIcon size={rs(22)} color={rd.color.warning} />
    </CircleIcon>
    <Text style={styles.warningText}>{count} ta qarz muddati yaqinlashmoqda</Text>
    <ChevronRight size={rs(18)} color={rd.color.warning} />
  </TouchableOpacity>
);

const RecentOperations = ({ ops }: { ops: RecentOp[] }) => (
  <View style={styles.opsCard}>
    {ops.length === 0 && (
      <View style={styles.opsEmpty}>
        <CircleIcon size={rs(40)} bg={rd.color.surfaceAlt}>
          <ClockIcon size={rs(22)} color={rd.color.textTertiary} />
        </CircleIcon>
        <Text style={styles.opsEmptyText}>Hozircha amaliyotlar yo‘q</Text>
      </View>
    )}
    {ops.map((op, i) => (
      <View key={op.id}>
        {i > 0 && <View style={styles.opDivider} />}
        <View style={styles.opRow}>
          <CircleIcon size={rs(40)} bg={op.positive ? rd.color.successBg : rd.color.errorBg}>
            {op.positive ? (
              <ArrowUpRight size={rs(22)} color={rd.color.success} />
            ) : (
              <ArrowDownLeft size={rs(22)} color={rd.color.error} />
            )}
          </CircleIcon>
          <View style={{ flex: 1 }}>
            <Text style={styles.opName}>{op.name}</Text>
            <Text style={styles.opSub}>{op.sub}</Text>
          </View>
          <Text style={[styles.opAmount, { color: op.positive ? rd.color.success : rd.color.error }]}>
            {op.amount}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

// ---------- Web-uslub komponentlari (veb dashboard bilan bir xil) ----------

// Hero banner — ko'k gradient, salom + moliyaviy sog'liq ball + holat.
const HeroBanner = ({
  name,
  score,
  status,
}: {
  name: string;
  score: number;
  status: string;
}) => (
  <View style={styles.hero}>
    <Grad id="heroGrad" colors={GRAD.brand} />
    <Text style={styles.heroTitle} numberOfLines={2}>
      Xush kelibsiz, {name}!
    </Text>
    <Text style={styles.heroSub} numberOfLines={2}>
      Shartnomalarni elektron rasmiylashtiring va oson boshqaring.
    </Text>
    <View style={styles.heroChips}>
      <View style={styles.heroChip}>
        <Text style={styles.heroChipValue}>{score}</Text>
        <Text style={styles.heroChipLabel}>Moliyaviy sog‘liq</Text>
      </View>
      <View style={styles.heroChip}>
        <Text style={styles.heroChipValue}>{status}</Text>
        <Text style={styles.heroChipLabel}>Holat</Text>
      </View>
    </View>
  </View>
);

// Asosiy ko'rsatkich kartasi — tepa aksent chizig'i, ikona, label, UZS + USD.
const MetricCard = ({
  accent,
  accentBg,
  Icon,
  label,
  uzs,
  usd,
  value,
  comingSoon,
  onPress,
}: {
  accent: string;
  accentBg: string;
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  uzs?: string;
  usd?: string;
  value?: string;
  comingSoon?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={comingSoon ? 1 : 0.85}
    disabled={comingSoon}
    onPress={onPress}
    style={[styles.metricCard, comingSoon && styles.metricCardSoon]}
  >
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <View style={styles.metricHead}>
      <CircleIcon size={rs(32)} bg={accentBg}>
        <Icon size={rs(17)} color={accent} />
      </CircleIcon>
      {comingSoon ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Tez kunda</Text>
        </View>
      ) : null}
    </View>
    {comingSoon ? (
      <>
        <Text style={styles.metricValueBig}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </>
    ) : (
      <>
        <Text style={styles.metricLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.metricUzs} numberOfLines={1} adjustsFontSizeToFit>
          {uzs}
        </Text>
        {usd ? <Text style={styles.metricUsd}>{usd}</Text> : null}
      </>
    )}
  </TouchableOpacity>
);

// Modul kartasi — "Qarz shartnomasi" (Debitor + Kreditor qiymatlari bilan).
const ModuleContract = ({
  debUzs,
  debUsd,
  credUzs,
  credUsd,
  onPress,
}: {
  debUzs: string;
  debUsd: string;
  credUzs: string;
  credUsd: string;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.9} style={styles.moduleCard} onPress={onPress}>
    <View style={styles.moduleHead}>
      <CircleIcon size={rs(38)} bg={rd.color.primaryTint}>
        <TransferIcon size={rs(20)} color={rd.color.primary} />
      </CircleIcon>
      <Text style={styles.moduleTitle}>Qarz shartnomasi</Text>
      <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
    </View>
    <View style={styles.moduleSubRow}>
      <View style={[styles.moduleSub, { backgroundColor: rd.color.successBg }]}>
        <Text style={[styles.moduleSubAmt, { color: rd.color.success }]} numberOfLines={1} adjustsFontSizeToFit>
          {debUzs}
        </Text>
        {debUsd ? <Text style={styles.moduleSubUsd}>{debUsd}</Text> : null}
        <Text style={styles.moduleSubLabel}>Debitor</Text>
      </View>
      <View style={[styles.moduleSub, { backgroundColor: rd.color.errorBg }]}>
        <Text style={[styles.moduleSubAmt, { color: rd.color.error }]} numberOfLines={1} adjustsFontSizeToFit>
          {credUzs}
        </Text>
        {credUsd ? <Text style={styles.moduleSubUsd}>{credUsd}</Text> : null}
        <Text style={styles.moduleSubLabel}>Kreditor</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Modul kartasi — bosiladigan (onPress bo'lsa) yoki "Tez kunda" (onPress yo'q).
const ModuleSoon = ({
  Icon,
  title,
  onPress,
}: {
  Icon: (p: IconProps) => JSX.Element;
  title: string;
  onPress?: () => void;
}) => {
  const soon = !onPress;
  const inner = (
    <View style={styles.moduleHead}>
      <CircleIcon size={rs(38)} bg={soon ? rd.color.surfaceAlt : rd.color.primaryTint}>
        <Icon size={rs(20)} color={soon ? rd.color.textTertiary : rd.color.primary} />
      </CircleIcon>
      <Text style={[styles.moduleTitle, soon && { color: rd.color.textTertiary }]}>
        {title}
      </Text>
      {soon ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Tez kunda</Text>
        </View>
      ) : (
        <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
      )}
    </View>
  );
  return soon ? (
    <View style={[styles.moduleCard, styles.moduleSoonCard]}>{inner}</View>
  ) : (
    <TouchableOpacity activeOpacity={0.9} style={styles.moduleCard} onPress={onPress}>
      {inner}
    </TouchableOpacity>
  );
};

// ---------- Ekran ----------
// Valyuta-aware jamlash: USD summalar `usd` kursi bilan UZS'ga aylantiriladi
// (/home/my qatorlarida UZS va USD aralash keladi — ko'r-ko'rona qo'shib bo'lmaydi).
const sumUZS = (rows?: any[], usd = 1) =>
  Math.round(
    (rows || []).reduce((s, r) => {
      const amt = Number(r?.residual_amount || 0);
      const isUsd = String(r?.currency || '').toUpperCase() === 'USD';
      return s + (isUsd ? amt * (usd || 1) : amt);
    }, 0),
  );
const toMln = (n: number) => `${(n / 1e6).toFixed(1)} mln`;

// Bitta valyuta bo'yicha yig'indi (konvertatsiyasiz — USD'ni alohida ko'rsatish uchun).
const sumCur = (rows: any[] | undefined, cur: string) =>
  Math.round(
    (rows || []).reduce((s, r) => {
      const isCur = String(r?.currency || 'UZS').toUpperCase() === cur;
      return s + (isCur ? Number(r?.residual_amount || 0) : 0);
    }, 0),
  );

// Ixcham summa: mln/ming/xom.
const shortAmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)} mln`;
  if (abs >= 1e3) return `${Math.round(n / 1e3)} ming`;
  return String(Math.round(n));
};

// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

// So'nggi amaliyotlar — REAL manba: notification.bild (har element qarz hodisasi:
// counterparty ismi, summa, valyuta, sana). Yo'nalish joriy foydalanuvchi id'iga
// qarab: creditor === myId → menga qarzdor (+), debitor === myId → men qarzdor (−).
const buildRecentOps = (bild?: any[], myId?: number): RecentOp[] =>
  (bild || []).slice(0, 5).map((n, i) => {
    const iAmCreditor = Number(n?.creditor) === Number(myId);
    const positive = iAmCreditor; // men qarz berganman → menga qarzdor
    const first = iAmCreditor ? n?.d_first_name : n?.c_first_name;
    const last = iAmCreditor ? n?.d_last_name : n?.c_last_name;
    const name = titleCase(`${first || ''} ${last || ''}`) || 'Noma’lum';
    const amt = Number(n?.amount ?? n?.residual_amount ?? 0);
    const cur = String(n?.currency || 'UZS').toUpperCase();
    const dateStr = n?.created || n?.created_at || '';
    const time = n?.time ? String(n.time).slice(0, 5) : '';
    return {
      id: n?.id ?? i,
      name,
      sub: [dateStr, time].filter(Boolean).join(' · '),
      amount: `${positive ? '+' : '−'}${shortAmt(amt)}${
        cur !== 'UZS' ? ' ' + cur : ''
      }`,
      positive,
    };
  });

const HomeRedesign = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { user: storeUser, home, notification, loading, usd, analytics } =
    useSelector((s: any) => s.HomeReducer);
  const myId = storeUser?.data?.id;
  const [refreshing, setRefreshing] = React.useState(false);

  // Login qilinganmi (token bor)? Login qilingan foydalanuvchiga HECH QACHON demo
  // ko'rsatmaymiz — faqat real API ma'lumoti (bo'sh bo'lsa nol/bo'sh holat).
  // Demo faqat login qilinmagan dizayn-preview uchun.
  const isLoggedIn = !!storage.getString('token');

  // Home tab ochilganda real ma'lumotni yuklaymiz (/user/me + /home/my creditor/debitor).
  // Token eskirgan bo'lsa authInterceptor avval refresh qilishga urinadi; agar u ham
  // muvaffaqiyatsiz bo'lsa (refreshToken yo'q/eskirgan) -> UNAUTHORIZED qaytadi -> qayta
  // login (PIN/k2 saqlanadi). Tarmoq xatosi (code yo'q) sessiyani buzmaydi.
  React.useEffect(() => {
    (dispatch(HomeApi({ page: 1 }) as any) as any)
      .unwrap?.()
      .catch((err: any) => {
        const code = err?.code || err?.response?.data?.code;
        if (code === 'UNAUTHORIZED') {
          navigation.reset({ index: 0, routes: [{ name: 'LoginWithPhone' }] });
        }
      });
  }, [dispatch, navigation]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    (dispatch(HomeApi({ page: 1 }) as any) as any)
      .unwrap?.()
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [dispatch]);

  // Ism (login qilinganda real; yuklanmagunicha neytral placeholder — demo emas).
  const first = storeUser?.data?.first_name;
  const name = first || (isLoggedIn ? 'Foydalanuvchi' : user.name);
  // `initials` olib tashlandi — sarlavhadagi "BB" doirasi o'rniga endi odam
  // ikonkasi turadi, shuning uchun bosh harflar hisoblanmaydi.

  // Agregatlar (backend /home/my javobidan — o'zgartirilmaydi, faqat o'qiladi).
  const cred = home?.creditor?.data;
  const deb = home?.debitor?.data;
  const hasHome = !!(cred || deb);
  // Login qilingan bo'lsa REAL yo'l (bo'sh bo'lsa nol/bo'sh) — demo faqat preview.
  const useReal = isLoggedIn || hasHome;

  const owedToMe = sumUZS(cred?.data, usd); // menga qarzdor (men bergan)
  const iOwe = sumUZS(deb?.data, usd); // men qarzdor (men olgan)
  const net = owedToMe - iOwe;

  // Valyuta bo'yicha alohida yig'indilar (UZS + USD) — kartalarda ikkalasi ko'rsatiladi.
  const credUZS = useReal ? sumCur(cred?.data, 'UZS') : 68_200_000;
  const credUSD = useReal ? sumCur(cred?.data, 'USD') : 1200;
  const debUZS = useReal ? sumCur(deb?.data, 'UZS') : 42_500_000;
  const debUSD = useReal ? sumCur(deb?.data, 'USD') : 0;

  // Karta summa matnlari: UZS (asosiy) + USD (ikkilamchi, faqat > 0 bo'lsa).
  const uzsText = (n: number) => `${shortAmt(n)} so‘m`;
  const usdText = (n: number) => (n > 0 ? `${sortText(n)} $` : '');

  // Qarzdorlik shartnomalari soni (real bo'lsa massiv uzunligi, aks holda demo).
  const credCount = useReal ? (Array.isArray(cred?.data) ? cred.data.length : 0) : 12;
  const debCount = useReal ? (Array.isArray(deb?.data) ? deb.data.length : 0) : 8;

  const balanceData: BalanceData = useReal
    ? {
        total: `${net >= 0 ? '+' : '−'}${sortText(Math.abs(net))} so‘m`,
        // Real hosila: umumiy qarz yo'nalishi (backendda oylik trend/foiz yo'q).
        trend: net > 0 ? 'Sizga qarzdor' : net < 0 ? 'Qarzingiz bor' : 'Muvozanatda',
        owedToMe: toMln(owedToMe),
        iOwe: toMln(iOwe),
      }
    : balance;

  const cActive = (cred?.chart?.jarayon || 0) + (deb?.chart?.jarayon || 0);
  const cNear = (cred?.five?.length || 0) + (deb?.five?.length || 0);
  const cExpired = (cred?.expired?.length || 0) + (deb?.expired?.length || 0);
  const cTotal = cActive + cNear + cExpired;
  const contractsData: ContractsData = useReal
    ? {
        total: String(cTotal),
        segments: [
          { label: 'Faol', count: `${cActive} ta`, color: rd.color.success, value: cActive },
          { label: 'Muddati yaqin', count: `${cNear} ta`, color: rd.color.warning, value: cNear },
          { label: 'Muddati o‘tgan', count: `${cExpired} ta`, color: rd.color.error, value: cExpired },
        ],
      }
    : contracts;

  // Moliyaviy sog'liq ball — REAL manba: /home/analytics (web bilan bir xil formula).
  // analytics yo'q bo'lsa (yuklanmagan/demo) — mahalliy taxminга tushamiz.
  const STATUS_UZ: Record<string, string> = {
    excellent: 'A’lo',
    good: 'Yaxshi',
    fair: 'O‘rtacha',
    poor: 'Past',
  };
  const localScore =
    cTotal === 0
      ? 100
      : Math.max(
          0,
          Math.round(100 - (cExpired / cTotal) * 63 - (cNear / cTotal) * 20),
        );
  const healthScore = analytics?.health?.score ?? localScore;
  const healthStatus =
    (analytics?.health?.status && STATUS_UZ[analytics.health.status]) ||
    (healthScore >= 85
      ? 'A’lo'
      : healthScore >= 70
      ? 'Yaxshi'
      : healthScore >= 50
      ? 'O‘rtacha'
      : 'Past');

  // So'nggi amaliyotlar + bildirishnoma soni (real, aks holda demo).
  const recentOpsData = useReal
    ? buildRecentOps(notification?.bild, myId)
    : recentOps;
  const badgeCount = notification?.bild?.length || 0;
  const nearCount = contractsData.segments[1]?.value || 0; // "Muddati yaqin"

  const nav: Nav = (route, params) => navigation.navigate(route, params);
  const openMenu = () => navigation.dispatch(DrawerActions.openDrawer());

  // Eslatma: App.tsx root SafeAreaView allaqachon top/bottom insetlarni qo'llaydi —
  // shu sabab bu yerda insetlar TAKRORLANMAYDI (aks holda ikki karra bo'shliq bo'lardi).
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <Header
        badge={badgeCount}
        onMenu={openMenu}
        onBell={() => nav('Notification')}
        // Avatar bosilsa Sozlamalar (profil) sahifasi — DrawerMenu'dagi
        // "Sozlamalar" shu yerga ko'chdi, shuning uchun menyudan olib tashlandi.
        onProfile={() => nav('UserScreen', { user: storeUser?.data })}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={rd.color.primary}
            colors={[rd.color.primary]}
          />
        }
      >
        {loading && !hasHome && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={rd.color.primary} />
          </View>
        )}

        {/* Hero banner — moliyaviy sog'liq */}
        <HeroBanner name={name} score={healthScore} status={healthStatus} />

        {/* Asosiy ko'rsatkichlar */}
        <Text style={styles.blockTitle}>Asosiy ko‘rsatkichlar</Text>
        <View style={styles.metricGrid}>
          <MetricCard
            accent={rd.color.error}
            accentBg={rd.color.errorBg}
            Icon={ArrowDownLeft}
            label="Jami olingan qarz"
            uzs={uzsText(credUZS)}
            usd={usdText(credUSD)}
            onPress={() => nav('SearchDebitor', DEBT_NAV.creditor)}
          />
          <MetricCard
            accent={rd.color.success}
            accentBg={rd.color.successBg}
            Icon={ArrowUpRight}
            label="Jami berilgan qarz"
            uzs={uzsText(debUZS)}
            usd={usdText(debUSD)}
            onPress={() => nav('SearchDebitor', DEBT_NAV.debitor)}
          />
          <MetricCard
            accent={rd.color.primary}
            accentBg={rd.color.primaryTint}
            Icon={CoinIcon}
            label="Oylik xarajat"
            value="0"
            comingSoon
          />
          <MetricCard
            accent="#7c5cff"
            accentBg="#efe9fd"
            Icon={BarChartIcon}
            label="Maqsadlar"
            value="0%"
            comingSoon
          />
        </View>

        {/* Modullar */}
        <Text style={styles.blockTitle}>Modullar</Text>
        <ModuleContract
          debUzs={uzsText(debUZS)}
          debUsd={usdText(debUSD)}
          credUzs={uzsText(credUZS)}
          credUsd={usdText(credUSD)}
          onPress={() => nav('QarzShartnomasi')}
        />
        <ModuleSoon Icon={GridIcon} title="Qarz daftari" onPress={() => nav('QarzDaftari')} />
        <ModuleSoon Icon={CoinIcon} title="Shaxsiy moliya" onPress={() => nav('ShaxsiyMoliya')} />

        {/* Ogohlantirishlar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ogohlantirishlar</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => nav('Notification')}>
            <Text style={styles.sectionLink}>Barchasi</Text>
          </TouchableOpacity>
        </View>
        <RecentOperations ops={recentOpsData} />
      </ScrollView>
    </View>
  );
};

export default HomeRedesign;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },

  // Header
  headerRow: {
    height: rs(64),
    paddingHorizontal: rs(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Avatar + qo'ng'iroq o'ng tomonda yonma-yon (ilgari chapda headerLeft edi).
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  iconBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: rs(40), height: rs(40), borderRadius: rs(20), overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  // avatarText / greeting / userName olib tashlandi — sarlavhada endi matn yo'q
  // (salom + ism talab bo'yicha chiqarildi, avatar ichida odam ikonkasi turadi).
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: rs(18),
    height: rs(18),
    paddingHorizontal: 4,
    borderRadius: rs(9),
    backgroundColor: rd.color.error,
    borderWidth: 2,
    borderColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: rd.font.bold, fontSize: rs(10), color: rd.color.onPrimary },

  // Content
  scroll: { flex: 1 },
  content: { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(16), gap: rs(16) },

  // Hero banner
  // KICHRAYTIRILDI: hero kichik ekranlarda sahifaning yarmini egallardi.
  // Barcha qiymatlar rs() orqali -> har qanday ekran o'lchamida proporsional.
  hero: {
    borderRadius: rs(18),
    overflow: 'hidden',
    padding: rs(15),
    shadowColor: GRAD.brand[1],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: { fontFamily: rd.font.bold, fontSize: rs(16.5), color: rd.color.onPrimary },
  heroSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: 'rgba(255,255,255,0.9)',
    marginTop: rs(4),
    lineHeight: rs(15.5),
  },
  heroChips: { flexDirection: 'row', gap: rs(8), marginTop: rs(11) },
  heroChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: rs(12),
    paddingVertical: rs(9),
    paddingHorizontal: rs(10),
    alignItems: 'center',
  },
  heroChipValue: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.onPrimary },
  heroChipLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(10),
    color: 'rgba(255,255,255,0.9)',
    marginTop: rs(2),
  },

  // Blok sarlavhasi
  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    marginTop: rs(4),
    marginBottom: rs(-4),
  },

  // Asosiy ko'rsatkichlar
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  metricCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingTop: rs(14),
    paddingBottom: rs(14),
    overflow: 'hidden',
  },
  metricCardSoon: { opacity: 0.75 },
  metricAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: rs(4),
  },
  metricHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
    marginTop: rs(2),
  },
  soonBadge: {
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  soonText: { fontFamily: rd.font.semibold, fontSize: rs(10), color: rd.color.primary },
  metricLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  metricUzs: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginTop: rs(4) },
  metricUsd: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textTertiary, marginTop: rs(2) },
  metricValueBig: { fontFamily: rd.font.bold, fontSize: rs(24), color: rd.color.text },

  // Modullar
  moduleCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  moduleSoonCard: { opacity: 0.8 },
  moduleHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  moduleTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15.5), color: rd.color.text },
  moduleSubRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  moduleSub: { flex: 1, borderRadius: rs(14), padding: rs(12) },
  moduleSubAmt: { fontFamily: rd.font.bold, fontSize: rs(15) },
  moduleSubUsd: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(1) },
  moduleSubLabel: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(4) },

  // Balance card
  balanceCard: { borderRadius: rs(24), padding: rs(20), overflow: 'hidden', gap: rs(16) },
  balanceTop: { flexDirection: 'row', alignItems: 'center' },
  balanceTitle: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.onPrimaryStrong },
  trendChip: { backgroundColor: rd.color.onPrimaryChip, paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rs(20) },
  trendText: { fontFamily: rd.font.semibold, fontSize: rs(11), color: rd.color.onPrimary },
  balanceTotal: { fontFamily: rd.font.bold, fontSize: rs(30), color: rd.color.onPrimary },
  balanceDivider: { height: 1, backgroundColor: rd.color.onPrimaryChip },
  statsRow: { flexDirection: 'row', gap: rs(12) },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  statLabel: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.onPrimaryMuted },
  statValue: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.onPrimary, marginTop: 1 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: rs(10) },
  actionCard: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    paddingTop: rs(14),
    paddingBottom: rs(12),
    alignItems: 'center',
    gap: rs(8),
  },
  actionLabel: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textSecondary },

  // Qarzdorlik kartalari — JONLI GRADIENT (fintech)
  debtRow: { flexDirection: 'row', gap: rs(12) },
  debtCard: {
    flex: 1,
    borderRadius: rs(22),
    paddingHorizontal: rs(16),
    paddingTop: rs(16),
    paddingBottom: rs(18),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  debtTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  debtIconWrap: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: 'rgba(255,255,255,0.9)',
  },
  debtAmount: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.onPrimary,
    marginTop: rs(4),
    letterSpacing: 0.2,
  },
  debtUsdChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(11),
    paddingVertical: rs(5),
    marginTop: rs(9),
  },
  debtUsd: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.onPrimary },
  debtCount: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: 'rgba(255,255,255,0.95)',
    marginTop: rs(10),
  },

  // Generic card
  card: { backgroundColor: rd.color.surface, borderRadius: rs(20), padding: rs(16) },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },

  // Contracts
  contractsRow: { flexDirection: 'row', alignItems: 'center', gap: rs(16) },
  legend: { flex: 1, gap: rs(9) },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  dot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  legendLabel: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary },
  legendCount: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },

  // Warning
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.warningBg,
    borderRadius: rs(16),
    paddingHorizontal: rs(14),
    paddingVertical: rs(13),
  },
  warningText: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: rd.font.semibold, fontSize: rs(16), color: rd.color.text },
  sectionLink: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.primary },

  // Recent ops
  opsCard: { backgroundColor: rd.color.surface, borderRadius: rs(16), padding: rs(4) },
  opRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(12) },
  opDivider: { height: 1, backgroundColor: rd.color.border },
  opName: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  opSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: 2 },
  opAmount: { fontFamily: rd.font.semibold, fontSize: rs(14) },
  loadingRow: { paddingVertical: rs(6), alignItems: 'center' },
  opsEmpty: { alignItems: 'center', gap: rs(8), paddingVertical: rs(22) },
  opsEmptyText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary },

  // Bottom tab (past chetга mahkam)
  bottomWrap: { paddingHorizontal: rs(12), paddingTop: rs(8), paddingBottom: rs(8), backgroundColor: rd.color.page },
  tabBar: {
    height: rs(64),
    paddingHorizontal: rs(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rs(22),
  },
  tabItem: { flex: 1, alignItems: 'center', gap: rs(4), paddingBottom: rs(2) },
  tabLabel: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
  tabLabelActive: { fontFamily: rd.font.semibold, color: rd.color.primary },
  tabDot: { width: rs(5), height: rs(5), borderRadius: rs(2.5), backgroundColor: 'transparent' },
});
