/**
 * Shikoyat.tsx — SS-DEV (2026-09-26): qarz bo'yicha SHIKOYAT bildirishnomasi.
 *
 *   type = 42 — Qarz daftari (do'kon) qarzi bo'yicha qarzdorning shikoyati
 *               (backend `qd_shikoyatlar`, maydonlar `sh_*`). Do'kon egasiga keladi.
 *   type = 43 — Shaxsiy (odam-odam) qarz bo'yicha shikoyat
 *               (backend `personal_debt_complaints`, maydonlar `pc_*`). Qarz berganga keladi.
 *
 * Sayt (`components/notification_types/qd-shikoyat.vue` / `pd-shikoyat.vue`) bilan bir
 * xil mazmun: kim (FISH · telefon) — nima bo'yicha (qoldiq) — «sabab» — izoh, tugmalar
 * "Qarzga o'tish" (mavjud bo'lsa) va "Ok". Ilgari mobil bu turlarni bilmas edi va
 * ro'yxatda "Xatolik sodir bo'ldi" matni chiqardi.
 *
 * Har bir maydon null-safe: backend LEFT JOIN — shikoyat/qarz o'chirilgan bo'lsa
 * `sh_*`/`pc_*` maydonlar NULL keladi.
 */
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from 'i18next';
import NotificationShell, { NotifButton } from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';
import { style } from '../../../../theme/style';
import { titleCase } from '../../../../helper/returnName';
import { fmtPhoneUz } from '../../../../helper/phone';
import { sortText } from '../../../components/StatisticCard';

// Backend `SHOP_COMPLAINT_REASONS` kalitlari -> i18n kalitlari (FinanceDebtDetail bilan bir xil matn).
const REASON_KEYS: Record<string, string> = {
  not_taken: 'Men qarz olmaganman-ku?',
  fully_paid: 'Qarzimni to‘liq qaytargan edim-ku?',
  partly_paid: 'Qarzimni bir qismini qaytarganman-ku?',
  other: 'Boshqa sabab (izohga qarang)',
};

const money = (v: unknown, cur: unknown): string => {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return `${sortText(Math.round(n))} ${String(cur || 'UZS')}`;
};

const Shikoyat = ({ item, okay, navigation }: any) => {
  const it = item || {};
  const isShop = Number(it.type) === 42;

  // Shikoyatchi (n.debitor = shikoyat yuborgan foydalanuvchi) — FISH, bo'lmasa mijoz/manba nomi.
  const who =
    titleCase([it.d_last_name, it.d_first_name].filter(Boolean).join(' ')) ||
    String((isShop ? it.sh_mijoz : it.pc_source_name) || '—');
  const phone = fmtPhoneUz(isShop ? it.sh_phone : it.pc_phone);
  const amount = isShop
    ? money(it.sh_qoldiq ?? it.sh_miqdor, it.sh_valyuta)
    : money(it.pc_remaining ?? it.pc_amount, it.pc_currency);
  const reasonKey = String((isShop ? it.sh_reason : it.pc_reason) || '');
  const reason = t(REASON_KEYS[reasonKey] || REASON_KEYS.not_taken) as string;
  const izoh = String((isShop ? it.sh_izoh : it.pc_izoh) || '').trim();
  const debtId = isShop ? it.sh_qarz_id : it.pc_debt_id;

  const goToDebt = () => {
    if (!debtId || !navigation?.navigate) return;
    if (isShop) {
      navigation.navigate('QarzDaftariQarz', { id: debtId });
    } else {
      navigation.navigate('FinanceDebtDetail', { id: debtId });
    }
  };

  return (
    <NotificationShell
      title={t(isShop ? 'Qarz bo‘yicha shikoyat' : 'Shaxsiy qarz bo‘yicha shikoyat') as string}
      date={it.created}
      time={it.time}
      actions={
        <>
          {debtId ? (
            <NotifButton label={t('Qarzga o‘tish') as string} onPress={goToDebt} />
          ) : null}
          <NotifButton label="Ok" variant="ghost" onPress={() => okay?.(it.id, it.type)} />
        </>
      }
    >
      <Text allowFontScaling={false} style={styles.body}>
        <Text style={styles.bold}>{who}</Text>
        {phone ? <Text style={styles.muted}> · {phone}</Text> : null}
        {' — '}
        {t(isShop ? 'do‘kondagi qarzi bo‘yicha' : 'siz yozgan qarz bo‘yicha')}
        {isShop ? (
          <>
            {' '}
            <Text style={styles.bold}>{String(it.sh_store || t('Do‘kon'))}</Text>
          </>
        ) : null}
        {amount ? (
          <>
            {' ('}
            {String(t('Qoldiq')).toLowerCase()}: <Text style={styles.bold}>{amount}</Text>
            {')'}
          </>
        ) : null}
        :
      </Text>
      <View style={styles.reasonBox}>
        <Text allowFontScaling={false} style={styles.reason}>
          «{reason}»
        </Text>
      </View>
      {izoh ? (
        <Text allowFontScaling={false} style={styles.izoh}>
          {izoh}
        </Text>
      ) : null}
    </NotificationShell>
  );
};

export default memo(Shikoyat);

const styles = StyleSheet.create({
  body: {
    fontFamily: rd.font.medium,
    fontSize: style.fontSize.xx + 1,
    color: rd.color.text,
    lineHeight: rs(20),
  },
  bold: { fontFamily: rd.font.bold, color: rd.color.text },
  muted: { color: rd.color.textSecondary },
  reasonBox: {
    marginTop: rs(8),
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    borderRadius: rs(10),
    backgroundColor: '#fff1f2', // rose-50 (sayt bilan bir xil)
  },
  reason: {
    fontFamily: rd.font.semibold,
    fontSize: style.fontSize.xx + 1,
    color: '#9f1239', // rose-800
    lineHeight: rs(20),
  },
  izoh: {
    marginTop: rs(6),
    fontFamily: rd.font.regular,
    fontStyle: 'italic',
    fontSize: style.fontSize.xx,
    color: rd.color.textSecondary,
    lineHeight: rs(18),
  },
});
