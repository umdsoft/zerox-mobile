/**
 * FinanceDebts.tsx — Shaxsiy qarzlar ro'yxati (web pages/finance/debts/index.vue).
 * Kontrakt/qarz-daftaridan FARQLI: bu norasmiy shaxsiy qarz kuzatuvi (olingan/berilgan,
 * muddat, qisman to'lov, status). Filtr tablar + stats + qarz kartalari (qoldiq, paid%,
 * muddat/o'tgan). Kartaga bosilsa -> FinanceDebtDetail; "+ Yangi qarz" -> FinanceDebtAdd.
 *
 * Backend: GET /finance/debts?limit=100 (sarlavha kataklari ham shu ro‘yxatdan — SS-DEV 2026-09-24).
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { storage } from '../../../store/api/token/getToken';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import RdTopBar from '../redesign/RdTopBar';
import { fDate, fMoney, fShort, num } from './financeMoney';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  IdCardIcon,
  InfoIcon,
  PlusIcon,
  StorefrontIcon,
  UserIcon,
} from '../redesign/icons';

const RED = '#dc2626';
const GREEN = '#16a34a';
const AMBER = '#f59e0b';

// SS8: eslatma yopilgan KUN (MMKV) — "Qarz daftari" dagi bilan bir xil naqsh.
const DEBT_NOTE_KEY = 'fin_debt_note_hidden_day';
const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const TABS = [
  // SS4 (2026-09-17): yorliqlar EKRANDA t() orqali tarjima qilinadi —
  // bu yerda faqat o'zbekcha KALIT saqlanadi (string-as-key sxemasi).
  // SS3 (2026-09-18): tartib ekranning qolgan qismiga MOSLASHTIRILDI —
  // yuqorida "Qarz berish → Qarz olish" va "Berilgan → Olingan", shu bois
  // bu yerda ham BERILGAN oldin turadi (ilgari teskari edi).
  { key: 'all', label: 'Barchasi' },
  { key: 'lent', label: 'Berilgan' },
  { key: 'borrowed', label: 'Olingan' },
];

// SS4-2: filtr rangi MAZMUNGA mos — olingan qarz qizil, berilgan yashil.
const TAB_ACCENT: Record<string, string> = {
  all: rd.color.primary,
  borrowed: RED,
  lent: GREEN,
};

const SOURCE_LABEL: Record<string, string> = {
  bank: 'Bank',
  family: 'Oila',
  friend: 'Do‘st',
  other: 'Boshqa',
};
const SOURCE_EMOJI: Record<string, string> = {
  bank: '🏦',
  family: '👨‍👩‍👧',
  friend: '🤝',
  other: '📌',
};

// Brend gradienti — "Qarz daftari" hero'si bilan AYNAN bir xil (SS17: ikki bo'lim
// bir xil ko'rinishda bo'lsin degan so'rov).
const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;

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

/**
 * SS17 (2026-09-14): "Shaxsiy qarz" bo'limi endi "Qarz daftari" bilan bir xil
 * tuzilishda — TEPADA ko'k gradient hero va uning ichida IKKI asosiy amal,
 * pastida statistika. Ilgari amal sarlavhadagi kichkina "+" ikonasi edi: yangi
 * foydalanuvchi bo'limga kirib nima qilishni bilmasdi, statistika esa tepada
 * turib e'tiborni tortardi.
 */
