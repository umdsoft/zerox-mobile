/**
 * FinanceCalendarCard.tsx — SS9: oylik daromad/xarajat KALENDARI.
 *
 * Ilgari bu blok "Tahlil" (FinanceAnalytics) ichidagi "Kalendar" tabi edi.
 * So'rov bo'yicha u "Shaxsiy moliya" bo'limining ENG PASTIGA ko'chirildi —
 * foydalanuvchi moliya sahifasiga kirgan zahoti oyning kunlar kesimini
 * ko'radi, "Tahlil" esa faqat daromad/xarajat/hisobot/maqsadga qaratiladi.
 *
 * Ma'lumot: GET /finance/analytics/incomes|expenses?year=&month= (ikkala manba).
 * O'z oy tanlagichi bor — sahifaning qolgan qismiga bog'liq emas.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import { fillDailySeries, fMoney } from './financeMoney';
import { ChevronLeft, ChevronRight } from '../redesign/icons';

const GREEN = '#16a34a';
const RED = '#dc2626';
const CYAN = '#0891b2';
const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

const FinanceCalendarCard = () => {
  const { t } = useTranslation();
  const now = React.useMemo(() => new Date(), []);
  const [m, setM] = React.useState(now.getMonth() + 1);
  const [y, setY] = React.useState(now.getFullYear());
  const [selDay, setSelDay] = React.useState<number | null>(null);

  // useFetch effekt bog'liqligi URL SATRI — oy o'zgarsa avtomatik qayta o'qiydi.
  const expFetch = useFetch({
    url: `${URL}/finance/analytics/expenses?year=${y}&month=${m}`,
    method: 'GET',
  });
  const incFetch = useFetch({
    url: `${URL}/finance/analytics/incomes?year=${y}&month=${m}`,
    method: 'GET',
  });
  const dExp: any = (expFetch.data as any)?.data || {};
  const dInc: any = (incFetch.data as any)?.data || {};

  const changeMonth = (delta: number) => {
    let nm = m + delta;
    let ny = y;
    if (nm < 1) { nm = 12; ny -= 1; } else if (nm > 12) { nm = 1; ny += 1; }
    setSelDay(null);
    setM(nm);
    setY(ny);
  };

  const incS = fillDailySeries(dInc?.daily_incomes, y, m);
  const expS = fillDailySeries(dExp?.daily_expenses, y, m);
  const maxExp = Math.max(1, ...expS.map((r: any) => r.total));
  const daysInMonth = expS.length;
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Dushanba = 0
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const totInc = incS.reduce((s: number, r: any) => s + r.total, 0);
  const totExp = expS.reduce((s: number, r: any) => s + r.total, 0);
  const sel =
    selDay != null
      ? { inc: incS[selDay - 1]?.total || 0, exp: expS[selDay - 1]?.total || 0 }
      : null;

  return (
    <View style={styles.wrap}>
      {/* Oy tanlagich */}
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

      {/* Oy jami */}
      <View style={styles.summaryGrid}>
        <View style={styles.sumCard}>
          <Text allowFontScaling={false} style={styles.sumLabel}>{t('Jami daromad')}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.sumValueSm, { color: GREEN }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {fMoney(totInc)}
          </Text>
        </View>
        <View style={styles.sumCard}>
          <Text allowFontScaling={false} style={styles.sumLabel}>{t('Jami xarajat')}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.sumValueSm, { color: RED }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {fMoney(totExp)}
          </Text>
        </View>
      </View>

      {/* Kunlar gridi */}
      <View style={styles.card}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map(w => (
            <Text key={w} allowFontScaling={false} style={styles.weekCell}>{t(w)}</Text>
          ))}
        </View>
        <View style={styles.calGrid}>
          {cells.map((day, i) => {
            if (day == null) return <View key={i} style={styles.calCell} />;
            const exp = expS[day - 1]?.total || 0;
            const inc = incS[day - 1]?.total || 0;
            const intensity = exp > 0 ? 0.12 + 0.5 * (exp / maxExp) : 0;
            const on = selDay === day;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => setSelDay(on ? null : day)}
                style={[
                  styles.calCell,
                  styles.calDay,
                  exp > 0 && { backgroundColor: `rgba(220,38,38,${intensity})` },
                  on && styles.calDayOn,
                ]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.calNum, (on || intensity > 0.4) && { color: '#fff' }]}>
                  {day}
                </Text>
                {inc > 0 && (
                  <View style={[styles.calDot, { backgroundColor: on ? '#fff' : GREEN }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: RED }]} />
          <Text allowFontScaling={false} style={styles.legendText}>{t('Xarajat')}</Text>
          <View style={[styles.legendDot, { backgroundColor: GREEN, marginLeft: rs(14) }]} />
          <Text allowFontScaling={false} style={styles.legendText}>{t('Daromad')}</Text>
        </View>
      </View>

      {/* Tanlangan kun tafsiloti */}
      {sel ? (
        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.cardTitle}>
            {selDay}-{t(MONTHS[m - 1])}
          </Text>
          <View style={styles.selRow}>
            <Text allowFontScaling={false} style={styles.selLabel}>{t('Daromad')}</Text>
            <Text allowFontScaling={false} style={[styles.selVal, { color: GREEN }]}>
              +{fMoney(sel.inc)}
            </Text>
          </View>
          <View style={styles.selRow}>
            <Text allowFontScaling={false} style={styles.selLabel}>{t('Xarajat')}</Text>
            <Text allowFontScaling={false} style={[styles.selVal, { color: RED }]}>
              −{fMoney(sel.exp)}
            </Text>
          </View>
          <View style={[styles.selRow, styles.selNet]}>
            <Text
              allowFontScaling={false}
              style={[styles.selLabel, { fontFamily: rd.font.bold, color: rd.color.text }]}>
              {t('Sof')}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.selVal, { color: sel.inc - sel.exp >= 0 ? GREEN : RED }]}>
              {sel.inc - sel.exp >= 0 ? '+' : '−'}
              {fMoney(Math.abs(sel.inc - sel.exp))}
            </Text>
          </View>
        </View>
      ) : (
        <Text allowFontScaling={false} style={styles.calHint}>
          {t('Kunni tanlang — o‘sha kungi daromad va xarajat ko‘rinadi.')}
        </Text>
      )}
    </View>
  );
};

export default FinanceCalendarCard;

// Uslublar FinanceAnalytics'dagi kalendar uslublari bilan bir xil (ko'rinish
// o'zgarmasin) — faqat bu komponentga ko'chirildi.
const styles = StyleSheet.create({
  wrap: { gap: rs(12) },
  // Uslublar FinanceAnalytics'dagi kalendar bloki bilan AYNAN bir xil —
  // ko'chirishda ko'rinish o'zgarmasligi kerak.
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
});
