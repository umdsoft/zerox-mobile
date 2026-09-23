/**
 * QarzDaftariMijozlar.tsx — do'kon + qarz turi bo'yicha mijozlar ro'yxati
 * (web pages/qarz-daftari/faoliyat/_id/berish(olish)/index.vue).
 *
 * GET /qarz-daftari/savdo-faoliyat/:faoliyat_id/mijozlar?turi=  → mijozlar ro'yxati.
 * Har bir mijoz qatori → mijoz tafsilotiga (QarzDaftariMijoz) o'tadi.
 *
 * Web rang semantikasi: berish = KO'K, olish = YASHIL.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { formatMln } from '../../components/StatisticCard';
import { compactKMB } from '../../../helper/money';
import { isXodimSession } from '../../../store/api/token/xodimSession';
import { storage } from '../../../store/api/token/getToken';
import RdHeader from '../redesign/RdHeader';
import {
  StorefrontIcon,
  ChevronRight,
  InfoIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from '../redesign/icons';

const BLUE = '#2f6fed';
const GREEN = '#16a34a';
const AMBER = '#f59e0b';

const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// Satrlar orasidagi 12px oraliq (ilgari ScrollView `gap` bergan edi).
const ListSeparator = () => <View style={{ height: rs(12) }} />;

const QarzDaftariMijozlar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const faoliyat_id = route.params?.faoliyat_id;
  const faoliyat_nomi: string | undefined = route.params?.faoliyat_nomi;
  const turi: 'berish' | 'olish' = route.params?.turi === 'olish' ? 'olish' : 'berish';
  const { t } = useTranslation();

  const { data, loading, onRefresh } = useFetch({
    url: `${URL}/qarz-daftari/savdo-faoliyat/${faoliyat_id}/mijozlar?turi=${turi}`,
    method: 'GET',
  });

  // Ekranga QAYTA fokuslanganda (masalan yangi mijoz qo'shib kelganda) ro'yxatni
  // yangilaymiz — yangi mijoz darrov ko'rinadi. Birinchi mount'da useFetch o'zi
  // yuklaydi, shu bois birinchi fokusni o'tkazib yuboramiz (ikki marta yuklamaslik).
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

  const [search, setSearch] = React.useState('');

  /**
   * Eslatmani KUN OXIRIGACHA yashirish. MMKV'da faqat SANA saqlanadi (YYYY-MM-DD):
   * bugungi sana bilan mos bo'lsa yashirin, ertasi kuni sana farq qiladi va
   * eslatma yana ko'rinadi. Do'kon bo'yicha alohida emas — bu umumiy eslatma.
   */
  const NOTE_KEY = 'qd_note_hidden_day';
  const todayKey = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const [noteHidden, setNoteHidden] = React.useState(() => {
    try { return storage.getString(NOTE_KEY) === todayKey(); } catch { return false; }
  });
  const hideNoteForToday = () => {
    try { storage.set(NOTE_KEY, todayKey()); } catch (_) {}
    setNoteHidden(true);
  };

  const list: any[] = (data as any)?.data || [];
  const accent = turi === 'olish' ? GREEN : BLUE;
  const title = turi === 'olish' ? t('Qarzga olish') : t('Qarzga berish');

  // Statistikalar.
  // K: "Jami qarz" — joriy yil ichida BERILGAN jami qarz (backend jami_uzs/jami_usd,
  // YEAR(berilgan_sana)=joriy yil). "Qoldiq qarz" — jami aktiv qoldiq (doimiy).
  const totalQoldiqUzs = list.reduce((s, c) => s + Number(c?.qoldiq_uzs || 0), 0);
  const totalQoldiqUsd = list.reduce((s, c) => s + Number(c?.qoldiq_usd || 0), 0);
  const totalJamiUzs = list.reduce((s, c) => s + Number(c?.jami_uzs || 0), 0);
  const totalJamiUsd = list.reduce((s, c) => s + Number(c?.jami_usd || 0), 0);
  // SS2-2: "Undirilgan qarz" — mijozlar HAQIQATDA qaytargan summa (backend
  // undirilgan_uzs/usd: (miqdor-qoldiq) dan voz kechilgan AYIRILGAN).
  const totalUndirilganUzs = list.reduce((s, c) => s + Number(c?.undirilgan_uzs || 0), 0);
  const totalUndirilganUsd = list.reduce((s, c) => s + Number(c?.undirilgan_usd || 0), 0);

  const filtered = list.filter(c => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      String(c?.fish || '').toLowerCase().includes(s) ||
      String(c?.telefon || '').includes(s)
    );
  });

  // "Yangi mijoz" -> mijoz qo'shish formasi (SS5). Ilgari faqat "Tez kunda" toast
  // ko'rsatardi; endi haqiqiy sahifa ochiladi. Saqlangach ro'yxatga qaytadi va
  // useFocusEffect orqali yangilanadi (yangi mijoz ro'yxatda ko'rinadi).
  const onYangiMijoz = () =>
    navigation.navigate('QarzDaftariMijozYangi', {
      faoliyat_id,
      faoliyat_nomi,
      turi,
    });

  // FlatList uchun: har bir mijoz qatori (memoizatsiya — qayta render'да funksiya
  // qayta yaratilmaydi). Ilgari ScrollView + .map edi (barcha satrlar birdan
  // render bo'lardi); FlatList virtualizatsiya qiladi -> uzun ro'yxatda tez.
  const renderItem = React.useCallback(
    ({ item: c }: { item: any }) => {
      const fish = titleCase(c?.fish);
      const qoldiqUzs = Number(c?.qoldiq_uzs || 0);
      const qoldiqUsd = Number(c?.qoldiq_usd || 0);
      const active = Number(c?.aktiv_qarz_soni || 0) > 0;
      const st = active
        ? { label: t('Aktiv'), color: AMBER }
        : { label: t('Qarzsiz'), color: rd.color.textTertiary };
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.row}
          onPress={() =>
            // SS7-1 (2026-09-14): mijoz tanlangach TO'G'RIDAN-TO'G'RI qarz
            // formasi ochiladi. Ilgari oraliqda mijoz sahifasi (QarzDaftariMijoz)
            // turardi va foydalanuvchi yana "Yangi qarz"ni bosishiga to'g'ri
            // kelardi — bu ekran "Qarzga berish/olish" AMALI uchun ochilgani
            // uchun ortiqcha qadam edi. Mijoz sahifasi "Berilgan/Olingan
            // qarzlar" ro'yxatidan ochilaveradi (u yerda o'z o'rnida).
            navigation.navigate('QarzDaftariYangi', {
              faoliyat_id: c?.savdo_faoliyat_id ?? faoliyat_id,
              mijoz_id: c.id,
              fish,
              turi,
              // SS7-2: formadagi mijoz cardi qoldiqni ko'rsatishi uchun.
              qoldiq_uzs: qoldiqUzs,
              qoldiq_usd: qoldiqUsd,
            })
          }
        >
          <View style={[styles.avatar, { backgroundColor: accent + '1A' }]}>
            <UserIcon size={rs(20)} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName} numberOfLines={1}>
              {fish}
            </Text>
            {/* Faqat telefon — "N ta qarz" (qarzlar soni) olib tashlandi (so'rov). */}
            <Text style={styles.rowMeta} numberOfLines={1}>
              {c?.telefon || '—'}
            </Text>
            {/* SS26: "Qarzga berish"да mijoz cardida qoldiq summasi KO'RSATILMAYDI
                (yangi qarz beryapmiz, eski qoldiq chalkashtiradi). "olish"да qoladi. */}
            {turi !== 'berish' && (
              <View style={styles.rowAmts}>
                {qoldiqUzs > 0 && (
                  <Text style={styles.rowAmt}>{formatMln(qoldiqUzs)} UZS</Text>
                )}
                {qoldiqUsd > 0 && (
                  <Text style={[styles.rowAmt, { color: GREEN }]}>
                    {formatMln(qoldiqUsd)} USD
                  </Text>
                )}
                {qoldiqUzs === 0 && qoldiqUsd === 0 && (
                  <Text style={styles.rowAmtMuted}>{t('Qoldiq yo‘q')}</Text>
                )}
              </View>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: rs(8) }}>
            <View style={[styles.stPill, { backgroundColor: st.color + '1A' }]}>
              <Text style={[styles.stPillText, { color: st.color }]}>{st.label}</Text>
            </View>
            <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
          </View>
        </TouchableOpacity>
      );
    },
    [accent, turi, navigation, t, faoliyat_id],
  );

  const keyExtractor = React.useCallback(
    (c: any, i: number) => String(c?.id ?? i),
    [],
  );

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={title} />

      <FlatList
        style={styles.scroll}
        data={filtered}
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
          // Element (funksiya EMAS) sifatida beriladi -> qidiruv yozayotganda
          // TextInput reconciliation orqali fokusni SAQLAYDI (remount bo'lmaydi).
          <View style={styles.headerWrap}>
            {/* SS2-3: do'kon nomi KATTAROQ shrift + oldida do'kon ikonasi.
                SS2-4: nomdan keyin tahrirlash ikonasi — bosilsa do'konni tahrirlash
                sahifasi ochiladi (pastdagi tugma bilan bir xil manzil).
                SS2-6: XODIM uchun tahrirlash ikonasi KO'RINMAYDI. */}
            {/* SS2-2: tahrirlash ikonasi endi do'kon-nomi cardidan TASHQARIDA
                (yonida, alohida) va biroz KATTAROQ. */}
            {/* SS14-1: do'kon nomi yonidagi TAHRIRLASH (qalam) ikonasi OLIB
                TASHLANDI — uning funksiyasi bosh sahifadagi "Barcha do'konlar"
                modalidagi do'kon qatorining oxiridagi strelkaga ko'chirildi. */}
            {!!faoliyat_nomi && (
              <View style={styles.shopLine}>
                <View style={styles.shopRow}>
                  <View style={[styles.shopIcon, { backgroundColor: accent + '1A' }]}>
                    <StorefrontIcon size={rs(16)} color={accent} />
                  </View>
                  <Text style={styles.shopChip} numberOfLines={1}>
                    {faoliyat_nomi}
                  </Text>
                </View>
              </View>
            )}

            {/* SS15-3: "Qoldiq qarz" va "Undirilgan qarz" cardlari BU YERDAN
                OLIB TASHLANDI — ular endi "Berilgan/Olingan qarzlar" sahifasida
                (ilgarigi "Jami qoldiq" cardi o'rnida).
                SS14-2: "Xodimlar" va "Karta ulash" tugmalari ham olib tashlandi —
                ular endi "Do'konni tahrirlash" sahifasida. */}

            {/* So'rov (2026-09-13): eslatma endi "Qanday ishlaydi?" dan TEPADA,
                shrifti ~50% kichik va oxirida "Tushundim" tugmasi — bosilsa
                KUN OXIRIGACHA qayta chiqmaydi (ertasi kuni yana ko'rinadi).
                Shu tufayli "Yangi mijoz" va mijozlar ro'yxati yuqoriga ko'tariladi. */}
            {!noteHidden && (
              <View style={styles.noteCard}>
                <View style={styles.noteIcon}>
                  <InfoIcon size={rs(14)} color={AMBER} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteText}>
                    {t('Qarz daftariga kiritilgan qarzlar bo‘yicha qarz shartnomasi rasmiylashtirilmaydi. Rasmiy shartnoma uchun «Qarz shartnomasi» bo‘limidan foydalaning.')}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.noteOkBtn}
                    onPress={hideNoteForToday}>
                    <Text style={styles.noteOkText}>{t('Tushundim')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* "Qanday ishlaydi?" — 1-bosqich ("Do'konni tanlang") OLIB TASHLANDI:
                do'kon allaqachon tanlangan holda bu sahifaga kelinadi. */}
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>{t('Qanday ishlaydi?')}</Text>
              {[
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

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.newBtn, { backgroundColor: accent }]}
              onPress={onYangiMijoz}
            >
              <PlusIcon size={rs(18)} color="#fff" />
              <Text style={styles.newBtnText}>{t('Yangi mijoz')}</Text>
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <SearchIcon size={rs(18)} color={rd.color.textTertiary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('FISh yoki telefon raqami bo‘yicha qidirish')}
                placeholderTextColor={rd.color.textTertiary}
                multiline
                textAlignVertical="center"
                style={styles.searchInput}
              />
            </View>
            <Text style={styles.countText}>{t('{{count}} ta mijoz', { count: filtered.length })}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyCircle}>
              <UserIcon size={rs(24)} color={rd.color.textTertiary} />
            </View>
            <Text style={styles.emptyText}>{t('Mijozlar hali qo‘shilmagan.')}</Text>
          </View>
        }
      />
    </View>
  );
};

