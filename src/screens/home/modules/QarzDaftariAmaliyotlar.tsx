/**
 * QarzDaftariAmaliyotlar.tsx — "Amaliyotlar tarixi" (web mijoz/_id/amaliyotlar.vue).
 *
 * Bitta mijozning barcha tranzaksiyalari (oldi-berdi tarixi):
 *   GET /qarz-daftari/mijozlar/:id/history → mijoz + stats + qarzlar + tranzaksiyalar.
 *
 * Route params: { mijoz_id, turi }.
 *
 * Web rang semantikasi:
 *   berish  = KO'K (chiqim, ArrowUpRight)
 *   olish   = KO'K (kirim, ArrowDownLeft)
 *   qaytarish = YASHIL (qaytarildi, ArrowDownLeft)
 *   voz_kechish = QIZIL (voz kechildi, ClockIcon)
 */
import { useRoute } from '@react-navigation/native';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { sortMoneyText } from '../../components/StatisticCard';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClockIcon,
  UserIcon,
} from '../redesign/icons';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const BLUE = '#2f6fed'; // berish / olish
const GREEN = '#16a34a'; // qaytarish
const RED = '#dc2626'; // voz_kechish
const AMBER = '#f59e0b'; // aktiv

type Turi = 'berish' | 'olish' | 'qaytarish' | 'voz_kechish';

// ---------- Yordamchilar ----------
// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s?: string): string =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// ISO/sana → DD.MM.YYYY HH:mm (pad).
const fmtDateTime = (s?: string): string => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yy} ${hh}:${mi}`;
};

// Tranzaksiya turi → sarlavha yorlig'i.
const TITLE_BY_TURI: Record<Turi, string> = {
  berish: 'Qarz berildi',
  olish: 'Qarz olindi',
  qaytarish: 'Qarz qaytarildi',
  voz_kechish: 'Qarzdan voz kechildi',
};

// Tranzaksiya turi → ikonka + rang.
const iconMeta = (
  turi: Turi,
): { color: string; Icon: (p: any) => React.JSX.Element } => {
  switch (turi) {
    case 'berish':
      return { color: BLUE, Icon: ArrowUpRight };
    case 'olish':
      return { color: BLUE, Icon: ArrowDownLeft };
    case 'qaytarish':
      return { color: GREEN, Icon: ArrowDownLeft };
    case 'voz_kechish':
      return { color: RED, Icon: ClockIcon };
    default:
      return { color: rd.color.textTertiary, Icon: ClockIcon };
  }
};

// Summa rangi (qaytarish yashil, voz_kechish qizil, aks holda default).
const amountColor = (turi: Turi): string => {
  if (turi === 'qaytarish') return GREEN;
  if (turi === 'voz_kechish') return RED;
  return rd.color.text;
};

// ---------- Ekran ----------
const QarzDaftariAmaliyotlar = () => {
  const route = useRoute<any>();
  const mijozId = route.params?.mijoz_id;

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/mijozlar/${mijozId}/history`,
    method: 'GET',
  });

  const d: any = (data as any)?.data || {};
  const mijoz: any = d?.mijoz || {};
  const stats: any = d?.stats || {};
  const tranzaksiyalar: any[] = d?.tranzaksiyalar || [];

  const fish = titleCase(mijoz?.fish);
  const telefon = mijoz?.telefon || '';

  const jamiQarzlar = Number(stats?.jami_qarzlar || 0);
  const aktivQarzlar = Number(stats?.aktiv_qarzlar || 0);

  // created_at bo'yicha kamayish tartibida (eng yangi tepada).
  const sorted = React.useMemo(
    () =>
      [...tranzaksiyalar].sort(
        (a, b) =>
          new Date(b?.created_at || 0).getTime() -
          new Date(a?.created_at || 0).getTime(),
      ),
    [tranzaksiyalar],
  );

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title="Amaliyotlar tarixi" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 1. Mijoz subtitr kartasi */}
        <View style={styles.clientCard}>
          <View style={styles.clientAvatar}>
            <UserIcon size={rs(20)} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName} numberOfLines={1}>
              {fish}
            </Text>
            <Text style={styles.clientPhone} numberOfLines={1}>
              {telefon || '—'}
            </Text>
          </View>
        </View>

        {/* 2. Mini statistikalar */}
        <View style={styles.statGrid}>
          <View style={[styles.statCard, { borderLeftColor: BLUE }]}>
            <Text style={styles.statLabel}>Jami qarzlar</Text>
            <Text style={styles.statValue}>{jamiQarzlar}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: AMBER }]}>
            <Text style={styles.statLabel}>Aktiv</Text>
            <Text style={styles.statValue}>{aktivQarzlar}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: GREEN }]}>
            <Text style={styles.statLabel}>Amaliyotlar</Text>
            <Text style={styles.statValue}>{tranzaksiyalar.length}</Text>
          </View>
        </View>

        {/* 3. Amaliyotlar tarixi */}
        <Text style={styles.blockTitle}>Amaliyotlar tarixi</Text>

        {sorted.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyCircle}>
              <ClockIcon size={rs(24)} color={rd.color.textTertiary} />
            </View>
            <Text style={styles.emptyText}>Hali amaliyotlar yo‘q</Text>
          </View>
        ) : (
          sorted.map((t, i) => {
            const turi: Turi = t?.turi;
            const { color, Icon } = iconMeta(turi);
            const sign = turi === 'qaytarish' || turi === 'voz_kechish' ? '−' : '';
            return (
              <View key={t?.id ?? i} style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: color + '1A' }]}>
                  <Icon size={rs(18)} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {TITLE_BY_TURI[turi] || 'Amaliyot'}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {fmtDateTime(t?.created_at)}
                  </Text>
                </View>
                <Text
                  style={[styles.rowAmount, { color: amountColor(turi) }]}
                  numberOfLines={1}
                >
                  {sign}
                  {sortMoneyText(t?.summa) || 0} {t?.valyuta || 'UZS'}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default QarzDaftariAmaliyotlar;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(12),
  },

  // Mijoz subtitr kartasi
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  clientAvatar: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: BLUE + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  clientPhone: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Statistika grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
  statCard: {
    flexGrow: 1,
    flexBasis: rs(90),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: rd.color.border,
    borderLeftWidth: rs(4),
    padding: rs(12),
  },
  statLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  statValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(19),
    color: rd.color.text,
    marginTop: rs(4),
  },

  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    marginTop: rs(4),
    marginBottom: rs(-4),
  },

  // Amaliyot qatori
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
  rowIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  rowMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  rowAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5) },

  // Empty
  emptyBox: { alignItems: 'center', gap: rs(10), paddingVertical: rs(36) },
  emptyCircle: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    color: rd.color.textTertiary,
  },
});
