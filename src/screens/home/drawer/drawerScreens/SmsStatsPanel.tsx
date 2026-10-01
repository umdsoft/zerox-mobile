import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { financeApi } from '../../modules/financeApi';
import { fmtDateTimeUz } from '../../../../helper';
import {
  CalendarIcon,
  CheckCircleIcon,
  LedgerIcon,
  MessageIcon,
} from '../../redesign/icons';

/**
 * SmsStatsPanel — SMS paket kartalari (Qoldiq / Jami paket / Ishlatilgan / Shu oy)
 * + "Foydalanish darajasi" chizig'i.
 *
 * 28.09 (5-band): ilgari faqat "SMS boshqaruvi" (SmsManager) ekranining tepasida
 * edi. Endi "SMS xabarlar tarixi" (SmsHistory) sahifasining ENG TEPASIDA turadi,
 * SMS ro'yxati esa alohida "Batafsil" sahifasiga o'tdi — shu bois bu blok o'z
 * ma'lumotini o'zi yuklaydigan mustaqil komponentga ajratildi.
 *
 * Manba (saytdagi `components/finance/SmsManager.vue` bilan AYNI):
 *   GET /finance/subscription           → sms {total, used, remaining, warning}
 *   GET /finance/subscription/sms-stats → this_month ("Shu oy")
 *
 * 29.09: obuna javobi (tarif imkoniyatlari — `features.sms_list`) `onSubscription` orqali
 * sahifaga ham beriladi — "Batafsil" Premium cheklovi uchun QAYTA so'rov yuborilmaydi.
 */

const VIOLET = '#6d5ae6';
const VIOLET_TINT = '#efe9fd';

type SmsBalance = { total: number; used: number; remaining: number; warning: string | null };
type SentItem = { sent_at?: string; created_at?: string };

const toBalance = (raw: any): SmsBalance => ({
  total: Number(raw?.total) || 0,
  used: Number(raw?.used) || 0,
  remaining: Number(raw?.remaining) || 0,
  warning: raw?.warning || null,
});

// "Shu oy" zaxirasi (sms-stats kelmasa): berilgan ro'yxatdan joriy oy (UTC+5).
const countThisMonth = (items: SentItem[]): number => {
  const ym = fmtDateTimeUz(new Date()).slice(3, 10);
  return items.filter(it => fmtDateTimeUz(it.sent_at || it.created_at).slice(3, 10) === ym)
    .length;
};

const StatCard = ({
  Icon,
  color,
  bg,
  label,
  value,
  valueColor,
  note,
}: {
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  color: string;
  bg: string;
  label: string;
  value: number;
  valueColor?: string;
  note?: string;
}) => (
  <View style={styles.statCard}>
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
    {note ? (
      <Text allowFontScaling={false} style={[styles.statNote, { color: valueColor }]}>
        {note}
      </Text>
    ) : null}
  </View>
);

/**
 * @param fallbackItems "Shu oy" ni sms-stats kelmaganda hisoblash uchun
 *        yuborilgan SMS'lar (sahifada allaqachon yuklangan bo'lsa).
 * @param reloadKey o'zgarsa ma'lumot qayta yuklanadi (pastga tortib yangilash).
 * @param onSubscription /finance/subscription javobi (`data`) — muvaffaqiyatli kelganda.
 */
const SmsStatsPanel = ({
  fallbackItems = [],
  reloadKey = 0,
  onSubscription,
}: {
  fallbackItems?: SentItem[];
  reloadKey?: number;
  onSubscription?: (data: any) => void;
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sms, setSms] = useState<SmsBalance>(toBalance(null));
  const [statsMonth, setStatsMonth] = useState<number | null>(null);
  // Eng so'nggi callback (effekt uni dependency qilmasin — har renderda qayta so'rov bo'lmasin).
  const onSubRef = useRef(onSubscription);
  useEffect(() => {
    onSubRef.current = onSubscription;
  }, [onSubscription]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [subR, statsR] = await Promise.allSettled([
        financeApi.getSubscription(),
        financeApi.getSmsStats(),
      ]);
      if (!alive) return;
      if (subR.status === 'fulfilled') {
        const data = subR.value?.data?.data || {};
        setSms(toBalance(data.sms));
        onSubRef.current?.(data);
      }
      const month = statsR.status === 'fulfilled' ? statsR.value?.data?.data?.this_month : null;
      setStatsMonth(month == null ? null : Number(month) || 0);
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

  const usagePct = sms.total > 0 ? Math.min(100, Math.round((sms.used / sms.total) * 100)) : 0;
  const barColor =
    usagePct > 90 ? rd.color.error : usagePct > 70 ? rd.color.warning : rd.color.primary;
  const thisMonth = statsMonth ?? countThisMonth(fallbackItems);
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
          Icon={MessageIcon}
          color={warnColor || rd.color.success}
          bg={warnColor ? (sms.warning === 'empty' ? rd.color.errorBg : rd.color.warningBg) : rd.color.successBg}
          label={t('Qoldiq SMS')}
          value={sms.remaining}
          valueColor={warnColor}
          note={warnText}
        />
        <StatCard
          Icon={LedgerIcon}
          color={rd.color.primary}
          bg={rd.color.primaryTint}
          label={t('Jami paket')}
          value={sms.total}
        />
        <StatCard
          Icon={CheckCircleIcon}
          color={VIOLET}
          bg={VIOLET_TINT}
          label={t('Ishlatilgan')}
          value={sms.used}
        />
        <StatCard
          Icon={CalendarIcon}
          color={rd.color.warning}
          bg={rd.color.warningBg}
          label={t('Shu oy')}
          value={thisMonth}
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
});
