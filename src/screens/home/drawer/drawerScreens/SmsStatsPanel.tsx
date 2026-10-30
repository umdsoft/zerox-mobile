import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { financeApi } from '../../modules/financeApi';
import { CheckCircleIcon, LedgerIcon, MessageIcon, WarningIcon } from '../../redesign/icons';
import { fetchUndeliveredPage } from '../../modules/components/smsDeliveryApi';
import { SMS_SCREEN, smsScreenParams } from '../../modules/components/smsDeliveryFormat';
import { poolLine, PoolPair, toPair, toPools } from './smsPools';

/**
 * SmsStatsPanel — SMS kartalari (Jami SMS / Qoldiq SMS / Sarflangan / Yetkazilmagan)
 * + "Foydalanish darajasi" chizig'i.
 *
 * 30.10: "Jami paket" -> "Jami SMS" (o'rni Qoldiq bilan almashdi), "Ishlatilgan" -> "Sarflangan",
 * "Shu oy" kartasi o'rniga "Yetkazilmagan" (bosilsa — to'liq ro'yxat ekrani).
 * Har bir son tagida (backend `sms.pools` bo'lsa) "Tarif N · Paket M" — joriy tarif va xarid
 * qilingan paket alohida. Eski backend: faqat umumiy sonlar.
 *
 * Manba:
 *   GET /finance/subscription           → sms {total, used, remaining, warning, pools?}
 *   GET /finance/subscription/sms-stats → pools_used?, by_type_pool? (`onStats` orqali sahifaga ham beriladi)
 *   GET /qarz-daftari/sms/undelivered   → "Yetkazilmagan" soni
 *
 * 29.09: obuna javobi (`features.sms_list`) `onSubscription` orqali sahifaga beriladi.
 */

const VIOLET = '#6d5ae6';
const VIOLET_TINT = '#efe9fd';

type SmsBalance = { total: number; used: number; remaining: number; warning: string | null };

const toBalance = (raw: any): SmsBalance => {
  const pools = toPools(raw);
  const total = pools.hasSplit ? pools.plan.total + pools.package.total : Number(raw?.total) || 0;
  const used = pools.hasSplit ? pools.plan.used + pools.package.used : Number(raw?.used) || 0;
  const remaining = pools.hasSplit
    ? pools.plan.remaining + pools.package.remaining
    : Number(raw?.remaining) || 0;
  return { total, used, remaining, warning: raw?.warning || null };
};

const StatCard = ({
  Icon,
  color,
  bg,
  label,
  value,
  valueColor,
  note,
  sub,
  onPress,
}: {
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  color: string;
  bg: string;
  label: string;
  value: number | string;
  valueColor?: string;
  note?: string;
  sub?: string;
  onPress?: () => void;
}) => {
  const body = (
    <>
      <View style={styles.statHead}>
        <View style={[styles.statIcon, { backgroundColor: bg }]}>
          <Icon size={rs(16)} color={color} />
        </View>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.statLabel}>
          {label}
        </Text>
      </View>
      <Text allowFontScaling={false} style={[styles.statValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      {sub ? (
        <Text allowFontScaling={false} numberOfLines={1} style={styles.statSub}>
          {sub}
        </Text>
      ) : null}
      {note ? (
        <Text allowFontScaling={false} style={[styles.statNote, { color: valueColor }]}>
          {note}
        </Text>
      ) : null}
    </>
  );
  return onPress ? (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.statCard}>
      {body}
    </TouchableOpacity>
  ) : (
    <View style={styles.statCard}>{body}</View>
  );
};

/**
 * @param reloadKey o'zgarsa ma'lumot qayta yuklanadi (pastga tortib yangilash).
 * @param onSubscription /finance/subscription javobi (`data`) — muvaffaqiyatli kelganda.
 * @param onStats /finance/subscription/sms-stats javobi (`data`) — kategoriya qatorlari uchun.
 */
