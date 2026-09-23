/**
 * QarzDaftariKarta.tsx — SS2-5: "Plastik karta ulash".
 *
 * Do'kon egasi o'z plastik kartasini va Telegram uchun telefon raqamini kiritadi.
 * Mijozlar qarzni shu kartaga o'tkazishi mumkin bo'ladi.
 *
 * Backend: GET  /qarz-daftari/savdo-faoliyat  (ro'yxatdan joriy do'kon olinadi)
 *          PUT  /qarz-daftari/savdo-faoliyat/:id  { nomi, karta_raqami, karta_egasi, telegram_telefon }
 *
 * ⚠️ FAQAT do'kon egasi uchun (xodim bu ekranga kira olmaydi — chaqiruvchi tomonda
 *    `isXodimSession()` bilan yashirilgan).
 */
import { useNavigation, useRoute } from '@react-navigation/native';
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
import axios from 'axios';
import { useFetch } from '../../../hooks/useFetch';
import { storage } from '../../../store/api/token/getToken';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { CheckIcon, IdCardIcon, PencilIcon, StorefrontIcon } from '../redesign/icons';
import { internationalScheme, isLocalCard, localBrand } from '../../../helper/cardBin';

const BLUE = '#2f6fed';

/**
 * SS15 (2026-09-15): ilgari FAQAT `8600`/`9860` qabul qilinardi, lekin
 * Uzcard/Humo emitentlarida boshqa BIN'lar ham bor (masalan `5614`) — ular
 * kiritib bo'lmasdi. Endi tekshiruv teskari: XALQARO sxemalar (Visa,
 * Mastercard, Amex, Diners, JCB, Discover) rad etiladi, qolgani o'tadi.
 * Mantiq `helper/cardBin.ts` da — backend'da ham AYNAN shu qoida bor (2-qatlam).
 */

// 16 raqamni "0000 0000 0000 0000" ko'rinishida ko'rsatamiz.
const fmtCard = (raw: string) => {
  const d = String(raw || '').replace(/\D/g, '').slice(0, 16);
  return d.replace(/(.{4})/g, '$1 ').trim();
};
// +998 90 123 45 67
const fmtPhone = (raw: string) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return p.join(' ');
};

