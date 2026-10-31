import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fDate, fMoney, num } from '../financeMoney';
import { stripWaiverNote } from '../debtSms';
import { BLUE, GREEN, isDone, isForgiven, isOverdue, RED, ROSE } from './debtGroupLogic';
import { styles } from './debtGroupStyles';

/** Bitta qarz kartasi (yo'nalish, summa, muddat, holat, izoh, to'lov foizi). */
const DebtCard = ({ d, navigation }: { d: any; navigation: any }) => {
  const { t } = useTranslation();
  const borrowed = d.type === 'borrowed';
  const dirColor = borrowed ? RED : GREEN;
  const remaining = num(d.remaining_amount);
  const total = num(d.amount);
  const paidPct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  const done = isDone(d);
  const overdue = isOverdue(d);
  const forgiven = isForgiven(d);
  // SS-DEV (2026-09-24, sayt): tugallangan qarzda qoldiq (0) o'rniga DASTLABKI summa.
  const shownAmt = d.status === 'completed' ? total : remaining;
  const status = done
    ? forgiven
      ? { text: t('Voz kechildi'), color: ROSE }
      : { text: t('Yopilgan'), color: GREEN }
    : overdue
    ? { text: t('Muddati o‘tgan'), color: RED }
    : { text: t('Faol'), color: BLUE };
  const origin = d.is_mirror && !d.is_shop_debt ? (d.can_operate ? t('Bog‘langan') : t('Faqat ko‘rish')) : '';
  return (
    <TouchableOpacity
            style={styles.debtCard}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate(
          'FinanceDebtDetail',
          d.is_mirror ? { mirror: d, hideParty: true } : { id: d.id, hideParty: true },
        )
      }>
      <View style={styles.debtTop}>
        <View style={styles.chipRow}>
          <View style={[styles.dirChip, { backgroundColor: dirColor + '14' }]}>
            <Text allowFontScaling={false} style={[styles.dirChipText, { color: dirColor }]}>
              {borrowed ? t('Olingan') : t('Berilgan')}
            </Text>
          </View>
          {!!origin && (
            <View style={[styles.dirChip, { backgroundColor: '#EEF2FF' }]}>
              <Text allowFontScaling={false} style={[styles.dirChipText, { color: '#3730A3' }]}>{origin}</Text>
            </View>
          )}
        </View>
        <Text allowFontScaling={false} style={[styles.debtAmt, { color: dirColor }]} numberOfLines={1}>
          {borrowed ? '−' : '+'}{fMoney(shownAmt, d.currency)}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text allowFontScaling={false} style={styles.metaText}>
          {d.start_date ? fDate(d.start_date) : '—'}
        </Text>
        <Text allowFontScaling={false} style={styles.metaDot}>·</Text>
        <Text allowFontScaling={false} style={[styles.metaText, overdue && { color: RED }]}>
          {d.due_date ? `${fDate(d.due_date)}${t('gacha')}` : t('Muddatsiz')}
        </Text>
        <View style={[styles.badge, { backgroundColor: status.color + '18' }]}>
          <Text allowFontScaling={false} style={[styles.badgeText, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>

      {/* 03.10 (8-rasm): voz kechish avtomatik izohi ("Kechirilgan (…)") ko'rsatilmaydi */}
      {!!stripWaiverNote(d.notes) && (
        <Text allowFontScaling={false} style={styles.note} numberOfLines={2}>
          {stripWaiverNote(d.notes)}
        </Text>
      )}

      {!done && (
        <>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${paidPct}%`, backgroundColor: dirColor }]} />
          </View>
          <Text allowFontScaling={false} style={styles.paidPct}>
            {t('{{p}}% to‘landi', { p: paidPct })}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default DebtCard;
