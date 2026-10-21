/**
 * FinanceFamilySections.tsx — "Oila moliyasi" ekranining ko'rinish bloklari (21.10 redizayn).
 *
 *   FamilySectionCard — bo'lim kartasi: aksent chiziq, ikonka, sarlavha + "i" tugma,
 *                       izoh, a'zolar soni, a'zolar ro'yxati YOKI bo'sh holat (izoh + CTA).
 *   FamilyMemberRow   — a'zo qatori: initsial avatar, ism, holat chipi (Faol/Kutilmoqda), amallar.
 *   FamilyInfoSheet   — "i" bosilganda pastdan chiqadigan tushuntirish oynasi.
 *
 * Faqat taqdimot — ma'lumot/amallar FinanceFamily.tsx da qoladi.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { CheckIcon, IconProps, InfoIcon, PlusIcon } from '../redesign/icons';

type IconCmp = (p: IconProps) => React.ReactElement;

const HIT = { top: 10, bottom: 10, left: 10, right: 10 };

export const familyInitials = (name?: string): string =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';

// ── Bo'lim kartasi ──────────────────────────────────────────────────────────
type SectionProps = {
  accent: string;
  tint: string;
  Icon: IconCmp;
  title: string;
  caption: string;
  count: number;
  onInfo: () => void;
  emptyTitle: string;
  emptyHint: string;
  ctaLabel: string;
  onCta: () => void;
  children?: React.ReactNode;
};

export const FamilySectionCard = ({
  accent,
  tint,
  Icon,
  title,
  caption,
  count,
  onInfo,
  emptyTitle,
  emptyHint,
  ctaLabel,
  onCta,
  children,
}: SectionProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={styles.head}>
        <View style={[styles.headIcon, { backgroundColor: tint }]}>
          <Icon size={rs(20)} color={accent} />
        </View>
        <View style={styles.headText}>
          <View style={styles.titleRow}>
            <Text allowFontScaling={false} style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onInfo}
              hitSlop={HIT}
              style={styles.infoBtn}
              accessibilityRole="button"
              accessibilityLabel={t('Bu bo‘lim haqida')}>
              <InfoIcon size={rs(17)} color={rd.color.textTertiary} />
            </TouchableOpacity>
          </View>
          <Text allowFontScaling={false} style={styles.caption} numberOfLines={1}>
            {caption}
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: tint }]}>
          <Text allowFontScaling={false} style={[styles.countText, { color: accent }]}>
            {count}
          </Text>
        </View>
      </View>

      {count === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: tint }]}>
            <Icon size={rs(22)} color={accent} />
          </View>
          <Text allowFontScaling={false} style={styles.emptyTitle}>
            {emptyTitle}
          </Text>
          <Text allowFontScaling={false} style={styles.emptyHint}>
            {emptyHint}
          </Text>
          <TouchableOpacity
            onPress={onCta}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: tint }]}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}>
            <PlusIcon size={rs(15)} color={accent} />
            <Text allowFontScaling={false} style={[styles.ctaText, { color: accent }]}>
              {ctaLabel}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.rows}>{children}</View>
      )}
    </View>
  );
};

// ── A'zo qatori ─────────────────────────────────────────────────────────────
type RowProps = {
  name: string;
  sub: string;
  accent: string;
  tint: string;
  isPending: boolean;
  isFirst: boolean;
  onPress?: () => void;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
};

export const FamilyMemberRow = ({
  name,
  sub,
  accent,
  tint,
  isPending,
  isFirst,
  onPress,
  actions,
  footer,
}: RowProps) => {
  const { t } = useTranslation();
  const body = (
    <View style={styles.rowTop}>
      <View style={[styles.avatar, { backgroundColor: tint }]}>
        <Text allowFontScaling={false} style={[styles.avatarText, { color: accent }]}>
          {familyInitials(name)}
        </Text>
      </View>
      <View style={styles.rowText}>
        <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.subRow}>
          <View style={[styles.chip, isPending ? styles.chipPending : styles.chipActive]}>
            <View style={[styles.chipDot, { backgroundColor: isPending ? rd.color.warning : rd.color.success }]} />
            <Text
              allowFontScaling={false}
              style={[styles.chipText, { color: isPending ? rd.color.warning : rd.color.success }]}>
              {isPending ? t('Kutilmoqda') : t('Faol')}
            </Text>
          </View>
          <Text allowFontScaling={false} style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
  return (
    <View style={[styles.row, !isFirst && styles.rowDivider]}>
      {onPress ? (
        <TouchableOpacity activeOpacity={0.75} onPress={onPress} accessibilityRole="button" accessibilityLabel={name}>
          {body}
        </TouchableOpacity>
      ) : (
        body
      )}
      {footer}
    </View>
  );
};

// Qator ichidagi kichik dumaloq amal tugmasi (tahrirlash / o'chirish / ochish).
export const FamilyRowAction = ({
  onPress,
  bg,
  label,
  children,
}: {
  onPress: () => void;
  bg: string;
  label: string;
  children: React.ReactNode;
}) => (
  <TouchableOpacity
    onPress={onPress}
    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    style={[styles.actBtn, { backgroundColor: bg }]}
    accessibilityRole="button"
    accessibilityLabel={label}>
    {children}
  </TouchableOpacity>
);

// ── Tushuntirish oynasi ─────────────────────────────────────────────────────
export type FamilyInfo = {
  accent: string;
  tint: string;
  Icon: IconCmp;
  title: string;
  lead: string;
  points: string[];
};

export const FamilyInfoSheet = ({ info, onClose }: { info: FamilyInfo | null; onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <Modal visible={!!info} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {info ? (
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <View style={styles.sheetHead}>
              <View style={[styles.sheetIcon, { backgroundColor: info.tint }]}>
                <info.Icon size={rs(22)} color={info.accent} />
              </View>
              <Text allowFontScaling={false} style={styles.sheetTitle}>
                {info.title}
              </Text>
            </View>
            <Text allowFontScaling={false} style={styles.sheetLead}>
              {info.lead}
            </Text>
            {info.points.map(p => (
              <View key={p} style={styles.point}>
                <View style={[styles.pointIcon, { backgroundColor: info.tint }]}>
                  <CheckIcon size={rs(12)} color={info.accent} strokeWidth={3} />
                </View>
                <Text allowFontScaling={false} style={styles.pointText}>
                  {p}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.okBtn, { backgroundColor: info.accent }]}
              activeOpacity={0.85}
              onPress={onClose}>
              <Text allowFontScaling={false} style={styles.okText}>
                {t('Tushundim')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(14),
    paddingLeft: rs(16),
    paddingRight: rs(14),
    marginBottom: rs(14),
    overflow: 'hidden',
  },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: rs(4) },
  head: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  headIcon: { width: rs(42), height: rs(42), borderRadius: rs(13), alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  title: { flexShrink: 1, fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  infoBtn: { padding: rs(1) },
  caption: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  countBadge: {
    minWidth: rs(30),
    height: rs(26),
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: rd.font.bold, fontSize: rs(13) },

  empty: {
    alignItems: 'center',
    marginTop: rs(14),
    paddingVertical: rs(18),
    paddingHorizontal: rs(14),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
  },
  emptyIcon: { width: rs(46), height: rs(46), borderRadius: rs(23), alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text, marginTop: rs(10) },
  emptyHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    lineHeight: rs(17),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(4),
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(12),
    paddingHorizontal: rs(16),
    height: rs(36),
    borderRadius: rd.radius.pill,
  },
  ctaText: { fontFamily: rd.font.semibold, fontSize: rs(12.5) },

  rows: { marginTop: rs(8) },
  row: { paddingVertical: rs(10) },
  rowDivider: { borderTopWidth: 1, borderTopColor: rd.color.border },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatar: { width: rs(40), height: rs(40), borderRadius: rs(20), alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: rd.font.bold, fontSize: rs(13.5) },
  rowText: { flex: 1 },
  name: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(4) },
  sub: { flexShrink: 1, fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingHorizontal: rs(7),
    paddingVertical: rs(2),
    borderRadius: rd.radius.pill,
  },
  chipActive: { backgroundColor: rd.color.successBg },
  chipPending: { backgroundColor: rd.color.warningBg },
  chipDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  chipText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  actions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  actBtn: { width: rs(32), height: rs(32), borderRadius: rs(16), alignItems: 'center', justifyContent: 'center' },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: rd.color.surface,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    paddingHorizontal: rs(20),
    paddingTop: rs(10),
    paddingBottom: rs(28),
  },
  grabber: {
    alignSelf: 'center',
    width: rs(40),
    height: rs(4),
    borderRadius: rs(2),
    backgroundColor: rd.color.border,
    marginBottom: rs(16),
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  sheetIcon: { width: rs(44), height: rs(44), borderRadius: rs(14), alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  sheetLead: {
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    lineHeight: rs(20),
    color: rd.color.textSecondary,
    marginTop: rs(14),
    marginBottom: rs(6),
  },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), marginTop: rs(10) },
  pointIcon: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(1),
  },
  pointText: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(13), lineHeight: rs(19), color: rd.color.text },
  okBtn: { height: rs(50), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center', marginTop: rs(22) },
  okText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.onPrimary },
});
