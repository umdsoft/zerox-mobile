/**
 * FinanceAnalytics.tsx — Tahlil (web pages/finance/analytics/index.vue).
 * Oy/yil selektor + Insights + 3 tab (Daromadlar/Xarajatlar/Maqsadlar).
 * Grafiklar = flexbox barlar (kutubxonasiz).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { catLabel, fCompact, fDate, fillDailySeries, fMoney, num } from './financeMoney';
import { ChevronLeft, ChevronRight } from '../redesign/icons';

const GREEN = '#16a34a';
const BLUE = '#2f6fed';
const PURPLE = '#7c3aed';
const RED = '#dc2626';
const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];
const CYAN = '#0891b2';
const TABS = [
  // So'rov SS22.3: "Umumiy" OLINDI; "Kalendar" + "Hisobot" QO'SHILDI; nomlar ko'plikда (sayt kabi).
  { key: 'incomes', label: 'Daromadlar', color: GREEN },
  { key: 'expenses', label: 'Xarajatlar', color: BLUE },
  // SS9: 'calendar' tabi olib tashlandi (Shaxsiy moliya pastiga ko'chdi).
  { key: 'report', label: 'Hisobot', color: '#4f46e5' },
  { key: 'goals', label: 'Maqsadlar', color: PURPLE },
];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
// Kunlik barlar (flexbox) — {date,total}.
const DailyBars = ({ data, color }: { data: any[]; color: string }) => {
  const rows = (data || []).filter(Boolean);
  const max = Math.max(1, ...rows.map(r => num(r?.total)));
  const H = rs(110);
  if (!rows.length) return null;
  return (
    <View style={[styles.barsWrap, { height: H }]}>
      {rows.map((r, i) => (
        <View key={i} style={styles.barCol}>
          <View
            style={[
              styles.bar,
              { height: Math.max(2, (num(r?.total) / max) * (H - rs(14))), backgroundColor: color },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const FinanceAnalytics = () => {
  const { t } = useTranslation();
  const now = React.useMemo(() => new Date(), []);
  const [m, setM] = React.useState(now.getMonth() + 1);
  const [y, setY] = React.useState(now.getFullYear());
  const [tab, setTab] = React.useState('incomes');

  // Kalendar/Hisobot ikki manba (daromad+xarajat) talab qiladi. useFetch shartли emas,
  // shu bois primary=xarajat, secondary=daromad; boshqa tablarда secondary primary bilan
  // bir xil URL (zararsiz takror). Insights (Tavsiya) OLINDI — endi ko'rsatilmaydi.
  // SS9: kalendar olib tashlangach ikki manba FAQAT 'report' uchun kerak.
  const needBoth = tab === 'report';
  const primaryUrl =
    tab === 'goals'
      ? `${URL}/finance/analytics/goals`
      : needBoth
      ? `${URL}/finance/analytics/expenses?year=${y}&month=${m}`
      : `${URL}/finance/analytics/${tab}?year=${y}&month=${m}`;
  const secondaryUrl = needBoth
    ? `${URL}/finance/analytics/incomes?year=${y}&month=${m}`
    : primaryUrl;
  const dataFetch = useFetch({ url: primaryUrl, method: 'GET' });
  const dataFetch2 = useFetch({ url: secondaryUrl, method: 'GET' });

  const d: any = (dataFetch.data as any)?.data || {};
  const dInc: any = needBoth ? (dataFetch2.data as any)?.data || {} : {};
  const dExp: any = needBoth ? d : {};

  const tabColor = TABS.find(t => t.key === tab)?.color || BLUE;
  const isGoals = tab === 'goals';
  const dailyRows = tab === 'incomes' ? d?.daily_incomes : d?.daily_expenses;
  const topRows = tab === 'incomes' ? d?.top_incomes : d?.top_expenses;
  const byCat: any[] = d?.by_category || [];

  const changeMonth = (delta: number) => {
    let nm = m + delta;
    let ny = y;
    if (nm < 1) {
      nm = 12;
      ny -= 1;
    } else if (nm > 12) {
      nm = 1;
      ny += 1;
    }
    setM(nm);
    setY(ny);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Tahlil')} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* Oy selektor (maqsad tabida yashiriladi) */}
        {!isGoals && (
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
              <ChevronLeft size={rs(18)} color={rd.color.text} />
            </TouchableOpacity>
            <Text allowFontScaling={false} style={styles.monthText}>
              {t(MONTHS[m - 1])} {y}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
              <ChevronRight size={rs(18)} color={rd.color.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Insights (Tavsiya) OLIB TASHLANDI (so'rov SS22.1). */}

        {/* Tablar — 5 ta bo'lgani uchun gorizontal scroll (sig'maydi) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}>
          {TABS.map(tb => {
            const active = tab === tb.key;
            return (
              <TouchableOpacity
                key={tb.key}
                activeOpacity={0.85}
                onPress={() => setTab(tb.key)}
                style={[styles.tab, active && { backgroundColor: tb.color, borderColor: tb.color }]}>
                <Text allowFontScaling={false} style={[styles.tabText, active && { color: '#fff' }]}>
                  {t(tb.label)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {dataFetch.loading || (needBoth && dataFetch2.loading) ? (
          <Loading />
        /* SS9: "Kalendar" tabi BU YERDAN OLIB TASHLANDI — u endi
           "Shaxsiy moliya" sahifasining pastida (FinanceCalendarCard). */
        ) : tab === 'report' ? (
          /* ─ Hisobot tabi: daromad↔xarajat, sof qoldiq, jamg'arma (frontend-only) ─ */
          (() => {
            const inc = num(dInc?.total);
            const exp = num(dExp?.total);
            const net = inc - exp;
            const rate = inc > 0 ? Math.round((net / inc) * 100) : 0;
            const barMax = Math.max(1, inc, exp);
            const expCats: any[] = dExp?.by_category || [];
            return (
              <>
                <View style={styles.summaryGrid}>
                  <View style={styles.sumCard}>
                    <Text allowFontScaling={false} style={styles.sumLabel}>
                      {t('Daromad')}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.sumValueSm, { color: GREEN }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit>
                      {fMoney(inc)}
                    </Text>
                  </View>
                  <View style={styles.sumCard}>
                    <Text allowFontScaling={false} style={styles.sumLabel}>
                      {t('Xarajat')}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.sumValueSm, { color: RED }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit>
                      {fMoney(exp)}
                    </Text>
                  </View>
                  <View style={styles.sumCard}>
                    <Text allowFontScaling={false} style={styles.sumLabel}>
                      {t('Sof qoldiq')}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.sumValueSm, { color: net >= 0 ? GREEN : RED }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit>
                      {net >= 0 ? '+' : '−'}
                      {fMoney(Math.abs(net))}
                    </Text>
                  </View>
                  <View style={styles.sumCard}>
                    <Text allowFontScaling={false} style={styles.sumLabel}>
                      {t('Jamg‘arma darajasi')}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.sumValue, { color: rate >= 0 ? GREEN : RED }]}>
                      {rate}%
                    </Text>
                  </View>
                </View>

                {inc > 0 || exp > 0 ? (
                  <View style={styles.card}>
                    <Text allowFontScaling={false} style={styles.cardTitle}>
                      {t('Daromad va xarajat')}
                    </Text>
                    <View style={styles.cmpRow}>
                      <Text allowFontScaling={false} style={styles.cmpLabel}>
                        {t('Daromad')}
                      </Text>
                      <View style={styles.cmpTrack}>
                        <View
                          style={[styles.cmpFill, { width: `${(inc / barMax) * 100}%`, backgroundColor: GREEN }]}
                        />
                      </View>
                      <Text allowFontScaling={false} style={styles.cmpVal}>
                        {fCompact(inc)}
                      </Text>
                    </View>
                    <View style={styles.cmpRow}>
                      <Text allowFontScaling={false} style={styles.cmpLabel}>
                        {t('Xarajat')}
                      </Text>
                      <View style={styles.cmpTrack}>
                        <View
                          style={[styles.cmpFill, { width: `${(exp / barMax) * 100}%`, backgroundColor: RED }]}
                        />
                      </View>
                      <Text allowFontScaling={false} style={styles.cmpVal}>
                        {fCompact(exp)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text allowFontScaling={false} style={styles.emptyText}>
                      {t('Bu oyda ma’lumot yo‘q')}
                    </Text>
                  </View>
                )}

                {expCats.length > 0 && (
                  <View style={styles.card}>
                    <Text allowFontScaling={false} style={styles.cardTitle}>
                      {t('Xarajat kategoriyalari')}
                    </Text>
                    {expCats.map((c, i) => (
                      <View key={i} style={styles.catRow}>
                        <View style={styles.catTop}>
                          <Text allowFontScaling={false} style={styles.catName} numberOfLines={1}>
                            {c?.icon ? `${c.icon} ` : ''}
                            {catLabel(c?.name)}
                          </Text>
                          <Text allowFontScaling={false} style={styles.catAmount}>
                            {fMoney(c?.total, c?.currency || 'UZS')}
                          </Text>
                        </View>
                        <View style={styles.catBarTrack}>
                          <View
                            style={[
                              styles.catBarFill,
                              { width: `${num(c?.percent)}%`, backgroundColor: c?.color || RED },
                            ]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            );
          })()
        ) : isGoals ? (
          /* ─ Maqsadlar tabi ─ */
          <>
            <View style={styles.summaryGrid}>
              <View style={styles.sumCard}>
                <Text allowFontScaling={false} style={styles.sumLabel}>
                  {t('Faol maqsadlar')}
                </Text>
                <Text allowFontScaling={false} style={styles.sumValue}>
                  {num(d?.stats?.active_goals)}
                </Text>
              </View>
              <View style={styles.sumCard}>
                <Text allowFontScaling={false} style={styles.sumLabel}>
                  {t('Tugatilgan')}
                </Text>
                <Text allowFontScaling={false} style={styles.sumValue}>
                  {num(d?.stats?.completed_goals)}
                </Text>
              </View>
              <View style={styles.sumCard}>
                <Text allowFontScaling={false} style={styles.sumLabel}>
                  {t('Yig‘ildi')}
                </Text>
                <Text allowFontScaling={false} style={styles.sumValueSm} numberOfLines={1} adjustsFontSizeToFit>
                  {fMoney(d?.stats?.total_saved)}
                </Text>
              </View>
              <View style={styles.sumCard}>
                <Text allowFontScaling={false} style={styles.sumLabel}>
                  {t('Umumiy %')}
                </Text>
                <Text allowFontScaling={false} style={styles.sumValue}>
                  {num(d?.stats?.overall_progress)}%
                </Text>
              </View>
            </View>
            {/* Maqsadlar MUHIMLIK bo'yicha 3 TOIFAГА guruhlanadi (so'rov):
                Yuqori / O'rta / Past. Bo'sh toifa ko'rsatilmaydi. */}
            {(() => {
              const goals: any[] = d?.goals || [];
              const renderGoal = (g: any, i: number) => {
                const pct =
                  num(g?.target_amount) > 0
                    ? Math.min(100, Math.round((num(g?.current_amount) / num(g?.target_amount)) * 100))
                    : 0;
                return (
                  <View key={g?.id ?? i} style={styles.card}>
                    <View style={styles.goalRow}>
                      <Text allowFontScaling={false} style={styles.goalIcon}>
                        {g?.icon || '🎯'}
                      </Text>
                      <Text allowFontScaling={false} style={styles.goalTitle} numberOfLines={1}>
                        {g?.title}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.goalPct, { color: g?.color || PURPLE }]}>
                        {pct}%
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: g?.color || PURPLE }]} />
                    </View>
                  </View>
                );
              };
              const PRIO = [
                { key: 'high', label: 'Yuqori', color: '#ef4444' },
                { key: 'medium', label: 'O‘rta', color: '#f59e0b' },
                { key: 'low', label: 'Past', color: '#6b7280' },
              ];
              return PRIO.map(pr => {
                const grp = goals.filter(g => (g?.priority || 'medium') === pr.key);
                if (!grp.length) return null;
                return (
                  <View key={pr.key}>
                    <View style={styles.prioHeader}>
                      <View style={[styles.prioDot, { backgroundColor: pr.color }]} />
                      <Text allowFontScaling={false} style={styles.prioLabel}>
                        {t(pr.label)}
                      </Text>
                      <View style={[styles.prioCount, { backgroundColor: pr.color + '18' }]}>
                        <Text allowFontScaling={false} style={[styles.prioCountText, { color: pr.color }]}>
                          {grp.length}
                        </Text>
                      </View>
                    </View>
                    {grp.map(renderGoal)}
                  </View>
                );
              });
            })()}
          </>
        ) : (
          /* ─ Daromad/Xarajat tabi ─ */
          <>
            <View style={styles.summaryGrid}>
              <View style={styles.sumCard}>
                <Text allowFontScaling={false} style={styles.sumLabel}>
                  {t('Jami')}
                </Text>
                <Text allowFontScaling={false} style={styles.sumValueSm} numberOfLines={1} adjustsFontSizeToFit>
                  {fMoney(d?.total)}
                </Text>
              </View>
              <View style={styles.sumCard}>
                <Text allowFontScaling={false} style={styles.sumLabel}>
                  {t('Kunlik o‘rtacha')}
                </Text>
                <Text allowFontScaling={false} style={styles.sumValueSm} numberOfLines={1} adjustsFontSizeToFit>
                  {fMoney(d?.daily_average)}
                </Text>
              </View>
              <View style={styles.sumCard}>
                <Text allowFontScaling={false} style={styles.sumLabel}>
                  {t('Amaliyotlar')}
                </Text>
                <Text allowFontScaling={false} style={styles.sumValue}>
                  {byCat.reduce((s, c) => s + num(c?.count), 0)}
                </Text>
              </View>
              <View style={styles.sumCard}>
                <Text allowFontScaling={false} style={styles.sumLabel}>
                  {t('O‘tgan oyga')}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.sumValueSm,
                    { color: num(d?.comparison?.change) >= 0 ? GREEN : RED },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {num(d?.comparison?.change) >= 0 ? '+' : ''}
                  {num(d?.comparison?.change_percent)}%
                </Text>
              </View>
            </View>

            {/* Kunlik grafik */}
            {(dailyRows || []).some((x: any) => num(x?.total) > 0) && (
              <View style={styles.card}>
                <Text allowFontScaling={false} style={styles.cardTitle}>
                  {t('Kunlik grafik')}
                </Text>
                <DailyBars data={fillDailySeries(dailyRows, y, m)} color={tabColor} />
              </View>
            )}

            {/* Kategoriya */}
            {byCat.length > 0 && (
              <View style={styles.card}>
                <Text allowFontScaling={false} style={styles.cardTitle}>
                  {t('Kategoriyalar')}
                </Text>
                {byCat.map((c, i) => (
                  <View key={i} style={styles.catRow}>
                    <View style={styles.catTop}>
                      <Text allowFontScaling={false} style={styles.catName} numberOfLines={1}>
                        {c?.icon ? `${c.icon} ` : ''}
                        {catLabel(c?.name)}
                      </Text>
                      <Text allowFontScaling={false} style={styles.catAmount}>
                        {fMoney(c?.total, c?.currency || 'UZS')}
                      </Text>
                    </View>
                    <View style={styles.catBarTrack}>
                      <View
                        style={[
                          styles.catBarFill,
                          { width: `${num(c?.percent)}%`, backgroundColor: c?.color || tabColor },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Top-5 */}
            {(topRows || []).length > 0 && (
              <View style={styles.card}>
                <Text allowFontScaling={false} style={styles.cardTitle}>
                  {t('Eng yiriklari')}
                </Text>
                {topRows.map((r: any, i: number) => (
                  <View key={r?.id ?? i} style={[styles.topRow, i === 0 && { borderTopWidth: 0 }]}>
                    <Text allowFontScaling={false} style={styles.rowIcon}>
                      {r?.category_icon || '📦'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text allowFontScaling={false} style={styles.rowName} numberOfLines={1}>
                        {r?.description || catLabel(r?.category_name)}
                      </Text>
                      <Text allowFontScaling={false} style={styles.rowMeta}>
                        {fDate(r?.income_date || r?.expense_date)}
                      </Text>
                    </View>
                    <Text allowFontScaling={false} style={[styles.rowAmount, { color: tabColor }]}>
                      {fMoney(r?.amount, r?.currency || 'UZS')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {!byCat.length && !(topRows || []).length && (
              <View style={styles.emptyBox}>
                <Text allowFontScaling={false} style={styles.emptyText}>
                  {t('Bu oyda ma’lumot yo‘q')}
                </Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: rs(16) }} />
      </ScrollView>
    </View>
  );
};

export default FinanceAnalytics;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(24), gap: rs(14) },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.pill,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(4),
  },
  monthArrow: { width: rs(38), height: rs(38), borderRadius: rs(19), alignItems: 'center', justifyContent: 'center' },
  monthText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  insight: {
    flexDirection: 'row',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: rd.color.border,
    borderLeftWidth: rs(4),
    padding: rs(14),
  },
  insightIcon: { fontSize: rs(20) },
  insightTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  insightMsg: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(2) },

  tabs: { flexDirection: 'row', gap: rs(8), paddingRight: rs(4) },
  tab: {
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.pill,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(9),
    paddingHorizontal: rs(16),
  },
  tabText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
  sumCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  sumLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  sumValue: { fontFamily: rd.font.bold, fontSize: rs(20), color: rd.color.text, marginTop: rs(4) },
  sumValueSm: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text, marginTop: rs(4) },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
  },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text, marginBottom: rs(10) },

  barsWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(2) },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '70%', borderTopLeftRadius: 3, borderTopRightRadius: 3, minWidth: rs(3) },

  catRow: { paddingVertical: rs(8) },
  catTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  catAmount: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text, marginLeft: rs(8) },
  catBarTrack: {
    height: rs(6),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(6),
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: rd.radius.pill },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  rowIcon: { fontSize: rs(20) },
  rowName: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  rowMeta: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  rowAmount: { fontFamily: rd.font.bold, fontSize: rs(13) },

  goalRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  goalIcon: { fontSize: rs(22) },
  goalTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  goalPct: { fontFamily: rd.font.bold, fontSize: rs(14) },
  // Maqsad toifa sarlavhasi (Yuqori / O'rta / Past).
  prioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(14),
    marginBottom: rs(2),
  },
  prioDot: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  prioLabel: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  prioCount: {
    minWidth: rs(22),
    paddingHorizontal: rs(7),
    paddingVertical: rs(2),
    borderRadius: rd.radius.pill,
    alignItems: 'center',
  },
  prioCountText: { fontFamily: rd.font.bold, fontSize: rs(12) },
  barTrack: {
    height: rs(8),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(10),
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: rd.radius.pill },

  // Kalendar (SS22.3)
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rs(6) },
  weekCell: {
    width: '13%',
    textAlign: 'center',
    fontFamily: rd.font.semibold,
    fontSize: rs(11),
    color: rd.color.textTertiary,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: rs(6) },
  calCell: { width: '13%', aspectRatio: 1 },
  calDay: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rs(10),
    backgroundColor: rd.color.surfaceAlt,
  },
  calDayOn: { backgroundColor: CYAN },
  calNum: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  calDot: { width: rs(5), height: rs(5), borderRadius: rs(2.5), marginTop: rs(2) },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(12) },
  legendDot: { width: rs(9), height: rs(9), borderRadius: rs(4.5), marginRight: rs(5) },
  legendText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
  calHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
    paddingHorizontal: rs(20),
  },
  selRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: rs(7) },
  selLabel: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textSecondary },
  selVal: { fontFamily: rd.font.bold, fontSize: rs(14) },
  selNet: { borderTopWidth: 1, borderTopColor: rd.color.border, marginTop: rs(2) },

  // Hisobot (SS22.3)
  cmpRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingVertical: rs(6) },
  cmpLabel: { width: rs(64), fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  cmpTrack: {
    flex: 1,
    height: rs(10),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    overflow: 'hidden',
  },
  cmpFill: { height: '100%', borderRadius: rd.radius.pill },
  cmpVal: { width: rs(58), textAlign: 'right', fontFamily: rd.font.bold, fontSize: rs(12), color: rd.color.text },

  emptyBox: { alignItems: 'center', paddingVertical: rs(40) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textTertiary },
});
