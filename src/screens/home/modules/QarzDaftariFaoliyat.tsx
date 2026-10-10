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
 *
 * 10.10: TAHRIRLASH (`edit: true` + `faoliyat_id`) endi alohida ekran —
 * QarzDaftariFaoliyatEdit (4 karta, avto-saqlash). Marshrut nomi o'zgarmadi.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import { ArrowDown, LocationIcon, StorefrontIcon } from '../redesign/icons';
import REGIONS from '../../../helper/uzbekistanRegions';
// SS5 (2026-09-17): joy nomlari BAZAGA lotin ko'rinishida yoziladi, EKRANDA esa
// tizim tiliga mos yozuvda ko'rsatiladi (kirill tanlansa — kirillda).
import { localizePlace } from '../../../helper/uzCyrillic';
import {
  normalizeShopApos,
  sanitizeShopNameInput,
  SHOP_NAME_MAX_LEN,
  shopNameErrorKey,
} from '../../../helper/shopName';
import QarzDaftariFaoliyatEdit from './QarzDaftariFaoliyatEdit';
import RegionPickerModal from './RegionPickerModal';

const BLUE = '#2f6fed';

const QarzDaftariFaoliyatCreate = () => {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();

  const [nomi, setNomi] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [district, setDistrict] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [picker, setPicker] = React.useState<null | 'region' | 'district'>(null);

  // Tanlangan viloyatning tumanlari (sayt bilan bir xil mantiq).
  const districts = React.useMemo(() => {
    const r = REGIONS.find(x => x.name === region);
    return r ? r.districts : [];
  }, [region]);

  const canSubmit = !!nomi.trim() && !!region && !!district;

  const onSubmit = async () => {
    if (submitting) return;

    // Do'kon nomi validatsiyasi — backend `validateShopName` bilan AYNAN bir xil (helper/shopName).
    const nameErr = shopNameErrorKey(nomi);
    if (nameErr) {
      Toast.show({ type: 'error2', props: { desc: t(nameErr) } });
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
      const body = { nomi: normalizeShopApos(nomi).trim(), region, district };
      const res = await axios.post(`${URL}/qarz-daftari/savdo-faoliyat`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        Toast.show({ type: 'omad', props: { desc: t("Do'kon yaratildi") } });
        navigation.goBack();
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

  if (submitting) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t("Yangi do'kon")} />

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
          {/* Intro — do'kon (storefront) ikonasi. */}
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <StorefrontIcon size={rs(24)} color={BLUE} />
            </View>
            <Text style={styles.introText}>
              {t('Qarz daftarini yuritish uchun savdo faoliyati (do‘kon) yarating.')}
            </Text>
          </View>

          {/* Do'kon nomi */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('Do‘kon nomi')}</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={nomi}
                // Yozilgan zahoti RUXSAT ETILMAGAN belgilar OLIB TASHLANADI (web bilan bir xil).
                onChangeText={txt => setNomi(sanitizeShopNameInput(txt))}
                placeholder={t('Masalan: Best Market')}
                placeholderTextColor={rd.color.textTertiary}
                maxLength={SHOP_NAME_MAX_LEN}
              />
            </View>
            {/* SS29: saytdagi kabi nom talablari. Apostrof ham ruxsat (o‘, g‘). */}
            <Text style={styles.fieldHint}>
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

      <RegionPickerModal
        visible={!!picker}
        title={picker === 'region' ? t('Viloyatni tanlang') : t('Tuman yoki shaharni tanlang')}
        data={picker === 'region' ? REGIONS.map(r => r.name) : districts}
        selected={picker === 'region' ? region : district}
        onPick={onPick}
        onClose={() => setPicker(null)}
      />
    </View>
  );
};

/** Marshrut: `edit: true` + `faoliyat_id` → tahrirlash ekrani, aks holda yaratish. */
const QarzDaftariFaoliyat = () => {
  const route = useRoute<any>();
  const isEdit = !!route.params?.edit && !!route.params?.faoliyat_id;
  return isEdit ? <QarzDaftariFaoliyatEdit /> : <QarzDaftariFaoliyatCreate />;
};

export default QarzDaftariFaoliyat;

const styles = StyleSheet.create({
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
});
