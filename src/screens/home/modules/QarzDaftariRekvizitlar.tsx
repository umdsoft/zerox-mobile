/**
 * QarzDaftariRekvizitlar.tsx — "Do'kon rekvizitlari" (11.10, "Yangi mobil xatolar 11.10", 5-rasm).
 *
 * Do'konni tahrirlash sahifasidagi "Do'kon rekvizitlari" kartasi ALOHIDA bosiladigan karta; bosilganda
 * shu sahifa ochiladi: Do'kon nomi, Viloyat, Tuman / shahar.
 *
 * 13.10 ("Yangi mobil xatolar 12.10", 4-rasm): sahifa OXIRIDA «Bekor qilish» va «Saqlash» tugmalari —
 * avto-saqlash o'rniga aniq saqlash: «Saqlash» → PUT /qarz-daftari/savdo-faoliyat/:id va orqaga;
 * «Bekor qilish» — o'zgarishlar saqlanmasdan orqaga. Saqlanmagan o'zgarish bilan orqaga chiqilsa — so'raladi.
 */
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
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
import { ArrowDown, LocationIcon, StorefrontIcon } from '../redesign/icons';
import RegionPickerModal from './RegionPickerModal';

const BLUE = '#2f6fed';

type Snap = { nomi: string; region: string; district: string };

const authHeaders = () => ({ headers: { Authorization: `Bearer ${storage.getString('token')}` } });
const snapOf = (nomi: string, region: string, district: string): Snap => ({
  nomi: nomi.trim(),
  region,
  district,
});
const sameSnap = (a: Snap, b: Snap) => a.nomi === b.nomi && a.region === b.region && a.district === b.district;

const QarzDaftariRekvizitlar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();
  const faoliyatId = route.params?.faoliyat_id;

  const [loading, setLoading] = React.useState(true);
  const [nomi, setNomi] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [district, setDistrict] = React.useState('');
  const [saved, setSaved] = React.useState<Snap>({ nomi: '', region: '', district: '' });
  const [saving, setSaving] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [picker, setPicker] = React.useState<null | 'region' | 'district'>(null);

  const current = snapOf(nomi, region, district);
  const dirty = !sameSnap(current, saved);
  const nameErrKey = dirty || tried ? shopNameErrorKey(nomi) : null;
  const invalid = !!shopNameErrorKey(nomi) || !region || !district;

  const stateRef = React.useRef({ dirty });
  stateRef.current = { dirty };
  const leavingRef = React.useRef(false);

  /** Do'kon rekvizitlarini yuklash. */
  const loadShop = React.useCallback(async () => {
    try {
      const res = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat`, authHeaders());
      const list: any[] = res.data?.data || res.data || [];
      const cur = list.find((x: any) => String(x?.id) === String(faoliyatId));
      if (cur) {
        const s = snapOf(String(cur.nomi || ''), String(cur.region || ''), String(cur.district || ''));
        setNomi(String(cur.nomi || ''));
        setRegion(s.region);
        setDistrict(s.district);
        setSaved(s);
      }
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || t('Xatolik') } });
    }
  }, [faoliyatId, t]);

  React.useEffect(() => {
    loadShop().finally(() => setLoading(false));
  }, [loadShop]);

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

  const leave = React.useCallback(() => {
    leavingRef.current = true;
    navigation.goBack();
  }, [navigation]);

  /** «Saqlash»: tekshiruv → PUT → orqaga. O'zgarish bo'lmasa — shunchaki orqaga. */
  const onSave = async () => {
    setTried(true);
    setErrorMsg('');
    if (!dirty) { leave(); return; }
    if (invalid) return;
    setSaving(true);
    try {
      const res = await axios.put(`${URL}/qarz-daftari/savdo-faoliyat/${faoliyatId}`, current, authHeaders());
      if (!res.data?.success) throw { response: res };
      setSaved(current);
      propagateName(current.nomi);
      Toast.show({ type: 'omad', props: { desc: t('Saqlandi') } });
      leave();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || t('Xatolik'));
    } finally {
      setSaving(false);
    }
  };

  // Saqlanmagan o'zgarish bilan orqaga (sarlavha tugmasi / tizim "back") — so'raladi.
  React.useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (leavingRef.current || !stateRef.current.dirty) return;
      e.preventDefault();
      Alert.alert(
        t('Do‘kon rekvizitlari'),
        t('Do‘kon rekvizitlaridagi o‘zgarishlar saqlanmadi. Baribir chiqilsinmi?'),
        [
          { text: t('Bekor qilish'), style: 'cancel' },
          { text: t('Chiqish'), style: 'destructive', onPress: () => { leavingRef.current = true; navigation.dispatch(e.data.action); } },
        ],
        { cancelable: true },
      );
    });
    return unsub;
  }, [navigation, t]);

  const districts = React.useMemo(() => REGIONS.find(x => x.name === region)?.districts || [], [region]);

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Do‘kon rekvizitlari')} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={[styles.headIcon, { backgroundColor: rd.color.primaryTint }]}>
                <StorefrontIcon size={rs(20)} color={BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t('Do‘kon rekvizitlari')}</Text>
                <Text style={styles.cardSub}>{t('Nomi va joylashgan manzili')}</Text>
              </View>
            </View>

            <Text style={styles.label}>{t('Do‘kon nomi')}</Text>
            <View style={[styles.inputBox, nameErrKey ? styles.inputErr : null]}>
              <TextInput
                style={styles.input}
                value={nomi}
                onChangeText={txt => setNomi(sanitizeShopNameInput(txt))}
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
                (dirty || tried) && !!region && !district ? styles.selectWarn : null,
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

            {tried && !region && <Text style={styles.fieldErr}>{t('Viloyat va tumanni tanlang')}</Text>}
            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
          </View>

          {/* 13.10 (4-rasm): sahifa oxirida — Bekor qilish / Saqlash */}
          <View style={styles.btnRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.cancelBtn} disabled={saving} onPress={leave}>
              <Text style={styles.cancelText}>{t('Bekor qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={onSave}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator color={rd.color.onPrimary} /> : <Text style={styles.saveText}>{t('Saqlash')}</Text>}
            </TouchableOpacity>
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

export default QarzDaftariRekvizitlar;

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
  fieldErr: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.warning, marginTop: rs(8) },
  btnRow: { flexDirection: 'row', gap: rs(12), marginTop: rs(20) },
  cancelBtn: {
    flex: 1,
    height: rs(50),
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.textSecondary },
  saveBtn: {
    flex: 1,
    height: rs(50),
    borderRadius: rd.radius.lg,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.onPrimary },
});
