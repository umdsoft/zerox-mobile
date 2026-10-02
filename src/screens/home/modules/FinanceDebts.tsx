/**
 * FinanceDebts.tsx — "Shaxsiy qarz" bo'limining BOSH sahifasi
 * (sayt: pages/finance/debts/index.vue).
 *
 * SS-DEV (2026-09-29, 29.09 hujjat 4-band): sahifa "Qarz shartnomasi" bo'limi va
 * saytning Shaxsiy qarz sahifasi TARTIBIDA qayta qurildi:
 *   1) hero — "Qarz berish" / "Qarz olish" (+ Plastik karta havolasi, saytdagidek);
 *   2) "Berilgan qarz" | "Olingan qarz" kartalari (ochiq qarzlar qoldig'i, UZS/USD);
 *   3) ularning tagida SVOD — muddati o'tgan berilgan | olingan qarzlar;
 *   4) "Muddati oz qolgan berilgan / olingan qarzlar" (UZS/USD, kontragent, qolgan kun);
 *   5) eng pastda — "Tugallangan shaxsiy qarzlar".
 * Ilgari: 2x2 statistika (Berilgan/Olingan/Sof balans/Muddati o'tgan SONI) + filtr
 * tablari + kontragentlar ro'yxati shu sahifaning o'zida edi. Endi karta bosilganda
 * ro'yxat ALOHIDA sahifada (FinanceDebtList, `kind` bo'yicha) — Qarz shartnomasi →
 * SearchDebitor naqshi. Kontragent guruhi / qarz tafsiloti funksiyalari O'ZGARMADI.
 *
 * Backend: GET /finance/debts?limit=100 (o'z + ko'zgu qarzlar) — YAGONA manba.
 *
 * 02.10 (mobil hujjat, 2/10b/11-band) — sayt (pages/finance/debts/index.vue) bilan paritet:
 *   - eng pastdagi "Tugallangan shaxsiy qarzlar" ro'yxati o'rniga Qarz shartnomasidagi kabi
 *     "Yakunlangan qarzlar" bo'limi — IKKI karta: "Berilgan qarzlar" / "Olingan qarzlar"
 *     (summa valyuta bo'yicha + soni); bosilganda yakunlangan qarzlar hisoboti
 *     (FinanceDebtReport — sayt report/_side.vue). Manba: status=completed, sahifalab;
 *   - sariq eslatma ("Tushundim") Yakunlangan qarzlar bo'limining TAGIGA ko'chirildi;
 *   - "Muddati oz qolgan" bloklari sayt kabi GET /finance/debts/upcoming dan (fallback —
 *     ro'yxat); "Barchasini ko'rish" sahifasi AYNAN shu funksiyadan (resolveUpcoming).
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useFetch } from '../../../hooks/useFetch';
import { storage } from '../../../store/api/token/getToken';
import { fmtUSD, fmtUZS } from '../../../helper/money';
import { rd, rs } from '../../../theme/rd';
import AnimatedEmpty from '../../components/AnimatedEmpty';
import RdHeader from '../redesign/RdHeader';
import RdTopBar from '../redesign/RdTopBar';
import DebtSummaryCard from '../redesign/DebtSummaryCard';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircleIcon,
  ChevronRight,
  ClockIcon,
  IdCardIcon,
  InfoIcon,
} from '../redesign/icons';
import { fCompact, localDateKey } from './financeMoney';
import {
  CurSum,
  DebtListKind,
  FINANCE_DEBTS_URL,
  FINANCE_UPCOMING_URL,
  finishedOfSide,
  mergeDebts,
  resolveUpcoming,
  summarizeDebts,
  summarizeDebtSvod,
  svodTotals,
  UpcomingRow,
  upcomingTarget,
} from './financeDebtGroups';
import { useAllPersonalDebts } from './useAllPersonalDebts';

const AMBER = '#f59e0b';
const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;

// SS8: eslatma yopilgan KUN (MMKV) — "Qarz daftari" dagi bilan bir xil naqsh.
const DEBT_NOTE_KEY = 'fin_debt_note_hidden_day';
const todayKey = () => localDateKey(new Date());

// UZS + USD qatorlari — Qarz shartnomasi kartalari bilan bir xil format ("0 UZS"/"0 USD" doim).
const money = (s: CurSum) => [fmtUZS(s.uzs), fmtUSD(s.usd)];

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
 * SS17: TEPADA ko'k gradient hero — ikki asosiy amal. SS-DEV (2026-09-29):
 * "Plastik karta" havolasi alohida katta qator emas, saytdagidek hero ICHIDA
 * yengil havola (sahifa tartibi Qarz shartnomasi bilan bir xil bo'lishi uchun).
 */
