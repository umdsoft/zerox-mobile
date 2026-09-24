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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useFetch } from '../../../hooks/useFetch';
import {
  exitXodimSession,
  isXodimSession,
  xodimFaoliyatNomi,
} from '../../../store/api/token/xodimSession';
import {
  clearQarzShop,
  setQarzShop,
  shopQuery,
  syncQarzShopWithList,
  useQarzShop,
} from '../../../store/api/token/qarzShop';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import QarzDaftariKalendar from './QarzDaftariKalendar';
import Loading from '../../components/Loading';
import { sortText } from '../../components/StatisticCard';
import { fmtUZS, fmtUSD, groupDigits } from '../../../helper/money';
import RdHeader from '../redesign/RdHeader';
import RdTopBar from '../redesign/RdTopBar';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  ClockIcon,
  PencilIcon,
  PlusIcon,
  StorefrontIcon,
  IconProps,
  ShieldIcon,
} from '../redesign/icons';

type Nav = (route: string, params?: object) => void;

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const BLUE = '#2f6fed'; // berish / berilgan / shartnoma
const GREEN = '#16a34a'; // olish / olingan / daftari
const RED = '#dc2626'; // muddati o'tgan
const AMBER = '#f59e0b';
// SS2: uchinchi qarz manbasi — shaxsiy qarz (nisbat diagrammasi va manba kartasi).
const PERSONAL = '#6d5ae6';
const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;

// ---------- Yordamchilar ----------
// Summa kartalari — so'rov bo'yicha K/M/B qisqartma: 1 050 000 -> "1,05 M UZS",
// 550 000 -> "550 K UZS" (ro'yxat satrlari esa formatMln bilan to'liq qoladi).
const uzsText = (n: number) => fmtUZS(n);
const usdText = (n: number) => fmtUSD(n);

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
  // So'rov SS2.2: "1 kun qoldi", "2 kun qoldi" (ilgari "Ertaga"/"N kun").
  return `${n} kun qoldi`;
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

// B) Hero banner — ko'k gradient. O'lcham/shrift va IKKI amal tugmasi QARZ SHARTNOMASI
// hero'si bilan BIR XIL (so'rov bo'yicha): "Qarz berish" (oq) + "Qarz olish" (yashil).
// Alohida "Tezkor amallar" bo'limi olib tashlangani uchun bu amallar endi shu kartada.
const Hero = ({ onBer, onOl }: { onBer: () => void; onOl: () => void }) => {
  const { t } = useTranslation();
  return (
  <View style={styles.hero}>
    <Grad id="qdHero" colors={GRAD_BRAND} />
    {/* "Qarz daftari" sarlavhasi OLIB TASHLANDI (so'rov bo'yicha) — yuqoridagi header
        allaqachon "Qarz daftari" deb turibdi. Kartada faqat tavsif + 2 amal tugmasi. */}
    <Text style={styles.heroSub} numberOfLines={2}>
      {t('Qarz oldi-berdi munosabatlaringizni elektron boshqaring.')}
    </Text>
    <View style={styles.heroBtns}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.heroBtn, styles.heroBtnLight]}
        onPress={onBer}
      >
        <ArrowUpRight size={rs(18)} color={rd.color.primary} />
        <Text style={[styles.heroBtnText, { color: rd.color.primary }]}>
          {t('Qarzga berish')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.heroBtn, { backgroundColor: rd.color.success }]}
        onPress={onOl}
      >
        <ArrowDownLeft size={rs(18)} color={rd.color.onPrimary} />
        <Text style={[styles.heroBtnText, { color: rd.color.onPrimary }]}>
          {t('Qarzga olish')}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
  );
};

