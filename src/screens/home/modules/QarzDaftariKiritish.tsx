/**
 * QarzDaftariKiritish.tsx — "Qarz daftariga kiritish" (web pages/qarz-daftari/kiritish.vue).
 *
 * 2 bosqichli oqim:
 *   1) Savdo faoliyati (do'kon)ni tanlash — GET /qarz-daftari/savdo-faoliyat
 *   2) Qarz turini tanlash (berish / olish) → mijozlar ro'yxatiga o'tadi
 *
 * Web rang semantikasi: berish = KO'K, olish = YASHIL.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BuildingIcon,
  ChevronRight,
  PlusIcon,
} from '../redesign/icons';

const BLUE = '#2f6fed';
const GREEN = '#16a34a';
const AMBER = '#f59e0b';

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

const QarzDaftariKiritish = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const preTuri: 'berish' | 'olish' | undefined = route.params?.turi;

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/savdo-faoliyat`,
    method: 'GET',
  });

  const shops: any[] = (data as any)?.data || [];
  const [selected, setSelected] = React.useState<any>(null);

  // Do'kon bitta bo'lsa — avtomatik tanlaymiz (ortiqcha bosish shart emas).
  React.useEffect(() => {
    if (!selected && shops.length === 1) setSelected(shops[0]);
  }, [shops, selected]);

  const goMijozlar = (turi: 'berish' | 'olish') => {
    if (!selected) return;
    navigation.navigate('QarzDaftariMijozlar', {
      faoliyat_id: selected.id,
      faoliyat_nomi: selected.nomi,
      turi,
    });
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title="Daftariga kiritish" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Ogohlantirish */}
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            Qarz daftariga kiritilgan qarzlar bo‘yicha qarz shartnomasi
            rasmiylashtirilmaydi. Rasmiy shartnoma uchun «Qarz shartnomasi» bo‘limidan
            foydalaning.
          </Text>
        </View>

        {/* 1-bosqich: do'kon tanlash */}
        <View style={styles.stepHead}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Savdo faoliyati (do‘kon)ni tanlang</Text>
        </View>

        {shops.length === 0 ? (
          <View style={styles.emptyCard}>
            <CircleIcon size={rs(56)} bg={rd.color.surfaceAlt}>
              <BuildingIcon size={rs(28)} color={rd.color.textTertiary} />
            </CircleIcon>
            <Text style={styles.emptyTitle}>Savdo faoliyatingiz hali yo‘q</Text>
            <Text style={styles.emptySub}>
              Qarz kiritish uchun avval do‘kon (savdo faoliyati) qo‘shing.
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('QarzDaftariFaoliyat')}
            >
              <PlusIcon size={rs(17)} color={rd.color.onPrimary} />
              <Text style={styles.primaryBtnText}>Savdo faoliyat yaratish</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: rs(10) }}>
            {shops.map((s, i) => {
              const active = selected?.id === s.id;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.85}
                  onPress={() => setSelected(s)}
                  style={[styles.shopCard, active && styles.shopCardActive]}
                >
                  <CircleIcon
                    size={rs(42)}
                    bg={active ? BLUE : rd.color.surfaceAlt}
                  >
                    <BuildingIcon
                      size={rs(20)}
                      color={active ? '#fff' : rd.color.textSecondary}
                    />
                  </CircleIcon>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shopName} numberOfLines={1}>
                      {s.nomi}
                    </Text>
                    {s.is_xodim_role ? (
                      <View style={styles.xodimBadge}>
                        <Text style={styles.xodimBadgeText}>Xodim</Text>
                      </View>
                    ) : (
                      <Text style={styles.shopSub} numberOfLines={1}>
                        {[s.region, s.district].filter(Boolean).join(', ') || 'Do‘kon'}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.addShopBtn}
              onPress={() => navigation.navigate('QarzDaftariFaoliyat')}
            >
              <PlusIcon size={rs(16)} color={BLUE} />
              <Text style={styles.addShopText}>Yangi do‘kon qo‘shish</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2-bosqich: qarz turi */}
        {!!selected && (
          <>
            <View style={[styles.stepHead, { marginTop: rs(8) }]}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Qarz turini tanlang</Text>
            </View>

            <View style={styles.typeRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.typeCard, { borderColor: BLUE }]}
                onPress={() => goMijozlar('berish')}
              >
                <CircleIcon size={rs(46)} bg="#EFF6FF">
                  <ArrowUpRight size={rs(22)} color={BLUE} />
                </CircleIcon>
                <Text style={styles.typeTitle}>Qarzga berish</Text>
                <Text style={styles.typeNote}>Mijozga qarz berish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.typeCard, { borderColor: GREEN }]}
                onPress={() => goMijozlar('olish')}
              >
                <CircleIcon size={rs(46)} bg="#F0FDF4">
                  <ArrowDownLeft size={rs(22)} color={GREEN} />
                </CircleIcon>
                <Text style={styles.typeTitle}>Qarzga olish</Text>
                <Text style={styles.typeNote}>Qarz olishni qayd etish</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Qanday ishlaydi? */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Qanday ishlaydi?</Text>
          {[
            'Do‘kon (savdo faoliyati)ni tanlang yoki yangisini qo‘shing.',
            'Qarz turini (berish/olish) belgilang va mijozni tanlang.',
            'Summa, mahsulot va muddatni kiriting — qarz daftarga saqlanadi.',
          ].map((g, i) => (
            <View key={i} style={styles.guideRow}>
              <View style={styles.guideNum}>
                <Text style={styles.guideNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.guideText}>{g}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default QarzDaftariKiritish;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(14),
  },

  warnBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: rs(14),
    padding: rs(13),
  },
  warnText: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: '#92400E',
    lineHeight: rs(18),
  },

  stepHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  stepBadge: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { fontFamily: rd.font.bold, fontSize: rs(12), color: rd.color.onPrimary },
  stepTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(15.5), color: rd.color.text },

  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  shopCardActive: { borderColor: BLUE, backgroundColor: '#F5F9FF' },
  shopName: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  shopSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  xodimBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    marginTop: rs(3),
  },
  xodimBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(10), color: '#7c3aed' },
  radio: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    borderWidth: 2,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: BLUE },
  radioDot: { width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: BLUE },

  addShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    borderWidth: 1.5,
    borderColor: BLUE,
    borderStyle: 'dashed',
    borderRadius: rs(14),
    paddingVertical: rs(13),
  },
  addShopText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: BLUE },

  typeRow: { flexDirection: 'row', gap: rs(12) },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1.5,
    paddingVertical: rs(20),
    paddingHorizontal: rs(12),
  },
  typeTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text },
  typeNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },

  // Empty
  emptyCard: {
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(28),
    paddingHorizontal: rs(20),
  },
  emptyTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
    marginTop: rs(4),
  },
  emptySub: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
    lineHeight: rs(18),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(18),
    paddingVertical: rs(12),
    marginTop: rs(8),
  },
  primaryBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.onPrimary },

  // Guide
  guideCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    gap: rs(12),
    marginTop: rs(4),
  },
  guideTitle: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10) },
  guideNum: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideNumText: { fontFamily: rd.font.bold, fontSize: rs(11), color: BLUE },
  guideText: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
  },
});
