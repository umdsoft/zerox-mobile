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
  Animated,
  Easing,
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
  IconProps,
  PlusIcon,
  SearchIcon,
  UsersIcon,
  QrScanIcon,
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

// Animatsiyali hero: markazdagi strelka up=berish bo'lsa YUQORIga harakatlanib yo'qoladi
// va PASTdan qayta paydo bo'ladi (olishда teskari); atrofdagi kichik doirachalar
// (sayyoralar) katta doira atrofida aylanib turadi.
const DebtHero = ({ up }: { up: boolean }) => {
  const arrow = React.useRef(new Animated.Value(0)).current;
  const orbit = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.loop(
      Animated.timing(arrow, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    const o = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    a.start();
    o.start();
    return () => {
      a.stop();
      o.stop();
    };
  }, [arrow, orbit]);

  const SIZE = rs(152);
  const BIG = rs(92);
  const ORBIT_R = rs(64);
  const DIST = rs(15);

  const translateY = arrow.interpolate({
    inputRange: [0, 1],
    outputRange: up ? [DIST, -DIST] : [-DIST, DIST],
  });
  const opacity = arrow.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });
  const rotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dots = [
    { angle: 20, r: rs(6.5), o: 0.9 },
    { angle: 105, r: rs(4.5), o: 0.6 },
    { angle: 165, r: rs(5.5), o: 0.8 },
    { angle: 250, r: rs(4), o: 0.5 },
    { angle: 315, r: rs(7), o: 0.85 },
  ];

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Statik halqalar */}
      <View style={[styles.heroRing, { width: rs(144), height: rs(144), borderRadius: rs(72), borderColor: 'rgba(255,255,255,0.12)' }]} />
      <View style={[styles.heroRing, { width: rs(116), height: rs(116), borderRadius: rs(58), borderColor: 'rgba(255,255,255,0.2)' }]} />

      {/* Aylanuvchi kichik doirachalar (sayyoralar) */}
      <Animated.View style={{ position: 'absolute', width: SIZE, height: SIZE, transform: [{ rotate }] }}>
        {dots.map((d, i) => {
          const rad = (d.angle * Math.PI) / 180;
          const left = SIZE / 2 + ORBIT_R * Math.cos(rad) - d.r;
          const top = SIZE / 2 + ORBIT_R * Math.sin(rad) - d.r;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left,
                top,
                width: d.r * 2,
                height: d.r * 2,
                borderRadius: d.r,
                backgroundColor: `rgba(255,255,255,${d.o})`,
              }}
            />
          );
        })}
      </Animated.View>

      {/* Markaziy oq doira + strelka */}
      <View style={[styles.heroBig, { width: BIG, height: BIG, borderRadius: BIG / 2 }]}>
        <View style={[styles.heroDash, { width: rs(66), height: rs(66), borderRadius: rs(33) }]} />
        <Animated.View style={{ transform: [{ translateY }], opacity }}>
          <Svg width={rs(36)} height={rs(36)} viewBox="0 0 24 24" fill="none">
            <Path d={up ? 'M12 19 V5' : 'M12 5 V19'} stroke={rd.color.primary} strokeWidth={2.6} strokeLinecap="round" />
            <Path
              d={up ? 'M6.5 10.5 L12 5 L17.5 10.5' : 'M6.5 13.5 L12 19 L17.5 13.5'}
              stroke={rd.color.primary}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Aksent (+) nishoni */}
      <View style={styles.heroPlus}>
        <PlusIcon size={rs(16)} color={rd.color.onPrimary} />
      </View>
    </View>
  );
};

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
          <DebtHero up={type === 1} />
          <Text style={styles.heroSub}>{subtitle}</Text>
          <View style={styles.heroBtn}>
            <SearchIcon size={rs(18)} color={rd.color.primary} />
            <Text style={styles.heroBtnText}>{t('621')}</Text>
          </View>
        </TouchableOpacity>

        {/* Saqlangan foydalanuvchilar — KO'K card, matn MARKAZDA (so'rov bo'yicha) */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.savedCard}
          onPress={() => onNavigate('HistoryDebt')}
        >
          <View style={styles.savedIcon}>
            <UsersIcon size={rs(22)} color={rd.color.onPrimary} />
          </View>
          <Text style={styles.savedTitle}>{t('207')}</Text>
        </TouchableOpacity>

        {/* QR-kodni skaner qilish — ALOHIDA card; katta QR ikonka PASTDA (bo'sh joyni to'ldiradi) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.qrCard}
          onPress={() => onNavigate('QrScan')}
        >
          <Text style={styles.qrTitle}>{t('795')}</Text>
          <View style={styles.qrIconWrap}>
            <QrScanIcon size={rs(104)} color={rd.color.primary} strokeWidth={1.8} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default DebtLanding;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { flexGrow: 1, paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(20), gap: rs(14) },

  // Saqlangan foydalanuvchilar — KO'K card, kontent MARKAZDA
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(12),
    backgroundColor: rd.color.primary,
    borderRadius: rs(18),
    paddingVertical: rs(16),
    paddingHorizontal: rs(14),
  },
  savedIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTitle: { fontFamily: rd.font.semibold, fontSize: rs(15.5), color: rd.color.onPrimary },

  // QR card — flex bilan qolgan balandlikni to'ldiradi; katta ikonka markazda-pastda
  qrCard: {
    flex: 1,
    minHeight: rs(190),
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingTop: rs(18),
    paddingHorizontal: rs(16),
    alignItems: 'center',
  },
  qrTitle: { fontFamily: rd.font.semibold, fontSize: rs(15.5), color: rd.color.text, textAlign: 'center' },
  qrIconWrap: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },

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

  // Animatsiyali hero elementlari
  heroRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  heroBig: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDash: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(47,111,237,0.18)',
  },
  heroPlus: {
    position: 'absolute',
    right: rs(24),
    bottom: rs(26),
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