// SS2 (2026-09-14): nisbat bari endi UCH manba — shartnoma (ko'k) + daftar
// (yashil) + shaxsiy qarz (binafsha). Uchinchi manba jami summaga qo'shilgani
// uchun diagramma ham uni ko'rsatishi SHART; aks holda foizlar jamiga mos
// kelmay, karta o'zini-o'zi inkor qilardi.
const RatioBar = ({
  contract,
  ledger,
  personal,
}: {
  contract: number;
  ledger: number;
  personal: number;
}) => {
  const { t } = useTranslation();
  const total = contract + ledger + personal;
  // Yaxlitlash sababli yig'indi 100 dan chiqib ketmasligi uchun oxirgi ulush
  // qoldiqdan hisoblanadi.
  const cPct = total > 0 ? Math.round((contract / total) * 100) : 0;
  const lPct = total > 0 ? Math.round((ledger / total) * 100) : 0;
  const pPct = total > 0 ? Math.max(0, 100 - cPct - lPct) : 0;
  const seg = [
    { pct: cPct, color: BLUE, label: t('Shartnoma {{pct}}%', { pct: cPct }) },
    { pct: lPct, color: GREEN, label: t('Daftar {{pct}}%', { pct: lPct }) },
    { pct: pPct, color: PERSONAL, label: t('Shaxsiy {{pct}}%', { pct: pPct }) },
  ];
  return (
    <View>
      <View style={styles.barTrack}>
        {seg.map((x, i) => (
          <View
            key={i}
            style={[styles.barFill, { flex: x.pct || 0.0001, backgroundColor: x.color }]}
          />
        ))}
      </View>
      <View style={styles.barLegend}>
        {seg.map((x, i) => (
          <View key={i} style={styles.barLegendItem}>
            <View style={[styles.barDot, { backgroundColor: x.color }]} />
            <Text style={styles.barLegendText}>{x.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// C) Umumiy ko'rinish kartasi (Berilgan / Olingan) — web DashboardChart.
// Jami = (uzs + usd*rate) shartnoma va daftari bo'yicha (nisbat uchun UZS'ga keltiriladi).
// SearchDebitor (Berilgan/Olingan select view) ham shu diagrammani ishlatadi —
// shuning uchun EXPORT qilinadi (bitta manba, bir xil ko'rinish).
export const DashboardChartCard = ({
  accent,
  Icon,
  title,
  usdRate,
  shartnomaUzs,
  shartnomaUsd,
  daftariUzs,
  daftariUsd,
  shaxsiyUzs = 0,
  shaxsiyUsd = 0,
}: {
  accent: string;
  Icon: (p: IconProps) => JSX.Element;
  title: string;
  usdRate: number;
  shartnomaUzs: number;
  shartnomaUsd: number;
  daftariUzs: number;
  daftariUsd: number;
  // SS2: uchinchi manba — shaxsiy qarz. Default 0 (eski chaqiruvlar buzilmaydi).
  shaxsiyUzs?: number;
  shaxsiyUsd?: number;
}) => {
  const { t } = useTranslation();
  const rate = usdRate || 0;
  const shartnomaTotalUzs = shartnomaUzs + shartnomaUsd * rate;
  const daftariTotalUzs = daftariUzs + daftariUsd * rate;
  const shaxsiyTotalUzs = shaxsiyUzs + shaxsiyUsd * rate;
  const totalCombined = shartnomaTotalUzs + daftariTotalUzs + shaxsiyTotalUzs;
  const totalUsd = shartnomaUsd + daftariUsd + shaxsiyUsd;

  return (
    <View style={styles.card}>
      <View style={styles.ovHead}>
        <CircleIcon size={rs(36)} bg={accent + '1A'}>
          <Icon size={rs(18)} color={accent} />
        </CircleIcon>
        <View style={{ flex: 1 }}>
          <Text style={styles.ovTitle}>{title}</Text>
          <Text style={styles.ovSubtitle}>{t('Manbalar nisbati')}</Text>
        </View>
      </View>

      <Text style={styles.ovTotalLabel}>{t('Jami')}</Text>
      <Text style={styles.ovTotal} numberOfLines={1} adjustsFontSizeToFit>
        {uzsText(Math.round(totalCombined))}
      </Text>
      {rate > 0 && totalUsd > 0 && (
        <Text style={styles.ovRate}>
          {t('Markaziy bank kursi: 1 USD = {{rate}} UZS', { rate: sortText(rate) || 0 })}
        </Text>
      )}

      <View style={{ marginTop: rs(12) }}>
        <RatioBar
          contract={shartnomaTotalUzs}
          ledger={daftariTotalUzs}
          personal={shaxsiyTotalUzs}
        />
      </View>

      {/* Ilgari bu yerda "Qarz shartnomasi" va "Qarz daftari" subkartalari bor edi —
          so'rov bo'yicha OLIB TASHLANDI (ular pastdagi "Manbalar bo'yicha" navigatsiya
          kartalarini takrorlardi). Diagramma endi faqat umumiy summa + kurs + nisbatni
          ko'rsatadi. */}
    </View>
  );
};

// (D) "Amal kartasi" (ActionCard) — "Tezkor amallar" bo'limi bilan birga OLIB TASHLANDI
// (so'rov bo'yicha). Qarz berish/olish amallari endi hero kartadagi tugmalarda.

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
  const { t } = useTranslation();
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
        {/* numberOfLines 1→2: uzun sarlavha ("Muddati yaqin berilgan qarzlar")
            UZS/USD toggle yonida 2 qatorda TO'LIQ ko'rinadi (kesilmaydi). */}
        <Text style={[styles.tableTitle, { color: accent }]} numberOfLines={2}>
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
            {t('Yaqin orada muddati tugaydigan qarzlar yo‘q.')}
          </Text>
        </View>
      ) : (
        <>
          {/* So'rov SS2.2: "Mijoz" ustuni OLINDI; "Muddat"→"Qolgan vaqt".
              Endi 2 ustun: Qolgan vaqt (chap) | Qarz miqdori (o'ng). */}
          <View style={styles.trHead}>
            <Text style={[styles.thText, styles.colDate2]}>{t('Qolgan vaqt')}</Text>
            <Text style={[styles.thText, styles.colAmt]}>{t('Qarz miqdori')}</Text>
          </View>
          {filtered.map((row, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => onRow(row.id)}
              style={styles.tr}
            >
              <View style={styles.colDate2}>
                <View
                  style={[styles.dayPill, { backgroundColor: daysColor(row.end) + '1A' }]}
                >
                  <Text style={[styles.dayPillText, { color: daysColor(row.end) }]}>
                    {daysText(row.end)}
                  </Text>
                </View>
              </View>
              {/* So'rov SS2: summa qisqartirilmasin (mln/mlrd emas) — to'liq
                  raqam, mingliklar bo'shliq bilan: "1 000 000 000 UZS". */}
              <Text style={[styles.tdAmt, styles.colAmt]} numberOfLines={1} adjustsFontSizeToFit>
                {`${groupDigits(row.amount)} ${row.currency}`}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
};

// G) Ogohlantirish banneri (yopiladigan).
const WarningBanner = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  return (
  <View style={styles.warnBox}>
    <ShieldIcon size={rs(20)} color={AMBER} />
    <Text style={styles.warnText}>
      {t(
        'Qarz oldi-berdi munosabatlaringizni qarz daftariga kiritish orqali qarzlaringizni elektron boshqarish imkoniyatiga ega bo‘lasiz. Biroq bu holatda qarz daftariga kiritilgan qarzlar bo‘yicha qarz shartnomasi rasmiylashtirilmaydi.',
      )}
    </Text>
    <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.warnClose}>
      <Text style={styles.warnCloseText}>{t('Tushundim')}</Text>
    </TouchableOpacity>
  </View>
  );
};

// ---------- Ekran ----------
const QarzDaftari = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const nav: Nav = (route, params) => navigation.navigate(route, params);
  const [showWarn, setShowWarn] = React.useState(true);

  // SS13: GLOBAL tanlangan do'kon — tanlansa BUTUN qarz daftari bo'limi (summalar,
  // ro'yxatlar, qarzga berish/olish) FAQAT shu do'kon bo'yicha ishlaydi.
  const shop = useQarzShop();
  const shopQs = shopQuery('?');

  // REAL backend — dashboard summalari + muddati yaqin qatorlar.
  // ⚠️ useFetch effekt bog'liqligi URL SATRI — do'kon almashsa avtomatik qayta o'qiydi.
  const dashboard = useFetch({ url: `${URL}/qarz-daftari/dashboard${shopQs}`, method: 'GET' });
  const nearExp = useFetch({ url: `${URL}/qarz-daftari/near-expiration${shopQs}`, method: 'GET' });
  // SS11-1: bosh sahifada do'kon cardi + modal ro'yxati.
  const shopsFetch = useFetch({ url: `${URL}/qarz-daftari/savdo-faoliyat`, method: 'GET' });
  // ⚠️ MEMO: `|| []` har renderda YANGI massiv yaratardi — quyidagi effekt
  // har renderda qayta ishlab ketardi. Endi faqat ma'lumot o'zgarsa yangilanadi.
  const shopsData = (shopsFetch.data as any)?.data;
  const shops: any[] = React.useMemo(
    () => (Array.isArray(shopsData) ? shopsData : []),
    [shopsData],
  );
  const [shopPicker, setShopPicker] = React.useState(false);
  // SS16: tanlagich "Qarzga berish/olish" tugmasidan ochilgan bo'lsa — do'kon
  // tanlangach DARHOL mijozlar sahifasiga o'tamiz (qo'shimcha bosish kerak emas).
  const [pendingTuri, setPendingTuri] = React.useState<'berish' | 'olish' | null>(null);

  // SS13-3: do'kon BITTA bo'lsa — avtomatik tanlanadi (foydalanuvchi hech narsa
  // bosmaydi). O'chirilgan do'kon tanlovda qolib ketmasin uchun ham shu yerda
  // muvofiqlashtiramiz.
  //
  // 🔴 MUHIM: `useFetch` BOSHLANG'ICH holati `loading=false, data=[]` — ya'ni
  // birinchi renderda ro'yxat "bo'sh" ko'rinadi. Agar shu holatda ham
  // muvofiqlashtirsak, saqlangan do'kon tanlovi ekranga HAR kirganda O'CHIB
  // ketardi (emulyatorda aynan shunday bo'ldi). Shuning uchun FAQAT server
  // haqiqatan massiv qaytargandagina ishlaymiz.
  React.useEffect(() => {
    if (Array.isArray(shopsData)) syncQarzShopWithList(shopsData);
  }, [shopsData]);

  // SS13-1/2/4: card sarlavhasi holatga qarab.
  //   0 ta do'kon      -> "Do'kon qo'shish" (bosilsa darhol yaratish sahifasi)
  //   1 ta / tanlangan -> DO'KON NOMI
  //   2+ va tanlanmagan-> "Barcha do'konlar"
  const shopCount = shops.length;
  const shopCardTitle = shopCount === 0
    ? t('Do‘kon qo‘shish')
    : shop
    ? shop.nomi || t('Do‘kon')
    : t('Barcha do‘konlar');
  // Do'konlar SONI faqat "Barcha do'konlar" holatida ko'rsatiladi (so'rov): aniq
  // do'kon tanlanganda uning nomi ostida "5 ta do'kon" chalkashtirardi.
  const shopCardSub = shopCount === 0
    ? t('Qarz daftarini yuritish uchun do‘kon yarating')
    : shop
    ? ''
    : t('{{count}} ta do‘kon', { count: shopCount });

  // "Xodim rejimi" (impersonation) — foydalanuvchi boshqa egaga tegishli do'konga
  // xodim sifatida kirgan holat. Token konteksti o'zgargani uchun ekranga har
  // qaytganda holatni va summalarni yangilaymiz (aks holda o'z ma'lumoti eskirib qoladi).
  const [xodim, setXodim] = React.useState(isXodimSession());
  const [xodimNomi, setXodimNomi] = React.useState(xodimFaoliyatNomi());
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      setXodim(isXodimSession());
      setXodimNomi(xodimFaoliyatNomi());
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      dashboard.onRefresh({});
      nearExp.onRefresh({});
      // 🔴 DO'KONLAR RO'YXATI HAM yangilanishi SHART. Ilgari u faqat mount'da
      // o'qilardi, shu sabab:
      //   - do'kon NOMI tahrirlangach cardda ESKI nom qolardi;
      //   - yangi do'kon qo'shilgach ro'yxatda/sanoqda KO'RINMASDI va card
      //     "Do'kon qo'shish" bo'lib turaverardi.
      // Endi ekranga har qaytganda ro'yxat qayta o'qiladi → nom/soni va
      // `syncQarzShopWithList` orqali tanlov yorlig'i ham darhol yangilanadi.
      shopsFetch.onRefresh({});
    }, [dashboard.onRefresh, nearExp.onRefresh, shopsFetch.onRefresh]),
  );

  const onExitXodim = () => {
    exitXodimSession();
    setXodim(false);
    setXodimNomi('');
    // Owner tokeni tiklandi — summalarni qayta o'qiymiz.
    dashboard.onRefresh({});
    nearExp.onRefresh({});
  };

  const d: any = (dashboard.data as any)?.data || dashboard.data || {};

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

  /**
   * SS16: "Qarzga berish"/"Qarzga olish" bosilganda ilgari oraliq sahifa
   * (QarzDaftariKiritish — "Savdo faoliyati (do'kon)ni tanlang") ochilardi.
   * So'rov: u ochilmasin, DARHOL mijozlar sahifasi chiqsin.
   *   - do'kon yo'q             -> yangi do'kon yaratish sahifasi
   *   - do'kon tanlangan (yoki
   *     bitta bo'lgani uchun
   *     avto-tanlangan)         -> darhol mijozlar sahifasi
   *   - 2+ do'kon, tanlanmagan  -> do'kon tanlagich (tanlangach o'zi o'tadi)
   */
  const goMijozlar = (turi: 'berish' | 'olish', s: { id: any; nomi?: string }) =>
    nav('QarzDaftariMijozlar', {
      faoliyat_id: s.id,
      faoliyat_nomi: s.nomi,
      turi,
    });

  // Tanlagich TANLOVSIZ yopilsa kutilayotgan amal ham bekor bo'ladi.
  const closeShopPicker = () => { setShopPicker(false); setPendingTuri(null); };

  const goKiritish = (turi: 'berish' | 'olish') => {
    if (shopCount === 0) return nav('QarzDaftariFaoliyat');
    if (shop) return goMijozlar(turi, shop);
    setPendingTuri(turi);
    setShopPicker(true);
  };
  const goQarz = (id: any) => id && nav('QarzDaftariQarz', { id });

  if (dashboard.loading && nearExp.loading) {
    return <Loading />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* Endi TAB — orqaga knopkasi Asosiy tabga qaytaradi. */}
      {/* SS24: ORQAGA tugmasi OLIB TASHLANDI — bu ham TAB (top-level ekran). */}
      {/* SS7 (2026-09-18): Bosh sahifadagi bilan bir xil panel. */}
      <RdTopBar title={t('Qarz daftari')} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Xodim rejimi banneri — boshqa egaga tegishli do'konni xodim sifatida
            boshqarayotganini bildiradi + o'z hisobiga qaytish (Chiqish). */}
        {xodim && (
          <View style={styles.xodimBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.xodimBarTitle} numberOfLines={1}>
                {t('Xodim rejimi')}
              </Text>
              {!!xodimNomi && (
                <Text style={styles.xodimBarSub} numberOfLines={1}>
                  {xodimNomi}
                </Text>
              )}
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.xodimBarBtn}
              onPress={onExitXodim}
            >
              <Text style={styles.xodimBarBtnText}>{t('Chiqish')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* B. Hero — endi IKKI amal tugmasi (Qarz berish/olish) shu kartada
            (Qarz shartnomasi sahifasidagidek). */}
        <Hero
          onBer={() => goKiritish('berish')}
          onOl={() => goKiritish('olish')}
        />

        {/* SS13: Hero ostidagi do'kon cardi.
            - do'kon YO'Q  -> "Do'kon qo'shish" (bosilsa DARHOL yaratish sahifasi)
            - aks holda    -> tanlangan do'kon nomi / "Barcha do'konlar"; bosilsa
              orqa foni qoraygan modalda ro'yxat ochiladi. */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            shopCount === 0
              ? nav('QarzDaftariFaoliyat')
              : setShopPicker(true)
          }
          style={styles.allShopsCard}>
          <View style={styles.allShopsIcon}>
            {shopCount === 0 ? (
              <PlusIcon size={rs(20)} color={BLUE} />
            ) : (
              <StorefrontIcon size={rs(20)} color={BLUE} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.allShopsTitle} numberOfLines={1}>{shopCardTitle}</Text>
            {!!shopCardSub && (
              <Text style={styles.allShopsSub} numberOfLines={1}>{shopCardSub}</Text>
            )}
          </View>
          <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
        </TouchableOpacity>

        {/* C. "Umumiy ko'rinish" diagrammasi Berilgan/Olingan "manba tanlash"
            sahifasiga (SearchDebitor select view) ko'chirilgan.
            D. "Tezkor amallar" bo'limi (Qarzga berish/olish kartalari) so'rov bo'yicha
            OLIB TASHLANDI — bu amallar endi yuqoridagi hero kartadagi tugmalarda. */}

        {/* E. Qarzdorliklar (sarlavha so'rov bo'yicha olib tashlandi) */}
        <View style={styles.sumGrid}>
          {/* Yuqori qator: Berilgan qarz | Olingan qarz (yonma-yon). Past qator:
              Muddati o'tgan (ber.) | Muddati o'tgan (ol.) — har biri o'z turi TAGIDA. */}
          <DebtSumCard
            accent={BLUE}
            accentBg="#EFF6FF"
            Icon={ArrowUpRight}
            label={t('Berilgan qarz')}
            pill={t('Olish kerak')}
            pillColor={BLUE}
            uzs={daftariBerilganUzs}
            usd={daftariBerilganUsd}
            onPress={() => nav('QarzDaftariQarzlar', { turi: 'berish' })}
          />
          <DebtSumCard
            accent={GREEN}
            accentBg="#F0FDF4"
            Icon={ArrowDownLeft}
            label={t('Olingan qarz')}
            pill={t('Berish kerak')}
            pillColor={GREEN}
            uzs={daftariOlinganUzs}
            usd={daftariOlinganUsd}
            onPress={() => nav('QarzDaftariQarzlar', { turi: 'olish' })}
          />
          <DebtSumCard
            accent={RED}
            accentBg="#FEF2F2"
            Icon={ClockIcon}
            label={t('Berilgan qarz')}
            pill={t('Muddati o‘tgan')}
            pillColor={RED}
            uzs={overdueBerilganUzs}
            usd={overdueBerilganUsd}
            onPress={() =>
              nav('QarzDaftariQarzlar', { turi: 'berish', status: 'muddati-otgan' })
            }
          />
          <DebtSumCard
            accent={RED}
            accentBg="#FEF2F2"
            Icon={ClockIcon}
            label={t('Olingan qarz')}
            pill={t('Muddati o‘tgan')}
            pillColor={RED}
            uzs={overdueOlinganUzs}
            usd={overdueOlinganUsd}
            onPress={() =>
              nav('QarzDaftariQarzlar', { turi: 'olish', status: 'muddati-otgan' })
            }
          />
        </View>

        {/* F. Muddati yaqinlashganlar (sarlavha so'rov bo'yicha olib tashlandi) */}
        <DueTable
          title={t('Muddati yaqin berilgan qarzlar')}
          accent={BLUE}
          rows={nearBerilgan}
          onRow={goQarz}
        />
        <DueTable
          title={t('Muddati yaqin olingan qarzlar')}
          accent={GREEN}
          rows={nearOlingan}
          onRow={goQarz}
        />

        {/* SS5-3 (2026-09-21): KALENDAR + kunlik/haftalik/oylik hisobot.
            So'rov: qarz beruvchi 1 kunda, 1 haftada va 1 oyda qancha qarz
            berib, qanchasini undirganini ko'rishi kerak. Ko'rinish "Shaxsiy
            moliya" kalendari bilan bir xil. */}
        <QarzDaftariKalendar />

        {/* G. Ogohlantirish */}
        {showWarn && <WarningBanner onClose={() => setShowWarn(false)} />}
      </ScrollView>

      {/* SS11-2: do'konlar ro'yxati — orqasi qoraygan (blur) modal. Ro'yxat BO'SH
          bo'lsa ham oxirida "Yangi do'kon qo'shish" tugmasi turadi. */}
      <Modal
        visible={shopPicker}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeShopPicker}>
        <View style={styles.shopModalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeShopPicker} />
          <View style={styles.shopModalCard}>
            <View style={styles.shopModalHead}>
              <Text style={styles.shopModalTitle}>{t('Barcha do‘konlar')}</Text>
              <TouchableOpacity
                onPress={() => setShopPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.shopModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              /* SS13-5: 2+ do'konda ro'yxat boshida "Barcha do'konlar" qatori
                 (tanlovni bekor qiladi — hamma do'kon bo'yicha ko'rinish).
                 1 ta do'konda bunday qator KERAK EMAS (tanlov baribir bitta). */
              data={shops.length > 1 ? [{ __all: true }, ...shops] : shops}
              keyExtractor={(it: any, i: number) => (it?.__all ? 'all' : String(it?.id ?? i))}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              ItemSeparatorComponent={() => <View style={styles.shopSep} />}
              renderItem={({ item }: any) => {
                const isAll = !!item.__all;
                const selected = isAll ? !shop : !!shop && shop.id === Number(item.id);
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.shopRow,
                      // SS5 (2026-09-14): "Barcha do'konlar" qatori DOIM ochiq ko'k —
                      // u do'kon emas, balki "filtрsiz ko'rinish" rejimi, shu bois
                      // ro'yxatdagi haqiqiy do'konlardan vizual farq qilib turishi kerak.
                      isAll && styles.shopRowAll,
                      selected && styles.shopRowOn,
                      isAll && selected && styles.shopRowAllOn,
                    ]}
                    onPress={() => {
                      // SS13-5: do'kon TANLANADI va BOSH SAHIFADA qolamiz —
                      // sahifa va barcha funksiyalar shu do'kon bo'yicha ishlaydi.
                      //
                      // ⚠️ SS-F: xodim do'koni tanlanganda TOKEN ALMASHTIRILMAYDI.
                      // Almashtirilsa token EGANIKI bo'lib qolar va Bosh sahifadagi
                      // umumiy kartalar ham eganing ma'lumotini ko'rsatardi — bu
                      // talabga ZID ("Bosh sahifada xodim do'koni qayd etilmasin").
                      // Buning o'rniga backend `faoliyat_id` bo'yicha xodimlikni
                      // o'zi tekshiradi (`faoliyatScope` yordamchisi).
                      if (isAll) clearQarzShop();
                      else
                        setQarzShop({
                          id: Number(item.id),
                          nomi: item.nomi,
                          isXodim: !!item.is_xodim_role,
                        });
                      setShopPicker(false);
                      // SS16: tanlagich "Qarzga berish/olish" dan ochilgan bo'lsa —
                      // darhol mijozlar sahifasi ("Barcha do'konlar" bunda mos emas).
                      if (pendingTuri && !isAll) {
                        const turi = pendingTuri;
                        setPendingTuri(null);
                        goMijozlar(turi, { id: item.id, nomi: item.nomi });
                      } else {
                        setPendingTuri(null);
                      }
                    }}>
                    <View style={styles.shopRowIcon}>
                      <StorefrontIcon size={rs(18)} color={BLUE} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.shopRowName, selected && { color: BLUE }]}
                        numberOfLines={1}>
                        {isAll ? t('Barcha do‘konlar') : item.nomi}
                      </Text>
                      {!isAll && !!item.is_xodim_role && (
                        <Text style={styles.shopRowSub}>{t('Xodim')}</Text>
                      )}
                    </View>
                    {/* Qator OXIRIDA — TAHRIRLASH tugmasi (ilgari oddiy `>` strelka
                        edi; so'rov bo'yicha endi QALAM ikonkasi, chunki u shunchaki
                        o'tish emas, do'konni BOSHQARISH oynasini ochadi:
                        tahrirlash + xodimlar + karta ulash).
                        Xodim o'zga egaga tegishli do'konni tahrirlay olmaydi. */}
                    {!isAll && !item.is_xodim_role ? (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.shopEditBtn}
                        onPress={() => {
                          setShopPicker(false);
                          nav('QarzDaftariFaoliyat', {
                            faoliyat_id: item.id,
                            faoliyat_nomi: item.nomi,
                            edit: true,
                          });
                        }}>
                        <PencilIcon size={rs(18)} color={BLUE} />
                      </TouchableOpacity>
                    ) : (
                      <View style={{ width: rs(34) }} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.shopEmpty}>{t('Do‘konlar yo‘q.')}</Text>
              }
            />
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.shopAddBtn}
              onPress={() => {
                setShopPicker(false);
                nav('QarzDaftariFaoliyat');
              }}>
              <PlusIcon size={rs(16)} color={BLUE} />
              <Text style={styles.shopAddText}>{t('Yangi do‘kon qo‘shish')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default QarzDaftari;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  // SS11-1/2: "Barcha do‘konlar" cardi + do‘konlar modali
  allShopsCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1, borderColor: rd.color.border,
    paddingHorizontal: rs(14), paddingVertical: rs(12),
    marginTop: rs(12),
  },
  allShopsIcon: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  allShopsTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  allShopsSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },

  shopModalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(22), backgroundColor: 'rgba(11,18,32,0.6)' },
  shopModalCard: {
    width: '100%', maxHeight: '72%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(16), paddingBottom: rs(14), paddingHorizontal: rs(16),
    elevation: 12,
  },
  shopModalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  shopModalTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  shopModalClose: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.textTertiary, paddingHorizontal: rs(4) },
  shopSep: { height: 1, backgroundColor: rd.color.border, marginHorizontal: rs(6) },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), paddingVertical: rs(12), paddingHorizontal: rs(6) },
  // SS13: tanlangan do'kon qatori ajralib tursin.
  shopRowOn: { backgroundColor: '#EFF6FF', borderRadius: rs(12) },
  // SS5: "Barcha do'konlar" — doimiy ochiq ko'k fon; tanlanganda esa qo'shimcha
  // ko'k kontur bilan tanlov holati baribir ajralib turadi.
  shopRowAll: { backgroundColor: '#EAF2FE', borderRadius: rs(12) },
  shopRowAllOn: { backgroundColor: '#DCE9FD', borderWidth: 1.5, borderColor: '#A9C8FA' },
  // Qator oxiridagi TAHRIRLASH tugmasi — doira fonli, bosiladigani ko'rinib tursin.
  shopEditBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
  },
  shopRowIcon: {
    width: rs(34), height: rs(34), borderRadius: rs(17),
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  shopRowName: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  shopRowSub: { fontFamily: rd.font.medium, fontSize: rs(11), color: '#7c3aed', marginTop: rs(2) },
  shopEmpty: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textTertiary, textAlign: 'center', paddingVertical: rs(20) },
  shopAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    marginTop: rs(10), paddingVertical: rs(12),
    borderRadius: rd.radius.lg,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: BLUE + '66',
    backgroundColor: BLUE + '0D',
  },
  shopAddText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: BLUE },
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(24),
    gap: rs(14),
  },

  // Xodim rejimi banneri (impersonation) — binafsha, web bilan bir semantika.
  xodimBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    borderRadius: rs(14),
    paddingVertical: rs(10),
    paddingHorizontal: rs(14),
  },
  xodimBarTitle: { fontFamily: rd.font.bold, fontSize: rs(13), color: '#6b21a8' },
  xodimBarSub: { fontFamily: rd.font.medium, fontSize: rs(12), color: '#7c3aed', marginTop: rs(1) },
  xodimBarBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: rs(9),
    paddingVertical: rs(7),
    paddingHorizontal: rs(14),
  },
  xodimBarBtnText: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: '#fff' },

  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(13.5),
    color: rd.color.text,
    marginTop: rs(4),
    marginBottom: rs(-4),
  },

  // Hero — o'lcham/shrift QARZ SHARTNOMASI hero'si bilan BIR XIL (so'rov bo'yicha).
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
  heroTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.onPrimary },
  heroSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: 'rgba(255,255,255,0.9)',
    marginTop: rs(4),
    lineHeight: rs(17),
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
  ovTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
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
  barLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12), marginTop: rs(8) },
  barLegendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  barDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  barLegendText: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
  },

  // (Overview sub-cards va Action cards stillar OLIB TASHLANDI — mos komponentlar
  //  so'rov bo'yicha olib tashlangani uchun.)

  // 2×2 GRID (so'rov): yuqori qatorda Berilgan | Olingan (yonma-yon), past
  // qatorda Muddati o'tgan (ber.) | Muddati o'tgan (ol.) — har biri o'z turi
  // TAGIDA (bir ustunda). JSX tartibi: Berilgan, Olingan, Muddati-ber, Muddati-ol.
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
    fontSize: rs(10.5),
    color: rd.color.textSecondary,
    minHeight: rs(32),
  },
  sumUzs: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
    marginTop: rs(4),
  },
  sumUsd: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
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
  tableTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), marginRight: rs(8) },
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
  // 2-ustunli ko'rinish (Mijozsiz): "Qolgan vaqt" chapga tekislangan.
  colDate2: { flex: 1, alignItems: 'flex-start' },
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
    // SS5-2 (2026-09-21): ogohlantirish matni kichraytirildi.
    // SS-DEV (2026-09-24): yana kichikroq (11 -> 10) — so'rov bo'yicha.
    fontFamily: rd.font.regular,
    fontSize: rs(10),
    color: '#92400E',
    lineHeight: rs(14.5),
  },
  warnClose: {
    alignSelf: 'flex-start',
    backgroundColor: AMBER,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    marginTop: rs(2),
  },
  // SS-DEV (2026-09-24): "Tushundim" ham kichikroq (12 -> 10.5).
  warnCloseText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: '#fff' },

  // Empty
  emptyBox: { alignItems: 'center', gap: rs(8), paddingVertical: rs(24) },
  emptyText: {
    // SS5-1 (2026-09-21): bo'sh holat matni juda yirik ko'rinardi.
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
});
