/**
 * FinanceDebtAdd.tsx — Yangi shaxsiy qarz (web pages/finance/debts/add.vue).
 * type (olingan/berilgan) + manba nomi + manba turi + summa/valyuta + boshlanish/muddat
 * sanasi + foiz(%) + izoh. POST /finance/debts.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { formatPhone9 } from '../../../helper/phone';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ScreenLayout from '../../components/ScreenLayout';
import { rd, rs } from '../../../theme/rd';
import { financeApi } from './financeApi';
import { AmountField, CurrencyToggle, DateField, FieldLabel } from './financeForm';
import { localDateKey, num } from './financeMoney';
// SS2 (2026-09-17): "Kimga berdingiz / Kimdan oldingiz" ni telefon kitobidan
// to'g'ridan-to'g'ri tanlash — ism va raqam birga to'ldiriladi.
import { isContactPickerAvailable, pickContact } from '../../../nativemodule/contactPicker';
import { ContactBookIcon } from '../redesign/icons';

const RED = '#dc2626';
const GREEN = '#16a34a';

// So'rov SS16: "Manba turi" (Bank/Oila/Do'st/Boshqa) va "Foiz stavkasi" bo'limlari OLINDI.
// source_type doim 'other' yuboriladi, interest_rate null.

const FinanceDebtAdd = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // SS17: "Shaxsiy qarz" hero'sидagi "Qarz berish"/"Qarz olish" tugmalari
  // yo'nalishni OLDINDAN tanlab ochadi — foydalanuvchi bu yerda yana
  // tanlashiga hojat qolmaydi. Param bo'lmasa eski standart: 'borrowed'.
  const [type, setType] = React.useState<'borrowed' | 'lent'>(
    route?.params?.initialType === 'lent' ? 'lent' : 'borrowed',
  );
  // SS4 (2026-09-19): kontragent sahifasidan kelinsa ism/telefon tayyor turadi
  // — foydalanuvchi ularni qayta yozmaydi.
  const [sourceName, setSourceName] = React.useState(
    String(route?.params?.initialName || ''),
  );
  const [currency, setCurrency] = React.useState<'UZS' | 'USD'>('UZS');
  const [amount, setAmount] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date | null>(new Date());
  const [dueDate, setDueDate] = React.useState<Date | null>(null);
  const [notes, setNotes] = React.useState('');
  const [phone, setPhone] = React.useState(() => {
    // SS16: +998 dan keyingi 9 raqam
    const d = String(route?.params?.initialPhone || '').replace(/\D/g, '');
    return d.length > 9 ? d.slice(-9) : d;
  });
  const [notifySms, setNotifySms] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  /**
   * SS1 (2026-09-17) — FOYDALANUVCHINING O'Z FISh i.
   *
   * Telefon orqali ro'yxatdan o'tgan, ammo MyID identifikatsiyasidan O'TMAGAN
   * foydalanuvchining ismi tizimda YO'Q. Shaxsiy qarz hujjatida esa "kim berdi /
   * kim oldi" yozilishi shart. Shu bois BIRINCHI qarz kiritilayotganda o'z FISh i
   * so'raladi — "Kimga berdingiz" dan OLDIN, chunki bu avval o'zini tanitish.
   *
   * Bir marta kiritilgach tizimda saqlanadi va bu maydon BOSHQA CHIQMAYDI
   * (backend ham yozishni bir martaga cheklaydi — FISh moliyaviy hujjatlarda
   * ishlatilgani uchun keyin erkin o'zgartirib bo'lmaydi).
   */
  const [needFish, setNeedFish] = React.useState(false);
  const [fish, setFish] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await financeApi.getMe();
        const u: any = (r?.data as any)?.data || (r?.data as any) || {};
        const have = [u.last_name, u.first_name, u.middle_name]
          .map((x: any) => String(x || '').trim())
          .filter(Boolean)
          .join(' ');
        if (alive) setNeedFish(!have);
      } catch (_) {
        // Tarmoq xatosi — maydonni ko'rsatmaymiz (qarz kiritishni bloklamaslik uchun).
        if (alive) setNeedFish(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const accent = type === 'borrowed' ? RED : GREEN;

  // SS16: faqat raqam, +998 old-prefiks (9 raqam).
  const onPhoneChange = (txt: string) => {
    let d = txt.replace(/[^\d]/g, '');
    if (d.startsWith('998')) d = d.slice(3);
    setPhone(d.slice(0, 9));
  };
  // R20: ko'rsatishда "90 123 45 67" (2-3-2-2).
  // SS-AUDIT (2026-09-25): helper/phone.formatPhone9 (yagona manba).
  const formatPhone = formatPhone9;

  // SS2: kontaktdan tanlash — ism va telefon BIRGA to'ldiriladi (foydalanuvchi
  // raqamni qo'lda ko'chirmasin; xato kiritish ham yo'qoladi).
  const canPickContact = isContactPickerAvailable();
  const onPickContact = async () => {
    const c = await pickContact();
    if (!c) return;
    if (c.name) setSourceName(c.name);
    if (c.phone9) setPhone(c.phone9);
  };

  const submit = async () => {
    if (saving) return;
    // SS1: o'z FISh i — boshqa maydonlardan OLDIN tekshiriladi (forma tartibi bilan bir xil).
    if (needFish && fish.trim().split(/\s+/).filter(Boolean).length < 2) {
      Toast.show({ type: 'error2', props: { desc: 'O‘z FISh ingizni to‘liq kiriting' } });
      return;
    }
    if (!sourceName.trim()) {
      Toast.show({ type: 'error2', props: { desc: 'Kimdan/kimga ekanini kiriting' } });
      return;
    }
    const amt = num(amount);
    if (amt <= 0) {
      Toast.show({ type: 'error2', props: { desc: 'Summani kiriting' } });
      return;
    }
    if (!startDate) {
      Toast.show({ type: 'error2', props: { desc: 'Boshlanish sanasini tanlang' } });
      return;
    }
    try {
      setSaving(true);
      // SS1: FISh AVVAL saqlanadi — qarz yozuvi hujjatda to'g'ri ism bilan chiqsin.
      // Saqlanmasa qarz ham yaratilmaydi (ikki xil holat qolib ketmasin).
      if (needFish) {
        try {
          await financeApi.setMyFish(fish.trim());
          setNeedFish(false);
        } catch (e: any) {
          const msg = e?.response?.data?.message || 'FISh ni saqlab bo‘lmadi';
          Toast.show({ type: 'error2', props: { desc: msg } });
          setSaving(false);
          return;
        }
      }
      await financeApi.createDebt({
        type,
        source_type: 'other',
        source_name: sourceName.trim(),
        amount: amt,
        currency,
        interest_rate: null,
        start_date: localDateKey(startDate),
        due_date: dueDate ? localDateKey(dueDate) : null,
        notes: notes.trim() || null,
        // SS16: telefon (ixtiyoriy) + SMS yuborish tanlovi.
        phone: phone.length === 9 ? `+998${phone}` : null,
        notify_sms: phone.length === 9 && notifySms,
      });
      Toast.show({ type: 'omad', props: { desc: 'Qarz qo‘shildi' } });
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout title={type === 'borrowed' ? t('Qarz olish') : t('Qarz berish')} scroll>
      {/*
        SS2 (2026-09-15): "Olingan — men qarzdorman" / "Berilgan — menga qarzdor"
        TANLAGICHI OLIB TASHLANDI. Sabab: yo'nalish asosiy ekrandagi "Qarz berish"
        va "Qarz olish" tugmalari orqali ALLAQACHON tanlangan — bu yerda uni
        qaytadan so'rash ortiqcha va chalkash edi (ikki joyda ikki xil tanlov).
        O'rniga — tanlangan yo'nalishni TASDIQLAYDIGAN ixcham banner: foydalanuvchi
        qayerga kirganini ko'rib turadi, lekin forma bo'sh joy egallamaydi.
      */}
      <View
        style={[
          styles.dirBanner,
          { backgroundColor: accent + '12', borderColor: accent + '33' },
        ]}>
        <View style={[styles.dirBannerIcon, { backgroundColor: accent + '1F' }]}>
          <Text style={styles.dirBannerEmoji}>{type === 'borrowed' ? '📥' : '📤'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={[styles.dirBannerTitle, { color: accent }]}>
            {type === 'borrowed' ? t('Olingan qarz') : t('Berilgan qarz')}
          </Text>
          <Text allowFontScaling={false} style={styles.dirBannerNote}>
            {type === 'borrowed' ? t('Siz qarzdorsiz') : t('Sizga qarzdor')}
          </Text>
        </View>
      </View>

      {/* SS1: o'z FISh i — faqat tizimda ism BO'LMAGANDA va faqat BIR MARTA. */}
      {needFish && (
        <>
          <FieldLabel>{t('Sizning FISh ingiz')}</FieldLabel>
          <TextInput
            allowFontScaling={false}
            value={fish}
            onChangeText={setFish}
            placeholder={t('Familiya Ism Sharif')}
            placeholderTextColor={rd.color.textTertiary}
            style={styles.input}
          />
          <Text allowFontScaling={false} style={styles.fishHint}>{t('Hujjatlarda shu ism ko‘rsatiladi. Bir marta kiritiladi.')}</Text>
        </>
      )}

      <FieldLabel>{type === 'borrowed' ? t('Kimdan oldingiz') : t('Kimga berdingiz')}</FieldLabel>
      <View style={styles.nameWrap}>
        <TextInput
          allowFontScaling={false}
          value={sourceName}
          onChangeText={setSourceName}
          // Namuna matni QISQARTIRILDI: shrift kattalashgani (rs16.5) va yonida
          // kontakt tugmasi paydo bo'lgani uchun eski matn ikki qatorga sinib
          // KESILIB qolardi. `numberOfLines` qo'shimcha kafolat.
          placeholder={t('Masalan: Abdullayev Abdulla')}
          placeholderTextColor={rd.color.textTertiary}
          numberOfLines={1}
          style={styles.nameInput}
        />
        {canPickContact && (
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: accent + '14' }]}
            onPress={onPickContact}
            accessibilityLabel="Kontaktlardan tanlash">
            <ContactBookIcon size={rs(18)} color={accent} />
          </TouchableOpacity>
        )}
      </View>

      {/* SS16/R20: telefon raqami (ixtiyoriy) — "90 123 45 67" formatда. */}
      <FieldLabel>{t('Telefon raqami (ixtiyoriy)')}</FieldLabel>
      <View style={styles.phoneWrap}>
        <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
        <TextInput
          allowFontScaling={false}
          value={formatPhone(phone)}
          onChangeText={onPhoneChange}
          keyboardType="number-pad"
          placeholder="__ ___ __ __"
          placeholderTextColor={rd.color.textTertiary}
          maxLength={13}
          style={styles.phoneInput}
        />
      </View>

      {/* SS1 (2026-09-17): valyuta endi ALOHIDA bo'lim — ikkita keng karta
          ("UZS so'm" / "USD dollar"). Ilgari "Summa" yorlig'i yonidagi mayda
          ikki tugma edi: tanlangan valyuta ko'zga tashlanmasdi. */}
      <FieldLabel>{t('Valyutani tanlang')}</FieldLabel>
      <View style={styles.curRow}>
        {([
          { code: 'UZS', word: 'so‘m' },
          { code: 'USD', word: 'dollar' },
        ] as const).map(c => {
          const on = currency === c.code;
          return (
            <TouchableOpacity
              key={c.code}
              activeOpacity={0.85}
              onPress={() => setCurrency(c.code)}
              style={[
                styles.curCard,
                on && { borderColor: accent, backgroundColor: accent + '10' },
              ]}>
              <Text allowFontScaling={false} style={[styles.curCode, on && { color: accent }]}>
                {c.code}
              </Text>
              <Text allowFontScaling={false} style={styles.curWord}>{t(c.word)}</Text>
              {/* SS1 (2026-09-17): kod va to'liq nom ENDI IKKI QATOR — yonma-yon
                  turganda "UZS so'm" siqilib beo'xshov ko'rinardi. */}
            </TouchableOpacity>
          );
        })}
      </View>

      <FieldLabel>{t('Summa')}</FieldLabel>
      <AmountField value={amount} onChange={setAmount} currency={currency} />

      <View style={{ marginTop: rs(10) }}>
        <DateField label={t('Boshlanish sanasi')} value={startDate} onChange={setStartDate} accent={accent} />
      </View>
      <View style={{ marginTop: rs(10) }}>
        <DateField label={t('Qaytarish muddati (ixtiyoriy)')} value={dueDate} onChange={setDueDate} accent={accent} minimumDate={startDate || undefined} placeholder={t('Tanlanmagan')} />
      </View>

      <FieldLabel>{t('Izoh (ixtiyoriy)')}</FieldLabel>
      <TextInput
        allowFontScaling={false}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('Qo‘shimcha izoh')}
        placeholderTextColor={rd.color.textTertiary}
        multiline
        style={[styles.input, styles.textarea]}
      />

      {/* R20: "Qarz haqida SMS yuborish" — Saqlash tugmasi USTIDA, DOIM ko'rinadi
          (summa kiritilgan/kiritilmagan). Telefon to'liq bo'lmasa — nofaol. */}
      <View style={styles.smsRow}>
        <View style={{ flex: 1, paddingRight: rs(10) }}>
          <Text allowFontScaling={false} style={styles.smsLabel}>{t('Qarz haqida SMS yuborish')}</Text>
          <Text allowFontScaling={false} style={styles.smsSub}>
            {phone.length !== 9
              ? 'Yuborish uchun telefon raqamini to‘liq kiriting.'
              : type === 'borrowed'
              ? t('Ushbu raqamga sizdan qarz olingani haqida SMS yuboriladi.') : t('Ushbu raqamga qarz berilgani haqida SMS yuboriladi.')}
          </Text>
        </View>
        <Switch
          value={notifySms && phone.length === 9}
          disabled={phone.length !== 9}
          onValueChange={setNotifySms}
          trackColor={{ true: accent, false: rd.color.border }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: accent }, saving && { opacity: 0.6 }]}
        onPress={submit}
        disabled={saving}
        activeOpacity={0.85}>
        <Text allowFontScaling={false} style={styles.saveText}>{t('Saqlash')}</Text>
      </TouchableOpacity>
      <View style={{ height: rs(8) }} />
    </ScreenLayout>
  );
};

