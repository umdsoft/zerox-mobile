/**
 * FinanceGoalAdd.tsx — Maqsad qo'shish (web pages/finance/goals/add.vue). accent binafsha.
 * Kategoriya = EMOJI picker (API'siz; local + MMKV `zx_goal_categories`).
 * POST /finance/goals {icon,title,description,target_amount,current_amount,currency,deadline,priority,color}
 */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { t } from 'i18next';
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
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { financeApi } from './financeApi';
import { localDateKey, num } from './financeMoney';
import { AmountField, DateField, FieldLabel } from './financeForm';
import FinanceCategorySelect from './FinanceCategorySelect';

const PURPLE = '#7c3aed';
const COLORS = ['#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6'];
const PRIORITIES = [
  { value: 'low', label: 'Past', color: '#6b7280' },
  { value: 'medium', label: 'O‘rta', color: '#f59e0b' },
  { value: 'high', label: 'Yuqori', color: '#ef4444' },
];
// Standart maqsad emojilari (web icon_* -> uz nom). id === icon (emoji).
const DEFAULT_GOAL_CATS = [
  { id: '🏠', icon: '🏠', name: 'Uy' },
  { id: '🚗', icon: '🚗', name: 'Avtomobil' },
  { id: '✈️', icon: '✈️', name: 'Sayohat' },
  { id: '💻', icon: '💻', name: 'Texnika' },
  { id: '📱', icon: '📱', name: 'Telefon' },
  { id: '💍', icon: '💍', name: 'To‘y' },
  { id: '🎓', icon: '🎓', name: 'Ta’lim' },
  { id: '💰', icon: '💰', name: 'Jamg‘arma' },
  { id: '🎁', icon: '🎁', name: 'Sovg‘a' },
];

