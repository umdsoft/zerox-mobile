/**
 * FinanceDebtList.tsx — "Shaxsiy qarz" ro'yxat sahifasi (sayt `/finance/debts/list/:kind`).
 *
 * SS-DEV (2026-09-29, 29.09 hujjat 4-band): bosh sahifa endi "Qarz shartnomasi"
 * kabi KARTALAR ko'rinishida; karta bosilganda ro'yxat shu ALOHIDA sahifada
 * ochiladi (Qarz shartnomasi → SearchDebitor bilan bir xil naqsh).
 *
 * 02.10 (mobil hujjat, 3-band): sahifa SAYTDAGI KABI qayta qurildi (list/_kind.vue):
 *   - qidiruv (FISh / telefon / summa) + "Yuklash" (CSV, SearchDebitor naqshi) + "N ta qarz";
 *   - "Berilgan qarz" / "Olingan qarz" tepasida SVOD — jami berilgan (olingan), qaytarilgan,
 *     jarayondagi (qoldiq) summalar valyuta bo'yicha; manba — shu turdagi BARCHA qarzlar
 *     (faol + tugallangan, sahifalab — useAllPersonalDebts);
 *   - kontragent bo'yicha guruhlar — sayt kabi faqat shu turdagi OCHIQ qarzlardan
 *     (ilgari guruhga tugallanganlar ham qo'shilardi).
 * 02.10 (11-band): "Muddati oz qolgan berilgan / olingan qarzlar" endi QARZ QATORLARI
 *   (kontragent, qolgan kun, qoldiq, muddat) — sayt bloki kabi; manba bosh sahifa bloki bilan
 *   AYNAN bitta (`resolveUpcoming`: /finance/debts/upcoming, fallback — ro'yxat).
 *
 * Route params: { kind: 'given' | 'taken' | 'overdue-given' | 'overdue-taken' |
 *                 'upcoming-given' | 'upcoming-taken' | 'completed' }.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { useFetch } from '../../../hooks/useFetch';
import { exportCsv } from '../../../helper/csvExport';
import { fmtPhoneUzFull } from '../../../helper/phone';
import { rd, rs } from '../../../theme/rd';
import AnimatedEmpty, { AnimatedEmptyVariant } from '../../components/AnimatedEmpty';
import RdHeader from '../redesign/RdHeader';
import { ChevronRight, ClockIcon, StorefrontIcon, UserIcon } from '../redesign/icons';
import { fDate, fMoney } from './financeMoney';
import {
  buildDebtGroups,
  completedDebts,
  DEBT_KIND_TITLE,
  DebtGroup,
  DebtListKind,
  debtDetailParams,
  debtMatches,
  debtsOfKind,
  FINANCE_DEBTS_URL,
  FINANCE_UPCOMING_URL,
  matchDebtSearch,
  mergeDebts,
  resolveUpcoming,
  summarizeDebtSvod,
  uniqueDebts,
  UPCOMING_DAYS,
  UpcomingRow,
  upcomingTarget,
} from './financeDebtGroups';
import { DebtSvodCards, DebtToolbar, FilterChips } from './financeDebtUi';
import { useAllPersonalDebts } from './useAllPersonalDebts';

const RED = '#dc2626';
const GREEN = '#16a34a';

const KINDS: DebtListKind[] = [
  'given',
  'taken',
  'overdue-given',
  'overdue-taken',
  'upcoming-given',
  'upcoming-taken',
  'completed',
];

/** 02.10: sarlavha ostidagi izoh (sayt `subtitles`). */
const KIND_SUBTITLE: Record<DebtListKind, string> = {
  given: 'Sizdan qarz olgan shaxslar ro‘yxati',
  taken: 'Sizga qarz bergan shaxslar ro‘yxati',
  'overdue-given': 'Qaytarish muddati o‘tgan berilgan qarzlar',
  'overdue-taken': 'Qaytarish muddati o‘tgan olingan qarzlar',
  'upcoming-given': 'Muddati {{n}} kun ichida keladigan berilgan qarzlar',
  'upcoming-taken': 'Muddati {{n}} kun ichida keladigan olingan qarzlar',
  completed: 'To‘liq yopilgan qarzlar',
};

