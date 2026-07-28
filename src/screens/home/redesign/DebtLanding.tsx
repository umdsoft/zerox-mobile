/**
 * DebtLanding.tsx — "Qarz berish" / "Qarz olish" landing ekranlari uchun umumiy
 * professional redizayn. TakeDebt (type:1) va GiveDebt (type:0) shuni ishlatadi.
 *
 * Amallar (eski oqim saqlanadi):
 *   - Foydalanuvchini qidirish -> SearchUserScreen { type }
 *   - Qarz tarixi -> HistoryDebt { type }
 *   - QR orqali skanerlash -> QrScan { type }
 * is_active !== 1 bo'lsa modal (showModal) — oldingi xulq bilan bir xil.
 */
import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { showModal } from '../../../store/reducers/HomeReducer';
import { rd, rs } from '../../../theme/rd';
import RdHeader from './RdHeader';
import {
  ChevronRight,
  ClockIcon,
  GridIcon,
  IconProps,
  SearchIcon,
  UserIcon,
} from './icons';

const GradientBg = () => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id="debtGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={rd.color.gradient[0]} />
        <Stop offset="1" stopColor={rd.color.gradient[1]} />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#debtGrad)" />
  </Svg>
);

// Kreativ SVG illyustratsiya (Lottie o'rniga — har doim ishonchli render).
// up=true -> yuqoriga strelka (Qarz berish, pul chiqadi); up=false -> pastga (Qarz olish, pul keladi).
const W = '#ffffff';
const DebtHero = ({ up }: { up: boolean }) => (
  <Svg width={rs(172)} height={rs(150)} viewBox="0 0 172 150">
    {/* Yorug'lik halqalari */}
    <Circle cx="86" cy="72" r="68" fill="none" stroke={W} strokeOpacity={0.1} strokeWidth={2} />
    <Circle cx="86" cy="72" r="54" fill="none" stroke={W} strokeOpacity={0.16} strokeWidth={2} />
    {/* Suzuvchi tangalar */}
    <Circle cx="24" cy="44" r="9" fill={W} fillOpacity={0.22} />
    <Circle cx="150" cy="54" r="6" fill={W} fillOpacity={0.28} />
    <Circle cx="38" cy="116" r="5" fill={W} fillOpacity={0.22} />
    <Circle cx="146" cy="110" r="8" fill={W} fillOpacity={0.18} />
    {/* Markaziy tanga */}
    <Circle cx="86" cy="72" r="42" fill={W} />
    <Circle cx="86" cy="72" r="32" fill="none" stroke={rd.color.primary} strokeOpacity={0.22} strokeWidth={2} strokeDasharray="3 5" />
    {/* Yo'nalish strelkasi (primary) */}
    <Path
      d={up ? 'M86 90 V56' : 'M86 54 V88'}
      stroke={rd.color.primary}
      strokeWidth={6}
      strokeLinecap="round"
    />
    <Path
      d={up ? 'M74 68 L86 56 L98 68' : 'M74 76 L86 88 L98 76'}
      stroke={rd.color.primary}
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Aksent nishoni (+) */}
    <Circle cx="120" cy="102" r="16" fill={rd.color.primary} />
    <Path d="M120 95 V109 M113 102 H127" stroke={W} strokeWidth={3} strokeLinecap="round" />
  </Svg>
);

const ActionRow = ({
  Icon,
  title,
  subtitle,
  onPress,
}: {
  Icon: (p: IconProps) => JSX.Element;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} style={styles.row} onPress={onPress}>
    <View style={styles.rowIcon}>
      <Icon size={rs(22)} color={rd.color.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
    </View>
    <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
  </TouchableOpacity>
);

type Props = {
  type: number; // 1 = qarz olish (Olish tab), 0 = qarz berish (Berish tab)
  title: string;
  subtitle: string;
};

const DebtLanding = ({ type, title, subtitle }: Props) => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.HomeReducer);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const onNavigate = useCallback(
    (name: string) => {
      if (user?.data?.is_active === 1) {
        navigation.navigate(name, { type });
      } else {
        dispatch(showModal({ show: true }));
      }
    },
    [dispatch, navigation, type, user?.data?.is_active],
  );

  return (
    <View style={styles.container}>
      <RdHeader
        title={title}
        onBack={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate('Home')
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Hero — asosiy CTA (foydalanuvchini qidirish) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.hero}
          onPress={() => onNavigate('SearchUserScreen')}
        >
          <GradientBg />
          <DebtHero up={type === 0} />
          <Text style={styles.heroSub}>{subtitle}</Text>
          <View style={styles.heroBtn}>
            <SearchIcon size={rs(18)} color={rd.color.primary} />
            <Text style={styles.heroBtnText}>{t('621')}</Text>
          </View>
        </TouchableOpacity>

        {/* Ikkilamchi amallar */}
        <View style={styles.card}>
          <ActionRow
            Icon={ClockIcon}
            title={t('207') as string}
            subtitle={t('Amaliyotlar tarixi')}
            onPress={() => onNavigate('HistoryDebt')}
          />
          <View style={styles.divider} />
          <ActionRow
            Icon={GridIcon}
            title={t('795') as string}
            subtitle={t('QR-kod orqali tez')}
            onPress={() => onNavigate('QrScan')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default DebtLanding;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(20), gap: rs(16) },

  hero: {
    borderRadius: rs(24),
    overflow: 'hidden',
    padding: rs(20),
    alignItems: 'center',
    gap: rs(14),
  },
  heroSub: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.onPrimary,
    textAlign: 'center',
    lineHeight: rs(20),
    paddingHorizontal: rs(8),
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(22),
    height: rs(48),
    borderRadius: rd.radius.pill,
    marginTop: rs(2),
  },
  heroBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.primary,
  },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(6),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingVertical: rs(14),
    paddingHorizontal: rs(10),
  },
  rowIcon: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  rowSub: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: rd.color.border, marginLeft: rs(58) },
});
