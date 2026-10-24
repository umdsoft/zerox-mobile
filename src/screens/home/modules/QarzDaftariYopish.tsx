/**
 * QarzDaftariYopish.tsx — "Qarzni yopish" (qarzni qaytarish / to'lov qabul qilish).
 * (web pages/qarz-daftari/qarz/_id/yopish.vue bilan 1:1 tuzilma va ranglar).
 *
 * GET  /qarz-daftari/qarz/:id          → qarz obyekti (mijoz, qoldiq, valyuta).
 * POST /qarz-daftari/qarz/:id/yopish   → to'lovni qabul qilish.
 *
 * 18.10 (egasining hujjati): `mode: 'mijoz'` — mijoz kartasidagi «Qarzni yopish».
 * Ekran oxirgi qarzning qoldig'ini EMAS, mijozning shu do'kon + turi + valyuta bo'yicha
 * JAMI qoldig'ini ko'rsatadi (Maksimal, 25/50/75/Hammasi ham jamiga nisbatan):
 *   GET  /qarz-daftari/mijozlar/:id/yopish-info?turi=…  → { mijoz, qoldiqlar:[{valyuta,qoldiq,soni}] }
 *   POST /qarz-daftari/mijozlar/:id/yopish             → summa aktiv qarzlar bo'ylab taqsimlanadi.
 * Mijozda UZS va USD qarz bo'lsa — valyuta tanlagichi.
 *
 * Aksent — YASHIL (to'lov / yopish).
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { rd, rs } from '../../../theme/rd';
// 23.10: oflayn rejim
import { useQarzFetch } from '../../../offline/useQarzFetch';
import { submitQarzOp } from '../../../offline/submit';
import { NewOp, Turi, Valyuta } from '../../../offline/types';
import OfflineBanner from '../../../offline/ui/OfflineBanner';
import NotSavedOffline from '../../../offline/ui/NotSavedOffline';
import { outboxErrorText, showQueuedResult } from '../../../offline/ui/queuedToast';
import Loading from '../../components/Loading';
import { sortMoneyText } from '../../components/StatisticCard';
import {
  amountToInput,
  exceedsAmount,
  formatAmountInput,
  isUsd,
  parseAmount,
  percentOfAmount,
  round2,
  sanitizeAmountInput,
  toCents,
} from '../../../helper/money';
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
  const { t } = useTranslation();
  const id = route.params?.id;
  const isMijozMode = route.params?.mode === 'mijoz';
  const mijozId = route.params?.mijoz_id;
  const turi: 'berish' | 'olish' = route.params?.turi === 'olish' ? 'olish' : 'berish';
  // Mijoz rejimida 30s keshni chetlab o'tamiz — eski jami (yopishdan oldingi) ko'rinmasin.
  const [nonce] = React.useState(() => Date.now());

  // 23.10 (oflayn rejim): cache-first + navbatdagi amallar proyeksiyasi (oflayn mijoz/qarz ham).
  const { data, loading, error, offline } = useQarzFetch({
    url: isMijozMode
      ? `${URL}/qarz-daftari/mijozlar/${mijozId}/yopish-info?turi=${turi}&_=${nonce}`
      : `${URL}/qarz-daftari/qarz/${id}`,
    method: 'GET',
  });

  const [raw, setRaw] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  // 24.10: ikki marta tez bosishdan himoya (navbatga ikki to'lov tushmasin). Faqat xatoda ochiladi.
  const submitLock = React.useRef(false);
  const [cur, setCur] = React.useState<string | null>(route.params?.valyuta || null);

  const payload: any = (data as any)?.data;
  // Mijoz rejimi: valyuta bo'yicha jami qoldiqlar; tanlangani (bo'lmasa birinchisi).
  const qoldiqlar: { valyuta: string; qoldiq: number; soni: number }[] =
    isMijozMode && Array.isArray(payload?.qoldiqlar) ? payload.qoldiqlar : [];
  const tanlangan = qoldiqlar.find(q => q.valyuta === cur) || qoldiqlar[0];
  const qarz: any = isMijozMode
    ? payload?.mijoz && tanlangan
      ? { mijoz: payload.mijoz, valyuta: tanlangan.valyuta, qoldiq: tanlangan.qoldiq }
      : null
    : payload;

  // useFetch birinchi renderda data=[] va loading=false — "Topilmadi" miltillamasin
  // (xato bo'lsa — kutmaymiz, "Topilmadi").
  if (loading || (Array.isArray(data) && !error)) return <Loading />;

  if (!qarz) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        <RdHeader title={t('Qarzni yopish')} />
        {/* 24.10: oflayn va keshda yo'q — "Topilmadi" EMAS, aniq sabab. */}
        {offline && error ? (
          <NotSavedOffline offline />
        ) : (
          <View style={styles.notFound}>
            <CircleIcon size={rs(56)} bg={rd.color.surfaceAlt}>
              <ClockIcon size={rs(24)} color={rd.color.textTertiary} />
            </CircleIcon>
            <Text style={styles.notFoundText}>{t('Topilmadi')}</Text>
          </View>
        )}
      </View>
    );
  }

  const valyuta = qarz?.valyuta || 'UZS';
  const qoldiq = Number(qarz?.qoldiq || 0);

  // USD — tsentlar (655,77), UZS — butun; taqqoslash TSENTLARDA (2026-10-18).
  const usd = isUsd(valyuta);
  const summa = parseAmount(raw, usd);
  const over = exceedsAmount(summa, qoldiq); // qoldiqdan oshib ketdi
  const newQoldiq = Math.max(round2(qoldiq - summa), 0);
  const fullyClosed = summa > 0 && !over && toCents(qoldiq) === toCents(summa);
  const canSubmit = summa > 0 && !over && !submitting;

  // Mijoz rejimi: valyuta almashtirilsa summa tozalanadi.
  const pickCur = (v: string) => {
    if (v === valyuta) return;
    setCur(v);
    setRaw('');
  };

  // Tezkor summa chiplari.
  const setQuick = (pct: number) => {
    setRaw(amountToInput(percentOfAmount(qoldiq, pct * 100, usd), usd));
  };

  // To'lovni qabul qilish (POST).
  const submit = async () => {
    if (!canSubmit || submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    try {
      // 23.10 (oflayn rejim): navbat orqali — onlaynda darhol (Idempotency-Key), oflaynda saqlanadi.
      const mid = Number(isMijozMode ? mijozId : qarz?.mijoz_id ?? qarz?.mijoz?.id);
      const fid = Number(isMijozMode ? qarz?.mijoz?.savdo_faoliyat_id : qarz?.savdo_faoliyat_id) || undefined;
      const meta = {
        fish: qarz?.mijoz?.fish,
        mijozId: Number.isFinite(mid) ? mid : undefined,
        turi: (isMijozMode ? turi : qarz?.turi) as Turi | undefined,
        valyuta: valyuta as Valyuta,
        summa,
        faoliyatId: fid,
      };
      const out = await submitQarzOp(
        (isMijozMode
          ? {
              kind: 'mijoz.yopish',
              payload: { mijozId: Number(mijozId), summa, valyuta, turi, faoliyatId: fid ?? null },
              deps: Number(mijozId) < 0 ? [Number(mijozId)] : [],
              meta,
            }
          : {
              kind: 'qarz.yopish',
              payload: { qarzId: Number(id), summa, valyuta },
              deps: Number(id) < 0 ? [Number(id)] : [],
              meta: { ...meta, qarzId: Number(id) },
            }) as NewOp,
      );
      if (out.status === 'queued') {
        navigation.goBack();
        showQueuedResult(out.op, t('To‘lov oflayn saqlandi — internet tiklanganda yuboriladi'), t);
      } else if (out.data?.success) {
        Toast.show({ type: 'omad', props: { desc: t('To‘lov qabul qilindi') } });
        navigation.goBack();
      } else {
        submitLock.current = false;
        Toast.show({ type: 'error2', props: { desc: t('Xatolik') } });
      }
    } catch (error: any) {
      submitLock.current = false;
      // 24.10: navbat to'lgan / qurilma xotirasiga yozilmadi — aniq xabar.
      const obErr = outboxErrorText(error, t);
      if (obErr) {
        Toast.show({ type: 'error2', props: { desc: obErr } });
        return;
      }
      Toast.show({
        type: 'error2',
        props: { desc: error?.response?.data?.message || t('Xatolik') },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Qarzni yopish')} />
      <OfflineBanner />

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
              <Text style={styles.clientSub}>{t('Jami qarz')}</Text>
              <Text style={[styles.clientAmount, { color: GREEN }]} numberOfLines={1} adjustsFontSizeToFit>
                {`${sortMoneyText(qoldiq) || 0} ${valyuta}`}
              </Text>
            </View>
          </View>
          {/* Mijoz rejimi: UZS va USD qarz bo'lsa — valyuta tanlagichi (har biri alohida yopiladi). */}
          {qoldiqlar.length > 1 && (
            <View style={[styles.chips, { marginTop: rs(14) }]}>
              {qoldiqlar.map(q => {
                const active = q.valyuta === valyuta;
                return (
                  <TouchableOpacity
                    key={q.valyuta}
                    activeOpacity={0.85}
                    style={[styles.chip, active && { backgroundColor: GREEN }]}
                    onPress={() => pickCur(q.valyuta)}
                  >
                    <Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={1}>
                      {`${sortMoneyText(q.qoldiq) || 0} ${q.valyuta}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 2. To'lov ma'lumotlari */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('To‘lov ma’lumotlari')}</Text>

          {/* Summa input */}
          <Text style={styles.fieldLabel}>{t('To‘lov summasi')}</Text>
          <View style={[styles.inputWrap, over && styles.inputWrapError]}>
            <CoinIcon size={rs(18)} color={over ? RED : rd.color.textTertiary} />
            <TextInput
              style={styles.input}
              value={formatAmountInput(raw, usd)}
              onChangeText={t => setRaw(sanitizeAmountInput(t, usd))}
              keyboardType={usd ? 'decimal-pad' : 'number-pad'}
              placeholder="0"
              placeholderTextColor={rd.color.textTertiary}
            />
            <Text style={styles.inputCur}>{valyuta}</Text>
          </View>
          <Text style={[styles.hint, over && { color: RED }]}>
            {t('Maksimal: {{amount}}', { amount: `${sortMoneyText(qoldiq) || 0} ${valyuta}` })}
          </Text>

          {/* Tezkor summa */}
          <Text style={[styles.fieldLabel, { marginTop: rs(16) }]}>{t('Tezkor summa')}</Text>
          <View style={styles.chips}>
            {QUICK.map(q => (
              <TouchableOpacity
                key={q.label}
                activeOpacity={0.85}
                style={styles.chip}
                onPress={() => setQuick(q.pct)}
              >
                <Text style={styles.chipText}>{q.label === 'Hammasi' ? t('Hammasi') : q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit + Bekor qilish (web bilan bir xil — 2 tugma yonma-yon) */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={submitting}
              style={styles.btnGhost}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnGhostText}>{t('Bekor qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!canSubmit}
              style={[
                styles.btn,
                styles.btnFlex,
                { backgroundColor: GREEN },
                !canSubmit && styles.btnDisabled,
              ]}
              onPress={submit}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnText}>{t('Tasdiqlash')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Hisob-kitob */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('Hisob-kitob')}</Text>
          <CalcRow
            label={t('Hozirgi qoldiq')}
            value={`${sortMoneyText(qoldiq) || 0} ${valyuta}`}
          />
          <CalcRow
            label={t('To‘lov')}
            value={`− ${sortMoneyText(summa) || 0} ${valyuta}`}
            valueColor={GREEN}
          />
          <View style={styles.calcDivider} />
          <CalcRow
            label={t('Yangi qoldiq')}
            value={`${sortMoneyText(newQoldiq) || 0} ${valyuta}`}
            valueColor={newQoldiq === 0 ? GREEN : rd.color.text}
            strong
          />

          {fullyClosed && (
            <View style={styles.banner}>
              <CircleIcon size={rs(28)} bg="#fff">
                <ClockIcon size={rs(15)} color={GREEN} />
              </CircleIcon>
              <Text style={styles.bannerText}>{t('Qarz to‘liq yopiladi')}</Text>
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
  // Bekor qilish + Tasdiqlash qatori
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(18) },
  btnFlex: { flex: 1, marginTop: 0 },
  btnGhost: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingVertical: rs(14),
    paddingHorizontal: rs(18),
  },
  btnGhostText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.textSecondary },

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
