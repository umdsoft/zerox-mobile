import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { financeApi } from '../../modules/financeApi';
import { fmtDateTimeUz } from '../../../../helper';
import { fmtPhoneUzFull } from '../../../../helper/phone';
import RdHeader from '../../redesign/RdHeader';
import { ChevronLeft, ChevronRight, CloseIcon, SearchIcon } from '../../redesign/icons';

/**
 * SmsManager — "SMS xabarlar ro'yxati".
 *
 * 28.09 (4/5-band): endi "SMS xabarlar tarixi" (SmsHistory) sahifasining
 * pastidagi "Batafsil" tugmasi ochadi (ilgari Tariflar sahifasidan ochilardi va
 * tepasida SMS paket kartalari bor edi — ular SmsHistory'ning tepasiga ko'chdi,
 * qarang: SmsStatsPanel).
 *
 * - Ro'yxat oxirigacha aylantiriladigan emas: 10 tadan SAHIFALANADI
 *   (‹ oldingi · 2 / 13 · keyingi ›). Birinchi sahifada ENG YANGI SMS'lar,
 *   keyingilarida eskilari xronologik tartibda (backend `ORDER BY id DESC`).
 * - Qidiruv: telefon raqami, summa yoki do'kon nomi — backend `q` parametri
 *   SMS matnidan va telefondan izlaydi ("300000" ham "300 000" ni topadi).
 *
 * Manba (saytdagi `components/finance/SmsManager.vue` bilan AYNI):
 *   GET /finance/subscription             → features.sms_history (ruxsat)
 *   GET /finance/subscription/sms-history → ?page&limit&q
 */

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;
const VIOLET = '#6d5ae6';
const VIOLET_TINT = '#efe9fd';

type SmsItem = {
  id?: number | string;
  phone?: string;
  type?: string;
  message?: string;
  sent_at?: string;
  created_at?: string;
};

// sms_history.type ENUM → yorliq + rang.
const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  auto: { label: 'Avtomatik', color: rd.color.primary, bg: rd.color.primaryTint },
  manual: { label: 'Qo‘lda', color: VIOLET, bg: VIOLET_TINT },
  registration: { label: 'Ro‘yxatga olish', color: rd.color.textSecondary, bg: rd.color.surfaceAlt },
  payment_link: { label: 'To‘lov havolasi', color: rd.color.warning, bg: rd.color.warningBg },
  qarz_tolandi: { label: 'Qarz to‘landi', color: rd.color.success, bg: rd.color.successBg },
};

const SmsRow = ({ item }: { item: SmsItem }) => {
  const { t } = useTranslation();
  const meta = TYPE_META[String(item.type || '')];
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text allowFontScaling={false} style={styles.rowDate}>
          {fmtDateTimeUz(item.sent_at || item.created_at) || '—'}
        </Text>
        <View style={[styles.tag, { backgroundColor: meta?.bg || rd.color.surfaceAlt }]}>
          <Text
            allowFontScaling={false}
            style={[styles.tagText, { color: meta?.color || rd.color.textSecondary }]}>
            {meta ? t(meta.label) : item.type || '—'}
          </Text>
        </View>
      </View>
      <Text allowFontScaling={false} style={styles.rowPhone}>
        {item.phone ? fmtPhoneUzFull(item.phone) : '—'}
      </Text>
      {item.message ? (
        <Text allowFontScaling={false} style={styles.rowMsg}>
          {item.message}
        </Text>
      ) : null}
    </View>
  );
};

