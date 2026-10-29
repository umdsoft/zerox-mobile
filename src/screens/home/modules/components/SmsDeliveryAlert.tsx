/**
 * SmsDeliveryAlert.tsx — "Oxirgi 7 kunda N ta SMS mijozga yetkazilmadi" ixcham ogohlantirish kartasi.
 * Web: frontend/components/qarz-daftari/SmsDeliveryAlert.vue (xuddi shu endpoint).
 * Bosilsa — "Yetkazilmagan SMS xabarlar" ekrani (QarzDaftariYetkazilmagan) ochiladi.
 *
 * Faqat count > 0 va ONLAYN bo'lsa ko'rinadi; so'rov yiqilsa — blok umuman ko'rinmaydi
 * (Qarz daftari hech qachon shu sabab buzilmaydi). Faqat son kerak — limit=1.
 */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isOnline, useIsOnline } from '../../../../offline/netStatus';
import { rd, rs } from '../../../../theme/rd';
import { ChevronRight, MessageIcon } from '../../redesign/icons';
import { fetchUndeliveredPage } from './smsDeliveryApi';
import { SMS_DAYS, SMS_SCREEN, smsScreenParams } from './smsDeliveryFormat';

interface Props {
  /** Tanlangan do'kon id (null — "Barcha do'konlar"). */
  shopId: number | null;
  /** Dashboard yangilanganda (fokus, qayta urinish, xodimdan chiqish) oshiriladi — son qayta o'qiladi. */
  refreshKey?: number;
  /** Sessiya konteksti (owner / xodim). O'zgarsa eski son tozalanadi. */
  sessionKey?: string;
}

const SmsDeliveryAlert = ({ shopId, refreshKey = 0, sessionKey = '' }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const online = useIsOnline();
  const [count, setCount] = React.useState(0);
  // So'rov tartib raqami: faqat oxirgi so'rov natijasi qo'llanadi (do'kon almashsa eski javob tashlanadi).
  const seq = React.useRef(0);

  // Sessiya (owner/xodim) almashsa — eski sessiyaning ma'lumoti DARHOL tashlanadi.
  React.useEffect(() => {
    seq.current += 1;
    setCount(0);
  }, [sessionKey]);

  React.useEffect(() => {
    seq.current += 1;
    const mySeq = seq.current;
    if (!isOnline()) {
      setCount(0);
      return;
    }
    fetchUndeliveredPage(1, shopId, 1)
      .then(data => {
        if (mySeq === seq.current) setCount(data.count);
      })
      .catch(() => {
        // xato — ogohlantirish ko'rsatilmaydi
        if (mySeq === seq.current) setCount(0);
      });
    return () => {
      seq.current += 1; // uchib yurgan javob tashlansin
    };
  }, [shopId, online, refreshKey, sessionKey]);

  if (count <= 0) return null;

  const title = t('Oxirgi {{days}} kunda {{count}} ta SMS mijozga yetkazilmadi', { days: SMS_DAYS, count });
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => navigation.navigate(SMS_SCREEN, smsScreenParams(shopId))}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View style={styles.accent} />
      <View style={styles.iconBox}>
        <MessageIcon size={rs(20)} color={rd.color.error} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>
          {t('Mijoz qarz haqidagi xabarni olmagan bo‘lishi mumkin — u bilan boshqa yo‘l orqali bog‘laning.')}
        </Text>
      </View>
      <ChevronRight size={rs(20)} color={rd.color.error} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    marginTop: rs(12),
    paddingVertical: rs(12),
    paddingLeft: rs(18),
    paddingRight: rs(12),
    backgroundColor: rd.color.errorBg,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: '#fecaca',
    overflow: 'hidden',
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: rs(5), backgroundColor: rd.color.error },
  iconBox: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  hint: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textSecondary, marginTop: rs(2) },
});

export default SmsDeliveryAlert;
