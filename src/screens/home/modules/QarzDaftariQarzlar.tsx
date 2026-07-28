/**
 * QarzDaftariQarzlar.tsx — qarzlar ro'yxati (web pages/qarz-daftari/qarzlar.vue).
 *
 * GET /qarz-daftari/qarzlar?turi=&status=  → mijoz bo'yicha guruhlanadi.
 * Har bir guruh (mijoz) qatori → mijoz tafsilotiga o'tadi.
 *
 * Web rang semantikasi: berish = KO'K, olish = YASHIL, muddati o'tgan = QIZIL.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { sortMoneyText } from '../../components/StatisticCard';
import RdHeader from '../redesign/RdHeader';
import { ChevronRight, ClockIcon, SearchIcon, UserIcon } from '../redesign/icons';

const BLUE = '#2f6fed';
const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#f59e0b';

const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

type Group = {
  mijoz_id: any;
  fish: string;
  telefon: string;
  count: number;
  activeCount: number;
  qoldiqUzs: number;
  qoldiqUsd: number;
  lastDate: number;
  hasOverdue: boolean;
  hasActive: boolean;
};

const isOverdue = (q: any) =>
  q?.status === 'aktiv' &&
  !q?.bolib_tolash &&
  q?.qaytarish_sanasi &&
  new Date(q.qaytarish_sanasi) < new Date();

// Modul darajasiga ko'chirildi (faqat Group + rang konstantalari) -> renderItem
// useCallback deps'iga kirmaydi, barqaror bo'ladi.
const statusMeta = (g: Group) =>
  g.hasOverdue
    ? { label: 'Muddati o‘tgan', color: RED }
    : g.hasActive
    ? { label: 'Aktiv', color: AMBER }
    : { label: 'Yopilgan', color: GREEN };

// Satrlar orasidagi 12px oraliq (ilgari ScrollView `gap` bergan edi).
const ListSeparator = () => <View style={{ height: rs(12) }} />;

const QarzDaftariQarzlar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const turi: 'berish' | 'olish' | undefined = route.params?.turi;
  const status: string | undefined = route.params?.status;
  const { t } = useTranslation();

  const qs = [
    turi ? `turi=${turi}` : '',
    status ? `status=${status}` : '',
  ]
    .filter(Boolean)
    .join('&');

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/qarzlar${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });

  const [search, setSearch] = React.useState('');

  const rows: any[] = (data as any)?.data || [];
  const accent = turi === 'olish' ? GREEN : BLUE;

  const title =
    status === 'muddati-otgan'
      ? turi === 'olish'
        ? t('Muddati o‘tgan (olingan)')
        : t('Muddati o‘tgan (berilgan)')
      : turi === 'olish'
      ? t('Olingan qarzlar')
      : t('Berilgan qarzlar');

  // Mijoz bo'yicha guruhlash.
  const groups: Group[] = React.useMemo(() => {
    const map = new Map<any, Group>();
    for (const q of rows) {
      const key = q?.mijoz_id ?? q?.mijoz?.id;
      if (key == null) continue;
      let g = map.get(key);
      if (!g) {
        g = {
          mijoz_id: key,
          fish: titleCase(q?.mijoz?.fish),
          telefon: q?.mijoz?.telefon || '',
          count: 0,
          activeCount: 0,
          qoldiqUzs: 0,
          qoldiqUsd: 0,
          lastDate: 0,
          hasOverdue: false,
          hasActive: false,
        };
        map.set(key, g);
      }
      g.count += 1;
      if (q?.status === 'aktiv') {
        g.activeCount += 1;
        g.hasActive = true;
        if (String(q?.valyuta).toUpperCase() === 'USD') g.qoldiqUsd += Number(q?.qoldiq || 0);
        else g.qoldiqUzs += Number(q?.qoldiq || 0);
      }
      if (isOverdue(q)) g.hasOverdue = true;
      const dt = new Date(q?.berilgan_sana || q?.created_at || 0).getTime();
      if (dt > g.lastDate) g.lastDate = dt;
    }
    return Array.from(map.values()).sort((a, b) => b.lastDate - a.lastDate);
  }, [rows]);

  const filtered = groups.filter(g => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return g.fish.toLowerCase().includes(s) || g.telefon.includes(s);
  });

  // Statistikalar.
  const totalQoldiqUzs = groups.reduce((s, g) => s + g.qoldiqUzs, 0);
  const totalQoldiqUsd = groups.reduce((s, g) => s + g.qoldiqUsd, 0);
  const totalActive = groups.reduce((s, g) => s + g.activeCount, 0);

  // FlatList uchun memoizatsiyalangan qator (ilgari ScrollView + .map edi).
  const renderItem = React.useCallback(
    ({ item: g }: { item: Group }) => {
      const st = statusMeta(g);
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.row}
          onPress={() =>
            navigation.navigate('QarzDaftariMijoz', {
              id: g.mijoz_id,
              turi,
              fish: g.fish,
            })
          }
        >
          <View style={[styles.avatar, { backgroundColor: accent + '1A' }]}>
            <UserIcon size={rs(20)} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName} numberOfLines={1}>
              {g.fish}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {g.telefon || '—'} · {t('{{count}} ta qarz', { count: g.count })}
            </Text>
            <View style={styles.rowAmts}>
              {g.qoldiqUzs > 0 && (
                <Text style={styles.rowAmt}>{sortMoneyText(g.qoldiqUzs) || 0} UZS</Text>
              )}
              {g.qoldiqUsd > 0 && (
                <Text style={[styles.rowAmt, { color: GREEN }]}>
                  {sortMoneyText(g.qoldiqUsd) || 0} USD
                </Text>
              )}
              {g.qoldiqUzs === 0 && g.qoldiqUsd === 0 && (
                <Text style={styles.rowAmtMuted}>{t('Qoldiq yo‘q')}</Text>
              )}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: rs(8) }}>
            <View style={[styles.stPill, { backgroundColor: st.color + '1A' }]}>
              <Text style={[styles.stPillText, { color: st.color }]}>{t(st.label)}</Text>
            </View>
            <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
          </View>
        </TouchableOpacity>
      );
    },
    [accent, turi, navigation, t],
  );

  const keyExtractor = React.useCallback(
    (g: Group, i: number) => String(g?.mijoz_id ?? i),
    [],
  );

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={title} />

      <FlatList
        style={styles.scroll}
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
        ItemSeparatorComponent={ListSeparator}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.statGrid}>
              <View style={[styles.statCard, { borderLeftColor: accent }]}>
                <Text style={styles.statLabel}>{t('Jami qarzlar')}</Text>
                <Text style={styles.statValue}>{rows.length}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: AMBER }]}>
                <Text style={styles.statLabel}>{t('Aktiv qarzlar')}</Text>
                <Text style={styles.statValue}>{totalActive}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: RED }]}>
                <Text style={styles.statLabel}>{t('Jami qoldiq')}</Text>
                <Text style={styles.statValueSm} numberOfLines={1} adjustsFontSizeToFit>
                  {sortMoneyText(totalQoldiqUzs) || 0} UZS
                </Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: GREEN }]}>
                <Text style={styles.statLabel}>{t('Jami qoldiq')}</Text>
                <Text style={styles.statValueSm} numberOfLines={1} adjustsFontSizeToFit>
                  {sortMoneyText(totalQoldiqUsd) || 0} USD
                </Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <SearchIcon size={rs(18)} color={rd.color.textTertiary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('FISH yoki telefon bo‘yicha qidirish...')}
                placeholderTextColor={rd.color.textTertiary}
                style={styles.searchInput}
              />
            </View>
            <Text style={styles.countText}>{t('{{count}} ta mijoz', { count: filtered.length })}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyCircle}>
              <ClockIcon size={rs(24)} color={rd.color.textTertiary} />
            </View>
            <Text style={styles.emptyText}>{t('Qarzlar topilmadi.')}</Text>
          </View>
        }
      />
    </View>
  );
};

export default QarzDaftariQarzlar;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    flexGrow: 1,
  },
  headerWrap: { gap: rs(12), marginBottom: rs(12) },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: rd.color.border,
    borderLeftWidth: rs(4),
    padding: rs(13),
  },
  statLabel: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary },
  statValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(20),
    color: rd.color.text,
    marginTop: rs(4),
  },
  statValueSm: {
    fontFamily: rd.font.bold,
    fontSize: rs(14.5),
    color: rd.color.text,
    marginTop: rs(6),
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    height: rs(48),
  },
  searchInput: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.text,
    padding: 0,
  },
  countText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(-4),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  avatar: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  rowMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  rowAmts: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginTop: rs(5) },
  rowAmt: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text },
  rowAmtMuted: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary },

  stPill: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(9),
    paddingVertical: rs(3),
  },
  stPillText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },

  emptyBox: { alignItems: 'center', gap: rs(10), paddingVertical: rs(36) },
  emptyCircle: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textTertiary },
});
