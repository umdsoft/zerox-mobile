/**
 * FinancialHealth.tsx — "Moliyaviy sog'liq" (21.10, egasi hujjati).
 *
 * Bosh sahifadagi ball/holat bosilganda ochiladi va ball NIMA UCHUN shunday ekanini
 * tushuntiradi: katta ball + holat, modullar bo'yicha (Qarz shartnomasi, Qarz daftari,
 * Shaxsiy qarz, Shaxsiy moliya) olingan/maksimal ball va aniq sabablar, maslahatlar.
 *
 * Barcha hisob backendda: GET /home/financial-health?lang=.. (sayt bilan bir xil manba).
 * Mijoz faqat ko'rsatadi — formula takrorlanmaydi.
 */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import {
  BulbIcon,
  ChevronRight,
  ContractIcon,
  IconProps,
  InfoIcon,
  LedgerIcon,
  PersonalDebtIcon,
  WalletIcon,
} from '../redesign/icons';

type Impact = 'positive' | 'negative' | 'neutral';
type HealthDetail = {
  key: string;
  label: string;
  value: string;
  explanation: string;
  points: number;
  maxPoints: number;
  lost: number;
  impact: Impact;
};
type HealthComponent = {
  key: 'contracts' | 'shop' | 'personal' | 'finance';
  title: string;
  weight: number;
  maxPoints: number;
  points: number;
  percent: number;
  details: HealthDetail[];
};
type HealthTip = { key: string; module: string | null; text: string };
type HealthData = {
  score: number | null;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'no_data';
  statusText: string;
  components: HealthComponent[];
  tips: HealthTip[];
};

const HERO_GRAD: Record<HealthData['status'], readonly [string, string]> = {
  excellent: ['#059669', '#065f46'],
  good: ['#2f6fed', '#4338ca'],
  fair: ['#f59e0b', '#b45309'],
  poor: ['#e11d48', '#9f1239'],
  no_data: ['#64748b', '#475569'],
};

const MODULE_META: Record<
  HealthComponent['key'],
  { route: string; Icon: (p: IconProps) => React.ReactElement; color: string; tint: string }
> = {
  contracts: { route: 'QarzShartnomasi', Icon: ContractIcon, color: '#2563eb', tint: '#eff6ff' },
  shop: { route: 'QarzDaftari', Icon: LedgerIcon, color: '#059669', tint: '#ecfdf5' },
  personal: { route: 'FinanceDebts', Icon: PersonalDebtIcon, color: '#d97706', tint: '#fffbeb' },
  finance: { route: 'ShaxsiyMoliya', Icon: WalletIcon, color: '#db2777', tint: '#fdf2f8' },
};

const TAB_ROUTES = new Set(['QarzShartnomasi', 'QarzDaftari']);

const IMPACT_STYLE: Record<Impact, { color: string; bg: string }> = {
  positive: { color: '#15803d', bg: '#dcfce7' },
  negative: { color: '#b91c1c', bg: '#fee2e2' },
  neutral: { color: '#64748b', bg: '#f1f5f9' },
};

const RING_R = 44;
const RING_LEN = 2 * Math.PI * RING_R;

const fmtPts = (v: number, lang: string): string => {
  const n = Number(v) || 0;
  const s = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return lang === 'en' ? s : s.replace('.', ',');
};

const barColor = (percent: number): string =>
  percent >= 85 ? rd.color.success : percent >= 50 ? '#f59e0b' : '#e11d48';

