/**
 * DebtPlanSections.tsx — Asosiy panel bo'laklari: hero (qarzsiz bo'lish sanasi),
 * qoplash ogohlantirishi + hodisalar, "Shu oy to'lovlari" va to'lash tartibi ro'yxati.
 * Ma'lumot tayyor holda keladi (DebtPlan.tsx) — bu yerda faqat ko'rsatish.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from 'i18next';
import { rd, rs } from '../../../../theme/rd';
import { CheckCircleIcon, ChevronRight } from '../../redesign/icons';
import { fCompact } from '../financeMoney';
import { mcYm, MonthPayment, PlanBundle, PlanDebt, PlanEvent, PlanOrder } from './debtPlanApi';
import { debtsByKey } from './debtPlanText';
import { Badge, Card, DP, Grad, HelpBox, ProgressBar } from './debtPlanUi';
import {
  eventText,
  fmtYm,
  fPct,
  fUzs,
  kindLabel,
  paymentTypeMeta,
  reasonText,
  yearlyPct,
} from './debtPlanText';

// ─────────── Hero ───────────
export const PlanHero = ({ bundle, progress }: { bundle: PlanBundle; progress: number | null }) => {
  const r = bundle.result;
  const base = r?.scenarios.base || null;
  const ok = !!r && r.feasible && !!base?.finishYm && base.months != null;
  const p90 = r?.monteCarlo ? mcYm(base, r.monteCarlo.p90) : null;
  return (
    <View style={styles.hero}>
      <Grad id="dpHero" colors={ok ? DP.grad : ['#b45309', '#9f1239']} />
      <View style={styles.heroGlow} />
      <Text allowFontScaling={false} style={styles.heroKicker}>
        {ok ? t('Qarzsiz bo‘lish sanasi') : r && r.feasible ? t('Tugash sanasi aniqlanmadi') : t('Reja tuzilmadi')}
      </Text>
      <Text allowFontScaling={false} style={styles.heroDate} numberOfLines={1} adjustsFontSizeToFit>
        {ok
          ? fmtYm(base!.finishYm)
          : r && r.feasible
            ? t('50 yilda ham yopilmaydi')
            : t('Pul minimal to‘lovlarga ham yetmaydi')}
      </Text>
      {ok ? (
        <Text allowFontScaling={false} style={styles.heroSub}>
          {t('{{n}} oy qoldi', { n: base!.months })}
          {p90 ? `  ·  ${t('90% ehtimol bilan {{date}} dan kechikmaydi', { date: fmtYm(p90) })}` : ''}
        </Text>
      ) : (
        <Text allowFontScaling={false} style={styles.heroSub}>
          {bundle.resultError
            ? bundle.resultError
            : r && r.feasible
              ? t('Oylik to‘lovlar qarzni yopishga yetmaydi. Daromad, xarajat yoki qarz to‘lovlarini tekshiring.')
              : t('Yetishmovchilik oylari pastda ko‘rsatilgan.')}
        </Text>
      )}
      {progress != null ? (
        <View style={styles.heroProgress}>
          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${Math.max(2, progress)}%` }]} />
          </View>
          <Text allowFontScaling={false} style={styles.heroPct}>
            {t('{{p}}% to‘landi', { p: progress })}
          </Text>
        </View>
      ) : null}
      {ok && r ? (
        <Text allowFontScaling={false} style={styles.heroCost}>
          {t('Foiz va kurs farqi: {{amount}}', { amount: fCompact(r.totals.interestAndFx, 'UZS') })}
        </Text>
      ) : null}
    </View>
  );
};

// ─────────── Qoplash ogohlantirishi ───────────
export const CoverageCard = ({ bundle, titleOf }: { bundle: PlanBundle; titleOf: (id: string | null) => string }) => {
  const r = bundle.result;
  if (!r) return null;
  const verdict = r.coverage.verdict;
  const seen = new Set<string>();
  const events: PlanEvent[] = [
    ...(r.scenarios.base?.events || []),
    ...(r.scenarios.conservative?.events || []),
  ].filter(e => {
    const k = `${e.type}|${e.ym}|${e.debtId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (verdict === 'ok' && events.length === 0) return null;
  const danger = verdict === 'infeasible';
  const q = r.coverage.q;
  const title = danger
    ? t('Pul minimal to‘lovlarga ham yetmaydi')
    : verdict === 'tight'
      ? t('Reja tig‘iz')
      : t('Ehtiyot bo‘ling');
  const body = danger
    ? t('Yashash minimumi ajratilgach ham qarzlarning majburiy to‘lovlariga pul yetmaydi. Kreditor bilan muddatni uzaytirishni kelishing — eng kam zarar beradigani: foizsiz, penyasi kichik, yaqin odamdan olingan qarz.')
    : verdict === 'tight'
      ? t('Faqat kafolatlangan daromad bilan majburiy to‘lovlarga yetmaydi (Q = {{q}}). Ehtimoliy daromad kelmagan oyda yashash puli qisqaradi yoki buferdan olinadi. Boshlang‘ich zaxira (bufer) yig‘ish tavsiya etiladi.', {
          q: q == null ? '—' : fPct(q, 2),
        })
      : t('Ehtiyotkor stsenariyda quyidagi oylarda pul yetmasligi mumkin.');
  return (
    <View style={{ marginBottom: rs(4) }}>
      <HelpBox tone={danger ? 'danger' : 'warn'} title={title} text={body} />
      {events.length > 0 ? (
        <Card style={{ marginTop: -rs(4) }}>
          <Text style={styles.cardTitle}>{t('Yetishmovchilik hodisalari')}</Text>
          {events.slice(0, 8).map((e, i) => (
            <View key={`${e.type}${e.ym}${e.debtId}${i}`} style={styles.eventRow}>
              <View style={[styles.eventDot, { backgroundColor: e.type === 'survival_cut' ? DP.warn : DP.danger }]} />
              <Text style={styles.eventText}>{eventText(e, titleOf(e.debtId))}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
};

// ─────────── Shu oy to'lovlari ───────────
export const MonthPayments = ({
  items,
  debtsById,
  paidIds,
  onPay,
}: {
  items: MonthPayment[];
  debtsById: Record<string, PlanDebt>;
  paidIds: Set<string>;
  onPay: (p: MonthPayment) => void;
}) => {
  if (items.length === 0) {
    return (
      <Card>
        <Text style={styles.emptyText}>{t('Bu oy rejada to‘lov yo‘q.')}</Text>
      </Card>
    );
  }
  return (
    <Card style={{ paddingVertical: rs(4) }}>
      {items.map((p, i) => {
        const debt = debtsById[p.debtId];
        const meta = paymentTypeMeta(p.type);
        const paid = p.paid || paidIds.has(p.debtId);
        const saving = p.type === 'saving';
        return (
          <View key={`${p.debtId}_${p.type}_${i}`} style={[styles.payRow, i > 0 && styles.rowBorder]}>
            <View style={styles.dayBox}>
              <Text allowFontScaling={false} style={styles.dayNum}>
                {p.day || '—'}
              </Text>
              <Text allowFontScaling={false} style={styles.dayLbl}>
                {t('kun')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payTitle} numberOfLines={1}>
                {p.isNewDebt ? t('Yangi qarz (yetishmovchilik)') : p.title || debt?.title || '—'}
              </Text>
              <View style={styles.payMeta}>
                <Text allowFontScaling={false} style={styles.payAmount}>
                  {fUzs(p.amount)}
                </Text>
                <Badge text={t(meta.label)} color={meta.color} bg={meta.bg} />
              </View>
              {saving ? <Text style={styles.payHint}>{t('Sanagacha ajratib qo‘ying — qarz sanasida to‘lanadi.')}</Text> : null}
              {p.isNewDebt ? <Text style={styles.payHint}>{t('Pul yetmagan oy: reja bu summani yangi qarz deb hisoblaydi.')}</Text> : null}
            </View>
            {paid ? (
              <View style={styles.paidBox} accessibilityLabel={t('To‘langan')}>
                <CheckCircleIcon size={rs(18)} color={DP.accent} />
                <Text allowFontScaling={false} style={styles.paidText}>
                  {t('To‘langan')}
                </Text>
              </View>
            ) : !saving && debt ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.payBtn}
                onPress={() => onPay(p)}
                accessibilityRole="button"
                accessibilityLabel={`${t('To‘ladim')}: ${p.title || debt.title}`}>
                <Text allowFontScaling={false} style={styles.payBtnText}>
                  {t('To‘ladim')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
};

// ─────────── To'lash tartibi ───────────
export const OrderList = ({
  order,
  debts,
  closed,
  onOpen,
}: {
  order: PlanOrder[];
  debts: PlanDebt[];
  closed: Record<string, string>;
  onOpen: (id: string) => void;
}) => {
  const byId = debtsByKey(debts);
  const inOrder = new Set(order.map(o => o.debtId));
  const rest = debts.filter(d => !inOrder.has(String(d.id)));
  return (
    <>
      {order.map((o, i) => {
        const d = byId[o.debtId];
        if (!d) return null; // sintetik "new_debt_N" navbatda ko'rsatilmaydi
        const pct = d.amount > 0 ? Math.round(((d.amount - d.balance) / d.amount) * 100) : 0;
        const closeYm = closed[String(o.debtId)];
        return (
          <TouchableOpacity
            key={o.debtId}
            activeOpacity={0.85}
            onPress={() => onOpen(o.debtId)}
            accessibilityRole="button"
            style={[styles.orderCard, i === 0 && styles.orderFirst]}>
            <View style={styles.orderHead}>
              <View style={[styles.rank, i === 0 && { backgroundColor: DP.accent }]}>
                <Text allowFontScaling={false} style={[styles.rankText, i === 0 && { color: rd.color.onPrimary }]}>
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle} numberOfLines={1}>
                  {d.title}
                </Text>
                <Text allowFontScaling={false} style={styles.orderKind} numberOfLines={1}>
                  {kindLabel(d.kind)}
                  {o.monthlyRate > 0 ? `  ·  ${t('yillik {{r}}%', { r: fPct(yearlyPct(o.monthlyRate)) })}` : ''}
                </Text>
              </View>
              {i === 0 ? <Badge text={t('Nishon')} color={DP.accentStrong} bg={DP.tint} /> : null}
              <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
            </View>
            <Text style={styles.reason}>{reasonText(o, i + 1)}</Text>
            <View style={styles.orderNums}>
              <Text allowFontScaling={false} style={styles.orderBal}>
                {fCompact(d.balance, d.currency)}
              </Text>
              <Text allowFontScaling={false} style={styles.orderClose}>
                {closeYm ? t('Yopiladi: {{date}}', { date: fmtYm(closeYm) }) : ''}
              </Text>
            </View>
            <ProgressBar pct={pct} color={i === 0 ? DP.accent : '#94a3b8'} height={rs(5)} />
          </TouchableOpacity>
        );
      })}
      {rest.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>{t('Rejadan tashqari')}</Text>
          {rest.map(d => (
            <TouchableOpacity
              key={d.id}
              activeOpacity={0.85}
              onPress={() => onOpen(String(d.id))}
              style={styles.restRow}
              accessibilityRole="button">
              <Text style={styles.restTitle} numberOfLines={1}>
                {d.title}
              </Text>
              <Text allowFontScaling={false} style={styles.restBal}>
                {fCompact(d.balance, d.currency)}
              </Text>
              <ChevronRight size={rs(15)} color={rd.color.textTertiary} />
            </TouchableOpacity>
          ))}
        </Card>
      ) : null}
    </>
  );
};


const styles = StyleSheet.create({
  hero: { borderRadius: rd.radius.xl, overflow: 'hidden', padding: rs(18), marginBottom: rs(12) },
  heroGlow: {
    position: 'absolute',
    width: rs(200),
    height: rs(200),
    borderRadius: rs(100),
    right: -rs(70),
    top: -rs(90),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroKicker: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: 'rgba(255,255,255,0.88)' },
  heroDate: { fontFamily: rd.font.bold, fontSize: rs(30), color: rd.color.onPrimary, marginTop: rs(4) },
  heroSub: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: 'rgba(255,255,255,0.92)', marginTop: rs(6), lineHeight: rs(18) },
  heroProgress: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(14) },
  heroTrack: { flex: 1, height: rs(8), borderRadius: rs(4), backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: rs(4), backgroundColor: rd.color.onPrimary },
  heroPct: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.onPrimary },
  heroCost: { fontFamily: rd.font.regular, fontSize: rs(12), color: 'rgba(255,255,255,0.85)', marginTop: rs(10) },

  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text, marginBottom: rs(6) },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), paddingVertical: rs(5) },
  eventDot: { width: rs(7), height: rs(7), borderRadius: rs(4), marginTop: rs(6) },
  eventText: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, lineHeight: rs(18) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary, textAlign: 'center' },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingVertical: rs(11) },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: rd.color.border },
  dayBox: {
    width: rs(42),
    height: rs(46),
    borderRadius: rs(12),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  dayLbl: { fontFamily: rd.font.medium, fontSize: rs(10), color: rd.color.textTertiary },
  payTitle: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  payMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(4), flexWrap: 'wrap' },
  payAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  payHint: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(4) },
  payBtn: {
    backgroundColor: DP.accent,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(12),
    height: rs(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.onPrimary },
  paidBox: { alignItems: 'center', gap: rs(2) },
  paidText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: DP.accent },

  orderCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(10),
  },
  orderFirst: { borderColor: DP.accent + '66', borderWidth: 1.5 },
  orderHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  rank: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.textSecondary },
  orderTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text },
  orderKind: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  reason: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, lineHeight: rs(18), marginTop: rs(10) },
  orderNums: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: rs(10), marginBottom: rs(7) },
  orderBal: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  orderClose: { fontFamily: rd.font.semibold, fontSize: rs(12), color: DP.accentStrong },

  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    paddingVertical: rs(9),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: rd.color.border,
  },
  restTitle: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textSecondary },
  restBal: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary },
});
