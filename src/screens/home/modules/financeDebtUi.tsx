/**
 * financeDebtUi.tsx — "Shaxsiy qarz" ro'yxat / hisobot sahifalarining UMUMIY UI bo'laklari.
 *
 * 02.10 (mobil hujjat, 3/10b/11-band): sayt sahifalari (pages/finance/debts/list/_kind.vue,
 * report/_side.vue) tarkibi mobilda — FinanceDebtList va FinanceDebtReport ikkalasi ham
 * shu bo'laklardan foydalanadi (nusxa saqlanmaydi):
 *   - DebtToolbar   — qidiruv (FISh / telefon / summa) + "Yuklash" (CSV) + "N ta qarz";
 *   - DebtSvodCards — svod: Jami berilgan (olingan) / Qaytarilgan / Jarayonda (qoldiq)
 *                     yoki yakunlangan hisobotda "Voz kechilgan" (sayt DebtSummaryCards);
 *   - FilterChips   — holat / valyuta tablari (nuqta + son);
 *   - ShowMoreButton — "Yana ko'rsatish (N)".
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import { ArrowDown, ArrowDownLeft, ArrowUpRight, CheckIcon, ClockIcon, CloseIcon, SearchIcon } from '../redesign/icons';
import { fMoney } from './financeMoney';
import { DebtSide, DebtSvod, SvodRow } from './financeDebtGroups';

// SearchDebitor "Yuklash" tugmasi bilan bir xil yashil (Excel/CSV).
const EXPORT_GREEN = '#16a34a';
const ROSE = '#be123c';
const ROSE_BG = '#ffe4e6';
const AMBER = '#b45309';
const AMBER_BG = '#fef3c7';

// ───────────────────────── Qidiruv + Yuklash ─────────────────────────

export const DebtToolbar = ({
  search,
  onSearch,
  onDownload,
  count,
  disabled,
}: {
  search: string;
  onSearch: (v: string) => void;
  onDownload: () => void;
  count: number;
  disabled?: boolean;
}) => {
  const { t } = useTranslation();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={styles.toolbar}>
      <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
        <SearchIcon size={rs(17)} color={rd.color.textTertiary} />
        <TextInput
          allowFontScaling={false}
          value={search}
          onChangeText={onSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t('FISh, telefon yoki summa bo‘yicha qidirish...')}
          placeholderTextColor={rd.color.textTertiary}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity
            onPress={() => onSearch('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('Tozalash')}>
            <CloseIcon size={rs(16)} color={rd.color.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.toolbarRow}>
        <View style={styles.countPill}>
          <Text allowFontScaling={false} style={styles.countPillText}>
            {t('{{n}} ta qarz', { n: count })}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDownload}
          disabled={disabled}
          accessibilityRole="button"
          style={[styles.downloadBtn, disabled && styles.downloadBtnDisabled]}>
          <ArrowDown size={rs(15)} color={rd.color.onPrimary} />
          <Text allowFontScaling={false} style={styles.downloadText}>
            {t('Yuklash')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ───────────────────────── Svod kartalari ─────────────────────────

const pct = (r: SvodRow) =>
  r.total > 0 ? Math.min(100, Math.max(0, Math.round((r.paid / r.total) * 100))) : 0;

const SvodTile = ({
  icon,
  iconBg,
  label,
  children,
  foot,
  wide,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  children: React.ReactNode;
  foot: string;
  wide?: boolean;
}) => (
  <View style={[styles.tile, wide ? styles.tileWide : styles.tileHalf]}>
    <View style={styles.tileHead}>
      <View style={[styles.tileIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text allowFontScaling={false} style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
    {children}
    <Text allowFontScaling={false} style={styles.tileFoot}>
      {foot}
    </Text>
  </View>
);

/**
 * Sayt DebtSummaryCards: 1) Jami berilgan (olingan) — keng karta; 2) Qaytarilgan
 * (progress bilan); 3) Jarayonda (qoldiq) yoki `closedOnly` da Voz kechilgan.
 * Valyutalar ALOHIDA qatorlarda (hech qachon qo'shilmaydi).
 */