const EMPTY_VARIANT: Record<DebtListKind, AnimatedEmptyVariant> = {
  given: 'given',
  taken: 'taken',
  'overdue-given': 'time',
  'overdue-taken': 'time',
  'upcoming-given': 'time',
  'upcoming-taken': 'time',
  completed: 'check',
};

/** Qolgan kun nishoni (bosh sahifa NearDebtCard bilan bir xil ranglar). */
const dueBadge = (left: number | null, t: (k: string, o?: any) => string) => {
  if (left === null) return { label: '—', color: rd.color.textTertiary, bg: rd.color.surfaceAlt };
  if (left <= 0) return { label: t('Bugun'), color: rd.color.error, bg: rd.color.errorBg };
  return { label: t('{{n}} kun qoldi', { n: left }), color: rd.color.warning, bg: rd.color.warningBg };
};

const GroupCard = ({ g, onPress }: { g: DebtGroup; onPress: () => void }) => {
  const { t } = useTranslation();
  const nets = [...g.byCur.entries()].filter(([, v]) => Math.abs(v) > 0.009);
  // Barcha qoldiq nolga teng bo'lsa ham valyutani ko'rsatamiz (yopilgan guruh).
  const shown = nets.length ? nets : [...g.byCur.entries()].slice(0, 1);
  const paidPct = g.total > 0 ? Math.round((g.paid / g.total) * 100) : 0;
  const firstNet = shown.length ? shown[0][1] : 0;
  const dirColor = firstNet < 0 ? RED : GREEN;
  const single = g.items.length === 1 ? g.items[0] : null;
  const Ico = g.isShop ? StorefrontIcon : UserIcon;
  const cur = shown.length ? shown[0][0] : null;
  const openAmt = cur ? g.openAmtByCur.get(cur) || 0 : 0;
  const openRem = cur ? g.openRemByCur.get(cur) || 0 : 0;
  const phone = g.phone ? fmtPhoneUzFull(g.phone) : '';
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: dirColor + '14' }]}>
          <Ico size={rs(22)} color={dirColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{g.name}</Text>
          <Text allowFontScaling={false} style={styles.sub} numberOfLines={1}>
            {g.items.length > 1
              ? `${g.items.length} ${t('ta qarz')}`
              : g.items[0]?.type === 'borrowed'
              ? t('Olingan')
              : t('Berilgan')}
          </Text>
          {phone ? (
            <Text allowFontScaling={false} style={styles.sub} numberOfLines={1}>{phone}</Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {shown.map(([c, v]) => (
            <Text
              key={c}
              allowFontScaling={false}
              style={[styles.amt, { color: v < 0 ? RED : GREEN }]}
              numberOfLines={1}>
              {v < 0 ? '−' : '+'}{fMoney(Math.abs(v), c)}
            </Text>
          ))}
          {cur && openAmt > openRem + 0.009 ? (
            <Text allowFontScaling={false} style={styles.due} numberOfLines={1}>
              {t('jami {{amount}}', { amount: fMoney(openAmt, cur) })}
            </Text>
          ) : null}
          {g.allDone ? (
            <View style={[styles.badge, { backgroundColor: GREEN + '18' }]}>
              <Text allowFontScaling={false} style={[styles.badgeText, { color: GREEN }]}>{t('Yopilgan')}</Text>
            </View>
          ) : g.overdue ? (
            <View style={[styles.badge, { backgroundColor: RED + '18' }]}>
              <Text allowFontScaling={false} style={[styles.badgeText, { color: RED }]}>{t('Muddati o‘tgan')}</Text>
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
          <Text allowFontScaling={false} style={styles.paidPct}>
            {t('{{p}}% to‘landi', { p: paidPct })}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

/** 02.10 (11-band): "Muddati oz qolgan" qatori — kontragent, qolgan kun, qoldiq, muddat. */
const UpcomingCard = ({ r, onPress }: { r: UpcomingRow; onPress?: () => void }) => {
  const { t } = useTranslation();
  const lent = r.type === 'lent';
  const tone = lent ? rd.color.primary : rd.color.success;
  const Ico = r.kind === 'shop' ? StorefrontIcon : UserIcon;
  const due = dueBadge(r.left, t);
  const paidPct = r.amount > 0 ? Math.min(100, Math.max(0, Math.round(((r.amount - r.remaining) / r.amount) * 100))) : 0;
  const phone = r.phone ? fmtPhoneUzFull(r.phone) : '';
  return (
    <TouchableOpacity style={styles.card} activeOpacity={onPress ? 0.8 : 1} disabled={!onPress} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: tone + '14' }]}>
          <Ico size={rs(22)} color={tone} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{r.name}</Text>
          <Text allowFontScaling={false} style={styles.sub} numberOfLines={1}>
            {r.due_date ? `${fDate(r.due_date)}${t('gacha')}` : '—'}
          </Text>
          {phone ? (
            <Text allowFontScaling={false} style={styles.sub} numberOfLines={1}>{phone}</Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text allowFontScaling={false} style={[styles.amt, { color: rd.color.text }]} numberOfLines={1}>
            {fMoney(r.remaining, r.currency)}
          </Text>
          <View style={[styles.badge, { backgroundColor: due.bg }]}>
            <Text allowFontScaling={false} style={[styles.badgeText, { color: due.color }]}>{due.label}</Text>
          </View>
        </View>
        {onPress ? <ChevronRight size={rs(16)} color={rd.color.textTertiary} /> : null}
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${paidPct}%`, backgroundColor: tone }]} />
      </View>
      <Text allowFontScaling={false} style={styles.paidPct}>
        {t('{{p}}% to‘landi', { p: paidPct })} · {t('jami {{amount}}', { amount: fMoney(r.amount, r.currency) })}
      </Text>
    </TouchableOpacity>
  );
};

/** "Muddati oz qolgan" sahifasi tepasidagi jami qoldiq (valyuta bo'yicha alohida). */
const UpcomingTotals = ({ rows }: { rows: UpcomingRow[] }) => {
  const { t } = useTranslation();
  const map: Record<string, number> = {};
  rows.forEach(r => {
    map[r.currency] = (map[r.currency] || 0) + r.remaining;
  });
  const curs = Object.keys(map).sort((a, b) => (a === 'UZS' ? -1 : b === 'UZS' ? 1 : a.localeCompare(b)));
  return (
    <View style={styles.totalsCard}>
      <View style={styles.totalsIcon}>
        <ClockIcon size={rs(18)} color={rd.color.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={styles.totalsLabel}>{t('Jami qoldiq')}</Text>
        {(curs.length ? curs : ['UZS']).map(c => (
          <Text key={c} allowFontScaling={false} style={styles.totalsAmount} numberOfLines={1} adjustsFontSizeToFit>
            {fMoney(map[c] || 0, c)}
          </Text>
        ))}
      </View>
      <Text allowFontScaling={false} style={styles.totalsHint}>
        {t('Keyingi {{n}} kun', { n: UPCOMING_DAYS })}
      </Text>
    </View>
  );
};

const FinanceDebtList = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rawKind = route?.params?.kind;
  const kind: DebtListKind = KINDS.includes(rawKind) ? rawKind : 'given';
  const isUpcoming = kind === 'upcoming-given' || kind === 'upcoming-taken';
  const svodSide = kind === 'given' ? 'lent' : kind === 'taken' ? 'borrowed' : null;

  const [search, setSearch] = React.useState('');
  const [cur, setCur] = React.useState('all');

  const listFetch = useFetch({ url: FINANCE_DEBTS_URL, method: 'GET' });
  // Bo'sh URL — so'rov yuborilmaydi (faqat "Muddati oz qolgan" turlarida kerak).
  const upFetch = useFetch({ url: isUpcoming ? FINANCE_UPCOMING_URL : '', method: 'GET' });
  const svodAll = useAllPersonalDebts(svodSide ? { type: svodSide } : null);

  const refreshList = listFetch.onRefresh;
  const refreshUp = upFetch.onRefresh;
  const reloadSvod = svodAll.reload;
  const refreshAll = React.useCallback(() => {
    refreshList({});
    if (isUpcoming) refreshUp({});
    reloadSvod();
  }, [refreshList, refreshUp, reloadSvod, isUpcoming]);

  // Qarz tafsilotidan (yopish/to'lov) qaytganda ro'yxat yangilansin.
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

  const all = React.useMemo(() => uniqueDebts(mergeDebts(listFetch.data)), [listFetch.data]);

  // ── Guruhlar rejimi (berilgan / olingan / muddati o'tgan / tugallangan) ──
  const scoped = React.useMemo(
    () => (isUpcoming ? [] : kind === 'completed' ? completedDebts(all) : debtsOfKind(all, kind)),
    [all, kind, isUpcoming],
  );
  const groups = React.useMemo(
    () => buildDebtGroups(scoped.filter(d => debtMatches(d, search))),
    [scoped, search],
  );

  // ── "Muddati oz qolgan" rejimi — bosh sahifa bloki bilan AYNAN bitta manba ──
  const upRows = React.useMemo(
    () => (isUpcoming ? resolveUpcoming(upFetch.data, all, kind === 'upcoming-given' ? 'given' : 'taken') : []),
    [isUpcoming, upFetch.data, all, kind],
  );
  const upVisible = React.useMemo(
    () =>
      upRows.filter(
        r => (cur === 'all' || r.currency === cur) && matchDebtSearch(search, r.name, r.phone, [r.amount, r.remaining]),
      ),
    [upRows, cur, search],
  );
  const curChips = React.useMemo(() => {
    const n = (c: string) => upRows.filter(r => r.currency === c).length;
    return [
      { key: 'all', label: t('Barchasi'), count: upRows.length, dot: rd.color.primary, soft: rd.color.primaryTint, fg: rd.color.primary },
      { key: 'UZS', label: 'UZS', count: n('UZS'), dot: rd.color.success, soft: rd.color.successBg, fg: rd.color.success },
      { key: 'USD', label: 'USD', count: n('USD'), dot: rd.color.warning, soft: rd.color.warningBg, fg: rd.color.warning },
    ];
  }, [upRows, t]);

  const svod = React.useMemo(
    () => (svodSide ? summarizeDebtSvod(svodAll.debts.filter(d => d?.type === svodSide)) : null),
    [svodAll.debts, svodSide],
  );

  const openGroup = (g: DebtGroup) => {
    if (g.items.length === 1) {
      navigation.navigate('FinanceDebtDetail', debtDetailParams(g.items[0]));
      return;
    }
    // 02.10: `kind` — guruh ekrani bo'limni (berilgan/olingan) taxmin qilmasin
    navigation.navigate('FinanceDebtGroup', { title: g.name, isShop: g.isShop, items: g.items, kind });
  };

  const title = t(DEBT_KIND_TITLE[kind]);
  const count = isUpcoming ? upRows.length : scoped.length;
  const loading = !!listFetch.loading || (isUpcoming && !!upFetch.loading);

  /** 02.10: ko'rinayotgan ro'yxatni CSV'ga ("Yuklash", sayt exportExcel ustunlari). */
  const onDownload = () => {
    if (isUpcoming) {
      exportCsv({
        baseName: title,
        header: [t('Kontragent'), t('Telefon'), t('Qarz miqdori'), t('Qoldiq'), t('Valyuta'), t('Qaytarish muddati'), t('Qolgan kun')],
        rows: upVisible.map(r => [
          r.name,
          r.phone ? fmtPhoneUzFull(r.phone) : '',
          Math.round(r.amount),
          Math.round(r.remaining),
          r.currency,
          r.due_date ? fDate(r.due_date) : '',
          r.left ?? '',
        ]),
      });
      return;
    }
    const net = (g: DebtGroup, c: string) => Math.round(g.byCur.get(c) || 0);
    exportCsv({
      baseName: title,
      header: [t('Kontragent'), t('Telefon'), t('Qarzlar soni'), t('Qoldiq (UZS)'), t('Qoldiq (USD)'), t('Turi')],
      rows: groups.map(g => {
        const types = new Set(g.items.map(d => (d?.type === 'borrowed' ? 'borrowed' : 'lent')));
        const kindLabel = g.isShop
          ? t('Do‘kon')
          : types.size > 1
          ? t('Aralash')
          : types.has('borrowed')
          ? t('Olingan')
          : t('Berilgan');
        return [g.name, g.phone ? fmtPhoneUzFull(g.phone) : '', g.items.length, net(g, 'UZS'), net(g, 'USD'), kindLabel];
      }),
    });
  };

  const visibleCount = isUpcoming ? upVisible.length : groups.length;
  const emptyText = search
    ? t('Ma’lumot topilmadi')
    : isUpcoming
    ? t('Hozircha muddati yaqin qarzlar yo‘q')
    : t('Qarzlar yo‘q.');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={title} subtitle={t(KIND_SUBTITLE[kind], { n: UPCOMING_DAYS })} showBack />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refreshAll}
            tintColor={rd.color.primary}
            colors={[rd.color.primary]}
          />
        }>
        <DebtToolbar
          search={search}
          onSearch={setSearch}
          onDownload={onDownload}
          count={count}
          disabled={!visibleCount}
        />

        {svodSide && svod && svodAll.ready ? <DebtSvodCards svod={svod} side={svodSide} /> : null}

        {isUpcoming && upRows.length ? (
          <>
            <UpcomingTotals rows={upVisible} />
            <FilterChips chips={curChips} active={cur} onChange={setCur} />
          </>
        ) : null}

        {visibleCount === 0 ? (
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={rd.color.primary} />
              <Text allowFontScaling={false} style={styles.loadingText}>{t('Yuklanmoqda...')}</Text>
            </View>
          ) : (
            <AnimatedEmpty variant={EMPTY_VARIANT[kind]} text={emptyText} />
          )
        ) : isUpcoming ? (
          upVisible.map(r => {
            const target = upcomingTarget(r, all);
            return (
              <UpcomingCard
                key={r.key}
                r={r}
                onPress={target ? () => navigation.navigate(target.screen, target.params) : undefined}
              />
            );
          })
        ) : (
          groups.map(g => <GroupCard key={g.key} g={g} onPress={() => openGroup(g)} />)
        )}
      </ScrollView>
    </View>
  );
};

export default FinanceDebtList;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(24) },
  loadingBox: { alignItems: 'center', paddingVertical: rs(50), gap: rs(10) },
  loadingText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary },
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
  name: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  sub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  amt: { fontFamily: rd.font.bold, fontSize: rs(14.5) },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2), marginTop: rs(4) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  due: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(4) },
  barTrack: { height: rs(6), borderRadius: rs(3), backgroundColor: rd.color.surfaceAlt, marginTop: rs(12), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: rs(3) },
  paidPct: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary, marginTop: rs(6) },

  totalsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  totalsIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(12),
    backgroundColor: rd.color.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalsLabel: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary, marginBottom: rs(2) },
  totalsAmount: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text, lineHeight: rs(22) },
  totalsHint: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
});
