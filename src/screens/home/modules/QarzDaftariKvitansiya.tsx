/**
 * QarzDaftariKvitansiya.tsx — qarz KVITANSIYASI (hujjatsimon ko'rinish).
 * Web KvitansiyaView bilan 1:1 tuzilma va ranglar.
 *
 * GET /qarz-daftari/qarz/:id/kvitansiya →
 *   { qarz_oluvchi, qarz_beruvchi, miqdor, valyuta, qaytarilgan, qoldiq,
 *     mahsulot_nomi, berilgan_sana, qaytarish_sanasi, oylar_soni, tolovlar:[...] }
 *
 * Web rang semantikasi: qaytarilgan = YASHIL, qoldiq = QIZIL.
 */
import { useRoute } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { sortMoneyText } from '../../components/StatisticCard';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import { ClockIcon, ShieldIcon } from '../redesign/icons';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const GREEN = '#16a34a';
const RED = '#dc2626';

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

// Musbat sonmi? (guard).
const isPos = (v: any): boolean => Number(v) > 0;

// To'lov qatori holat matni.
const tolovStatus = (status?: string): { label: string; color: string } => {
  switch (status) {
    case 'tolandi':
      return { label: 'To‘landi', color: GREEN };
    case 'muddati_otgan':
      return { label: 'Muddati o‘tgan', color: RED };
    default:
      return { label: 'Kutilmoqda', color: rd.color.textTertiary };
  }
};

// ---------- Kichik komponentlar ----------
// Tafsilot qatori (chapda yorliq, o'ngda qiymat).
const Row = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel} numberOfLines={1}>
      {label}
    </Text>
    <Text
      style={[styles.detailValue, valueColor ? { color: valueColor } : null]}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

