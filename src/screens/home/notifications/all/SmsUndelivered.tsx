/**
 * SmsUndelivered.tsx (bildirishnoma, type = 49) — 30.10: qarz berilganda qarzdorga
 * SMS yetkazilmadi (real-time, tepadagi qo'ng'iroqcha).
 *
 * Tugmalar: «Qarzga o'tish» — ro'yxatga olingan qarz AMALIYOT TAFSILOTI; «Ok» — yopish.
 * Backend payload shakli o'zgarsa — faqat `parseSmsUndelivered` ni moslash kifoya.
 */
import React, { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { t } from 'i18next';
import Toast from 'react-native-toast-message';
import NotificationShell, { NotifButton } from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';
import { style } from '../../../../theme/style';
import { smsFailureText } from '../../modules/components/smsDeliveryFormat';
import { openCreationAmaliyot } from '../../modules/qarzAmaliyot';

export interface SmsUndeliveredInfo {
  /** ud_qarz_id = qarz_daftari id (contract NULL bo'ladi — ishlatilmaydi) (bo'lmasa null — "Qarzga o'tish" yashirinadi). */
  qarzId: number | string | null;
  /** failure_reason kodi (yo'q bo'lsa null — umumiy sabab). */
  reason: string | null;
  /** Qarzdor FISH (bo'lmasa bo'sh). */
  name: string;
}

const pick = (src: Record<string, any>, keys: string[]): any => {
  for (const k of keys) {
    const v = src?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
};

/** Bildirishnoma qatori (+ ixtiyoriy JSON `payload`/`data`) -> kerakli maydonlar. Hech qachon yiqilmaydi. */
export const parseSmsUndelivered = (item: any): SmsUndeliveredInfo => {
  const base: Record<string, any> = item && typeof item === 'object' ? item : {};
  let extra: Record<string, any> = {};
  const raw = base.payload ?? base.data;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') extra = parsed;
    } catch {
      extra = {};
    }
  } else if (raw && typeof raw === 'object') {
    extra = raw;
  }
  const src = { ...extra, ...base };
  const reason = pick(src, ['failure_reason', 'reason']);
  return {
    qarzId: pick(src, ['ud_qarz_id', 'qarz_id']),
    reason: reason === null ? null : String(reason),
    name: String(pick(src, ['ud_mijoz', 'mijoz_fish']) || '').trim(),
  };
};

const SmsUndelivered = ({ item, okay, navigation }: any) => {
  const info = parseSmsUndelivered(item);
  const [opening, setOpening] = React.useState(false);

  const goToDebt = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const ok = await openCreationAmaliyot(navigation, info.qarzId);
      if (!ok) Toast.show({ type: 'error2', props: { desc: t('Xatolik yuz berdi') } });
    } finally {
      setOpening(false);
    }
  };

  const why = smsFailureText(t as any, info.reason);

  return (
    <NotificationShell
      title={t('SMS xabar yetkazilmaganligi to‘g‘risida') as string}
      date={item?.created}
      time={item?.time}
      actions={
        <>
          {info.qarzId ? (
            <NotifButton label={t('Qarzga o‘tish') as string} onPress={goToDebt} loading={opening} />
          ) : null}
          <NotifButton label="Ok" variant="ghost" onPress={() => okay?.(item?.id, item?.type)} />
        </>
      }>
      <Text allowFontScaling={false} style={styles.body}>
        {info.name
          ? t('{{name}}ga qarz ro‘yxatga olinganligi haqidagi SMS xabar yetkazilmadi.', { name: info.name })
          : t('Qarz ro‘yxatga olinganligi haqidagi SMS xabar yetkazilmadi.')}
      </Text>
      <Text allowFontScaling={false} style={styles.reason}>
        {t('Sababi: {{reason}}', { reason: why })}
      </Text>
    </NotificationShell>
  );
};

export default memo(SmsUndelivered);

const styles = StyleSheet.create({
  body: {
    fontFamily: rd.font.medium,
    fontSize: style.fontSize.xx + 1,
    color: rd.color.text,
    lineHeight: rs(20),
  },
  reason: {
    marginTop: rs(6),
    fontFamily: rd.font.semibold,
    fontSize: style.fontSize.xx,
    color: rd.color.error,
    lineHeight: rs(19),
  },
});
