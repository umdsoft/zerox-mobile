/**
 * QarzDaftariFaoliyatEdit.tsx — "Do'konni tahrirlash" (10.10, sayt hujjati 3-rasm bilan bir xil).
 *
 * 4 ta karta: 1) Do'kon rekvizitlari (nom, viloyat, tuman — AVTOMATIK saqlanadi),
 * 2) Xodimlar, 3) Karta ulash, 4) Eslatma. Pastdagi "Bekor qilish / Saqlash" tugmalari yo'q.
 *
 * Avto-saqlash: o'zgarishdan AUTOSAVE_DELAY_MS keyin PUT /qarz-daftari/savdo-faoliyat/:id;
 * ma'lumot yaroqsiz bo'lsa (nom xato, tuman tanlanmagan) — saqlanmaydi, holat "Saqlanmadi".
 * Ekrandan chiqishda (orqaga / Xodimlar / Karta) kutib turgan saqlash avval yakunlanadi.
 * Yangi do'kon yaratish — QarzDaftariFaoliyat (avvalgidek).
 */
import { CommonActions, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import REGIONS from '../../../helper/uzbekistanRegions';
import { localizePlace } from '../../../helper/uzCyrillic';
import { sanitizeShopNameInput, SHOP_NAME_MAX_LEN, shopNameErrorKey } from '../../../helper/shopName';
import { storage } from '../../../store/api/token/getToken';
import { getQarzShop, setQarzShop } from '../../../store/api/token/qarzShop';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDown,
  CheckIcon,
  ChevronRight,
  IdCardIcon,
  InfoIcon,
  LocationIcon,
  StorefrontIcon,
  UsersIcon,
  WarningIcon,
} from '../redesign/icons';
import RegionPickerModal from './RegionPickerModal';

const BLUE = '#2f6fed';
const VIOLET = '#5a4fe4';
const AUTOSAVE_DELAY_MS = 800;
const JUST_SAVED_MS = 2500;

