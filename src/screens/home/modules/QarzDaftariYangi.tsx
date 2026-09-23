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
import { useTranslation } from 'react-i18next';
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
import { fmtUSD, fmtUZS } from '../../../helper/money';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarIcon,
  ChevronRight,
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

// Sana maydoni — chiroyli karta: taqvim ikonasi (aksent doira) + yorliq + sana +
// chevron. Ikkala sana (berilgan/qaytarish) uchun bir xil ko'rinish.
const DateField = ({
  label,
  value,
  placeholder,
  accent,
  accentBg,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  accent: string;
  accentBg: string;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} style={styles.dateCard} onPress={onPress}>
    <CircleIcon size={rs(42)} bg={accentBg}>
      <CalendarIcon size={rs(20)} color={accent} />
    </CircleIcon>
    <View style={{ flex: 1 }}>
      <Text style={styles.dateCardLabel}>{label}</Text>
      <Text
        style={[styles.dateCardValue, !value && styles.dateCardPlaceholder]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
    </View>
    <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
  </TouchableOpacity>
);

// ---------- Ekran ----------
const QarzDaftariYangi = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  const faoliyat_id = route.params?.faoliyat_id;
  const mijoz_id = route.params?.mijoz_id;
  const fish: string = route.params?.fish || '';
  // SS7-2: mijozning joriy qoldig'i — chaqiruvchi ekran (mijozlar ro'yxati /
  // mijoz sahifasi) uni allaqachon yuklagan, shu bois qo'shimcha so'rovsiz
  // param orqali beriladi. Yangi qo'shilgan mijozda 0.
  const qoldiqUzs = Number(route.params?.qoldiq_uzs || 0);
  const qoldiqUsd = Number(route.params?.qoldiq_usd || 0);
  const turi: 'berish' | 'olish' = route.params?.turi || 'berish';

  const isOlish = turi === 'olish';
  const accent = isOlish ? GREEN : BLUE;
  const accentBg = isOlish ? '#F0FDF4' : '#EFF6FF';
  const headerTitle = isOlish ? t('Qarzga olish') : t('Qarzga berish');
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
      Toast.show({ type: 'error2', props: { desc: t('Qarz miqdorini kiriting') } });
      return;
    }
    if (bolibTolash) {
      if (oylarNum < 1) {
        Toast.show({ type: 'error2', props: { desc: t('Oylar sonini kiriting (1–60)') } });
        return;
      }
    } else if (!qaytarishSana) {
      Toast.show({ type: 'error2', props: { desc: t('Qaytarish sanasini tanlang') } });
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
        Toast.show({ type: 'omad', props: { desc: t('Qarz saqlandi') } });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error2', props: { desc: t('Xatolik yuz berdi') } });
      }
    } catch (error: any) {
      const code = error?.response?.data?.code;
      const msg =
        code === 'no-sms-package'
          ? t("SMS paketi yo'q")
          : code === 'required_plan'
          ? t('Tarif talab qilinadi')
          : t('Xatolik yuz berdi');
      Toast.show({ type: 'error2', props: { desc: msg } });
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
              {/* SS7-2 (2026-09-14): FISH ostida mijozning QOLDIQ qarzi —
                  do'kon egasi yangi qarz berishdan oldin mavjud qarzni ko'radi.
                  Shrift kichik va ALOHIDA qatorda: FISH asosiy ma'lumot bo'lib
                  qoladi va summa uzun bo'lsa ham uni siqib qo'ymaydi
                  (K/M/B qisqartma — `fmtUZS`/`fmtUSD`). */}
              {(qoldiqUzs > 0 || qoldiqUsd > 0) && (
                <View style={styles.clientQoldiq}>
                  <Text style={styles.clientQoldiqLabel}>{t('Qoldiq qarz')}</Text>
                  <Text style={styles.clientQoldiqVal} numberOfLines={1}>
                    {fmtUZS(qoldiqUzs)}
                    {qoldiqUsd > 0 ? ` · ${fmtUSD(qoldiqUsd)}` : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 2) Valyuta */}
          <Text style={styles.label}>{t('Valyutani tanlang')}</Text>
          <View style={styles.valyutaRow}>
            {(
              [
                { key: 'UZS', title: 'UZS', note: t("O‘zbek so‘mi") },
                { key: 'USD', title: 'USD', note: t('AQSh dollari') },
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
          <Text style={styles.label}>{t('Qarz miqdorini kiriting')}</Text>
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
          <Text style={styles.label}>{t('Mahsulot yoki xizmat nomi (ixtiyoriy)')}</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={mahsulot}
              onChangeText={setMahsulot}
              placeholder={t('Masalan, telefon')}
              placeholderTextColor={rd.color.textTertiary}
            />
          </View>

          {/* 5) Qarz berilgan sana */}
          <DateField
            label={t('Qarz berilgan sana')}
            value={toDisplayDate(berilganSana)}
            placeholder={t('Sanani tanlang')}
            accent={accent}
            accentBg={accentBg}
            onPress={() => setBerilganOpen(true)}
          />

          {/* 6) Bo'lib to'lash toggle */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>{t('Bo‘lib to‘lash')}</Text>
              <Text style={styles.switchNote}>
                {t('Qarzni bir necha oyda bo‘lib qaytarish')}
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
              <Text style={styles.label}>{t('Necha oyda qaytariladi?')}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={oylar}
                  onChangeText={onOylarChange}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={rd.color.textTertiary}
                />
                <Text style={styles.inputSuffix}>{t('oy')}</Text>
              </View>

              {/* Boshlang'ich to'lov (ixtiyoriy) */}
              <Text style={styles.label}>{t('Boshlang‘ich to‘lov (ixtiyoriy)')}</Text>
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
              <DateField
                label={t('Qarzni qaytarish sanasi')}
                value={qaytarishSana ? toDisplayDate(qaytarishSana) : ''}
                placeholder={t('Sanani tanlang')}
                accent={accent}
                accentBg={accentBg}
                onPress={() => setQaytarishOpen(true)}
              />
            </>
          )}

          {/* 7) Hisob-kitob */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <CircleIcon size={rs(32)} bg={accentBg}>
                <CoinIcon size={rs(16)} color={accent} />
              </CircleIcon>
              <Text style={styles.summaryTitle}>{t('Hisob-kitob')}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('Qarz miqdori')}</Text>
              <Text style={styles.summaryValue}>
                {`${sortText(miqdor) || 0} ${valyuta}`}
              </Text>
            </View>

            {bolibTolash ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('Oylar soni')}</Text>
                  <Text style={styles.summaryValue}>
                    {oylarNum >= 1 ? `${oylarNum} ${t('oy')}` : '—'}
                  </Text>
                </View>
                {boshlangich > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t('Boshlang‘ich to‘lov')}</Text>
                    <Text style={styles.summaryValue}>
                      {`${sortText(boshlangich) || 0} ${valyuta}`}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.summaryTotalLabel}>{t('Oylik to‘lov')}</Text>
                  <Text style={[styles.summaryTotalValue, { color: accent }]}>
                    {`${sortText(oylikTolov) || 0} ${valyuta}`}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('Qaytarish sanasi')}</Text>
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
                <Text style={styles.submitText}>{t('Saqlash')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sana modallari */}
      <DateModal
        open={berilganOpen}
        setOpen={setBerilganOpen}
        title={t('Qarz berilgan sana')}
        date={berilganSana}
        setDate={setBerilganSana}
        max={today}
      />
      <DateModal
        open={qaytarishOpen}
        setOpen={setQaytarishOpen}
        title={t('Qaytarish sanasi')}
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
  // SS7-2: qoldiq qarz — FISH ostida, sezilarli kichik shriftda.
  clientQoldiq: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(3) },
  clientQoldiqLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(10.5),
    color: rd.color.textTertiary,
  },
  clientQoldiqVal: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(11),
    color: rd.color.textSecondary,
  },
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
  valyutaRow: { flexDirection: 'row', gap: rs(10) },
  // SS7-3 (2026-09-14, 2-marta): valyuta cardlari YANA ixchamlashtirildi —
  // oldingi o'lcham ham forma ichida haddan katta joy egallardi. Balandlik
  // (padding) va ikkala matn birgalikda kichraydi, aks holda card kichrayib
  // matn ichida siqilib qolardi.
  valyutaCard: {
    flex: 1,
    alignItems: 'center',
    gap: rs(1),
    backgroundColor: rd.color.surface,
    borderRadius: rs(10),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingVertical: rs(7),
  },
  valyutaTitle: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text },
  valyutaNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(9),
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

  // Date field — chiroyli karta (taqvim ikonasi + yorliq + sana + chevron)
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
    marginTop: rs(4),
  },
  dateCardLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  dateCardValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(15.5),
    color: rd.color.text,
    marginTop: rs(2),
  },
  dateCardPlaceholder: {
    fontFamily: rd.font.semibold,
    color: rd.color.textTertiary,
  },

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
