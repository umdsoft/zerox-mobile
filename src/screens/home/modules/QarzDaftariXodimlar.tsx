/**
 * QarzDaftariXodimlar.tsx — do'kon (savdo faoliyati) xodimlari ro'yxati + boshqaruv.
 *
 * Web ekvivalenti: pages/qarz-daftari/faoliyat/_id/xodimlar.vue +
 * components/qarz-daftari/XodimModal.vue. Do'kon egasi xodim qo'shadi/tahrirlaydi/
 * o'chiradi. Xodim o'z telefon raqami orqali tizimga kirib do'kon qarz daftarini yuritadi.
 *
 * Route params: { faoliyat_id, faoliyat_nomi? }
 *
 * GET    /qarz-daftari/savdo-faoliyat/:faoliyat_id/xodimlar  -> { success, data: [...] }
 * POST   /qarz-daftari/savdo-faoliyat/:faoliyat_id/xodimlar  { fish, telefon, login_active }
 * PUT    /qarz-daftari/xodimlar/:id                          { fish, telefon, login_active }
 * DELETE /qarz-daftari/xodimlar/:id
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import {
  StorefrontIcon,
  CheckIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from '../redesign/icons';

const BLUE = '#2f6fed';

const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// login_active ni bardoshli o'qish (boolean / 0-1 / '0'-'1' / undefined).
const isActive = (v: any) => v !== false && Number(v) !== 0;

// Telefonni +998 dan keyingi 9 raqamga ajratamiz (tahrirlashda old to'ldirish uchun).
const parsePhone9 = (tel?: string) => {
  let d = String(tel || '').replace(/[^\d]/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  return d.slice(0, 9);
};

const ListSeparator = () => <View style={{ height: rs(12) }} />;

const QarzDaftariXodimlar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const faoliyat_id = route.params?.faoliyat_id;
  const faoliyat_nomi: string | undefined = route.params?.faoliyat_nomi;
  const { t } = useTranslation();

  // SS-L3: "xodim qo'shish"ni ifodalovchi ANIMATSIYALI ikonka (bo'sh holat uchun) —
  // yumshoq pulsatsiya (Lottie aktivi yo'q, native driver bilan arzon).
  const pulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const pulseStyle = {
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
  };

  const { data, loading, onRefresh } = useFetch({
    url: `${URL}/qarz-daftari/savdo-faoliyat/${faoliyat_id}/xodimlar`,
    method: 'GET',
  });

  // Ekranga QAYTA fokuslanganda ro'yxatni yangilaymiz. Birinchi mount'da useFetch
  // o'zi yuklaydi, shu bois birinchi fokusni o'tkazib yuboramiz (ikki marta yuklamaslik).
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

  const list: any[] = (data as any)?.data || [];


  // O'chirish tasdiqlash holati.
  const [confirmTarget, setConfirmTarget] = React.useState<any>(null);
  const [deleting, setDeleting] = React.useState(false);

  // SS4: forma endi ALOHIDA SAHIFA (QarzDaftariXodimYangi). Ilgari `<Modal
  // animationType="slide">` edi — pastdan chiqardi va Toast modal ORTIDA qolardi.
  const openAdd = () => {
    navigation.navigate('QarzDaftariXodimYangi', { faoliyat_id, faoliyat_nomi });
  };

  const openEdit = (x: any) => {
    navigation.navigate('QarzDaftariXodimYangi', { faoliyat_id, faoliyat_nomi, xodim: x });
  };

  const handleDelete = async () => {
    if (!confirmTarget || deleting) return;
    try {
      setDeleting(true);
      const token = storage.getString('token');
      await axios.delete(`${URL}/qarz-daftari/xodimlar/${confirmTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Toast.show({ type: 'omad', position: 'bottom', props: { desc: t('Xodim o‘chirildi.') } });
      setConfirmTarget(null);
      onRefresh({});
    } catch (e: any) {
      Toast.show({
        type: 'error2',
        props: { desc: e?.response?.data?.message || t('Xatolik yuz berdi') },
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderItem = React.useCallback(
    ({ item: x }: { item: any }) => {
      const fishName = titleCase(x?.fish);
      const active = isActive(x?.login_active);
      const st = active
        ? { label: t('Faol'), color: rd.color.success }
        : { label: t('Bloklangan'), color: rd.color.error };
      return (
        <View style={styles.row}>
          <View style={styles.avatar}>
            <UsersIcon size={rs(20)} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName} numberOfLines={1}>
              {fishName}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {x?.telefon || '—'}
            </Text>
            <View style={[styles.stPill, { backgroundColor: st.color + '1A' }]}>
              <Text style={[styles.stPillText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <View style={styles.rowActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actIcon}
              onPress={() => openEdit(x)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <PencilIcon size={rs(18)} color={BLUE} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.actIcon, styles.actIconDanger]}
              onPress={() => setConfirmTarget(x)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <TrashIcon size={rs(18)} color={rd.color.error} />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [t],
  );

  const keyExtractor = React.useCallback(
    (x: any, i: number) => String(x?.id ?? i),
    [],
  );

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS-L1: orqaga tugma yonida "Xodim qo'shish" (Xodimlar+do'kon nomi pastga ko'chdi). */}
      <RdHeader title={t('Xodim qo‘shish')} />

      <FlatList
        style={styles.scroll}
        data={list}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
        ItemSeparatorComponent={ListSeparator}
        ListHeaderComponent={
          /* SS-L2/L5: "Xodimlar" + do'kon nomi + saytdagi izoh — sarlavhadan PASTDA. */
          /* SS7: "Xodimlar" so'zi OLIB TASHLANdi — do'kon nomi + izoh qoladi. */
          <View style={styles.secWrap}>
            {/* SS3: do'kon nomidan OLDIN rangli do'kon ikonasi. */}
            {!!faoliyat_nomi && (
              <View style={styles.secShopRow}>
                <View style={styles.secShopIcon}>
                  <StorefrontIcon size={rs(16)} color={BLUE} />
                </View>
                <Text style={styles.secShop} numberOfLines={1}>{faoliyat_nomi}</Text>
              </View>
            )}
            <Text style={styles.secSub}>{t('Savdo faoliyatiga biriktirilgan xodimlar')}</Text>
          </View>
        }
        ListEmptyComponent={
          /* SS-L3: xodim yo'q bo'lsa — xodim qo'shishni ifodalovchi ANIMATSIYALI ikonka. */
          <View style={styles.emptyBox}>
            <Animated.View style={[styles.emptyCircle, pulseStyle]}>
              <UsersIcon size={rs(30)} color={rd.color.primary} />
            </Animated.View>
            <Text style={styles.emptyText}>{t('Hali xodim yo‘q')}</Text>
          </View>
        }
        ListFooterComponent={
          /* SS-L4: "Yangi xodim qo'shish" tugmasi ENG PASTDA. */
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.newBtn}
            onPress={openAdd}
          >
            <PlusIcon size={rs(18)} color="#fff" />
            <Text style={styles.newBtnText}>{t('Yangi xodim qo‘shish')}</Text>
          </TouchableOpacity>
        }
      />

      {/* SS8a: forma ALOHIDA SAHIFA — orqa fon blur/backdrop YO'Q, to'liq ekran. */}
      {/* SS4: xodim formasi MODALDAN ALOHIDA SAHIFAGA ko‘chdi
          (QarzDaftariXodimYangi) — pastdan chiqmaydi va Toast ko‘rinadi. */}

      {/* O'chirish tasdiqlash modali. */}
      <Modal
        visible={!!confirmTarget}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => (deleting ? null : setConfirmTarget(null))}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => (deleting ? null : setConfirmTarget(null))}
          />
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <TrashIcon size={rs(26)} color={rd.color.error} />
            </View>
            <Text style={styles.confirmTitle}>{t('Xodimni o‘chirmoqchimisiz?')}</Text>
            {!!confirmTarget?.fish && (
              <Text style={styles.confirmName} numberOfLines={1}>
                {titleCase(confirmTarget.fish)}
              </Text>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.mBtn, styles.mBtnGhost]}
                onPress={() => setConfirmTarget(null)}
                disabled={deleting}
              >
                <Text style={styles.mBtnGhostText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.mBtn, styles.mBtnDanger, deleting && { opacity: 0.7 }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.mBtnPrimaryText}>{t('O‘chirish')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default QarzDaftariXodimlar;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    flexGrow: 1,
  },
  headerWrap: { marginBottom: rs(12) },
  // SS-L2/L5: "Xodimlar" + do'kon nomi + saytdagi izoh (sarlavhadan pastda)
  secWrap: { marginBottom: rs(14) },
  secTitle: { fontFamily: rd.font.bold, fontSize: rs(18), color: rd.color.text },
  // SS3: do‘kon nomi qatori (ikonka + nom)
  secShopRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  secShopIcon: {
    width: rs(26), height: rs(26), borderRadius: rs(13),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  secShop: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.primary },
  secSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(4), lineHeight: rs(17) },

  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    backgroundColor: BLUE,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(14),
    // SS-L4: tugma endi ro'yxatdan KEYIN (pastda) — ajratish uchun.
    marginTop: rs(18),
  },
  newBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  avatar: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: BLUE + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  rowMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  stPill: {
    alignSelf: 'flex-start',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(9),
    paddingVertical: rs(3),
    marginTop: rs(6),
  },
  stPillText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },

  rowActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  actIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(12),
    backgroundColor: BLUE + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actIconDanger: { backgroundColor: rd.color.errorBg },

  emptyBox: { alignItems: 'center', gap: rs(12), paddingVertical: rs(30) },
  emptyCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textTertiary },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    backgroundColor: BLUE,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(13),
    paddingHorizontal: rs(22),
    marginTop: rs(4),
  },

  // Modal (forma + tasdiqlash)
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(22),
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,18,32,0.6)',
  },
  // SS8a: forma ALOHIDA SAHIFA sifatida (backdrop/blur yo'q)
  pageRoot: { flex: 1, backgroundColor: rd.color.page },
  pageContent: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(28) },
  modalCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(16),
    paddingBottom: rs(16),
    paddingHorizontal: rs(18),
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  modalTitle: {
    flex: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  modalSubtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
    marginTop: rs(6),
    marginBottom: rs(4),
  },

  label: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    marginTop: rs(8),
    marginBottom: rs(6),
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
  },
  input: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
    paddingVertical: rs(13),
  },
  phonePrefix: {
    fontFamily: rd.font.bold,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
  },
  hint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(6),
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    marginTop: rs(14),
  },
  checkbox: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(6),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    color: rd.color.text,
  },

  modalBtns: { flexDirection: 'row', gap: rs(10), marginTop: rs(18) },
  mBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.radius.pill,
    paddingVertical: rs(13),
  },
  mBtnGhost: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
  },
  mBtnGhostText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.textSecondary },
  mBtnPrimary: { backgroundColor: BLUE },
  mBtnPrimaryText: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: '#fff' },
  mBtnDanger: { backgroundColor: rd.color.error },

  // O'chirish tasdiqlash kartasi
  confirmCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    padding: rs(20),
    alignItems: 'center',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  confirmIcon: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: rd.color.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
  },
  confirmTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
  },
  confirmName: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    marginTop: rs(4),
  },
});
