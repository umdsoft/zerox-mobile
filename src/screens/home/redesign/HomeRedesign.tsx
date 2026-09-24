/**
 * HomeRedesign.tsx — Bosh sahifa (RD/01 Asosiy) redizayni.
 * Figma: ZeroX Mobile App — UI/UX (node 286:2).
 *
 * - Layout SafeArea insets bilan (tepa/past bo'shliqsiz, har qanday telefonga to'liq mos).
 * - O'lchamlar rs() bilan qurilma eniga proporsional masshtablanadi.
 * - Tugmalar useNavigation orqali real ekranlarga o'tadi.
 * Ma'lumot hozircha statik (Figma bilan bir xil) — keyin Redux/backendga ulanadi.
 */
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
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
import Toast from 'react-native-toast-message';
import { HomeApi, getNotificationWithPage } from '../../../store/api/home';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { compactMoney, fmtUZS, fmtUSD } from '../../../helper/money';
import { sortText } from '../../components/StatisticCard';
import socketService from '../../../helper/socketService';
import { DEBT_NAV } from './debtNav';
// Rasmiy "ZeroX" wordmark (logotipning matn qismi) — header uchun.
import ZeroXWordmark from '../../../images/TextAndLogo';
import { useFetch } from '../../../hooks/useFetch';
// SS13: bosh sahifa summalari TANLANGAN do'konga bo'ysunadi.
import { ownShopQuery, useQarzShop } from '../../../store/api/token/qarzShop';
import { URL } from '../../constants';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BellIcon,
  BulbIcon,
  InfoIcon,
  ChevronRight,
  CoinIcon,
  ContractIcon,
  IconProps,
  LedgerIcon,
  MenuIcon,
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
    {/* Chapda: menyu + ilova nomi — foydalanuvchi qayerdaligini biladi. */}
    <View style={styles.headerLeft}>
      {/* Menyu tugmasi — DOIRASIZ (so'rov bo'yicha): faqat 3 ta tayoqcha. */}
      <TouchableOpacity activeOpacity={0.7} style={styles.menuBtn} onPress={onMenu}>
        <MenuIcon color={rd.color.text} size={rs(24)} />
      </TouchableOpacity>
      {/* Rasmiy "ZeroX" wordmark (logotip shrifti va rangi). viewBox kengroq +
          balandroq render — pastki qismi kesilmasin (Samsung'da kesilib turgandi). */}
      <ZeroXWordmark
        width={rs(90)}
        height={rs(30)}
        viewBox="0 250 4000 1300"
        fill="#0063B6"
        color="#FF2D2D"
      />
    </View>

    {/* O'ngda: qo'ng'iroq, keyin avatar (eski ilovadagi tartib). */}
    <View style={styles.headerRight}>
      <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn} onPress={onBell}>
        <BellIcon color={rd.color.text} size={rs(24)} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} allowFontScaling={false} numberOfLines={1}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} style={styles.avatar} onPress={onProfile}>
        <GradientBg />
        <UserIcon color={rd.color.onPrimary} size={rs(20)} />
      </TouchableOpacity>
    </View>
  </View>
);


type BalanceData = { total: string; trend: string; owedToMe: string; iOwe: string };


// Qarzdorlik ro'yxatlariga navigatsiya paramlari endi `./debtNav` faylida —
// QarzShartnomasi kartalari ham aynan shu ro'yxatga o'tadi (bitta manba).


