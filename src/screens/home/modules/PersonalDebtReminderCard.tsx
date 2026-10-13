/**
 * PersonalDebtReminderCard.tsx — 11.10 ("Yangi mobil xatolar 11.10", 6-rasm): Shaxsiy qarz bo'limidagi
 * "Eslatma" kartasi (Qarz daftari → Do'konni tahrirlash → Eslatma kartasi bilan bir xil ko'rinish).
 * Bosilganda — FinanceDebtEslatma (QarzDaftariEslatma ekrani, shaxsiy qarz rejimi).
 * Holat GET /finance/debt-reminder dan; sahifaga qaytilganda yangilanadi.
 */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { URL } from '../../constants';
import { BellIcon, ChevronRight } from '../redesign/icons';
import { repeatLabel } from './reminderDays';

type Reminder = { enabled: boolean; time: string; days: number[] };

const AMBER = '#b45309';

type Props = {
  /** 13.10: Shaxsiy moliya sahifasida ham — o'z endpoint'i, sozlama ekrani va izohi bilan */
  endpoint?: string;
  route?: string;
  subtitle?: string;
};

const PersonalDebtReminderCard = ({
  endpoint = '/finance/debt-reminder',
  route = 'FinanceDebtEslatma',
  subtitle,
}: Props) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [reminder, setReminder] = React.useState<Reminder | null>(null);
  const [failed, setFailed] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      axios
        .get(`${URL}${endpoint}`, { headers: { Authorization: `Bearer ${storage.getString('token')}` } })
        .then(res => {
          const d = res.data?.data;
          if (!alive || !d) return;
          setReminder({ enabled: !!d.enabled, time: String(d.time || '21:00'), days: Array.isArray(d.days) ? d.days : [] });
          setFailed(false);
        })
        .catch(() => { if (alive) setFailed(true); });
      return () => { alive = false; };
    }, [endpoint]),
  );

  const status = reminder?.enabled
    ? `${t('Yoqilgan')} · ${reminder.time} · ${repeatLabel(reminder.days || [], t)}`
    : reminder ? t('O‘chirilgan') : failed ? '—' : '…';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => navigation.navigate(route)}
      accessibilityRole="button"
    >
      <View style={styles.icon}>
        <BellIcon size={rs(20)} color={AMBER} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{t('Eslatma')}</Text>
        <Text style={styles.sub} numberOfLines={2}>{subtitle || t('Belgilangan vaqtda shaxsiy qarz kiritishni eslatish')}</Text>
        <View style={styles.status}>
          <View style={[styles.dot, { backgroundColor: reminder?.enabled ? '#d97706' : rd.color.border }]} />
          <Text style={[styles.statusText, { color: reminder?.enabled ? AMBER : rd.color.textTertiary }]} numberOfLines={2}>
            {status}
          </Text>
        </View>
      </View>
      <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
    </TouchableOpacity>
  );
};

export default PersonalDebtReminderCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  icon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(12),
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },
  sub: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  status: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(6), marginTop: rs(12) },
  dot: { width: rs(6), height: rs(6), borderRadius: rs(3), marginTop: rs(5) },
  statusText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(11) },
});