const Hero = ({ onBer, onOl }: { onBer: () => void; onOl: () => void }) => {
  // Hero — alohida komponent: tarjima hook'i SHU YERDA chaqiriladi.
  const { t } = useTranslation();
  return (
  <View style={styles.hero}>
    <Grad id="sqHero" colors={GRAD_BRAND} />
    <Text style={styles.heroSub} numberOfLines={2}>
      {t('Shaxsiy qarz oldi-berdilaringizni bir joyda yuriting.')}
    </Text>
    <View style={styles.heroBtns}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.heroBtn, styles.heroBtnLight]}
        onPress={onBer}>
        <ArrowUpRight size={rs(16)} color={rd.color.primary} />
        <Text
          style={[styles.heroBtnText, { color: rd.color.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
          {t('Qarz berish')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.heroBtn, { backgroundColor: rd.color.success }]}
        onPress={onOl}>
        <ArrowDownLeft size={rs(16)} color={rd.color.onPrimary} />
        <Text
          style={[styles.heroBtnText, { color: rd.color.onPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
          {t('Qarz olish')}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
  );
};

// SS17: statistika kartasi — yuqorida aksent chiziq, ichida valyutalar alohida.
/**
 * SS1-3 (2026-09-15): statistika kartasi endi BOSILADIGAN FILTR.
 * Foydalanuvchi "Berilgan 1.3M" ustiga bossa — pastdagi ro'yxat aynan o'sha
 * qarzlarga qisqaradi. Ilgari kartalar faqat raqam ko'rsatardi va ular ortidagi
 * qarzlarni ko'rish uchun alohida tab bosish kerak edi.
 * Tanlangan karta aksent rangli kontur bilan belgilanadi.
 */
const StatCard = ({
  accent,
  label,
  lines,
  color,
  active,
  onPress,
}: {
  accent: string;
  label: string;
  lines: string[];
  color: string;
  active?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.85 : 1}
    disabled={!onPress}
    onPress={onPress}
    style={[styles.statCard, active && { borderColor: accent, borderWidth: 1.5 }]}>
    <View style={[styles.statAccent, { backgroundColor: accent }]} />
    <Text allowFontScaling={false} style={styles.statLabel} numberOfLines={1}>
      {label}
    </Text>
    {lines.map((x, i) => (
      <Text
        key={i}
        allowFontScaling={false}
        style={[styles.statVal, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {x}
      </Text>
    ))}
  </TouchableOpacity>
);

/**
 * SS2 (2026-09-18): ro'yxat endi KONTRAGENT bo'yicha GURUHLANADI.
 *
 * Muammo: bitta odamga (yoki bitta do'konga) tegishli har bir qarz alohida
 * qator bo'lib chiqardi — "Arsenal Market" dan olingan o'nlab (ko'pi
 * yopilgan) qarz ro'yxatni to'ldirib yuborardi.
 *
 * Kalit: jismoniy shaxsda TELEFON (ishonchli identifikator; ism xilma-xil
 * yozilishi mumkin), telefon bo'lmasa — normallashtirilgan ism.
 * Do'kon qarzida esa do'kon NOMI.
 */
const phoneKey = (p?: string): string => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length >= 9 ? d.slice(-9) : '';
};

const groupKeyOf = (d: any): string => {
  if (d?.is_shop_debt) return `shop:${String(d.source_name || '').trim().toLowerCase()}`;
  const ph = phoneKey(d?.phone);
  if (ph) return `ph:${ph}`;
  return `nm:${String(d?.source_name || '').trim().toLowerCase()}`;
};

const initials = (name?: string) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';

/**
 * SS-DEV (2026-09-24): OCHIQ qarz — 'active' YOKI 'overdue' (DB'da ikkala holat
 * bor; sayt `isActive` bilan bir xil) va qoldiq > 0. 'completed'/'cancelled' —
 * yopiq: sarlavha yig'indisiga kirmaydi.
 */
const isOpenDebt = (d: any) =>
  (d?.status === 'active' || d?.status === 'overdue') && num(d?.remaining_amount) > 0;

const isOverdue = (d: any) => {
  if (!isOpenDebt(d) || !d?.due_date) return false;
  const due = new Date(String(d.due_date).slice(0, 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
};

const FinanceDebts = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // SS7: pastki menyudagi "Shaxsiy qarz" bo'limi sifatida ochilganda ekran
  // TOP-LEVEL bo'ladi — orqaga tugmasi ko'rsatilmaydi (qayerga qaytarardi?).
  const isTab = !!route?.params?.tab;
  const [tab, setTab] = React.useState('all');

  /**
   * SS8 (2026-09-15): pastdagi tavsiyaviy eslatma "Tushundim" bilan yopiladi —
   * "Qarz daftari" bo'limidagi bilan AYNAN bir xil xulq. Tanlov MMKV'da KUN
   * bo'yicha saqlanadi: bugun yopilsa qaytib chiqmaydi, ertaga yana ko'rinadi
   * (foydalanuvchi eslatmani butunlay yo'qotib qo'ymasin).
   */
  const [noteHidden, setNoteHidden] = React.useState(() => {
    try {
      return storage.getString(DEBT_NOTE_KEY) === todayKey();
    } catch (_) {
      return false;
    }
  });
  const hideNoteForToday = () => {
    try {
      storage.set(DEBT_NOTE_KEY, todayKey());
    } catch (_) {}
    setNoteHidden(true);
  };
  // SS4-2: tanlangan filtrga mos aksent rang (sarlavhadagi "+" tugmasi ham shu rangda).
  const tabAccent = TAB_ACCENT[tab] || rd.color.primary;

  /**
   * 🔴 SS-DEV (2026-09-24) ILDIZ SABAB (6-rasm: sarlavhada "Berilgan 2,8 M",
   * ro'yxat yig'indisi ~4,5 M): sarlavha va ro'yxat IKKI XIL manbadan edi —
   *   - sarlavha: GET /finance/debts/stats → faqat `status = 'active'` qoldiqlar
   *     (DB'dagi `overdue` holatli ochiq qarzlar hisobga KIRMAYDI);
   *   - ro'yxat : GET /finance/debts?type=… → BARCHA holatlar (overdue, hatto
   *     cancelled) va kartalar qoldiqni ko'rsatadi.
   * Endi BIR MANBA: qarzlar bir marta (`limit=100`, turlar bo'yicha filtr
   * klientda) olinadi, sarlavha kataklari (Berilgan / Olingan / Sof balans /
   * Muddati o'tgan) SHU ro'yxatdan — faqat ochiq (active/overdue, qoldiq > 0)
   * qarzlar qoldig'i, valyuta bo'yicha alohida — hisoblanadi. Ro'yxat
   * kartalaridagi summa ham aynan shu qoldiq, shu bois ular doim teng.
   * (Backend `personalDebtTotals.service.js` da `status='active'` →
   * `whereIn(['active','overdue'])` tuzatilsa, bosh sahifa ham mos bo'ladi.)
   */
  const listFetch = useFetch({
    url: `${URL}/finance/debts?limit=100`,
    method: 'GET',
  });

  const refreshList = listFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refreshList({});
    }, [refreshList]),
  );

  /**
   * 🔴 SS6 ILDIZ SABAB (2026-09-17): DO'KON (Qarz daftari) orqali menga
   * berilgan qarz saytdagi "Shaxsiy qarz"da ko'rinar, MOBILDA esa ko'rinmasdi.
   *
   * Backend javobida IKKI ro'yxat bor: `data` — foydalanuvchining O'ZI
   * kiritgan qarzlari, `mirror_debts` — KO'ZGU qarzlar (boshqa foydalanuvchi
   * yoki DO'KON meni qarzdor sifatida kiritgan). Mobil faqat `data` ni o'qir,
   * `mirror_debts` ni umuman e'tiborga olmasdi.
   *
   * Ko'zgu qarzlar FAQAT-O'QISH: ularni qarzdor yopa/tahrirlay olmaydi —
   * qarzni ro'yxatga olgan do'kon (yoki kiritgan foydalanuvchi) boshqaradi.
   */
  const listData: any = listFetch.data;
  const debtsRaw: any[] = React.useMemo(() => {
    const own: any[] = listData?.data || [];
    const mir: any[] = listData?.mirror_debts || [];
    return [...own, ...mir];
  }, [listData]);
  // Tab filtri KLIENTDA: 'lent' / 'borrowed' — tur bo'yicha; 'overdue' — muddat.
  const debtsFlat: any[] =
    tab === 'overdue'
      ? debtsRaw.filter(isOverdue)
      : tab === 'lent' || tab === 'borrowed'
      ? debtsRaw.filter((d) => d.type === tab)
      : debtsRaw;

  // Sarlavha kataklari — ro'yxat bilan BIR MANBA (yuqoridagi izoh).
  const totals = React.useMemo(() => {
    const byCur = new Map<string, { lent: number; borrowed: number }>();
    let overdue = 0;
    for (const d of debtsRaw) {
      if (!isOpenDebt(d)) continue;
      const cur = d.currency || 'UZS';
      const rec = byCur.get(cur) || { lent: 0, borrowed: 0 };
      rec[d.type === 'borrowed' ? 'borrowed' : 'lent'] += num(d.remaining_amount);
      byCur.set(cur, rec);
      if (isOverdue(d)) overdue++;
    }
    const lentCur: any[] = [];
    const borrowedCur: any[] = [];
    const netCur: any[] = [];
    for (const [currency, r] of byCur) {
      if (r.lent > 0) lentCur.push({ currency, total: r.lent });
      if (r.borrowed > 0) borrowedCur.push({ currency, total: r.borrowed });
      if (Math.abs(r.lent - r.borrowed) > 0.009) netCur.push({ currency, total: r.lent - r.borrowed });
    }
    return { lentCur, borrowedCur, netCur, overdue };
  }, [debtsRaw]);

  /**
   * SS2: yassi ro'yxat → KONTRAGENT guruhlari. Har guruhda:
   *   - kontragent nomi va turi (do'kon / jismoniy shaxs)
   *   - valyuta bo'yicha SOF qoldiq (berilgan − olingan)
   *   - qarzlar soni, to'langanlik ulushi, muddati o'tgani bor-yo'qligi
   * Guruhda BITTA qarz bo'lsa — bosilganda to'g'ridan-to'g'ri tafsilot ochiladi.
   */
  const groups = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const d of debtsFlat) {
      const key = groupKeyOf(d);
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          name: d.source_name,
          isShop: !!d.is_shop_debt,
          phone: d.phone || null,
          items: [] as any[],
          byCur: new Map<string, number>(), // valyuta -> sof qoldiq
          // SS-DEV (2026-09-24): OCHIQ qarzlarning DASTLABKI summasi (valyuta
          // bo'yicha) — kartada qoldiq ostida kichik "jami …" sifatida.
          openAmtByCur: new Map<string, number>(),
          openRemByCur: new Map<string, number>(),
          total: 0,
          paid: 0,
          overdue: false,
          allDone: true,
        };
        map.set(key, g);
      }
      g.items.push(d);
      const cur = d.currency || 'UZS';
      const rem = num(d.remaining_amount);
      const amt = num(d.amount);
      const signed = d.type === 'borrowed' ? -rem : rem;
      g.byCur.set(cur, (g.byCur.get(cur) || 0) + signed);
      if (isOpenDebt(d)) {
        g.openAmtByCur.set(cur, (g.openAmtByCur.get(cur) || 0) + amt);
        g.openRemByCur.set(cur, (g.openRemByCur.get(cur) || 0) + rem);
      }
      g.total += amt;
      g.paid += Math.max(amt - rem, 0);
      if (isOverdue(d)) g.overdue = true;
      if (!(d.status === 'completed' || rem <= 0)) g.allDone = false;
    }
    return [...map.values()];
  }, [debtsFlat]);
  // img10: valyuta bo'yicha ALOHIDA (USD + UZS ni qo'shmaymiz).
  const { lentCur, borrowedCur, netCur } = totals;
  const net = num(netCur.find((x) => x.currency === 'UZS')?.total);
  // SS17: 4-statistika katagi — muddati o'tgan ochiq qarzlar soni.
  const overdueCount = totals.overdue;
  // SS14: valyutalar ALOHIDA QATORDA (siqilib mayda ko'rinmasin).
  const debtMoneyList = (arr: any[], scalar: number, signed: boolean): string[] => {
    const list = arr && arr.length ? arr.map((x) => ({ v: num(x.total), c: x.currency })) : [{ v: num(scalar), c: 'UZS' }];
    return list.map(({ v, c }) => (signed ? (v >= 0 ? '+' : '−') : '') + fShort(Math.abs(v), c));
  };
  const netColor = netCur.length
    ? netCur.every((x) => num(x.total) >= 0)
      ? GREEN
      : netCur.every((x) => num(x.total) < 0)
      ? RED
      : rd.color.text
    : net >= 0
    ? GREEN
    : RED;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS1-1 (2026-09-15): o'ng yuqoridagi "+" OLIB TASHLANDI — quyidagi
          hero'da "Qarz berish" va "Qarz olish" tugmalari bor, ya'ni "+" ayni
          amalni ikkinchi marta, lekin yo'nalishni so'ramasdan takrorlardi. */}
      {/* SS7 (2026-09-18): tab sifatida ochilganda YAGONA yuqori panel;
          ichkaridan (stack) ochilsa — odatdagi orqaga tugmali sarlavha. */}
      {isTab ? (
        <RdTopBar title={t('Shaxsiy qarzlar')} />
      ) : (
        <RdHeader title={t('Shaxsiy qarzlar')} showBack />
      )}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SS17: 1) ko'k hero + ikki amal */}
        <Hero
          onBer={() => navigation.navigate('FinanceDebtAdd', { initialType: 'lent' })}
          onOl={() => navigation.navigate('FinanceDebtAdd', { initialType: 'borrowed' })}
        />

        {/* SS10 (2026-09-14): PLASTIK KARTA — saytdagi "finance payout card"
            tugmasining mobil ekvivalenti. Qarzni qaytarishni talab qilganda
            qarzdorga aynan shu karta raqami yuboriladi, shu bois u "Shaxsiy
            qarz" bo'limining o'zidan kiritiladi (ilgari mobilda kirish nuqtasi
            umuman yo'q edi — foydalanuvchi kartani kirita olmasdi). */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardLink}
          onPress={() => navigation.navigate('FinancePayoutCard')}>
          <View style={styles.cardLinkIcon}>
            <IdCardIcon size={rs(19)} color={rd.color.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.cardLinkTitle}>{t('Plastik karta')}</Text>
            <Text allowFontScaling={false} style={styles.cardLinkSub} numberOfLines={1}>
              {t('Qarzni qaytarishni talab qilishda yuboriladi')}
            </Text>
          </View>
          <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
        </TouchableOpacity>

        {/* SS17: 2) statistika — hero TAGIDA, 2x2 katak (uchta siqilgan ustun
            o'rniga; endi valyutalar to'liq o'qiladi). */}
        <View style={styles.statGrid}>
          <View style={styles.statRow}>
            <StatCard
              accent={GREEN}
              label={t('Berilgan')}
              color={GREEN}
              lines={debtMoneyList(lentCur, 0, false)}
              active={tab === 'lent'}
              onPress={() => setTab(tab === 'lent' ? 'all' : 'lent')}
            />
            <StatCard
              accent={RED}
              label={t('Olingan')}
              color={RED}
              lines={debtMoneyList(borrowedCur, 0, false)}
              active={tab === 'borrowed'}
              onPress={() => setTab(tab === 'borrowed' ? 'all' : 'borrowed')}
            />
          </View>
          <View style={styles.statRow}>
            {/* "Sof balans" — yig'indi ko'rsatkich, uning ortida alohida
                ro'yxat yo'q, shu bois bosilmaydi. */}
            <StatCard
              accent={rd.color.primary}
              label={t('Sof balans')}
              color={netColor}
              lines={debtMoneyList(netCur, net, true)}
            />
            <StatCard
              accent={AMBER}
              label={t('Muddati o‘tgan')}
              color={overdueCount > 0 ? AMBER : rd.color.textTertiary}
              lines={[`${overdueCount} ${t('ta qarz')}`]}
              active={tab === 'overdue'}
              onPress={
                overdueCount > 0
                  ? () => setTab(tab === 'overdue' ? 'all' : 'overdue')
                  : undefined
              }
            />
          </View>
        </View>

        {/* SS4-2: faol tab RANGI mazmunga qarab — "Olingan" QIZIL (men qarzdorman),
            "Berilgan" YASHIL (menga qarzdor), "Barchasi" neytral ko'k. */}
        <View style={styles.tabs}>
          {/* ⚠️ map o'zgaruvchisi `tb` — ilgari `t` edi va tarjima
              funksiyasini SOYA qilardi (yorliqlar tarjima bo'lmasdi). */}
          {TABS.map(tb => {
            const on = tab === tb.key;
            return (
              <TouchableOpacity
                key={tb.key}
                style={[styles.tab, on && { backgroundColor: TAB_ACCENT[tb.key] }]}
                onPress={() => setTab(tb.key)}
                activeOpacity={0.8}>
                <Text allowFontScaling={false} style={[styles.tabText, on && styles.tabTextOn]}>
                  {t(tb.label)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('Qarzlar yo‘q.')}</Text>
          </View>
        ) : (
          groups.map((g, i) => {
            const nets = [...g.byCur.entries()].filter(([, v]) => Math.abs(v) > 0.009);
            // Barcha qoldiq nolga teng bo'lsa ham valyutani ko'rsatamiz (yopilgan guruh).
            const shown = nets.length ? nets : [...g.byCur.entries()].slice(0, 1);
            const paidPct = g.total > 0 ? Math.round((g.paid / g.total) * 100) : 0;
            // Rang: sof qoldiq manfiy bo'lsa (men qarzdorman) QIZIL, aks holda YASHIL.
            const firstNet = shown.length ? shown[0][1] : 0;
            const dirColor = firstNet < 0 ? RED : GREEN;
            const single = g.items.length === 1 ? g.items[0] : null;
            const Ico = g.isShop ? StorefrontIcon : UserIcon;
            return (
              <TouchableOpacity
                key={g.key || i}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() =>
                  // Guruhda bitta qarz bo'lsa — to'g'ridan-to'g'ri tafsilot;
                  // aks holda kontragentning barcha qarzlari ro'yxati (yopilganlari ham).
                  single
                    ? navigation.navigate('FinanceDebtDetail',
                        single.is_mirror ? { mirror: single } : { id: single.id })
                    : navigation.navigate('FinanceDebtGroup', {
                        title: g.name,
                        isShop: g.isShop,
                        items: g.items,
                      })
                }>
                <View style={styles.cardTop}>
                  {/* SS2: matnli bosh harflar o'rniga IKONKA — do'kon uchun
                      do'kon ikonkasi, jismoniy shaxs uchun odam ikonkasi. */}
                  <View style={[styles.avatar, { backgroundColor: dirColor + '14' }]}>
                    <Ico size={rs(22)} color={dirColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{g.name}</Text>
                    <Text allowFontScaling={false} style={styles.sub}>
                      {g.items.length > 1
                        ? `${g.items.length} ${t('ta qarz')}`
                        : g.items[0].type === 'borrowed'
                        ? t('Olingan')
                        : t('Berilgan')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {shown.map(([cur, v]) => (
                      <Text
                        key={cur}
                        allowFontScaling={false}
                        style={[styles.amt, { color: v < 0 ? RED : GREEN }]}
                        numberOfLines={1}>
                        {v < 0 ? '−' : '+'}{fMoney(Math.abs(v), cur)}
                      </Text>
                    ))}
                    {/* SS-DEV (2026-09-24, 6-band): asosiy summa = QOLDIQ; qisman
                        to'langan bo'lsa dastlabki summa kichik matnda. */}
                    {(() => {
                      const cur = shown.length ? shown[0][0] : null;
                      if (!cur) return null;
                      const oa = g.openAmtByCur.get(cur) || 0;
                      const orm = g.openRemByCur.get(cur) || 0;
                      if (oa <= orm + 0.009) return null;
                      return (
                        <Text allowFontScaling={false} style={styles.due} numberOfLines={1}>
                          {t('jami {{amount}}', { amount: fMoney(oa, cur) })}
                        </Text>
                      );
                    })()}
                    {g.allDone ? (
                      <View style={[styles.badge, { backgroundColor: GREEN + '18' }]}>
                        <Text style={[styles.badgeText, { color: GREEN }]}>{t('Yopilgan')}</Text>
                      </View>
                    ) : g.overdue ? (
                      <View style={[styles.badge, { backgroundColor: RED + '18' }]}>
                        <Text style={[styles.badgeText, { color: RED }]}>{t('Muddati o‘tgan')}</Text>
                      </View>
                    ) : single && single.due_date ? (
                      <Text allowFontScaling={false} style={styles.due}>{fDate(single.due_date)}{t('gacha')}</Text>
                    ) : null}
                  </View>
                  {!single && <ChevronRight size={rs(16)} color={rd.color.textTertiary} />}
                </View>
                {!g.allDone && (
                  <>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${paidPct}%`, backgroundColor: dirColor }]} />
                    </View>
                    {/* SS1 (2026-09-18): "to‘landi" ham tarjima qilinadi (tizim tili
                        kirill bo'lsa lotin so'z qolib ketardi). */}
                    <Text allowFontScaling={false} style={styles.paidPct}>
                      {t('{{p}}% to‘landi', { p: paidPct })}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })
        )}
        {/* SS7: tavsiyaviy eslatma (Qarz daftaridagidek) — Shaxsiy qarz bo'limida.
            SS8: endi "Tushundim" bilan yopiladi (kun oxirigacha). */}
        {!noteHidden && (
          <View style={styles.noteCard}>
            <View style={styles.noteIcon}>
              <InfoIcon size={rs(16)} color={AMBER} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteText}>
                {t('Shaxsiy qarzlar — qarz oldi-berdi munosabatlaringizni norasmiy elektron boshqarish uchun. Bu qarzlar bo‘yicha rasmiy qarz shartnomasi rasmiylashtirilmaydi. Rasmiy shartnoma uchun «Qarz shartnomasi» bo‘limidan foydalaning.')}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={hideNoteForToday}
                style={styles.noteOkBtn}>
                <Text allowFontScaling={false} style={styles.noteOkText}>{t('Tushundim')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={{ height: rs(20) }} />
      </ScrollView>
    </View>
  );
};

export default FinanceDebts;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  // SS-DEV (2026-09-24, 8-band): oraliqlar ixchamlashtirildi.
  content: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(20) },

  // SS7: tavsiyaviy eslatma
  noteCard: { flexDirection: 'row', gap: rs(10), backgroundColor: AMBER + '10', borderRadius: rd.radius.lg, borderWidth: 1, borderColor: AMBER + '30', padding: rs(12), marginTop: rs(14) },
  noteIcon: { width: rs(30), height: rs(30), borderRadius: rs(15), backgroundColor: AMBER + '1A', alignItems: 'center', justifyContent: 'center' },
  noteText: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, lineHeight: rs(18) },
  // SS8: "Tushundim" — eslatmani kun oxirigacha yopadi.
  noteOkBtn: {
    alignSelf: 'flex-start',
    marginTop: rs(10),
    backgroundColor: AMBER,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(16),
    paddingVertical: rs(7),
  },
  noteOkText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: '#fff' },

  // SS17: ko'k gradient hero (Qarz daftari bilan bir xil o'lcham/uslub).
  hero: {
    borderRadius: rs(18),
    overflow: 'hidden',
    padding: rs(14),
    marginBottom: rs(10),
    shadowColor: GRAD_BRAND[1],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  heroSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: rs(17),
  },
  heroBtns: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
  // SS3 (2026-09-18): tugma matni kartaga SIG'MAY toshib ketardi (kirillda
  // so'zlar uzunroq). Ikonka va oraliq kichraytirildi, matn esa qisqara
  // oladigan qilindi — tor ekranda ham bir qatorda turadi.
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(4),
    borderRadius: rs(12),
    paddingVertical: rs(10),
    paddingHorizontal: rs(6),
  },
  heroBtnLight: { backgroundColor: rd.color.surface },
  heroBtnText: { flexShrink: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5) },

  // SS10: plastik karta kirish qatori.
  cardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(10),
    marginBottom: rs(10),
  },
  cardLinkIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLinkTitle: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  cardLinkSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // SS17: 2x2 statistika.
  statGrid: { gap: rs(8), marginBottom: rs(10) },
  statRow: { flexDirection: 'row', gap: rs(8) },
  statCard: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(11),
    paddingTop: rs(10),
    paddingBottom: rs(9),
    overflow: 'hidden',
  },
  statAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(3) },
  statLabel: { fontFamily: rd.font.regular, fontSize: rs(10.5), color: rd.color.textTertiary },
  statVal: { fontFamily: rd.font.bold, fontSize: rs(14), lineHeight: rs(18), marginTop: rs(3) },

  tabs: { flexDirection: 'row', gap: rs(8), marginBottom: rs(10) },
  tab: {
    flex: 1,
    height: rs(40),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: { backgroundColor: rd.color.primary },
  tabText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary },
  tabTextOn: { color: '#fff' },

  empty: { alignItems: 'center', paddingVertical: rs(50) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textTertiary, textAlign: 'center', paddingHorizontal: rs(30) },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatar: { width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: rd.font.bold, fontSize: rs(15) },
  name: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  sub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  amt: { fontFamily: rd.font.bold, fontSize: rs(14.5) },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2), marginTop: rs(4) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  due: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(4) },

  barTrack: { height: rs(6), borderRadius: rs(3), backgroundColor: rd.color.surfaceAlt, marginTop: rs(12), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: rs(3) },
  paidPct: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary, marginTop: rs(6) },
});