const SmsStatsPanel = ({
  reloadKey = 0,
  onSubscription,
  onStats,
}: {
  reloadKey?: number;
  onSubscription?: (data: any) => void;
  onStats?: (data: any) => void;
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<any>(null);
  const [usedPair, setUsedPair] = useState<PoolPair | null>(null);
  const [undelivered, setUndelivered] = useState<number | null>(null);
  // Eng so'nggi callback'lar (effekt ularni dependency qilmasin — har renderda qayta so'rov bo'lmasin).
  const onSubRef = useRef(onSubscription);
  const onStatsRef = useRef(onStats);
  useEffect(() => {
    onSubRef.current = onSubscription;
    onStatsRef.current = onStats;
  }, [onSubscription, onStats]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [subR, statsR, undR] = await Promise.allSettled([
        financeApi.getSubscription(),
        financeApi.getSmsStats(),
        fetchUndeliveredPage(1, null, 1),
      ]);
      if (!alive) return;
      if (subR.status === 'fulfilled') {
        const data = subR.value?.data?.data || {};
        setSub(data.sms || null);
        onSubRef.current?.(data);
      }
      if (statsR.status === 'fulfilled') {
        const stats = statsR.value?.data?.data || {};
        setUsedPair(toPair(stats.pools_used));
        onStatsRef.current?.(stats);
      }
      setUndelivered(undR.status === 'fulfilled' ? undR.value.count : null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={rd.color.primary} />
      </View>
    );
  }

  const sms = toBalance(sub);
  const pools = toPools(sub);
  const labels = { plan: t('Tarif'), package: t('Paket') };
  const totalPair: PoolPair | null = pools.hasSplit
    ? { plan: pools.plan.total, package: pools.package.total }
    : null;
  const remainPair: PoolPair | null = pools.hasSplit
    ? { plan: pools.plan.remaining, package: pools.package.remaining }
    : null;
  const spentPair: PoolPair | null = pools.hasSplit
    ? { plan: pools.plan.used, package: pools.package.used }
    : usedPair;

  const usagePct = sms.total > 0 ? Math.min(100, Math.round((sms.used / sms.total) * 100)) : 0;
  const barColor =
    usagePct > 90 ? rd.color.error : usagePct > 70 ? rd.color.warning : rd.color.primary;
  const warnColor =
    sms.warning === 'empty' ? rd.color.error : sms.warning === 'critical' ? rd.color.warning : undefined;
  const warnText = sms.warning
    ? sms.warning === 'empty'
      ? t('SMS paketingiz tugadi!')
      : t('SMS paketingiz tugamoqda')
    : undefined;

  return (
    <View>
      <View style={styles.grid}>
        <StatCard
          Icon={LedgerIcon}
          color={rd.color.primary}
          bg={rd.color.primaryTint}
          label={t('Jami SMS')}
          value={sms.total}
          sub={poolLine(totalPair, labels)}
        />
        <StatCard
          Icon={MessageIcon}
          color={warnColor || rd.color.success}
          bg={warnColor ? (sms.warning === 'empty' ? rd.color.errorBg : rd.color.warningBg) : rd.color.successBg}
          label={t('Qoldiq SMS')}
          value={sms.remaining}
          valueColor={warnColor}
          note={warnText}
          sub={poolLine(remainPair, labels)}
        />
        <StatCard
          Icon={CheckCircleIcon}
          color={VIOLET}
          bg={VIOLET_TINT}
          label={t('Sarflangan')}
          value={sms.used}
          sub={poolLine(spentPair, labels)}
        />
        <StatCard
          Icon={WarningIcon}
          color={rd.color.error}
          bg={rd.color.errorBg}
          label={t('Yetkazilmagan')}
          value={undelivered ?? '—'}
          sub={t('Joriy davr')}
          onPress={() => navigation.navigate(SMS_SCREEN, smsScreenParams(null))}
        />
      </View>
      {sms.total > 0 ? (
        <View style={styles.usageCard}>
          <View style={styles.usageTop}>
            <Text allowFontScaling={false} style={styles.usageLabel}>
              {t('Foydalanish darajasi')}
            </Text>
            <Text allowFontScaling={false} style={styles.usageValue}>
              {`${sms.used}/${sms.total} (${usagePct}%)`}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${usagePct}%`, backgroundColor: barColor }]} />
          </View>
          {pools.hasSplit ? (
            <View style={styles.poolRows}>
              <Text allowFontScaling={false} style={styles.poolText}>
                {`${labels.plan}: ${pools.plan.used}/${pools.plan.total}`}
              </Text>
              <Text allowFontScaling={false} style={styles.poolText}>
                {`${labels.package}: ${pools.package.used}/${pools.package.total}`}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export default SmsStatsPanel;

const styles = StyleSheet.create({
  loading: { paddingVertical: rs(28), alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48.5%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    marginBottom: rs(10),
  },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(10) },
  statIcon: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  statValue: { fontFamily: rd.font.bold, fontSize: rs(20), color: rd.color.text },
  statSub: { fontFamily: rd.font.regular, fontSize: rs(10.5), color: rd.color.textTertiary, marginTop: rs(2) },
  statNote: { fontFamily: rd.font.medium, fontSize: rs(10.5), marginTop: rs(2) },
  usageCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(16),
  },
  usageTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rs(8) },
  usageLabel: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary },
  usageValue: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  track: {
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: rd.color.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: rs(4) },
  poolRows: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rs(8) },
  poolText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
});
