/**
 * FinancePayoutCard.tsx — SS2: "Plastik karta ma'lumotlari" (shaxsiy qarzlar uchun).
 *
 * Foydalanuvchi o'z plastik kartasini va Telegram uchun telefon raqamini kiritadi.
 * "Qarzni qaytarishni talab qilish" SMS'ida qarzdorga aynan shu rekvizitlar boradi,
 * shuning uchun ular TO'LDIRILMAGUNCHA talab qilish mumkin emas.
 *
 * Backend: GET/PUT /finance/payout-card
 */
import { useNavigation } from '@react-navigation/native';
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
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { financeApi } from './financeApi';
import { IdCardIcon } from '../redesign/icons';

const BLUE = '#2f6fed';

const fmtCard = (raw: string) =>
  String(raw || '').replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const fmtPhone = (raw: string) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
};

const FinancePayoutCard = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = React.useState(true);
  const [card, setCard] = React.useState('');
  const [holder, setHolder] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await financeApi.getPayoutCard();
        const d = res.data?.data || {};
        setCard(fmtCard(d.card_number || ''));
        setHolder(d.card_holder || '');
        setPhone(fmtPhone(d.telegram_phone || ''));
      } catch (e) {
        Toast.show({ type: 'error2', props: { desc: 'Ma’lumotlarni yuklab bo‘lmadi' } });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cardDigits = card.replace(/\D/g, '');
  const phoneDigits = phone.replace(/\D/g, '');
  // Bo'sh forma ham saqlanadi (rekvizitni O'CHIRISH uchun); to'ldirilgan bo'lsa to'liq bo'lsin.
  const valid =
    (cardDigits.length === 0 || cardDigits.length === 16) &&
    (phoneDigits.length === 0 || phoneDigits.length === 9);

  const submit = async () => {
    if (saving || !valid) return;
    try {
      setSaving(true);
      await financeApi.savePayoutCard({
        card_number: cardDigits,
        card_holder: holder.trim(),
        telegram_phone: phoneDigits,
      });
      Toast.show({ type: 'omad', props: { desc: 'Karta ma’lumotlari saqlandi' } });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({
        type: 'error2',
        props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' },
      });
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <IdCardIcon size={rs(24)} color={BLUE} />
            </View>
            <Text style={styles.introText}>
              {t('Qarzdordan qarzni qaytarishni talab qilganingizda unga SMS orqali aynan shu karta raqami va Telegram raqamingiz yuboriladi.')}
            </Text>
          </View>

          <Text style={styles.label}>{t('Plastik karta raqami')}</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={card}
              onChangeText={v => setCard(fmtCard(v))}
              keyboardType="number-pad"
              // SS9: namuna ikkala formada bir xil — faqat nol.
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={rd.color.textTertiary}
              maxLength={19}
              allowFontScaling={false}
            />
          </View>

          <Text style={styles.label}>{t('Karta egasi (ixtiyoriy)')}</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={holder}
              onChangeText={setHolder}
              placeholder={t('Familiya Ism')}
              placeholderTextColor={rd.color.textTertiary}
              maxLength={100}
              allowFontScaling={false}
            />
          </View>

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
            {t('Pul o‘tkazilgach qarzdor shu raqamga Telegram orqali xabar beradi.')}
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!valid || saving}
            onPress={submit}
            style={[styles.saveBtn, (!valid || saving) && { opacity: 0.5 }]}>
            <Text style={styles.saveBtnText}>{t('Saqlash')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default FinancePayoutCard;

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
    marginBottom: rs(12),
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
  saveBtnText: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.onPrimary },
});
