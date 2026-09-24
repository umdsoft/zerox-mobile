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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  ChevronRight,
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

// Satrlar orasidagi 12px oraliq (ilgari ScrollView `gap` bergan edi).
const ListSeparator = () => <View style={{ height: rs(12) }} />;

// SS9-1: statistika kartasi — yuqorida aksent chiziq, ostida UZS va USD.
const StatCard = ({
  accent,
  label,
  uzs,
  usd,
}: {
  accent: string;
  label: string;
  uzs: number;
  usd: number;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statAccent, { backgroundColor: accent }]} />
    <Text style={styles.statLabel} numberOfLines={2}>
      {label}
    </Text>
    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
      {`${sortMoneyText(uzs) || 0} UZS`}
    </Text>
    <Text style={styles.statValueSub} numberOfLines={1} adjustsFontSizeToFit>
      {`${sortMoneyText(usd) || 0} USD`}
    </Text>
  </View>
);

// ---------- Ekran ----------
const QarzDaftariAmaliyotlar = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const mijozId = route.params?.mijoz_id;
  const { t } = useTranslation();

  const { data, loading, onRefresh } = useFetch({
    url: `${URL}/qarz-daftari/mijozlar/${mijozId}/history`,
    method: 'GET',
  });

  // SS6: yangi qarz/tranzaksiya qo'shilgach amaliyotlar tarixi YANGILANSIN.
  // useFetch faqat mount'da yuklaydi -> ekranga qayta fokuslanganda qayta yuklaymiz
  // (birinchi fokus ikki marta yuklamaslik uchun o'tkazib yuboriladi).
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      onRefresh({});
    }, [onRefresh]),
  );

  const d: any = (data as any)?.data || {};
  const mijoz: any = d?.mijoz || {};
  const stats: any = d?.stats || {};
  const tranzaksiyalar: any[] = d?.tranzaksiyalar || [];

  const fish = titleCase(mijoz?.fish);
  const telefon = mijoz?.telefon || '';

  // SS9-2: tranzaksiya -> qarz xaritasi (tafsilot ekraniga uzatish uchun).
  const qarzlar: any[] = d?.qarzlar || [];
  const qarzById = React.useMemo(() => {
    const m: Record<string, any> = {};
    qarzlar.forEach((q: any) => {
      m[String(q?.id)] = q;
    });
    return m;
  }, [qarzlar]);

  // SS9-1 (2026-09-14): 4 ta karta (2x2) va har birida UZS va USD ALOHIDA.
  // Ilgari faqat UZS ko'rsatilardi — dollardagi qarzi bor mijozda kartalar
  // haqiqatni yashirardi. Jami/qoldiq backend `stats` dan (berish+olish
  // jamlanadi — bu ekran mijozning BARCHA amaliyotlarini ko'rsatadi),
  // qaytarilgan va voz kechilgan esa LEDGER'dan aniq hisoblanadi.
  const pick = (o: any, c: 'uzs' | 'usd') => Number(o?.[c] || 0);
  const sumStat = (a: any, b: any, c: 'uzs' | 'usd') => pick(a, c) + pick(b, c);

  const jamiUzs = sumStat(stats?.berilgan, stats?.olingan, 'uzs');
  const jamiUsd = sumStat(stats?.berilgan, stats?.olingan, 'usd');
  const qoldiqUzs = sumStat(stats?.qoldiq_berilgan, stats?.qoldiq_olingan, 'uzs');
  const qoldiqUsd = sumStat(stats?.qoldiq_berilgan, stats?.qoldiq_olingan, 'usd');

  // Ledger bo'yicha valyutaga ajratilgan yig'indi.
  const ledgerSum = (txTuri: string, cur: string) =>
    tranzaksiyalar
      .filter((x: any) => x?.turi === txTuri && String(x?.valyuta || 'UZS') === cur)
      .reduce((acc: number, x: any) => acc + (Number(x?.summa) || 0), 0);

  const qaytarilganUzs = ledgerSum('qaytarish', 'UZS');
  const qaytarilganUsd = ledgerSum('qaytarish', 'USD');
  const vozKechilganUzs = ledgerSum('voz_kechish', 'UZS');
  const vozKechilganUsd = ledgerSum('voz_kechish', 'USD');

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

  // FlatList uchun memoizatsiyalangan qator (barcha yordamchilar module-level -> deps []).
  const renderItem = React.useCallback(({ item: tx }: { item: any }) => {
    const turi: Turi = tx?.turi;
    const { color, Icon } = iconMeta(turi);
    const sign = turi === 'qaytarish' || turi === 'voz_kechish' ? '−' : '';
    return (
      // SS9-2: qator BOSILADIGAN — amaliyot tafsiloti ekrani ochiladi. Tegishli
      // qarz obyekti ham uzatiladi (mahsulot nomi, bo'lib to'lash sharti,
      // sanalar shu yerdan olinadi) -> tafsilot ekranida qo'shimcha so'rov yo'q.
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.row}
        onPress={() =>
          navigation.navigate('QarzDaftariAmaliyot', {
            tx,
            qarz: qarzById[String(tx?.qarz_id)] || null,
            mijoz,
          })
        }>
        <View style={[styles.rowIcon, { backgroundColor: color + '1A' }]}>
          <Icon size={rs(18)} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          {/* SS10-2: "Qarzdan voz kechildi" kabi uzun matn KESILIB qolardi —
              yonidagi summa qisqarmagani uchun. Endi 2 qatorgacha to'liq chiqadi. */}
          <Text style={styles.rowTitle} numberOfLines={2}>
            {t(TITLE_BY_TURI[turi] || 'Amaliyot')}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {fmtDateTime(tx?.created_at)}
            </Text>
            {/* SS6 (2026-09-19): qarz MUDDATLI TO'LOVGA berilgan bo'lsa,
                amaliyot qatorida shu belgi turadi — ilgari bu ma'lumot faqat
                tafsilotga kirgandagina ko'rinardi. */}
            {!!qarzById[String(tx?.qarz_id)]?.bolib_tolash && (
              <View style={styles.instChip}>
                <Text allowFontScaling={false} style={styles.instChipText}>
                  {t('Muddatli to‘lov')}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text
          style={[styles.rowAmount, { color: amountColor(turi) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {sign}
          {sortMoneyText(tx?.summa) || 0} {tx?.valyuta || 'UZS'}
        </Text>
        <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
      </TouchableOpacity>
    );
  }, [t, navigation, qarzById, mijoz]);

  const keyExtractor = React.useCallback(
    (t: any, i: number) => String(t?.id ?? i),
    [],
  );

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Amaliyotlar tarixi')} />

      <FlatList
        style={styles.scroll}
        data={sorted}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={11}
        removeClippedSubviews
        ItemSeparatorComponent={ListSeparator}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
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

            {/* SS9-1: 2x2 katak —
                  Jami qarz     | Qaytarilgan qarz
                  Voz kechilgan | Qoldiq qarz
                Har bir kartada UZS va USD alohida qatorda. */}
            <View style={styles.statGrid}>
              <View style={styles.statRow}>
                <StatCard accent={BLUE} label={t('Jami qarz')} uzs={jamiUzs} usd={jamiUsd} />
                {/* SS-DEV (2026-09-24): qarz daftari (do'kon) kontekstida mijoz
                    to'lagan summa — "Undirilgan qarz"; faqat 'olish' (biz olgan
                    qarz) bo'lsa "Qaytarilgan qarz" (QarzDaftariMijoz bilan bir xil). */}
                <StatCard
                  accent={GREEN}
                  label={
                    route.params?.turi === 'olish'
                      ? t('Qaytarilgan qarz')
                      : t('Undirilgan qarz')
                  }
                  uzs={qaytarilganUzs}
                  usd={qaytarilganUsd}
                />
              </View>
              <View style={styles.statRow}>
                <StatCard
                  accent={RED}
                  label={t('Voz kechilgan qarz')}
                  uzs={vozKechilganUzs}
                  usd={vozKechilganUsd}
                />
                <StatCard
                  accent={AMBER}
                  label={t('Qoldiq qarz')}
                  uzs={qoldiqUzs}
                  usd={qoldiqUsd}
                />
              </View>
            </View>

            {/* 3. Amaliyotlar tarixi sarlavhasi */}
            <Text style={styles.blockTitle}>{t('Amaliyotlar tarixi')}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyCircle}>
              <ClockIcon size={rs(24)} color={rd.color.textTertiary} />
            </View>
            <Text style={styles.emptyText}>{t('Hali amaliyotlar yo‘q')}</Text>
          </View>
        }
      />
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
    flexGrow: 1,
  },
  headerWrap: { gap: rs(12), marginBottom: rs(12) },

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
  // SS8-1: ilgari 3 card YONMA-YON edi — 'Qaytarilgan qarz' 2 qatorga sinib,
  // summalar turli balandlikda qolardi. Endi VERTIKAL qatorlar: sarlavha chapda,
  // summa o‘ngda — sinish yo‘q, shrift hammasida bir xil.
  // SS9-1: 2x2 katak. Har karta ichida aksent chiziq (tepada) + yorliq + UZS + USD.
  statGrid: { gap: rs(8) },
  statRow: { flexDirection: 'row', gap: rs(8) },
  statCard: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(12),
    paddingTop: rs(12),
    paddingBottom: rs(11),
    overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: rs(3),
  },
  statLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11),
    color: rd.color.textSecondary,
    marginBottom: rs(5),
  },
  statValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(13),
    color: rd.color.text,
  },
  statValueSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    marginTop: rs(2),
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
  // SS10-2: sarlavha 2 qatorgacha — lineHeight qo'shildi.
  // SS8-2: summa uzun bo'lganda sana+vaqt kesilib qolardi — shriftlar kichraytirildi
  // SS20 (2026-09-15): summa shrifti katta bo'lgani uchun "Qarzdan voz kechildi"
  // kabi uzun sarlavha va sana yonidagi SOAT:DAQIQA kesilib qolardi. Uch element
  // ham kichraytirildi va summaga `adjustsFontSizeToFit` qo'shildi — endi
  // kartada barcha ma'lumot TO'LIQ ko'rinadi.
  rowTitle: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.text, lineHeight: rs(15) },
  // SS6: sana + "Muddatli to'lov" belgisi bitta qatorda.
  // ⚠️ `flexWrap` SHART: summa uzun bo'lganda (masalan "1 200 000 UZS")
  // chap blokka qoladigan kenglik sana+belgi enidan KICHIK bo'lib qoladi va
  // belgi summaning TAGIGA chiqib ketardi. Endi sig'masa belgi pastki qatorga
  // tushadi — matni esa hech qachon qisqarmaydi.
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(2),
    flexWrap: 'wrap',
  },
  instChip: {
    borderRadius: rd.radius.pill,
    backgroundColor: '#4F46E5' + '14',
    paddingHorizontal: rs(6),
    paddingVertical: rs(1),
    maxWidth: '100%',
  },
  instChipText: { fontFamily: rd.font.semibold, fontSize: rs(9.5), color: '#4F46E5' },
  rowMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(10),
    color: rd.color.textTertiary,
    marginTop: rs(2),
    flexShrink: 1,
  },
  rowAmount: {
    fontFamily: rd.font.bold,
    fontSize: rs(11),
    flexShrink: 0,
    marginLeft: rs(6),
    maxWidth: rs(132),
    textAlign: 'right',
  },

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
