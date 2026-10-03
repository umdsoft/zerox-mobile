/**
 * ContractsSwipeList.tsx — 03.10 (1-band): "Shartnomalar" ro'yxati (ShowUserDetails).
 *
 * Ilgari holat filtri (Barchasi / Tugallangan / Jarayonda / Rad etilgan) FAQAT chip bosib
 * almashardi. Endi ro'yxatni chapga/o'ngga SURISH bilan ham almashadi — pastki asosiy
 * menyudagi 5 bo'lim kabi: o'sha `material-top-tabs` ishlatadigan `react-native-pager-view`.
 *   • har sahifa — o'z filtridagi ro'yxat ("Yana ko'rsatish" har filtr uchun alohida);
 *   • sahifa balandligi kontentga moslashadi: har sahifa o'lchanadi, surish paytida
 *     balandlik qo'shni sahifalar orasida silliq o'zgaradi (Animated, JS — qayta render yo'q);
 *   • chiplar surish bilan SINXRON: faol chip belgilanadi va ko'rinadigan joyga suriladi;
 *     chip bosilsa — sahifa animatsiya bilan almashadi.
 * Tashqi ScrollView (ScreenLayout) vertikal aylantirishni saqlaydi: PagerView faqat
 * gorizontal harakatni oladi.
 */
import React from 'react';
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PagerView, {
  PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';
import { t } from 'i18next';
import { rd, rs } from '../../theme/rd';
import AnimatedEmpty from '../components/AnimatedEmpty';
import { sortMoneyText } from '../components/StatisticCard';
import { ChevronRight, ContractIcon } from '../home/redesign/icons';

// SS-E: shartnoma holati REAL statusdan (backend CONTRACT_STATUS):
// 0=Kutilmoqda, 1=Jarayonda(faol), 2=Tugallangan, 3=Bekor qilingan, 4=Rad etilgan,
// 5=Muddati o'tgan, 10=O'chirilgan.
export const contractStatusMeta = (
  status: any,
  tr: any,
): { label: string; color: string } => {
  const s = Number(status);
  if (s === 2) return { label: tr('198'), color: '#16a34a' }; // Tugallangan
  if (s === 3 || s === 4) return { label: tr('261'), color: '#dc2626' }; // Bekor/Rad etilgan
  if (s === 5) return { label: tr('Muddati o‘tgan'), color: '#dc2626' };
  if (s === 10) return { label: tr('O‘chirilgan'), color: '#94a3b8' };
  if (s === 0) return { label: tr('Kutilmoqda'), color: '#f59e0b' };
  return { label: tr('195'), color: '#f59e0b' }; // Jarayonda (1)
};

// 02.10: filtr kaliti — 2 = tugallangan; 3/4 = rad etilgan; 0/1/5 = jarayonda;
// 10 (o'chirilgan) faqat "Barchasi"da.
export type ContractFilter = 'all' | 'completed' | 'active' | 'rejected';
export const contractFilterKey = (status: any): ContractFilter | 'other' => {
  const s = Number(status);
  if (s === 2) return 'completed';
  if (s === 3 || s === 4) return 'rejected';
  if (s === 0 || s === 1 || s === 5) return 'active';
  return 'other';
};
export const CONTRACT_FILTERS: { key: ContractFilter; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'completed', label: 'Tugallangan' },
  { key: 'active', label: 'Jarayonda' },
  { key: 'rejected', label: 'Rad etilgan' },
];
export const filterContracts = (rows: any[], k: ContractFilter): any[] =>
  k === 'all' ? rows : rows.filter(c => contractFilterKey(c?.status) === k);

// Ro'yxat bosqichma-bosqich ochiladi (uzun ro'yxat bir zumda chizilmasin).
const CONTRACTS_PAGE = 20;
// O'lchanmagan sahifa uchun vaqtinchalik balandlik (birinchi kadrda sakrash kichik bo'lsin).
const FALLBACK_PAGE_HEIGHT = rs(160);
// Faol chip ko'rinadigan joyga surilganda chap chetdan qoldiriladigan bo'shliq.
const CHIP_SCROLL_INSET = rs(14);

