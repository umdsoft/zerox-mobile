import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { fmtDateTimeUz } from '../../../../helper';
import { CalendarIcon, ClockIcon, WarningIcon } from '../../redesign/icons';

/**
 * SubscriptionStatusCard — Tariflar sahifasida JORIY TARIF muddati.
 *
 * 29.09 (mobil hujjat, 3-band): "Foydalanuvchining tarifga qachon ulanganligi va tarif
 * muddati qachon tugashi qayd etilishi kerak (tarif muddati bir oy) — foydalanuvchi
 * muddat tugaganini bilmay qolmasin". Saytdagi Tariflar sahifasi bilan bir xil manba:
 *   GET /finance/subscription → data.subscription { plan, start_date, end_date,
 *     days_left, expiring_soon, is_expired }, data.previous (yaqinda tugagan pullik tarif).
 * Holatlar:
 *   - pullik tarif faol  → ulangan sana · tugash sanasi · qolgan kun + chiziq;
 *   - ≤ 5 kun qolgan     → sariq ogohlantirish + "Muddatini uzaytirish";
 *   - tarif tugagan (Free'ga tushgan, `previous`) → qizil ogohlantirish + "Qayta ulanish".
 * Free (hech qachon pullik bo'lmagan) — karta ko'rsatilmaydi.
 */

const VIOLET = '#6d5ae6';
const DAY_MS = 24 * 3600 * 1000;

type Sub = {
  plan?: string;
  start_date?: string | null;
  end_date?: string | null;
  days_left?: number | null;
  expiring_soon?: boolean;
};
type Prev = { plan?: string; start_date?: string | null; end_date?: string | null } | null;

type Props = {
  sub: Sub | null | undefined;
  previous: Prev | undefined;
  busy: boolean;
  onRenew: (plan: 'start' | 'premium') => void;
};

const planLabel = (p?: string) => (p === 'premium' ? 'Premium' : p === 'start' ? 'Start' : 'Free');
const fmtDate = (s?: string | null) => (s ? fmtDateTimeUz(s).slice(0, 10) : '—');

/**
 * 01.10 (mobil hujjat, 1-band): yorliq IKKI qismli — bosh so'z ikonka YONIDA (bir qatorda),
 * qolgan qismi pastki qatorda ("Ulangan" + "sana", "Tugash" + "sanasi", "Qolgan" + "kun").
 * Tarjima matnini kesib bo'lmaydi (har tilda so'z tartibi boshqa) — shu sabab har qism
 * ALOHIDA i18n kaliti (`subCell.*.head` / `subCell.*.tail`), 5 tilda.
 */
type CellProps = { head: string; tail: string; value: string; Icon: any };

const Cell = ({ head, tail, value, Icon }: CellProps) => (
  <View style={styles.cell} accessible accessibilityLabel={`${head} ${tail}: ${value}`}>
    <View style={styles.cellHeadRow}>
      <Icon size={rs(14)} color={rd.color.textTertiary} />
      <Text allowFontScaling={false} numberOfLines={1} style={styles.cellHead}>
        {head}
      </Text>
    </View>
    <Text allowFontScaling={false} numberOfLines={1} style={styles.cellLabel}>
      {tail}
    </Text>
    <Text allowFontScaling={false} numberOfLines={1} style={styles.cellValue}>
      {value}
    </Text>
  </View>
);

