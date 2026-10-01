/**
 * FinanceDebtList.tsx — "Shaxsiy qarz" ro'yxat sahifasi (sayt `/finance/debts/list/:kind`).
 *
 * SS-DEV (2026-09-29, 29.09 hujjat 4-band): bosh sahifa endi "Qarz shartnomasi"
 * kabi KARTALAR ko'rinishida; karta bosilganda ro'yxat shu ALOHIDA sahifada
 * ochiladi (Qarz shartnomasi → SearchDebitor bilan bir xil naqsh). Ilgari
 * ro'yxat bosh sahifaning o'zida filtr tablari bilan turardi.
 *
 * Route params: { kind: 'given' | 'taken' | 'overdue-given' | 'overdue-taken' |
 *                 'upcoming-given' | 'upcoming-taken' | 'completed' }.
 * Ro'yxat KONTRAGENT bo'yicha guruhlangan (SS2 mantig'i o'zgarmadi): guruhda
 * bitta qarz bo'lsa — to'g'ridan-to'g'ri tafsilot, aks holda FinanceDebtGroup.
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
import { useFetch } from '../../../hooks/useFetch';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { ChevronRight, StorefrontIcon, UserIcon } from '../redesign/icons';
import { fDate, fMoney } from './financeMoney';
import {
  buildDebtGroups,
  completedDebts,
  DEBT_KIND_TITLE,
  DebtGroup,
  DebtListKind,
  debtDetailParams,
  debtsOfKind,
  FINANCE_DEBTS_URL,
  groupKeyOf,
  mergeDebts,
} from './financeDebtGroups';

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

/**
 * `kind` bo'yicha guruhlar. Berilgan/olingan turlarida guruh o'sha turdagi
 * BARCHA qarzlardan quriladi (kontragent sahifasida yopilganlari ham ko'rinsin),
 * lekin ro'yxatda faqat `kind` ga mos qarzi bor kontragentlar qoladi.
 */
const groupsOfKind = (all: any[], kind: DebtListKind): DebtGroup[] => {
  if (kind === 'completed') return buildDebtGroups(completedDebts(all));
  const wanted = new Set(debtsOfKind(all, kind).map(groupKeyOf));
  const lentSide = kind === 'given' || kind === 'overdue-given' || kind === 'upcoming-given';
  const sameType = all.filter(d => (lentSide ? d?.type !== 'borrowed' : d?.type === 'borrowed'));
  return buildDebtGroups(sameType).filter(g => wanted.has(g.key));
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
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: dirColor + '14' }]}>
          <Ico size={rs(22)} color={dirColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{g.name}</Text>
          <Text allowFontScaling={false} style={styles.sub}>
            {g.items.length > 1
              ? `${g.items.length} ${t('ta qarz')}`
              : g.items[0]?.type === 'borrowed'
              ? t('Olingan')
              : t('Berilgan')}
          </Text>
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
          <Text allowFontScaling={false} style={styles.paidPct}>
            {t('{{p}}% to‘landi', { p: paidPct })}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const FinanceDebtList = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rawKind = route?.params?.kind;
  const kind: DebtListKind = KINDS.includes(rawKind) ? rawKind : 'given';

  const listFetch = useFetch({ url: FINANCE_DEBTS_URL, method: 'GET' });
  const refresh = listFetch.onRefresh;
  // Qarz tafsilotidan (yopish/to'lov) qaytganda ro'yxat yangilansin.
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh({});
    }, [refresh]),
  );

  const all = React.useMemo(() => mergeDebts(listFetch.data), [listFetch.data]);
  const groups = React.useMemo(() => groupsOfKind(all, kind), [all, kind]);

  const openGroup = (g: DebtGroup) => {
    if (g.items.length === 1) {
      navigation.navigate('FinanceDebtDetail', debtDetailParams(g.items[0]));
      return;
    }
    navigation.navigate('FinanceDebtGroup', { title: g.name, isShop: g.isShop, items: g.items });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t(DEBT_KIND_TITLE[kind])} showBack />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={!!listFetch.loading}
            onRefresh={() => refresh({})}
            tintColor={rd.color.primary}
            colors={[rd.color.primary]}
          />
        }>
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {listFetch.loading ? t('Yuklanmoqda...') : t('Qarzlar yo‘q.')}
            </Text>
          </View>
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
