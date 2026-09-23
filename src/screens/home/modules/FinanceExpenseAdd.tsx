/**
 * FinanceExpenseAdd.tsx — Xarajat qo'shish/tahrirlash (web pages/finance/expenses/add.vue).
 * accent = QIZIL. POST /finance/expenses ({category_id, amount, currency, expense_date,
 * payment_method, description}); edit -> GET /:id prefill + PUT.
 * (debt_id bog'lash mobil v1'da yo'q.)
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import ScreenLayout from '../../components/ScreenLayout';
import { rd, rs } from '../../../theme/rd';
import { financeApi } from './financeApi';
import { localDateKey, num, parseLocalDate } from './financeMoney';
import { AmountField, CurrencyToggle, DateField, FieldLabel, QuickAmounts } from './financeForm';
import FinanceCategorySelect from './FinanceCategorySelect';
import { QrIcon } from '../redesign/icons';

const RED = '#e5484d'; // xarajat = QIZIL (sayt bilan bir xil; ilgari ko'k edi)

const PAY = [
  { value: 'cash', icon: '💵', label: 'Naqd' },
  { value: 'card', icon: '💳', label: 'Karta' },
];

const FinanceExpenseAdd = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editId = route.params?.edit;
  const isEdit = !!editId;

  const [categories, setCategories] = React.useState<any[]>([]);
  const [catLoading, setCatLoading] = React.useState(false);

  const [categoryId, setCategoryId] = React.useState<any>(null);
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState<'UZS' | 'USD'>('UZS');
  const [date, setDate] = React.useState<Date>(new Date());
  const [pay, setPay] = React.useState('cash');
  const [description, setDescription] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  // SS6: chek-skanerdan kelgan receipt_key — create'да yuboriladi (dublikat qaydi).
  const [receiptKey, setReceiptKey] = React.useState<string | null>(null);

  const today = React.useMemo(() => new Date(), []);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await financeApi.getExpenseCategories();
        setCategories(res.data?.data || []);
      } catch (e) {}
      if (isEdit) {
        try {
          const res = await financeApi.getExpenseById(editId);
          const x = res.data?.data;
          if (x) {
            setCategoryId(x.category_id ?? null);
            setAmount(String(Math.round(num(x.amount))));
            setCurrency(x.currency === 'USD' ? 'USD' : 'UZS');
            // SS10 (2026-09-15): ISO satrini REGEX bilan kesish UTC+5 da
            // BIR KUN OLDINGI sanani berardi (backend DATE ni +05:00 bilan
            // qaytaradi). Endi ro'yxat bilan BIR XIL yordamchi ishlatiladi.
            const dSet = parseLocalDate(x.expense_date);
            if (dSet) setDate(dSet);
            setPay(x.payment_method || 'cash');
            setDescription(x.description || '');
          }
        } catch (e) {
          navigation.goBack();
        }
      }
    })();
  }, [editId, isEdit, navigation]);

  // N2: Chek-skanerdan kelgan prefill (route.params.prefill) — summa/sana/izoh.
  React.useEffect(() => {
    const p = route.params?.prefill;
    if (!p) return;
    if (p.amount != null && num(p.amount) > 0) setAmount(String(Math.round(num(p.amount))));
    if (p.date) {
      const dPre = parseLocalDate(p.date);
      if (dPre) setDate(dPre);
    }
    if (p.description) setDescription(String(p.description));
    if (p.receiptKey) setReceiptKey(String(p.receiptKey));
  }, [route.params?.prefill]);

  // Chek-skaner taklif qilgan kategoriya-slug'ini yuklangan kategoriyalarga moslash.
  React.useEffect(() => {
    const slug = route.params?.prefill?.categorySlug;
    if (!slug || !categories.length) return;
    const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = norm(slug);
    const found = categories.find(
      c => norm(c.slug) === target || norm(c.key) === target || norm(c.name) === target,
    );
    if (found) setCategoryId(found.id);
  }, [route.params?.prefill, categories]);

  const onAddCategory = async (c: { name: string; icon: string }) => {
    try {
      setCatLoading(true);
      const res = await financeApi.createExpenseCategory(c);
      const cat = res.data?.data;
      if (cat) {
        setCategories(prev => [...prev, cat]);
        setCategoryId(cat.id);
        Toast.show({ type: 'omad', props: { desc: 'Kategoriya qo‘shildi' } });
      }
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setCatLoading(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    if (!categoryId) {
      Toast.show({ type: 'error2', props: { desc: 'Kategoriyani tanlang' } });
      return;
    }
    if (num(amount) <= 0) {
      Toast.show({ type: 'error2', props: { desc: 'Summani kiriting' } });
      return;
    }
    const body: any = {
      category_id: categoryId,
      amount: num(amount),
      currency,
      expense_date: localDateKey(date),
      payment_method: pay,
      description: description.trim(),
    };
    // So'rov N13: mobil orqali qo'shilgan yozuv manbasi 'mobile' (aks holda backend 'web'=Sayt).
    if (!isEdit) body.source = 'mobile';
    // SS6: chek-skanerdan kelgan bo'lsa receipt_key — backend dublikat-qaydi uchun.
    if (!isEdit && receiptKey) body.receipt_key = receiptKey;
    try {
      setSubmitting(true);
      if (isEdit) await financeApi.updateExpense(editId, body);
      else await financeApi.createExpense(body);
      Toast.show({
        type: 'omad',
        props: { desc: isEdit ? t('Xarajat yangilandi') : t('Xarajat qo‘shildi') },
      });
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // SS1: orqaga tugmasi "Xarajat qo'shish" tugmasi bilan bir xil QIZIL rangda.
    <ScreenLayout
      title={isEdit ? t('Xarajatni tahrirlash') : t('Xarajat qo‘shish')}
      backColor={RED}
      // SS1-2: "Xarajat qo'shish" tugmasi pastda KESILIB qolardi — ScreenLayout'ning
      // standart pastki bo'shlig'i (24) global pastki menyu balandligiga yetmasdi.
      // SS9: pastda yetarli bo‘shliq (global menyu ustiga kelmasin).
      contentStyle={{ paddingBottom: rs(28) }}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      {/* N2: OFD chek QR'ini skanerlab formani avtomatik to'ldirish. */}
      {!isEdit && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('FinanceReceiptScan')}
          style={styles.scanBtn}>
          <QrIcon size={rs(20)} color={RED} />
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.scanTitle}>{t('Chekni skanerlash')}</Text>
            <Text allowFontScaling={false} style={styles.scanSub}>{t('QR kod orqali xarajatni avtomatik qo‘shish')}</Text>
          </View>
        </TouchableOpacity>
      )}

      <FieldLabel>{t('Kategoriya')}</FieldLabel>
      <FinanceCategorySelect
        value={categoryId}
        categories={categories}
        accent={RED}
        onSelect={setCategoryId}
        onAdd={onAddCategory}
        loading={catLoading}
        placeholder={t('Kategoriyani tanlang')}
      />

      <FieldLabel>{t('Valyuta')}</FieldLabel>
      <CurrencyToggle value={currency} onChange={setCurrency} accent={RED} />

      <FieldLabel>{t('Xarajat summasi')}</FieldLabel>
      <AmountField value={amount} onChange={setAmount} currency={currency} />
      <QuickAmounts currency={currency} onPick={v => setAmount(String(v))} accent={RED} />

      <FieldLabel>{t('Sana')}</FieldLabel>
      <DateField
        value={date}
        onChange={setDate}
        label={t('Xarajat sanasi')}
        accent={RED}
        maximumDate={today}
      />

      <FieldLabel>{t('To‘lov usuli')}</FieldLabel>
      <View style={styles.payRow}>
        {PAY.map(p => {
          const active = pay === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              activeOpacity={0.85}
              onPress={() => setPay(p.value)}
              style={[styles.payBtn, active && { borderColor: RED, backgroundColor: RED + '12' }]}>
              <Text allowFontScaling={false} style={styles.payIcon}>
                {p.icon}
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.payLabel, active && { color: RED }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FieldLabel>{t('Izoh (ixtiyoriy)')}</FieldLabel>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('Masalan: Oziq-ovqat xaridi')}
        placeholderTextColor={rd.color.textTertiary}
        style={styles.desc}
        allowFontScaling={false}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        disabled={submitting}
        onPress={submit}
        style={[styles.submit, { backgroundColor: RED }, submitting && { opacity: 0.7 }]}>
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text allowFontScaling={false} style={styles.submitText}>
            {isEdit ? t('Saqlash') : t('Xarajat qo‘shish')}
          </Text>
        )}
      </TouchableOpacity>
    </ScreenLayout>
  );
};

export default FinanceExpenseAdd;

const styles = StyleSheet.create({
  // N2: Chek-skaner CTA
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: RED + '10',
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: RED + '33',
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
    marginBottom: rs(6),
  },
  scanTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: RED },
  scanSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    marginTop: rs(2),
  },
  // To'lov usuli — IXCHAM (so'rov).
  payRow: { flexDirection: 'row', gap: rs(10) },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    backgroundColor: rd.color.surface,
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    // So'rov N2: To'lov usuli IXCHAMROQ (9→7).
    paddingVertical: rs(7),
  },
  payIcon: { fontSize: rs(15) },
  payLabel: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  desc: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(13),
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  submit: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    // SS9: tugma aylantirishsiz sig‘sin — tepadagi bo‘shliq kamaydi.
    marginTop: rs(14),
  },
  submitText: { fontFamily: rd.font.bold, fontSize: rs(16), color: '#fff' },
});