const QarzDaftariKarta = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const faoliyat_id = route.params?.faoliyat_id;
  const faoliyat_nomi: string | undefined = route.params?.faoliyat_nomi;

  const { data, loading } = useFetch({
    url: `${URL}/qarz-daftari/savdo-faoliyat`,
    method: 'GET',
  });

  const [card, setCard] = React.useState('');
  const [owner, setOwner] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [filled, setFilled] = React.useState(false);
  /**
   * Rejim (so'rov): karta VA telegram raqami allaqachon ulangan bo'lsa — avval
   * KO'RISH sahifasi ochiladi (ulangan ma'lumotlar + tahrirlash tugmasi).
   * Forma esa faqat tahrirlash bosilganda yoki hali hech narsa ulanmaganda.
   */
  const [mode, setMode] = React.useState<'view' | 'edit'>('edit');

  // Mavjud qiymatlarni bir marta forma'ga joylaymiz.
  const shops: any[] = (data as any)?.data || [];
  React.useEffect(() => {
    if (filled || !shops.length) return;
    const cur = shops.find((s: any) => String(s.id) === String(faoliyat_id));
    if (!cur) return;
    setCard(fmtCard(cur.karta_raqami || ''));
    setOwner(cur.karta_egasi || '');
    setPhone(fmtPhone(cur.telegram_telefon || ''));
    // Ikkalasi ham ulangan bo'lsa — KO'RISH rejimi.
    if (cur.karta_raqami && cur.telegram_telefon) setMode('view');
    setFilled(true);
  }, [shops, faoliyat_id, filled]);

  const cardDigits = card.replace(/\D/g, '');
  const phoneDigits = phone.replace(/\D/g, '');
  // Bo'sh forma ham saqlanadi (rekvizitni O'CHIRISH uchun); to'ldirilgan bo'lsa — to'liq bo'lsin.
  const cardLocal = isLocalCard(cardDigits);
  const foreignScheme = internationalScheme(cardDigits);
  const valid =
    (cardDigits.length === 0 || cardDigits.length === 16) &&
    cardLocal &&
    (phoneDigits.length === 0 || phoneDigits.length === 9);

  const submit = async () => {
    if (saving || !valid) return;
    const cur = shops.find((s: any) => String(s.id) === String(faoliyat_id));
    try {
      setSaving(true);
      await axios.put(
        `${URL}/qarz-daftari/savdo-faoliyat/${faoliyat_id}`,
        {
          // `nomi` backend validatsiyasi uchun MAJBURIY — mavjud nomni o'zgarishsiz yuboramiz.
          nomi: cur?.nomi || faoliyat_nomi,
          karta_raqami: cardDigits,
          karta_egasi: owner.trim(),
          telegram_telefon: phoneDigits,
        },
        { headers: { Authorization: `Bearer ${storage.getString('token')}` } },
      );
      // So'rov: sahifa PASTIDA tasdiq xabari. `goBack()` QILMAYMIZ —
      // App.tsx navigatsiya listeneri toast'ni darhol yopib yuborardi, qolaversa
      // foydalanuvchi saqlangan ma'lumotni ko'rib tasdiqlashi qulayroq.
      setMode('view');
      Toast.show({
        type: 'omad',
        position: 'bottom',
        visibilityTime: 3500,
        props: { desc: t('Karta ma’lumotlari va telegram raqami saqlandi.') },
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || t('Xatolik yuz berdi');
      Toast.show({ type: 'error2', props: { desc: String(msg) } });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS9 (2026-09-18): ikkala karta formasida BIR XIL sarlavha. */}
      <RdHeader title={t('Plastik karta ma’lumotlari')} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Intro */}
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <IdCardIcon size={rs(24)} color={BLUE} />
            </View>
            <Text style={styles.introText}>
              {t('Mijozlar qarzni plastik kartaga o‘tkazishi uchun karta ma’lumotlarini kiriting.')}
            </Text>
          </View>

          {/* SS3-2: do'kon nomi oldida DO'KONCHA ikonasi — nom qaysi obyektga
              tegishli ekani bir qarashda ko'rinsin. */}
          {!!faoliyat_nomi && (
            <View style={styles.shopRow}>
              <StorefrontIcon size={rs(17)} color={BLUE} />
              <Text style={styles.shopName}>{faoliyat_nomi}</Text>
            </View>
          )}

          {/* KO'RISH REJIMI (so'rov): karta va telegram raqami ULANGAN bo'lsa,
              ekranga kirilganda avval SHU sahifa chiqadi — nima ulanganini
              ko'rsatadi. Har qatorning oxirida TAHRIRLASH tugmasi: karta
              o'zgarsa yoki qarzlarni boshqa kartaga tushirmoqchi bo'lsa,
              foydalanuvchi shu tugma orqali formaga o'tadi. */}
          {mode === 'view' ? (
            <>
              <View style={styles.viewCard}>
                <View style={styles.viewIcon}>
                  <IdCardIcon size={rs(19)} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.viewLabel}>{t('Plastik karta')}</Text>
                  <Text style={styles.viewValue} allowFontScaling={false} numberOfLines={1}>
                    {card}
                  </Text>
                  <Text style={styles.viewSub} numberOfLines={1}>
                    {[localBrand(cardDigits), owner].filter(Boolean).join(' · ') || t('Karta egasi ko‘rsatilmagan')}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.viewEditBtn}
                  onPress={() => setMode('edit')}>
                  <PencilIcon size={rs(18)} color={BLUE} />
                </TouchableOpacity>
              </View>

              <View style={styles.viewCard}>
                <View style={styles.viewIcon}>
                  <CheckIcon size={rs(18)} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.viewLabel}>{t('Telegram uchun telefon raqami')}</Text>
                  <Text style={styles.viewValue} allowFontScaling={false} numberOfLines={1}>
                    +998 {phone}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.viewEditBtn}
                  onPress={() => setMode('edit')}>
                  <PencilIcon size={rs(18)} color={BLUE} />
                </TouchableOpacity>
              </View>

              <Text style={styles.hint}>
                {t('Mijoz qarzni plastik kartangizga o‘tkazganligi to‘g‘risida sizga telegram orqali xabar beradi.')}
              </Text>
            </>
          ) : (
          <>

          {/* Karta raqami */}
          <Text style={styles.label}>{t('Plastik karta raqami')}</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={card}
              onChangeText={v => setCard(fmtCard(v))}
              keyboardType="number-pad"
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={rd.color.textTertiary}
              maxLength={19}
              allowFontScaling={false}
            />
          </View>
          {/* Milliy karta ko'rsatkichi: to'g'ri bo'lsa tizim nomi, aks holda xato. */}
          {cardDigits.length >= 4 && (
            <Text style={[styles.hint, !cardLocal && styles.hintErr]}>
              {!cardLocal
                ? t('{{scheme}} kartasi qabul qilinmaydi — O‘zbekiston kartasini kiriting', {
                    scheme: foreignScheme,
                  })
                : localBrand(cardDigits)
                ? t('{{brand}} kartasi', { brand: localBrand(cardDigits) })
                : ''}
            </Text>
          )}

          {/* Karta egasi */}
          <Text style={styles.label}>{t('Karta egasi')}</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={owner}
              onChangeText={setOwner}
              placeholder={t('Familiya Ism')}
              placeholderTextColor={rd.color.textTertiary}
              maxLength={100}
              allowFontScaling={false}
            />
          </View>

          {/* Telegram telefon */}
          <Text style={styles.label}>{t('Telegram uchun telefon raqami')}</Text>
          <View style={styles.inputBox}>
            <Text allowFontScaling={false} style={styles.prefix}>+998</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={v => setPhone(fmtPhone(v))}
              keyboardType="number-pad"
              placeholder="__ ___ __ __"
              placeholderTextColor={rd.color.textTertiary}
              maxLength={12}
              allowFontScaling={false}
            />
          </View>
          <Text style={styles.hint}>
            {t('Mijoz qarzni plastik kartangizga o‘tkazganligi to‘g‘risida sizga telegram orqali xabar beradi.')}
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!valid || saving}
            onPress={submit}
            style={[styles.saveBtn, (!valid || saving) && { opacity: 0.5 }]}>
            <Text style={styles.saveBtnText}>{t('Saqlash')}</Text>
          </TouchableOpacity>
          </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default QarzDaftariKarta;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(12), paddingBottom: rs(32) },

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.lg,
    padding: rs(14),
    marginBottom: rs(16),
  },
  introIcon: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.text,
    lineHeight: rs(18),
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(7),
    marginBottom: rs(10),
  },
  shopName: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  label: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(6),
    marginTop: rs(10),
  },
  inputBox: {
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
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  hintErr: { color: '#dc2626', fontFamily: rd.font.medium },
  // KO'RISH rejimi kartalari (ulangan karta / telegram raqami)
  viewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(13),
    marginBottom: rs(12),
  },
  viewIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewLabel: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary },
  viewValue: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text, marginTop: rs(2) },
  viewSub: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  viewEditBtn: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.surfaceAlt,
  },
  hint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(6),
  },
  saveBtn: {
    marginTop: rs(26),
    height: rs(52),
    borderRadius: rd.radius.lg,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: rd.font.bold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
});