type Props = {
  contracts: any[];
  filter: ContractFilter;
  counts: Record<ContractFilter, number>;
  onFilterChange: (k: ContractFilter) => void;
  onOpen: (c: any) => void;
};

const ContractRow = ({ c, onOpen }: { c: any; onOpen: (c: any) => void }) => {
  const m = contractStatusMeta(c?.status, t);
  const dir =
    c?.direction === 'lent'
      ? t('Berilgan')
      : c?.direction === 'borrowed'
      ? t('Olingan')
      : '';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.contractRow, styles.contractDivider]}
      onPress={() => onOpen(c)}
    >
      <View style={styles.contractIcon}>
        <ContractIcon size={rs(18)} color={rd.color.primary} />
      </View>
      <View style={styles.flex}>
        <Text
          allowFontScaling={false}
          style={styles.contractNumber}
          numberOfLines={1}
        >
          {c?.number ? `№ ${c.number}` : t('Shartnoma')}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={styles.contractMeta}
        >
          <Text style={{ color: m.color }}>{m.label}</Text>
          {dir ? ` · ${dir}` : ''}
        </Text>
      </View>
      <View style={styles.contractRight}>
        <Text
          allowFontScaling={false}
          style={styles.contractAmount}
          numberOfLines={1}
        >
          {sortMoneyText(c?.amount) || 0} {c?.currency || ''}
        </Text>
        <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

