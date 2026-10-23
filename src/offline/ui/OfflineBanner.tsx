/**
 * OfflineBanner — Qarz daftari ekranlari tepasidagi holat qatori:
 *   oflayn  -> "Oflayn rejim — N ta amal navbatda" (sariq)
 *   sinxron -> "Sinxronlanmoqda…" (ko'k)
 *   xato    -> "N ta amal yuborilmadi — ko'rish" (qizil)
 *   navbat  -> "N ta amal navbatda" + "Yuborish"
 * Bosilsa — Sinxron sahifasi (QarzDaftariSinxron). Hammasi joyida bo'lsa — hech narsa ko'rinmaydi.
 */
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { rd, rs } from '../../theme/rd';
import { CheckCircleIcon, ChevronRight, ClockIcon, WarningIcon, WifiOffIcon } from '../../screens/home/redesign/icons';
import { useOfflineSummary } from '../hooks';
import { useIsOnline } from '../netStatus';
import { requestSync, startOfflineSync, useSyncStatus } from '../syncManager';

type Props = {
  style?: ViewStyle;
  /** Hammasi joyida bo'lsa ham ixcham "sinxronlangan" qatori (Sinxron sahifasiga kirish) — dashboard uchun. */
  persistent?: boolean;
};

export const SYNC_ROUTE = 'QarzDaftariSinxron';

export function OfflineBanner({ style, persistent }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const online = useIsOnline();
  const sync = useSyncStatus();
  const s = useOfflineSummary();

  useEffect(() => {
    startOfflineSync();
  }, []);

  const problems = s.failed + s.blocked;
  let tone: 'warn' | 'info' | 'error' | 'ok' | null = null;
  let title = '';
  let sub = '';
  if (!online) {
    tone = 'warn';
    title = t('Oflayn rejim');
    sub = s.queued
      ? t('{{n}} ta amal navbatda — internet tiklanganda yuboriladi', { n: s.queued })
      : t('Saqlangan ma’lumotlar ko‘rsatilmoqda');
  } else if (sync.running) {
    tone = 'info';
    title = t('Sinxronlanmoqda…');
    sub = s.queued ? t('{{n}} ta amal navbatda', { n: s.queued }) : '';
  } else if (problems) {
    tone = 'error';
    title = t('{{n}} ta amal yuborilmadi', { n: problems });
    sub = t('Ko‘rish va hal qilish');
  } else if (sync.authBlocked && s.queued) {
    tone = 'error';
    title = t('Sinxron to‘xtadi');
    sub = t('Iltimos, qayta kiring — amallar saqlangan');
  } else if (s.queued) {
    tone = 'info';
    title = t('{{n}} ta amal navbatda', { n: s.queued });
    sub = t('Bosing — hozir yuborish');
  } else if (persistent) {
    tone = 'ok';
    title = t('Barcha amallar sinxronlangan');
    sub = t('Oflayn rejim: internet o‘chsa ham savdo davom etadi');
  }
  if (!tone) return null;

  const palette =
    tone === 'warn'
      ? { bg: rd.color.warningBg, fg: rd.color.warning }
      : tone === 'error'
      ? { bg: rd.color.errorBg, fg: rd.color.error }
      : tone === 'ok'
      ? { bg: rd.color.successBg, fg: rd.color.success }
      : { bg: rd.color.primaryTint, fg: rd.color.primary };

  const onPress = () => {
    if (tone === 'info' && !sync.running && online && !problems) requestSync(true);
    navigation.navigate(SYNC_ROUTE);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.wrap, { backgroundColor: palette.bg }, style]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}>
      <View style={styles.icon}>
        {tone === 'warn' ? (
          <WifiOffIcon size={rs(18)} color={palette.fg} />
        ) : tone === 'ok' ? (
          <CheckCircleIcon size={rs(18)} color={palette.fg} />
        ) : tone === 'error' ? (
          <WarningIcon size={rs(18)} color={palette.fg} />
        ) : sync.running ? (
          <ActivityIndicator size="small" color={palette.fg} />
        ) : (
          <ClockIcon size={rs(18)} color={palette.fg} />
        )}
      </View>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: palette.fg }]} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={styles.sub} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={rs(16)} color={palette.fg} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    marginHorizontal: rs(16),
    marginTop: rs(6),
    marginBottom: rs(4),
    paddingHorizontal: rs(12),
    paddingVertical: rs(9),
    borderRadius: rd.radius.md,
  },
  icon: { width: rs(22), alignItems: 'center' },
  texts: { flex: 1 },
  title: { fontFamily: rd.font.semibold, fontSize: rs(13) },
  sub: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textSecondary, marginTop: rs(1) },
});

export default OfflineBanner;
