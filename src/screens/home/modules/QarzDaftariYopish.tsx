/**
 * QarzDaftariYopish.tsx — "Qarzni yopish" (qarzni qaytarish / to'lov qabul qilish).
 * (web pages/qarz-daftari/qarz/_id/yopish.vue bilan 1:1 tuzilma va ranglar).
 *
 * GET  /qarz-daftari/qarz/:id          → qarz obyekti (mijoz, qoldiq, valyuta).
 * POST /qarz-daftari/qarz/:id/yopish   → to'lovni qabul qilish.
 *
 * Aksent — YASHIL (to'lov / yopish).
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import {
  ActivityIndicator,
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
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { sortMoneyText } from '../../components/StatisticCard';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import { ClockIcon, CoinIcon, UserIcon } from '../redesign/icons';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const BLUE = '#2f6fed';
const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#f59e0b';

// ---------- Yordamchilar ----------
// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// Faqat raqamlarni ajratib olamiz (xom qiymat — saqlanadigan).
const onlyDigits = (s: string): string => String(s || '').replace(/[^0-9]/g, '');

// Xom raqamlarni minglik ajratgichli ko'rinishga keltiramiz (1 000 000).
const formatThousands = (raw: string): string => {
  const d = onlyDigits(raw);
  if (!d) return '';
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

// Hisob-kitob qatori (label + qiymat).
const CalcRow = ({
  label,
  value,
  valueColor,
  strong,
}: {
  label: string;
  value: string;
  valueColor?: string;
  strong?: boolean;
}) => (
  <View style={styles.calcRow}>
    <Text style={styles.calcLabel}>{label}</Text>
    <Text
      style={[
        styles.calcValue,
        strong && styles.calcValueStrong,
        valueColor ? { color: valueColor } : null,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
  </View>
);

// Tezkor summa foizlari.
const QUICK: { label: string; pct: number }[] = [
  { label: '25%', pct: 0.25 },
  { label: '50%', pct: 0.5 },
  { label: '75%', pct: 0.75 },
  { label: 'Hammasi', pct: 1 },
];

// ---------- Ekran ----------
const QarzDaftariYopish = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/qarz/${id}`,
    method: 'GET',
  });

  const [raw, setRaw] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const qarz: any = (data as any)?.data;

  if (loading) return <Loading />;

  if (!qarz) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        <RdHeader title="Qarzni yopish" />
        <View style={styles.notFound}>
          <CircleIcon size={rs(56)} bg={rd.color.surfaceAlt}>
            <ClockIcon size={rs(24)} color={rd.color.textTertiary} />
          </CircleIcon>
          <Text style={styles.notFoundText}>Topilmadi</Text>
        </View>
      </View>
    );
  }

  const valyuta = qarz?.valyuta || 'UZS';
  const qoldiq = Number(qarz?.qoldiq || 0);

  const summa = Number(onlyDigits(raw) || 0);
  const over = summa > qoldiq; // qoldiqdan oshib ketdi
  const newQoldiq = Math.max(qoldiq - summa, 0);
  const fullyClosed = summa > 0 && !over && qoldiq - summa === 0;
  const canSubmit = summa > 0 && !over && !submitting;

  // Tezkor summa chiplari.
  const setQuick = (pct: number) => {
    const v = pct === 1 ? qoldiq : Math.round(qoldiq * pct);
    setRaw(String(v));
  };

  // To'lovni qabul qilish (POST).
  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const token = storage.getString('token');
      const res = await axios.post(
        `${URL}/qarz-daftari/qarz/${id}/yopish`,
        { summa: Number(onlyDigits(raw)), valyuta },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res?.data?.success) {
        Toast.show({ type: 'omad', text1: 'To‘lov qabul qilindi' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error2', text1: 'Xatolik' });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error2',
        text1: error?.response?.data?.message || 'Xatolik',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title="Qarzni yopish" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Mijoz kartasi */}
        <View style={styles.card}>
          <View style={styles.clientHead}>
            <CircleIcon size={rs(52)} bg={GREEN + '1A'}>
              <UserIcon size={rs(26)} color={GREEN} />
            </CircleIcon>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={2}>
                {titleCase(qarz?.mijoz?.fish)}
              </Text>
              <Text style={styles.clientSub}>Jami qarz</Text>
              <Text style={[styles.clientAmount, { color: GREEN }]} numberOfLines={1} adjustsFontSizeToFit>
                {`${sortMoneyText(qoldiq) || 0} ${valyuta}`}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. To'lov ma'lumotlari */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>To‘lov ma’lumotlari</Text>

          {/* Summa input */}
          <Text style={styles.fieldLabel}>To‘lov summasi</Text>
          <View style={[styles.inputWrap, over && styles.inputWrapError]}>
            <CoinIcon size={rs(18)} color={over ? RED : rd.color.textTertiary} />
            <TextInput
              style={styles.input}
              value={formatThousands(raw)}
              onChangeText={t => setRaw(onlyDigits(t))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={rd.color.textTertiary}
            />
            <Text style={styles.inputCur}>{valyuta}</Text>
          </View>
          <Text style={[styles.hint, over && { color: RED }]}>
            {`Maksimal: ${sortMoneyText(qoldiq) || 0} ${valyuta}`}
          </Text>

          {/* Tezkor summa */}
          <Text style={[styles.fieldLabel, { marginTop: rs(16) }]}>Tezkor summa</Text>
          <View style={styles.chips}>
            {QUICK.map(q => (
              <TouchableOpacity
                key={q.label}
                activeOpacity={0.85}
                style={styles.chip}
                onPress={() => setQuick(q.pct)}
              >
                <Text style={styles.chipText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!canSubmit}
            style={[
              styles.btn,
              { backgroundColor: GREEN },
              !canSubmit && styles.btnDisabled,
            ]}
            onPress={submit}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>Tasdiqlash</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. Hisob-kitob */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hisob-kitob</Text>
          <CalcRow
            label="Hozirgi qoldiq"
            value={`${sortMoneyText(qoldiq) || 0} ${valyuta}`}
          />
          <CalcRow
            label="To‘lov"
            value={`− ${sortMoneyText(summa) || 0} ${valyuta}`}
            valueColor={GREEN}
          />
          <View style={styles.calcDivider} />
          <CalcRow
            label="Yangi qoldiq"
            value={`${sortMoneyText(newQoldiq) || 0} ${valyuta}`}
            valueColor={newQoldiq === 0 ? GREEN : rd.color.text}
            strong
          />

          {fullyClosed && (
            <View style={styles.banner}>
              <CircleIcon size={rs(28)} bg="#fff">
                <ClockIcon size={rs(15)} color={GREEN} />
              </CircleIcon>
              <Text style={styles.bannerText}>Qarz to‘liq yopiladi</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default QarzDaftariYopish;

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

  // Generic card
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  cardTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    color: rd.color.text,
    marginBottom: rs(14),
  },

  // Mijoz kartasi
  clientHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  clientName: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  clientSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(8),
  },
  clientAmount: {
    fontFamily: rd.font.bold,
    fontSize: rs(19),
    marginTop: rs(2),
  },

  // Maydonlar
  fieldLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(4),
  },
  inputWrapError: { borderColor: RED },
  input: {
    flex: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    paddingVertical: rs(10),
  },
  inputCur: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textTertiary,
  },
  hint: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(6),
  },

  // Tezkor summa chiplari
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  chip: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(9),
    paddingHorizontal: rs(12),
  },
  chipText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
  },

  // Submit
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    borderRadius: rs(14),
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
    marginTop: rs(18),
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },

  // Hisob-kitob
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(7),
    gap: rs(12),
  },
  calcLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
  calcValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
  },
  calcValueStrong: { fontFamily: rd.font.bold, fontSize: rs(15.5) },
  calcDivider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(6),
  },

  // Yashil banner (to'liq yopiladi)
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: GREEN + '33',
    borderRadius: rs(14),
    padding: rs(12),
    marginTop: rs(12),
  },
  bannerText: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: GREEN,
  },

  // Topilmadi
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(12) },
  notFoundText: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textTertiary,
  },
});