type ContractsData = { total: string; segments: { label: string; count: string; color: string; value: number }[] };



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
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.hero}>
      <Grad id="heroGrad" colors={GRAD.brand} />
      {/* allowFontScaling={false} — ILDIZ SABAB (SS4): usiz Samsung "katta shrift"
          sozlamasi hero matnlarini kattalashtirib, chip label 2-qatori hero'ning
          overflow:hidden kesilgan pastki chetiga tushib, kartalar ustiga "oq blur"
          bo'lib ko'rinardi. Endi matn dizayn o'lchamida qat'iy — hech narsa kesilmaydi. */}
      <Text style={styles.heroTitle} numberOfLines={2} allowFontScaling={false}>
        {name ? t('Xush kelibsiz, {{name}}!', { name }) : t('Xush kelibsiz!')}
      </Text>
      <Text style={styles.heroSub} numberOfLines={2} allowFontScaling={false}>
        {t('Shartnomalarni elektron rasmiylashtiring va oson boshqaring.')}
      </Text>
      <View style={styles.heroChips}>
        <View style={styles.heroChip}>
          <Text style={styles.heroChipValue} numberOfLines={1} allowFontScaling={false}>
            {score}
          </Text>
          <Text style={styles.heroChipLabel} numberOfLines={2} allowFontScaling={false}>
            {t('Moliyaviy sog‘liq')}
          </Text>
        </View>
        <View style={styles.heroChip}>
          <Text style={styles.heroChipValue} numberOfLines={1} allowFontScaling={false}>
            {t(status)}
          </Text>
          <Text style={styles.heroChipLabel} numberOfLines={2} allowFontScaling={false}>
            {t('Holat')}
          </Text>
        </View>
      </View>
    </View>
  );
};

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
  loading,
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
  loading?: boolean;
  onPress?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      activeOpacity={comingSoon ? 1 : 0.85}
      disabled={comingSoon}
      onPress={onPress}
      style={[
        styles.metricCard,
        // SS1-2 (2026-09-21): bu ikki karta modul kartalaridan AJRALIB
        // tursin — o'z rangidan juda yengil fon va chegara oladi.
        !comingSoon && { backgroundColor: accent + '0D', borderColor: accent + '33' },
        comingSoon && styles.metricCardSoon,
      ]}
    >
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <View style={styles.metricHead}>
        <CircleIcon size={rs(32)} bg={accentBg}>
          <Icon size={rs(17)} color={accent} />
        </CircleIcon>
        {/* SS1-1: yorliq ikonka TAGIDA emas, O'NG TOMONIDA. */}
        {!comingSoon ? (
          <Text style={styles.metricLabelInline} numberOfLines={2}>
            {t(label)}
          </Text>
        ) : null}
        {comingSoon ? (
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>{t('Tez kunda')}</Text>
          </View>
        ) : null}
      </View>
      {comingSoon ? (
        <>
          <Text style={styles.metricValueBig}>{value}</Text>
          <Text style={styles.metricLabel}>{t(label)}</Text>
        </>
      ) : (
        <>
          {/* SS1-1: yorliq endi yuqorida, ikonka yonida chiziladi. */}
          {loading ? (
            // Dashboard (shartnoma+daftar birlashgan summa) hali kelmagan —
            // qisman/xato raqam KO'RSATILMAYDI (aks holda keyin sakraydi).
            // O'rniga skeleton; summa TAYYOR bo'lganda bir marta paydo bo'ladi.
            <View style={styles.metricSkeleton} />
          ) : (
            <>
              <Text style={styles.metricUzs} numberOfLines={1} adjustsFontSizeToFit>
                {uzs}
              </Text>
              {usd ? <Text style={styles.metricUsd}>{usd}</Text> : null}
            </>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// Modul kartasi — "Qarz shartnomasi" (Debitor + Kreditor qiymatlari bilan).
// Modul kartasi — sarlavha + ikona + IKKI sub-summa (Debitor / Kreditor).
// Qarz shartnomasi VA Qarz daftari uchun bitta shakl (faqat ikona/nom/summa farq).
const ModuleWithSubs = ({
  title,
  Icon,
  debUzs,
  debUsd,
  credUzs,
  credUsd,
  onPress,
  // So'rov SS20: Shaxsiy moliya kartasi uchun yorliqlar (Daromadlar/Xarajatlar).
  debLabel,
  credLabel,
  // So'rov SS1: strelka o'rniga lampochka — bosilsa bo'lim izohi (info) modalда chiqadi.
  info,
}: {
  title: string;
  Icon: (p: IconProps) => JSX.Element;
  debUzs: string;
  debUsd: string;
  credUzs: string;
  credUsd: string;
  onPress: () => void;
  debLabel?: string;
  credLabel?: string;
  info?: string;
}) => {
  const { t } = useTranslation();
  const [infoOpen, setInfoOpen] = React.useState(false);
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.moduleCard} onPress={onPress}>
      <View style={styles.moduleHead}>
        <CircleIcon size={rs(38)} bg={rd.color.primaryTint}>
          <Icon size={rs(20)} color={rd.color.primary} />
        </CircleIcon>
        <Text style={styles.moduleTitle}>{t(title)}</Text>
        {info ? (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={e => {
              e.stopPropagation();
              setInfoOpen(true);
            }}
            style={styles.moduleInfoBtn}>
            {/* So'rov: lampochka o'rniga ixcham, chiroyli "i" (info) belgisi. */}
            <InfoIcon size={rs(15)} color={rd.color.textTertiary} />
          </TouchableOpacity>
        ) : (
          <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
        )}
      </View>
      <View style={styles.moduleSubRow}>
        <View style={[styles.moduleSub, { backgroundColor: rd.color.successBg }]}>
          <Text style={[styles.moduleSubAmt, { color: rd.color.success }]} numberOfLines={1} adjustsFontSizeToFit>
            {debUzs}
          </Text>
          {debUsd ? <Text style={styles.moduleSubUsd}>{debUsd}</Text> : null}
          <Text style={styles.moduleSubLabel}>{t(debLabel || 'Berilgan qarz')}</Text>
        </View>
        <View style={[styles.moduleSub, { backgroundColor: rd.color.errorBg }]}>
          <Text style={[styles.moduleSubAmt, { color: rd.color.error }]} numberOfLines={1} adjustsFontSizeToFit>
            {credUzs}
          </Text>
          {credUsd ? <Text style={styles.moduleSubUsd}>{credUsd}</Text> : null}
          <Text style={styles.moduleSubLabel}>{t(credLabel || 'Olingan qarz')}</Text>
        </View>
      </View>

      {/* So'rov SS1: bo'lim izohi — kichik ma'lumot oynasi (lampochka bosilganda). */}
      {info ? (
        <Modal
          visible={infoOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoOpen(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.infoOverlay}
            onPress={() => setInfoOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.infoSheet} onPress={() => {}}>
              <View style={styles.infoHeadRow}>
                <CircleIcon size={rs(34)} bg="#fef3c7">
                  <BulbIcon size={rs(18)} color="#f59e0b" />
                </CircleIcon>
                <Text style={styles.infoTitle}>{t(title)}</Text>
              </View>
              <Text allowFontScaling={false} style={styles.infoText}>
                {t(info)}
              </Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.infoBtn}
                onPress={() => setInfoOpen(false)}>
                <Text allowFontScaling={false} style={styles.infoBtnText}>
                  {t('Tushunarli')}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}
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
const toMln = (n: number) => compactMoney(n);

// Qarz-daftari dashboard KESHI (modul darajasida — komponent remount bo'lsa ham
// saqlanadi). Fon->oldinga qaytganda ilova qulflanib (PIN), unlock'dan keyin
// BottomTabNavigator QAYTA MOUNT bo'ladi -> home dashboard'ni qayta yuklaydi va
// bir lahza bo'sh bo'ladi. Kesh bo'lmasa debitor/kreditor summasi shartnoma+
// daftar'dan faqat shartnomaga "sakrab", keyin qaytadi. Kesh bilan remount'da
// darhol oldingi BIRLASHGAN qiymat ko'rsatiladi (sakrash yo'q).
let dashboardCache: any = null;
// SS13: kesh QAYSI do'kon uchun olinganini ham eslab qolamiz. Aks holda do'kon
// almashtirilib ekran qayta mount bo'lsa, oldingi do'konning summalari bir zum
// ko'rinib qolardi (foydalanuvchi uchun "filtr ishlamadi" degan taassurot).
let dashboardCacheScope: string | null = null;

// Bitta valyuta bo'yicha yig'indi (konvertatsiyasiz — USD'ni alohida ko'rsatish uchun).
const sumCur = (rows: any[] | undefined, cur: string) =>
  Math.round(
    (rows || []).reduce((s, r) => {
      const isCur = String(r?.currency || 'UZS').toUpperCase() === cur;
      return s + (isCur ? Number(r?.residual_amount || 0) : 0);
    }, 0),
  );

// Ixcham summa — yagona manba (src/helper/money.ts).
const shortAmt = (n: number) => compactMoney(n);

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
  (bild || [])
    // Faqat SUMMASI bor qarz amaliyotlari ko'rsatiladi. Ruxsat/info turlari
    // (19=ma'lumot so'rash, 30/31=ruxsat berildi/rad, 25=yangi foydalanuvchi ...)
    // summaga ega emas → ilgari "+0" bo'lib chiqardi. Ular bu "so'nggi amaliyotlar"
    // ro'yxatida ko'rsatilmaydi (to'liq ro'yxat Bildirishnomalar bo'limida qoladi).
    .filter(n => Number(n?.amount ?? n?.residual_amount ?? 0) > 0)
    .slice(0, 5)
    .map((n, i) => {
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
  const { t } = useTranslation();
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

  // SOCKET (real-time). REGRESSIYA TUZATUVI: redizaynda eski `Home.tsx` o'rniga
  // shu ekran kelganda `socketService.init(...)` chaqiruvi tushib qolgan edi —
  // natijada socket UMUMAN ulanmasdi (serverga doimiy ulanish yo'q edi) va
  // bildirishnoma/real-time yangilanishlar ishlamasdi. Eski mantiq tiklandi:
  // faqat offline bo'lsa init qilamiz (singleton — takror ulanmaydi).
  React.useEffect(() => {
    if (!myId) return;
    if (socketService.connected() !== 'Offline') return;
    socketService
      .init(String(myId))
      .then(() => {
        socketService.getSocket()?.connect();
      })
      .catch(() => {
        // token yo'q / init xatosi — ilovani buzmaymiz, real-time'siz davom etadi.
      });
  }, [myId]);

  // REAL-TIME KAFOLATI (Home). Muammo edi: foydalanuvchi Home'да o'tirганда socket
  // o'lib qolса (server uzsa yoki hech ulanmasa), `recive_notification` kelmасdi va
  // yangi bildirishnoma FAQAT Bildirishnomalar bo'limiga kirilганда ko'rinardi.
  // YECHIM: Home fokusда (va har 20s) socket tirikligini tekshiramiz — o'lik bo'lsa
  // qayta ulaymiz; hamda bildirishnoma ro'yxatini JIM (loading flash'siz) yangilaymiz,
  // shunда socket o'lik turган paytда o'tkazib yuborilган bildirishnomalar ham chiqadi.
  useFocusEffect(
    React.useCallback(() => {
      // OSILIB QOLGAN TOAST'NI DARHOL YOPAMIZ (global). Amal-ekranlar (qarzni
      // qaytarish/talab/uzaytirish/voz kechish) muvaffaqiyat toast'ini ko'rsatib,
      // so'ng Home'ga qaytaradi. Toast ILDIZ (navigator ustida) render bo'lgani
      // uchun, Toast.hide()+navigate bir tikда bajarilsa ham hide-animatsiyasi
      // Home bilan yopishib ~1s ko'rinib turardi. Home fokusга kelishi bilan
      // shu yerда darhol yopamiz — har qanday amal-ekrandан kelsa ham ishlaydi.
      Toast.hide();
      const ensureSocketAlive = () => {
        if (!myId) return;
        const s = socketService.getSocket();
        if (s && !s.connected) {
          s.connect();
        }
      };
      ensureSocketAlive();
      // Jim catch-up — faqat bildirishnoma ro'yxati (home kartalari loading flash bermaydi).
      dispatch(getNotificationWithPage({ page: 1 }) as any);
      const iv = setInterval(ensureSocketAlive, 20000);
      return () => clearInterval(iv);
    }, [myId, dispatch]),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    (dispatch(HomeApi({ page: 1 }) as any) as any)
      .unwrap?.()
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [dispatch]);

  // Ism: FAQAT identifikatsiyadan o'tgan (is_active === 1) va ismi bor foydalanuvchiga
  // "Xush kelibsiz, {ism}!"; aks holda (identifikatsiyasiz yoki ism yo'q) — shunchaki
  // "Xush kelibsiz!" (so'rov bo'yicha; "Foydalanuvchi" default nomi endi ishlatilmaydi).
  const isIdentified = storeUser?.data?.is_active === 1;
  const first = storeUser?.data?.first_name;
  const name = isIdentified && first ? first : '';
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

  // ── Qarz shartnomasi + Qarz daftari birgalikdagi summalar (web dashboard bilan
  //    bir xil manba). `/qarz-daftari/dashboard` HAM shartnoma, HAM daftar
  //    summalarini qaytaradi:
  //      berilgan_qarz.{shartnoma,daftari}.{uzs,usd}  → DEBITOR (menga qarzdor)
  //      olingan_qarz.{shartnoma,daftari}.{uzs,usd}   → KREDITOR (men qarzdor)
  //    Yuqoridagi metrik kartalar = shartnoma + daftar (birlashgan).
  //    Modul kartalari esa har biri O'Z modulini ko'rsatadi.
  // SS13 (2026-09-15): bosh sahifa dashboard'i TANLANGAN DO'KONGA bo'ysunadi.
  // Ildiz sabab: bu chaqiruvda `faoliyat_id` YO'Q edi, shu bois "Qarz daftari"
  // bo'limida bitta do'kon tanlansa ham bosh sahifadagi "Berilgan/Olingan qarz"
  // va "Qarz daftari" kartalari BARCHA do'konlar yig'indisini ko'rsatardi.
  // (`QarzDaftari` ekrani filtrni allaqachon yuborardi — ikki ekran bir-biriga
  // zid raqam chiqarardi.) Backend faqat DAFTAR so'rovlarini filtrlaydi;
  // shartnoma va shaxsiy qarz do'kondan tashqarida bo'lgani uchun o'zgarmaydi.
  // Do'kon o'zgarsa komponent qayta render bo'ladi -> quyidagi URL yangilanadi.
  useQarzShop();
  // SS-F (2026-09-16): `ownShopQuery` — `shopQuery` dan farqi shuki, foydalanuvchi
  // XODIM bo'lgan BEGONA do'kon tanlangan bo'lsa filtr YUBORILMAYDI va bosh
  // sahifa faqat O'Z ma'lumotlarini ko'rsatadi. Talab: "Xodim ishlaydigan
  // do'konning qarzlari bosh sahifadagi umumiy kartalarda qayd etilmasin".
  const homeShopQs = ownShopQuery('?');
  const daftariDash = useFetch({
    url: `${URL}/qarz-daftari/dashboard${homeShopQs}`,
    method: 'GET',
  });
  /**
   * 🔴 SS-DEV ILDIZ SABAB (2026-09-24): bosh sahifadagi "Shaxsiy qarz" kartasi
   * bilan "Shaxsiy qarz" bo'limi summalari FARQ qilardi. Karta `/home/analytics`
   * (`analytics.debts.*`) dan olardi — u FAQAT foydalanuvchining O'ZI kiritgan
   * `personal_debts` yozuvlarini qo'shadi. Bo'lim esa `/finance/debts/stats`
   * dan oladi — unda HAMKOR QAYDLARI (boshqa foydalanuvchi meni qarzdor/qarz
   * beruvchi deb kiritgan) va DO'KON (qarz daftari) qarzlari ham bor.
   * Endi ikkala ekran BITTA manba — `/finance/debts/stats` (valyuta bo'yicha).
   * Stats hali kelmagan bo'lsa analytics'ga (eski manba) qaytiladi.
   */
  const debtStats = useFetch({ url: `${URL}/finance/debts/stats`, method: 'GET' });
  const debtStatsData: any = (debtStats.data as any)?.data || null;
  const curTotal = (arr: any[] | undefined, cur: string): number =>
    Array.isArray(arr) ? arr.reduce((s, x) => (x?.currency === cur ? s + Number(x?.total || 0) : s), 0) : 0;
  // Bo'limda qarz qo'shilgach bosh sahifaga qaytilganda karta ESKIRMASIN:
  // har fokusda (birinchisidan tashqari) va pull-to-refresh'da jim yangilanadi.
  const refreshDebtStats = debtStats.onRefresh;
  const debtStatsFirstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (debtStatsFirstFocus.current) {
        debtStatsFirstFocus.current = false;
        return;
      }
      refreshDebtStats({});
    }, [refreshDebtStats]),
  );
  React.useEffect(() => {
    if (refreshing) refreshDebtStats({});
  }, [refreshing, refreshDebtStats]);
  const dashFresh: any = (daftariDash.data as any)?.data || daftariDash.data || {};
  // Yangi javob TO'LIQ kelgan bo'lsa keshni yangilaymiz; aks holda (remount'da
  // bo'sh bo'lganda) oldingi keshdan foydalanamiz -> summalar sakramaydi.
  const dashValid = !!(dashFresh?.berilgan_qarz || dashFresh?.olingan_qarz);
  if (dashValid) {
    dashboardCache = dashFresh;
    dashboardCacheScope = homeShopQs;
  }
  // Kesh faqat AYNAN shu do'kon uchun olingan bo'lsa ishlatiladi.
  const cacheUsable = dashboardCacheScope === homeShopQs ? dashboardCache : null;
  const dd: any = dashValid ? dashFresh : cacheUsable || {};
  // Metrik kartalar (Berilgan/Olingan qarz) BIRLASHGAN summasi (shartnoma+daftar)
  // faqat dashboard TAYYOR bo'lganda ko'rsatiladi. Aks holda birinchi yuklashda
  // avval faqat-shartnoma summasi chiqib, keyin daftar qo'shilib SAKRAB ketardi.
  // Kesh bo'lsa (keyingi mount'lar) darhol tayyor -> skeleton ko'rinmaydi.
  const dashReady = dashValid || !!cacheUsable;
  const numv = (v: any) => Number(v || 0);
  const bqDash = dd?.berilgan_qarz;
  const oqDash = dd?.olingan_qarz;
  // Shartnoma (dashboard bo'lsa undan, aks holda mavjud redux summasiga qaytamiz).
  const shDebUZS = bqDash ? numv(bqDash?.shartnoma?.uzs) : debUZS;
  const shDebUSD = bqDash ? numv(bqDash?.shartnoma?.usd) : debUSD;
  const shCredUZS = oqDash ? numv(oqDash?.shartnoma?.uzs) : credUZS;
  const shCredUSD = oqDash ? numv(oqDash?.shartnoma?.usd) : credUSD;
  // Daftar (dashboard yuklanmagunicha 0).
  const dfDebUZS = numv(bqDash?.daftari?.uzs);
  const dfDebUSD = numv(bqDash?.daftari?.usd);
  const dfCredUZS = numv(oqDash?.daftari?.uzs);
  const dfCredUSD = numv(oqDash?.daftari?.usd);
  // SS2-1 (2026-09-14): SHAXSIY QARZ (personal_debts) ham qarzning uchinchi
  // manbasi — "Berilgan qarz"/"Olingan qarz" metrik kartalari endi uni ham
  // hisobga oladi. Modul kartalari (Qarz shartnomasi / Qarz daftari) esa
  // avvalgidek FAQAT o'z modulini ko'rsatadi — ularga tegilmadi.
  const pjDebUZS = numv(bqDash?.shaxsiy?.uzs);
  const pjDebUSD = numv(bqDash?.shaxsiy?.usd);
  const pjCredUZS = numv(oqDash?.shaxsiy?.uzs);
  const pjCredUSD = numv(oqDash?.shaxsiy?.usd);
  // Birlashgan (yuqori metrik kartalar) = shartnoma + daftar + shaxsiy.
  const totDebUZS = shDebUZS + dfDebUZS + pjDebUZS;
  const totDebUSD = shDebUSD + dfDebUSD + pjDebUSD;
  const totCredUZS = shCredUZS + dfCredUZS + pjCredUZS;
  const totCredUSD = shCredUSD + dfCredUSD + pjCredUSD;

  // Karta summa matnlari — so'rov bo'yicha: "UZS"/"USD" + K/M/B qisqartma;
  // qarz bo'lmasa ham "0 UZS"/"0 USD" DOIM ko'rsatiladi (ikkala qator turadi).
  const uzsText = (n: number) => fmtUZS(n);
  const usdText = (n: number) => fmtUSD(n);

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

        {/* Sarlavhasiz: kartalarning o'zi nimani ko'rsatayotganini aytadi,
            ustidagi umumiy nom qo'shimcha ma'lumot bermasdi. */}
        <View style={styles.metricGrid}>
          {/* BIRLASHGAN summa: qarz shartnomasi + qarz daftari (web bilan bir xil). */}
          <MetricCard
            accent={rd.color.success}
            accentBg={rd.color.successBg}
            Icon={ArrowUpRight}
            label="Berilgan qarz"
            uzs={uzsText(totDebUZS)}
            usd={usdText(totDebUSD)}
            loading={!dashReady}
            // Home drill-down -> manba TANLASH sahifasi (2 vertikal karta), ro'yxatsiz.
            onPress={() =>
              nav('SearchDebitor', { ...DEBT_NAV.debitor, view: 'select' })
            }
          />
          <MetricCard
            accent={rd.color.error}
            accentBg={rd.color.errorBg}
            Icon={ArrowDownLeft}
            label="Olingan qarz"
            uzs={uzsText(totCredUZS)}
            usd={usdText(totCredUSD)}
            loading={!dashReady}
            onPress={() =>
              nav('SearchDebitor', { ...DEBT_NAV.creditor, view: 'select' })
            }
          />
          {/* "Oylik xarajat" va "Maqsadlar" kartalari OLIB tashlandi (so'rov) —
              bu ma'lumotlar Shaxsiy moliya bo'limida ko'rsatiladi. */}
        </View>

        {/* Qarz shartnomasi — FAQAT shartnoma summasi + shartnoma ikonasi. */}
        <ModuleWithSubs
          title="Qarz shartnomasi"
          Icon={ContractIcon}
          info="Qarz shartnomasi asosida pul bersangiz, elektron shartnomaga ega bo‘lasiz. Har bir shartnoma ikki taraf tomonidan tasdiqlanadi va yuridik kuchga ega bo‘ladi. Berilgan qarz — siz bergan, olingan qarz — siz olgan qarz mablag‘lari."
          debUzs={uzsText(shDebUZS)}
          debUsd={usdText(shDebUSD)}
          credUzs={uzsText(shCredUZS)}
          credUsd={usdText(shCredUSD)}
          onPress={() => nav('QarzShartnomasi')}
        />
        {/* Qarz daftari — FAQAT daftar summasi + daftar ikonasi + debitor/kreditor. */}
        <ModuleWithSubs
          title="Qarz daftari"
          Icon={LedgerIcon}
          info="Qarz daftari — savdo faoliyatida qarz muammolaridan qutulish uchun oson yechim. Rasmiy shartnoma tuzmasdan qarz savdolarini tizimda tez va oson ro‘yxatga olasiz. Muddatli eslatmalar esa mijozlarga qarzlarni vaqtida qaytarishga undaydi."
          debUzs={uzsText(dfDebUZS)}
          debUsd={usdText(dfDebUSD)}
          credUzs={uzsText(dfCredUZS)}
          credUsd={usdText(dfCredUSD)}
          onPress={() => nav('QarzDaftari')}
        />
        {/* SS1: Bosh sahifada "Shaxsiy moliya" o'rniga "Shaxsiy qarz" — Debitor
            (qarzga berdim=lent, yashil) / Kreditor (qarzga oldim=borrowed, qizil),
            UZS+USD alohida. Ma'lumot Shaxsiy moliya (analytics.finance) qarzlaridan. */}
        <ModuleWithSubs
          title="Shaxsiy qarz"
          Icon={CoinIcon}
          info="Shaxsiy qarz — bu tanishlaringiz bilan o‘zaro oldi-berdi munosabatlaringiz. Bergan va olgan qarzlaringizni tizimda ro‘yxatdan o‘tkazish orqali moliyaviy holatingizni doimiy kuzatib borasiz."
          debLabel="Berilgan qarz"
          credLabel="Olingan qarz"
          debUzs={uzsText(debtStatsData ? curTotal(debtStatsData.lent_by_currency, 'UZS') : numv(analytics?.debts?.lent_uzs))}
          debUsd={usdText(debtStatsData ? curTotal(debtStatsData.lent_by_currency, 'USD') : numv(analytics?.debts?.lent_usd))}
          credUzs={uzsText(debtStatsData ? curTotal(debtStatsData.borrowed_by_currency, 'UZS') : numv(analytics?.debts?.borrowed_uzs))}
          credUsd={usdText(debtStatsData ? curTotal(debtStatsData.borrowed_by_currency, 'USD') : numv(analytics?.debts?.borrowed_usd))}
          onPress={() => nav('FinanceDebts')}
        />
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
  // gap rs(14): ZeroX wordmark menyu ikonasidan yetarlicha uzoqda — o'rta
  // tayoqchani to'smaydi (ilgari juda yaqin edi).
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  // Menyu tugmasi — doirasiz, faqat teginish maydoni.
  menuBtn: {
    width: rs(40),
    height: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  // Kattaroq + raqam markazда to'liq sig'adi (allowFontScaling=false bilan birga).
  badge: {
    position: 'absolute',
    top: -6,
    right: -7,
    minWidth: rs(20),
    height: rs(20),
    paddingHorizontal: rs(4),
    borderRadius: rs(10),
    backgroundColor: rd.color.error,
    borderWidth: 1.5,
    borderColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: rd.font.bold,
    fontSize: rs(10.5),
    lineHeight: rs(13),
    color: rd.color.onPrimary,
    textAlign: 'center',
  },

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
  heroTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.onPrimary },
  heroSub: {
    fontFamily: rd.font.regular,
    // So'rov (SS1): butun card matni "1,7 mln" (metric summa) kabi KATTA bo'lsin.
    // 11.5→12.5→13.5→15.
    fontSize: rs(15),
    color: 'rgba(255,255,255,0.92)',
    marginTop: rs(5),
    lineHeight: rs(20),
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
  // SS1-3 (2026-09-21): QIYMAT (100 / A'lo) yorlig'idan KICHIK edi
  // (13.5 va 14.5) — teskari ierarxiya. Endi qiymat ustun.
  heroChipValue: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.onPrimary },
  heroChipLabel: {
    // Chip yorlig'i (Moliyaviy sog'liq / Holat) KATTAROQ (rs14.5; ilgari 10→12.5→13).
    fontFamily: rd.font.medium,
    fontSize: rs(14.5),
    color: 'rgba(255,255,255,0.92)',
    marginTop: rs(3),
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
    // SS1-1: yorliq ikonka yonida — `space-between` uni o'ng chekkaga
    // itarib yuborardi, shu bois chapga tekislanadi.
    justifyContent: 'flex-start',
    marginBottom: rs(8),
    marginTop: rs(2),
  },
  soonBadge: {
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  soonText: { fontFamily: rd.font.semibold, fontSize: rs(10), color: rd.color.primary },
  metricLabel: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
  // SS1-1 (2026-09-21): ikonka YONIDAGI yorliq.
  metricLabelInline: {
    flex: 1,
    marginLeft: rs(8),
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    lineHeight: rs(14),
  },
  // fontSize rs(15): uzun pul matnlari (`adjustsFontSizeToFit`) ~14.5'ga kichrayadi;
  // qisqa "37%" esa bazaда qolardi. Bazani 17→15 tushirib, foiz ham pul kartalari
  // bilan bir xil ko'rinadi (ilgari "37%" boshqa kartalardagi raqamdan katta edi).
  metricUzs: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text, marginTop: rs(4) },
  metricUsd: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  metricValueBig: { fontFamily: rd.font.bold, fontSize: rs(19), color: rd.color.text },
  // Summa hali tayyor emas — skeleton (metricUzs balandligiga mos, layout siljimaydi).
  metricSkeleton: {
    height: rs(18),
    width: '68%',
    borderRadius: rs(6),
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(7),
    marginBottom: rs(3),
  },

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
  moduleTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  // SS1: lampochka tugma + bo'lim izohi modal
  moduleInfoBtn: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  infoSheet: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    padding: rs(20),
  },
  infoHeadRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(12) },
  infoTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  infoText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    lineHeight: rs(20),
    color: rd.color.textSecondary,
  },
  infoBtn: {
    marginTop: rs(18),
    height: rs(46),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.onPrimary },
  moduleSubRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  moduleSub: { flex: 1, borderRadius: rs(14), padding: rs(12) },
  moduleSubAmt: { fontFamily: rd.font.bold, fontSize: rs(13) },
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
  statValue: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.onPrimary, marginTop: 1 },

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
  debtUsd: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.onPrimary },
  debtCount: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: 'rgba(255,255,255,0.95)',
    marginTop: rs(10),
  },

  // Generic card
  card: { backgroundColor: rd.color.surface, borderRadius: rs(20), padding: rs(16) },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },

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
  warningText: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },


  // Ogohlantirishlar (alert-lar)
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    borderRadius: rd.radius.lg,
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
  },
  alertIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  alertSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  alertView: { fontFamily: rd.font.semibold, fontSize: rs(13) },
  alertEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(28),
    gap: rs(8),
  },
  alertEmptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textTertiary,
  },

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

});