const FinanceGoalAdd = () => {
  const navigation = useNavigation<any>();

  const [cats, setCats] = React.useState<any[]>(DEFAULT_GOAL_CATS);
  const [icon, setIcon] = React.useState('');
  // So'rov SS6: kategoriya `id` UNIKAL (icon+name) — ilgari id=emoji edi, shu bois
  // mavjud ikonка (masalan 🚗 Avtomobil) bilan yangi nom (Nexia) qo'shilmasdi (to'qnash).
  // `catId` selektsiya uchun, `icon` esa maqsad-emojisi (POST'да yuboriladi) — ajratildi.
  const [catId, setCatId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [target, setTarget] = React.useState('');
  const [currency, setCurrency] = React.useState<'UZS' | 'USD'>('UZS');
  const [current, setCurrent] = React.useState('');
  const [deadline, setDeadline] = React.useState<Date | null>(null);
  const [priority, setPriority] = React.useState('medium');
  const [color, setColor] = React.useState('#8B5CF6');
  const [submitting, setSubmitting] = React.useState(false);

  const tomorrow = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  // Qo'shilgan emojilar MMKV'da doimiy (backend goal_categories jadvali yo'q — MVP).
  React.useEffect(() => {
    try {
      const raw = storage.getString('zx_goal_categories');
      if (raw) {
        const extra = JSON.parse(raw);
        if (Array.isArray(extra) && extra.length) {
          setCats(prev => {
            const ids = new Set(prev.map((c: any) => c.id));
            return [...prev, ...extra.filter((c: any) => !ids.has(c.id))];
          });
        }
      }
    } catch (e) {}
  }, []);

  const onAddCategory = (c: { name: string; icon: string }) => {
    // UNIKAL id (icon+name) — bir xil ikonка, boshqa nom endi qo'shiladi.
    const id = `c_${c.icon}_${c.name.trim().toLowerCase()}`;
    const next = { id, icon: c.icon, name: c.name.trim() };
    setCats(prev => (prev.some((x: any) => x.id === id) ? prev : [...prev, next]));
    setCatId(id);
    setIcon(c.icon);
    try {
      const raw = storage.getString('zx_goal_categories');
      const extra = raw ? JSON.parse(raw) : [];
      if (!extra.some((x: any) => x.id === id)) {
        storage.set('zx_goal_categories', JSON.stringify([...extra, next]));
      }
    } catch (e) {}
  };

  // Kategoriya tanlanganда: catId + maqsad-emojisi (icon) o'rnatiladi.
  const onSelectCat = (id: any) => {
    setCatId(String(id));
    const cat = cats.find((x: any) => String(x.id) === String(id));
    setIcon(cat?.icon || String(id));
  };

  const submit = async () => {
    if (submitting) return;
    if (!title.trim()) {
      Toast.show({ type: 'error2', props: { desc: 'Maqsad nomini kiriting' } });
      return;
    }
    if (num(target) <= 0) {
      Toast.show({ type: 'error2', props: { desc: 'Maqsad summasini kiriting' } });
      return;
    }
    if (!deadline) {
      Toast.show({ type: 'error2', props: { desc: 'Muddatni tanlang' } });
      return;
    }
    if (num(current) > num(target)) {
      Toast.show({ type: 'error2', props: { desc: 'Boshlang‘ich summa maqsaddan oshmasin' } });
      return;
    }
    const body = {
      icon: icon || '🎯',
      title: title.trim(),
      description: description.trim(),
      target_amount: num(target),
      current_amount: num(current),
      currency,
      deadline: localDateKey(deadline),
      priority,
      color,
    };
    try {
      setSubmitting(true);
      await financeApi.createGoal(body);
      Toast.show({ type: 'omad', props: { desc: 'Maqsad yaratildi' } });
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setSubmitting(false);
    }
  };

  // SS3: orqaga tugmasi "Maqsad yaratish" tugmasi rangida (binafsha).
  return (
    <ScreenLayout title={t('Maqsad qo‘shish')} backColor={PURPLE}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      <FieldLabel>{t('Kategoriya')}</FieldLabel>
      <FinanceCategorySelect
        value={catId}
        categories={cats}
        accent={PURPLE}
        onSelect={onSelectCat}
        onAdd={onAddCategory}
        placeholder={t('Maqsadni tanlang')}
        labelFn={n => n || 'Maqsadni tanlang'}
      />

      <FieldLabel>{t('Maqsad nomi')}</FieldLabel>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('Masalan: Yangi telefon')}
        placeholderTextColor={rd.color.textTertiary}
        style={styles.input}
        allowFontScaling={false}
      />

      {/* Tavsif — BIR QATOR (ilgari multiline -> 2 qator ko'rinardi; so'rov). */}
      <FieldLabel>{t('Tavsif (ixtiyoriy)')}</FieldLabel>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('Qisqacha tavsif')}
        placeholderTextColor={rd.color.textTertiary}
        style={styles.input}
        allowFontScaling={false}
      />

      {/* img2: Summalar 2 USTUN — "Maqsad" va "Boshlang'ich" yonma-yon (bir maydon
          balandligini tejaydi → forma 1 oynaga sig'adi). Valyuta toggle umumiy. */}
      <View style={styles.labelRow}>
        <FieldLabel>{t('Summa')}</FieldLabel>
        <View style={styles.curMini}>
          {(['UZS', 'USD'] as const).map(c => {
            const on = currency === c;
            return (
              <TouchableOpacity
                key={c}
                activeOpacity={0.85}
                onPress={() => setCurrency(c)}
                style={[styles.curMiniBtn, on && { backgroundColor: PURPLE }]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.curMiniText, on && { color: '#fff' }]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.sumRow}>
        <View style={styles.sumCol}>
          <Text allowFontScaling={false} style={styles.sumMini}>{t('Maqsad')}</Text>
          <AmountField value={target} onChange={setTarget} currency={currency} />
        </View>
        <View style={styles.sumCol}>
          <Text allowFontScaling={false} style={styles.sumMini}>{t('Boshlang‘ich (ixtiyoriy)')}</Text>
          <AmountField value={current} onChange={setCurrent} currency={currency} />
        </View>
      </View>

      <FieldLabel>{t('Muddat')}</FieldLabel>
      <DateField
        value={deadline}
        onChange={setDeadline}
        label={t('Maqsad muddati')}
        accent={PURPLE}
        minimumDate={tomorrow}
        placeholder={t('Sanani tanlang')}
      />

      <FieldLabel>{t('Muhimlik')}</FieldLabel>
      <View style={styles.row3}>
        {PRIORITIES.map(p => {
          const active = priority === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              activeOpacity={0.85}
              onPress={() => setPriority(p.value)}
              style={[styles.prioBtn, active && { borderColor: p.color, backgroundColor: p.color + '14' }]}>
              <Text allowFontScaling={false} style={[styles.prioText, active && { color: p.color }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FieldLabel>{t('Rang')}</FieldLabel>
      <View style={styles.colorRow}>
        {COLORS.map(c => (
          <TouchableOpacity
            key={c}
            activeOpacity={0.85}
            onPress={() => setColor(c)}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              color === c && styles.colorActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        disabled={submitting}
        onPress={submit}
        style={[styles.submit, { backgroundColor: PURPLE }, submitting && { opacity: 0.7 }]}>
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text allowFontScaling={false} style={styles.submitText}>
            {t('Maqsad yaratish')}
          </Text>
        )}
      </TouchableOpacity>
      <View style={{ height: rs(6) }} />
    </ScreenLayout>
  );
};

export default FinanceGoalAdd;

const styles = StyleSheet.create({
  inputWrap: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  input: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    paddingVertical: rs(9),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  textarea: { minHeight: rs(70), textAlignVertical: 'top' },
  row3: { flexDirection: 'row', gap: rs(10) },
  prioBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingVertical: rs(9),
  },
  prioText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  // So'rov SS23: 8 rang BIR QATORGA sig'adi (wrap yo'q, teng taqsimlanadi).
  colorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  colorSwatch: { width: rs(26), height: rs(26), borderRadius: rs(13) },
  colorActive: { borderWidth: 3, borderColor: rd.color.text },
  // img2: summalar 2 ustun
  sumRow: { flexDirection: 'row', gap: rs(10) },
  sumCol: { flex: 1 },
  sumMini: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary, marginBottom: rs(4) },
  // SS5: Valyuta inline-toggle (yorliq yonida) + ixcham
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  curMini: {
    flexDirection: 'row',
    gap: rs(4),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rs(9),
    padding: rs(2),
    marginTop: rs(8),
    marginBottom: rs(6),
  },
  curMiniBtn: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(4),
    borderRadius: rs(7),
  },
  curMiniText: { fontFamily: rd.font.bold, fontSize: rs(12), color: rd.color.textSecondary },
  submit: {
    height: rs(50),
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    // SS3: ranglardan ajratish (juda yaqin edi) — pastда bo'sh joy bor edi.
    marginTop: rs(20),
  },
  submitText: { fontFamily: rd.font.bold, fontSize: rs(16), color: '#fff' },
});
