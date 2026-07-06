/**
 * QarzDaftariVozKechish.tsx — "Qarzdan voz kechish" (forgive) ekrani.
 * (web pages/qarz-daftari/qarz/_id/voz-kechish.vue bilan 1:1 tuzilma va ranglar).
 *
 * GET  /qarz-daftari/qarz/:id               → { mijoz:{fish}, valyuta, qoldiq }
 * POST /qarz-daftari/qarz/:id/voz-kechish   → summani voz kechish (qaytarib talab qilinmaydi).
 *
 * Aksent rang: QIZIL (qaytarib bo'lmaydigan amal).
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
import { ClockIcon, ShieldIcon, UserIcon } from '../redesign/icons';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const RED = '#dc2626';
const GREEN = '#16a34a';
const AMBER = '#f59e0b';
const BLUE = '#2f6fed';

// ---------- Yordamchilar ----------
// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// Faqat raqamlarni qoldiramiz (raw qiymat).
const onlyDigits = (s: string) => (s || '').replace(/\D+/g, '');

// Ming ajratgichli ko'rinish: "1000000" → "1 000 000".
const groupThousands = (raw: string) =>
  raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';

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

// Hisob-kitob qatori.
const SummaryRow = ({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) => (
  <View style={styles.sumRow}>
    <Text style={styles.sumRowLabel}>{label}</Text>
    <Text
      style={[
        styles.sumRowValue,
        bold ? styles.sumRowValueBold : null,
        valueColor ? { color: valueColor } : null,
      ]}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

// ---------- Ekran ----------
const QarzDaftariVozKechish = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/qarz/${id}`,
    method: 'GET',
  });

  const qarz: any = (data as any)?.data;

  const [summaRaw, setSummaRaw] = React.useState('');
  const [izoh, setIzoh] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  if (loading) return <Loading />;

  const valyuta = qarz?.valyuta || 'UZS';
  const qoldiq = Number(qarz?.qoldiq || 0);

  const summa = Number(summaRaw || 0);
  const tooMuch = summa > qoldiq;
  const yangiQoldiq = Math.max(qoldiq - summa, 0);
  const canSubmit = summa > 0 && !tooMuch && !submitting;

  // Tezkor chip: qoldiqning ulushi.
  const setChip = (pct: number) => {
    const val = pct >= 100 ? qoldiq : Math.round((qoldiq * pct) / 100);
    setSummaRaw(String(val));
  };

  // POST — summani voz kechish.
  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const token = storage.getString('token');
      await axios.post(
        `${URL}/qarz-daftari/qarz/${id}/voz-kechish`,
        {
          summa: Number(summaRaw),
          valyuta,
          izoh: izoh.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Toast.show({ type: 'omad', text1: 'Voz kechildi' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error2',
        text1: error?.response?.data?.message || 'Xatolik yuz berdi',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title="Qarzdan voz kechish" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Ogohlantirish banneri (QIZIL) */}
        <View style={styles.warnBox}>
          <ShieldIcon size={rs(20)} color={RED} />
          <Text style={styles.warnText}>
            Voz kechilgan summani qaytarib talab qila olmaysiz.
          </Text>
        </View>

        {/* 2. Mijoz kartasi */}
        <View style={styles.card}>
          <View style={styles.clientHead}>
            <CircleIcon size={rs(52)} bg={RED + '1A'}>
              <UserIcon size={rs(26)} color={RED} />
            </CircleIcon>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={2}>
                {titleCase(qarz?.mijoz?.fish)}
              </Text>
              <Text style={styles.clientSubLabel}>Hozirgi qoldiq</Text>
              <Text style={styles.clientSubValue} numberOfLines={1} adjustsFontSizeToFit>
                {`${sortMoneyText(qoldiq) || 0} ${valyuta}`}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Forma */}
        <Text style={styles.blockTitle}>Voz kechish ma’lumotlari</Text>
        <View style={styles.card}>
          {/* Summa */}
          <Text style={styles.fieldLabel}>Voz kechiladigan summa</Text>
          <View
            style={[
              styles.inputWrap,
              tooMuch && { borderColor: RED, backgroundColor: '#FEF2F2' },
            ]}
          >
            <TextInput
              style={styles.input}
              value={groupThousands(summaRaw)}
              onChangeText={t => setSummaRaw(onlyDigits(t))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={rd.color.textTertiary}
            />
            <Text style={styles.inputSuffix}>{valyuta}</Text>
          </View>
          <Text style={[styles.hint, tooMuch && { color: RED }]}>
            {`Maksimal: ${sortMoneyText(qoldiq) || 0} ${valyuta}`}
          </Text>

          {/* Tezkor chiplar */}
          <View style={styles.chipsRow}>
            {[
              { label: '25%', pct: 25 },
              { label: '50%', pct: 50 },
              { label: '75%', pct: 75 },
              { label: 'Hammasi', pct: 100 },
            ].map(c => (
              <TouchableOpacity
                key={c.label}
                activeOpacity={0.8}
                style={styles.chip}
                onPress={() => setChip(c.pct)}
              >
                <Text style={styles.chipText}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Izoh */}
          <Text style={[styles.fieldLabel, { marginTop: rs(16) }]}>
            Izoh (ixtiyoriy)
          </Text>
          <View style={[styles.inputWrap, styles.inputWrapMultiline]}>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={izoh}
              onChangeText={setIzoh}
              placeholder="Sabab yoki qo‘shimcha ma’lumot..."
              placeholderTextColor={rd.color.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* 4. Hisob-kitob */}
        <Text style={styles.blockTitle}>Hisob-kitob</Text>
        <View style={styles.card}>
          <SummaryRow
            label="Hozirgi qoldiq"
            value={`${sortMoneyText(qoldiq) || 0} ${valyuta}`}
          />
          <SummaryRow
            label="Voz kechiladi"
            value={`− ${sortMoneyText(summa) || 0} ${valyuta}`}
            valueColor={RED}
          />
          <View style={styles.sumDivider} />
          <SummaryRow
            label="Yangi qoldiq"
            value={`${sortMoneyText(yangiQoldiq) || 0} ${valyuta}`}
            valueColor={yangiQoldiq === 0 ? RED : rd.color.text}
            bold
          />
          {summa > 0 && !tooMuch && yangiQoldiq === 0 && (
            <View style={styles.zeroBanner}>
              <ShieldIcon size={rs(16)} color={RED} />
              <Text style={styles.zeroBannerText}>
                Qarz to‘liq voz kechiladi
              </Text>
            </View>
          )}
        </View>

        {/* 5. Tasdiqlash */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            { backgroundColor: RED },
            !canSubmit && styles.submitBtnDisabled,
          ]}
          onPress={onSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <ClockIcon size={rs(18)} color="#fff" />
              <Text style={styles.submitBtnText}>Tasdiqlash</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default QarzDaftariVozKechish;

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

  // Ogohlantirish banneri (QIZIL)
  warnBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(10),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: rs(16),
    padding: rs(14),
  },
  warnText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: '#991B1B',
    lineHeight: rs(18),
  },

  // Mijoz kartasi
  clientHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  clientName: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  clientSubLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(8),
  },
  clientSubValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: RED,
    marginTop: rs(2),
  },

  // Forma maydonlari
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
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(2),
  },
  inputWrapMultiline: { alignItems: 'stretch', paddingVertical: rs(6) },
  input: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    paddingVertical: rs(12),
  },
  inputMultiline: { minHeight: rs(72), fontFamily: rd.font.regular, fontSize: rs(14) },
  inputSuffix: {
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

  // Tezkor chiplar
  chipsRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(12) },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(9),
  },
  chipText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },

  // Hisob-kitob
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(6),
  },
  sumRowLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
  sumRowValue: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  sumRowValueBold: { fontFamily: rd.font.bold, fontSize: rs(15.5) },
  sumDivider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(6),
  },
  zeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: '#FEF2F2',
    borderRadius: rs(12),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    marginTop: rs(10),
  },
  zeroBannerText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: '#991B1B',
  },

  // Tasdiqlash tugmasi
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    borderRadius: rs(14),
    paddingVertical: rs(15),
    paddingHorizontal: rs(16),
    marginTop: rs(4),
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