const ScoreRing = ({ score }: { score: number | null }) => {
  const filled = (Math.max(0, Math.min(100, score ?? 0)) / 100) * RING_LEN;
  return (
    <View style={styles.ring}>
      <Svg width={rs(108)} height={rs(108)} viewBox="0 0 108 108">
        <Circle cx={54} cy={54} r={RING_R} stroke="rgba(255,255,255,0.22)" strokeWidth={9} fill="none" />
        <Circle
          cx={54}
          cy={54}
          r={RING_R}
          stroke="#ffffff"
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${RING_LEN}`}
          transform="rotate(-90 54 54)"
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text allowFontScaling={false} style={styles.ringScore}>
          {score == null ? '—' : score}
        </Text>
        <Text allowFontScaling={false} style={styles.ringMax}>
          /100
        </Text>
      </View>
    </View>
  );
};

const DetailRow = ({ d, lang }: { d: HealthDetail; lang: string }) => {
  const st = IMPACT_STYLE[d.impact] || IMPACT_STYLE.neutral;
  const badge = d.impact === 'negative' ? `−${fmtPts(d.lost, lang)}` : `+${fmtPts(d.points, lang)}`;
  return (
    <View style={styles.detailRow}>
      <View style={[styles.impact, { backgroundColor: st.bg }]}>
        <Text allowFontScaling={false} style={[styles.impactText, { color: st.color }]}>
          {badge}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{d.label}</Text>
        <Text style={[styles.detailValue, { color: d.impact === 'neutral' ? rd.color.textSecondary : st.color }]}>
          {d.value}
        </Text>
        <Text style={styles.detailExpl}>{d.explanation}</Text>
      </View>
    </View>
  );
};

const ModuleCard = ({
  c,
  lang,
  onOpen,
}: {
  c: HealthComponent;
  lang: string;
  onOpen: (route: string) => void;
}) => {
  const { t } = useTranslation();
  const meta = MODULE_META[c.key] || MODULE_META.finance;
  const { Icon } = meta;
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.modIcon, { backgroundColor: meta.tint }]}>
          <Icon size={rs(19)} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {c.title}
          </Text>
          <Text style={styles.cardSub}>
            {t('Vazn')}: {c.weight}
          </Text>
        </View>
        <Text allowFontScaling={false} style={styles.cardPoints}>
          {fmtPts(c.points, lang)}
          <Text style={styles.cardMax}>/{fmtPts(c.maxPoints, lang)}</Text>
        </Text>
      </View>
      <View style={styles.bar}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(2, Math.min(100, c.percent))}%`, backgroundColor: barColor(c.percent) },
          ]}
        />
      </View>
      {c.details.map((d) => (
        <DetailRow key={d.key} d={d} lang={lang} />
      ))}
      <TouchableOpacity activeOpacity={0.8} style={styles.openBtn} onPress={() => onOpen(meta.route)}>
        <Text style={styles.openText}>{t('Bo‘limga o‘tish')}</Text>
        <ChevronRight size={rs(16)} color={rd.color.primary} />
      </TouchableOpacity>
    </View>
  );
};

