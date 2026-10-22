/**
 * DebtPlanEslatma.tsx (bildirishnoma, type = 47) — 22.10 "Qarzdan chiqish": TO'LOV KUNI ESLATMASI.
 *
 * Backend `debtPlan.cron` to'lov kuni bugun/ertaga bo'lgan reja qarzlari uchun yuboradi; qatorda faqat
 * `debt_plan_reminder_id` bor — tafsilot GET /finance/debt-plan/reminders/:id dan olinadi.
 * Tugmalar: «To'ladim» (POST .../pay; 409 — allaqachon to'langan), «Reja» — DebtPlan, «Ok» — yopish.
 */
import React from 'react';
import { t } from 'i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { rd, rs } from '../../../../theme/rd';
import { fmtAmountByCurrency } from '../../../../helper/money';
import { CheckCircleIcon, ShieldIcon } from '../../redesign/icons';
import { fDate } from '../../modules/financeMoney';
import { apiErrorText, debtPlanApi } from '../../modules/debtPlan/debtPlanApi';

const GREEN = '#059669';

type Info = { title: string; amount: number; currency: string; dueDate: string; paid: boolean };

const DebtPlanEslatma = ({ item, okay, navigation }: any) => {
  const reminderId = item?.debt_plan_reminder_id ?? item?.debtPlanReminderId;
  const [info, setInfo] = React.useState<Info | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    if (!reminderId) {
      setFailed(true);
      return;
    }
    debtPlanApi
      .reminder(reminderId)
      .then(d => {
        if (!alive || !d) return;
        setInfo({
          title: String(d.title || ''),
          amount: Number(d.amount) || 0,
          currency: String(d.currency || 'UZS'),
          dueDate: String(d.due_date || ''),
          paid: !!d.paid,
        });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [reminderId]);

  const pay = async () => {
    if (busy || !reminderId) return;
    try {
      setBusy(true);
      await debtPlanApi.payReminder(reminderId);
      setInfo(prev => (prev ? { ...prev, paid: true } : prev));
      Toast.show({ type: 'omad', props: { desc: t('To‘lov qayd etildi') } });
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setInfo(prev => (prev ? { ...prev, paid: true } : prev));
      }
      Toast.show({ type: 'error2', props: { desc: apiErrorText(e) || t('Xatolik yuz berdi') } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <ShieldIcon size={rs(18)} color={GREEN} />
        </View>
        <Text allowFontScaling={false} style={styles.title} numberOfLines={2}>
          {t('Qarz to‘lovi eslatmasi')}
        </Text>
      </View>

      {info ? (
        <Text allowFontScaling={false} style={styles.sub}>
          {t('“{{title}}”: {{date}} kuni {{amount}} to‘lash rejada.', {
            title: info.title,
            date: fDate(info.dueDate),
            amount: `${fmtAmountByCurrency(info.amount, info.currency)} ${info.currency}`,
          })}
        </Text>
      ) : failed ? (
        <Text allowFontScaling={false} style={styles.sub}>
          {t('Rejadagi to‘lov kuni yaqinlashdi. Tafsilot “Qarzdan chiqish” bo‘limida.')}
        </Text>
      ) : (
        <ActivityIndicator style={{ marginTop: rs(10) }} color={GREEN} />
      )}

      <View style={styles.footer}>
        <Text allowFontScaling={false} style={styles.time}>
          {item?.created} {item?.time ? String(item.time).slice(0, 5) : ''}
        </Text>
        <View style={styles.actions}>
          {info?.paid ? (
            <View style={styles.paid}>
              <CheckCircleIcon size={rs(15)} color={GREEN} />
              <Text allowFontScaling={false} style={styles.paidText}>{t('To‘langan')}</Text>
            </View>
          ) : info ? (
            <TouchableOpacity activeOpacity={0.85} onPress={pay} disabled={busy} style={styles.payBtn} accessibilityRole="button">
              {busy ? (
                <ActivityIndicator size="small" color={rd.color.onPrimary} />
              ) : (
                <Text allowFontScaling={false} style={styles.payText}>{t('To‘ladim')}</Text>
              )}
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.navigate('DebtPlan')} accessibilityRole="button">
            <Text allowFontScaling={false} style={styles.link}>{t('Reja')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => okay?.(item?.id, item?.type)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text allowFontScaling={false} style={styles.link}>Ok</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default DebtPlanEslatma;

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginTop: rs(12),
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  icon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: '#e8f8f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  sub: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, lineHeight: rs(18), marginTop: rs(10) },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  time: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  payBtn: {
    minWidth: rs(84),
    alignItems: 'center',
    paddingHorizontal: rs(12),
    paddingVertical: rs(7),
    borderRadius: rd.radius.pill,
    backgroundColor: GREEN,
  },
  payText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.onPrimary },
  paid: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  paidText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: GREEN },
  link: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },
});
