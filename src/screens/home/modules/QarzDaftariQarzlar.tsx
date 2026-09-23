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
import { shopQuery } from '../../../store/api/token/qarzShop';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
// SS6 (2026-09-14): stat-cardlarda summa MILLIARDGA yetsa "1,08 B" ko'rinishida
// qisqaradi (aks holda card'ga sig'may qirqilardi); pastroq summalar o'zgarmaydi.
import { billionOrExact } from '../../../helper/money';
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

// Satrlar orasidagi 12px oraliq (ilgari ScrollView `gap` bergan edi).
const ListSeparator = () => <View style={{ height: rs(12) }} />;

const QarzDaftariQarzlar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const turi: 'berish' | 'olish' | undefined = route.params?.turi;
  const status: string | undefined = route.params?.status;
  const { t } = useTranslation();

  // SS17: do'kon endi BOSH SAHIFADA global tanlanadi — ro'yxat o'sha tanlovga
  // bo'ysunadi (backend `faoliyat_id` bo'yicha filtrlaydi). useFetch bog'liqligi
  // URL SATRI bo'lgani uchun do'kon almashsa avtomatik qayta o'qiladi.
  const qs = [
    turi ? `turi=${turi}` : '',
    status ? `status=${status}` : '',
    shopQuery('').replace(/^&/, ''),
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

  // SS17: lokal do'kon ro'yxati/tanlagichi OLIB TASHLANDI — filtrlash endi
  // backendda (global tanlov). Qatorlar to'g'ridan-to'g'ri ishlatiladi.
  const scopedRows = rows;

  const title =
    status === 'muddati-otgan'
      ? turi === 'olish'
        ? t('Muddati o‘tgan (olingan)')
        : t('Muddati o‘tgan (berilgan)')
      : turi === 'olish'
      ? t('Olingan qarzlar')
      : t('Berilgan qarzlar');

  // Mijoz bo'yicha guruhlash (tanlangan do'kon doirasida).
  const groups: Group[] = React.useMemo(() => {
    const map = new Map<any, Group>();
    for (const q of scopedRows) {
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
  }, [scopedRows]);

  const filtered = groups.filter(g => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return g.fish.toLowerCase().includes(s) || g.telefon.includes(s);
  });

  // Statistikalar.
  const totalQoldiqUzs = groups.reduce((s, g) => s + g.qoldiqUzs, 0);
  const totalQoldiqUsd = groups.reduce((s, g) => s + g.qoldiqUsd, 0);

  // SS15-3: "Undirilgan qarz" — mijozlar HAQIQATDA qaytargan summa.
  // ⚠️ `qoldiq` voz kechishda ham kamayadi, ya'ni (miqdor - qoldiq) =
  // (qaytarilgan + voz kechilgan). Shu sabab backend qaytargan `voz_kechilgan`
  // ni AYIRAMIZ — aks holda kechirilgan qarz "undirilgan" bo'lib ko'rinardi.
  const undirilgan = React.useMemo(() => {
    let uzs = 0;
    let usd = 0;
    for (const q of scopedRows) {
      const v = Math.max(
        0,
        (Number(q?.miqdor) || 0) - (Number(q?.qoldiq) || 0) - (Number(q?.voz_kechilgan) || 0),
      );
      if (String(q?.valyuta).toUpperCase() === 'USD') usd += v;
      else uzs += v;
    }
    return { uzs, usd };
  }, [scopedRows]);
  const totalUndirilganUzs = undirilgan.uzs;
  const totalUndirilganUsd = undirilgan.usd;

  // FlatList uchun memoizatsiyalangan qator (ilgari ScrollView + .map edi).
  const renderItem = React.useCallback(
    ({ item: g }: { item: Group }) => {
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
          {/* So'rov: mijoz cardida FAQAT nomi va telefon (summa/holat YO'Q). */}
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName} numberOfLines={1}>
              {g.fish}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {g.telefon || '—'}
            </Text>
          </View>
          <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
        </TouchableOpacity>
      );
    },
    [accent, turi, navigation],
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
            {/* SS17: "Barcha do‘konlar" tanlagich cardi OLIB TASHLANDI — do'kon
                endi BOSH SAHIFADA global tanlanadi va bu ro'yxat o'sha tanlovga
                avtomatik bo'ysunadi (ikki joyda tanlash chalkashtirardi).

                SS15-3: "Jami qoldiq" o'rniga "Qarzga berish" sahifasidan ko'chgan
                IKKI card — "Qoldiq qarz" va "Undirilgan qarz". */}
            <View style={styles.statGrid}>
              <View style={[styles.statCard, { borderLeftColor: AMBER }]}>
                <Text style={styles.statLabel}>{t('Qoldiq qarz')}</Text>
                <Text style={styles.statValueSm} numberOfLines={1} adjustsFontSizeToFit>
                  {billionOrExact(totalQoldiqUzs)} UZS
                </Text>
                <Text style={styles.statValueSub} numberOfLines={1} adjustsFontSizeToFit>
                  {billionOrExact(totalQoldiqUsd)} USD
                </Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: accent }]}>
                {/* Atama YO'NALISHGA bog'liq: BERILGAN qarzda pulni biz undiramiz
                    ("Undirilgan qarz"), OLINGAN qarzda esa biz qaytaramiz —
                    u yerda "Qaytarilgan qarz" to'g'ri (so'rov). */}
                <Text style={styles.statLabel}>
                  {turi === 'olish' ? t('Qaytarilgan qarz') : t('Undirilgan qarz')}
                </Text>
                <Text style={styles.statValueSm} numberOfLines={1} adjustsFontSizeToFit>
                  {billionOrExact(totalUndirilganUzs)} UZS
                </Text>
                <Text style={styles.statValueSub} numberOfLines={1} adjustsFontSizeToFit>
                  {billionOrExact(totalUndirilganUsd)} USD
                </Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <SearchIcon size={rs(18)} color={rd.color.textTertiary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('FISh yoki telefon raqami bo‘yicha qidirish')}
                placeholderTextColor={rd.color.textTertiary}
                // SS2b: multiline -> uzun placeholder 2 qatorda TO'LIQ ko'rinadi
                // ("qidirish" so'zi kesilib qolmasin). searchBox minHeight buni qo'llab-quvvatlaydi.
                multiline
                textAlignVertical="center"
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

      {/* SS17: do‘kon tanlash MODALI OLIB TASHLANDI — do‘kon endi BOSH
          SAHIFADA global tanlanadi (qarzShop), bu ekran o‘sha tanlovga bo‘ysunadi. */}
    </View>
  );
};

