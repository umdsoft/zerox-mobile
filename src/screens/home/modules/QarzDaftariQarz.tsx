/**
 * QarzDaftariQarz.tsx — bitta qarz tafsiloti + amallar
 * (web pages/qarz-daftari/qarz/_id/index.vue bilan 1:1 tuzilma va ranglar).
 *
 * GET /qarz-daftari/qarz/:id  → qarz obyekti (mijoz, summalar, bo'lib to'lash jadvali).
 * POST /qarz-daftari/qarz/:id/talab  → qaytarishni talab qilish (SMS).
 *
 * Web rang semantikasi: berish = KO'K (menga qarzdor), olish = YASHIL (men qarzdorman),
 * muddati o'tgan = QIZIL, kutilmoqda/aktiv = SARIQ.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
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
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { sortMoneyText } from '../../components/StatisticCard';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  ClockIcon,
  PhoneIcon,
  ShieldIcon,
  TransferIcon,
  UserIcon,
} from '../redesign/icons';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const BLUE = '#2f6fed';
const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#f59e0b';

// ---------- Yordamchilar ----------
// DD.MM.YYYY sana formati.
const ddmmyyyy = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
};

// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// POST xatolik kodini o'qib mos xabar qaytaramiz.
const talabErrorText = (code?: string): string => {
  switch (code) {
    case 'no-sms-package':
      return 'SMS paket yetarli emas';
    case 'sms-failed':
      return 'SMS yuborilmadi';
    case 'no-phone':
      return 'Mijoz telefoni yo‘q';
    default:
      return 'Xatolik yuz berdi';
  }
};

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

// Holat pilli (aktiv / yopilgan / voz kechilgan).
const statusMeta = (status?: string) => {
  switch (status) {
    case 'yopilgan':
      return { label: 'Yopilgan', color: GREEN };
    case 'voz_kechilgan':
      return { label: 'Voz kechilgan', color: rd.color.textTertiary };
    default:
      return { label: 'Aktiv', color: AMBER };
  }
};

// To'lov qatori holat pilli.
const tolovMeta = (status?: string) => {
  switch (status) {
    case 'tolandi':
      return { label: 'To‘landi', color: GREEN };
    case 'muddati_otgan':
      return { label: 'Muddati o‘tgan', color: RED };
    default:
      return { label: 'Kutilmoqda', color: AMBER };
  }
};

// 2x2 statistik quti.
const StatBox = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text
      style={[styles.statValue, valueColor ? { color: valueColor } : null]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
  </View>
);

// ---------- Ekran ----------
const QarzDaftariQarz = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const { t } = useTranslation();

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/qarz/${id}`,
    method: 'GET',
  });

  const [talabLoading, setTalabLoading] = React.useState(false);

  const qarz: any = (data as any)?.data;

  if (loading) return <Loading />;

  if (!qarz) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        <RdHeader title={t('Qarz tafsiloti')} />
        <View style={styles.notFound}>
          <CircleIcon size={rs(56)} bg={rd.color.surfaceAlt}>
            <ClockIcon size={rs(24)} color={rd.color.textTertiary} />
          </CircleIcon>
          <Text style={styles.notFoundText}>{t('Topilmadi')}</Text>
        </View>
      </View>
    );
  }

  const turi: 'berish' | 'olish' = qarz?.turi === 'olish' ? 'olish' : 'berish';
  const accent = turi === 'olish' ? GREEN : BLUE;
  const accentBg = turi === 'olish' ? '#F0FDF4' : '#EFF6FF';
  const valyuta = qarz?.valyuta || 'UZS';

  const st = statusMeta(qarz?.status);
  const roleLabel = turi === 'olish' ? t('Qarz beruvchi') : t('Qarz oluvchi');

  const tolovlar: any[] = Array.isArray(qarz?.tolovlar) ? qarz.tolovlar : [];
  const mijozId = qarz?.mijoz_id ?? qarz?.mijoz?.id;

  // Qaytarishni talab qilish (POST) — SMS yuboradi.
  const talabQil = async () => {
    if (talabLoading) return;
    setTalabLoading(true);
    try {
      const token = storage.getString('token');
      await axios.post(
        `${URL}/qarz-daftari/qarz/${id}/talab`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Toast.show({ type: 'omad', text1: t('SMS yuborildi') });
    } catch (error: any) {
      const code = error?.response?.data?.code;
      Toast.show({ type: 'error', text1: t(talabErrorText(code)) });
    } finally {
      setTalabLoading(false);
    }
  };

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
            <CircleIcon size={rs(52)} bg={accent + '1A'}>
              <UserIcon size={rs(26)} color={accent} />
            </CircleIcon>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={2}>
                {titleCase(qarz?.mijoz?.fish)}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: accent + '1A' }]}>
                <Text style={[styles.roleBadgeText, { color: accent }]}>{roleLabel}</Text>
              </View>
            </View>
            <View style={[styles.pill, { backgroundColor: st.color + '1A' }]}>
              <Text style={[styles.pillText, { color: st.color }]} numberOfLines={1}>
                {t(st.label)}
              </Text>
            </View>
          </View>

          <View style={styles.phoneRow}>
            <PhoneIcon size={rs(15)} color={rd.color.textTertiary} />
            <Text style={styles.phoneText}>{qarz?.mijoz?.telefon || '—'}</Text>
          </View>

          {/* Ikkilamchi havolalar */}
          <View style={styles.ghostRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.ghostBtn}
              onPress={() =>
                navigation.navigate('QarzDaftariAmaliyotlar', { mijoz_id: mijozId, turi })
              }
            >
              <TransferIcon size={rs(15)} color={rd.color.textSecondary} />
              <Text style={styles.ghostText}>{t('Amaliyotlar tarixi')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.ghostBtn}
              onPress={() => navigation.navigate('QarzDaftariKvitansiya', { id })}
            >
              <ShieldIcon size={rs(15)} color={rd.color.textSecondary} />
              <Text style={styles.ghostText}>{t('Kvitansiya')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Statistik qutilar (2x2) */}
        <View style={styles.statGrid}>
          <StatBox label={t('Jami qarz')} value={`${sortMoneyText(qarz?.miqdor) || 0} ${valyuta}`} />
          <StatBox
            label={t('Qoldiq')}
            value={`${sortMoneyText(qarz?.qoldiq) || 0} ${valyuta}`}
            valueColor={accent}
          />
          <StatBox label={t('Berilgan sana')} value={ddmmyyyy(qarz?.berilgan_sana)} />
          <StatBox
            label={t('Qaytarish sanasi')}
            value={
              qarz?.bolib_tolash
                ? t('Bo‘lib to‘lash: {{oy}} oy', { oy: qarz?.oylar_soni || 0 })
                : ddmmyyyy(qarz?.qaytarish_sanasi)
            }
          />
        </View>

        {/* 3. Bo'lib to'lash jadvali */}
        {tolovlar.length > 0 && (
          <>
            <Text style={styles.blockTitle}>{t('Bo‘lib to‘lash jadvali')}</Text>
            <View style={styles.card}>
              <View style={styles.trHead}>
                <Text style={[styles.thText, styles.colNo]}>#</Text>
                <Text style={[styles.thText, styles.colDate]}>{t('To‘lov sanasi')}</Text>
                <Text style={[styles.thText, styles.colAmt]}>{t('Summa')}</Text>
                <Text style={[styles.thText, styles.colStatus]}>{t('Holat')}</Text>
              </View>
              {tolovlar.map((t, i) => {
                const tm = tolovMeta(t?.status);
                return (
                  <View
                    key={i}
                    style={[styles.tr, i === tolovlar.length - 1 && styles.trLast]}
                  >
                    <Text style={[styles.tdNo, styles.colNo]}>{t?.tartib_raqami ?? i + 1}</Text>
                    <Text style={[styles.tdDate, styles.colDate]} numberOfLines={1}>
                      {ddmmyyyy(t?.tolov_sanasi)}
                    </Text>
                    <Text style={[styles.tdAmt, styles.colAmt]} numberOfLines={1}>
                      {`${sortMoneyText(t?.summa) || 0} ${valyuta}`}
                    </Text>
                    <View style={styles.colStatus}>
                      <View style={[styles.tPill, { backgroundColor: tm.color + '1A' }]}>
                        <Text style={[styles.tPillText, { color: tm.color }]} numberOfLines={1}>
                          {t(tm.label)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* 4. Amallar */}
        <Text style={styles.blockTitle}>{t('Amallar')}</Text>
        {qarz?.status !== 'aktiv' ? (
          <View style={styles.infoPill}>
            <ClockIcon size={rs(18)} color={rd.color.textTertiary} />
            <Text style={styles.infoPillText}>
              {qarz?.status === 'voz_kechilgan' ? t('Voz kechilgan') : t('Qarz yopilgan')}
            </Text>
          </View>
        ) : turi === 'olish' ? (
          // Men qarzdorman — qaytarish.
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.btn, styles.btnSolid, { backgroundColor: GREEN }]}
            onPress={() => navigation.navigate('QarzDaftariYopish', { id })}
          >
            <ArrowDownLeft size={rs(18)} color="#fff" />
            <Text style={styles.btnSolidText}>{t('Qarzni qaytarish')}</Text>
          </TouchableOpacity>
        ) : (
          // Menga qarzdor — talab / yopish / voz kechish.
          <View style={styles.actionsWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={talabLoading}
              style={[styles.btn, styles.btnOutline, { borderColor: AMBER }]}
              onPress={talabQil}
            >
              <ClockIcon size={rs(18)} color={AMBER} />
              <Text style={[styles.btnOutlineText, { color: AMBER }]}>
                {talabLoading ? t('Yuborilmoqda...') : t('Qaytarishni talab qilish')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.btn, styles.btnSolid, { backgroundColor: GREEN }]}
              onPress={() => navigation.navigate('QarzDaftariYopish', { id })}
            >
              <ArrowDownLeft size={rs(18)} color="#fff" />
              <Text style={styles.btnSolidText}>{t('Qarzni yopish')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.btn, styles.btnOutline, { borderColor: RED }]}
              onPress={() => navigation.navigate('QarzDaftariVozKechish', { id })}
            >
              <ArrowUpRight size={rs(18)} color={RED} />
              <Text style={[styles.btnOutlineText, { color: RED }]}>{t('Qarzdan voz kechish')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default QarzDaftariQarz;

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

  // Mijoz kartasi
  clientHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  clientName: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(9),
    paddingVertical: rs(3),
    marginTop: rs(5),
  },
  roleBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  pill: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(9),
    paddingVertical: rs(4),
  },
  pillText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(14),
  },
  phoneText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },

  // Ghost havolalar
  ghostRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  ghostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(9),
    paddingHorizontal: rs(10),
  },
  ghostText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
  },

  // Statistik qutilar
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
  statBox: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  statLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },
  statValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    color: rd.color.text,
    marginTop: rs(6),
  },

  // Jadval
  trHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  thText: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(11),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  trLast: { borderBottomWidth: 0, paddingBottom: rs(2) },
  colNo: { width: rs(26) },
  colDate: { flex: 1.2 },
  colAmt: { flex: 1.3, textAlign: 'right', paddingRight: rs(10) },
  colStatus: { flex: 1.1, alignItems: 'flex-end' },
  tdNo: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  tdDate: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  tdAmt: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  tPill: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  tPillText: { fontFamily: rd.font.semibold, fontSize: rs(10) },

  // Amallar
  actionsWrap: { gap: rs(12) },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    borderRadius: rs(14),
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
  },
  btnSolid: {},
  btnSolidText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },
  btnOutline: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
  },
  btnOutlineText: { fontFamily: rd.font.semibold, fontSize: rs(14.5) },

  // Holat info pill (aktiv emas)
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rs(14),
    paddingVertical: rs(14),
  },
  infoPillText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
  },

  // Topilmadi
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(12) },
  notFoundText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textTertiary,
  },
});
