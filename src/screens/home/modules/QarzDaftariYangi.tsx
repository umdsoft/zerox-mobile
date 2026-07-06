/**
 * QarzDaftariYangi.tsx — "Yangi qarz" formasi (web pages/qarz-daftari/faoliyat/_id/
 * berish(olish)/yangi.vue bilan 1:1 tuzilma).
 *
 * Route params: { faoliyat_id, mijoz_id, fish, turi } — turi 'berish' | 'olish'.
 * Rang semantikasi: berish = KO'K, olish = YASHIL.
 *
 * POST /qarz-daftari/qarz — yangi qarz yozuvini saqlaydi.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { sortText } from '../../components/StatisticCard';
import { URL } from '../../constants';
import DateModal from '../modal/DateModal';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClockIcon,
  CoinIcon,
  UserIcon,
} from '../redesign/icons';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const BLUE = '#2f6fed'; // berish
const GREEN = '#16a34a'; // olish
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

const pad2 = (n: number) => String(n).padStart(2, '0');
// Date → 'YYYY-MM-DD' (backend uchun).
const toApiDate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
// Date → 'DD.MM.YYYY' (ko'rsatish uchun).
const toDisplayDate = (d: Date) =>
  `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;

// Faqat raqamlarni qoldiramiz.
const onlyDigits = (s: string) => s.replace(/[^\d]/g, '');

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

// ---------- Ekran ----------
const QarzDaftariYangi = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const faoliyat_id = route.params?.faoliyat_id;
  const mijoz_id = route.params?.mijoz_id;
  const fish: string = route.params?.fish || '';
  const turi: 'berish' | 'olish' = route.params?.turi || 'berish';

  const isOlish = turi === 'olish';
  const accent = isOlish ? GREEN : BLUE;
  const accentBg = isOlish ? '#F0FDF4' : '#EFF6FF';
  const headerTitle = isOlish ? 'Qarzga olish' : 'Qarzga berish';
  const AccentIcon = isOlish ? ArrowDownLeft : ArrowUpRight;

  const token = storage.getString('token');

  // --- Forma holati ---
  const [valyuta, setValyuta] = React.useState<'UZS' | 'USD'>('UZS');
  const [miqdorRaw, setMiqdorRaw] = React.useState(''); // faqat raqamlar
  const [mahsulot, setMahsulot] = React.useState('');

  const today = React.useMemo(() => new Date(), []);
  const [berilganSana, setBerilganSana] = React.useState<Date>(new Date());
  const [berilganOpen, setBerilganOpen] = React.useState(false);

  const [bolibTolash, setBolibTolash] = React.useState(false);

  const [qaytarishSana, setQaytarishSana] = React.useState<Date | null>(null);
  const [qaytarishOpen, setQaytarishOpen] = React.useState(false);

  const [oylar, setOylar] = React.useState(''); // 1..60
  const [boshlangichRaw, setBoshlangichRaw] = React.useState(''); // faqat raqamlar

  const [submitting, setSubmitting] = React.useState(false);

  const miqdor = Number(miqdorRaw || 0);
  const boshlangich = Number(boshlangichRaw || 0);
  const oylarNum = Number(oylar || 0);

  // Oylik to'lov — Math.ceil((miqdor - boshlangich) / oylar).
  const oylikTolov =
    bolibTolash && oylarNum >= 1
      ? Math.ceil(Math.max(miqdor - boshlangich, 0) / oylarNum)
      : 0;

  const onOylarChange = (t: string) => {
    const digits = onlyDigits(t);
    if (!digits) {
      setOylar('');
      return;
    }
    let n = Number(digits);
    if (n > 60) n = 60;
    setOylar(String(n));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (miqdor <= 0) {
      Toast.show({ type: 'xato', text1: 'Qarz miqdorini kiriting' });
      return;
    }
    if (bolibTolash) {
      if (oylarNum < 1) {
        Toast.show({ type: 'xato', text1: 'Oylar sonini kiriting (1–60)' });
        return;
      }
    } else if (!qaytarishSana) {
      Toast.show({ type: 'xato', text1: 'Qaytarish sanasini tanlang' });
      return;
    }

    const body = {
      savdo_faoliyat_id: faoliyat_id,
      mijoz_id,
      turi,
      valyuta,
      miqdor: Number(miqdorRaw),
      mahsulot_nomi: mahsulot,
      berilgan_sana: toApiDate(berilganSana),
      bolib_tolash: bolibTolash ? 1 : 0,
      qaytarish_sanasi:
        bolibTolash || !qaytarishSana ? null : toApiDate(qaytarishSana),
      oylar_soni: bolibTolash ? Number(oylar) : null,
      boshlangich_tolov: bolibTolash ? Number(boshlangichRaw || 0) : 0,
    };

    try {
      setSubmitting(true);
      const res = await axios.post(`${URL}/qarz-daftari/qarz`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        Toast.show({ type: 'omad', text1: 'Qarz saqlandi' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'xato', text1: 'Xatolik yuz berdi' });
      }
    } catch (error: any) {
      const code = error?.response?.data?.code;
      const msg =
        code === 'no-sms-package'
          ? "SMS paketi yo'q"
          : code === 'required_plan'
          ? 'Tarif talab qilinadi'
          : 'Xatolik yuz berdi';
      Toast.show({ type: 'xato', text1: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={headerTitle} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1) Mijoz kartasi (faqat o'qish) */}
          <View style={styles.clientCard}>
            <CircleIcon size={rs(46)} bg={accentBg}>
              <UserIcon size={rs(22)} color={accent} />
            </CircleIcon>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={1}>
                {titleCase(fish)}
              </Text>
              <Text style={styles.clientNote}>
                {isOlish ? 'Ushbu mijozdan qarz olinadi' : 'Ushbu mijozga qarz beriladi'}
              </Text>
            </View>
          </View>

          {/* 2) Valyuta */}
          <Text style={styles.label}>Valyuta</Text>
          <View style={styles.valyutaRow}>
            {(
              [
                { key: 'UZS', title: 'UZS', note: "O‘zbek so‘mi" },
                { key: 'USD', title: 'USD', note: 'AQSh dollari' },
              ] as const
            ).map(v => {
              const active = valyuta === v.key;
              return (
                <TouchableOpacity
                  key={v.key}
                  activeOpacity={0.9}
                  onPress={() => setValyuta(v.key)}
                  style={[
                    styles.valyutaCard,
                    active && { borderColor: accent, backgroundColor: accentBg },
                  ]}
                >
                  <Text
                    style={[styles.valyutaTitle, active && { color: accent }]}
                  >
                    {v.title}
                  </Text>
                  <Text style={styles.valyutaNote}>{v.note}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3) Qarz miqdori */}
          <Text style={styles.label}>Qarz miqdori</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={miqdorRaw ? String(sortText(miqdor)) : ''}
              onChangeText={t => setMiqdorRaw(onlyDigits(t))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={rd.color.textTertiary}
            />
            <Text style={styles.inputSuffix}>{valyuta}</Text>
          </View>

          {/* 4) Mahsulot nomi (ixtiyoriy) */}
          <Text style={styles.label}>Mahsulot nomi (ixtiyoriy)</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={mahsulot}
              onChangeText={setMahsulot}
              placeholder="Masalan: Shifer va taxta"
              placeholderTextColor={rd.color.textTertiary}
            />
          </View>

          {/* 5) Qarz berilgan sana */}
          <Text style={styles.label}>Qarz berilgan sana</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.dateField}
            onPress={() => setBerilganOpen(true)}
          >
            <ClockIcon size={rs(18)} color={rd.color.textTertiary} />
            <Text style={styles.dateText}>{toDisplayDate(berilganSana)}</Text>
          </TouchableOpacity>

          {/* 6) Bo'lib to'lash toggle */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Bo‘lib to‘lash</Text>
              <Text style={styles.switchNote}>
                Qarzni bir necha oyda bo‘lib qaytarish
              </Text>
            </View>
            <Switch
              value={bolibTolash}
              onValueChange={setBolibTolash}
              trackColor={{ false: rd.color.border, true: accent }}
              thumbColor="#fff"
            />
          </View>

          {bolibTolash ? (
            <>
              {/* Necha oyda qaytariladi? */}
              <Text style={styles.label}>Necha oyda qaytariladi?</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={oylar}
                  onChangeText={onOylarChange}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={rd.color.textTertiary}
                />
                <Text style={styles.inputSuffix}>oy</Text>
              </View>

              {/* Boshlang'ich to'lov (ixtiyoriy) */}
              <Text style={styles.label}>Boshlang‘ich to‘lov (ixtiyoriy)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={boshlangichRaw ? String(sortText(boshlangich)) : ''}
                  onChangeText={t => setBoshlangichRaw(onlyDigits(t))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={rd.color.textTertiary}
                />
                <Text style={styles.inputSuffix}>{valyuta}</Text>
              </View>
            </>
          ) : (
            <>
              {/* Qarzni qaytarish sanasi */}
              <Text style={styles.label}>Qarzni qaytarish sanasi</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.dateField}
                onPress={() => setQaytarishOpen(true)}
              >
                <ClockIcon size={rs(18)} color={rd.color.textTertiary} />
                <Text
                  style={[
                    styles.dateText,
                    !qaytarishSana && { color: rd.color.textTertiary },
                  ]}
                >
                  {qaytarishSana ? toDisplayDate(qaytarishSana) : 'Sanani tanlang'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* 7) Hisob-kitob */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <CircleIcon size={rs(32)} bg={accentBg}>
                <CoinIcon size={rs(16)} color={accent} />
              </CircleIcon>
              <Text style={styles.summaryTitle}>Hisob-kitob</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Qarz miqdori</Text>
              <Text style={styles.summaryValue}>
                {`${sortText(miqdor) || 0} ${valyuta}`}
              </Text>
            </View>

            {bolibTolash ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Oylar soni</Text>
                  <Text style={styles.summaryValue}>
                    {oylarNum >= 1 ? `${oylarNum} oy` : '—'}
                  </Text>
                </View>
                {boshlangich > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Boshlang‘ich to‘lov</Text>
                    <Text style={styles.summaryValue}>
                      {`${sortText(boshlangich) || 0} ${valyuta}`}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.summaryTotalLabel}>Oylik to‘lov</Text>
                  <Text style={[styles.summaryTotalValue, { color: accent }]}>
                    {`${sortText(oylikTolov) || 0} ${valyuta}`}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Qaytarish sanasi</Text>
                <Text style={styles.summaryValue}>
                  {qaytarishSana ? toDisplayDate(qaytarishSana) : '—'}
                </Text>
              </View>
            )}
          </View>

          {/* 8) Saqlash */}
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={submitting}
            onPress={handleSubmit}
            style={[
              styles.submitBtn,
              { backgroundColor: accent },
              submitting && { opacity: 0.7 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <AccentIcon size={rs(18)} color="#fff" />
                <Text style={styles.submitText}>Saqlash</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sana modallari */}
      <DateModal
        open={berilganOpen}
        setOpen={setBerilganOpen}
        title="Qarz berilgan sana"
        date={berilganSana}
        setDate={setBerilganSana}
        max={today}
      />
      <DateModal
        open={qaytarishOpen}
        setOpen={setQaytarishOpen}
        title="Qaytarish sanasi"
        date={qaytarishSana || berilganSana}
        setDate={setQaytarishSana}
        min={berilganSana}
      />
    </View>
  );
};

export default QarzDaftariYangi;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(32),
    gap: rs(10),
  },

  // Mijoz kartasi
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(4),
  },
  clientName: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: rd.color.text },
  clientNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Label
  label: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    marginTop: rs(6),
  },

  // Valyuta toggle
  valyutaRow: { flexDirection: 'row', gap: rs(12) },
  valyutaCard: {
    flex: 1,
    alignItems: 'center',
    gap: rs(3),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingVertical: rs(16),
  },
  valyutaTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  valyutaNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  input: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    paddingVertical: rs(13),
  },
  inputSuffix: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    marginLeft: rs(8),
  },

  // Date field
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(13),
  },
  dateText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginTop: rs(8),
  },
  switchTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  switchNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },

  // Hisob-kitob
  summaryCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    gap: rs(10),
    marginTop: rs(10),
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    marginBottom: rs(2),
  },
  summaryTitle: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: rd.color.text },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
  summaryValue: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    paddingTop: rs(10),
    marginTop: rs(2),
  },
  summaryTotalLabel: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  summaryTotalValue: { fontFamily: rd.font.bold, fontSize: rs(16) },

  // Saqlash
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    borderRadius: rd.radius.pill,
    paddingVertical: rs(15),
    marginTop: rs(16),
  },
  submitText: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: '#fff' },
});