const SubscriptionStatusCard = ({ sub, previous, busy, onRenew }: Props) => {
  const { t } = useTranslation();
  const plan = sub?.plan || 'free';
  const isPaid = plan === 'start' || plan === 'premium';

  // Tarif tugagan — Free'ga tushgan, lekin yaqinda pullik tarif bo'lgan.
  if (!isPaid) {
    if (!previous?.end_date) return null;
    const prevPlan = previous.plan === 'premium' ? 'premium' : 'start';
    return (
      <View style={[styles.card, styles.cardExpired]}>
        <View style={styles.warnRow}>
          <WarningIcon size={rs(18)} color={rd.color.error} />
          <Text allowFontScaling={false} style={[styles.warnText, { color: rd.color.error }]}>
            {t('{{plan}} tarifi muddati {{date}} da tugagan. Pullik imkoniyatlar o‘chirildi.', {
              plan: planLabel(prevPlan),
              date: fmtDate(previous.end_date),
            })}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={busy}
          onPress={() => onRenew(prevPlan)}
          accessibilityRole="button"
          style={[styles.renewBtn, { backgroundColor: rd.color.error }]}>
          {busy ? (
            <ActivityIndicator color={rd.color.onPrimary} size="small" />
          ) : (
            <Text allowFontScaling={false} style={styles.renewText}>
              {t('Qayta ulanish')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  const accent = plan === 'premium' ? VIOLET : rd.color.primary;
  const start = sub?.start_date ? new Date(sub.start_date).getTime() : NaN;
  const end = sub?.end_date ? new Date(sub.end_date).getTime() : NaN;
  const hasPeriod = !isNaN(start) && !isNaN(end) && end > start;
  const daysLeft = sub?.days_left ?? null;
  // Davrning qancha qismi o'tgan (chiziq): 0..100.
  const passedPct = hasPeriod
    ? Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)))
    : 0;
  const soon = !!sub?.expiring_soon;
  const barColor = soon ? rd.color.warning : accent;

  return (
    <View style={[styles.card, soon && styles.cardSoon]}>
      <View style={styles.head}>
        <Text allowFontScaling={false} style={styles.title}>
          {t('Joriy tarif')}
        </Text>
        <View style={[styles.planPill, { backgroundColor: accent + '1A' }]}>
          <Text allowFontScaling={false} style={[styles.planPillText, { color: accent }]}>
            {planLabel(plan)}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Cell
          head={t('subCell.start.head')}
          tail={t('subCell.start.tail')}
          value={fmtDate(sub?.start_date)}
          Icon={CalendarIcon}
        />
        <Cell
          head={t('subCell.end.head')}
          tail={t('subCell.end.tail')}
          value={fmtDate(sub?.end_date)}
          Icon={CalendarIcon}
        />
        <Cell
          head={t('subCell.left.head')}
          tail={t('subCell.left.tail')}
          value={daysLeft == null ? '—' : t('{{n}} kun', { n: daysLeft })}
          Icon={ClockIcon}
        />
      </View>

      {hasPeriod ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${passedPct}%`, backgroundColor: barColor }]} />
        </View>
      ) : null}

      {soon ? (
        <View style={styles.warnRow}>
          <WarningIcon size={rs(16)} color={rd.color.warning} />
          <Text allowFontScaling={false} style={[styles.warnText, { color: '#92400e' }]}>
            {t('Tarif muddati {{n}} kundan so‘ng tugaydi. Ilova funksiyalari to‘liq ishlashi uchun muddatini uzaytiring.', {
              n: daysLeft ?? 0,
            })}
          </Text>
        </View>
      ) : (
        <Text allowFontScaling={false} style={styles.note}>
          {t('Tarif muddati — 1 oy. Muddat tugagach pullik imkoniyatlar o‘chadi.')}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={busy}
        onPress={() => onRenew(plan as 'start' | 'premium')}
        accessibilityRole="button"
        style={[styles.renewBtn, { backgroundColor: soon ? rd.color.warning : accent }]}>
        {busy ? (
          <ActivityIndicator color={rd.color.onPrimary} size="small" />
        ) : (
          <Text allowFontScaling={false} style={styles.renewText}>
            {t('Muddatini uzaytirish')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default SubscriptionStatusCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginBottom: rs(16),
  },
  cardSoon: { borderColor: '#f5d9a8', backgroundColor: '#fffbeb' },
  cardExpired: { borderColor: '#fecaca', backgroundColor: rd.color.errorBg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  planPill: { borderRadius: rd.radius.pill, paddingHorizontal: rs(10), paddingVertical: rs(3) },
  planPillText: { fontFamily: rd.font.semibold, fontSize: rs(12) },
  grid: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
  cell: {
    flex: 1,
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(10),
    paddingVertical: rs(9),
  },
  cellHeadRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  cellHead: {
    flexShrink: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(11),
    lineHeight: rs(14),
    color: rd.color.textTertiary,
  },
  cellLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(11),
    lineHeight: rs(14),
    color: rd.color.textTertiary,
    marginTop: rs(1),
  },
  cellValue: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text, marginTop: rs(4) },
  track: {
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: rd.color.surfaceAlt,
    overflow: 'hidden',
    marginTop: rs(12),
  },
  fill: { height: '100%', borderRadius: rs(3) },
  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), marginTop: rs(12) },
  warnText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12.5), lineHeight: rs(18) },
  note: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    lineHeight: rs(17),
    color: rd.color.textTertiary,
    marginTop: rs(10),
  },
  renewBtn: {
    marginTop: rs(12),
    borderRadius: rd.radius.md,
    paddingVertical: rs(11),
    alignItems: 'center',
  },
  renewText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.onPrimary },
});
