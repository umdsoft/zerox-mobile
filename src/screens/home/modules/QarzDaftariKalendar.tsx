/**
 * QarzDaftariKalendar.tsx — SS5-3 (2026-09-21): QARZ DAFTARI kalendari.
 *
 * So'rov: "Muddati yaqin olingan qarzlar kartasidan so'ng xuddi shaxsiy moliya
 * sahifasidagidek kalendar va kunlik-oylik hisobotlarni joylashtirish kerak.
 * Bu kalendar orqali qarz beruvchi 1 kunda, 1 haftada va 1 oyda qancha miqdorda
 * qarz berib, qancha miqdorda qarzni undirishga muvaffaq bo'lganini ko'rishi
 * mumkin bo'ladi."
 *
 * Ko'rinish AYNAN "Shaxsiy moliya" kalendariga mos (FinanceCalendarCard) —
 * uslublar undan olingan, faqat mazmun boshqa:
 *   yashil = BERILGAN qarz,  ko'k = UNDIRILGAN (qaytarilgan).
 *
 * Ma'lumot: GET /qarz-daftari/kalendar?year=&month=&valyuta=
 * (yangi endpoint — ilgari kunlik kesim umuman mavjud emas edi).
 *
 * ⚠️ Valyutalar QO'SHILMAYDI: UZS va USD ni bitta songa jamlash ma'nosiz,
 * shu bois yuqorida valyuta tanlagich turadi.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { fMoney } from './financeMoney';
import { ChevronLeft, ChevronRight } from '../redesign/icons';

const GREEN = '#16a34a';
const BLUE = '#2f6fed';
const CYAN = '#0891b2';
const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

type Kun = { kun: number; berilgan: number; undirilgan: number };

const QarzDaftariKalendar = () => {
  const { t } = useTranslation();
  const now = React.useMemo(() => new Date(), []);
  const [m, setM] = React.useState(now.getMonth() + 1);
  const [y, setY] = React.useState(now.getFullYear());
  const [cur, setCur] = React.useState<'UZS' | 'USD'>('UZS');
  const [selDay, setSelDay] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<Kun[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get(
          `${URL}/qarz-daftari/kalendar?year=${y}&month=${m}&valyuta=${cur}`,
          { headers: { Authorization: `Bearer ${storage.getString('token')}` } },
        );
        if (alive && Array.isArray(data?.data?.daily)) setRows(data.data.daily);
        else if (alive) setRows([]);
      } catch (e) {
        // Kalendar yuklanmasa sahifaning qolgani ishlayveradi.
        if (alive) setRows([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [y, m, cur]);

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
    setSelDay(null);
    setM(nm);
    setY(ny);
  };

  const daysInMonth = new Date(y, m, 0).getDate();
  /** kun -> qiymatlar (bo'sh kunlar 0). */
  const byDay = React.useMemo(() => {
    const map: Record<number, Kun> = {};
    for (const r of rows) map[r.kun] = r;
    return map;
  }, [rows]);

  const maxBer = Math.max(
    1,
    ...Array.from({ length: daysInMonth }, (_, i) => byDay[i + 1]?.berilgan || 0),
  );
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Dushanba = 0
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const totBer = rows.reduce((s, r) => s + r.berilgan, 0);
  const totUnd = rows.reduce((s, r) => s + r.undirilgan, 0);

  /**
   * 1 HAFTA: tanlangan kun (yoki bugun) tushgan Du–Ya oralig'i.
   * So'rovda "1 kunda, 1 haftada va 1 oyda" deyilgan — uchalasi ham chiqadi.
   */
  const bazaKun =
    selDay != null
      ? selDay
      : y === now.getFullYear() && m === now.getMonth() + 1
      ? now.getDate()
      : 1;
  const dow = (new Date(y, m - 1, bazaKun).getDay() + 6) % 7;
  const haftaBosh = Math.max(1, bazaKun - dow);
  const haftaOxir = Math.min(daysInMonth, haftaBosh + 6);
  let haftaBer = 0;
  let haftaUnd = 0;
  for (let d = haftaBosh; d <= haftaOxir; d++) {
    haftaBer += byDay[d]?.berilgan || 0;
    haftaUnd += byDay[d]?.undirilgan || 0;
  }

  const kunBer = byDay[bazaKun]?.berilgan || 0;
  const kunUnd = byDay[bazaKun]?.undirilgan || 0;

  const Satr = ({
    label,
    ber,
    und,
  }: {
    label: string;
    ber: number;
    und: number;
  }) => (
    <View style={styles.repRow}>
      <Text allowFontScaling={false} style={styles.repLabel}>{label}</Text>
      <View style={styles.repVals}>
        <Text allowFontScaling={false} style={[styles.repVal, { color: GREEN }]} numberOfLines={1}>
          +{fMoney(ber)}
        </Text>
        <Text allowFontScaling={false} style={[styles.repVal, { color: BLUE }]} numberOfLines={1}>
          {fMoney(und)}
        </Text>
      </View>
    </View>
  );

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

      {/* Valyuta — UZS va USD QO'SHILMAYDI */}
      <View style={styles.curRow}>
        {(['UZS', 'USD'] as const).map(c => {
          const on = cur === c;
          return (
            <TouchableOpacity
              key={c}
              activeOpacity={0.85}
              onPress={() => setCur(c)}
              style={[styles.curBtn, on && styles.curBtnOn]}>
              <Text allowFontScaling={false} style={[styles.curText, on && styles.curTextOn]}>
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Oy jami */}
      <View style={styles.summaryGrid}>
        <View style={styles.sumCard}>
          <Text allowFontScaling={false} style={styles.sumLabel}>{t('Berilgan qarz')}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.sumValueSm, { color: GREEN }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {fMoney(totBer)}
          </Text>
        </View>
        <View style={styles.sumCard}>
          <Text allowFontScaling={false} style={styles.sumLabel}>{t('Undirilgan qarz')}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.sumValueSm, { color: BLUE }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {fMoney(totUnd)}
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
            const ber = byDay[day]?.berilgan || 0;
            const und = byDay[day]?.undirilgan || 0;
            const intensity = ber > 0 ? 0.12 + 0.5 * (ber / maxBer) : 0;
            const on = selDay === day;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => setSelDay(on ? null : day)}
                style={[
                  styles.calCell,
                  styles.calDay,
                  ber > 0 && { backgroundColor: `rgba(22,163,74,${intensity})` },
                  on && styles.calDayOn,
                ]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.calNum, (on || intensity > 0.4) && { color: '#fff' }]}>
                  {day}
                </Text>
                {und > 0 && (
                  <View style={[styles.calDot, { backgroundColor: on ? '#fff' : BLUE }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
          <Text allowFontScaling={false} style={styles.legendText}>{t('Berilgan')}</Text>
          <View style={[styles.legendDot, { backgroundColor: BLUE, marginLeft: rs(14) }]} />
          <Text allowFontScaling={false} style={styles.legendText}>{t('Undirilgan')}</Text>
        </View>
      </View>

      {/* Kunlik / haftalik / oylik hisobot */}
      <View style={styles.card}>
        <Text allowFontScaling={false} style={styles.cardTitle}>
          {t('Hisobot')}
        </Text>
        <Satr label={`${bazaKun}-${t(MONTHS[m - 1])}`} ber={kunBer} und={kunUnd} />
        <Satr
          label={`${t('Hafta')}: ${haftaBosh}–${haftaOxir}`}
          ber={haftaBer}
          und={haftaUnd}
        />
        <View style={styles.repDivider} />
        <Satr label={`${t(MONTHS[m - 1])} ${y}`} ber={totBer} und={totUnd} />
      </View>

      {selDay == null ? (
        <Text allowFontScaling={false} style={styles.calHint}>
          {t('Kunni tanlang — o‘sha kungi berilgan va undirilgan qarz ko‘rinadi.')}
        </Text>
      ) : null}
    </View>
  );
};

export default QarzDaftariKalendar;

// Uslublar FinanceCalendarCard bilan AYNAN bir xil — so'rov "xuddi shaxsiy
// moliya sahifasidagidek" bo'lgani uchun ko'rinish farq qilmasligi kerak.
const styles = StyleSheet.create({
  wrap: { gap: rs(12) },
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
  monthArrow: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  curRow: { flexDirection: 'row', gap: rs(8) },
  curBtn: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(6),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
  },
  curBtnOn: { backgroundColor: rd.color.primary },
  curText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary },
  curTextOn: { color: '#fff' },

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
    fontSize: rs(12),
    color: rd.color.textTertiary,
    textAlign: 'center',
    paddingHorizontal: rs(20),
  },

  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(7),
    gap: rs(10),
  },
  repLabel: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  repVals: { alignItems: 'flex-end' },
  repVal: { fontFamily: rd.font.bold, fontSize: rs(12.5) },
  repDivider: { height: 1, backgroundColor: rd.color.border, marginVertical: rs(4) },
});
