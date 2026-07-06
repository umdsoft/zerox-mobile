/**
 * QarzDaftariMijozlar.tsx — do'kon + qarz turi bo'yicha mijozlar ro'yxati
 * (web pages/qarz-daftari/faoliyat/_id/berish(olish)/index.vue).
 *
 * GET /qarz-daftari/savdo-faoliyat/:faoliyat_id/mijozlar?turi=  → mijozlar ro'yxati.
 * Har bir mijoz qatori → mijoz tafsilotiga (QarzDaftariMijoz) o'tadi.
 *
 * Web rang semantikasi: berish = KO'K, olish = YASHIL.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { sortMoneyText } from '../../components/StatisticCard';
import RdHeader from '../redesign/RdHeader';
import {
  ChevronRight,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from '../redesign/icons';

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

const QarzDaftariMijozlar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const faoliyat_id = route.params?.faoliyat_id;
  const faoliyat_nomi: string | undefined = route.params?.faoliyat_nomi;
  const turi: 'berish' | 'olish' = route.params?.turi === 'olish' ? 'olish' : 'berish';

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/savdo-faoliyat/${faoliyat_id}/mijozlar?turi=${turi}`,
    method: 'GET',
  });

  const [search, setSearch] = React.useState('');

  const list: any[] = (data as any)?.data || [];
  const accent = turi === 'olish' ? GREEN : BLUE;
  const title = turi === 'olish' ? 'Qarzga olish' : 'Qarzga berish';

  // Statistikalar.
  const totalActive = list.reduce((s, c) => s + Number(c?.aktiv_qarz_soni || 0), 0);
  const totalQoldiqUzs = list.reduce((s, c) => s + Number(c?.qoldiq_uzs || 0), 0);
  const totalQoldiqUsd = list.reduce((s, c) => s + Number(c?.qoldiq_usd || 0), 0);

  const filtered = list.filter(c => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      String(c?.fish || '').toLowerCase().includes(s) ||
      String(c?.telefon || '').includes(s)
    );
  });

  const onYangiMijoz = () =>
    Toast.show({
      type: 'info',
      props: { title: 'Tez kunda', desc: 'Yangi mijoz qo‘shish tez orada' },
    });

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={title} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Do'kon nomi */}
        {!!faoliyat_nomi && (
          <Text style={styles.shopChip} numberOfLines={1}>
            {faoliyat_nomi}
          </Text>
        )}

        {/* Statistikalar */}
        <View style={styles.statGrid}>
          <View style={[styles.statCard, { borderLeftColor: accent }]}>
            <Text style={styles.statLabel}>Jami mijozlar</Text>
            <Text style={styles.statValue}>{list.length}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: AMBER }]}>
            <Text style={styles.statLabel}>Aktiv qarzlar</Text>
            <Text style={styles.statValue}>{totalActive}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: RED }]}>
            <Text style={styles.statLabel}>Jami qoldiq</Text>
            <Text style={styles.statValueSm} numberOfLines={1} adjustsFontSizeToFit>
              {sortMoneyText(totalQoldiqUzs) || 0} UZS
            </Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: GREEN }]}>
            <Text style={styles.statLabel}>Jami qoldiq</Text>
            <Text style={styles.statValueSm} numberOfLines={1} adjustsFontSizeToFit>
              {sortMoneyText(totalQoldiqUsd) || 0} USD
            </Text>
          </View>
        </View>

        {/* Yangi mijoz */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.newBtn, { backgroundColor: accent }]}
          onPress={onYangiMijoz}
        >
          <PlusIcon size={rs(18)} color="#fff" />
          <Text style={styles.newBtnText}>Yangi mijoz</Text>
        </TouchableOpacity>

        {/* Qidiruv */}
        <View style={styles.searchBox}>
          <SearchIcon size={rs(18)} color={rd.color.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="FISH yoki telefon bo‘yicha qidirish..."
            placeholderTextColor={rd.color.textTertiary}
            style={styles.searchInput}
          />
        </View>
        <Text style={styles.countText}>{filtered.length} ta mijoz</Text>

        {/* Ro'yxat */}
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyCircle}>
              <UserIcon size={rs(24)} color={rd.color.textTertiary} />
            </View>
            <Text style={styles.emptyText}>Mijozlar hali qo‘shilmagan.</Text>
          </View>
        ) : (
          filtered.map((c, i) => {
            const fish = titleCase(c?.fish);
            const qoldiqUzs = Number(c?.qoldiq_uzs || 0);
            const qoldiqUsd = Number(c?.qoldiq_usd || 0);
            const active = Number(c?.aktiv_qarz_soni || 0) > 0;
            const st = active
              ? { label: 'Aktiv', color: AMBER }
              : { label: 'Qarzsiz', color: rd.color.textTertiary };
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                style={styles.row}
                onPress={() =>
                  navigation.navigate('QarzDaftariMijoz', {
                    id: c.id,
                    turi,
                    fish,
                  })
                }
              >
                <View style={[styles.avatar, { backgroundColor: accent + '1A' }]}>
                  <UserIcon size={rs(20)} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {fish}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {c?.telefon || '—'} · {Number(c?.qarz_soni || 0)} ta qarz
                  </Text>
                  <View style={styles.rowAmts}>
                    {qoldiqUzs > 0 && (
                      <Text style={styles.rowAmt}>{sortMoneyText(qoldiqUzs) || 0} UZS</Text>
                    )}
                    {qoldiqUsd > 0 && (
                      <Text style={[styles.rowAmt, { color: GREEN }]}>
                        {sortMoneyText(qoldiqUsd) || 0} USD
                      </Text>
                    )}
                    {qoldiqUzs === 0 && qoldiqUsd === 0 && (
                      <Text style={styles.rowAmtMuted}>Qoldiq yo‘q</Text>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: rs(8) }}>
                  <View style={[styles.stPill, { backgroundColor: st.color + '1A' }]}>
                    <Text style={[styles.stPillText, { color: st.color }]}>
                      {st.label}
                    </Text>
                  </View>
                  <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default QarzDaftariMijozlar;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(12),
  },

  shopChip: {
    alignSelf: 'flex-start',
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
  },

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

  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    borderRadius: rd.radius.pill,
    paddingVertical: rs(14),
  },
  newBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },

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