export const DebtSvodCards = ({
  svod,
  side,
  closedOnly,
}: {
  svod: DebtSvod;
  side: DebtSide;
  closedOnly?: boolean;
}) => {
  const { t } = useTranslation();
  const lent = side === 'lent';
  const tone = lent
    ? { fg: rd.color.primary, bg: rd.color.primaryTint }
    : { fg: rd.color.error, bg: rd.color.errorBg };
  const forgivenRows = svod.rows.filter(r => r.forgiven > 0.5);
  const DirIcon = lent ? ArrowUpRight : ArrowDownLeft;
  return (
    <View style={styles.svodGrid}>
      <SvodTile
        wide
        icon={<DirIcon size={rs(16)} color={tone.fg} />}
        iconBg={tone.bg}
        label={lent ? t('Jami berilgan') : t('Jami olingan')}
        foot={t('{{n}} ta qarz', { n: svod.count })}>
        {svod.rows.map(r => (
          <Text key={`t${r.currency}`} allowFontScaling={false} style={styles.tileAmountBig} numberOfLines={1} adjustsFontSizeToFit>
            {fMoney(r.total, r.currency)}
          </Text>
        ))}
        {!closedOnly &&
          forgivenRows.map(r => (
            <Text key={`f${r.currency}`} allowFontScaling={false} style={styles.tileForgiven}>
              {t('Voz kechilgan')}: {fMoney(r.forgiven, r.currency)}
            </Text>
          ))}
      </SvodTile>

      <SvodTile
        icon={<CheckIcon size={rs(15)} color={rd.color.success} />}
        iconBg={rd.color.successBg}
        label={t('Qaytarilgan')}
        foot={t('{{n}} ta yopilgan', { n: svod.closedCount })}>
        {svod.rows.map(r => (
          <View key={`p${r.currency}`} style={styles.paidRow}>
            <Text allowFontScaling={false} style={[styles.tileAmount, { color: rd.color.success }]} numberOfLines={1} adjustsFontSizeToFit>
              {fMoney(r.paid, r.currency)}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct(r)}%` }]} />
            </View>
          </View>
        ))}
      </SvodTile>

      {closedOnly ? (
        <SvodTile
          icon={<CloseIcon size={rs(15)} color={ROSE} />}
          iconBg={ROSE_BG}
          label={t('Voz kechilgan')}
          foot={t('{{n}} ta qarz', { n: svod.forgivenCount })}>
          {svod.rows.map(r => (
            <Text key={`z${r.currency}`} allowFontScaling={false} style={[styles.tileAmount, { color: ROSE }]} numberOfLines={1} adjustsFontSizeToFit>
              {fMoney(r.forgiven, r.currency)}
            </Text>
          ))}
        </SvodTile>
      ) : (
        <SvodTile
          icon={<ClockIcon size={rs(15)} color={AMBER} />}
          iconBg={AMBER_BG}
          label={t('Jarayonda (qoldiq)')}
          foot={t('{{n}} ta faol', { n: svod.openCount })}>
          {svod.rows.map(r => (
            <Text key={`l${r.currency}`} allowFontScaling={false} style={[styles.tileAmount, { color: tone.fg }]} numberOfLines={1} adjustsFontSizeToFit>
              {fMoney(r.left, r.currency)}
            </Text>
          ))}
        </SvodTile>
      )}
    </View>
  );
};

// ───────────────────────── Tablar (holat / valyuta) ─────────────────────────

export type ChipDef = { key: string; label: string; count: number; dot: string; soft: string; fg: string };

export const FilterChips = ({
  chips,
  active,
  onChange,
}: {
  chips: ChipDef[];
  active: string;
  onChange: (k: string) => void;
}) => (
  <View style={styles.chips}>
    {chips.map(c => {
      const on = c.key === active;
      return (
        <TouchableOpacity
          key={c.key}
          activeOpacity={0.85}
          onPress={() => onChange(c.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: on }}
          style={[styles.chip, on ? { backgroundColor: c.soft, borderColor: c.soft } : null]}>
          <View style={[styles.chipDot, { backgroundColor: c.dot }]} />
          <Text allowFontScaling={false} style={[styles.chipText, on ? { color: c.fg } : null]}>
            {c.label}
          </Text>
          <View style={[styles.chipCount, { backgroundColor: on ? c.dot : c.soft }]}>
            <Text allowFontScaling={false} style={[styles.chipCountText, { color: on ? '#fff' : c.fg }]}>
              {c.count}
            </Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ───────────────────────── "Yana ko'rsatish" ─────────────────────────

export const ShowMoreButton = ({ rest, onPress }: { rest: number; onPress: () => void }) => {
  const { t } = useTranslation();
  if (rest <= 0) return null;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.moreBtn} accessibilityRole="button">
      <Text allowFontScaling={false} style={styles.moreText}>
        {t('Yana ko‘rsatish')} ({rest})
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toolbar: { gap: rs(10), marginBottom: rs(14) },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.pill,
    height: rs(48),
    paddingHorizontal: rs(16),
  },
  searchBoxFocused: { borderColor: rd.color.primary },
  searchInput: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.text,
    paddingVertical: 0,
  },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countPill: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
  },
  countPillText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    height: rs(40),
    paddingHorizontal: rs(16),
    borderRadius: rd.radius.pill,
    backgroundColor: EXPORT_GREEN,
  },
  downloadBtnDisabled: { opacity: 0.5 },
  downloadText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.onPrimary },

  svodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginBottom: rs(16) },
  tile: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  tileWide: { width: '100%' },
  tileHalf: { width: '48%', flexGrow: 1 },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(8) },
  tileIcon: { width: rs(30), height: rs(30), borderRadius: rs(9), alignItems: 'center', justifyContent: 'center' },
  tileLabel: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary },
  tileAmountBig: { fontFamily: rd.font.bold, fontSize: rs(18), color: rd.color.text, lineHeight: rs(24) },
  tileAmount: { fontFamily: rd.font.bold, fontSize: rs(14), lineHeight: rs(20) },
  tileForgiven: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: ROSE, marginTop: rs(2) },
  tileFoot: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(6) },
  paidRow: { marginBottom: rs(4) },
  barTrack: { height: rs(6), borderRadius: rs(3), backgroundColor: rd.color.surfaceAlt, marginTop: rs(4), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: rs(3), backgroundColor: '#22c55e' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginBottom: rs(14) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(12),
    height: rs(36),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  chipDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  chipText: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  chipCount: { minWidth: rs(20), height: rs(20), paddingHorizontal: rs(6), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  chipCountText: { fontFamily: rd.font.bold, fontSize: rs(11) },

  moreBtn: {
    alignSelf: 'center',
    marginTop: rs(4),
    paddingHorizontal: rs(20),
    paddingVertical: rs(10),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  moreText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary },
});
