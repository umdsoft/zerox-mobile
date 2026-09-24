/**
 * QarzDaftariMijozYangi.tsx — "Yangi mijoz qo'shish" formasi.
 *
 * Web ekvivalenti: components/qarz-daftari/MijozModal.vue (do'kon egasi yangi
 * qarzdor qo'shadi). Ilgari mobil'da bu ekran YO'Q edi — "Yangi mijoz" tugmasi
 * faqat "Tez kunda" toast ko'rsatardi (SS5). Endi haqiqiy forma ochiladi.
 *
 * Route params: { faoliyat_id, faoliyat_nomi?, turi } — turi 'berish' | 'olish'
 *   (faqat rang semantikasi: berish = KO'K, olish = YASHIL).
 *
 * POST /qarz-daftari/savdo-faoliyat/:faoliyat_id/mijozlar  { fish, telefon }
 *   -> muvaffaqiyat: ro'yxatga qaytamiz (ro'yxat fokusda yangilanadi).
 *   -> 409 (phone-exists): telefon band — xabar ko'rsatamiz.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { formatPhone9 } from '../../../helper/phone';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import { ContactBookIcon, PencilIcon, PlusIcon, UserIcon } from '../redesign/icons';
import ClientRegisterAnimation from '../../../images/clientRegisterAnim';
import { isContactPickerAvailable, pickContact } from '../../../nativemodule/contactPicker';

const BLUE = '#2f6fed'; // berish
const GREEN = '#16a34a'; // olish

const QarzDaftariMijozYangi = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  const faoliyat_id = route.params?.faoliyat_id;
  /**
   * SS8-1 (2026-09-14): shu forma endi TAHRIRLASH uchun ham ishlaydi.
   * `edit: true` + `mijoz_id` berilsa — FISH/telefon old to'ldiriladi va
   * saqlashda POST o'rniga PUT /qarz-daftari/mijozlar/:id yuboriladi.
   * Alohida ekran yaratilmadi: maydonlar, telefon formati, kontakt tanlagich
   * va validatsiya AYNAN bir xil — ikkinchi nusxa ikki joyда tuzatish talab
   * qilardi.
   */
  const isEdit = !!route.params?.edit && !!route.params?.mijoz_id;
  const mijoz_id = route.params?.mijoz_id;
  const turi: 'berish' | 'olish' = route.params?.turi === 'olish' ? 'olish' : 'berish';
  const isOlish = turi === 'olish';
  const accent = isOlish ? GREEN : BLUE;
  const accentBg = isOlish ? '#F0FDF4' : '#EFF6FF';

  const token = storage.getString('token');

  const [fish, setFish] = React.useState(() => String(route.params?.fish || ''));
  // faqat +998 dan keyingi 9 raqam
  const [phone, setPhone] = React.useState(() => {
    const d = String(route.params?.telefon || '').replace(/\D/g, '');
    return (d.startsWith('998') ? d.slice(3) : d).slice(0, 9);
  });
  const [submitting, setSubmitting] = React.useState(false);

  // Telefon: foydalanuvchi faqat raqam kiritadi, +998 doim old qo'shiladi.
  const onPhoneChange = (txt: string) => {
    let digits = txt.replace(/[^\d]/g, '');
    // "+998..." yopishtirilsa 998 prefiksini olib tashlaymiz.
    if (digits.startsWith('998')) digits = digits.slice(3);
    setPhone(digits.slice(0, 9));
  };
  const canPickContact = isContactPickerAvailable();

  // Telefon kontaktlaridan tanlash (tizim tanlagichi — READ_CONTACTS ruxsatsiz).
  // Tanlangan raqam +998 formatiga keltiriladi; FISH bo'sh bo'lsa kontakt ismi
  // bilan to'ldiriladi (foydalanuvchi keyin tahrirlashi mumkin).
  const onPickContact = async () => {
    const picked = await pickContact();
    if (!picked) return; // bekor qilindi
    if (picked.phone9) setPhone(picked.phone9);
    if (!fish.trim() && picked.name) setFish(picked.name);
    if (picked.phone9 && picked.phone9.length !== 9) {
      Toast.show({
        type: 'error2',
        props: { desc: t("Tanlangan raqam O‘zbekiston formatiga mos emas") },
      });
    }
  };

  const fullPhone = phone ? `+998${phone}` : '';
  // So'rov SS5: telefon TO'LIQ (9 raqam) kiritilmaguncha Saqlash NOFAOL — xato
  // matni ko'rsatilmaydi, faqat tugma nofaol turadi.
  const canSave = !!fish.trim() && phone.length === 9;
  // Ko'rsatishда bo'shliqли format: "93 752 44 11" (2-3-2-2). Stateда faqat raqam.
  // SS-AUDIT (2026-09-25): helper/phone.formatPhone9 (yagona manba).
  const formatPhone = formatPhone9;

  const handleSubmit = async () => {
    if (submitting) return;
    if (!fish.trim()) {
      Toast.show({ type: 'error2', props: { desc: t('FISH kiritilishi shart') } });
      return;
    }
    if (phone.length > 0 && phone.length !== 9) {
      Toast.show({
        type: 'error2',
        props: { desc: t("Telefon formati noto'g'ri (+998XXXXXXXXX)") },
      });
      return;
    }

    try {
      setSubmitting(true);
      const body = { fish: fish.trim(), telefon: fullPhone };
      const headers = { Authorization: `Bearer ${token}` };
      const res = isEdit
        ? await axios.put(`${URL}/qarz-daftari/mijozlar/${mijoz_id}`, body, { headers })
        : await axios.post(
            `${URL}/qarz-daftari/savdo-faoliyat/${faoliyat_id}/mijozlar`,
            body,
            { headers },
          );
      if (isEdit) {
        if (res.data?.success) {
          Toast.show({ type: 'omad', props: { desc: t('Mijoz ma’lumotlari saqlandi') } });
          // Mijoz sahifasiga qaytamiz — u fokusda qayta yuklanadi.
          navigation.goBack();
        } else {
          Toast.show({ type: 'error2', props: { desc: t('Xatolik yuz berdi') } });
        }
      } else if (res.data?.success) {
        Toast.show({ type: 'omad', props: { desc: t('Mijoz qo‘shildi') } });
        // SS7-1 (2026-09-14): yangi mijoz qo'shilgach TO'G'RIDAN-TO'G'RI qarz
        // formasi ochiladi — foydalanuvchi bu yerga aynan "qarz berish/olish"
        // uchun kelgan, ro'yxatga qaytarib yana mijozni izlatish ortiqcha qadam.
        // `replace` — bu forma orqaga stekda QOLMAYDI, ya'ni qarz formasidan
        // orqaga bosilsa mijozlar ro'yxatiga qaytiladi (yana "mijoz qo'shish"
        // formasiga emas).
        const yangi = res.data?.data;
        if (yangi?.id) {
          navigation.replace('QarzDaftariYangi', {
            faoliyat_id: yangi.savdo_faoliyat_id ?? faoliyat_id,
            mijoz_id: yangi.id,
            fish: fish.trim(),
            turi,
            // Yangi mijozda qoldiq har doim 0.
            qoldiq_uzs: 0,
            qoldiq_usd: 0,
          });
        } else {
          // Zaxira: javobda id bo'lmasa eski xatti-harakat (ro'yxatga qaytish).
          navigation.goBack();
        }
      } else {
        Toast.show({ type: 'error2', props: { desc: t('Xatolik yuz berdi') } });
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const msg =
        status === 409 || code === 'phone-exists'
          ? t('Siz ushbu telefon raqamining foydalanuvchisini mijoz sifatida oldin ro‘yxatdan o‘tkazgansiz.')
          : error?.response?.data?.message || t('Xatolik yuz berdi');
      Toast.show({ type: 'error2', props: { desc: msg } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={isEdit ? t('Mijozni tahrirlash') : t('Yangi mijoz')} />

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
          {/* Guruh (ikona + karta + forma) VERTIKAL MARKAZда: ikona biroz pastroqда,
              karta biroz teparoqда — orasidagi katta bo'shliq yo'qoladi (so'rov). */}
          <View style={{ flex: 1 }} />

          {/* SS17/SS18: oddiy pulsli doira o'rniga MAQSADLI animatsiya —
              kengayuvchi "ro'yxatdan o'tish" halqalari + amal nishoni
              (qo'shishda "+", tahrirlashda qalam). */}
          <View style={styles.hero}>
            <ClientRegisterAnimation
              size={rs(104)}
              color={accent}
              mode={isEdit ? 'edit' : 'add'}
            />
          </View>

          {/* Sarlavha kartasi — OCHIQ tint fon (so'rov: to'q ko'k tugmaga o'xshab
              qolgan edi → ochiq rang; matn/ikonka accent rangda). */}
          <View style={[styles.introCard, { backgroundColor: accent + '14', borderColor: accent + '33' }]}>
            <View style={[styles.introIcon, { backgroundColor: accent + '1F' }]}>
              {/* Ikonka ham rejimga ergashadi: matn “tahrirlash” deganda “+”
                  qolib ketgan edi. */}
              {isEdit ? (
                <PencilIcon size={rs(24)} color={accent} />
              ) : (
                <PlusIcon size={rs(24)} color={accent} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.introTitle, { color: accent }]}>
                {isEdit ? t('Mijoz ma’lumotlarini tahrirlash') : t('Yangi mijoz qo‘shish')}
              </Text>
            </View>
          </View>

          {/* Qarz oluvchi (berish) / beruvchi (olish) — F.I.Sh o'rniga (so'rov) */}
          <Text style={styles.label}>
            {isOlish
              ? t('Qarz beruvchini kiriting')
              : t('Qarz oluvchini kiriting')}
          </Text>
          <View style={styles.inputWrap}>
            <UserIcon size={rs(18)} color={rd.color.textTertiary} />
            <TextInput
              style={styles.input}
              value={fish}
              onChangeText={setFish}
              placeholder=""
              placeholderTextColor={rd.color.textTertiary}
              autoCapitalize="words"
              // SS17/SS18 (2026-09-15): telefon maydonida `allowFontScaling={false}`
              // bor edi, bu yerda esa YO'Q. Tizim shrift-masshtabi 1 dan katta
              // bo'lsa FISH kattalashib, telefon o'z o'lchamida qolardi — shu bois
              // telefon "kichkina" ko'rinardi. Endi IKKALASI ham masshtabdan
              // tashqarida, ya'ni o'lchamlari doim teng.
              allowFontScaling={false}
            />
          </View>

          {/* Telefon (ixtiyoriy) — so'rov SS5: yozayotganda "noto'g'ri" XATO
              CHIQMAYDI (na matn, na qizil ramka). To'liq/to'g'ri bo'lmasa faqat
              Saqlash tugmasi NOFAOL qoladi (canSave). */}
          <Text style={styles.label}>{t('Telefon raqamini kiriting')}</Text>
          <View style={styles.inputWrap}>
            <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
            <TextInput
              style={styles.input}
              value={formatPhone(phone)}
              onChangeText={onPhoneChange}
              keyboardType="number-pad"
              placeholder="__ ___ __ __"
              placeholderTextColor={rd.color.textTertiary}
              maxLength={13}
              // SS10: "+998" prefiksi bilan BIR XIL o'lchamda ko'rinishi uchun
              // ikkalasi ham tizim shrift-masshtabidan tashqarida bo'lishi shart.
              allowFontScaling={false}
            />
            {/* Kontaktlardan tanlash — faqat Android (tizim tanlagichi). */}
            {canPickContact && (
              <TouchableOpacity
                onPress={onPickContact}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                style={[styles.contactBtn, { backgroundColor: accentBg }]}
              >
                <ContactBookIcon size={rs(20)} color={accent} />
              </TouchableOpacity>
            )}
          </View>

          {/* Saqlash — FISH kiritilmagунча OQ/rangsiz (nofaol), kiritilgach accent
              rang (so'rov). Telefon ixtiyoriy (bo'sh yoki 9 raqam). */}
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={submitting || !canSave}
            onPress={handleSubmit}
            style={[
              styles.submitBtn,
              canSave ? { backgroundColor: accent } : styles.submitBtnDisabled,
              submitting && { opacity: 0.7 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={canSave ? '#fff' : rd.color.textTertiary} />
            ) : (
              <Text style={[styles.submitText, !canSave && styles.submitTextDisabled]}>
                {t('Saqlash')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Pastki bo'shliq — guruhni markazlashtiradi (ikona+karta+forma). */}
          <View style={{ flex: 1 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default QarzDaftariMijozYangi;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    // flexGrow: 1 + hero'дан keyingi flex:1 spacer -> forma pastga tushadi
    // (pastдаgi bo'sh joy yopiladi), tepадаgi joyni harakatlanuvchi ikona to'ldiradi.
    flexGrow: 1,
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(24),
    gap: rs(8),
  },
  hero: { alignItems: 'center', marginBottom: rs(22) },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(6),
  },
  introIcon: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: rd.color.text },
  introNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },
  label: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    marginTop: rs(8),
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
    // SS-D/SS-E (2026-09-16): KIRITILGAN qiymat (FISh va telefon raqami)
    // yorliqdan KATTA bo'lsin — asosiy ma'lumot o'sha, yorliq esa faqat
    // tushuntirish. (Ilgari ikkalasi ham rs13.5 edi va qiymat mayda ko'rinardi.)
    // FISh va telefon BIR XIL o'lchamda — ular bitta forma qatori.
    fontSize: rs(16.5),
    color: rd.color.text,
    paddingVertical: rs(13),
  },
  phonePrefix: {
    fontFamily: rd.font.bold,
    // "+998" raqamlar bilan bir xil o'lchamda bo'lishi kerak (bitta qiymat).
    fontSize: rs(16.5),
    color: rd.color.textSecondary,
  },
  contactBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: rs(6),
  },
  errText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.error,
    marginTop: rs(2),
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    borderRadius: rd.radius.pill,
    paddingVertical: rs(15),
    marginTop: rs(20),
  },
  submitText: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: '#fff' },
  // FISH kiritilmagунда — OQ/rangsiz karta (chegara bilan).
  submitBtnDisabled: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
  },
  submitTextDisabled: { color: rd.color.textTertiary },
});
