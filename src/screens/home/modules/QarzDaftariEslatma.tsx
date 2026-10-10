/**
 * QarzDaftariEslatma.tsx — do'kon egasiga QARZ KIRITISH ESLATMASI sozlamasi
 * (10.10, "Yangi mobil xatolar 10.10", 2-rasm — Money Manager "Alarm Setting" kabi).
 *
 * Egasi eslatmani yoqadi, vaqt va hafta kunlarini belgilaydi. Belgilangan kun va vaqtda, AGAR o'sha kuni
 * shu do'konga bitta ham qarz kiritilmagan bo'lsa — "Bildirishnomalar"ga eslatma (Ok + Qarz daftari) va push.
 *
 * GET/PUT /qarz-daftari/savdo-faoliyat/:id/eslatma  { enabled, time:'HH:MM', days:[0..6] } (0 = Yakshanba).
 * O'zgarishlar AVTOMATIK saqlanadi (do'konni tahrirlash ekrani bilan bir xil); chiqishda kutib turgan
 * saqlash yakunlanadi.
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import { BellIcon, CheckIcon, ClockIcon, WarningIcon } from '../redesign/icons';
import { repeatLabel as daysLabel, WEEK } from './reminderDays';

const SAVE_DELAY_MS = 600;

type Settings = { enabled: boolean; time: string; days: number[] };
type Status = 'idle' | 'saving' | 'saved' | 'error';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${storage.getString('token')}` } });
const sameSettings = (a: Settings, b: Settings) =>
  a.enabled === b.enabled && a.time === b.time && [...a.days].sort().join() === [...b.days].sort().join();
const timeToDate = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};
const dateToTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const QarzDaftariEslatma = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const faoliyatId = route.params?.faoliyat_id;
  const shopName = route.params?.faoliyat_nomi || '';

  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<Settings>({ enabled: false, time: '21:00', days: [0, 1, 2, 3, 4, 5, 6] });
  const [saved, setSaved] = React.useState<Settings>(form);
  const [status, setStatus] = React.useState<Status>('idle');

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = React.useRef<Promise<boolean> | null>(null);
  const stateRef = React.useRef({ form, saved });
  stateRef.current = { form, saved };

  const invalid = form.enabled && form.days.length === 0;
  const dirty = !sameSettings(form, saved);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat/${faoliyatId}/eslatma`, authHeaders());
        const d = res.data?.data;
        if (d) {
          const s = { enabled: !!d.enabled, time: String(d.time || '21:00'), days: Array.isArray(d.days) ? d.days : [] };
          setForm(s);
          setSaved(s);
        }
      } catch (e: any) {
        Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || t('Xatolik') } });
      } finally {
        setLoading(false);
      }
    })();
  }, [faoliyatId, t]);

  const save = React.useCallback(async (s: Settings): Promise<boolean> => {
    setStatus('saving');
    try {
      const res = await axios.put(`${URL}/qarz-daftari/savdo-faoliyat/${faoliyatId}/eslatma`, s, authHeaders());
      if (!res.data?.success) throw { response: res };
      setSaved(s);
      setStatus('saved');
      return true;
    } catch (e: any) {
      setStatus('error');
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || t('Xatolik') } });
      return false;
    }
  }, [faoliyatId, t]);

  const flush = React.useCallback(async (): Promise<boolean> => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (inflightRef.current) await inflightRef.current;
    const { form: f, saved: s } = stateRef.current;
    if (sameSettings(f, s)) return true;
    if (f.enabled && f.days.length === 0) return false;
    inflightRef.current = save(f);
    try { return await inflightRef.current; } finally { inflightRef.current = null; }
  }, [save]);

  // Har o'zgarishda — kechiktirib saqlash (vaqt g'ildiragi aylanayotganda har qadamda so'rov ketmasin).
  React.useEffect(() => {
    if (loading || !dirty || invalid) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { flush(); }, SAVE_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loading]);

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Orqaga — kutib turgan saqlash avval yakunlansin.
  const leavingRef = React.useRef(false);
  React.useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (leavingRef.current) return;
      const { form: f, saved: s } = stateRef.current;
      if (sameSettings(f, s) && !inflightRef.current) return;
      e.preventDefault();
      flush().then(() => {
        leavingRef.current = true;
        navigation.dispatch(e.data.action);
      });
    });
    return unsub;
  }, [navigation, flush]);

  const toggleDay = (day: number) =>
    setForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }));

  const repeatLabel = daysLabel(form.days, t);

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Eslatma')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tushuntirish */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <BellIcon size={rs(26)} color={BLUE} />
          </View>
          <Text style={styles.heroText}>
            {t('Belgilangan kunlarda va vaqtda «{{shop}}» do‘koniga qarzlarni kiritishni eslatamiz. Eslatma faqat o‘sha kuni bitta ham qarz kiritilmagan bo‘lsa yuboriladi.', { shop: shopName })}
          </Text>
        </View>

        {/* Yoqish */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('Eslatma')}</Text>
            <View style={styles.switchRight}>
              {status === 'saving' && <ActivityIndicator size="small" color={BLUE} />}
              {status === 'saved' && !dirty && <CheckIcon size={rs(14)} color={rd.color.success} />}
              <Switch
                value={form.enabled}
                onValueChange={v => setForm(f => ({ ...f, enabled: v, days: v && !f.days.length ? [0, 1, 2, 3, 4, 5, 6] : f.days }))}
                trackColor={{ false: rd.color.border, true: '#9db8f8' }}
                thumbColor={form.enabled ? BLUE : '#f4f4f5'}
              />
            </View>
          </View>
        </View>

        {/* Vaqt va kunlar */}
        <View style={[styles.card, !form.enabled && styles.cardOff]} pointerEvents={form.enabled ? 'auto' : 'none'}>
          <View style={styles.rowHead}>
            <ClockIcon size={rs(16)} color={rd.color.textTertiary} />
            <Text style={styles.rowTitle}>{t('Vaqt')}</Text>
            <Text style={styles.timeBig}>{form.time}</Text>
          </View>
          <View style={styles.pickerWrap}>
            <DatePicker
              date={timeToDate(form.time)}
              mode="time"
              locale="ru"
              is24hourSource="locale"
              theme="light"
              minuteInterval={5}
              onDateChange={d => setForm(f => ({ ...f, time: dateToTime(d) }))}
            />
          </View>

          <View style={styles.divider} />
          <View style={styles.rowHead}>
            <Text style={styles.rowTitle}>{t('Takrorlash')}</Text>
            <Text style={styles.repeat} numberOfLines={1}>{repeatLabel}</Text>
          </View>
          <View style={styles.days}>
            {WEEK.map(w => {
              const on = form.days.includes(w.day);
              return (
                <TouchableOpacity
                  key={w.day}
                  activeOpacity={0.8}
                  onPress={() => toggleDay(w.day)}
                  style={[styles.day, on && styles.dayOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[styles.dayText, on && styles.dayTextOn]}>{t(w.key)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {invalid && (
            <View style={styles.warn}>
              <WarningIcon size={rs(14)} color={rd.color.warning} />
              <Text style={styles.warnText}>{t('Kamida bitta kunni tanlang')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const BLUE = '#2f6fed';

export default QarzDaftariEslatma;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(110), gap: rs(12) },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  heroIcon: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    borderWidth: 1.5,
    borderColor: '#b9d1fb',
    backgroundColor: '#eaf1fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(12.5), lineHeight: rs(18), color: rd.color.textSecondary },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  cardOff: { opacity: 0.45 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  switchRight: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  rowTitle: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  timeBig: { fontFamily: rd.font.bold, fontSize: rs(18), color: BLUE },
  pickerWrap: { alignItems: 'center', marginTop: rs(6) },
  divider: { height: 1, backgroundColor: rd.color.border, marginVertical: rs(14) },
  repeat: { maxWidth: '60%', fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: rs(6), marginTop: rs(12) },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: rs(10),
    borderRadius: rs(10),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
  },
  dayOn: { borderColor: '#b9d1fb', backgroundColor: '#eaf1fe' },
  dayText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textTertiary },
  dayTextOn: { color: BLUE },
  warn: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(12) },
  warnText: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.warning },
});
