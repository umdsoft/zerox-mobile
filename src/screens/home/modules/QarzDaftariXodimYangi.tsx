/**
 * QarzDaftariXodimYangi.tsx — SS4: "Yangi xodim qo'shish" / "Xodimni tahrirlash".
 *
 * ILGARI bu forma QarzDaftariXodimlar ichida `<Modal animationType="slide">` edi. Shu
 * sababli:
 *   1) sahifa PASTDAN YUQORIGA sirg'alib chiqardi (ilovaning boshqa sahifalaridan farqli),
 *   2) Modal ALOHIDA native oyna bo'lgani uchun Toast (ilova ildizida render bo'ladi)
 *      modal ORTIDA qolib, xato xabari KO'RINMASDI.
 * Ikkala nuqson ham shu ekranni HAQIQIY navigatsiya sahifasiga aylantirish bilan
 * bir yo'la hal bo'ladi.
 *
 * Route params: { faoliyat_id, faoliyat_nomi?, xodim? }  — `xodim` bo'lsa tahrirlash.
 * Backend: POST /qarz-daftari/savdo-faoliyat/:faoliyat_id/xodimlar
 *          PUT  /qarz-daftari/xodimlar/:id
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { formatPhone9, phoneDigits9 } from '../../../helper/phone';
import { useTranslation } from 'react-i18next';
import {
  Animated,
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
import axios from 'axios';
import { storage } from '../../../store/api/token/getToken';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { ContactBookIcon, UserPlusIcon } from '../redesign/icons';
// SS21: tizim kontakt-tanlagichi (READ_CONTACTS ruxsatisiz — mijoz formasi bilan bir xil).
import { isContactPickerAvailable, pickContact } from '../../../nativemodule/contactPicker';

const BLUE = '#2f6fed';

// SS-AUDIT (2026-09-25): helper/phone (yagona manba).
const parsePhone9 = phoneDigits9;
const formatPhone = formatPhone9;

const QarzDaftariXodimYangi = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  const faoliyat_id = route.params?.faoliyat_id;
  const xodim = route.params?.xodim;
  const editingId = xodim?.id ?? null;

  const [fish, setFish] = React.useState(String(xodim?.fish || ''));
  const [phone, setPhone] = React.useState(parsePhone9(xodim?.telefon));
  // "Login faol" checkbox UI'da YO'Q (SS8b) — qo'shishda true, tahrirlashda saqlanadi.
  const loginActive = React.useMemo(() => {
    if (!xodim) return true;
    const v = xodim?.login_active;
    return v === true || v === 1 || v === '1';
  }, [xodim]);
  const [submitting, setSubmitting] = React.useState(false);

  // SS4-3: tepadagi bo'sh joyda xodim qo'shishni ifodalovchi ANIMATSIYALI ikonka.
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
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
  };

  const onPhoneChange = (txt: string) => setPhone(parsePhone9(txt));

  /**
   * SS21 (2026-09-15): xodim telefonini QO'LDA yozish o'rniga telefon
   * kontaktlaridan tanlash. Tanlangach raqam +998 formatiga keltiriladi va
   * F.I.Sh bo'sh bo'lsa kontakt nomi bilan to'ldiriladi (do'kon egasi keyin
   * tahrirlashi mumkin). Mijoz formasidagi bilan AYNAN bir xil oqim.
   */
  const canPickContact = isContactPickerAvailable();
  const onPickContact = async () => {
    const picked = await pickContact();
    if (!picked) return; // bekor qilindi
    if (picked.phone9) setPhone(picked.phone9);
    if (!fish.trim() && picked.name) setFish(picked.name);
    if (picked.phone9 && picked.phone9.length !== 9) {
      Toast.show({
        type: 'error2',
        props: { desc: t('Tanlangan raqam O‘zbekiston formatiga mos emas') },
      });
    }
  };
  const fullPhone = `+998${phone}`;

  const handleSave = async () => {
    if (submitting) return;
    if (!fish.trim()) {
      Toast.show({ type: 'error2', position: 'bottom', props: { desc: t('FISH kiritilishi shart') } });
      return;
    }
    if (!/^\+998\d{9}$/.test(fullPhone)) {
      Toast.show({ type: 'error2', position: 'bottom', props: { desc: t('Telefon formati: +998XXXXXXXXX') } });
      return;
    }

    const payload = { fish: fish.trim(), telefon: fullPhone, login_active: loginActive };
    try {
      setSubmitting(true);
      const headers = { Authorization: `Bearer ${storage.getString('token')}` };
      const res = editingId
        ? await axios.put(`${URL}/qarz-daftari/xodimlar/${editingId}`, payload, { headers })
        : await axios.post(
            `${URL}/qarz-daftari/savdo-faoliyat/${faoliyat_id}/xodimlar`,
            payload,
            { headers },
          );

      if (res.data?.success) {
        Toast.show({
          type: 'omad',
          props: { desc: editingId ? t('Xodim yangilandi.') : t('Yangi xodim qo‘shildi.') },
        });
        // Ro'yxat useFocusEffect orqali o'zi yangilanadi.
        navigation.goBack();
      } else {
        Toast.show({ type: 'error2', position: 'bottom', props: { desc: res.data?.message || t('Xatolik yuz berdi') } });
      }
    } catch (e: any) {
      // SS4-1: xato TEPADA emas, PASTDA (yuqorida sarlavha ustiga tushardi).
      Toast.show({
        type: 'error2',
        position: 'bottom',
        props: { desc: e?.response?.data?.message || t('Xatolik yuz berdi') },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={editingId ? t('Xodimni tahrirlash') : t('Yangi xodim qo‘shish')} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* SS4-3: ANIMATSIYALI ikonka TEPADA; izoh va maydonlar undan PASTDA. */}
          <View style={styles.heroBox}>
            <Animated.View style={[styles.heroCircle, pulseStyle]}>
              <UserPlusIcon size={rs(34)} color={BLUE} />
            </Animated.View>
          </View>

          {!editingId && (
            <Text style={styles.subtitle}>
              {t('Xodim o‘z telefon raqami orqali tizimga kirib, do‘koningiz qarz daftarini yuritadi.')}
            </Text>
          )}

          {/* F.I.Sh */}
          <Text style={styles.label}>{t('F.I.Sh')}</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={fish}
              onChangeText={setFish}
              placeholder={t('Familiya Ism Sharif')}
              placeholderTextColor={rd.color.textTertiary}
              autoCapitalize="words"
              allowFontScaling={false}
            />
          </View>

          {/* Telefon */}
          <Text style={styles.label}>{t('Telefon (login)')}</Text>
          <View style={styles.inputWrap}>
            <Text allowFontScaling={false} style={styles.prefix}>+998</Text>
            <TextInput
              style={styles.input}
              value={formatPhone(phone)}
              onChangeText={onPhoneChange}
              keyboardType="number-pad"
              placeholder="__ ___ __ __"
              placeholderTextColor={rd.color.textTertiary}
              maxLength={12}
              allowFontScaling={false}
            />
            {/* SS21: kontaktlardan tanlash — card OXIRIDA, mijoz formasidagidek. */}
            {canPickContact && (
              <TouchableOpacity
                onPress={onPickContact}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                style={styles.contactBtn}>
                <ContactBookIcon size={rs(18)} color={rd.color.primary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.hint}>
            {t('Xodim shu raqam bilan kiradi (parolni o‘zi yaratadi)')}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cancelBtn}
              disabled={submitting}
              onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>{t('Bekor qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
              disabled={submitting}
              onPress={handleSave}>
              <Text style={styles.saveText}>{t('Saqlash')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default QarzDaftariXodimYangi;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(32) },

  // SS4-3: tepadagi animatsiyali ikonka
  heroBox: { alignItems: 'center', paddingVertical: rs(26) },
  heroCircle: {
    width: rs(82),
    height: rs(82),
    borderRadius: rs(41),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
    textAlign: 'center',
    marginBottom: rs(18),
  },
  label: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.text,
    marginBottom: rs(6),
    marginTop: rs(10),
  },
  // SS21: kontakt-tanlagich tugmasi (telefon maydoni oxirida).
  contactBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: rs(6),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rs(52),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  prefix: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.textSecondary,
    marginRight: rs(8),
  },
  input: {
    flex: 1,
    height: '100%',
    // SS4-2: "+998" prefiksi bilan BIR XIL qalinlik (ilgari medium edi — farq bilinardi).
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  hint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(6),
  },

  btnRow: { flexDirection: 'row', gap: rs(12), marginTop: rs(28) },
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