export default QarzDaftariQarzlar;

const styles = StyleSheet.create({
  // SS1: do‘kon tanlash modali (QarzDaftariFaoliyat dagi picker bilan bir xil uslub).
  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(22) },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,18,32,0.6)' },
  modalCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(16),
    paddingBottom: rs(14),
    paddingHorizontal: rs(16),
    maxHeight: '70%',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  modalTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  modalClose: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.textTertiary, paddingHorizontal: rs(4) },
  modalList: { flexGrow: 0 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: rs(12), paddingHorizontal: rs(10), borderRadius: rs(12) },
  modalSep: { height: 1, backgroundColor: rd.color.border, marginHorizontal: rs(10) },
  modalRowSelected: { backgroundColor: rd.color.primaryTint },
  modalRowText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
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
  statValueSub: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(2),
  },
  statSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(11),
    color: rd.color.primary,
    marginTop: rs(3),
  },

  // R4: do'kon tanlagich
  dokonWrap: { gap: rs(8) },
  dokonHead: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.text,
    marginBottom: rs(2),
  },
  dokonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingVertical: rs(10),
    paddingHorizontal: rs(12),
  },
  dokonIcon: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dokonName: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  dokonMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
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
    // Qattiq height o'rniga moslashuvchi — 2-qatorli placeholder to'liq sig'adi.
    minHeight: rs(48),
    paddingVertical: rs(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
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
