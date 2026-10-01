import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { rd, rs } from '../../../../theme/rd';
import { URL } from '../../../constants';
import { useFetch } from '../../../../hooks/useFetch';
import { fmtDateTimeUz } from '../../../../helper';
import RdHeader from '../../redesign/RdHeader';
import SmsStatsPanel from './SmsStatsPanel';
import PlanLimitModal from './PlanLimitModal';
import {
  BellIcon,
  CheckIcon,
  ChevronRight,
  ClockIcon,
  LockIcon,
  MessageIcon,
  PlusIcon,
} from '../../redesign/icons';

/**
 * SmsHistory — "SMS xabarlar tarixi" (saytdagi kabi).
 *
 * Yuborilgan SMS xabarlar KATEGORIYA bo'yicha guruhlanadi; kategoriya ustiga
 * bosilganda ichidagi xabarlar (telefon + sana) ochiladi. Jami yuborilgan pastda.
 *
 * 28.09 (4/5-band) — sahifa tartibi:
 *   1) TEPADA SMS paket kartalari (Qoldiq / Jami paket / Ishlatilgan / Shu oy) +
 *      "Foydalanish" chizig'i (SmsStatsPanel) — ilgari "SMS boshqaruvi"da edi;
 *   2) kategoriyalar + "Jami yuborilgan" (avvalgi mazmun, pastga tushdi);
 *   3) ENG PASTDA "SMS xabarlar ro'yxati" + "Batafsil" → SmsManager (qidiruv,
 *      10 tadan sahifalash). "Batafsil" Tariflar sahifasidan shu yerga ko'chdi.
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

// Backend `sms_history.type` -> mobil kategoriya kaliti.
// Server turlari: 'registration' (ro'yxatga olish), 'auto' (muddati kelgan avtomatik
// eslatma), 'manual'/'payment_link' (qo'lda/talab), 'qarz_tolandi' (to'landi).
const mapType = (t: any): string => {
  const s = String(t ?? '').toLowerCase();
  if (s === 'registration' || s.includes('register') || s === '1') return 'register';
  if (s === 'auto' || s.includes('due') || s.includes('muddat') || s === '2') return 'due';
  if (s === 'manual' || s === 'payment_link' || s.includes('demand') || s.includes('talab') || s === '3')
    return 'demand';
  if (s === 'qarz_tolandi' || s.includes('paid') || s.includes('tolan') || s === '4') return 'paid';
  return 'register';
};

// Sana + SOAT (DD.MM.YYYY HH:MM) — Uzbek vaqti (+5). 27.09: umumiy helper'ga
// ko'chirildi (SmsManager ham ishlatadi).
const dateTime = fmtDateTimeUz;

const SmsHistory = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [open, setOpen] = useState<string | null>(null);

  // Backend endpoint (deploy qilingan) — SMS bo'lmasa bo'sh massiv (crash yo'q).
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

  /**
   * 29.09 (2-band): kategoriya sonlari — backend `counts` (turi bo'yicha, FAQAT yuborilgan
   * SMS'lar, 1000 ta cheklovsiz). Shu bilan kategoriyalar yig'indisi "Ishlatilgan" kartasi
   * (paketdan yechilgan SMS) bilan AYNAN teng bo'ladi. Eski backend (counts yo'q) —
   * ro'yxat uzunligi.
   */
  const catCounts = useMemo(() => {
    const counts: any = (res.data as any)?.counts;
    if (!counts || typeof counts !== 'object') return null;
    const c: Record<string, number> = { register: 0, due: 0, demand: 0, paid: 0 };
    Object.keys(counts).forEach(type => {
      const k = mapType(type);
      c[k] = (c[k] || 0) + (Number(counts[type]) || 0);
    });
    return c;
  }, [res.data]);
  const countOf = (key: string) => catCounts?.[key] ?? (grouped[key] || []).length;
  const total = catCounts
    ? Object.values(catCounts).reduce((a, b) => a + b, 0)
    : rawItems.length;

  /**
   * 29.09 (2-band): "Batafsil" (SMS xabarlar ro'yxati) — FAQAT Premium. Tarif
   * imkoniyatlari SmsStatsPanel yuklagan /finance/subscription javobidan olinadi.
   * Noma'lum (javob kelmagan) bo'lsa — sahifa ochiladi, cheklovni u yerda backend
   * (403) va SmsManager ko'rsatadi.
   */
  const [canList, setCanList] = useState<boolean | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const onSubscription = useCallback((data: any) => {
    setCanList(!!data?.features?.sms_list);
  }, []);
  const openList = () => {
    if (canList === false) {
      setLimitOpen(true);
      return;
    }
    navigation.navigate('SmsManager');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('SMS xabarlar tarixi')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* 28.09 (5-band): SMS paket kartalari — sahifaning ENG TEPASIDA. */}
        <SmsStatsPanel fallbackItems={rawItems} onSubscription={onSubscription} />

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
                    {countOf(cat.key)}
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
                          {dateTime(it?.sent_at || it?.created_at) || it?.date || ''}
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

        {/* 29.09 (2-band): "Jami yuborilgan" kartasi OLIB TASHLANDI (so'rov) — jami
            son "Ishlatilgan" kartasida. */}

        {/* 28.09 (4/5-band): SMS ro'yxati alohida sahifada — "Batafsil" bosilganda. */}
        <View style={styles.listCard}>
          <View style={styles.listCardLeft}>
            <View style={[styles.catIcon, { backgroundColor: rd.color.primaryTint }]}>
              <MessageIcon size={rs(16)} color={rd.color.primary} />
            </View>
            <Text allowFontScaling={false} numberOfLines={2} style={styles.catLabel}>
              {t('SMS xabarlar ro‘yxati')}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openList}
            accessibilityRole="button"
            style={styles.detailsBtn}>
            <Text allowFontScaling={false} style={styles.detailsText}>
              {t('Batafsil')}
            </Text>
            {canList === false ? (
              <LockIcon size={rs(13)} color={rd.color.onPrimary} />
            ) : (
              <ChevronRight size={rs(13)} color={rd.color.onPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {!res.loading && total === 0 ? (
          <Text allowFontScaling={false} style={styles.note}>
            {t('SMS xabarlar tarixi hozircha bo‘sh.')}
          </Text>
        ) : null}
      </ScrollView>

      <PlanLimitModal
        visible={limitOpen}
        message={t(
          'SMS xabarlar ro‘yxati faqat Premium tarifida mavjud. Ushbu imkoniyatdan foydalanish uchun Premium tarifiga o‘ting.',
        )}
        onClose={() => setLimitOpen(false)}
        onUpgrade={() => {
          setLimitOpen(false);
          navigation.navigate('Types');
        }}
      />
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
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    marginTop: rs(12),
  },
  listCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.sm,
    paddingHorizontal: rs(12),
    paddingVertical: rs(7),
  },
  detailsText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
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