// ---------- Ekran ----------
const QarzDaftariKvitansiya = () => {
  const route = useRoute<any>();
  const id = route.params?.id;

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/qarz/${id}/kvitansiya`,
    method: 'GET',
  });

  const k: any = (data as any)?.data;

  if (loading) return <Loading />;

  if (!k) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        <RdHeader title="Kvitansiya" />
        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <ClockIcon size={rs(24)} color={rd.color.textTertiary} />
          </View>
          <Text style={styles.notFoundText}>Kvitansiya topilmadi</Text>
        </View>
      </View>
    );
  }

  const valyuta = k?.valyuta || 'UZS';
  const tolovlar: any[] = Array.isArray(k?.tolovlar) ? k.tolovlar : [];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title="Kvitansiya" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.receipt}>
          {/* Sarlavha */}
          <View style={styles.docHead}>
            <View style={styles.docBadge}>
              <ShieldIcon size={rs(20)} color={rd.color.primary} />
            </View>
            <Text style={styles.docTitle}>Qarz kvitansiyasi</Text>
          </View>
          <View style={styles.divider} />

          {/* Tomonlar */}
          <View style={styles.parties}>
            <View style={styles.partyBlock}>
              <Text style={styles.partyLabel}>QARZ OLUVCHI</Text>
              <Text style={styles.partyValue} numberOfLines={2}>
                {titleCase(k?.qarz_oluvchi)}
              </Text>
            </View>
            <View style={styles.partyBlock}>
              <Text style={styles.partyLabel}>QARZ BERUVCHI</Text>
              <Text style={styles.partyValue} numberOfLines={2}>
                {titleCase(k?.qarz_beruvchi)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Tafsilotlar */}
          <View style={styles.details}>
            <Row
              label="Qarz miqdori"
              value={`${sortMoneyText(k?.miqdor) || 0} ${valyuta}`}
            />
            {isPos(k?.qaytarilgan) && (
              <Row
                label="Qaytarilgan"
                value={`${sortMoneyText(k?.qaytarilgan) || 0} ${valyuta}`}
                valueColor={GREEN}
              />
            )}
            {isPos(k?.qoldiq) && (
              <Row
                label="Qoldiq qarz"
                value={`${sortMoneyText(k?.qoldiq) || 0} ${valyuta}`}
                valueColor={RED}
              />
            )}
            {!!k?.mahsulot_nomi && (
              <Row label="Mahsulot" value={String(k.mahsulot_nomi)} />
            )}
            <Row label="Berilgan sana" value={ddmmyyyy(k?.berilgan_sana)} />
            {!!k?.qaytarish_sanasi && (
              <Row
                label="Qaytarish sanasi"
                value={ddmmyyyy(k?.qaytarish_sanasi)}
              />
            )}
            {isPos(k?.oylar_soni) && (
              <Row label="Bo‘lib to‘lash" value={`${k?.oylar_soni} oy`} />
            )}
          </View>

          {/* To'lovlar jadvali */}
          {tolovlar.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.tableTitle}>To‘lovlar</Text>
              <View style={styles.trHead}>
                <Text style={[styles.thText, styles.colNo]}>#</Text>
                <Text style={[styles.thText, styles.colDate]}>Sana</Text>
                <Text style={[styles.thText, styles.colAmt]}>Summa</Text>
                <Text style={[styles.thText, styles.colStatus]}>Holat</Text>
              </View>
              {tolovlar.map((t, i) => {
                const ts = tolovStatus(t?.status);
                return (
                  <View
                    key={i}
                    style={[
                      styles.tr,
                      i === tolovlar.length - 1 && styles.trLast,
                    ]}
                  >
                    <Text style={[styles.tdNo, styles.colNo]}>
                      {t?.tartib_raqami ?? i + 1}
                    </Text>
                    <Text
                      style={[styles.tdDate, styles.colDate]}
                      numberOfLines={1}
                    >
                      {ddmmyyyy(t?.tolov_sanasi ?? t?.sana)}
                    </Text>
                    <Text
                      style={[styles.tdAmt, styles.colAmt]}
                      numberOfLines={1}
                    >
                      {`${sortMoneyText(t?.summa) || 0} ${valyuta}`}
                    </Text>
                    <Text
                      style={[styles.tdStatus, styles.colStatus, { color: ts.color }]}
                      numberOfLines={1}
                    >
                      {ts.label}
                    </Text>
                  </View>
                );
              })}
            </>
          )}

          <View style={styles.divider} />
          <Text style={styles.footerNote}>
            Ushbu kvitansiya ma’lumot uchun berilgan.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default QarzDaftariKvitansiya;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(10),
    paddingBottom: rs(28),
  },

  // Hujjat (kvitansiya) kartasi
  receipt: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(18),
    paddingVertical: rs(20),
  },

  // Sarlavha
  docHead: { alignItems: 'center', gap: rs(8) },
  docBadge: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(16),
  },

  // Tomonlar
  parties: { gap: rs(14) },
  partyBlock: { gap: rs(4) },
  partyLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(10.5),
    letterSpacing: 0.5,
    color: rd.color.textTertiary,
  },
  partyValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
  },

  // Tafsilotlar
  details: { gap: rs(12) },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(12),
  },
  detailLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    flexShrink: 1,
  },
  detailValue: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
    textAlign: 'right',
  },

  // To'lovlar jadvali
  tableTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(14),
    color: rd.color.text,
    marginBottom: rs(10),
  },
  trHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  thText: {
    fontFamily: rd.font.medium,
    fontSize: rs(11),
    color: rd.color.textTertiary,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(10),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  trLast: { borderBottomWidth: 0, paddingBottom: rs(2) },
  colNo: { width: rs(24) },
  colDate: { flex: 1.1 },
  colAmt: { flex: 1.3, textAlign: 'right' },
  colStatus: { flex: 1.1, textAlign: 'right' },
  tdNo: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  tdDate: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  tdAmt: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.text,
  },
  tdStatus: { fontFamily: rd.font.semibold, fontSize: rs(11) },

  // Footer izoh
  footerNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },

  // Topilmadi
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(12),
  },
  notFoundIcon: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textTertiary,
  },
});