export default FinanceDebtAdd;

const styles = StyleSheet.create({
  // So'rov SS16.1: Olingan/Berilgan toggle IXCHAMROQ (padding 14→9, emoji 22→18).
  // SS2: yo'nalishni TASDIQLAYDIGAN ixcham banner (eski tanlagich o'rniga).
  dirBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: rs(14),
    paddingVertical: rs(9),
    marginBottom: rs(2),
  },
  dirBannerIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirBannerEmoji: { fontSize: rs(18) },
  dirBannerTitle: { fontFamily: rd.font.bold, fontSize: rs(14) },
  dirBannerNote: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginTop: rs(2),
  },


  input: {
    // SS1-c: forma bir oynaga sig'ishi uchun maydon balandligi qisqartirildi.
    minHeight: rs(42),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(14),
    paddingVertical: rs(9),
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  // So'rov: "Saqlash" bir ekранга sig'ishi uchun IXCHAM.
  textarea: { height: rs(40), textAlignVertical: 'top' },
  // SS16: telefon + SMS toggle
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rs(46),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(14),
  },
  phonePrefix: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.textSecondary, marginRight: rs(8) },
  phoneInput: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text, padding: 0 },
  // R20: inline valyuta toggle (Summa yorlig'i yonida)
  // SS1: FISh maydoni ostidagi izoh — nega so'ralayotgani va bir martaligi.
  fishHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11),
    color: rd.color.textTertiary,
    marginTop: rs(4),
  },
  // SS1: valyuta kartalari (3-rasmdagi ko'rinish).
  curRow: { flexDirection: 'row', gap: rs(10) },
  curCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(1),
    paddingVertical: rs(7),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
  },
  curCode: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  curWord: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
  // SS2: ism maydoni + kontakt tugmasi.
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: rs(42),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    paddingHorizontal: rs(10),
  },
  nameInput: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(16.5),
    color: rd.color.text,
    paddingVertical: rs(9),
    paddingHorizontal: rs(4),
  },
  contactBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: rs(4),
  },
  smsRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(8) },
  smsLabel: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  smsSub: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2) },

  saveBtn: { height: rs(46), borderRadius: rd.radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: rs(10) },
  saveText: { fontFamily: rd.font.semibold, fontSize: rs(16), color: '#fff' },
});
