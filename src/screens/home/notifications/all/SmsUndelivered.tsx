/**
 * SmsUndelivered.tsx (bildirishnoma, type = 49) — 30.10: qarz berilganda qarzdorga
 * SMS yetkazilmadi (real-time, tepadagi qo'ng'iroqcha).
 *
 * Tugmalar: «Qarzga o'tish» — ro'yxatga olingan qarz AMALIYOT TAFSILOTI (o'tgach bildirishnoma o'chadi);
 * «Qayta yuborish» (01.11, ilgari «Ok») — SMS qayta yuboriladi, bildirishnoma o'chadi va shu qarz sahifasiga o'tiladi.
 * Backend payload shakli o'zgarsa — faqat `parseSmsUndelivered` ni moslash kifoya.
 */
import React, { memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text } from 'react-native';
import { t } from 'i18next';
import Toast from 'react-native-toast-message';
import NotificationShell, { NotifButton } from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';
import { style } from '../../../../theme/style';
import { smsFailureText } from '../../modules/components/smsDeliveryFormat';
import { openCreationAmaliyot } from '../../modules/qarzAmaliyot';

export interface SmsUndeliveredInfo {
  /** ud_qarz_id = qarz_daftari id (contract NULL bo'ladi — ishlatilmaydi). Bo'lmasa null: «Qarzga o'tish» kartani o'chirib "Qarz topilmadi" deydi. */
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

const SmsUndelivered = ({ item, onSeen, onResend }: any) => {
  const navigation = useNavigation<any>();
  const info = parseSmsUndelivered(item);
  const [opening, setOpening] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  // Ikkala tugma uchun yagona sinxron qo'riqchi: bir kadrdagi ikki bosish state yangilanishidan oldin ham to'xtatiladi.
  const busyRef = React.useRef(false);
  // Karta ro'yxatdan olinganda komponent unmount bo'ladi — setState faqat mounted bo'lsa.
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const showError = (desc: string) => Toast.show({ type: 'error2', props: { desc } });

  const goToDebt = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setOpening(true);
    try {
      if (!info.qarzId) {
        // Qarz id yo'q — ochadigan joy yo'q: kartani serverdan ham o'chiramiz va aytamiz.
        onSeen?.(item?.id);
        showError(t('Qarz topilmadi') as string);
        return;
      }
      const ok = await openCreationAmaliyot(navigation, info.qarzId);
      if (!ok) showError(t('Xatolik yuz berdi') as string);
      // Keyingi sahifa ochildi — bildirishnomani ro'yxatdan olib tashlaymiz (PUT /ok fonda, navigatsiyani bloklamaydi).
      else onSeen?.(item?.id);
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setOpening(false);
    }
  };

  const resend = async () => {
    if (busyRef.current || !onResend) return;
    busyRef.current = true;
    setResending(true);
    try {
      const res = await onResend(item?.id);
      // Yuborildi (yoki yana yetkazilmadi — eskisi serverda o'chdi): o'sha qarz sahifasiga o'tamiz,
      // lekin foydalanuvchi ekrandan chiqib ketgan bo'lsa — majburlab olib kelmaymiz.
      if (res?.ok && res.data === 'done' && info.qarzId && navigation.isFocused?.() !== false) {
        const opened = await openCreationAmaliyot(navigation, info.qarzId);
        if (!opened) showError(t('Xatolik yuz berdi') as string);
      }
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setResending(false);
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
          <NotifButton label={t('Qarzga o‘tish') as string} onPress={goToDebt} loading={opening} disabled={resending} />
          <NotifButton label={t('Qayta yuborish') as string} variant="ghost" onPress={resend} loading={resending} disabled={opening} />
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
