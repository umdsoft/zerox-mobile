/**
 * QarzDaftariKiritish.tsx — "Qarz daftariga kiritish" (web pages/qarz-daftari/kiritish.vue).
 *
 * 2 bosqichli oqim:
 *   1) Savdo faoliyati (do'kon)ni tanlash — GET /qarz-daftari/savdo-faoliyat
 *   2) Qarz turini tanlash (berish / olish) → mijozlar ro'yxatiga o'tadi
 *
 * Web rang semantikasi: berish = KO'K, olish = YASHIL.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { enterXodimSession } from '../../../store/api/token/xodimSession';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  StorefrontIcon,
  ChevronRight,
  InfoIcon,
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
  const { t } = useTranslation();
  const preTuri: 'berish' | 'olish' | undefined = route.params?.turi;

  const { data, loading, onRefresh } = useFetch({
    url: `${URL}/qarz-daftari/savdo-faoliyat`,
    method: 'GET',
  });

  // Token konteksti (owner ↔ xodim) o'zgargan bo'lishi mumkin — ekranga har
  // qaytganda do'kon ro'yxatini yangilaymiz (birinchi mount'da useFetch o'zi oladi).
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      onRefresh({});
    }, [onRefresh]),
  );

  const shops: any[] = (data as any)?.data || [];

  // Xodim do'koniga "kirish" (session-swap) davom etayotgan do'kon id'si.
  const [enteringId, setEnteringId] = React.useState<number | null>(null);
  // SS6: do'konlar MODAL tanlagichi ("Barcha do'konlar" cardi bosilganda ochiladi).
  const [shopPicker, setShopPicker] = React.useState(false);

  // Qarz turi (berish/olish) OLDINGI sahifada (Hero tugmasi) allaqachon tanlangan —
  // shu sabab bu yerda TUR TANLASH BOSQICHI YO'Q. Do'kon tanlanishi bilan darhol
  // mijozlar sahifasiga o'tamiz (so'rov bo'yicha).
  const pickShop = async (s: any) => {
    // Xodim do'koni (boshqa egaga tegishli, telefon mosligi) — avval xodim
    // kontekstiga o'tamiz (owner user_id li token), aks holda backend "Ruxsat yo'q"
    // beradi. Web bilan bir xil oqim (POST /qarz-daftari/xodim/enter).
    if (s.is_xodim_role) {
      if (enteringId != null) return;
      setEnteringId(s.id);
      const r = await enterXodimSession(s.id, s.nomi);
      setEnteringId(null);
      if (!r.ok) {
        Toast.show({ type: 'error2', props: { desc: t(r.message || 'Xatolik yuz berdi') } });
        return;
      }
    }
    navigation.navigate('QarzDaftariMijozlar', {
      faoliyat_id: s.id,
      faoliyat_nomi: s.nomi,
      turi: preTuri || 'berish',
    });
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* Sarlavha kirish turiga qarab: "Qarzga berish" / "Qarzga olish"
          (Hero tugmalari doim turi uzatadi); turi yo'q bo'lsa umumiy sarlavha. */}
      <RdHeader
        title={
          preTuri === 'berish'
            ? t('Qarzga berish')
            : preTuri === 'olish'
            ? t('Qarzga olish')
            : t('Daftariga kiritish')
        }
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Eslatma yuqoridan OLINDI -> sahifaning eng pastiga ko'chirildi (so'rov). */}

        {/* 1-bosqich: do'kon tanlash */}
        <View style={styles.stepHead}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>{t('Savdo faoliyati (do‘kon)ni tanlang')}</Text>
        </View>

        {shops.length === 0 ? (
          <View style={styles.emptyCard}>
            <CircleIcon size={rs(56)} bg={rd.color.surfaceAlt}>
              <StorefrontIcon size={rs(28)} color={rd.color.textTertiary} />
            </CircleIcon>
            <Text style={styles.emptyTitle}>{t('Savdo faoliyatingiz hali yo‘q')}</Text>
            <Text style={styles.emptySub}>
              {t('Qarz kiritish uchun avval do‘kon (savdo faoliyati) qo‘shing.')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('QarzDaftariFaoliyat')}
            >
              <PlusIcon size={rs(17)} color={rd.color.onPrimary} />
              <Text style={styles.primaryBtnText}>{t('Savdo faoliyat yaratish')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: rs(10) }}>
            {/* SS6: do'konlar ro'yxati o'rniga BITTA "Barcha do'konlar" cardi —
                bosilganda do'konlar MODAL'da ochiladi (SS1 dagi kabi). */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShopPicker(true)}
              disabled={enteringId != null}
              style={styles.shopCard}
            >
              <CircleIcon size={rs(42)} bg={rd.color.primaryTint}>
                <StorefrontIcon size={rs(20)} color={BLUE} />
              </CircleIcon>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName} numberOfLines={1}>
                  {t('Barcha do‘konlar')}
                </Text>
                <Text style={styles.shopSub} numberOfLines={1}>
                  {t('{{count}} ta do‘kon', { count: shops.length })}
                </Text>
              </View>
              {enteringId != null ? (
                <ActivityIndicator size="small" color={BLUE} />
              ) : (
                <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.addShopBtn}
              onPress={() => navigation.navigate('QarzDaftariFaoliyat')}
            >
              <PlusIcon size={rs(16)} color={BLUE} />
              <Text style={styles.addShopText}>{t('Yangi do‘kon qo‘shish')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Qanday ishlaydi? — tur tanlash bosqichi OLIB TASHLANDI (tur oldingi
            sahifada tanlangan; do'kon bosilsa darhol mijozlar sahifasi ochiladi). */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>{t('Qanday ishlaydi?')}</Text>
          {[
            'Do‘kon (savdo faoliyati)ni tanlang yoki yangisini qo‘shing.',
            'Mijozni tanlang yoki yangisini qo‘shing.',
            'Summa, mahsulot va muddatni kiriting — qarz daftarga saqlanadi.',
          ].map((g, i) => (
            <View key={i} style={styles.guideRow}>
              <View style={styles.guideNum}>
                <Text style={styles.guideNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.guideText}>{t(g)}</Text>
            </View>
          ))}
        </View>

        {/* Eslatma — endi eng pastda, yangi dizayn: ikonali info-satr
            (chapda doira ikonka + yumshoq fon), amber emas neytral-info. */}
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <InfoIcon size={rs(16)} color={AMBER} />
          </View>
          <Text style={styles.noteText}>
            {t('Qarz daftariga kiritilgan qarzlar bo‘yicha qarz shartnomasi rasmiylashtirilmaydi. Rasmiy shartnoma uchun «Qarz shartnomasi» bo‘limidan foydalaning.')}
          </Text>
        </View>
      </ScrollView>

      {/* SS6: do'kon tanlash MODALI ("Viloyatni tanlang" uslubida). */}
      <Modal
        visible={shopPicker}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShopPicker(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShopPicker(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Do‘konni tanlang')}</Text>
              <TouchableOpacity
                onPress={() => setShopPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={shops}
              keyExtractor={(item: any, i: number) => String(item?.id ?? i)}
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
              ItemSeparatorComponent={() => <View style={styles.modalSep} />}
              renderItem={({ item: s }: any) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.modalRow}
                  disabled={enteringId != null}
                  onPress={() => { setShopPicker(false); pickShop(s); }}
                >
                  <CircleIcon size={rs(36)} bg={rd.color.primaryTint}>
                    <StorefrontIcon size={rs(18)} color={BLUE} />
                  </CircleIcon>
                  <View style={{ flex: 1, marginLeft: rs(10) }}>
                    <Text style={styles.modalRowText} numberOfLines={1}>{s.nomi}</Text>
                    {s.is_xodim_role ? (
                      <View style={styles.xodimBadge}>
                        <Text style={styles.xodimBadgeText}>{t('Xodim')}</Text>
                      </View>
                    ) : (
                      <Text style={styles.shopSub} numberOfLines={1}>
                        {[s.region, s.district].filter(Boolean).join(', ') || t('Do‘kon')}
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default QarzDaftariKiritish;

const styles = StyleSheet.create({
  // SS6: do‘kon tanlash modali (QarzDaftariFaoliyat picker uslubi).
  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(22) },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,18,32,0.6)' },
  modalCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(16),
    paddingBottom: rs(14),
    paddingHorizontal: rs(16),
    maxHeight: '70%',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  modalTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  modalClose: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.textTertiary, paddingHorizontal: rs(4) },
  modalList: { flexGrow: 0 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: rs(12), paddingHorizontal: rs(10), borderRadius: rs(12) },
  modalSep: { height: 1, backgroundColor: rd.color.border, marginHorizontal: rs(10) },
  modalRowText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(14),
  },

  // Eslatma (yangi dizayn) — sahifa pastida, ikonali info-satr. Amber-doira
  // ikonka + yumshoq surfaceAlt fon + neytral matn (ilgari to'liq amber quti edi).
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(10),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rs(14),
    padding: rs(13),
    marginTop: rs(2),
  },
  noteIcon: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textSecondary,
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
