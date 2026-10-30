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
import RdHeader from '../../redesign/RdHeader';
import { CloseIcon, SearchIcon } from '../../redesign/icons';
import SmsListRow, { SmsItem } from './SmsListRow';

/**
 * SmsManager — "SMS xabarlar ro'yxati".
 *
 * 28.09 (4/5-band): endi "SMS xabarlar tarixi" (SmsHistory) sahifasining
 * pastidagi "Batafsil" tugmasi ochadi (ilgari Tariflar sahifasidan ochilardi va
 * tepasida SMS paket kartalari bor edi — ular SmsHistory'ning tepasiga ko'chdi,
 * qarang: SmsStatsPanel).
 *
 * - 30.10: foydalanuvchi boshlaganidan beri BARCHA SMS'lar — cheklovsiz, pastga aylantirganda
 *   keyingi sahifa (20 tadan) yuklanadi. Eng yangilari tepada (backend `ORDER BY id DESC`).
 * - Qidiruv: telefon raqami, summa yoki do'kon nomi — backend `q` parametri
 *   SMS matnidan va telefondan izlaydi ("300000" ham "300 000" ni topadi).
 *
 * Manba (saytdagi `components/finance/SmsManager.vue` bilan AYNI):
 *   GET /finance/subscription             → features.sms_history (ruxsat)
 *   GET /finance/subscription/sms-history → ?page&limit&q
 */

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

const SmsManager = () => {
  const { t } = useTranslation();
  const listRef = useRef<FlatList<SmsItem>>(null);
  const reqId = useRef(0);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
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
    const append = p > 1;
    setError(false);
    if (append) setMoreLoading(true);
    else setLoading(true);
    try {
      const res = await financeApi.getSmsHistory(p, PAGE_SIZE, q || undefined);
      if (my !== reqId.current) return;
      const body: any = res?.data || {};
      const list: SmsItem[] = Array.isArray(body.data) ? body.data : [];
      // 30.10: sahifalar ketma-ket qo'shiladi (cheklovsiz aylantirish), id bo'yicha takrorsiz.
      setItems(prev => {
        if (!append) return list;
        const seen = new Set(prev.map(x => String(x.id)));
        return [...prev, ...list.filter(x => !seen.has(String(x.id)))];
      });
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
        setMoreLoading(false);
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
  }, [query]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (page === 1) load(1, query);
    else setPage(1); // effekt 1-sahifani qayta yuklaydi
  }, [load, page, query]);

  const onEndReached = useCallback(() => {
    if (loading || moreLoading || error || page >= totalPages) return;
    setPage(p => p + 1);
  }, [loading, moreLoading, error, page, totalPages]);

  const renderItem = useCallback(({ item }: { item: SmsItem }) => <SmsListRow item={item} />, []);
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
          moreLoading ? (
            <ActivityIndicator size="small" color={rd.color.primary} style={styles.footer} />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
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