/** Bitta sahifa — filtrlangan ro'yxat + "Yana ko'rsatish"; tabiiy balandligi o'lchanadi. */
const ContractPage = ({
  rows,
  visible,
  onMore,
  onOpen,
  onHeight,
}: {
  rows: any[];
  visible: number;
  onMore: () => void;
  onOpen: (c: any) => void;
  onHeight: (h: number) => void;
}) => (
  <View
    collapsable={false}
    onLayout={(e: LayoutChangeEvent) => onHeight(e.nativeEvent.layout.height)}
  >
    {rows.length === 0 ? (
      <AnimatedEmpty
        variant="loan"
        compact
        text={t('Bu holatdagi shartnomalar yo‘q')}
      />
    ) : (
      rows
        .slice(0, visible)
        .map((c, i) => <ContractRow key={c?.id ?? i} c={c} onOpen={onOpen} />)
    )}
    {rows.length > visible && (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onMore}
        style={styles.moreBtn}
      >
        <Text allowFontScaling={false} style={styles.moreText}>
          {t('Yana ko‘rsatish')} ({rows.length - visible})
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const ContractsSwipeList = ({
  contracts,
  filter,
  counts,
  onFilterChange,
  onOpen,
}: Props) => {
  const initialIndex = Math.max(
    0,
    CONTRACT_FILTERS.findIndex(f => f.key === filter),
  );
  const pagerRef = React.useRef<PagerView>(null);
  const chipScrollRef = React.useRef<ScrollView>(null);
  const chipX = React.useRef<Record<string, number>>({});
  // 03.10: surish jarayoni (sahifa + ulush) — balandlik interpolatsiyasi uchun.
  const position = React.useRef(new Animated.Value(initialIndex)).current;
  const offset = React.useRef(new Animated.Value(0)).current;
  const [heights, setHeights] = React.useState<Record<string, number>>({});
  const [visible, setVisible] = React.useState<Record<string, number>>({});

  const pages = React.useMemo(
    () =>
      CONTRACT_FILTERS.map(f => ({
        ...f,
        rows: filterContracts(contracts, f.key),
      })),
    [contracts],
  );

  const height = React.useMemo(() => {
    const out = CONTRACT_FILTERS.map(
      f => heights[f.key] || FALLBACK_PAGE_HEIGHT,
    );
    return Animated.add(position, offset).interpolate({
      inputRange: CONTRACT_FILTERS.map((_, i) => i),
      outputRange: out,
      extrapolate: 'clamp',
    });
  }, [heights, position, offset]);

  const onPageScroll = React.useMemo(
    () =>
      Animated.event([{ nativeEvent: { position, offset } }], {
        useNativeDriver: false,
      }),
    [position, offset],
  );

  // Faol chip ko'rinadigan joyga (chap chetga yaqin) suriladi.
  React.useEffect(() => {
    const x = chipX.current[filter];
    if (x == null) return;
    chipScrollRef.current?.scrollTo({
      x: Math.max(0, x - CHIP_SCROLL_INSET),
      animated: true,
    });
  }, [filter]);

  const onPageSelected = (e: PagerViewOnPageSelectedEvent) => {
    const k = CONTRACT_FILTERS[e.nativeEvent.position]?.key;
    if (k && k !== filter) onFilterChange(k);
  };

  const onChip = (i: number) => {
    const k = CONTRACT_FILTERS[i].key;
    if (k !== filter) onFilterChange(k);
    pagerRef.current?.setPage(i);
  };

  const setPageHeight = (k: string, h: number) => {
    const r = Math.ceil(h);
    setHeights(prev => (prev[k] === r ? prev : { ...prev, [k]: r }));
  };

  return (
    <>
      <ScrollView
        ref={chipScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {CONTRACT_FILTERS.map((f, i) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.85}
              onPress={() => onChip(i)}
              onLayout={e => {
                chipX.current[f.key] = e.nativeEvent.layout.x;
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {t(f.label)}
              </Text>
              <View
                style={[styles.filterBadge, active && styles.filterBadgeActive]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.filterBadgeText,
                    active && styles.filterBadgeTextActive,
                  ]}
                >
                  {counts[f.key]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 03.10: chap/o'ngga surish — filtr almashadi (pastki menyu bilan bir xil PagerView). */}
      <Animated.View style={[styles.pagerWrap, { height }]}>
        <PagerView
          ref={pagerRef}
          style={styles.flex}
          initialPage={initialIndex}
          overdrag
          onPageScroll={onPageScroll}
          onPageSelected={onPageSelected}
        >
          {pages.map(p => (
            <View key={p.key} collapsable={false} style={styles.page}>
              <ContractPage
                rows={p.rows}
                visible={visible[p.key] || CONTRACTS_PAGE}
                onMore={() =>
                  setVisible(prev => ({
                    ...prev,
                    [p.key]: (prev[p.key] || CONTRACTS_PAGE) + CONTRACTS_PAGE,
                  }))
                }
                onOpen={onOpen}
                onHeight={h => setPageHeight(p.key, h)}
              />
            </View>
          ))}
        </PagerView>
      </Animated.View>
    </>
  );
};

export default ContractsSwipeList;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Sahifalar karta ichki chetiga qadar (kartaning yon padding'i — 14).
  pagerWrap: { marginHorizontal: rs(-14), overflow: 'hidden' },
  page: { flex: 1, paddingHorizontal: rs(14) },
  // 02.10: holat filtri chip'lari (SearchDebitor tablari uslubida).
  filterScroll: { marginHorizontal: rs(-14) },
  filterRow: { paddingHorizontal: rs(14), gap: rs(8), paddingBottom: rs(10) },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(12),
    height: rs(34),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  filterChipActive: {
    backgroundColor: rd.color.primary,
    borderColor: rd.color.primary,
  },
  filterText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
  },
  filterTextActive: { fontFamily: rd.font.semibold, color: rd.color.onPrimary },
  filterBadge: {
    minWidth: rs(20),
    height: rs(20),
    paddingHorizontal: rs(6),
    borderRadius: rs(10),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: { backgroundColor: rd.color.onPrimaryChip },
  filterBadgeText: {
    fontFamily: rd.font.bold,
    fontSize: rs(11),
    color: rd.color.textSecondary,
  },
  filterBadgeTextActive: { color: rd.color.onPrimary },
  moreBtn: {
    alignItems: 'center',
    paddingVertical: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  moreText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.primary,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingVertical: rs(12),
  },
  contractDivider: { borderTopWidth: 1, borderTopColor: rd.color.border },
  contractIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractNumber: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
  },
  contractMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  contractRight: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  contractAmount: {
    fontFamily: rd.font.bold,
    fontSize: rs(13.5),
    color: rd.color.text,
  },
});
