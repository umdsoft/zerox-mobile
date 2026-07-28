/**
 * QarzDaftariMijoz.tsx — "Mijoz tafsiloti" (web pages/qarz-daftari/mijoz/_id/index.vue).
 *
 * Bitta mijozning qarz oldi-berdi tafsiloti:
 *   GET /qarz-daftari/mijozlar/:id/history → mijoz + stats + qarzlar + tranzaksiyalar.
 *
 * Route params: { id, turi, fish }. accent = turi==='olish' ? YASHIL : KO'K.
 *
 * Web rang semantikasi: berish/berilgan = KO'K, olish/olingan = YASHIL, muddati o'tgan = QIZIL.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
  ClockIcon,
  CoinIcon,
  IconProps,
  PhoneIcon,
  PlusIcon,
  UserIcon,
} from '../redesign/icons';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const BLUE = '#2f6fed'; // berish / berilgan
const GREEN = '#16a34a'; // olish / olingan
const RED = '#dc2626'; // muddati o'tgan
const AMBER = '#f59e0b'; // aktiv

// ---------- Yordamchilar ----------
const uzsText = (n: number) => `${sortMoneyText(n) || 0} UZS`;

// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// ISO/sana → DD.MM.YYYY (pad).
const fmtDate = (s?: string): string => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
};

// Aktiv, bo'lib to'lash emas va qaytarish sanasi o'tgan bo'lsa — muddati o'tgan.
const isOverdue = (q: any): boolean =>
  q?.status === 'aktiv' &&
  !q?.bolib_tolash &&
  q?.qaytarish_sanasi &&
  new Date(q.qaytarish_sanasi) < new Date();

// ---------- Kichik komponentlar ----------
const CircleIcon = ({
  size,
  bg,
  children,
}: {
  size: number;
  bg: string;
  children: React.ReactNode;
}) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </View>
);

// Statistika summasi kartasi (yuqorida aksent chiziq) — DebtSumCard uslubi.
const SumCard = ({
  accent,
  label,
  value,
}: {
  accent: string;
  label: string;
  value: string;
}) => (
  <View style={styles.sumCard}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <Text style={styles.sumLabel} numberOfLines={2}>
      {label}
    </Text>
    <Text style={styles.sumValue} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
  </View>
);

// Qarz qatori kartasi.
const QarzRow = ({
  accent,
  title,
  meta,
  amount,
  pill,
  pillColor,
  onPress,
}: {
  accent: string;
  title: string;
  meta: string;
  amount: string;
  pill: string;
  pillColor: string;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} style={styles.qRow} onPress={onPress}>
    <CircleIcon size={rs(38)} bg={accent + '1A'}>
      <CoinIcon size={rs(18)} color={accent} />
    </CircleIcon>
    <View style={{ flex: 1 }}>
      <Text style={styles.qTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.qMeta} numberOfLines={1}>
        {meta}
      </Text>
      <View style={[styles.pill, { backgroundColor: pillColor + '1A', marginTop: rs(6) }]}>
        <Text style={[styles.pillText, { color: pillColor }]} numberOfLines={1}>
          {pill}
        </Text>
      </View>
    </View>
    <View style={styles.qRight}>
      <Text style={styles.qAmount} numberOfLines={1}>
        {amount}
      </Text>
      <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
    </View>
  </TouchableOpacity>
);

// ---------- Ekran ----------
const QarzDaftariMijoz = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const id = route.params?.id;
  const turi: 'berish' | 'olish' = route.params?.turi === 'olish' ? 'olish' : 'berish';
  const fishParam: string = route.params?.fish || '';

  const accent = turi === 'olish' ? GREEN : BLUE;
  const accentBg = turi === 'olish' ? '#F0FDF4' : '#EFF6FF';

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/mijozlar/${id}/history`,
    method: 'GET',
  });

  const d: any = (data as any)?.data || {};
  const mijoz: any = d?.mijoz || {};
  const stats: any = d?.stats || {};
  const qarzlar: any[] = d?.qarzlar || [];

  const fish = titleCase(mijoz?.fish || fishParam);
  const telefon = mijoz?.telefon || '';

  const aktivQarzlar = Number(stats?.aktiv_qarzlar || 0);
  const jamiQarzlar = Number(stats?.jami_qarzlar || 0);

  // Jami qarz (qoldiq) — turi bo'yicha.
  const qoldiq: any =
    turi === 'olish' ? stats?.qoldiq_olingan || {} : stats?.qoldiq_berilgan || {};
  const qoldiqUzs = Number(qoldiq?.uzs || 0);
  const qoldiqUsd = Number(qoldiq?.usd || 0);

  // Rol va holat.
  const role =
    turi === 'olish'
      ? { label: t('Qarz beruvchi'), color: GREEN }
      : { label: t('Qarz oluvchi'), color: BLUE };
  const statusPill =
    aktivQarzlar > 0
      ? { label: t('Aktiv'), color: AMBER }
      : { label: t('Barchasi yopilgan'), color: GREEN };

  // Faqat shu turdagi qarzlar.
  const visibleQarzlar = qarzlar.filter(q => q?.turi === turi);

  // Qarz holat pilli.
  const qarzStatus = (q: any): { label: string; color: string } => {
    if (isOverdue(q)) return { label: t('Muddati o‘tgan'), color: RED };
    if (q?.status === 'aktiv') return { label: t('Aktiv'), color: AMBER };
    if (q?.status === 'yopilgan') return { label: t('Yopilgan'), color: GREEN };
    if (q?.status === 'voz_kechilgan')
      return { label: t('Voz kechilgan'), color: rd.color.textTertiary };
    return { label: t('Aktiv'), color: AMBER };
  };

  const qarzMeta = (q: any): string => {
    const base = fmtDate(q?.berilgan_sana);
    if (q?.bolib_tolash) {
      return `${base} · ${t('Bo‘lib to‘lash {{oy}} oy', { oy: q?.oylar_soni || 0 })}`;
    }
    if (q?.qaytarish_sanasi) {
      return `${base} · ${fmtDate(q?.qaytarish_sanasi)}`;
    }
    return base;
  };

  const goYangi = () => {
    if (!mijoz?.savdo_faoliyat_id || !mijoz?.id) {
      Toast.show({ type: 'error', text1: t('Mijoz ma’lumotlari topilmadi') });
      return;
    }
    navigation.navigate('QarzDaftariYangi', {
      faoliyat_id: mijoz.savdo_faoliyat_id,
      mijoz_id: mijoz.id,
      fish,
      turi,
    });
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Qarz tafsiloti')} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 1. Mijoz kartasi */}
        <View style={styles.card}>
          <View style={styles.clientHead}>
            <CircleIcon size={rs(52)} bg={accentBg}>
              <UserIcon size={rs(26)} color={accent} />
            </CircleIcon>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={2}>
                {fish}
              </Text>
              <View style={[styles.pill, { backgroundColor: role.color + '1A', marginTop: rs(6) }]}>
                <Text style={[styles.pillText, { color: role.color }]} numberOfLines={1}>
                  {role.label}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.clientDivider} />

          <View style={styles.clientRow}>
            <PhoneIcon size={rs(16)} color={rd.color.textTertiary} />
            <Text style={styles.clientPhone} numberOfLines={1}>
              {telefon || '—'}
            </Text>
            <View style={[styles.pill, { backgroundColor: statusPill.color + '1A' }]}>
              <Text style={[styles.pillText, { color: statusPill.color }]} numberOfLines={1}>
                {statusPill.label}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Statistikalar (2x2) */}
        <View style={styles.sumGrid}>
          <SumCard accent={accent} label={t('Jami qarz (UZS)')} value={uzsText(qoldiqUzs)} />
          <SumCard
            accent={GREEN}
            label={t('Jami qarz (USD)')}
            value={`${sortMoneyText(qoldiqUsd) || 0} USD`}
          />
          <SumCard accent={BLUE} label={t('Jami qarzlar')} value={String(jamiQarzlar)} />
          <SumCard accent={AMBER} label={t('Aktiv qarzlar')} value={String(aktivQarzlar)} />
        </View>

        {/* 3. Qarzlar */}
        <Text style={styles.blockTitle}>{t('Qarzlar')}</Text>
        {visibleQarzlar.length === 0 ? (
          <View style={styles.emptyBox}>
            <CircleIcon size={rs(56)} bg={rd.color.surfaceAlt}>
              <ClockIcon size={rs(24)} color={rd.color.textTertiary} />
            </CircleIcon>
            <Text style={styles.emptyText}>{t('Qarzlar yo‘q')}</Text>
          </View>
        ) : (
          visibleQarzlar.map((q, i) => {
            const st = qarzStatus(q);
            return (
              <QarzRow
                key={q?.id ?? i}
                accent={accent}
                title={q?.mahsulot_nomi || t('Qarz')}
                meta={qarzMeta(q)}
                amount={`${sortMoneyText(q?.qoldiq) || 0} ${q?.valyuta || 'UZS'}`}
                pill={st.label}
                pillColor={st.color}
                onPress={() =>
                  navigation.navigate('QarzDaftariQarz', { id: q?.id })
                }
              />
            );
          })
        )}

        {/* 4. Yangi qarz qo'shish */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.addBtn, { backgroundColor: accent }]}
          onPress={goYangi}
        >
          <PlusIcon size={rs(18)} color={rd.color.onPrimary} />
          <Text style={styles.addBtnText}>{t('Yangi qarz qo‘shish')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default QarzDaftariMijoz;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(14),
  },

  blockTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    marginTop: rs(4),
    marginBottom: rs(-4),
  },

  // Generic card
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },

  // Client card
  clientHead: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  clientName: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  clientDivider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(14),
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  clientPhone: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },

  // Pill (umumiy)
  pill: {
    alignSelf: 'flex-start',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(9),
    paddingVertical: rs(3),
  },
  pillText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },

  // Statistika grid
  sumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  sumCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    paddingTop: rs(16),
    overflow: 'hidden',
  },
  metricAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(4) },
  sumLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    minHeight: rs(32),
  },
  sumValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    marginTop: rs(4),
  },

  // Qarz qatori
  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  qTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  qMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  qRight: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  qAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },

  // Yangi qarz tugmasi
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    borderRadius: rd.radius.pill,
    paddingVertical: rs(14),
    marginTop: rs(4),
  },
  addBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.onPrimary },

  // Empty
  emptyBox: { alignItems: 'center', gap: rs(10), paddingVertical: rs(30) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textTertiary },
});
