/**
 * NotSavedOffline — "ma'lumot yo'q" holati (24.10, oflayn rejim).
 *
 * Ilgari kesh bo'lmasa ro'yxat ekranlari "Mijozlar hali qo'shilmagan" / 0 qarz ko'rsatardi —
 * oflaynda bu YOLG'ON: ma'lumot bor, faqat qurilmada saqlanmagan. Endi aniq aytiladi:
 *   oflayn  -> "Bu ma'lumot oflayn saqlanmagan — internet tiklanganda yuklanadi"
 *   onlayn  -> "Ma'lumotni yuklab bo'lmadi" + "Qayta urinish"
 *
 * `PartialDataNote` — ma'lumot saqlangan ro'yxatdan HOSIL qilingan (`_derived`) bo'lsa kichik izoh.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { rd, rs } from '../../theme/rd';
import { InfoIcon, WarningIcon, WifiOffIcon } from '../../screens/home/redesign/icons';

type Props = {
  /** Oflaynmi (matn tanlash uchun). */
  offline: boolean;
  /** "Qayta urinish" — faqat onlayn holatda ko'rsatiladi. */
  onRetry?: () => void;
  /** Onlayn holatdagi sarlavha o'rniga (masalan "Qarz topilmadi"). */
  onlineTitle?: string;
  style?: ViewStyle;
};

export function NotSavedOffline({ offline, onRetry, onlineTitle, style }: Props) {
  const { t } = useTranslation();
  const fg = offline ? rd.color.warning : rd.color.error;
  return (
    <View style={[styles.box, style]} accessibilityRole="alert">
      <View style={[styles.circle, { backgroundColor: offline ? rd.color.warningBg : rd.color.errorBg }]}>
        {offline ? <WifiOffIcon size={rs(24)} color={fg} /> : <WarningIcon size={rs(24)} color={fg} />}
      </View>
      <Text style={styles.title}>
        {offline ? t('Bu ma’lumot oflayn saqlanmagan') : onlineTitle || t('Ma’lumotni yuklab bo‘lmadi')}
      </Text>
      {offline ? <Text style={styles.sub}>{t('Internet tiklanganda yuklanadi')}</Text> : null}
      {!offline && onRetry ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onRetry} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>{t('Qayta urinish')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Ma'lumot saqlangan ro'yxatdan hosil qilingan (to'liq emas) — kichik izoh qatori. */
export function PartialDataNote({ style }: { style?: ViewStyle }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.note, style]}>
      <InfoIcon size={rs(14)} color={rd.color.warning} />
      <Text style={styles.noteText}>{t('Qisman (saqlangan ro‘yxatdan)')}</Text>
    </View>
  );
}

/** Javob tanasi saqlangan ro'yxatdan hosil qilinganmi (projection `_derived: true` belgisi). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isDerivedBody = (body: any): boolean => !!(body?._derived || body?.data?._derived);

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: rs(8),
    marginHorizontal: rs(16),
    marginTop: rs(24),
    padding: rs(20),
    borderRadius: rd.radius.xl,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  circle: {
    width: rs(52),
    height: rs(52),
    borderRadius: rs(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(4),
  },
  title: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text, textAlign: 'center' },
  sub: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, textAlign: 'center' },
  btn: {
    marginTop: rs(6),
    paddingHorizontal: rs(18),
    paddingVertical: rs(9),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.primaryTint,
  },
  btnText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    alignSelf: 'flex-start',
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.warningBg,
  },
  noteText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.warning },
});

export default NotSavedOffline;