const Hero = ({ onBer, onOl, onCard }: { onBer: () => void; onOl: () => void; onCard: () => void }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.hero}>
      <Grad id="sqHero" colors={GRAD_BRAND} />
      <Text style={styles.heroSub} numberOfLines={2}>
        {t('Shaxsiy qarz oldi-berdilaringizni bir joyda yuriting.')}
      </Text>
      <View style={styles.heroBtns}>
        <TouchableOpacity activeOpacity={0.9} style={[styles.heroBtn, styles.heroBtnLight]} onPress={onBer}>
          <ArrowUpRight size={rs(16)} color={rd.color.primary} />
          <Text
            style={[styles.heroBtnText, { color: rd.color.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
            {t('Qarz berish')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.9} style={[styles.heroBtn, { backgroundColor: rd.color.success }]} onPress={onOl}>
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
      {/* SS10: PLASTIK KARTA — qarzni qaytarishni talab qilganda qarzdorga shu
          karta raqami yuboriladi (kirish nuqtasi saqlandi). */}
      <TouchableOpacity activeOpacity={0.8} style={styles.heroLink} onPress={onCard} accessibilityRole="button">
        <IdCardIcon size={rs(15)} color={rd.color.onPrimary} />
        <Text style={styles.heroLinkText} numberOfLines={1}>{t('Plastik karta ma’lumotlari')}</Text>
        <ChevronRight size={rs(14)} color={rd.color.onPrimary} />
      </TouchableOpacity>
    </View>
  );
};

/** Qolgan kun nishoni (Qarz shartnomasi NearCard'idagi ranglar). */
const dueBadge = (left: number | null, t: (k: string, o?: any) => string) => {
  if (left === null) return { label: '—', color: rd.color.textTertiary, bg: rd.color.surfaceAlt };
  if (left <= 0) return { label: t('Bugun'), color: rd.color.error, bg: rd.color.errorBg };
  return { label: t('{{n}} kun qoldi', { n: left }), color: rd.color.warning, bg: rd.color.warningBg };
};

/**
 * "Muddati oz qolgan" kartasi — Qarz shartnomasidagi NearCard bilan bir xil
 * tuzilish (UZS/USD segment + jadval + "Barchasini ko'rish"), qo'shimcha ravishda
 * KONTRAGENT nomi (saytdagi `showName` rejimi).
 * 02.10 (11-band): qatorlar `resolveUpcoming` dan (sahifadagi ro'yxat bilan bir manba);
 * bo'sh holatda harakatli ikonka (12-band).
 */
const NearDebtCard = ({
  title,
  rows,
  onRow,
  onAll,
}: {
  title: string;
  rows: UpcomingRow[];
  onRow: (r: UpcomingRow) => void;
  onAll: () => void;
}) => {
  const { t } = useTranslation();
  const [cur, setCur] = React.useState<'UZS' | 'USD'>('UZS');
  const list = rows.filter(r => r.currency === cur);
  return (
    <View style={styles.box}>
      <View style={styles.nearHead}>
        <Text style={styles.boxTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.segment}>
          {(['UZS', 'USD'] as const).map(c => {
            const on = cur === c;
            return (
              <TouchableOpacity
                key={c}
                activeOpacity={0.8}
                onPress={() => setCur(c)}
                style={[styles.segmentBtn, on && styles.segmentBtnActive]}>
                <Text style={[styles.segmentText, on && styles.segmentTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {list.length === 0 ? (
        <AnimatedEmpty variant="time" text={t('Hozircha muddati yaqin qarzlar yo‘q')} compact />
      ) : (
        <View>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCol, { flex: 1 }]}>{t('Kontragent')}</Text>
            <Text style={styles.tableHeadCol}>{t('Qolgan vaqt')}</Text>
            <Text style={[styles.tableHeadCol, styles.tableAmountCol]}>{t('Qarz miqdori')}</Text>
          </View>
          {list.map(r => {
            const due = dueBadge(r.left, t);
            return (
              <TouchableOpacity
                key={r.key}
                activeOpacity={0.6}
                onPress={() => onRow(r)}
                style={styles.tableRow}>
                <Text style={styles.tableName} numberOfLines={1}>{r.name}</Text>
                <View style={[styles.dueBadge, { backgroundColor: due.bg }]}>
                  <Text style={[styles.dueBadgeText, { color: due.color }]}>{due.label}</Text>
                </View>
                <Text style={[styles.tableAmount, styles.tableAmountCol]} numberOfLines={1}>
                  {fCompact(r.remaining, r.currency)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <TouchableOpacity activeOpacity={0.8} onPress={onAll} style={styles.more}>
        <Text style={styles.moreText}>{t('Barchasini ko‘rish')}</Text>
        <ChevronRight size={rs(15)} color={rd.color.primary} />
      </TouchableOpacity>
    </View>
  );
};

/**
 * 02.10 (2/10b-band): "Yakunlangan qarzlar" — Qarz shartnomasi va sayt (DashboardReports)
 * kabi sarlavha + IKKI karta: "Berilgan qarzlar" / "Olingan qarzlar" (summa valyuta bo'yicha,
 * nishonda soni). Sarlavha yonidagi (i) — izoh (sayt InfoTip: tugallangan va voz kechilgan).
 */
const FinishedSection = ({
  given,
  taken,
  givenCount,
  takenCount,
  onGiven,
  onTaken,
}: {
  given: CurSum;
  taken: CurSum;
  givenCount: number;
  takenCount: number;
  onGiven: () => void;
  onTaken: () => void;
}) => {
  const { t } = useTranslation();
  const [info, setInfo] = React.useState(false);
  return (
    <View style={styles.finished}>
      <View style={styles.finishedHead}>
        <View style={styles.doneIcon}>
          <CheckCircleIcon size={rs(18)} color={rd.color.success} />
        </View>
        <Text allowFontScaling={false} style={styles.finishedTitle} numberOfLines={1}>
          {t('Yakunlangan qarzlar')}
        </Text>
        <TouchableOpacity
          onPress={() => setInfo(v => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('Ushbu qismda tugallangan va voz kechilgan qarzlar aks etadi')}>
          <InfoIcon size={rs(17)} color={info ? rd.color.primary : rd.color.textTertiary} />
        </TouchableOpacity>
      </View>
      {info ? (
        <Text allowFontScaling={false} style={styles.finishedInfo}>
          {t('Ushbu qismda tugallangan va voz kechilgan qarzlar aks etadi')}
        </Text>
      ) : null}
      <View style={styles.debtGrid}>
        <DebtSummaryCard
          variant="stripe"
          accent={rd.color.primary}
          Icon={ArrowUpRight}
          label={t('Berilgan qarzlar')}
          badge={t('{{n}} ta', { n: givenCount })}
          badgeBg={rd.color.primaryTint}
          badgeColor={rd.color.primary}
          amountColor={rd.color.text}
          lines={money(given)}
          onPress={onGiven}
        />
        <DebtSummaryCard
          variant="stripe"
          accent={rd.color.success}
          Icon={ArrowDownLeft}
          label={t('Olingan qarzlar')}
          badge={t('{{n}} ta', { n: takenCount })}
          badgeBg={rd.color.successBg}
          badgeColor={rd.color.success}
          amountColor={rd.color.text}
          lines={money(taken)}
          onPress={onTaken}
        />
      </View>
    </View>
  );
};

const FinanceDebts = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // SS7: pastki menyudagi "Shaxsiy qarz" TAB sifatida ochilganda orqaga tugmasi yo'q.
  const isTab = !!route?.params?.tab;

  /**
   * SS8 (2026-09-15): tavsiyaviy eslatma "Tushundim" bilan KUN oxirigacha yopiladi
   * ("Qarz daftari" bilan bir xil xulq, MMKV'da kun kaliti).
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

  const listFetch = useFetch({ url: FINANCE_DEBTS_URL, method: 'GET' });
  // 02.10 (11-band): "Muddati oz qolgan" — sayt kabi backend endpoint (fallback — ro'yxat).
  const upFetch = useFetch({ url: FINANCE_UPCOMING_URL, method: 'GET' });
  // 02.10 (2/10b-band): yakunlangan (tugallangan + voz kechilgan) qarzlar — sahifalab to'liq.
  const finished = useAllPersonalDebts({ status: 'completed' });
  const refreshList = listFetch.onRefresh;
  const refreshUp = upFetch.onRefresh;
  const reloadFinished = finished.reload;
  const refreshAll = React.useCallback(() => {
    refreshList({});
    refreshUp({});
    reloadFinished();
  }, [refreshList, refreshUp, reloadFinished]);
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refreshAll();
    }, [refreshAll]),
  );

  // 🔴 SS6: `mirror_debts` (hamkor/do'kon ko'zgu qarzlari) ham ro'yxatga kiradi.
  const debts = React.useMemo(() => mergeDebts(listFetch.data), [listFetch.data]);
  const sum = React.useMemo(() => summarizeDebts(debts), [debts]);
  const nearGiven = React.useMemo(() => resolveUpcoming(upFetch.data, debts, 'given'), [upFetch.data, debts]);
  const nearTaken = React.useMemo(() => resolveUpcoming(upFetch.data, debts, 'taken'), [upFetch.data, debts]);
  const fin = React.useMemo(() => {
    const g = finishedOfSide(finished.debts, 'lent');
    const tk = finishedOfSide(finished.debts, 'borrowed');
    return {
      given: svodTotals(summarizeDebtSvod(g)),
      taken: svodTotals(summarizeDebtSvod(tk)),
      givenCount: g.length,
      takenCount: tk.length,
    };
  }, [finished.debts]);

  const goList = (kind: DebtListKind) => navigation.navigate('FinanceDebtList', { kind });
  const openUpcoming = (r: UpcomingRow) => {
    const target = upcomingTarget(r, debts);
    if (target) navigation.navigate(target.screen, target.params);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {isTab ? (
        <RdTopBar title={t('Shaxsiy qarzlar')} />
      ) : (
        <RdHeader title={t('Shaxsiy qarzlar')} showBack />
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refreshAll}
            tintColor={rd.color.primary}
            colors={[rd.color.primary]}
          />
        }>
        {/* 1) Hero + ikki amal */}
        <Hero
          onBer={() => navigation.navigate('FinanceDebtAdd', { initialType: 'lent' })}
          onOl={() => navigation.navigate('FinanceDebtAdd', { initialType: 'borrowed' })}
          onCard={() => navigation.navigate('FinancePayoutCard')}
        />

        {/* 2) Berilgan | Olingan  +  3) tagida svod: muddati o'tgan (Qarz shartnomasi 2x2 gridi). */}
        {/* 01.10 (mobil hujjat, 3-band): kartalar DIZAYNI Qarz shartnomasi bilan AYNAN bir xil —
            variant="stripe" (neytral chegara + tepada rangli chiziq + soya). Ma'lumot va joylashuv o'zgarmagan. */}
        <View style={styles.debtGrid}>
          <DebtSummaryCard
            variant="stripe"
            accent={rd.color.primary}
            Icon={ArrowUpRight}
            label={t('Berilgan qarz')}
            badge={t('Olish kerak')}
            badgeBg={rd.color.primaryTint}
            badgeColor={rd.color.primary}
            amountColor={rd.color.text}
            lines={money(sum.given)}
            onPress={() => goList('given')}
          />
          <DebtSummaryCard
            variant="stripe"
            accent={rd.color.success}
            Icon={ArrowDownLeft}
            label={t('Olingan qarz')}
            badge={t('Berish kerak')}
            badgeBg={rd.color.successBg}
            badgeColor={rd.color.success}
            amountColor={rd.color.text}
            lines={money(sum.taken)}
            onPress={() => goList('taken')}
          />
          <DebtSummaryCard
            variant="stripe"
            accent={rd.color.error}
            Icon={ClockIcon}
            label={t('Berilgan qarz')}
            badge={t('Muddati o‘tgan')}
            badgeBg={rd.color.errorBg}
            badgeColor={rd.color.error}
            amountColor={rd.color.error}
            lines={money(sum.overdueGiven)}
            onPress={() => goList('overdue-given')}
          />
          <DebtSummaryCard
            variant="stripe"
            accent={rd.color.error}
            Icon={ClockIcon}
            label={t('Olingan qarz')}
            badge={t('Muddati o‘tgan')}
            badgeBg={rd.color.errorBg}
            badgeColor={rd.color.error}
            amountColor={rd.color.error}
            lines={money(sum.overdueTaken)}
            onPress={() => goList('overdue-taken')}
          />
        </View>

        {/* 4) Muddati oz qolgan berilgan / olingan qarzlar */}
        <NearDebtCard
          title={t('Muddati oz qolgan berilgan qarzlar')}
          rows={nearGiven}
          onRow={openUpcoming}
          onAll={() => goList('upcoming-given')}
        />
        <NearDebtCard
          title={t('Muddati oz qolgan olingan qarzlar')}
          rows={nearTaken}
          onRow={openUpcoming}
          onAll={() => goList('upcoming-taken')}
        />

        {/* 5) 02.10 (2/10b-band): Yakunlangan qarzlar — Berilgan / Olingan kartalari (sayt kabi). */}
        <FinishedSection
          given={fin.given}
          taken={fin.taken}
          givenCount={fin.givenCount}
          takenCount={fin.takenCount}
          onGiven={() => navigation.navigate('FinanceDebtReport', { side: 'given' })}
          onTaken={() => navigation.navigate('FinanceDebtReport', { side: 'taken' })}
        />

        {/* SS7/SS8: tavsiyaviy eslatma ("Tushundim" — kun oxirigacha yopiladi).
            02.10 (2-band): Yakunlangan qarzlar bo'limining TAGIGA ko'chirildi. */}
        {!noteHidden && (
          <View style={styles.noteCard}>
            <View style={styles.noteIcon}>
              <InfoIcon size={rs(16)} color={AMBER} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteText}>
                {t('Shaxsiy qarzlar — qarz oldi-berdi munosabatlaringizni norasmiy elektron boshqarish uchun. Bu qarzlar bo‘yicha rasmiy qarz shartnomasi rasmiylashtirilmaydi. Rasmiy shartnoma uchun «Qarz shartnomasi» bo‘limidan foydalaning.')}
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={hideNoteForToday} style={styles.noteOkBtn}>
                <Text allowFontScaling={false} style={styles.noteOkText}>{t('Tushundim')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default FinanceDebts;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  // Qarz shartnomasi sahifasi bilan bir xil oraliqlar (gap 16).
  content: { padding: rs(16), gap: rs(16), paddingBottom: rs(28) },

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
  heroSub: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: 'rgba(255,255,255,0.9)', lineHeight: rs(17) },
  heroBtns: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
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
  heroLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: rs(6),
    marginTop: rs(12),
    paddingVertical: rs(4),
  },
  heroLinkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.onPrimary,
    textDecorationLine: 'underline',
  },

  debtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },

  box: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  boxTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  nearHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  segment: { flexDirection: 'row', backgroundColor: rd.color.page, borderRadius: rd.radius.pill, padding: rs(3) },
  segmentBtn: { paddingHorizontal: rs(12), paddingVertical: rs(5), borderRadius: rd.radius.pill },
  segmentBtnActive: { backgroundColor: rd.color.primary },
  segmentText: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary },
  segmentTextActive: { color: rd.color.onPrimary },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    marginTop: rs(14),
    paddingBottom: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  tableHeadCol: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary },
  tableAmountCol: { minWidth: rs(86), textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(10),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  tableName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  dueBadge: { paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rd.radius.pill },
  dueBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  tableAmount: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(4),
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  moreText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.primary },

  doneIcon: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: rd.color.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 02.10 (2/10b-band): "Yakunlangan qarzlar" bo'limi — sarlavha + 2 karta (Qarz shartnomasi kabi).
  finished: { gap: rs(12) },
  finishedHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  finishedTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  finishedInfo: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    lineHeight: rs(17),
    color: rd.color.textSecondary,
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
  },

  noteCard: {
    flexDirection: 'row',
    gap: rs(10),
    backgroundColor: AMBER + '10',
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: AMBER + '30',
    padding: rs(12),
  },
  noteIcon: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: AMBER + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, lineHeight: rs(18) },
  noteOkBtn: {
    alignSelf: 'flex-start',
    marginTop: rs(10),
    backgroundColor: AMBER,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(16),
    paddingVertical: rs(7),
  },
  noteOkText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: '#fff' },
});
