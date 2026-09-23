/**
 * FinanceIncomeAdd.tsx — Daromad qo'shish/tahrirlash (web pages/finance/income/add.vue).
 * accent = yashil. POST /finance/incomes ({category_id, amount, currency, income_date,
 * payment_method, description}); edit -> GET /:id + PUT. "Daromad shakli" (Naqd/Karta).
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

const GREEN = '#16a34a';

const PAY = [
  { value: 'cash', icon: '💵', label: 'Naqd' },
  { value: 'card', icon: '💳', label: 'Karta' },
];

const FinanceIncomeAdd = () => {
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

  const today = React.useMemo(() => new Date(), []);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await financeApi.getIncomeCategories();
        setCategories(res.data?.data || []);
      } catch (e) {}
      if (isEdit) {
        try {
          const res = await financeApi.getIncomeById(editId);
          const x = res.data?.data;
          if (x) {
            setCategoryId(x.category_id ?? null);
            setAmount(String(Math.round(num(x.amount))));
            setCurrency(x.currency === 'USD' ? 'USD' : 'UZS');
            // SS10 (2026-09-15): ISO satrini REGEX bilan kesish UTC+5 da
            // BIR KUN OLDINGI sanani berardi. Ro'yxat bilan bir xil yordamchi.
            const dSet = parseLocalDate(x.income_date);
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

  const onAddCategory = async (c: { name: string; icon: string }) => {
    try {
      setCatLoading(true);
      const res = await financeApi.createIncomeCategory(c);
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
      income_date: localDateKey(date),
      payment_method: pay,
      description: description.trim(),
    };
    // So'rov N13: mobil orqali qo'shilgan yozuv manbasi 'mobile' (aks holda backend 'web'=Sayt).
    if (!isEdit) body.source = 'mobile';
    try {
      setSubmitting(true);
      if (isEdit) await financeApi.updateIncome(editId, body);
      else await financeApi.createIncome(body);
      Toast.show({
        type: 'omad',
        props: { desc: isEdit ? t('Daromad yangilandi') : t('Daromad qo‘shildi') },
      });
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // SS2: orqaga tugmasi "Daromad qo'shish" tugmasi bilan bir xil YASHIL rangda.
    <ScreenLayout
      title={isEdit ? t('Daromadni tahrirlash') : t('Daromad qo‘shish')}
      backColor={GREEN}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      <FieldLabel>{t('Kategoriya')}</FieldLabel>
      <FinanceCategorySelect
        value={categoryId}
        categories={categories}
        accent={GREEN}
        onSelect={setCategoryId}
        onAdd={onAddCategory}
        loading={catLoading}
        placeholder={t('Kategoriyani tanlang')}
      />

      <FieldLabel>{t('Valyuta')}</FieldLabel>
      <CurrencyToggle value={currency} onChange={setCurrency} accent={GREEN} />

      <FieldLabel>{t('Daromad summasi')}</FieldLabel>
      <AmountField value={amount} onChange={setAmount} currency={currency} />
      <QuickAmounts currency={currency} onPick={v => setAmount(String(v))} accent={GREEN} />

      <FieldLabel>{t('Sana')}</FieldLabel>
      <DateField
        value={date}
        onChange={setDate}
        label={t('Daromad sanasi')}
        accent={GREEN}
        maximumDate={today}
      />

      <FieldLabel>{t('Daromad shakli')}</FieldLabel>
      <View style={styles.payRow}>
        {PAY.map(p => {
          const active = pay === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              activeOpacity={0.85}
              onPress={() => setPay(p.value)}
              style={[styles.payBtn, active && { borderColor: GREEN, backgroundColor: GREEN + '12' }]}>
              <Text allowFontScaling={false} style={styles.payIcon}>
                {p.icon}
              </Text>
              <Text allowFontScaling={false} style={[styles.payLabel, active && { color: GREEN }]}>
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
        placeholder={t('Masalan: Oylik ish haqi')}
        placeholderTextColor={rd.color.textTertiary}
        style={styles.desc}
        allowFontScaling={false}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        disabled={submitting}
        onPress={submit}
        style={[styles.submit, { backgroundColor: GREEN }, submitting && { opacity: 0.7 }]}>
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text allowFontScaling={false} style={styles.submitText}>
            {isEdit ? t('Saqlash') : t('Daromad qo‘shish')}
          </Text>
        )}
      </TouchableOpacity>
      <View style={{ height: rs(20) }} />
    </ScreenLayout>
  );
};

export default FinanceIncomeAdd;

const styles = StyleSheet.create({
  // Daromad shakli — IXCHAM (Xarajat bilan bir xil; so'rov).
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
    // So'rov N3: Daromad shakli IXCHAMROQ (9→7).
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
    marginTop: rs(22),
  },
  submitText: { fontFamily: rd.font.bold, fontSize: rs(16), color: '#fff' },
});
