import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { URL } from '../../../constants';
import { useFetch } from '../../../../hooks/useFetch';
import { settingDate } from '../../../other/UserDetails';
import RdHeader from '../../redesign/RdHeader';
import {
  BellIcon,
  CheckIcon,
  ChevronRight,
  ClockIcon,
  PlusIcon,
} from '../../redesign/icons';

/**
 * SmsHistory — "SMS xabarlar tarixi" (saytdagi kabi).
 *
 * Yuborilgan SMS xabarlar KATEGORIYA bo'yicha guruhlanadi; kategoriya ustiga
 * bosilganda ichidagi xabarlar (telefon + sana) ochiladi. Jami yuborilgan pastda.
 *
 * Ma'lumot manbai: /qarz-daftari/sms-history (backend qo'shsa — avtomatik to'ladi).
 * Hozircha bu endpoint mobil serverda yo'q — shu bois bo'sh holat chiroyli
 * ko'rsatiladi (soxta ma'lumot chiqarilmaydi).
 */

// Kategoriyalar (saytdagi turlar) — turi -> yorliq + ikona + rang.
const CATEGORIES = [
  { key: 'register', label: 'Ro‘yxatga olingan qarz uchun', Icon: PlusIcon, color: rd.color.primary, bg: rd.color.primaryTint },
  { key: 'due', label: 'Muddati kelgan qarzdorlik yuzasidan xabarnoma', Icon: ClockIcon, color: rd.color.warning, bg: rd.color.warningBg },
  { key: 'demand', label: 'Qaytarishni talab qilish yuzasidan xabarnoma', Icon: BellIcon, color: rd.color.error, bg: rd.color.errorBg },
  { key: 'paid', label: 'Qarz to‘langanligi to‘g‘risida xabarnoma', Icon: CheckIcon, color: rd.color.success, bg: rd.color.successBg },
];

// Backend turi (raqam/kalit) -> bizning kategoriya kaliti. Backend qo'shilganда
// bu moslashtirish yangilanadi.
const mapType = (t: any): string => {
  const s = String(t ?? '').toLowerCase();
  if (s.includes('register') || s === '1') return 'register';
  if (s.includes('due') || s.includes('muddat') || s === '2') return 'due';
  if (s.includes('demand') || s.includes('talab') || s === '3') return 'demand';
  if (s.includes('paid') || s.includes('tolan') || s === '4') return 'paid';
  return 'register';
};

const SmsHistory = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);

  // Nomzod endpoint — bo'lmasa jimgina bo'sh massiv (crash yo'q).
  const res = useFetch({ method: 'GET', url: URL + '/qarz-daftari/sms-history' });
  const rawItems: any[] = useMemo(() => {
    const d: any = (res.data as any)?.data ?? res.data;
    return Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [];
  }, [res.data]);

  // Kategoriya bo'yicha guruhlash.
  const grouped = useMemo(() => {
    const g: Record<string, any[]> = { register: [], due: [], demand: [], paid: [] };
    rawItems.forEach(it => {
      const k = mapType(it?.type ?? it?.category);
      (g[k] || (g[k] = [])).push(it);
    });
    return g;
  }, [rawItems]);

  const total = rawItems.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('SMS xabarlar tarixi')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Text allowFontScaling={false} style={styles.subtitle}>
          {t('Yuborilgan SMS xabarlar kategoriyalar bo‘yicha')}
        </Text>

        {CATEGORIES.map(cat => {
          const items = grouped[cat.key] || [];
          const isOpen = open === cat.key;
          return (
            <View key={cat.key} style={styles.catCard}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setOpen(isOpen ? null : cat.key)}
                style={styles.catHead}>
                <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
                  <cat.Icon size={rs(16)} color={cat.color} />
                </View>
                <Text allowFontScaling={false} numberOfLines={2} style={styles.catLabel}>
                  {t(cat.label)}
                </Text>
                <View style={styles.catCountWrap}>
                  <Text allowFontScaling={false} style={styles.catCount}>
                    {items.length}
                  </Text>
                  <View style={isOpen ? styles.chevDown : undefined}>
                    <ChevronRight
                      size={rs(16)}
                      color={rd.color.textTertiary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {isOpen ? (
                items.length ? (
                  <View style={styles.catBody}>
                    {items.map((it, i) => (
                      <View key={i} style={styles.smsRow}>
                        <Text allowFontScaling={false} style={styles.smsPhone}>
                          {it?.phone || it?.number || '—'}
                        </Text>
                        <Text allowFontScaling={false} style={styles.smsDate}>
                          {it?.created_at ? settingDate(it.created_at) : it?.date || ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.catBody}>
                    <Text allowFontScaling={false} style={styles.emptyRow}>
                      {t('Bu kategoriyada xabar yo‘q')}
                    </Text>
                  </View>
                )
              ) : null}
            </View>
          );
        })}

        {/* Jami yuborilgan (quyuq panel — saytdagidek). */}
        <View style={styles.totalBar}>
          <Text allowFontScaling={false} style={styles.totalBarLabel}>
            {t('JAMI YUBORILGAN')}
          </Text>
          <Text allowFontScaling={false} style={styles.totalBarValue}>
            {total}
          </Text>
        </View>

        {!res.loading && total === 0 ? (
          <Text allowFontScaling={false} style={styles.note}>
            {t('SMS xabarlar tarixi hozircha bo‘sh.')}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default SmsHistory;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(24) },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    marginBottom: rs(12),
  },
  catCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginBottom: rs(10),
    overflow: 'hidden',
  },
  catHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(12),
    gap: rs(10),
  },
  catIcon: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.text,
  },
  catCountWrap: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  catCount: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  chevDown: { transform: [{ rotate: '90deg' }] },
  catBody: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    paddingHorizontal: rs(12),
    paddingVertical: rs(4),
  },
  smsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(10),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  smsPhone: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.text,
  },
  smsDate: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  emptyRow: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    paddingVertical: rs(12),
    textAlign: 'center',
  },
  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: rd.color.text,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    marginTop: rs(6),
  },
  totalBarLabel: {
    fontFamily: rd.font.bold,
    fontSize: rs(12.5),
    color: rd.color.onPrimary,
    letterSpacing: 0.5,
  },
  totalBarValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
  note: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
    marginTop: rs(20),
  },
});