type Snap = { nomi: string; region: string; district: string };
type Status = 'idle' | 'pending' | 'saving' | 'saved' | 'invalid' | 'error';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${storage.getString('token')}` } });
const snapOf = (nomi: string, region: string, district: string): Snap => ({
  nomi: nomi.trim(),
  region,
  district,
});
const sameSnap = (a: Snap, b: Snap) => a.nomi === b.nomi && a.region === b.region && a.district === b.district;

const QarzDaftariFaoliyatEdit = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();
  const faoliyatId = route.params?.faoliyat_id;

  const [loading, setLoading] = React.useState(true);
  const [nomi, setNomi] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [district, setDistrict] = React.useState('');
  const [saved, setSaved] = React.useState<Snap>({ nomi: '', region: '', district: '' });
  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [cardLast4, setCardLast4] = React.useState('');
  const [staffCount, setStaffCount] = React.useState<number | null>(null);
  const [picker, setPicker] = React.useState<null | 'region' | 'district'>(null);

  const current = snapOf(nomi, region, district);
  const dirty = !sameSnap(current, saved);
  const nameErrKey = dirty ? shopNameErrorKey(nomi) : null;
  const invalid = !!shopNameErrorKey(nomi) || !region || !district;

  // Taymer/so'rov holatini render'lar orasida ushlab turish (yopilishda kerak).
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const justSavedRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = React.useRef<Promise<boolean> | null>(null);
  const stateRef = React.useRef({ current, saved, invalid });
  stateRef.current = { current, saved, invalid };

  /** Do'kon (karta holati) va xodimlar soni — ekranga har qaytilganda yangilanadi. */
  const loadMeta = React.useCallback(async (prefill: boolean) => {
    try {
      const res = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat`, authHeaders());
      const list: any[] = res.data?.data || res.data || [];
      const cur = list.find((x: any) => String(x?.id) === String(faoliyatId));
      if (cur) {
        const d = String(cur.karta_raqami || '').replace(/\D/g, '');
        setCardLast4(d.length === 16 && cur.telegram_telefon ? d.slice(-4) : '');
        if (prefill) {
          const s = snapOf(String(cur.nomi || ''), String(cur.region || ''), String(cur.district || ''));
          setNomi(String(cur.nomi || ''));
          setRegion(s.region);
          setDistrict(s.district);
          setSaved(s);
        }
      }
    } catch (e: any) {
      if (prefill) Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || t('Xatolik') } });
    }
    try {
      const r = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat/${faoliyatId}/xodimlar`, authHeaders());
      const rows = r.data?.data;
      setStaffCount(Array.isArray(rows) ? rows.length : 0);
    } catch {
      setStaffCount(null);
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

  /** Saqlangan nomni ilovaning boshqa joylariga yetkazish (global tanlov + Mijozlar ekrani). */
  const propagateName = React.useCallback((name: string) => {
    const sel = getQarzShop();
    if (sel && Number(sel.id) === Number(faoliyatId)) setQarzShop({ id: Number(faoliyatId), nomi: name });
    const routes: any[] = navigation.getState?.()?.routes || [];
    const target = routes.find(r => r?.name === 'QarzDaftariMijozlar');
    if (target?.key) {
      navigation.dispatch({ ...CommonActions.setParams({ faoliyat_nomi: name }), source: target.key });
    }
  }, [faoliyatId, navigation]);

  const save = React.useCallback(async (snap: Snap): Promise<boolean> => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await axios.put(`${URL}/qarz-daftari/savdo-faoliyat/${faoliyatId}`, snap, authHeaders());
      if (!res.data?.success) throw { response: res };
      setSaved(snap);
      propagateName(snap.nomi);
      setStatus('saved');
      if (justSavedRef.current) clearTimeout(justSavedRef.current);
      justSavedRef.current = setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), JUST_SAVED_MS);
      return true;
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.response?.data?.message || t('Xatolik'));
      return false;
    }
  }, [faoliyatId, propagateName, t]);

  /**
   * Kutib turgan o'zgarishni DARHOL saqlash.
   * @returns saqlanmagan o'zgarish qolmadimi
   */
  const flush = React.useCallback(async (): Promise<boolean> => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (inflightRef.current) await inflightRef.current;
    const st = stateRef.current;
    if (sameSnap(st.current, st.saved)) return true;
    if (st.invalid) { setStatus('invalid'); return false; }
    inflightRef.current = save(st.current);
    try { return await inflightRef.current; } finally { inflightRef.current = null; }
  }, [save]);

  // Har o'zgarishda: yaroqli — kechiktirib saqlash; yaroqsiz — "Saqlanmadi".
  React.useEffect(() => {
    if (loading) return;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (!dirty) {
      setStatus(s => (s === 'saved' || s === 'saving' ? s : 'idle'));
      return;
    }
    if (invalid) { setStatus('invalid'); return; }
    setStatus(s => (s === 'saving' ? s : 'pending'));
    timerRef.current = setTimeout(() => { flush(); }, AUTOSAVE_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.nomi, current.region, current.district, loading]);

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (justSavedRef.current) clearTimeout(justSavedRef.current);
  }, []);

  /** Chiqishdan oldin: saqlab ko'radi; saqlab bo'lmasa — foydalanuvchidan so'raydi. */
  const settle = React.useCallback(async (): Promise<boolean> => {
    const ok = await flush();
    const st = stateRef.current;
    if (ok || sameSnap(st.current, st.saved)) return true;
    return new Promise<boolean>(resolve => {
      Alert.alert(
        t('Do‘kon rekvizitlari'),
        t('Do‘kon rekvizitlaridagi o‘zgarishlar saqlanmadi. Baribir chiqilsinmi?'),
        [
          { text: t('Bekor qilish'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('Chiqish'), style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  }, [flush, t]);

  // Orqaga (sarlavha tugmasi yoki tizim "back") — avval saqlash yakunlansin.
  const leavingRef = React.useRef(false);
  React.useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (leavingRef.current) return;
      const st = stateRef.current;
      if (sameSnap(st.current, st.saved) && !inflightRef.current) return;
      e.preventDefault();
      settle().then(ok => {
        if (!ok) return;
        leavingRef.current = true;
        navigation.dispatch(e.data.action);
      });
    });
    return unsub;
  }, [navigation, settle]);

  const goManage = async (screen: 'QarzDaftariXodimlar' | 'QarzDaftariKarta') => {
    if (!(await settle())) return;
    navigation.navigate(screen, { faoliyat_id: faoliyatId, faoliyat_nomi: stateRef.current.saved.nomi || nomi });
  };

  const districts = React.useMemo(() => REGIONS.find(x => x.name === region)?.districts || [], [region]);

  const chip = (() => {
    switch (status) {
      case 'pending': return { label: t('O‘zgartirilmoqda'), bg: rd.color.primaryTint, fg: BLUE, icon: 'dot' };
      case 'saving': return { label: t('Saqlanmoqda...'), bg: rd.color.primaryTint, fg: BLUE, icon: 'spin' };
      case 'saved': return { label: t('Saqlandi'), bg: rd.color.successBg, fg: rd.color.success, icon: 'check' };
      case 'invalid': return { label: t('Saqlanmadi'), bg: rd.color.warningBg, fg: rd.color.warning, icon: 'warn' };
      case 'error': return { label: t('Saqlab bo‘lmadi'), bg: rd.color.errorBg, fg: rd.color.error, icon: 'warn' };
      default: return { label: t('Saqlangan'), bg: rd.color.surfaceAlt, fg: rd.color.textTertiary, icon: 'check' };
    }
  })();

  const notes = [
    t('Do‘kon nomi qarz oluvchilarga yuboriladigan SMS xabarlarda ko‘rsatiladi — shuning uchun faqat lotin harflari ishlatiladi.'),
    t('Karta ulangan bo‘lsa, qarzni qaytarish kuni va talab SMS xabarlarida karta raqami hamda Telegram raqami ko‘rsatiladi.'),
    t('Rekvizitlardagi o‘zgarishlar avtomatik saqlanadi.'),
  ];

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Do‘konni tahrirlash')} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1) Do'kon rekvizitlari */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={[styles.headIcon, { backgroundColor: rd.color.primaryTint }]}>
                <StorefrontIcon size={rs(20)} color={BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t('Do‘kon rekvizitlari')}</Text>
                <Text style={styles.cardSub}>{t('Nomi va joylashgan manzili')}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: chip.bg }]} accessibilityLiveRegion="polite">
                {chip.icon === 'spin' && <ActivityIndicator size="small" color={chip.fg} style={styles.chipSpin} />}
                {chip.icon === 'check' && <CheckIcon size={rs(12)} color={chip.fg} />}
                {chip.icon === 'warn' && <WarningIcon size={rs(12)} color={chip.fg} />}
                {chip.icon === 'dot' && <View style={[styles.chipDot, { backgroundColor: chip.fg }]} />}
                <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
              </View>
            </View>

            <Text style={styles.label}>{t('Do‘kon nomi')}</Text>
            <View style={[styles.inputBox, nameErrKey ? styles.inputErr : null]}>
              <TextInput
                style={styles.input}
                value={nomi}
                onChangeText={txt => setNomi(sanitizeShopNameInput(txt))}
                onBlur={() => { flush(); }}
                placeholder={t('Masalan: Best Market')}
                placeholderTextColor={rd.color.textTertiary}
                maxLength={SHOP_NAME_MAX_LEN}
              />
            </View>
            <View style={styles.hintRow}>
              <Text style={[styles.hint, nameErrKey ? { color: rd.color.error } : null]}>
                {nameErrKey ? t(nameErrKey) : t('Faqat lotin harflari, raqam, probel, defis (-), nuqta (.) va apostrof (o‘, g‘)')}
              </Text>
              <Text style={styles.counter}>{nomi.length}/{SHOP_NAME_MAX_LEN}</Text>
            </View>

            <Text style={styles.label}>{t('Viloyat')}</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.selectBox} onPress={() => setPicker('region')}>
              <LocationIcon size={rs(18)} color={rd.color.textTertiary} />
              <Text style={[styles.selectValue, !region && styles.placeholder]} numberOfLines={1}>
                {region ? localizePlace(region, i18n.language) : t('Viloyatni tanlang')}
              </Text>
              <ArrowDown size={rs(18)} color={rd.color.textTertiary} />
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: rs(12) }]}>{t('Tuman / shahar')}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.selectBox,
                !region && styles.selectDisabled,
                dirty && !!region && !district ? styles.selectWarn : null,
              ]}
              disabled={!region}
              onPress={() => setPicker('district')}
            >
              <LocationIcon size={rs(18)} color={region ? rd.color.textTertiary : rd.color.border} />
              <Text style={[styles.selectValue, !district && styles.placeholder]} numberOfLines={1}>
                {district
                  ? localizePlace(district, i18n.language)
                  : region
                  ? t('Tuman yoki shaharni tanlang')
                  : t('Avval viloyatni tanlang')}
              </Text>
              <ArrowDown size={rs(18)} color={rd.color.textTertiary} />
            </TouchableOpacity>

            {status === 'error' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg || t('Xatolik')}</Text>
                <TouchableOpacity onPress={() => { flush(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.retry}>{t('Qayta urinish')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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

          {/* 4) Eslatma */}
          <View style={styles.note}>
            <View style={styles.noteHead}>
              <View style={styles.noteIcon}>
                <InfoIcon size={rs(15)} color="#b45309" />
              </View>
              <Text style={styles.noteTitle}>{t('Eslatma')}</Text>
            </View>
            {notes.map(n => (
              <View key={n} style={styles.noteRow}>
                <View style={styles.noteBullet} />
                <Text style={styles.noteText}>{n}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <RegionPickerModal
        visible={!!picker}
        title={picker === 'region' ? t('Viloyatni tanlang') : t('Tuman yoki shaharni tanlang')}
        data={picker === 'region' ? REGIONS.map(r => r.name) : districts}
        selected={picker === 'region' ? region : district}
        onClose={() => setPicker(null)}
        onPick={val => {
          if (picker === 'region') {
            setRegion(val);
            setDistrict(''); // eski tuman yangi viloyatga to'g'ri kelmaydi
          } else {
            setDistrict(val);
          }
          setPicker(null);
        }}
      />
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
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(16) },
  headIcon: { width: rs(40), height: rs(40), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  cardSub: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingHorizontal: rs(9),
    paddingVertical: rs(5),
    borderRadius: rd.radius.pill,
  },
  chipSpin: { transform: [{ scale: 0.6 }], width: rs(12), height: rs(12) },
  chipDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  chipText: { fontFamily: rd.font.semibold, fontSize: rs(11) },
  label: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text, marginBottom: rs(8) },
  inputBox: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  inputErr: { borderColor: rd.color.error },
  input: { fontFamily: rd.font.regular, fontSize: rs(14.5), color: rd.color.text, paddingVertical: rs(12) },
  hintRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(6), marginBottom: rs(14) },
  hint: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(11), lineHeight: rs(15), color: rd.color.textTertiary },
  counter: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
  },
  selectDisabled: { backgroundColor: rd.color.surfaceAlt, opacity: 0.7 },
  selectWarn: { borderColor: rd.color.warning },
  selectValue: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(14.5), color: rd.color.text },
  placeholder: { color: rd.color.textTertiary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    marginTop: rs(12),
    backgroundColor: rd.color.errorBg,
    borderRadius: rs(12),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
  },
  errorText: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.error },
  retry: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.error },
  row: { flexDirection: 'row', gap: rs(12) },
  tile: { flex: 1, padding: rs(14) },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(12) },
  tileIcon: { width: rs(40), height: rs(40), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  tileStatus: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(6), marginTop: rs(12) },
  dot: { width: rs(6), height: rs(6), borderRadius: rs(3), marginTop: rs(5) },
  tileStatusText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(11) },
  note: {
    backgroundColor: '#fffbeb',
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: rs(16),
    gap: rs(8),
  },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(2) },
  noteIcon: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: { fontFamily: rd.font.semibold, fontSize: rs(14), color: '#78350f' },
  noteRow: { flexDirection: 'row', gap: rs(8), paddingLeft: rs(4) },
  noteBullet: { width: rs(5), height: rs(5), borderRadius: rs(3), backgroundColor: '#f59e0b', marginTop: rs(7) },
  noteText: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(12), lineHeight: rs(18), color: '#78350f' },
});
