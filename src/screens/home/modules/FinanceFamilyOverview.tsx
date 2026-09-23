/**
 * FinanceFamilyOverview.tsx — kuzatilayotgan a'zoning oylik xulosasi (web family overview).
 * Oy navigatsiya + umumiy balans + daromad/xarajat (valyuta bo'yicha jami + kategoriya).
 * Ruxsat darajasiga qarab maydonlar bo'lishi/bo'lmasligi mumkin (backend perms).
 * Backend: GET /finance/family/:id/overview?year&month.
 */
import { useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { catLabel, currencyTotals, fMoney, num } from './financeMoney';
import { ChevronLeft, ChevronRight } from '../redesign/icons';

const GREEN = '#16a34a';
const RED = '#dc2626';
const UZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const CatList = ({ rows, color }: { rows: any[]; color: string }) => (
  <>
    {(rows || []).map((r, i) => (
      <View key={i} style={styles.catRow}>
        <Text allowFontScaling={false} style={styles.catName} numberOfLines={1}>{r.icon ? `${r.icon} ` : ''}{catLabel(r.name)}</Text>
        <Text allowFontScaling={false} style={[styles.catAmt, { color }]}>{fMoney(r.total, r.currency)}</Text>
      </View>
    ))}
  </>
);

const FinanceFamilyOverview = () => {
  const { t } = useTranslation();
  const { id, name } = (useRoute().params as any) || {};
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);

  const ovFetch = useFetch({ url: `${URL}/finance/family/${id}/overview?year=${year}&month=${month}`, method: 'GET' });
  const d: any = (ovFetch.data as any)?.data || {};

  const monthStep = (dir: number) => {
    let m = month + dir, y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m); setYear(y);
  };

  const incLines = currencyTotals(d?.income?.by_currency);
  const expLines = currencyTotals(d?.expense?.by_currency);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={name || 'Ko‘rinish'} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => monthStep(-1)} style={styles.monthBtn}><ChevronLeft size={rs(20)} color={rd.color.primary} /></TouchableOpacity>
          <Text allowFontScaling={false} style={styles.monthLabel}>{`${t(UZ_MONTHS[month - 1])} ${year}`}</Text>
          <TouchableOpacity onPress={() => monthStep(1)} style={styles.monthBtn}><ChevronRight size={rs(20)} color={rd.color.primary} /></TouchableOpacity>
        </View>

        {ovFetch.loading ? (
          <Loading />
        ) : (
          <>
            {d?.all_balance_uzs != null && (
              <View style={styles.balanceCard}>
                <Text allowFontScaling={false} style={styles.balanceLabel}>{t('Umumiy balans (barcha davr)')}</Text>
                <Text allowFontScaling={false} style={[styles.balanceVal, { color: num(d.all_balance_uzs) >= 0 ? '#fff' : '#fecaca' }]}>
                  {num(d.all_balance_uzs) >= 0 ? '+' : '−'}{fMoney(Math.abs(num(d.all_balance_uzs)))}
                </Text>
              </View>
            )}

            {d?.income && (
              <View style={styles.card}>
                <Text allowFontScaling={false} style={styles.cardTitle}>{t('Daromad')}</Text>
                {incLines.length === 0 ? <Text style={styles.empty}>{t('Yo‘q')}</Text> : incLines.map((l, i) => (
                  <Text key={i} allowFontScaling={false} style={[styles.total, { color: GREEN }]}>{l}</Text>
                ))}
                <CatList rows={d.income.by_category} color={GREEN} />
              </View>
            )}

            {d?.expense && (
              <View style={styles.card}>
                <Text allowFontScaling={false} style={styles.cardTitle}>{t('Xarajat')}</Text>
                {expLines.length === 0 ? <Text style={styles.empty}>{t('Yo‘q')}</Text> : expLines.map((l, i) => (
                  <Text key={i} allowFontScaling={false} style={[styles.total, { color: RED }]}>{l}</Text>
                ))}
                <CatList rows={d.expense.by_category} color={RED} />
              </View>
            )}

            {!d?.income && !d?.expense && (
              <View style={styles.card}><Text style={styles.empty}>{t('Ko‘rish uchun ruxsat cheklangan.')}</Text></View>
            )}
          </>
        )}
        <View style={{ height: rs(20) }} />
      </ScrollView>
    </View>
  );
};

export default FinanceFamilyOverview;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(14) },
  monthBtn: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: rd.color.primaryTint, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },

  balanceCard: { backgroundColor: rd.color.primary, borderRadius: rd.radius.xl, padding: rs(18), marginBottom: rs(14) },
  balanceLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: 'rgba(255,255,255,0.85)' },
  balanceVal: { fontFamily: rd.font.bold, fontSize: rs(24), color: '#fff', marginTop: rs(6) },

  card: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginBottom: rs(12) },
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text, marginBottom: rs(8) },
  total: { fontFamily: rd.font.bold, fontSize: rs(16), marginBottom: rs(4) },
  empty: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textTertiary },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: rs(7), borderTopWidth: 1, borderTopColor: rd.color.border },
  catName: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.text },
  catAmt: { fontFamily: rd.font.bold, fontSize: rs(13) },
});
