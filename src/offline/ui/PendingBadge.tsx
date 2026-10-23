/**
 * PendingBadge — ro'yxat/tafsilotdagi "Sinxronlanmagan" / "Xato" nishoni.
 * Proyeksiya qo'ygan `_offline` (amal holati) yoki `_pendingChange` maydonlaridan.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { rd, rs } from '../../theme/rd';
import { ClockIcon, WarningIcon } from '../../screens/home/redesign/icons';

export type BadgeKind = 'pending' | 'failed' | null;

/** Yozuvning oflayn holati: null — server bilan mos. */
export function offlineKindOf(item: unknown): BadgeKind {
  if (!item || typeof item !== 'object') return null;
  const o = item as { _offline?: unknown; _pendingChange?: unknown };
  if (o._offline === 'failed' || o._offline === 'blocked') return 'failed';
  if (o._offline === 'pending' || o._offline === 'syncing' || o._offline === true) return 'pending';
  if (o._pendingChange) return 'pending';
  return null;
}

type Props = {
  item?: unknown;
  kind?: BadgeKind;
  style?: ViewStyle;
};

export function PendingBadge({ item, kind, style }: Props) {
  const { t } = useTranslation();
  const k = kind !== undefined ? kind : offlineKindOf(item);
  if (!k) return null;
  const failed = k === 'failed';
  const color = failed ? rd.color.error : rd.color.warning;
  const label = failed ? t('Sinxron xatosi') : t('Sinxronlanmagan');
  return (
    <View
      style={[styles.chip, { backgroundColor: failed ? rd.color.errorBg : rd.color.warningBg }, style]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      {failed ? <WarningIcon size={rs(11)} color={color} /> : <ClockIcon size={rs(11)} color={color} />}
      <Text style={[styles.text, { color }]} numberOfLines={1} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: rs(4),
    paddingHorizontal: rs(7),
    paddingVertical: rs(2),
    borderRadius: rd.radius.pill,
  },
  text: {
    fontFamily: rd.font.semibold,
    fontSize: rs(10),
  },
});

export default PendingBadge;
