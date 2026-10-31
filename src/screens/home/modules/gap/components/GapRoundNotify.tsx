import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../gapDetailStyles';

interface InviteProps {
  r: Record<string, any>;
  /** inviteButtonState().asInvite: true -> "Taklif yuborish", false -> "To'lov haqida ogohlantirish". */
  asInvite: boolean;
  /** Shu davra uchun yuborish davom etmoqda (davra bo'yicha kuzatiladi). */
  sending: boolean;
  onInvite: (r: any) => void;
}

/**
 * Tugma MUDDATGA ham qaraydi (SS1 2026-09-18, SS-DEV 2026-09-24): muddat kelmagan + joy bor -> taklif;
 * aks holda to'lov haqida ogohlantirish. Ko'rinish sharti — gapDetailLogic.inviteButtonState.
 * ⚠️ Xabar NAVBATI KELGAN a'zoga yuborilmaydi (backend ta'minlaydi).
 */
export const GapRoundInvite = ({ r, asInvite, sending, onInvite }: InviteProps) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.inviteBtn, sending && { opacity: 0.6 }]}
      onPress={() => onInvite(r)}
      disabled={sending}
      activeOpacity={0.85}>
      <Text allowFontScaling={false} style={styles.inviteBtnText}>
        {sending ? 'Yuborilmoqda…' : asInvite ? t('📨 Taklif yuborish') : t('💳 To‘lov haqida ogohlantirish')}
      </Text>
    </TouchableOpacity>
  );
};

/** Boradi / Bora olmayman (Telegram javoblari) — kim boradi/bormaydi. */
export const GapAttendance = ({ attendance }: { attendance: { going?: string[]; not_going?: string[] } }) => {
  const going = attendance.going || [];
  const notGoing = attendance.not_going || [];
  return (
    <View style={styles.attWrap}>
      <View style={[styles.attBox, { backgroundColor: '#ECFDF5' }]}>
        <Text allowFontScaling={false} style={[styles.attTitle, { color: '#059669' }]}>✅ Boradi ({going.length})</Text>
        <Text allowFontScaling={false} style={styles.attNames}>{going.join(', ') || '—'}</Text>
      </View>
      <View style={[styles.attBox, { backgroundColor: '#FEF2F2' }]}>
        <Text allowFontScaling={false} style={[styles.attTitle, { color: '#DC2626' }]}>❌ Bora olmaydi ({notGoing.length})</Text>
        <Text allowFontScaling={false} style={styles.attNames}>{notGoing.join(', ') || '—'}</Text>
      </View>
    </View>
  );
};
