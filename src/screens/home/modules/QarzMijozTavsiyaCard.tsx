/**
 * QarzMijozTavsiyaCard.tsx — 21.10: Qarz daftari mijoz sahifasidagi "Tavsiya" kartasi
 * (sayt pages/qarz-daftari/mijoz/_id/index.vue + components/finance/RecommendationCard.vue bilan bir xil).
 *
 * GET /qarz-daftari/mijozlar/:id/tavsiya → { level: good|warn|bad|new, on_time, late, total, avg_delay_days }.
 * Backend javob bermasa (404 / tarmoq) — karta ko'rsatilmaydi (saytdagidek).
 * Masalan: qizil "Ehtiyot bo'ling — Qarzlarini ko'pincha kechiktirib qaytargan. (0/1 o'z vaqtida) · o'rtacha kechikish: 20 kun".
 */
import React from 'react';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { CheckCircleIcon, IconProps, InfoIcon, WarningIcon } from '../redesign/icons';

type TavsiyaLevel = 'good' | 'warn' | 'bad' | 'new';

type Tavsiya = {
  level: TavsiyaLevel;
  onTime: number;
  total: number;
  avgDelayDays: number;
};

type ToneView = {
  title: string;
  text: string;
  bg: string;
  iconBg: string;
  color: string;
  Icon: (p: IconProps) => React.ReactElement;
};

// Sayt RecommendationCard TONES bilan bir xil ranglar (new → "none" tusi).
const TONES: Record<TavsiyaLevel, ToneView> = {
  good: {
    title: 'Ishonchli mijoz',
    text: 'Qarzlarini o‘z vaqtida qaytargan.',
    bg: '#ECFDF5',
    iconBg: '#D1FAE5',
    color: '#047857',
    Icon: CheckCircleIcon,
  },
  warn: {
    title: 'Ehtiyot bo‘ling',
    text: 'Ba’zan kechiktirgan.',
    bg: '#FFFBEB',
    iconBg: '#FEF3C7',
    color: '#B45309',
    Icon: WarningIcon,
  },
  bad: {
    title: 'Ehtiyot bo‘ling',
    text: 'Qarzlarini ko‘pincha kechiktirib qaytargan.',
    bg: '#FEF2F2',
    iconBg: '#FEE2E2',
    color: '#B91C1C',
    Icon: WarningIcon,
  },
  new: {
    title: 'Yangi mijoz',
    text: 'Tarix yo‘q.',
    bg: '#F9FAFB',
    iconBg: '#F3F4F6',
    color: '#374151',
    Icon: InfoIcon,
  },
};
const TITLE_ICON_COLOR = '#6366F1'; // sayt: text-indigo-500

const LEVELS: TavsiyaLevel[] = ['good', 'warn', 'bad', 'new'];

/** Server javobini tekshirib, xavfsiz ko'rinishga keltiradi (noto'g'ri bo'lsa null). */
const parseTavsiya = (raw: unknown): Tavsiya | null => {
  const body = (raw && typeof raw === 'object' ? raw : null) as Record<string, any> | null;
  if (!body || body.success === false) return null;
  const d = (body.data && typeof body.data === 'object' ? body.data : body) as Record<string, any>;
  if (!d || !d.level) return null;
  const level: TavsiyaLevel = LEVELS.includes(d.level) ? d.level : 'new';
  return {
    level,
    onTime: Number(d.on_time) || 0,
    total: Number(d.total) || 0,
    avgDelayDays: Number(d.avg_delay_days) || 0,
  };
};

type Props = { mijozId?: number | string | null };

const QarzMijozTavsiyaCard = ({ mijozId }: Props) => {
  const { t } = useTranslation();
  const [tavsiya, setTavsiya] = React.useState<Tavsiya | null>(null);

  // Har fokusda qayta o'qiladi — qarz yopilib/to'lanib qaytilganda tavsiya yangilanadi.
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      if (mijozId == null || mijozId === '') return undefined;
      axios
        .get(`${URL}/qarz-daftari/mijozlar/${mijozId}/tavsiya`, {
          headers: { Authorization: `Bearer ${storage.getString('token')}` },
        })
        .then(res => {
          if (alive) setTavsiya(parseTavsiya(res?.data));
        })
        .catch(() => {
          // backend bo'lmasa (404) yoki tarmoq xatosi — karta ko'rsatilmaydi (saytdagidek)
          if (alive) setTavsiya(null);
        });
      return () => {
        alive = false;
      };
    }, [mijozId]),
  );

  if (!tavsiya) return null;
  const view = TONES[tavsiya.level];
  const metaParts: string[] = [];
  if (tavsiya.level !== 'new') {
    if (tavsiya.total) metaParts.push(`(${tavsiya.onTime}/${tavsiya.total} ${t('o‘z vaqtida')})`);
    if (tavsiya.avgDelayDays > 0) {
      metaParts.push(t('o‘rtacha kechikish: {{n}} kun', { n: Math.round(tavsiya.avgDelayDays) }));
    }
  }
  const meta = metaParts.join(' · ');
  const Icon = view.Icon;

  return (
    <View style={styles.card} accessible accessibilityLabel={`${t('Tavsiya')}: ${t(view.title)}. ${t(view.text)} ${meta}`}>
      <View style={styles.head}>
        <CheckCircleIcon size={rs(18)} color={TITLE_ICON_COLOR} />
        <Text allowFontScaling={false} style={styles.headTitle}>
          {t('Tavsiya')}
        </Text>
      </View>
      <View style={[styles.box, { backgroundColor: view.bg }]}>
        <View style={[styles.iconWrap, { backgroundColor: view.iconBg }]}>
          <Icon size={rs(18)} color={view.color} />
        </View>
        <View style={styles.textCol}>
          <Text allowFontScaling={false} style={[styles.title, { color: view.color }]}>
            {t(view.title)}
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            {t(view.text)}
            {!!meta && <Text style={styles.meta}>{` ${meta}`}</Text>}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default QarzMijozTavsiyaCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginTop: rs(14),
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(10) },
  headTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text },
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(12),
    borderRadius: rs(12),
    padding: rs(12),
  },
  iconWrap: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(11),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontFamily: rd.font.semibold, fontSize: rs(14), lineHeight: rs(19) },
  text: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    lineHeight: rs(18),
    color: '#4B5563',
    marginTop: rs(2),
  },
  meta: { color: '#9CA3AF' },
});