const FinancialHealth = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const lang = i18n.language || 'uz';
  const fetcher = useFetch({ url: `${URL}/home/financial-health?lang=${encodeURIComponent(lang)}`, method: 'GET' });
  const refresh = fetcher.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh({});
    }, [refresh]),
  );

  // 25.10: Qarz shartnomasi / Qarz daftari — pastki menyu tablari (BottomTabNavigator ichida);
  // stek ekranidan to'g'ridan-to'g'ri navigate(route) ularni TOPMAYDI. Qolganlari stek ekrani.
  const openModule = (route: string) => {
    if (TAB_ROUTES.has(route)) {
      navigation.navigate('BottomTabNavigator', { screen: route });
      return;
    }
    navigation.navigate(route);
  };

  const data: HealthData | null = (fetcher.data as any)?.data || null;
  const status = data?.status || 'no_data';
  const grad = HERO_GRAD[status] || HERO_GRAD.good;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Moliyaviy sog‘liq')} />
      {/* useFetch boshlang'ich holati: loading=false + data=[] — xato EMAS, hali yuklanmoqda. */}
      {!data && !fetcher.error ? (
        <Loading />
      ) : !data ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{t('Ma’lumotni yuklab bo‘lmadi')}</Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.retryBtn} onPress={() => refresh({})}>
            <Text style={styles.retryText}>{t('Qayta urinish')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={!!fetcher.loading}
              onRefresh={() => refresh({})}
              tintColor={rd.color.primary}
              colors={[rd.color.primary]}
            />
          }>
          {/* HERO: katta ball + holat */}
          <View style={styles.hero}>
            <Svg style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="fhHero" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={grad[0]} />
                  <Stop offset="1" stopColor={grad[1]} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#fhHero)" />
            </Svg>
            <View style={styles.heroGlow} />
            <View style={styles.heroRow}>
              <ScoreRing score={data.score} />
              <View style={{ flex: 1, marginLeft: rs(14) }}>
                <Text allowFontScaling={false} style={styles.heroKicker}>
                  {t('Moliyaviy sog‘liq')}
                </Text>
                <Text allowFontScaling={false} style={styles.heroStatus} numberOfLines={2}>
                  {data.statusText}
                </Text>
                <Text allowFontScaling={false} style={styles.heroSub}>
                  {t('Ball barcha modullar bo‘yicha hisoblanadi.')}
                </Text>
              </View>
            </View>
          </View>

          {/* Qanday hisoblanadi */}
          <View style={styles.howBox}>
            <InfoIcon size={rs(18)} color={rd.color.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.howTitle}>{t('Ball qanday hisoblanadi?')}</Text>
              <Text style={styles.howText}>
                {t(
                  'Har bir modul o‘z vazniga ega (30 / 20 / 20 / 30). Ma’lumoti yo‘q modul hisobga olinmaydi — qolganlarining vazni 100 ballga qayta taqsimlanadi.',
                )}
              </Text>
            </View>
          </View>

          {data.components.length > 0 ? (
            <Text style={styles.sectionTitle}>{t('Modullar bo‘yicha tafsilot')}</Text>
          ) : null}
          {data.components.map((c) => (
            <ModuleCard key={c.key} c={c} lang={lang} onOpen={openModule} />
          ))}

          {data.tips.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.tipsHead}>
                <BulbIcon size={rs(18)} color="#d97706" />
                <Text style={styles.cardTitle}>{t('Ballni oshirish uchun')}</Text>
              </View>
              {data.tips.map((tip, i) => (
                <View key={tip.key} style={styles.tipRow}>
                  <View style={styles.tipNum}>
                    <Text allowFontScaling={false} style={styles.tipNumText}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

export default FinancialHealth;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(28) },

  hero: {
    borderRadius: rd.radius.xl,
    overflow: 'hidden',
    padding: rs(16),
    marginBottom: rs(14),
  },
  heroGlow: {
    position: 'absolute',
    width: rs(180),
    height: rs(180),
    borderRadius: rs(90),
    right: -rs(60),
    top: -rs(80),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroKicker: { fontFamily: rd.font.medium, fontSize: rs(12), color: 'rgba(255,255,255,0.85)' },
  heroStatus: { fontFamily: rd.font.bold, fontSize: rs(24), color: rd.color.onPrimary, marginTop: rs(2) },
  heroSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: 'rgba(255,255,255,0.88)', marginTop: rs(6), lineHeight: rs(16) },

  ring: { width: rs(108), height: rs(108), alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end' },
  ringScore: { fontFamily: rd.font.bold, fontSize: rs(30), color: rd.color.onPrimary },
  ringMax: { fontFamily: rd.font.medium, fontSize: rs(12), color: 'rgba(255,255,255,0.85)', marginBottom: rs(5), marginLeft: rs(1) },

  howBox: {
    flexDirection: 'row',
    gap: rs(10),
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.lg,
    padding: rs(14),
    marginBottom: rs(16),
  },
  howTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  howText: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, lineHeight: rs(18), marginTop: rs(3) },

  sectionTitle: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text, marginBottom: rs(10) },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  modIcon: { width: rs(38), height: rs(38), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  cardSub: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(1) },
  cardPoints: { fontFamily: rd.font.bold, fontSize: rs(22), color: rd.color.text },
  cardMax: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary },

  bar: { height: rs(7), borderRadius: rs(4), backgroundColor: '#eef2f7', overflow: 'hidden', marginTop: rs(12), marginBottom: rs(4) },
  barFill: { height: '100%', borderRadius: rs(4) },

  detailRow: {
    flexDirection: 'row',
    gap: rs(10),
    paddingVertical: rs(11),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: rd.color.border,
  },
  impact: { minWidth: rs(48), borderRadius: rs(8), paddingVertical: rs(3), paddingHorizontal: rs(6), alignItems: 'center', alignSelf: 'flex-start' },
  impactText: { fontFamily: rd.font.bold, fontSize: rs(12.5) },
  detailLabel: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  detailValue: { fontFamily: rd.font.semibold, fontSize: rs(12.5), marginTop: rs(2) },
  detailExpl: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(4), lineHeight: rs(16) },

  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: rs(2),
    marginTop: rs(6),
    paddingVertical: rs(4),
  },
  openText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },

  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(6) },
  tipRow: { flexDirection: 'row', gap: rs(10), paddingVertical: rs(7) },
  tipNum: { width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  tipNumText: { fontFamily: rd.font.bold, fontSize: rs(11.5), color: '#b45309' },
  tipText: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textSecondary, lineHeight: rs(19) },

  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(24), gap: rs(14) },
  errorText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: rd.color.primary, borderRadius: rd.radius.md, paddingHorizontal: rs(20), paddingVertical: rs(10) },
  retryText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.onPrimary },
});
