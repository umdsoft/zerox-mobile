/**
 * QarzDaftariFaoliyatEdit.tsx — "Do'konni tahrirlash" (10.10, sayt hujjati 3-rasm bilan bir xil).
 *
 * 4 ta karta: 1) Do'kon rekvizitlari, 2) Xodimlar, 3) Karta ulash, 4) Eslatma.
 * Pastdagi "Bekor qilish / Saqlash" tugmalari yo'q.
 *
 * 11.10 ("Yangi mobil xatolar 11.10", 5-rasm): "Do'kon rekvizitlari" ham boshqa kartalar kabi ALOHIDA
 * bosiladigan karta (nomi va manzili ko'rinadi); bosilganda QarzDaftariRekvizitlar sahifasi — Do'kon nomi,
 * Viloyat, Tuman / shahar shu yerda kiritiladi (avto-saqlash o'sha sahifada). Bu sahifa har qaytilganda
 * ma'lumotlarni yangilaydi.
 * Yangi do'kon yaratish — QarzDaftariFaoliyat (avvalgidek).
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { localizePlace } from '../../../helper/uzCyrillic';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import {
  BellIcon,
  ChevronRight,
  IdCardIcon,
  LocationIcon,
  StorefrontIcon,
  UsersIcon,
} from '../redesign/icons';
import { repeatLabel } from './reminderDays';

const BLUE = '#2f6fed';
const VIOLET = '#5a4fe4';

type Shop = { nomi: string; region: string; district: string };
type ManageScreen = 'QarzDaftariRekvizitlar' | 'QarzDaftariXodimlar' | 'QarzDaftariKarta' | 'QarzDaftariEslatma';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${storage.getString('token')}` } });

const QarzDaftariFaoliyatEdit = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();
  const faoliyatId = route.params?.faoliyat_id;

  const [loading, setLoading] = React.useState(true);
  const [shop, setShop] = React.useState<Shop>({ nomi: String(route.params?.faoliyat_nomi || ''), region: '', district: '' });
  const [cardLast4, setCardLast4] = React.useState('');
  const [staffCount, setStaffCount] = React.useState<number | null>(null);
  const [reminder, setReminder] = React.useState<{ enabled: boolean; time: string; days: number[] } | null>(null);

  /** Do'kon (rekvizitlar, karta holati), xodimlar soni, eslatma — ekranga har qaytilganda yangilanadi. */
  const loadMeta = React.useCallback(async (first: boolean) => {
    try {
      const res = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat`, authHeaders());
      const list: any[] = res.data?.data || res.data || [];
      const cur = list.find((x: any) => String(x?.id) === String(faoliyatId));
      if (cur) {
        const d = String(cur.karta_raqami || '').replace(/\D/g, '');
        setCardLast4(d.length === 16 && cur.telegram_telefon ? d.slice(-4) : '');
        setShop({ nomi: String(cur.nomi || ''), region: String(cur.region || ''), district: String(cur.district || '') });
      }
    } catch (e: any) {
      if (first) Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || t('Xatolik') } });
    }
    try {
      const r = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat/${faoliyatId}/xodimlar`, authHeaders());
      const rows = r.data?.data;
      setStaffCount(Array.isArray(rows) ? rows.length : 0);
    } catch {
      setStaffCount(null);
    }
    // 10.10: qarz kiritish eslatmasi holati (karta ustida ko'rsatiladi).
    try {
      const r = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat/${faoliyatId}/eslatma`, authHeaders());
      if (r.data?.data) setReminder(r.data.data);
    } catch {
      setReminder(null);
    }
  }, [faoliyatId, t]);

  React.useEffect(() => {
    loadMeta(true).finally(() => setLoading(false));
  }, [loadMeta]);

  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) { firstFocus.current = false; return; }
      loadMeta(false);
    }, [loadMeta]),
  );

  const goManage = (screen: ManageScreen) => {
    navigation.navigate(screen, { faoliyat_id: faoliyatId, faoliyat_nomi: shop.nomi });
  };

  const place = [shop.region, shop.district].filter(Boolean).map(x => localizePlace(x, i18n.language)).join(', ');

  const reminderStatus = reminder?.enabled
    ? `${t('Yoqilgan')} · ${reminder.time} · ${repeatLabel(reminder.days || [], t)}`
    : t('O‘chirilgan');

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Do‘konni tahrirlash')} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1) Do'kon rekvizitlari — 11.10: alohida bosiladigan karta; nom/viloyat/tuman — keyingi sahifada */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, styles.remCard]}
          onPress={() => goManage('QarzDaftariRekvizitlar')}
          accessibilityRole="button"
        >
          <View style={[styles.tileIcon, { backgroundColor: rd.color.primaryTint }]}>
            <StorefrontIcon size={rs(20)} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t('Do‘kon rekvizitlari')}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>{t('Nomi va joylashgan manzili')}</Text>
            <Text style={styles.shopName} numberOfLines={1}>{shop.nomi || '—'}</Text>
            <View style={styles.placeRow}>
              <LocationIcon size={rs(13)} color={place ? rd.color.textSecondary : rd.color.warning} />
              <Text style={[styles.placeText, !place && { color: rd.color.warning }]} numberOfLines={2}>
                {place || t('Manzil kiritilmagan')}
              </Text>
            </View>
          </View>
          <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
        </TouchableOpacity>

        {/* 2) Xodimlar  3) Karta ulash */}
        <View style={styles.row}>
          <TouchableOpacity activeOpacity={0.8} style={[styles.card, styles.tile]} onPress={() => goManage('QarzDaftariXodimlar')}>
            <View style={styles.tileTop}>
              <View style={[styles.tileIcon, { backgroundColor: '#eaf1fe' }]}>
                <UsersIcon size={rs(20)} color={BLUE} />
              </View>
              <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
            </View>
            <Text style={styles.cardTitle}>{t('Xodimlar')}</Text>
            <Text style={styles.cardSub} numberOfLines={3}>{t('Xodim qo‘shish va boshqarish')}</Text>
            <View style={styles.tileStatus}>
              <View style={[styles.dot, { backgroundColor: staffCount ? BLUE : rd.color.border }]} />
              <Text style={[styles.tileStatusText, { color: staffCount ? BLUE : rd.color.textTertiary }]} numberOfLines={2}>
                {staffCount == null ? '…' : staffCount ? t('{{n}} ta xodim', { n: staffCount }) : t('Hali xodim qo‘shilmagan')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={[styles.card, styles.tile]} onPress={() => goManage('QarzDaftariKarta')}>
            <View style={styles.tileTop}>
              <View style={[styles.tileIcon, { backgroundColor: '#efedfd' }]}>
                <IdCardIcon size={rs(19)} color={VIOLET} />
              </View>
              <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
            </View>
            <Text style={styles.cardTitle}>{t('Karta ulash')}</Text>
            <Text style={styles.cardSub} numberOfLines={3}>{t('Mijozlar pul o‘tkazadigan plastik karta')}</Text>
            <View style={styles.tileStatus}>
              <View style={[styles.dot, { backgroundColor: cardLast4 ? rd.color.success : rd.color.border }]} />
              <Text style={[styles.tileStatusText, { color: cardLast4 ? rd.color.success : rd.color.textTertiary }]} numberOfLines={2}>
                {cardLast4 ? `${t('Ulangan')} · •••• ${cardLast4}` : t('Karta ulanmagan')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4) Eslatma — qarz kiritishni eslatish (10.10, 2-rasm): bosilganda sozlama ekrani */}
        <TouchableOpacity activeOpacity={0.8} style={[styles.card, styles.remCard]} onPress={() => goManage('QarzDaftariEslatma')}>
          <View style={[styles.tileIcon, { backgroundColor: '#fef3c7' }]}>
            <BellIcon size={rs(20)} color="#b45309" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t('Eslatma')}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>{t('Belgilangan vaqtda qarz kiritishni eslatish')}</Text>
            <View style={styles.tileStatus}>
              <View style={[styles.dot, { backgroundColor: reminder?.enabled ? '#d97706' : rd.color.border }]} />
              <Text style={[styles.tileStatusText, { color: reminder?.enabled ? '#b45309' : rd.color.textTertiary }]} numberOfLines={2}>
                {reminder ? reminderStatus : '…'}
              </Text>
            </View>
          </View>
          <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default QarzDaftariFaoliyatEdit;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(28), gap: rs(12) },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  cardSub: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  row: { flexDirection: 'row', gap: rs(12) },
  tile: { flex: 1, padding: rs(14) },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(12) },
  tileIcon: { width: rs(40), height: rs(40), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  tileStatus: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(6), marginTop: rs(12) },
  dot: { width: rs(6), height: rs(6), borderRadius: rs(3), marginTop: rs(5) },
  tileStatusText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(11) },
  remCard: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  shopName: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text, marginTop: rs(12) },
  placeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(6), marginTop: rs(4) },
  placeText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
});