export default QarzDaftariMijozlar;

const styles = StyleSheet.create({
  // SS15-5: "Qanday ishlaydi?" + eslatma — uslublar QarzDaftariKiritish'dagi
  // bilan AYNAN bir xil (blok o'sha sahifadan ko'chirildi).
  guideCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    gap: rs(12),
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
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(10),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rs(14),
    padding: rs(13),
  },
  noteIcon: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // So'rov: shrift ~50% kichraydi (12 -> 10) — eslatma joy egallamasin.
  noteText: {
    fontFamily: rd.font.regular,
    fontSize: rs(10),
    color: rd.color.textSecondary,
    lineHeight: rs(14),
  },
  noteOkBtn: {
    alignSelf: 'flex-start',
    marginTop: rs(7),
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  noteOkText: { fontFamily: rd.font.semibold, fontSize: rs(11), color: rd.color.textSecondary },
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    flexGrow: 1,
  },
  // Header ichidagi bloklar orasida 12px + oxirgi blokdan birinchi satrga 12px.
  headerWrap: { gap: rs(12), marginBottom: rs(12) },

  // SS2-3: do'kon nomi qatori — ikonka + nom + tahrirlash ikonasi.
  // SS2-2: do‘kon nomi cardi + yonidagi ALOHIDA tahrirlash tugmasi
  shopLine: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  shopEditBtn: {
    width: rs(34), height: rs(34), borderRadius: rs(17),
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    alignSelf: 'flex-start',
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    maxWidth: '100%',
  },
  shopIcon: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopChip: {
    flexShrink: 1,
    // SS2-3: shrift KATTAROQ (12 -> 14.5) va to'qroq.
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
  },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: rd.color.border,
    borderLeftWidth: rs(4),
    padding: rs(13),
  },
  statLabel: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary },
  statValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(20),
    color: rd.color.text,
    marginTop: rs(4),
  },
  statValueSm: {
    fontFamily: rd.font.bold,
    fontSize: rs(14.5),
    color: rd.color.text,
    marginTop: rs(6),
  },
  statValueSub: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(2),
  },

  // K: Xodimlar + Tahrirlash tugmalari qatori.
  actionRow: { flexDirection: 'row', gap: rs(10) },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(7),
    backgroundColor: rd.color.surface,
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(11),
    // SS2-4: ikonka+matn card ICHIDA qolsin (matn chetga tegib ketmasin).
    paddingHorizontal: rs(10),
  },
  actionBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },

  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    borderRadius: rd.radius.pill,
    paddingVertical: rs(14),
  },
  newBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    // Qattiq height o'rniga moslashuvchi — 2-qatorli placeholder to'liq sig'adi.
    minHeight: rs(48),
    paddingVertical: rs(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.text,
    padding: 0,
  },
  countText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(-4),
  },

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
  rowAmts: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginTop: rs(5) },
  rowAmt: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text },
  rowAmtMuted: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary },

  stPill: {
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(9),
    paddingVertical: rs(3),
  },
  stPillText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },

  emptyBox: { alignItems: 'center', gap: rs(10), paddingVertical: rs(36) },
  emptyCircle: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textTertiary },
});