type PagerProps = {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const Pager = ({ page, totalPages, disabled, onPrev, onNext }: PagerProps) => {
  const { t } = useTranslation();
  const canPrev = !disabled && page > 1;
  const canNext = !disabled && page < totalPages;
  return (
    <View style={styles.pager}>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={!canPrev}
        onPress={onPrev}
        accessibilityRole="button"
        accessibilityLabel={t('Oldingi')}
        accessibilityState={{ disabled: !canPrev }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[styles.pagerBtn, !canPrev && styles.pagerBtnOff]}>
        <ChevronLeft size={rs(16)} color={canPrev ? rd.color.primary : rd.color.textTertiary} />
      </TouchableOpacity>
      <Text allowFontScaling={false} style={styles.pagerText}>
        {`${page} / ${totalPages}`}
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={!canNext}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel={t('Keyingi')}
        accessibilityState={{ disabled: !canNext }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[styles.pagerBtn, !canNext && styles.pagerBtnOff]}>
        <ChevronRight size={rs(16)} color={canNext ? rd.color.primary : rd.color.textTertiary} />
      </TouchableOpacity>
    </View>
  );
};

const SmsManager = () => {
  const { t } = useTranslation();
  const listRef = useRef<FlatList<SmsItem>>(null);
  const reqId = useRef(0);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<SmsItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // 29.09: SMS xabarlar ro'yxati — FAQAT Premium (features.sms_list). Bir marta.
  useEffect(() => {
    let alive = true;
    financeApi
      .getSubscription()
      .then(r => {
        if (alive) setAllowed(!!r?.data?.data?.features?.sms_list);
      })
      .catch(() => {
        // Ruxsatni aniqlab bo'lmasa ro'yxat so'raladi — backend o'zi javob beradi.
        if (alive) setAllowed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Qidiruv matni yozib bo'lingach (debounce) — 1-sahifadan qayta.
  useEffect(() => {
    const id = setTimeout(() => {
      const q = search.trim();
      setQuery(prev => (prev === q ? prev : q));
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async (p: number, q: string) => {
    const my = ++reqId.current;
    setError(false);
    setLoading(true);
    try {
      const res = await financeApi.getSmsHistory(p, PAGE_SIZE, q || undefined);
      if (my !== reqId.current) return;
      const body: any = res?.data || {};
      const list: SmsItem[] = Array.isArray(body.data) ? body.data : [];
      setItems(list);
      setTotal(Number(body?.pagination?.total) || list.length);
      setTotalPages(Math.max(1, Number(body?.pagination?.totalPages) || 1));
    } catch (e: any) {
      if (my !== reqId.current) return;
      // Backend tarif cheklovi (Premium emas) — xato emas, eslatma ko'rsatiladi.
      if (e?.response?.status === 403) setAllowed(false);
      else setError(true);
    } finally {
      if (my === reqId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (allowed) load(page, query);
  }, [allowed, page, query, load]);

  // Sahifa almashganda ro'yxat boshiga qaytiladi.
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page, query]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(page, query);
  }, [load, page, query]);

  const goPrev = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const goNext = useCallback(() => setPage(p => Math.min(totalPages, p + 1)), [totalPages]);

  const renderItem = useCallback(({ item }: { item: SmsItem }) => <SmsRow item={item} />, []);
  const keyExtractor = useCallback(
    (item: SmsItem, index: number) => String(item.id ?? `i${index}`),
    [],
  );

  const searchBox = (
    <View style={styles.searchBox}>
      <SearchIcon size={rs(16)} color={rd.color.textTertiary} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('Telefon, summa yoki do‘kon nomi')}
        placeholderTextColor={rd.color.textTertiary}
        allowFontScaling={false}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel={t('Izlash')}
        style={styles.searchInput}
      />
      {search ? (
        <TouchableOpacity
          onPress={() => setSearch('')}
          accessibilityRole="button"
          accessibilityLabel={t('Tozalash')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <CloseIcon size={rs(15)} color={rd.color.textTertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderBody = () => {
    if (allowed === null) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={rd.color.primary} />
        </View>
      );
    }
    if (!allowed) {
      return (
        <View style={styles.content}>
          <View style={styles.hintBox}>
            <Text allowFontScaling={false} style={styles.hintText}>
              {t(
                'SMS xabarlar ro‘yxati faqat Premium tarifida mavjud. Ushbu imkoniyatdan foydalanish uchun Premium tarifiga o‘ting.',
              )}
            </Text>
          </View>
        </View>
      );
    }
    const header = (
      <View>
        {searchBox}
        {!error ? (
          <Text allowFontScaling={false} style={styles.countText}>
            {query
              ? t('Topildi: {{n}} ta', { n: total })
              : t('Jami: {{n}} ta SMS', { n: total })}
          </Text>
        ) : null}
      </View>
    );
    const empty = loading ? (
      <ActivityIndicator size="small" color={rd.color.primary} style={styles.footer} />
    ) : error ? (
      <View style={styles.errBox}>
        <Text allowFontScaling={false} style={styles.errText}>
          {t('Ma’lumotni yuklab bo‘lmadi. Qayta urinib ko‘ring.')}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => load(page, query)}
          style={styles.retryBtn}>
          <Text allowFontScaling={false} style={styles.retryText}>
            {t('Qayta urinish')}
          </Text>
        </TouchableOpacity>
      </View>
    ) : (
      <Text allowFontScaling={false} style={styles.empty}>
        {query ? t('Hech narsa topilmadi') : t('SMS tarix bo‘sh')}
      </Text>
    );
    return (
      <FlatList
        ref={listRef}
        data={loading || error ? [] : items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          totalPages > 1 && !error ? (
            <Pager
              page={page}
              totalPages={totalPages}
              disabled={loading}
              onPrev={goPrev}
              onNext={goNext}
            />
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('SMS xabarlar ro‘yxati')} />
      {renderBody()}
    </View>
  );
};

export default SmsManager;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(24) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(12),
    height: rs(44),
  },
  searchInput: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.text,
    paddingVertical: 0,
  },
  countText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(10),
    marginBottom: rs(8),
  },
  row: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    marginBottom: rs(8),
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(8),
  },
  rowDate: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary },
  tag: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2) },
  tagText: { fontFamily: rd.font.medium, fontSize: rs(11) },
  rowPhone: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
    marginTop: rs(6),
  },
  rowMsg: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    lineHeight: rs(18),
    color: rd.color.textSecondary,
    marginTop: rs(4),
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(18),
    marginTop: rs(8),
  },
  pagerBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: rd.color.primary,
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerBtnOff: { borderColor: rd.color.border, backgroundColor: rd.color.surfaceAlt },
  pagerText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  empty: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
    marginTop: rs(20),
  },
  footer: { marginVertical: rs(20) },
  hintBox: {
    backgroundColor: rd.color.warningBg,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: '#f5d9a8',
    padding: rs(14),
    marginTop: rs(8),
  },
  hintText: { fontFamily: rd.font.medium, fontSize: rs(13), lineHeight: rs(19), color: '#92400e' },
  errBox: { alignItems: 'center', marginTop: rs(24) },
  errText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    lineHeight: rs(20),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginBottom: rs(16),
  },
  retryBtn: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
  },
  retryText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.onPrimary },
});
