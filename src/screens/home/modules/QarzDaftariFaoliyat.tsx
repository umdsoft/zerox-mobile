/**
 * QarzDaftariFaoliyat.tsx — "Savdo faoliyati" (do'kon) yaratish.
 *
 * Web `SavdoFaoliyatModal`'ning mobil ko'rinishi: yangi do'kon (savdo faoliyati)
 * yaratish formasi. Muvaffaqiyatli saqlangach oldingi ekranga qaytadi.
 *
 * POST /qarz-daftari/savdo-faoliyat
 *   body: { nomi, region, district }  (region/district — NOM string, saytdagidek)
 *
 * Viloyat/Tuman endi MAJBURIY va DROPDOWN (bottom-sheet) — saytdagi <select> kabi.
 * Viloyat tanlansa, o'sha viloyatning tuman/shaharlari ro'yxati chiqadi.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import { storage } from '../../../store/api/token/getToken';
import { getQarzShop, setQarzShop } from '../../../store/api/token/qarzShop';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import { ArrowDown, CheckIcon, ChevronRight, IdCardIcon, LocationIcon, StorefrontIcon, UsersIcon } from '../redesign/icons';
import REGIONS from '../../../helper/uzbekistanRegions';
// SS5 (2026-09-17): joy nomlari BAZAGA lotin ko'rinishida yoziladi, EKRANDA esa
// tizim tiliga mos yozuvda ko'rsatiladi (kirill tanlansa — kirillda).
import { localizePlace } from '../../../helper/uzCyrillic';

const BLUE = '#2f6fed';
// Brend gradientining 2-rangi (rd.color.gradient[1]) — "Karta ulash" tugmasi
// "Xodimlar"dan vizual ajralib turishi uchun ishlatiladi.
const VIOLET = '#5a4fe4';

const QarzDaftariFaoliyat = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();

  // Tahrirlash rejimi: mavjud do'kon (savdo faoliyati) ma'lumotlari old to'ldiriladi.
  const faoliyat_id = route.params?.faoliyat_id;
  const isEdit = !!route.params?.edit && !!faoliyat_id;

  const [nomi, setNomi] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [district, setDistrict] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  // Tahrirlashda mavjud do'kon ma'lumotlari yuklanguncha Loading ko'rsatiladi.
  const [prefilling, setPrefilling] = React.useState(isEdit);
  const [picker, setPicker] = React.useState<null | 'region' | 'district'>(null);

  // Tahrirlash rejimida do'kon ro'yxatini olib, joriy do'konni topamiz va formani
  // old to'ldiramiz (nomi/region/district). Alohida GET-by-id yo'q — ro'yxatdan olamiz.
  React.useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    (async () => {
      try {
        const token = storage.getString('token');
        const res = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list: any[] = res.data?.data || res.data || [];
        const cur = list.find((x: any) => String(x?.id) === String(faoliyat_id));
        if (alive && cur) {
          setNomi(String(cur?.nomi || ''));
          setRegion(String(cur?.region || ''));
          setDistrict(String(cur?.district || ''));
        }
      } catch (e: any) {
        if (alive) {
          Toast.show({
            type: 'error2',
            props: { desc: e?.response?.data?.message || t('Xatolik') },
          });
        }
      } finally {
        if (alive) setPrefilling(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isEdit, faoliyat_id, t]);

  // Tanlangan viloyatning tumanlari (sayt bilan bir xil mantiq).
  const districts = React.useMemo(() => {
    const r = REGIONS.find(x => x.name === region);
    return r ? r.districts : [];
  }, [region]);

  const canSubmit = !!nomi.trim() && !!region && !!district;

  // Do'kon nomi validatsiyasi — backend `validateShopName` bilan AYNAN bir xil
  // (test.zerox.uz talablari): apostrof-variantlarini oddiy ' ga normalizatsiya,
  // max 28 belgi, faqat lotin harf/raqam/probel/nuqta/defis/apostrof (tirnoq va
  // maxsus belgilar SMS'ni UCS-2 ga o'tkazib buzadi).
  const normalizeApos = (s: string) => s.replace(/[ʻʼ‘’`´′ʹ‵]/g, "'");
  const validateShopName = (raw: string): string | null => {
    const nm = normalizeApos(String(raw ?? '')).trim();
    if (!nm) return t("Do'kon nomini kiriting");
    if (nm.length > 28) return t('Do‘kon nomi 28 ta belgidan oshmasin');
    if (!/^[A-Za-z0-9 .\-']+$/.test(nm)) {
      return t('Faqat lotin harflari, raqam, probel, nuqta, defis va apostrof ishlatilsin');
    }
    return null;
  };

  const onSubmit = async () => {
    if (submitting) return;

    const nameErr = validateShopName(nomi);
    if (nameErr) {
      Toast.show({ type: 'error2', props: { desc: nameErr } });
      return;
    }
    if (!region) {
      Toast.show({ type: 'error2', props: { desc: t('Viloyatni tanlang') } });
      return;
    }
    if (!district) {
      Toast.show({ type: 'error2', props: { desc: t('Tuman yoki shaharni tanlang') } });
      return;
    }

    setSubmitting(true);
    try {
      const token = storage.getString('token');
      const body = { nomi: normalizeApos(nomi).trim(), region, district };
      // Tahrirlash -> PUT (mavjud do'kon), aks holda yaratish -> POST.
      const res = isEdit
        ? await axios.put(
            `${URL}/qarz-daftari/savdo-faoliyat/${faoliyat_id}`,
            body,
            { headers: { Authorization: `Bearer ${token}` } },
          )
        : await axios.post(
            `${URL}/qarz-daftari/savdo-faoliyat`,
            body,
            { headers: { Authorization: `Bearer ${token}` } },
          );

      if (res.data?.success) {
        Toast.show({
          type: 'omad',
          props: { desc: isEdit ? t('Do‘kon yangilandi') : t("Do'kon yaratildi") },
        });
        // Do'kon nomi ILOVANING HAMMA JOYIDA darhol yangilanishi uchun global
        // tanlovdagi yorliqni ham yangilaymiz. Aks holda bosh sahifadagi card
        // ro'yxat qayta o'qilgunicha ESKI nomni ko'rsatib turardi.
        if (isEdit) {
          const cur = getQarzShop();
          if (cur && Number(cur.id) === Number(faoliyat_id)) {
            setQarzShop({ id: Number(faoliyat_id), nomi: body.nomi });
          }
        }
        if (isEdit) {
          // Oldingi ekran (QarzDaftariMijozlar) do'kon nomini FAQAT route parametridan
          // oladi — oddiy goBack() uni yangilamaydi va ESKI nom qolib ketardi.
          //
          // SS5 TUZATISH: ilgari `navigate({ merge: true })` ishlatilgan edi. `navigate`
          // MA'NOSI IKKI XIL: maqsad ekran stekda BO'LSA — unga qaytaradi, BO'LMASA —
          // USTIGA QO'YADI. Ikkinchi holatda tahrirlash ekrani stekda QOLIB ketardi va
          // orqaga bosilganda yana o'sha (eski nomli) forma ochilardi.
          // `popTo` bir ma'noli: faqat MAVJUD ekranga qaytaradi, hech qachon qo'ymaydi.
          const nav: any = navigation;
          const inStack = (nav.getState?.()?.routes || []).some(
            (r: any) => r?.name === 'QarzDaftariMijozlar',
          );
          if (inStack && typeof nav.popTo === 'function') {
            nav.popTo(
              'QarzDaftariMijozlar',
              { faoliyat_id, faoliyat_nomi: body.nomi },
              { merge: true },
            );
          } else {
            // Mijozlar ekrani stekda yo'q (masalan boshqa yo'ldan kelingan) —
            // yangi ekran QO'SHMAYMIZ, shunchaki orqaga qaytamiz.
            navigation.goBack();
          }
        } else {
          navigation.goBack();
        }
      } else {
        Toast.show({ type: 'error2', props: { desc: res.data?.message || t('Xatolik') } });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error2',
        props: { desc: error?.response?.data?.message || t('Xatolik') },
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Picker modal ma'lumotlari
  const pickerData = picker === 'region' ? REGIONS.map(r => r.name) : districts;
  const pickerSelected = picker === 'region' ? region : district;
  const pickerTitle =
    picker === 'region' ? t('Viloyatni tanlang') : t('Tuman yoki shaharni tanlang');

  const onPick = (val: string) => {
    if (picker === 'region') {
      // Viloyat o'zgarsa — tumanni tozalaymiz (eski tuman yangi viloyatga to'g'ri kelmasligi mumkin).
      setRegion(val);
      setDistrict('');
    } else {
      setDistrict(val);
    }
    setPicker(null);
  };

  if (submitting || prefilling) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={isEdit ? t('Do‘konni tahrirlash') : t("Yangi do'kon")} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro — do'kon (storefront) ikonasi (so'rov bo'yicha BuildingIcon o'rniga).
              2026-09-14 (SS1-1): TAHRIRLASH rejimida bu karta CHIQMAYDI — "…do'kon
              yarating" matni mavjud do'konni tahrirlayotgan foydalanuvchi uchun
              noto'g'ri va sahifa to'g'ridan-to'g'ri "Do'kon nomi"dan boshlanishi
              kerak. Yangi do'kon yaratishda esa yo'riqnoma sifatida qoladi. */}
          {!isEdit && (
            <View style={styles.introCard}>
              <View style={styles.introIcon}>
                <StorefrontIcon size={rs(24)} color={BLUE} />
              </View>
              <Text style={styles.introText}>
                {t('Qarz daftarini yuritish uchun savdo faoliyati (do‘kon) yarating.')}
              </Text>
            </View>
          )}

          {/* Do'kon nomi */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('Do‘kon nomi')}</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={nomi}
                // Yozilgan zahoti RUXSAT ETILMAGAN belgilar OLIB TASHLANADI (web
                // bilan bir xil): apostrof-normalizatsiya + faqat [A-Za-z0-9 .-'].
                // Tinish/maxsus belgilar (SMS-buzuvchi) umuman kiritilmaydi.
                onChangeText={txt =>
                  setNomi(normalizeApos(txt).replace(/[^A-Za-z0-9 .\-']/g, ''))
                }
                placeholder={t('Masalan: Best Market')}
                placeholderTextColor={rd.color.textTertiary}
                maxLength={28}
              />
            </View>
            {/* SS29: saytdagi kabi nom talablari. */}
            <Text style={styles.fieldHint}>
              {/* Apostrof ham ruxsat (o‘, g‘) — foydalanuvchi buni bilishi kerak. */}
              {t('Faqat lotin harflari, raqam, probel, defis (-), nuqta (.) va apostrof (o‘, g‘)')}
            </Text>
          </View>

          {/* Viloyat (MAJBURIY — dropdown) */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('Viloyat')}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.selectBox}
              onPress={() => setPicker('region')}
            >
              <LocationIcon size={rs(18)} color={rd.color.textTertiary} />
              <Text
                style={[styles.selectValue, !region && styles.selectPlaceholder]}
                numberOfLines={1}
              >
                {region ? localizePlace(region, i18n.language) : t('Viloyatni tanlang')}
              </Text>
              <ArrowDown size={rs(18)} color={rd.color.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Tuman / shahar (MAJBURIY — dropdown, viloyat tanlangach faollashadi) */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('Tuman / shahar')}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.selectBox, !region && styles.selectBoxDisabled]}
              disabled={!region}
              onPress={() => setPicker('district')}
            >
              <LocationIcon
                size={rs(18)}
                color={region ? rd.color.textTertiary : rd.color.border}
              />
              <Text
                style={[styles.selectValue, !district && styles.selectPlaceholder]}
                numberOfLines={1}
              >
                {district
                  ? localizePlace(district, i18n.language)
                  : region
                  ? t('Tuman yoki shaharni tanlang')
                  : t('Avval viloyatni tanlang')}
              </Text>
              <ArrowDown size={rs(18)} color={rd.color.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* SS14-2 + so'rov (2026-09-13): "Do'kon boshqaruvi" bo'limi ILGARI ikki
              tekis kontur tugma edi — forma maydonlaridan farq qilmasdi va
              foydalanuvchi bu funksiyalar borligini payqamasdi. Endi u ALOHIDA
              KARTA: rangli sarlavha + ikonali qatorlar + strelka (bosiladigani
              aniq ko'rinadi).
              Faqat MAVJUD do'konni tahrirlashda — yangi do'kon hali saqlanmagan,
              unga xodim/karta biriktirib bo'lmaydi. */}
          {isEdit && (
            <View style={styles.field}>
              {/* SS1-2: sarlavha endi "Do'kon nomi"/"Viloyat" kabi ODDIY label —
                  karta ichidagi aksent-chiziqli sarlavha emas. */}
              <Text style={styles.label}>{t("Do‘kon boshqaruvi")}</Text>

              {/* SS1-3: ikki funksiya ENDI ALOHIDA tugma — bitta oq kartaning
                  ichidagi qatorlar emas. Har biri rangli (oq emas): tinted fon +
                  mos rangdagi kontur, shuning uchun forma maydonlaridan darrov
                  ajralib turadi va bosiladigani ko'rinib turadi. */}
              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.manageBtn, styles.manageBtnBlue]}
                onPress={() =>
                  navigation.navigate('QarzDaftariXodimlar', {
                    faoliyat_id,
                    faoliyat_nomi: nomi,
                  })
                }>
                <View style={[styles.manageIcon, styles.manageIconBlue]}>
                  <UsersIcon size={rs(19)} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.manageRowTitle, { color: BLUE }]}>{t('Xodimlar')}</Text>
                  <Text style={[styles.manageRowSub, styles.manageSubBlue]} numberOfLines={1}>
                    {t("Xodim qo‘shish va boshqarish")}
                  </Text>
                </View>
                <ChevronRight size={rs(18)} color={BLUE} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.manageBtn, styles.manageBtnViolet]}
                onPress={() =>
                  navigation.navigate('QarzDaftariKarta', {
                    faoliyat_id,
                    faoliyat_nomi: nomi,
                  })
                }>
                <View style={[styles.manageIcon, styles.manageIconViolet]}>
                  <IdCardIcon size={rs(18)} color={VIOLET} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.manageRowTitle, { color: VIOLET }]}>{t('Karta ulash')}</Text>
                  <Text style={[styles.manageRowSub, styles.manageSubViolet]} numberOfLines={1}>
                    {t("Mijozlar pul o‘tkazadigan plastik karta")}
                  </Text>
                </View>
                <ChevronRight size={rs(18)} color={VIOLET} />
              </TouchableOpacity>
            </View>
          )}

          {/* SS29: Bekor qilish + Saqlash yonma-yon (saytdagidek). */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>{t('Bekor qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.submitBtn, styles.submitBtnFlex, !canSubmit && styles.submitBtnDisabled]}
              onPress={onSubmit}
              disabled={!canSubmit || submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? t('Saqlanmoqda...') : t('Saqlash')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Markazlashgan DETACHED picker (viloyat / tuman) — pastki-sheetga bog'lanmagan
          alohida karta; fon qorayadi (blur-lib yo'q -> kuchli dim eng yaqin muqobil). */}
      <Modal
        visible={!!picker}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPicker(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerTitle}</Text>
              <TouchableOpacity
                onPress={() => setPicker(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerData}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
              ItemSeparatorComponent={() => <View style={styles.modalSep} />}
              renderItem={({ item }) => {
                const selected = item === pickerSelected;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.modalRow, selected && styles.modalRowSelected]}
                    onPress={() => onPick(item)}
                  >
                    <Text
                      style={[styles.modalRowText, selected && styles.modalRowTextSel]}
                      numberOfLines={1}
                    >
                      {localizePlace(item, i18n.language)}
                    </Text>
                    {selected && <CheckIcon size={rs(18)} color={BLUE} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default QarzDaftariFaoliyat;

const styles = StyleSheet.create({
  // SS1-3 (2026-09-14): "Xodimlar" / "Karta ulash" — ALOHIDA rangli tugmalar.
  // Ilgari ikkalasi bitta oq karta ichidagi qatorlar edi; foydalanuvchi ularni
  // forma maydonidan ajrata olmasdi. Endi har biri mustaqil tugma: tinted fon +
  // mos rangli kontur (Xodimlar = brend ko'ki, Karta = brend gradientining
  // ikkinchi rangi #5a4fe4 — yangi tasodifiy rang kiritilmadi).
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingHorizontal: rs(14),
    paddingVertical: rs(13),
    borderRadius: rs(16),
    borderWidth: 1.5,
  },
  manageBtnBlue: { backgroundColor: '#eaf1fe', borderColor: '#b9d1fb' },
  manageBtnViolet: { backgroundColor: '#efedfd', borderColor: '#cbc4f8' },
  manageIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageIconBlue: { backgroundColor: '#ffffff' },
  manageIconViolet: { backgroundColor: '#ffffff' },
  manageRowTitle: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  manageRowSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  manageSubBlue: { color: '#4c7fd6' },
  manageSubViolet: { color: '#7a71cf' },
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(16),
  },

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  introIcon: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
  },

  field: { gap: rs(8) },
  label: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
  },
  inputBox: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  input: {
    fontFamily: rd.font.regular,
    fontSize: rs(14.5),
    color: rd.color.text,
    paddingVertical: rs(13),
  },

  // Dropdown (select) qatori — input bilan bir xil ko'rinish + chevron.
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(13),
  },
  selectBoxDisabled: { backgroundColor: rd.color.surfaceAlt, opacity: 0.7 },
  selectValue: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(14.5),
    color: rd.color.text,
  },
  selectPlaceholder: { color: rd.color.textTertiary },

  submitBtn: {
    backgroundColor: BLUE,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(4),
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
  // SS29: nom talablari + Bekor qilish tugmasi
  fieldHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(6),
    marginLeft: rs(2),
    lineHeight: rs(16),
  },
  btnRow: { flexDirection: 'row', gap: rs(12), marginTop: rs(4) },
  submitBtnFlex: { flex: 1, marginTop: 0 },
  cancelBtn: {
    flex: 1,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  cancelBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
  },

  // Markazlashgan DETACHED picker karta
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
  },
  modalTitle: {
    flex: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  modalClose: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.textTertiary,
    paddingHorizontal: rs(4),
  },
  modalList: { flexGrow: 0 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(14),
    paddingHorizontal: rs(12),
    borderRadius: rs(12),
  },
  // Ro'yxat elementlari orasidagi chiziq (so'rov bo'yicha).
  modalSep: { height: 1, backgroundColor: rd.color.border, marginHorizontal: rs(12) },
  modalRowSelected: { backgroundColor: rd.color.primaryTint },
  modalRowText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(14.5),
    color: rd.color.text,
  },
  modalRowTextSel: { fontFamily: rd.font.semibold, color: BLUE },
});
